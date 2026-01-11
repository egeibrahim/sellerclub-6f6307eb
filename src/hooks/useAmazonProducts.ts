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

  // Fetch Amazon products from marketplace_listings table
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
        .from("marketplace_listings")
        .select("*")
        .eq("user_id", user.id)
        .eq("platform", "amazon")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Get Amazon connection from shop_connections
  const getConnection = async () => {
    if (!user) return null;

    const { data } = await supabase
      .from("shop_connections")
      .select("*")
      .eq("user_id", user.id)
      .eq("platform", "amazon")
      .eq("is_connected", true)
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

      // Save products to marketplace_listings table
      const amazonProducts = data.products || [];
      
      for (const product of amazonProducts) {
        await supabase.from("marketplace_listings").upsert(
          {
            user_id: user!.id,
            title: product.summaries?.[0]?.itemName || product.sku || "Ürün",
            platform: "amazon",
            price: product.summaries?.[0]?.price?.amount || 0,
            status: "active",
            external_id: product.sku,
            shop_connection_id: connection.id,
            last_sync_at: new Date().toISOString(),
            marketplace_data: {
              sku: product.sku,
              stock: product.summaries?.[0]?.fulfillableQuantity || 0,
            },
          },
          {
            onConflict: "external_id,platform,user_id",
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

  // Fetch orders from Amazon - stores in local state for now
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

      // Orders are returned but not stored in DB since orders table doesn't exist
      const orders = data.orders || [];
      return orders;
    },
    onSuccess: (orders) => {
      toast.success(`${orders.length} sipariş alındı`);
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
