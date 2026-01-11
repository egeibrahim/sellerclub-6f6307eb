-- Drop the existing check constraint
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;

-- Add updated check constraint that includes 'copy'
ALTER TABLE public.products ADD CONSTRAINT products_status_check 
CHECK (status IN ('draft', 'active', 'archived', 'copy'));