import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEffect } from "react";

export interface LowStockAlert {
  id: string;
  user_id: string;
  master_listing_id: string;
  variant_id: string | null;
  product_title: string;
  variant_name: string | null;
  current_stock: number;
  threshold: number;
  is_read: boolean;
  created_at: string;
}

export function useLowStockAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading, error } = useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('low_stock_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LowStockAlert[];
    },
    enabled: !!user,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('low-stock-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'low_stock_alerts',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const markAsRead = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('low_stock_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('low_stock_alerts')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
    },
  });

  const deleteAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('low_stock_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
    },
  });

  const unreadCount = alerts.filter(a => !a.is_read).length;

  return {
    alerts,
    unreadAlerts: alerts.filter(a => !a.is_read),
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteAlert,
  };
}
