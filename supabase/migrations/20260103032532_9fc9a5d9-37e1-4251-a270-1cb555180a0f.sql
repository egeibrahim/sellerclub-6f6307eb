-- Add images column to products table for storing image URLs
ALTER TABLE public.products
ADD COLUMN images text[] DEFAULT '{}'::text[];