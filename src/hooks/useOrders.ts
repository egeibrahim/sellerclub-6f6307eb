import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

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

// Mock orders data - will be replaced with real DB table in future
function generateMockOrders(): Order[] {
  return [];
}

export function useOrders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localOrders, setLocalOrders] = useState<Order[]>([]);

  // Since orders table doesn't exist, return empty array
  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Return mock/empty data since orders table doesn't exist
      return generateMockOrders();
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
      
      // Store orders in local state since table doesn't exist
      if (data?.orders) {
        const mappedOrders: Order[] = data.orders.map((order: any) => ({
          id: order.id || order.orderId || crypto.randomUUID(),
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
          notes: null,
          order_date: order.orderDate || order.order_date || order.createdAt || new Date().toISOString(),
          shipped_date: null,
          delivered_date: null,
          cancelled_date: null,
          marketplace_data: order,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        setLocalOrders(prev => [...prev, ...mappedOrders]);
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
      // Update in local state since table doesn't exist
      setLocalOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          const updates: Partial<Order> = { status };
          if (status === 'shipped') updates.shipped_date = new Date().toISOString();
          if (status === 'delivered') updates.delivered_date = new Date().toISOString();
          if (status === 'cancelled') updates.cancelled_date = new Date().toISOString();
          return { ...order, ...updates };
        }
        return order;
      }));
      return { id: orderId, status };
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
    orders: [...orders, ...localOrders],
    isLoading,
    error,
    syncOrders,
    updateOrderStatus,
  };
}
