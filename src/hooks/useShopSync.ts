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

      // Load Trendyol credentials from shop_connections
      const { data: connection, error: connError } = await supabase
        .from("shop_connections")
        .select("api_credentials, is_connected")
        .eq("user_id", user.id)
        .eq("platform", "trendyol")
        .maybeSingle();

      if (connError) throw connError;
      if (!connection || !connection.is_connected) {
        throw new Error(
          "Trendyol bağlantısı aktif değil. Lütfen önce Bağlantılar sayfasından Trendyol API bilgilerinizi kaydedin."
        );
      }

      // Fetch products from Trendyol
      const { data: fetchData, error: fetchError } = await supabase.functions.invoke(
        "trendyol-sync",
        {
          body: { action: "fetch_products", credentials: connection.api_credentials },
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

      // Process products in batches - save to marketplace_listings
      for (let i = 0; i < products.length; i++) {
        const product = products[i];

        try {
          const { data: existing } = await supabase
            .from("marketplace_listings")
            .select("id")
            .eq("user_id", user.id)
            .eq("platform", "trendyol")
            .eq("external_id", product.barcode || product.stockCode)
            .maybeSingle();

          const listingData = {
            title: product.title || product.productName || "Untitled",
            price: product.salePrice || product.listPrice || 0,
            description: product.description || null,
            platform: "trendyol",
            status: product.onSale ? "active" : "draft",
            user_id: user.id,
            external_id: product.barcode || product.stockCode || null,
            last_sync_at: new Date().toISOString(),
            sync_status: "synced",
            marketplace_data: {
              stock: product.quantity || 0,
              sku: product.barcode || product.stockCode,
              brand: product.brand?.name || product.brandName,
              color: product.color,
              size: product.size,
              images: product.images?.map((img: any) => img.url || img) || [],
            },
          };

          if (existing) {
            await supabase
              .from("marketplace_listings")
              .update(listingData)
              .eq("id", existing.id);
            updated++;
          } else {
            await supabase.from("marketplace_listings").insert(listingData);
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

      const { data: connection, error: connError } = await supabase
        .from("shop_connections")
        .select("api_credentials, is_connected")
        .eq("user_id", user.id)
        .eq("platform", "ikas")
        .maybeSingle();

      if (connError) throw connError;
      if (!connection || !connection.is_connected) {
        throw new Error(
          "İkas bağlantısı aktif değil. Lütfen önce Bağlantılar sayfasından İkas API bilgilerinizi kaydedin."
        );
      }

      const { data: fetchData, error: fetchError } = await supabase.functions.invoke(
        "ikas-sync",
        {
          body: { 
            action: "fetch_products", 
            credentials: connection.api_credentials,
            limit: 100,
            page: 1
          },
        }
      );

      if (fetchError) {
        throw new Error(`İkas API hatası: ${fetchError.message}`);
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

      for (let i = 0; i < products.length; i++) {
        const product = products[i];

        try {
          const { data: existing } = await supabase
            .from("marketplace_listings")
            .select("id")
            .eq("user_id", user.id)
            .eq("platform", "ikas")
            .eq("external_id", product.sku || product.id)
            .maybeSingle();

          const listingData = {
            title: product.title || "Untitled",
            price: product.price || 0,
            description: product.description || null,
            platform: "ikas",
            status: "active",
            user_id: user.id,
            external_id: product.sku || product.id,
            last_sync_at: new Date().toISOString(),
            sync_status: "synced",
            marketplace_data: {
              stock: product.stock || 0,
              sku: product.sku,
              brand: product.brand,
              images: product.images || [],
            },
          };

          if (existing) {
            await supabase
              .from("marketplace_listings")
              .update(listingData)
              .eq("id", existing.id);
            updated++;
          } else {
            await supabase.from("marketplace_listings").insert(listingData);
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
        message: `${result.synced} ürün senkronize edildi`,
        current: result.synced,
        total: result.synced,
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(`İkas senkronizasyonu tamamlandı`);
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
    setProgress({ status: "idle", message: "", current: 0, total: 0 });
  };

  return {
    syncTrendyol,
    syncIkas,
    progress,
    resetProgress,
    isLoading: syncTrendyol.isPending || syncIkas.isPending,
  };
}