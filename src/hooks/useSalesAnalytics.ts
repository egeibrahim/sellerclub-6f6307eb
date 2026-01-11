import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

export function useSalesAnalytics(dateRange?: { start: Date; end: Date }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['sales-analytics', user?.id, dateRange?.start?.toISOString(), dateRange?.end?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('sales_analytics')
        .select('*')
        .order('date', { ascending: false });

      if (dateRange?.start) {
        query = query.gte('date', dateRange.start.toISOString().split('T')[0]);
      }
      if (dateRange?.end) {
        query = query.lte('date', dateRange.end.toISOString().split('T')[0]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SalesAnalytics[];
    },
    enabled: !!user,
  });

  const refreshAnalytics = useMutation({
    mutationFn: async () => {
      // Fetch orders and aggregate into analytics
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*');

      if (error) throw error;

      // Group orders by date and marketplace
      const grouped: Record<string, Record<string, { orders: number; revenue: number; items: number }>> = {};

      for (const order of orders || []) {
        const date = new Date(order.order_date).toISOString().split('T')[0];
        const marketplace = order.marketplace;

        if (!grouped[date]) grouped[date] = {};
        if (!grouped[date][marketplace]) {
          grouped[date][marketplace] = { orders: 0, revenue: 0, items: 0 };
        }

        grouped[date][marketplace].orders += 1;
        grouped[date][marketplace].revenue += Number(order.total_amount) || 0;
        
        const items = order.items as any[];
        grouped[date][marketplace].items += items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;
      }

      // Upsert analytics records
      for (const [date, marketplaces] of Object.entries(grouped)) {
        for (const [marketplace, stats] of Object.entries(marketplaces)) {
          await supabase.from('sales_analytics').upsert({
            user_id: user!.id,
            date,
            marketplace,
            orders_count: stats.orders,
            total_revenue: stats.revenue,
            total_items_sold: stats.items,
            average_order_value: stats.orders > 0 ? stats.revenue / stats.orders : 0,
          }, {
            onConflict: 'user_id,date,marketplace',
          });
        }
      }
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

  if (analytics) {
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
    error,
    refreshAnalytics,
  };
}
