-- Insert Trendyol main categories (static data since API is blocked by Cloudflare)
INSERT INTO public.marketplace_categories (id, marketplace_id, remote_id, name, full_path, parent_id, required_fields)
VALUES
  (gen_random_uuid(), 'trendyol', '387', 'Erkek', 'Erkek', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'trendyol', '388', 'Kadın', 'Kadın', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'trendyol', '389', 'Anne & Çocuk', 'Anne & Çocuk', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'trendyol', '390', 'Ev & Yaşam', 'Ev & Yaşam', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'trendyol', '391', 'Süpermarket', 'Süpermarket', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'trendyol', '392', 'Kozmetik', 'Kozmetik', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'trendyol', '393', 'Ayakkabı & Çanta', 'Ayakkabı & Çanta', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'trendyol', '394', 'Elektronik', 'Elektronik', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'trendyol', '395', 'Spor & Outdoor', 'Spor & Outdoor', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'trendyol', '396', 'Çok Satanlar', 'Çok Satanlar', NULL, ARRAY[]::text[])
ON CONFLICT DO NOTHING;

-- Insert some subcategories for Erkek
INSERT INTO public.marketplace_categories (id, marketplace_id, remote_id, name, full_path, parent_id, required_fields)
SELECT gen_random_uuid(), 'trendyol', subcat.remote_id, subcat.name, 'Erkek > ' || subcat.name, 
  (SELECT id FROM public.marketplace_categories WHERE remote_id = '387' AND marketplace_id = 'trendyol' LIMIT 1),
  ARRAY[]::text[]
FROM (VALUES 
  ('601', 'Giyim'),
  ('602', 'T-shirt'),
  ('603', 'Gömlek'),
  ('604', 'Pantolon'),
  ('605', 'Mont & Kaban'),
  ('606', 'Sweatshirt'),
  ('607', 'Ceket'),
  ('608', 'Takım Elbise')
) AS subcat(remote_id, name)
ON CONFLICT DO NOTHING;

-- Insert some subcategories for Kadın
INSERT INTO public.marketplace_categories (id, marketplace_id, remote_id, name, full_path, parent_id, required_fields)
SELECT gen_random_uuid(), 'trendyol', subcat.remote_id, subcat.name, 'Kadın > ' || subcat.name, 
  (SELECT id FROM public.marketplace_categories WHERE remote_id = '388' AND marketplace_id = 'trendyol' LIMIT 1),
  ARRAY[]::text[]
FROM (VALUES 
  ('701', 'Elbise'),
  ('702', 'Bluz'),
  ('703', 'Etek'),
  ('704', 'Pantolon'),
  ('705', 'Mont & Kaban'),
  ('706', 'Triko'),
  ('707', 'Ceket')
) AS subcat(remote_id, name)
ON CONFLICT DO NOTHING;

-- Insert some subcategories for Elektronik
INSERT INTO public.marketplace_categories (id, marketplace_id, remote_id, name, full_path, parent_id, required_fields)
SELECT gen_random_uuid(), 'trendyol', subcat.remote_id, subcat.name, 'Elektronik > ' || subcat.name, 
  (SELECT id FROM public.marketplace_categories WHERE remote_id = '394' AND marketplace_id = 'trendyol' LIMIT 1),
  ARRAY[]::text[]
FROM (VALUES 
  ('801', 'Telefon & Aksesuar'),
  ('802', 'Bilgisayar & Tablet'),
  ('803', 'TV & Görüntü'),
  ('804', 'Ses Sistemleri'),
  ('805', 'Oyun & Oyun Konsolları'),
  ('806', 'Fotoğraf & Kamera'),
  ('807', 'Beyaz Eşya')
) AS subcat(remote_id, name)
ON CONFLICT DO NOTHING;