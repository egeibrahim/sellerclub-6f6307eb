-- Add source column to products table to track where products came from
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

-- Add comment for clarity
COMMENT ON COLUMN public.products.source IS 'Source of the product: manual, ikas, or trendyol';