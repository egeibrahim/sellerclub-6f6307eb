-- Insert Hepsiburada main categories (static data)
INSERT INTO public.marketplace_categories (id, marketplace_id, remote_id, name, full_path, parent_id, required_fields)
VALUES
  (gen_random_uuid(), 'hepsiburada', 'hb-erkek', 'Erkek', 'Erkek', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'hepsiburada', 'hb-kadin', 'Kadın', 'Kadın', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'hepsiburada', 'hb-anne-cocuk', 'Anne & Bebek', 'Anne & Bebek', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'hepsiburada', 'hb-ev-yasam', 'Ev & Yaşam', 'Ev & Yaşam', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'hepsiburada', 'hb-supermarket', 'Süpermarket', 'Süpermarket', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'hepsiburada', 'hb-kozmetik', 'Kozmetik & Kişisel Bakım', 'Kozmetik & Kişisel Bakım', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'hepsiburada', 'hb-ayakkabi', 'Ayakkabı & Çanta', 'Ayakkabı & Çanta', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'hepsiburada', 'hb-elektronik', 'Elektronik', 'Elektronik', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'hepsiburada', 'hb-spor', 'Spor & Outdoor', 'Spor & Outdoor', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'hepsiburada', 'hb-kitap', 'Kitap & Kırtasiye', 'Kitap & Kırtasiye', NULL, ARRAY[]::text[])
ON CONFLICT DO NOTHING;

-- Insert subcategories for Erkek
INSERT INTO public.marketplace_categories (id, marketplace_id, remote_id, name, full_path, parent_id, required_fields)
SELECT gen_random_uuid(), 'hepsiburada', subcat.remote_id, subcat.name, 'Erkek > ' || subcat.name, 
  (SELECT id FROM public.marketplace_categories WHERE remote_id = 'hb-erkek' AND marketplace_id = 'hepsiburada' LIMIT 1),
  ARRAY[]::text[]
FROM (VALUES 
  ('hb-erkek-tisort', 'T-shirt'),
  ('hb-erkek-gomlek', 'Gömlek'),
  ('hb-erkek-pantolon', 'Pantolon'),
  ('hb-erkek-mont', 'Mont & Kaban'),
  ('hb-erkek-sweatshirt', 'Sweatshirt'),
  ('hb-erkek-ceket', 'Ceket'),
  ('hb-erkek-takim', 'Takım Elbise'),
  ('hb-erkek-sort', 'Şort')
) AS subcat(remote_id, name)
ON CONFLICT DO NOTHING;

-- Insert subcategories for Kadın
INSERT INTO public.marketplace_categories (id, marketplace_id, remote_id, name, full_path, parent_id, required_fields)
SELECT gen_random_uuid(), 'hepsiburada', subcat.remote_id, subcat.name, 'Kadın > ' || subcat.name, 
  (SELECT id FROM public.marketplace_categories WHERE remote_id = 'hb-kadin' AND marketplace_id = 'hepsiburada' LIMIT 1),
  ARRAY[]::text[]
FROM (VALUES 
  ('hb-kadin-elbise', 'Elbise'),
  ('hb-kadin-bluz', 'Bluz'),
  ('hb-kadin-etek', 'Etek'),
  ('hb-kadin-pantolon', 'Pantolon'),
  ('hb-kadin-mont', 'Mont & Kaban'),
  ('hb-kadin-triko', 'Triko'),
  ('hb-kadin-ceket', 'Ceket'),
  ('hb-kadin-mayo', 'Mayo & Bikini')
) AS subcat(remote_id, name)
ON CONFLICT DO NOTHING;

-- Insert subcategories for Elektronik
INSERT INTO public.marketplace_categories (id, marketplace_id, remote_id, name, full_path, parent_id, required_fields)
SELECT gen_random_uuid(), 'hepsiburada', subcat.remote_id, subcat.name, 'Elektronik > ' || subcat.name, 
  (SELECT id FROM public.marketplace_categories WHERE remote_id = 'hb-elektronik' AND marketplace_id = 'hepsiburada' LIMIT 1),
  ARRAY[]::text[]
FROM (VALUES 
  ('hb-elektronik-telefon', 'Telefon & Aksesuar'),
  ('hb-elektronik-bilgisayar', 'Bilgisayar & Tablet'),
  ('hb-elektronik-tv', 'TV & Görüntü'),
  ('hb-elektronik-ses', 'Ses Sistemleri'),
  ('hb-elektronik-oyun', 'Oyun & Konsol'),
  ('hb-elektronik-kamera', 'Fotoğraf & Kamera'),
  ('hb-elektronik-beyaz', 'Beyaz Eşya')
) AS subcat(remote_id, name)
ON CONFLICT DO NOTHING;

-- Insert subcategories for Ayakkabı & Çanta
INSERT INTO public.marketplace_categories (id, marketplace_id, remote_id, name, full_path, parent_id, required_fields)
SELECT gen_random_uuid(), 'hepsiburada', subcat.remote_id, subcat.name, 'Ayakkabı & Çanta > ' || subcat.name, 
  (SELECT id FROM public.marketplace_categories WHERE remote_id = 'hb-ayakkabi' AND marketplace_id = 'hepsiburada' LIMIT 1),
  ARRAY[]::text[]
FROM (VALUES 
  ('hb-ayakkabi-erkek', 'Erkek Ayakkabı'),
  ('hb-ayakkabi-kadin', 'Kadın Ayakkabı'),
  ('hb-ayakkabi-cocuk', 'Çocuk Ayakkabı'),
  ('hb-canta-erkek', 'Erkek Çanta'),
  ('hb-canta-kadin', 'Kadın Çanta'),
  ('hb-cuzdan', 'Cüzdan'),
  ('hb-valiz', 'Valiz & Bavul')
) AS subcat(remote_id, name)
ON CONFLICT DO NOTHING;