import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface MasterListingImage {
  id: string;
  url: string;
  is_primary: boolean;
  sort_order: number;
}

export interface MasterListingVariant {
  id: string;
  name: string;
  sku: string | null;
  price_adjustment: number;
  stock: number;
  attributes: Record<string, string>;
}

export interface MarketplaceProduct {
  id: string;
  marketplace_connection_id: string;
  sync_status: 'pending' | 'synced' | 'error' | 'syncing';
  remote_product_id: string | null;
  remote_category_id: string | null;
  remote_category_name: string | null;
  last_synced_at: string | null;
  sync_error: string | null;
  marketplace_connection?: {
    marketplace: string;
    store_name: string | null;
  };
}

export interface MasterListing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  sku: string;
  brand: string | null;
  category: string | null;
  price: number | null;
  compare_at_price: number | null;
  cost: number | null;
  images: MasterListingImage[];
  variations: MasterListingVariant[];
  attributes: Record<string, unknown>;
  tags: string[] | null;
  weight: number | null;
  weight_unit: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  // Computed/derived fields for compatibility
  base_price: number;
  total_stock: number;
  internal_sku: string | null;
  normalized_attributes: Record<string, string>;
  low_stock_threshold: number;
  // Legacy fields for backward compatibility
  source_marketplace?: string | null;
  source_category_id?: string | null;
  source_category_path?: string | null;
  variant_options?: Record<string, unknown>;
  materials?: string | null;
  who_made_it?: string | null;
  what_is_it?: string | null;
  when_made?: string | null;
  personalization_enabled?: boolean;
  personalization_instructions?: string | null;
  shipping_profile_id?: string | null;
  marketplace_products?: MarketplaceProduct[];
}

// Helper to transform master_products row to MasterListing
function transformToMasterListing(row: any): MasterListing {
  const images = (row.images || []).map((img: any, index: number) => {
    if (typeof img === 'string') {
      return {
        id: `img-${index}`,
        url: img,
        is_primary: index === 0,
        sort_order: index,
      };
    }
    return {
      id: img.id || `img-${index}`,
      url: img.url || img,
      is_primary: img.is_primary ?? index === 0,
      sort_order: img.sort_order ?? index,
    };
  });

  const variations = (row.variations || []).map((v: any, index: number) => ({
    id: v.id || `var-${index}`,
    name: v.name || '',
    sku: v.sku || null,
    price_adjustment: v.price_adjustment || 0,
    stock: v.stock || 0,
    attributes: v.attributes || {},
  }));

  const totalStock = variations.length > 0 
    ? variations.reduce((sum: number, v: MasterListingVariant) => sum + v.stock, 0)
    : 0;

  return {
    id: row.id,
    user_id: row.user_id,
    title: row.title,
    description: row.description,
    sku: row.sku,
    brand: row.brand,
    category: row.category,
    price: row.price ? Number(row.price) : null,
    compare_at_price: row.compare_at_price ? Number(row.compare_at_price) : null,
    cost: row.cost ? Number(row.cost) : null,
    images,
    variations,
    attributes: row.attributes || {},
    tags: row.tags,
    weight: row.weight ? Number(row.weight) : null,
    weight_unit: row.weight_unit,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    // Computed fields
    base_price: row.price ? Number(row.price) : 0,
    total_stock: totalStock,
    internal_sku: row.sku,
    normalized_attributes: row.attributes || {},
    low_stock_threshold: 5, // Default value
  };
}

