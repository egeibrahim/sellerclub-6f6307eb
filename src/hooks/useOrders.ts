import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export interface Order {
  id: string;
  user_id: string;
  marketplace_connection_id: string | null;
  marketplace: string;
  remote_order_id: string;
  order_number: string | null;
  status: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: Record<string, any>;
  billing_address: Record<string, any>;
  items: OrderItem[];
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  payment_method: string | null;
  payment_status: string | null;
  notes: string | null;
  order_date: string;
  shipped_date: string | null;
  delivered_date: string | null;
  cancelled_date: string | null;
  marketplace_data: Record<string, any>;
  created_at: string;
  updated_at: string;
  tracking_number?: string;
  tracking_company?: string;
  status_synced_at?: string;
}

export interface OrderItem {
  product_id?: string;
  sku?: string;
  title: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variant?: string;
}

export function useOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('order_date', { ascending: false });

      if (error) throw error;
      return (data || []).map(row => ({
        ...row,
        items: (Array.isArray(row.items) ? row.items : []) as unknown as OrderItem[],
        shipping_address: (row.shipping_address || {}) as Record<string, any>,
        billing_address: (row.billing_address || {}) as Record<string, any>,
        marketplace_data: (row.marketplace_data || {}) as Record<string, any>,
      })) as Order[];
    },
    enabled: !!user,
  });

  const syncOrders = useMutation({
    mutationFn: async ({ marketplace, connectionId }: { marketplace: string; connectionId: string }) => {
      const functionName = `${marketplace}-sync`;
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          action: 'fetch_orders',
          connectionId,
        },
      });

      if (error) throw error;
      
      if (data?.orders) {
        for (const order of data.orders) {
          await supabase.from('orders').upsert({
            user_id: user!.id,
            marketplace_connection_id: connectionId,
            marketplace,
            remote_order_id: order.id || order.orderId || order.orderNumber,
            order_number: order.orderNumber || order.order_number,
            status: order.status || 'pending',
            customer_name: order.customerName || order.customer?.name,
            customer_email: order.customerEmail || order.customer?.email,
            customer_phone: order.customerPhone || order.customer?.phone,
            shipping_address: order.shippingAddress || order.shipping_address || {},
            billing_address: order.billingAddress || order.billing_address || {},
            items: order.items || order.lines || [],
            subtotal: order.subtotal || 0,
            shipping_cost: order.shippingCost || order.shipping_cost || 0,
            tax_amount: order.taxAmount || order.tax_amount || 0,
            total_amount: order.totalAmount || order.total_amount || order.total || 0,
            currency: order.currency || 'TRY',
            payment_method: order.paymentMethod || order.payment_method,
            payment_status: order.paymentStatus || order.payment_status,
            order_date: order.orderDate || order.order_date || order.createdAt || new Date().toISOString(),
            marketplace_data: order,
          }, {
            onConflict: 'user_id,marketplace,remote_order_id',
          });
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "Siparişler senkronize edildi" });
    },
    onError: (error) => {
      toast({ title: "Sipariş senkronizasyonu başarısız", description: error.message, variant: "destructive" });
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const updates: Record<string, any> = { status };
      
      if (status === 'shipped') updates.shipped_date = new Date().toISOString();
      if (status === 'delivered') updates.delivered_date = new Date().toISOString();
      if (status === 'cancelled') updates.cancelled_date = new Date().toISOString();

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({ title: "Sipariş durumu güncellendi" });
    },
    onError: (error) => {
      toast({ title: "Güncelleme başarısız", description: error.message, variant: "destructive" });
    },
  });

  return {
    orders: orders || [],
    isLoading,
    error,
    syncOrders,
    updateOrderStatus,
  };
}
