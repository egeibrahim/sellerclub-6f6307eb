import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface StockSyncLog {
  id: string;
  user_id: string;
  master_listing_id: string;
  source_marketplace: string;
  target_marketplace: string;
  previous_stock: number;
  new_stock: number;
  sync_status: string;
  error_message: string | null;
  created_at: string;
}

export function useStockSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const syncStock = useMutation({
    mutationFn: async ({ 
      masterListingId, 
      newStock, 
      sourceMarketplace 
    }: { 
      masterListingId: string; 
      newStock: number; 
      sourceMarketplace: string;
    }) => {
      // Get all marketplace products for this master listing
      const { data: marketplaceProducts, error: fetchError } = await supabase
        .from('marketplace_products')
        .select('*, marketplace_connections(*)')
        .eq('master_listing_id', masterListingId);

      if (fetchError) throw fetchError;

      const results: StockSyncLog[] = [];

      for (const product of marketplaceProducts || []) {
        const connection = product.marketplace_connections as any;
        if (!connection || !connection.is_active) continue;

        const marketplace = connection.marketplace as string;
        if (marketplace === sourceMarketplace) continue;

        const specificData = product.marketplace_specific_data as Record<string, any> || {};
        const previousStock = specificData.stock || 0;

        try {
          // Call the appropriate sync function to update stock
          const functionName = `${marketplace}-sync`;
          const { error: syncError } = await supabase.functions.invoke(functionName, {
            body: {
              action: 'update_product',
              connectionId: connection.id,
              productId: product.remote_product_id,
              updates: { stock: newStock },
            },
          });

          if (syncError) throw syncError;

          // Update local marketplace product
          const currentData = (product.marketplace_specific_data || {}) as Record<string, any>;
          await supabase
            .from('marketplace_products')
            .update({
              marketplace_specific_data: {
                ...currentData,
                stock: newStock,
              },
              last_synced_at: new Date().toISOString(),
              sync_status: 'synced',
            })
            .eq('id', product.id);

          // Log the sync
          const { data: logData } = await supabase
            .from('stock_sync_logs')
            .insert({
              user_id: user!.id,
              master_listing_id: masterListingId,
              source_marketplace: sourceMarketplace,
              target_marketplace: marketplace,
              previous_stock: previousStock,
              new_stock: newStock,
              sync_status: 'success',
            })
            .select()
            .single();

          if (logData) results.push(logData as StockSyncLog);
        } catch (error: any) {
          // Log the failed sync
          const { data: logData } = await supabase
            .from('stock_sync_logs')
            .insert({
              user_id: user!.id,
              master_listing_id: masterListingId,
              source_marketplace: sourceMarketplace,
              target_marketplace: marketplace,
              previous_stock: previousStock,
              new_stock: newStock,
              sync_status: 'failed',
              error_message: error.message,
            })
            .select()
            .single();

          if (logData) results.push(logData as StockSyncLog);
        }
      }

      // Update master listing total stock
      await supabase
        .from('master_listings')
        .update({ total_stock: newStock })
        .eq('id', masterListingId);

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['master-listings'] });
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
      
      const successCount = results.filter(r => r.sync_status === 'success').length;
      const failCount = results.filter(r => r.sync_status === 'failed').length;

      if (failCount === 0) {
        toast({ title: `Stok ${successCount} pazaryerine senkronize edildi` });
      } else {
        toast({ 
          title: "Stok senkronizasyonu kısmen başarılı", 
          description: `${successCount} başarılı, ${failCount} başarısız`,
          variant: "destructive" 
        });
      }
    },
    onError: (error) => {
      toast({ title: "Stok senkronizasyonu başarısız", description: error.message, variant: "destructive" });
    },
  });

  const bulkSyncStock = useMutation({
    mutationFn: async (items: { masterListingId: string; newStock: number; sourceMarketplace: string }[]) => {
      const allResults: StockSyncLog[] = [];
      
      for (const item of items) {
        const results = await syncStock.mutateAsync(item);
        allResults.push(...results);
      }

      return allResults;
    },
  });

  return {
    syncStock,
    bulkSyncStock,
  };
}
