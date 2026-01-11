
-- Create enum for marketplace identifiers
CREATE TYPE public.marketplace_id AS ENUM ('trendyol', 'hepsiburada', 'ikas', 'ciceksepeti', 'ticimax', 'amazon', 'etsy', 'n11');

-- Create enum for sync status
CREATE TYPE public.sync_status AS ENUM ('pending', 'syncing', 'synced', 'error');

-- Master Listings: Normalize edilmiş merkezi ürün bilgileri
CREATE TABLE public.master_listings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    internal_sku TEXT,
    title TEXT NOT NULL,
    description TEXT,
    base_price NUMERIC NOT NULL DEFAULT 0,
    total_stock INTEGER NOT NULL DEFAULT 0,
    normalized_attributes JSONB DEFAULT '{}'::jsonb,
    brand TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on master_listings
ALTER TABLE public.master_listings ENABLE ROW LEVEL SECURITY;

-- RLS policies for master_listings
CREATE POLICY "Users can view own master listings" ON public.master_listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own master listings" ON public.master_listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own master listings" ON public.master_listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own master listings" ON public.master_listings FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_master_listings_updated_at
BEFORE UPDATE ON public.master_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Master Listing Images
CREATE TABLE public.master_listing_images (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    master_listing_id UUID NOT NULL REFERENCES public.master_listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.master_listing_images ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own master listing images" ON public.master_listing_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own master listing images" ON public.master_listing_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own master listing images" ON public.master_listing_images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own master listing images" ON public.master_listing_images FOR DELETE USING (auth.uid() = user_id);

-- Master Listing Variants
CREATE TABLE public.master_listing_variants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    master_listing_id UUID NOT NULL REFERENCES public.master_listings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    sku TEXT,
    name TEXT NOT NULL,
    price_adjustment NUMERIC NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.master_listing_variants ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own master listing variants" ON public.master_listing_variants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own master listing variants" ON public.master_listing_variants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own master listing variants" ON public.master_listing_variants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own master listing variants" ON public.master_listing_variants FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_master_listing_variants_updated_at
BEFORE UPDATE ON public.master_listing_variants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Marketplace Connections: Kullanıcının bağlı mağazaları
CREATE TABLE public.marketplace_connections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    marketplace marketplace_id NOT NULL,
    store_name TEXT,
    credentials JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, marketplace)
);

-- Enable RLS
ALTER TABLE public.marketplace_connections ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own marketplace connections" ON public.marketplace_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own marketplace connections" ON public.marketplace_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own marketplace connections" ON public.marketplace_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own marketplace connections" ON public.marketplace_connections FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_marketplace_connections_updated_at
BEFORE UPDATE ON public.marketplace_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Marketplace Products: Her pazaryerine özgü ürün kaydı
CREATE TABLE public.marketplace_products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    master_listing_id UUID NOT NULL REFERENCES public.master_listings(id) ON DELETE CASCADE,
    marketplace_connection_id UUID NOT NULL REFERENCES public.marketplace_connections(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    remote_product_id TEXT,
    remote_category_id TEXT,
    remote_category_name TEXT,
    marketplace_specific_data JSONB DEFAULT '{}'::jsonb,
    price_markup NUMERIC NOT NULL DEFAULT 0,
    sync_status sync_status NOT NULL DEFAULT 'pending',
    last_synced_at TIMESTAMP WITH TIME ZONE,
    sync_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(master_listing_id, marketplace_connection_id)
);

-- Enable RLS
ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own marketplace products" ON public.marketplace_products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own marketplace products" ON public.marketplace_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own marketplace products" ON public.marketplace_products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own marketplace products" ON public.marketplace_products FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_marketplace_products_updated_at
BEFORE UPDATE ON public.marketplace_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Category Mappings: Kategori eşleştirme tablosu
CREATE TABLE public.category_mappings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    source_marketplace marketplace_id NOT NULL,
    source_category_id TEXT NOT NULL,
    source_category_name TEXT NOT NULL,
    target_marketplace marketplace_id NOT NULL,
    target_category_id TEXT NOT NULL,
    target_category_name TEXT NOT NULL,
    confidence_score NUMERIC DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_by TEXT NOT NULL DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(source_marketplace, source_category_id, target_marketplace)
);

-- Enable RLS
ALTER TABLE public.category_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies (global mappings visible to all authenticated users, user-specific editable)
CREATE POLICY "Authenticated users can view category mappings" ON public.category_mappings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert category mappings" ON public.category_mappings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own or unowned category mappings" ON public.category_mappings FOR UPDATE TO authenticated USING (user_id IS NULL OR auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_category_mappings_updated_at
BEFORE UPDATE ON public.category_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Attribute Mappings: Attribute eşleştirme tablosu
CREATE TABLE public.attribute_mappings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    source_marketplace marketplace_id NOT NULL,
    source_attribute TEXT NOT NULL,
    source_value TEXT,
    target_marketplace marketplace_id NOT NULL,
    target_attribute_id TEXT NOT NULL,
    target_attribute_name TEXT NOT NULL,
    target_value_id TEXT,
    target_value_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attribute_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view attribute mappings" ON public.attribute_mappings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert attribute mappings" ON public.attribute_mappings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update own or unowned attribute mappings" ON public.attribute_mappings FOR UPDATE TO authenticated USING (user_id IS NULL OR auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_attribute_mappings_updated_at
BEFORE UPDATE ON public.attribute_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add master_listing_id column to products table for linking
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS master_listing_id UUID REFERENCES public.master_listings(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_master_listings_user_id ON public.master_listings(user_id);
CREATE INDEX idx_master_listing_images_master_listing_id ON public.master_listing_images(master_listing_id);
CREATE INDEX idx_master_listing_variants_master_listing_id ON public.master_listing_variants(master_listing_id);
CREATE INDEX idx_marketplace_connections_user_id ON public.marketplace_connections(user_id);
CREATE INDEX idx_marketplace_products_master_listing_id ON public.marketplace_products(master_listing_id);
CREATE INDEX idx_marketplace_products_marketplace_connection_id ON public.marketplace_products(marketplace_connection_id);
CREATE INDEX idx_marketplace_products_sync_status ON public.marketplace_products(sync_status);
CREATE INDEX idx_category_mappings_source ON public.category_mappings(source_marketplace, source_category_id);
CREATE INDEX idx_category_mappings_target ON public.category_mappings(target_marketplace, target_category_id);
CREATE INDEX idx_attribute_mappings_source ON public.attribute_mappings(source_marketplace, source_attribute);
CREATE INDEX idx_products_master_listing_id ON public.products(master_listing_id);
