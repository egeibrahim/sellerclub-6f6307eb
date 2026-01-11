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
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (sourceFilter) {
        query = query.eq("source", sourceFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!user,
  });

  const createProduct = useMutation({
    mutationFn: async (product: Partial<Product>) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("products")
        .insert({ 
          title: product.title || "New Product",
          user_id: user.id,
          sku: product.sku,
          description: product.description,
          price: product.price || 0,
          stock: product.stock || 0,
          brand: product.brand,
          color: product.color,
          size: product.size,
          material: product.material,
          status: product.status || "draft",
          source: product.source || "manual",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
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
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!original) throw new Error("Product not found");

      // Create a copy with status 'copy'
      const { data, error } = await supabase
        .from("products")
        .insert({
          title: `${original.title} (Copy)`,
          user_id: user.id,
          sku: original.sku ? `${original.sku}-copy` : null,
          description: original.description,
          price: original.price,
          stock: original.stock,
          brand: original.brand,
          color: original.color,
          size: original.size,
          material: original.material,
          status: "copy",
          source: original.source,
          images: original.images,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product copied" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
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
      const { error } = await supabase.from("products").delete().eq("id", id);
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
      const { error } = await supabase.from("products").delete().in("id", ids);
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
        .from("products")
        .select("id, price")
        .in("id", ids);
      
      if (fetchError) throw fetchError;

      for (const product of currentProducts || []) {
        const currentPrice = Number(product.price) || 0;
        const newPrice = isPercentage
          ? currentPrice * (1 + adjustment / 100)
          : currentPrice + adjustment;

        await supabase
          .from("products")
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
        .from("products")
        .select("id, stock")
        .in("id", ids);
      
      if (fetchError) throw fetchError;

      for (const product of currentProducts || []) {
        const currentStock = Number(product.stock) || 0;
        const newStock = Math.max(0, currentStock + adjustment);

        await supabase
          .from("products")
          .update({ stock: newStock })
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
        .from("products")
        .select("id, images")
        .in("id", ids);
      
      if (fetchError) throw fetchError;

      for (const product of currentProducts || []) {
        const existingImages = product.images || [];
        const newImages = [...existingImages, ...imageUrls];

        await supabase
          .from("products")
          .update({ images: newImages })
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