export function useMasterListings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: masterListings, isLoading, error } = useQuery({
    queryKey: ['master-listings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('master_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(transformToMasterListing);
    },
    enabled: !!user,
  });

  const createMasterListing = useMutation({
    mutationFn: async (listing: Partial<MasterListing>) => {
      if (!user) throw new Error("Not authenticated");

      const insertData: Record<string, unknown> = {
        user_id: user.id,
        title: listing.title || 'Yeni Ürün',
        description: listing.description,
        sku: listing.sku || listing.internal_sku || `SKU-${Date.now()}`,
        brand: listing.brand,
        category: listing.category,
        price: listing.price ?? listing.base_price ?? 0,
        compare_at_price: listing.compare_at_price,
        cost: listing.cost,
        images: listing.images || [],
        variations: listing.variations || [],
        attributes: listing.attributes || listing.normalized_attributes || {},
        tags: listing.tags,
        weight: listing.weight,
        weight_unit: listing.weight_unit || 'g',
        status: listing.status || 'draft',
      };

      const { data, error } = await supabase
        .from('master_products')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return transformToMasterListing(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-listings'] });
      toast.success("Ürün oluşturuldu");
    },
    onError: (error) => {
      toast.error("Ürün oluşturulamadı: " + error.message);
    },
  });

  const updateMasterListing = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MasterListing> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.sku !== undefined) updateData.sku = updates.sku;
      if (updates.internal_sku !== undefined) updateData.sku = updates.internal_sku;
      if (updates.brand !== undefined) updateData.brand = updates.brand;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.base_price !== undefined) updateData.price = updates.base_price;
      if (updates.compare_at_price !== undefined) updateData.compare_at_price = updates.compare_at_price;
      if (updates.cost !== undefined) updateData.cost = updates.cost;
      if (updates.images !== undefined) updateData.images = updates.images;
      if (updates.variations !== undefined) updateData.variations = updates.variations;
      if (updates.attributes !== undefined) updateData.attributes = updates.attributes;
      if (updates.normalized_attributes !== undefined) updateData.attributes = updates.normalized_attributes;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.weight !== undefined) updateData.weight = updates.weight;
      if (updates.weight_unit !== undefined) updateData.weight_unit = updates.weight_unit;
      if (updates.status !== undefined) updateData.status = updates.status;

      const { data, error } = await supabase
        .from('master_products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return transformToMasterListing(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-listings'] });
      toast.success("Ürün güncellendi");
    },
    onError: (error) => {
      toast.error("Ürün güncellenemedi: " + error.message);
    },
  });

  const deleteMasterListing = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('master_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-listings'] });
      toast.success("Ürün silindi");
    },
    onError: (error) => {
      toast.error("Ürün silinemedi: " + error.message);
    },
  });

  const addImage = useMutation({
    mutationFn: async ({ masterListingId, url, isPrimary = false }: { masterListingId: string; url: string; isPrimary?: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      // Get current product
      const { data: product, error: fetchError } = await supabase
        .from('master_products')
        .select('images')
        .eq('id', masterListingId)
        .single();

      if (fetchError) throw fetchError;

      const currentImages = (product?.images as any[]) || [];
      const nextSortOrder = currentImages.length;

      const newImage = {
        id: `img-${Date.now()}`,
        url,
        is_primary: isPrimary || currentImages.length === 0,
        sort_order: nextSortOrder,
      };

      const updatedImages = [...currentImages, newImage];

      const { data, error } = await supabase
        .from('master_products')
        .update({ images: updatedImages })
        .eq('id', masterListingId)
        .select()
        .single();

      if (error) throw error;
      return newImage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-listings'] });
      toast.success("Görsel eklendi");
    },
    onError: (error) => {
      toast.error("Görsel eklenemedi: " + error.message);
    },
  });

  const deleteImage = useMutation({
    mutationFn: async ({ masterListingId, imageId }: { masterListingId: string; imageId: string }) => {
      // Get current product
      const { data: product, error: fetchError } = await supabase
        .from('master_products')
        .select('images')
        .eq('id', masterListingId)
        .single();

      if (fetchError) throw fetchError;

      const currentImages = (product?.images as any[]) || [];
      const updatedImages = currentImages.filter((img: any) => img.id !== imageId);

      const { error } = await supabase
        .from('master_products')
        .update({ images: updatedImages })
        .eq('id', masterListingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-listings'] });
      toast.success("Görsel silindi");
    },
    onError: (error) => {
      toast.error("Görsel silinemedi: " + error.message);
    },
  });

  return {
    masterListings: masterListings || [],
    isLoading,
    error,
    createMasterListing,
    updateMasterListing,
    deleteMasterListing,
    addImage,
    deleteImage,
  };
}