-- Add Etsy-style fields to master_listings table
ALTER TABLE public.master_listings ADD COLUMN IF NOT EXISTS source_marketplace text;
ALTER TABLE public.master_listings ADD COLUMN IF NOT EXISTS source_category_id text;
ALTER TABLE public.master_listings ADD COLUMN IF NOT EXISTS source_category_path text;
ALTER TABLE public.master_listings ADD COLUMN IF NOT EXISTS variant_options jsonb DEFAULT '{}';
ALTER TABLE public.master_listings ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.master_listings ADD COLUMN IF NOT EXISTS materials text;
ALTER TABLE public.master_listings ADD COLUMN IF NOT EXISTS who_made_it text;
ALTER TABLE public.master_listings ADD COLUMN IF NOT EXISTS what_is_it text;
ALTER TABLE public.master_listings ADD COLUMN IF NOT EXISTS when_made text;
ALTER TABLE public.master_listings ADD COLUMN IF NOT EXISTS personalization_enabled boolean DEFAULT false;
ALTER TABLE public.master_listings ADD COLUMN IF NOT EXISTS personalization_instructions text;
ALTER TABLE public.master_listings ADD COLUMN IF NOT EXISTS shipping_profile_id uuid;

-- Add fields to master_listing_variants table
ALTER TABLE public.master_listing_variants ADD COLUMN IF NOT EXISTS color_code text;
ALTER TABLE public.master_listing_variants ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';
ALTER TABLE public.master_listing_variants ADD COLUMN IF NOT EXISTS is_visible boolean DEFAULT true;
ALTER TABLE public.master_listing_variants ADD COLUMN IF NOT EXISTS processing_time text;
ALTER TABLE public.master_listing_variants ADD COLUMN IF NOT EXISTS option_values jsonb DEFAULT '{}';