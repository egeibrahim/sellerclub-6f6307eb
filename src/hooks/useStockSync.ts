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
      // Get all marketplace listings for this master product
      const { data: marketplaceListings, error: fetchError } = await supabase
        .from('marketplace_listings')
        .select('*, shop_connections(*)')
        .eq('master_product_id', masterListingId);

      if (fetchError) throw fetchError;

      const results: StockSyncLog[] = [];

      for (const listing of marketplaceListings || []) {
        const connection = listing.shop_connections as any;
        if (!connection || !connection.is_connected) continue;

        const platform = listing.platform;
        if (platform === sourceMarketplace) continue;

        const marketplaceData = listing.marketplace_data as Record<string, any> || {};
        const previousStock = marketplaceData.stock || 0;

        try {
          // Call the appropriate sync function
          const functionName = `${platform}-sync`;
          const { error: syncError } = await supabase.functions.invoke(functionName, {
            body: {
              action: 'update_product',
              connectionId: connection.id,
              productId: listing.external_id,
              updates: { stock: newStock },
            },
          });

          if (syncError) throw syncError;

          // Update local marketplace listing
          await supabase
            .from('marketplace_listings')
            .update({
              marketplace_data: {
                ...marketplaceData,
                stock: newStock,
              },
              last_sync_at: new Date().toISOString(),
              sync_status: 'synced',
            })
            .eq('id', listing.id);

          results.push({
            id: `log-${Date.now()}`,
            user_id: user!.id,
            master_listing_id: masterListingId,
            source_marketplace: sourceMarketplace,
            target_marketplace: platform,
            previous_stock: previousStock,
            new_stock: newStock,
            sync_status: 'success',
            error_message: null,
            created_at: new Date().toISOString(),
          });
        } catch (error: any) {
          results.push({
            id: `log-${Date.now()}`,
            user_id: user!.id,
            master_listing_id: masterListingId,
            source_marketplace: sourceMarketplace,
            target_marketplace: platform,
            previous_stock: previousStock,
            new_stock: newStock,
            sync_status: 'failed',
            error_message: error.message,
            created_at: new Date().toISOString(),
          });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['master-listings'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      const successCount = results.filter(r => r.sync_status === 'success').length;
      const failCount = results.filter(r => r.sync_status === 'failed').length;

      if (failCount === 0 && successCount > 0) {
        toast({ title: `Stok ${successCount} pazaryerine senkronize edildi` });
      } else if (failCount > 0) {
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