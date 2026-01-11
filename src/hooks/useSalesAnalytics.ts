import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export interface SalesAnalytics {
  id: string;
  user_id: string;
  date: string;
  marketplace: string;
  orders_count: number;
  total_revenue: number;
  total_items_sold: number;
  average_order_value: number;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
  averageOrderValue: number;
  revenueByMarketplace: Record<string, number>;
  ordersByMarketplace: Record<string, number>;
  dailyRevenue: { date: string; revenue: number; orders: number }[];
}

// Mock analytics storage
const mockAnalytics: Map<string, SalesAnalytics[]> = new Map();

export function useSalesAnalytics(dateRange?: { start: Date; end: Date }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['sales-analytics', user?.id, dateRange?.start?.toISOString(), dateRange?.end?.toISOString()],
    queryFn: async () => {
      if (!user) return [];
      // Return mock data since sales_analytics table doesn't exist
      return mockAnalytics.get(user.id) || [];
    },
    enabled: !!user,
  });

  const refreshAnalytics = useMutation({
    mutationFn: async () => {
      // Mock implementation - no orders table exists
      return [];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-analytics'] });
    },
  });

  const summary: AnalyticsSummary = {
    totalRevenue: 0,
    totalOrders: 0,
    totalItemsSold: 0,
    averageOrderValue: 0,
    revenueByMarketplace: {},
    ordersByMarketplace: {},
    dailyRevenue: [],
  };

  if (analytics && analytics.length > 0) {
    const dailyMap: Record<string, { revenue: number; orders: number }> = {};

    for (const record of analytics) {
      summary.totalRevenue += Number(record.total_revenue);
      summary.totalOrders += record.orders_count;
      summary.totalItemsSold += record.total_items_sold;

      if (!summary.revenueByMarketplace[record.marketplace]) {
        summary.revenueByMarketplace[record.marketplace] = 0;
        summary.ordersByMarketplace[record.marketplace] = 0;
      }
      summary.revenueByMarketplace[record.marketplace] += Number(record.total_revenue);
      summary.ordersByMarketplace[record.marketplace] += record.orders_count;

      if (!dailyMap[record.date]) {
        dailyMap[record.date] = { revenue: 0, orders: 0 };
      }
      dailyMap[record.date].revenue += Number(record.total_revenue);
      dailyMap[record.date].orders += record.orders_count;
    }

    summary.averageOrderValue = summary.totalOrders > 0 ? summary.totalRevenue / summary.totalOrders : 0;
    summary.dailyRevenue = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  return {
    analytics: analytics || [],
    summary,
    isLoading,
    error: null,
    refreshAnalytics,
  };
}