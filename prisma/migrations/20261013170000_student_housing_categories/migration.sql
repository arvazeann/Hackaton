BEGIN;

DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM categories
    WHERE slug NOT IN (
      'anak-bayi',
      'buku',
      'elektronik',
      'fashion-pria',
      'fashion-wanita',
      'hobi',
      'lainnya',
      'olahraga',
      'otomotif',
      'perabot',
      'furnitur-penyimpanan',
      'perlengkapan-tidur',
      'dapur',
      'kebersihan-laundry',
      'belajar-kerja'
    )
  ) THEN
    RAISE EXCEPTION 'Unmapped product categories exist; audit them before applying the RuangLagi category migration.';
  END IF;
END
$migration$;

INSERT INTO categories (id, name, slug)
VALUES
  (gen_random_uuid(), 'Furnitur & penyimpanan', 'furnitur-penyimpanan'),
  (gen_random_uuid(), 'Perlengkapan tidur', 'perlengkapan-tidur'),
  (gen_random_uuid(), 'Elektronik', 'elektronik'),
  (gen_random_uuid(), 'Dapur', 'dapur'),
  (gen_random_uuid(), 'Kebersihan & laundry', 'kebersihan-laundry'),
  (gen_random_uuid(), 'Belajar & kerja', 'belajar-kerja'),
  (gen_random_uuid(), 'Lainnya', 'lainnya')
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name;

DO $migration$
BEGIN
  IF (SELECT count(*) FROM categories WHERE slug IN (
    'furnitur-penyimpanan',
    'perlengkapan-tidur',
    'elektronik',
    'dapur',
    'kebersihan-laundry',
    'belajar-kerja',
    'lainnya'
  )) <> 7 THEN
    RAISE EXCEPTION 'A target product category conflicts with existing category data.';
  END IF;
END
$migration$;

WITH product_categories AS (
  SELECT
    product.id,
    CASE
      WHEN product.title ILIKE ANY (ARRAY['%kasur%', '%bantal%', '%sprei%', '%selimut%', '%guling%']) THEN 'perlengkapan-tidur'
      WHEN product.title ILIKE ANY (ARRAY['%rice cooker%', '%panci%', '%wajan%', '%kompor%', '%alat makan%', '%peralatan kopi%', '%dapur%', '%spatula%', '%teko%']) THEN 'dapur'
      WHEN product.title ILIKE ANY (ARRAY['%sapu%', '%pengki%', '%pel %', '%keset%', '%deterjen%', '%jemuran%', '%kebersihan%', '%vacuum%']) THEN 'kebersihan-laundry'
      WHEN product.title ILIKE ANY (ARRAY['%kamera%', '%laptop%', '%headphone%', '%lampu%', '%speaker%', '%charger%', '%printer%', '%kipas%', '%setrika%', '%elektronik%', '%tablet%']) THEN 'elektronik'
      WHEN product.title ILIKE ANY (ARRAY['%buku%', '%novel%', '%belajar%', '%alat tulis%', '%kuliah%', '%kerja%']) THEN 'belajar-kerja'
      WHEN product.title ILIKE ANY (ARRAY['%kursi%', '%meja%', '%rak%', '%lemari%', '%laci%', '%kotak penyimpanan%']) THEN 'furnitur-penyimpanan'
      WHEN product.title ILIKE ANY (ARRAY['%sneaker%', '%baju%', '%kemeja%', '%jaket%', '%tas%', '%sepeda%', '%tanaman%', '%vas %', '%jam tangan%']) THEN 'lainnya'
      WHEN old_category.slug = 'perabot' THEN 'furnitur-penyimpanan'
      WHEN old_category.slug = 'buku' THEN 'belajar-kerja'
      WHEN old_category.slug = 'elektronik' THEN 'elektronik'
      WHEN old_category.slug IN (
        'furnitur-penyimpanan',
        'perlengkapan-tidur',
        'dapur',
        'kebersihan-laundry',
        'belajar-kerja',
        'lainnya'
      ) THEN old_category.slug
      ELSE 'lainnya'
    END AS target_slug
  FROM products AS product
  JOIN categories AS old_category ON old_category.id = product.category_id
)
UPDATE products AS product
SET category_id = target.id
FROM product_categories AS mapped
JOIN categories AS target ON target.slug = mapped.target_slug
WHERE product.id = mapped.id
  AND product.category_id <> target.id;

DELETE FROM categories
WHERE slug NOT IN (
  'furnitur-penyimpanan',
  'perlengkapan-tidur',
  'elektronik',
  'dapur',
  'kebersihan-laundry',
  'belajar-kerja',
  'lainnya'
);

COMMIT;
