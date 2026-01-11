-- Add columns needed for Trendyol category sync
ALTER TABLE public.marketplace_categories 
ADD COLUMN IF NOT EXISTS marketplace_id text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS remote_id text,
ADD COLUMN IF NOT EXISTS parent_id text,
ADD COLUMN IF NOT EXISTS full_path text;

-- Create unique constraint for upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_categories_marketplace_remote 
ON public.marketplace_categories(marketplace_id, remote_id) 
WHERE remote_id IS NOT NULL;