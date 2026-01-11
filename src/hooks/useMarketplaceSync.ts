import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export type SyncOperation = 'test' | 'fetch' | 'push' | 'sync';

export interface SyncResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface ShopConnection {
  id: string;
  shop_name: string;
  platform: string;
  shop_icon: string;
  shop_color: string;
  is_connected: boolean;
  last_sync_at: string | null;
  api_credentials: Record<string, any>;
}

export const useMarketplaceSync = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getSyncFunctionName = (platform: string): string => {
    const platformMap: Record<string, string> = {
      etsy: 'marketplace-sync',
      trendyol: 'trendyol-sync',
      hepsiburada: 'hepsiburada-sync',
      amazon: 'amazon-sync',
      shopify: 'marketplace-sync',
      ikas: 'ikas-sync',
      n11: 'n11-sync',
      ciceksepeti: 'ciceksepeti-sync',
    };
    return platformMap[platform.toLowerCase()] || 'marketplace-sync';
  };

  const testConnection = useCallback(async (connection: ShopConnection): Promise<SyncResult> => {
    setIsLoading(true);
    setSyncStatus(prev => ({ ...prev, [connection.id]: 'testing' }));

    try {
      const functionName = getSyncFunctionName(connection.platform);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'test',
          connectionId: connection.id,
          platform: connection.platform,
        },
      });

      if (error) throw error;

      setSyncStatus(prev => ({ ...prev, [connection.id]: 'connected' }));
      toast({
        title: "Connection Successful",
        description: `${connection.shop_name} is connected and ready.`,
      });

      return { success: true, message: 'Connection test successful', data };
    } catch (error: any) {
      setSyncStatus(prev => ({ ...prev, [connection.id]: 'error' }));
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to marketplace",
        variant: "destructive",
      });
      return { success: false, message: 'Connection test failed', error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchProducts = useCallback(async (connection: ShopConnection): Promise<SyncResult> => {
    setIsLoading(true);
    setSyncStatus(prev => ({ ...prev, [connection.id]: 'fetching' }));

    try {
      const functionName = getSyncFunctionName(connection.platform);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'fetch',
          connectionId: connection.id,
          platform: connection.platform,
        },
      });

      if (error) throw error;

      // Update last_sync_at
      await supabase
        .from('shop_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', connection.id);

      setSyncStatus(prev => ({ ...prev, [connection.id]: 'synced' }));
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing-counts'] });

      toast({
        title: "Products Fetched",
        description: `Successfully fetched products from ${connection.shop_name}.`,
      });

      return { success: true, message: 'Products fetched successfully', data };
    } catch (error: any) {
      setSyncStatus(prev => ({ ...prev, [connection.id]: 'error' }));
      toast({
        title: "Fetch Failed",
        description: error.message || "Failed to fetch products",
        variant: "destructive",
      });
      return { success: false, message: 'Fetch failed', error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [toast, queryClient]);

  const pushProducts = useCallback(async (
    connection: ShopConnection, 
    listingIds: string[]
  ): Promise<SyncResult> => {
    setIsLoading(true);
    setSyncStatus(prev => ({ ...prev, [connection.id]: 'pushing' }));

    try {
      const functionName = getSyncFunctionName(connection.platform);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'push',
          connectionId: connection.id,
          platform: connection.platform,
          listingIds,
        },
      });

      if (error) throw error;

      setSyncStatus(prev => ({ ...prev, [connection.id]: 'synced' }));
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });

      toast({
        title: "Products Pushed",
        description: `Successfully pushed ${listingIds.length} product(s) to ${connection.shop_name}.`,
      });

      return { success: true, message: 'Products pushed successfully', data };
    } catch (error: any) {
      setSyncStatus(prev => ({ ...prev, [connection.id]: 'error' }));
      toast({
        title: "Push Failed",
        description: error.message || "Failed to push products",
        variant: "destructive",
      });
      return { success: false, message: 'Push failed', error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [toast, queryClient]);

  const syncBidirectional = useCallback(async (connection: ShopConnection): Promise<SyncResult> => {
    setIsLoading(true);
    setSyncStatus(prev => ({ ...prev, [connection.id]: 'syncing' }));

    try {
      const functionName = getSyncFunctionName(connection.platform);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'sync',
          connectionId: connection.id,
          platform: connection.platform,
        },
      });

      if (error) throw error;

      // Update last_sync_at
      await supabase
        .from('shop_connections')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', connection.id);

      setSyncStatus(prev => ({ ...prev, [connection.id]: 'synced' }));
      queryClient.invalidateQueries({ queryKey: ['marketplace-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing-counts'] });

      toast({
        title: "Sync Complete",
        description: `Successfully synced ${connection.shop_name}.`,
      });

      return { success: true, message: 'Sync completed successfully', data };
    } catch (error: any) {
      setSyncStatus(prev => ({ ...prev, [connection.id]: 'error' }));
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync",
        variant: "destructive",
      });
      return { success: false, message: 'Sync failed', error: error.message };
    } finally {
      setIsLoading(false);
    }
  }, [toast, queryClient]);

  return {
    isLoading,
    syncStatus,
    testConnection,
    fetchProducts,
    pushProducts,
    syncBidirectional,
  };
};
