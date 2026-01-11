import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ProductData {
  sku: string;
  title: string;
  description?: string;
  price: number;
  quantity: number;
  condition?: string;
  asin?: string;
}

interface UpdateData {
  price?: number;
  quantity?: number;
}

export function useAmazonProducts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch Amazon products from local database
  const {
    data: products = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["amazon-products", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .eq("source", "amazon")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Get Amazon connection
  const getConnection = async () => {
    if (!user) return null;

    const { data } = await supabase
      .from("marketplace_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("marketplace", "amazon")
      .eq("is_active", true)
      .maybeSingle();

    return data;
  };

  // Create product on Amazon
  const createProductMutation = useMutation({
    mutationFn: async (product: ProductData) => {
      const connection = await getConnection();
      if (!connection) {
        throw new Error("Amazon bağlantısı bulunamadı");
      }

      const { data, error } = await supabase.functions.invoke("amazon-sync", {
        body: {
          action: "create_product",
          connectionId: connection.id,
          product,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amazon-products"] });
      toast.success("Ürün Amazon'a eklendi");
    },
    onError: (error: any) => {
      console.error("Create product error:", error);
      toast.error(error.message || "Ürün eklenemedi");
    },
  });

  // Update product on Amazon
  const updateProductMutation = useMutation({
    mutationFn: async ({ sku, updates }: { sku: string; updates: UpdateData }) => {
      const connection = await getConnection();
      if (!connection) {
        throw new Error("Amazon bağlantısı bulunamadı");
      }

      const { data, error } = await supabase.functions.invoke("amazon-sync", {
        body: {
          action: "update_product",
          connectionId: connection.id,
          sku,
          updates,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amazon-products"] });
      toast.success("Ürün güncellendi");
    },
    onError: (error: any) => {
      console.error("Update product error:", error);
      toast.error(error.message || "Ürün güncellenemedi");
    },
  });

  // Fetch products from Amazon API and sync to local database
  const syncProductsMutation = useMutation({
    mutationFn: async () => {
      const connection = await getConnection();
      if (!connection) {
        throw new Error("Amazon bağlantısı bulunamadı");
      }

      const { data, error } = await supabase.functions.invoke("amazon-sync", {
        body: {
          action: "fetch_products",
          connectionId: connection.id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Save products to local database
      const amazonProducts = data.products || [];
      
      for (const product of amazonProducts) {
        await supabase.from("products").upsert(
          {
            user_id: user!.id,
            title: product.summaries?.[0]?.itemName || product.sku || "Ürün",
            sku: product.sku,
            price: product.summaries?.[0]?.price?.amount || 0,
            stock: product.summaries?.[0]?.fulfillableQuantity || 0,
            status: "active",
            source: "amazon",
            last_synced_at: new Date().toISOString(),
          },
          {
            onConflict: "sku,user_id",
            ignoreDuplicates: false,
          }
        );
      }

      return amazonProducts;
    },
    onSuccess: (products) => {
      queryClient.invalidateQueries({ queryKey: ["amazon-products"] });
      toast.success(`${products.length} ürün senkronize edildi`);
    },
    onError: (error: any) => {
      console.error("Sync products error:", error);
      toast.error(error.message || "Senkronizasyon başarısız");
    },
  });

  // Fetch orders from Amazon
  const fetchOrdersMutation = useMutation({
    mutationFn: async (createdAfter?: string) => {
      const connection = await getConnection();
      if (!connection) {
        throw new Error("Amazon bağlantısı bulunamadı");
      }

      const { data, error } = await supabase.functions.invoke("amazon-sync", {
        body: {
          action: "fetch_orders",
          connectionId: connection.id,
          createdAfter,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Save orders to local database
      const orders = data.orders || [];
      
      for (const order of orders) {
        await supabase.from("orders").upsert(
          {
            user_id: user!.id,
            marketplace: "amazon",
            marketplace_connection_id: connection.id,
            remote_order_id: order.id,
            order_number: order.orderNumber,
            status: order.status,
            customer_name: order.customerName,
            customer_email: order.customerEmail,
            shipping_address: order.shippingAddress,
            items: order.items,
            subtotal: order.subtotal,
            total_amount: order.total,
            currency: order.currency,
            order_date: order.orderDate,
            marketplace_data: order.marketplaceData,
          },
          {
            onConflict: "remote_order_id,marketplace",
            ignoreDuplicates: false,
          }
        );
      }

      return orders;
    },
    onSuccess: (orders) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(`${orders.length} sipariş senkronize edildi`);
    },
    onError: (error: any) => {
      console.error("Fetch orders error:", error);
      toast.error(error.message || "Siparişler alınamadı");
    },
  });

  return {
    products,
    isLoading,
    error,
    refetch,
    createProduct: createProductMutation.mutateAsync,
    updateProduct: updateProductMutation.mutateAsync,
    syncProducts: syncProductsMutation.mutateAsync,
    fetchOrders: fetchOrdersMutation.mutateAsync,
    isCreating: createProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
    isSyncing: syncProductsMutation.isPending,
    isFetchingOrders: fetchOrdersMutation.isPending,
  };
}
