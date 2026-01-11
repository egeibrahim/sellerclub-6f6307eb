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
  base_price: number;
  total_stock: number;
  internal_sku: string | null;
  brand: string | null;
  normalized_attributes: Record<string, string>;
  low_stock_threshold: number;
  // New Etsy-style fields
  source_marketplace?: string | null;
  source_category_id?: string | null;
  source_category_path?: string | null;
  variant_options?: Record<string, unknown>;
  tags?: string[] | null;
  materials?: string | null;
  who_made_it?: string | null;
  what_is_it?: string | null;
  when_made?: string | null;
  personalization_enabled?: boolean;
  personalization_instructions?: string | null;
  shipping_profile_id?: string | null;
  created_at: string;
  updated_at: string;
  images?: MasterListingImage[];
  variants?: MasterListingVariant[];
  marketplace_products?: MarketplaceProduct[];
}

export function useMasterListings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: masterListings, isLoading, error } = useQuery({
    queryKey: ['master-listings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('master_listings')
        .select(`
          *,
          images:master_listing_images(*),
          variants:master_listing_variants(*),
          marketplace_products(
            *,
            marketplace_connection:marketplace_connections(marketplace, store_name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as MasterListing[];
    },
    enabled: !!user,
  });

  const createMasterListing = useMutation({
    mutationFn: async (listing: Partial<MasterListing>) => {
      if (!user) throw new Error("Not authenticated");

      const insertData = {
        user_id: user.id,
        title: listing.title || 'Yeni Ürün',
        description: listing.description,
        base_price: listing.base_price || 0,
        total_stock: listing.total_stock || 0,
        internal_sku: listing.internal_sku,
        brand: listing.brand,
        normalized_attributes: listing.normalized_attributes || {},
        source_marketplace: listing.source_marketplace,
        source_category_id: listing.source_category_id,
        source_category_path: listing.source_category_path,
        variant_options: listing.variant_options,
        tags: listing.tags,
        materials: listing.materials,
        who_made_it: listing.who_made_it,
        what_is_it: listing.what_is_it,
        when_made: listing.when_made,
        personalization_enabled: listing.personalization_enabled,
        personalization_instructions: listing.personalization_instructions,
      };

      // Use type assertion since new columns may not be in generated types yet
      const { data, error } = await supabase
        .from('master_listings')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const updateData = {
        title: updates.title,
        description: updates.description,
        base_price: updates.base_price,
        total_stock: updates.total_stock,
        internal_sku: updates.internal_sku,
        brand: updates.brand,
        normalized_attributes: updates.normalized_attributes,
        source_marketplace: updates.source_marketplace,
        source_category_id: updates.source_category_id,
        source_category_path: updates.source_category_path,
        variant_options: updates.variant_options,
        tags: updates.tags,
        materials: updates.materials,
        who_made_it: updates.who_made_it,
        what_is_it: updates.what_is_it,
        when_made: updates.when_made,
        personalization_enabled: updates.personalization_enabled,
        personalization_instructions: updates.personalization_instructions,
      };

      const { data, error } = await supabase
        .from('master_listings')
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
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
        .from('master_listings')
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

      // Get current max sort order
      const { data: existing } = await supabase
        .from('master_listing_images')
        .select('sort_order')
        .eq('master_listing_id', masterListingId)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextSortOrder = (existing?.[0]?.sort_order ?? -1) + 1;

      const { data, error } = await supabase
        .from('master_listing_images')
        .insert({
          user_id: user.id,
          master_listing_id: masterListingId,
          url,
          is_primary: isPrimary,
          sort_order: nextSortOrder,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
    mutationFn: async (imageId: string) => {
      const { error } = await supabase
        .from('master_listing_images')
        .delete()
        .eq('id', imageId);

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
