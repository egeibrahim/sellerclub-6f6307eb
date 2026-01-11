import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface SyncResult {
  synced: number;
  created: number;
  updated: number;
  errors: string[];
}

export function useShopSync() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<{
    status: "idle" | "fetching" | "syncing" | "success" | "error";
    message: string;
    current: number;
    total: number;
  }>({
    status: "idle",
    message: "",
    current: 0,
    total: 0,
  });

  const syncTrendyol = useMutation({
    mutationFn: async (): Promise<SyncResult> => {
      if (!user) throw new Error("User not authenticated");

       setProgress({
         status: "fetching",
         message: "Trendyol'dan ürünler alınıyor...",
         current: 0,
         total: 0,
       });

       // Load Trendyol credentials from the user's saved connection
       const { data: connection, error: connError } = await supabase
         .from("marketplace_connections")
         .select("credentials, is_active")
         .eq("user_id", user.id)
         .eq("marketplace", "trendyol")
         .maybeSingle();

       if (connError) throw connError;
       if (!connection || !connection.is_active) {
         throw new Error(
           "Trendyol bağlantısı aktif değil. Lütfen önce Bağlantılar sayfasından Trendyol API bilgilerinizi kaydedin."
         );
       }

       // Fetch products from Trendyol
       const { data: fetchData, error: fetchError } = await supabase.functions.invoke(
         "trendyol-sync",
         {
           body: { action: "fetch_products", credentials: connection.credentials },
         }
       );

       if (fetchError) {
         throw new Error(`Trendyol API hatası: ${fetchError.message}`);
       }

       if (fetchData?.success === false) {
         throw new Error(fetchData?.message || "Trendyol'dan ürün alınamadı");
       }

       if (!fetchData?.products || !Array.isArray(fetchData.products)) {
         throw new Error("Trendyol'dan ürün alınamadı");
       }

      const products = fetchData.products;
      const total = products.length;

      setProgress({
        status: "syncing",
        message: `${total} ürün bulundu, senkronize ediliyor...`,
        current: 0,
        total,
      });

      let created = 0;
      let updated = 0;
      const errors: string[] = [];

      // Process products in batches
      for (let i = 0; i < products.length; i++) {
        const product = products[i];

        try {
          // Check if product exists by barcode/sku
          const { data: existing } = await supabase
            .from("products")
            .select("id")
            .eq("user_id", user.id)
            .eq("source", "trendyol")
            .eq("sku", product.barcode || product.stockCode)
            .maybeSingle();

          const productData = {
            title: product.title || product.productName || "Untitled",
            price: product.salePrice || product.listPrice || 0,
            stock: product.quantity || 0,
            sku: product.barcode || product.stockCode || null,
            brand: product.brand?.name || product.brandName || null,
            color: product.color || null,
            size: product.size || null,
            description: product.description || null,
            images: product.images?.map((img: any) => img.url || img) || [],
            source: "trendyol",
            status: product.onSale ? "active" : "draft",
            user_id: user.id,
            trendyol_synced: true,
            last_synced_at: new Date().toISOString(),
          };

          if (existing) {
            // Update existing product
            await supabase
              .from("products")
              .update(productData)
              .eq("id", existing.id);
            updated++;
          } else {
            // Create new product
            await supabase.from("products").insert(productData);
            created++;
          }

          setProgress({
            status: "syncing",
            message: `Ürünler senkronize ediliyor...`,
            current: i + 1,
            total,
          });
        } catch (err: any) {
          errors.push(`${product.title || "Unknown"}: ${err.message}`);
        }
      }

      return { synced: created + updated, created, updated, errors };
    },
    onSuccess: (result) => {
      setProgress({
        status: "success",
        message: `${result.synced} ürün senkronize edildi (${result.created} yeni, ${result.updated} güncellendi)`,
        current: result.synced,
        total: result.synced,
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(
        `Trendyol senkronizasyonu tamamlandı: ${result.created} yeni, ${result.updated} güncellendi`
      );
    },
    onError: (error: Error) => {
      setProgress({
        status: "error",
        message: error.message,
        current: 0,
        total: 0,
      });
      toast.error(`Senkronizasyon hatası: ${error.message}`);
    },
  });

  const syncIkas = useMutation({
    mutationFn: async (): Promise<SyncResult> => {
      if (!user) throw new Error("User not authenticated");

      setProgress({
        status: "fetching",
        message: "İkas'tan ürünler alınıyor...",
        current: 0,
        total: 0,
      });

      // Load ikas credentials from the user's saved connection
      const { data: connection, error: connError } = await supabase
        .from("marketplace_connections")
        .select("credentials, is_active")
        .eq("user_id", user.id)
        .eq("marketplace", "ikas")
        .maybeSingle();

      if (connError) throw connError;
      if (!connection || !connection.is_active) {
        throw new Error(
          "İkas bağlantısı aktif değil. Lütfen önce Bağlantılar sayfasından İkas API bilgilerinizi kaydedin."
        );
      }

      // Fetch products from ikas
      const { data: fetchData, error: fetchError } = await supabase.functions.invoke(
        "ikas-sync",
        {
          body: { 
            action: "fetch_products", 
            credentials: connection.credentials,
            limit: 100,
            page: 1
          },
        }
      );

      if (fetchError) {
        throw new Error(`İkas API hatası: ${fetchError.message}`);
      }

      if (fetchData?.success === false) {
        throw new Error(fetchData?.details || fetchData?.error || "İkas'tan ürün alınamadı");
      }

      if (!fetchData?.products || !Array.isArray(fetchData.products)) {
        throw new Error("İkas'tan ürün alınamadı");
      }

      const products = fetchData.products;
      const total = products.length;

      setProgress({
        status: "syncing",
        message: `${total} ürün bulundu, senkronize ediliyor...`,
        current: 0,
        total,
      });

      let created = 0;
      let updated = 0;
      const errors: string[] = [];

      // Process products
      for (let i = 0; i < products.length; i++) {
        const product = products[i];

        try {
          // Check if product exists by sku
          const { data: existing } = await supabase
            .from("products")
            .select("id")
            .eq("user_id", user.id)
            .eq("source", "ikas")
            .eq("sku", product.sku || product.id)
            .maybeSingle();

          const productData = {
            title: product.title || "Untitled",
            price: product.price || 0,
            stock: product.stock || 0,
            sku: product.sku || product.id || null,
            brand: product.brand || null,
            description: product.description || null,
            images: product.images || [],
            source: "ikas",
            status: "active",
            user_id: user.id,
            last_synced_at: new Date().toISOString(),
          };

          if (existing) {
            await supabase
              .from("products")
              .update(productData)
              .eq("id", existing.id);
            updated++;
          } else {
            await supabase.from("products").insert(productData);
            created++;
          }

          setProgress({
            status: "syncing",
            message: `Ürünler senkronize ediliyor...`,
            current: i + 1,
            total,
          });
        } catch (err: any) {
          errors.push(`${product.title || "Unknown"}: ${err.message}`);
        }
      }

      return { synced: created + updated, created, updated, errors };
    },
    onSuccess: (result) => {
      setProgress({
        status: "success",
        message: `${result.synced} ürün senkronize edildi (${result.created} yeni, ${result.updated} güncellendi)`,
        current: result.synced,
        total: result.synced,
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(
        `İkas senkronizasyonu tamamlandı: ${result.created} yeni, ${result.updated} güncellendi`
      );
    },
    onError: (error: Error) => {
      setProgress({
        status: "error",
        message: error.message,
        current: 0,
        total: 0,
      });
      toast.error(`Senkronizasyon hatası: ${error.message}`);
    },
  });

  const resetProgress = () => {
    setProgress({
      status: "idle",
      message: "",
      current: 0,
      total: 0,
    });
  };

  return {
    syncTrendyol,
    syncIkas,
    progress,
    resetProgress,
    isLoading: syncTrendyol.isPending || syncIkas.isPending,
  };
}
