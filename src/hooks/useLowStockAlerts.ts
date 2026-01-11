import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { useState } from "react";

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

// Mock data for low stock alerts - will be replaced with real DB table in future
function generateMockAlerts(userId: string): LowStockAlert[] {
  return [];
}

export function useLowStockAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [alerts, setAlerts] = useState<LowStockAlert[]>([]);

  const { data: alertsData = [], isLoading, error } = useQuery({
    queryKey: ['low-stock-alerts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Return empty array since low_stock_alerts table doesn't exist yet
      // This prevents build errors while maintaining the hook interface
      return generateMockAlerts(user.id);
    },
    enabled: !!user,
  });

  const markAsRead = useMutation({
    mutationFn: async (alertId: string) => {
      // Mock implementation - update local state
      setAlerts(prev => prev.map(a => 
        a.id === alertId ? { ...a, is_read: true } : a
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      // Mock implementation - update local state
      setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
    },
  });

  const deleteAlert = useMutation({
    mutationFn: async (alertId: string) => {
      // Mock implementation - update local state
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['low-stock-alerts'] });
    },
  });

  const unreadCount = alertsData.filter(a => !a.is_read).length;

  return {
    alerts: alertsData,
    unreadAlerts: alertsData.filter(a => !a.is_read),
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteAlert,
  };
}
