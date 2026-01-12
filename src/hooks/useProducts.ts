import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface Product {
  id: string;
  user_id: string;
  sku: string | null;
  title: string;
  description: string | null;
  price: number;
  stock: number;
  brand: string | null;
  color: string | null;
  size: string | null;
  material: string | null;
  status: string;
  trendyol_synced: boolean;
  last_synced_at: string | null;
  listing_id: string | null;
  marketplace_category_id: string | null;
  source: string;
  images: string[] | null;
  created_at: string;
  updated_at: string;
}

// Transform marketplace_listings row to Product interface
function transformToProduct(row: any): Product {
  const marketplaceData = row.marketplace_data || {};
  return {
    id: row.id,
    user_id: row.user_id,
    sku: marketplaceData.sku || row.external_id || null,
    title: row.title,
    description: row.description,
    price: Number(row.price) || 0,
    stock: marketplaceData.stock || 0,
    brand: marketplaceData.brand || null,
    color: marketplaceData.color || null,
    size: marketplaceData.size || null,
    material: marketplaceData.material || null,
    status: row.status || 'draft',
    trendyol_synced: row.sync_status === 'synced',
    last_synced_at: row.last_sync_at,
    listing_id: row.external_id,
    marketplace_category_id: marketplaceData.category_id || null,
    source: row.platform || 'manual',
    images: marketplaceData.images || [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function useProducts(sourceFilter?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products", user?.id, sourceFilter],
    queryFn: async () => {
      if (!user) return [];
      let query = supabase
        .from("marketplace_listings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (sourceFilter) {
        query = query.eq("platform", sourceFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(transformToProduct);
    },
    enabled: !!user,
  });

  const createProduct = useMutation({
    mutationFn: async (product: Partial<Product>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("marketplace_listings")
        .insert({ 
          title: product.title || "New Product",
          user_id: user.id,
          platform: product.source || "manual",
          description: product.description,
          price: product.price || 0,
          status: product.status || "draft",
          marketplace_data: {
            sku: product.sku,
            stock: product.stock || 0,
            brand: product.brand,
            color: product.color,
            size: product.size,
            material: product.material,
            images: product.images || [],
          },
        })
        .select()
        .single();
      if (error) throw error;
      return transformToProduct(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product created" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const copyProduct = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      // Get the original product
      const { data: original, error: fetchError } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("id", productId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!original) throw new Error("Product not found");

      const originalData = original.marketplace_data as any || {};

      // Create a copy with status 'copy' - keep same shop_connection_id
      const { data, error } = await supabase
        .from("marketplace_listings")
        .insert({
          title: `${original.title} (Copy)`,
          user_id: user.id,
          platform: original.platform,
          description: original.description,
          price: original.price,
          status: "copy",
          shop_connection_id: original.shop_connection_id,
          marketplace_data: {
            ...originalData,
            sku: originalData.sku ? `${originalData.sku}-copy` : null,
          },
        })
        .select()
        .single();
      
      if (error) throw error;
      return transformToProduct(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["listing-counts"] });
      toast({ title: "Product copied to Copy section" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.source !== undefined) updateData.platform = updates.source;

      // Handle marketplace_data fields
      const marketplaceDataUpdates: Record<string, unknown> = {};
      if (updates.sku !== undefined) marketplaceDataUpdates.sku = updates.sku;
      if (updates.stock !== undefined) marketplaceDataUpdates.stock = updates.stock;
      if (updates.brand !== undefined) marketplaceDataUpdates.brand = updates.brand;
      if (updates.color !== undefined) marketplaceDataUpdates.color = updates.color;
      if (updates.size !== undefined) marketplaceDataUpdates.size = updates.size;
      if (updates.material !== undefined) marketplaceDataUpdates.material = updates.material;
      if (updates.images !== undefined) marketplaceDataUpdates.images = updates.images;

      // If there are marketplace_data updates, we need to merge them
      if (Object.keys(marketplaceDataUpdates).length > 0) {
        const { data: current } = await supabase
          .from("marketplace_listings")
          .select("marketplace_data")
          .eq("id", id)
          .single();
        
        updateData.marketplace_data = {
          ...(current?.marketplace_data as object || {}),
          ...marketplaceDataUpdates,
        };
      }

      const { data, error } = await supabase
        .from("marketplace_listings")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return transformToProduct(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("marketplace_listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("marketplace_listings").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Products deleted" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const bulkUpdatePrice = useMutation({
    mutationFn: async ({
      ids,
      adjustment,
      isPercentage,
    }: {
      ids: string[];
      adjustment: number;
      isPercentage: boolean;
    }) => {
      const { data: currentProducts, error: fetchError } = await supabase
        .from("marketplace_listings")
        .select("id, price")
        .in("id", ids);
      
      if (fetchError) throw fetchError;

      for (const product of currentProducts || []) {
        const currentPrice = Number(product.price) || 0;
        const newPrice = isPercentage
          ? currentPrice * (1 + adjustment / 100)
          : currentPrice + adjustment;

        await supabase
          .from("marketplace_listings")
          .update({ price: Math.max(0, newPrice) })
          .eq("id", product.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Prices updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const bulkUpdateStock = useMutation({
    mutationFn: async ({
      ids,
      adjustment,
    }: {
      ids: string[];
      adjustment: number;
    }) => {
      const { data: currentProducts, error: fetchError } = await supabase
        .from("marketplace_listings")
        .select("id, marketplace_data")
        .in("id", ids);
      
      if (fetchError) throw fetchError;

      for (const product of currentProducts || []) {
        const marketplaceData = product.marketplace_data as any || {};
        const currentStock = Number(marketplaceData.stock) || 0;
        const newStock = Math.max(0, currentStock + adjustment);

        await supabase
          .from("marketplace_listings")
          .update({ 
            marketplace_data: {
              ...marketplaceData,
              stock: newStock,
            }
          })
          .eq("id", product.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Stock updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const bulkAddImages = useMutation({
    mutationFn: async ({
      ids,
      imageUrls,
    }: {
      ids: string[];
      imageUrls: string[];
    }) => {
      const { data: currentProducts, error: fetchError } = await supabase
        .from("marketplace_listings")
        .select("id, marketplace_data")
        .in("id", ids);
      
      if (fetchError) throw fetchError;

      for (const product of currentProducts || []) {
        const marketplaceData = product.marketplace_data as any || {};
        const existingImages = marketplaceData.images || [];
        const newImages = [...existingImages, ...imageUrls];

        await supabase
          .from("marketplace_listings")
          .update({ 
            marketplace_data: {
              ...marketplaceData,
              images: newImages,
            }
          })
          .eq("id", product.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Images added to products" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    products,
    isLoading,
    error,
    createProduct,
    copyProduct,
    updateProduct,
    deleteProduct,
    bulkDelete,
    bulkUpdatePrice,
    bulkUpdateStock,
    bulkAddImages,
  };
}