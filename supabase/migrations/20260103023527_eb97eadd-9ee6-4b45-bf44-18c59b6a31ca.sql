-- Insert ikas main categories (static data)
INSERT INTO public.marketplace_categories (id, marketplace_id, remote_id, name, full_path, parent_id, required_fields)
VALUES
  (gen_random_uuid(), 'ikas', 'ikas-giyim', 'Giyim', 'Giyim', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'ikas', 'ikas-aksesuar', 'Aksesuar', 'Aksesuar', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'ikas', 'ikas-elektronik', 'Elektronik', 'Elektronik', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'ikas', 'ikas-ev', 'Ev & Yaşam', 'Ev & Yaşam', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'ikas', 'ikas-kozmetik', 'Kozmetik', 'Kozmetik', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'ikas', 'ikas-spor', 'Spor & Outdoor', 'Spor & Outdoor', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'ikas', 'ikas-kitap', 'Kitap & Hobi', 'Kitap & Hobi', NULL, ARRAY[]::text[]),
  (gen_random_uuid(), 'ikas', 'ikas-bebek', 'Bebek & Çocuk', 'Bebek & Çocuk', NULL, ARRAY[]::text[])
ON CONFLICT DO NOTHING;

-- Insert subcategories for Giyim
INSERT INTO public.marketplace_categories (id, marketplace_id, remote_id, name, full_path, parent_id, required_fields)
SELECT gen_random_uuid(), 'ikas', subcat.remote_id, subcat.name, 'Giyim > ' || subcat.name, 
  (SELECT id FROM public.marketplace_categories WHERE remote_id = 'ikas-giyim' AND marketplace_id = 'ikas' LIMIT 1),
  ARRAY[]::text[]
FROM (VALUES 
  ('ikas-giyim-tisort', 'T-shirt & Atlet'),
  ('ikas-giyim-gomlek', 'Gömlek'),
  ('ikas-giyim-elbise', 'Elbise'),
  ('ikas-giyim-pantolon', 'Pantolon'),
  ('ikas-giyim-etek', 'Etek'),
  ('ikas-giyim-dis', 'Dış Giyim'),
  ('ikas-giyim-triko', 'Triko & Kazak'),
  ('ikas-giyim-sort', 'Şort & Bermuda')
) AS subcat(remote_id, name)
ON CONFLICT DO NOTHING;

-- Insert subcategories for Aksesuar
INSERT INTO public.marketplace_categories (id, marketplace_id, remote_id, name, full_path, parent_id, required_fields)
SELECT gen_random_uuid(), 'ikas', subcat.remote_id, subcat.name, 'Aksesuar > ' || subcat.name, 
  (SELECT id FROM public.marketplace_categories WHERE remote_id = 'ikas-aksesuar' AND marketplace_id = 'ikas' LIMIT 1),
  ARRAY[]::text[]
FROM (VALUES 
  ('ikas-aksesuar-canta', 'Çanta'),
  ('ikas-aksesuar-cuzdan', 'Cüzdan'),
  ('ikas-aksesuar-kemer', 'Kemer'),
  ('ikas-aksesuar-saat', 'Saat'),
  ('ikas-aksesuar-gozluk', 'Gözlük'),
  ('ikas-aksesuar-sapka', 'Şapka'),
  ('ikas-aksesuar-takim', 'Takı')
) AS subcat(remote_id, name)
ON CONFLICT DO NOTHING;

-- Insert subcategories for Elektronik
INSERT INTO public.marketplace_categories (id, marketplace_id, remote_id, name, full_path, parent_id, required_fields)
SELECT gen_random_uuid(), 'ikas', subcat.remote_id, subcat.name, 'Elektronik > ' || subcat.name, 
  (SELECT id FROM public.marketplace_categories WHERE remote_id = 'ikas-elektronik' AND marketplace_id = 'ikas' LIMIT 1),
  ARRAY[]::text[]
FROM (VALUES 
  ('ikas-elektronik-telefon', 'Telefon Aksesuarları'),
  ('ikas-elektronik-bilgisayar', 'Bilgisayar Aksesuarları'),
  ('ikas-elektronik-kulaklik', 'Kulaklık & Hoparlör'),
  ('ikas-elektronik-powerbank', 'Powerbank'),
  ('ikas-elektronik-kablo', 'Kablo & Şarj'),
  ('ikas-elektronik-gaming', 'Gaming')
) AS subcat(remote_id, name)
ON CONFLICT DO NOTHING;

-- Insert subcategories for Ev & Yaşam
INSERT INTO public.marketplace_categories (id, marketplace_id, remote_id, name, full_path, parent_id, required_fields)
SELECT gen_random_uuid(), 'ikas', subcat.remote_id, subcat.name, 'Ev & Yaşam > ' || subcat.name, 
  (SELECT id FROM public.marketplace_categories WHERE remote_id = 'ikas-ev' AND marketplace_id = 'ikas' LIMIT 1),
  ARRAY[]::text[]
FROM (VALUES 
  ('ikas-ev-dekorasyon', 'Dekorasyon'),
  ('ikas-ev-mutfak', 'Mutfak'),
  ('ikas-ev-banyo', 'Banyo'),
  ('ikas-ev-aydinlatma', 'Aydınlatma'),
  ('ikas-ev-tekstil', 'Ev Tekstili'),
  ('ikas-ev-mobilya', 'Mobilya')
) AS subcat(remote_id, name)
ON CONFLICT DO NOTHING;