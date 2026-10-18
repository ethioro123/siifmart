-- ============================================================================
-- Migration: 20261018_seed_five_cross_category_products.sql
-- Purpose: Seed 5 canonical products across 5 distinct departments/categories
--          for Ethiopia (ET, ETB) and Kenya (KE, KES) in product_master,
--          sku_counters, and active operational sites (Stores, Warehouses, DCs).
-- ============================================================================

BEGIN;

-- 1. Advance atomic SKU counters so future UI-generated SKUs start at 002+
INSERT INTO public.sku_counters (country_code, category_prefix, last_value)
VALUES
  ('ET', 'DY', 1),
  ('ET', 'SA', 1),
  ('ET', 'BB', 1),
  ('ET', 'LD', 1),
  ('ET', 'EL', 1),
  ('KE', 'DY', 1),
  ('KE', 'SA', 1),
  ('KE', 'BB', 1),
  ('KE', 'LD', 1),
  ('KE', 'EL', 1)
ON CONFLICT (country_code, category_prefix)
DO UPDATE SET last_value = GREATEST(public.sku_counters.last_value, EXCLUDED.last_value);

-- 2. Upsert Country-Scoped Master Catalog Records (product_master)
WITH sample_catalog (
  country_code, sku, name, category, barcode, brand, unit, size, pack_quantity,
  cost_price, price_band_min, price_band_max
) AS (
  VALUES
    -- ETHIOPIA (ET - ETB)
    ('ET', 'ETDY001', 'Full Cream UHT Fresh Milk 1L',             'Dairy, Eggs & Fridge',      '6001000001016', 'Shola Dairy',  'liter',  '1L',   12,  95.00,  115.00, 145.00),
    ('ET', 'ETSA001', 'Pure Sunflower Cooking Oil 3L',            'Sauces, Oils & Condiments', '6001000002013', 'SunGold',      'bottle', '3L',    6, 480.00,  550.00, 650.00),
    ('ET', 'ETBB001', 'Stage 1 Infant Milk Formula 800g',         'Baby Food & Formula',       '6001000003010', 'NutriBaby',    'can',    '800g',  6, 920.00, 1080.00, 1250.00),
    ('ET', 'ETLD001', 'Multi-Enzyme Laundry Detergent Powder 2kg','Laundry & Dishwashing',     '6001000004017', 'CleanWave',    'bag',    '2kg',   8, 310.00,  375.00, 440.00),
    ('ET', 'ETEL001', 'Rechargeable Emergency LED Lantern',       'Electronics & Batteries',   '6001000005014', 'LuminaTech',   'piece',  '12W',   4, 850.00, 1050.00, 1290.00),
    -- KENYA (KE - KES)
    ('KE', 'KEDY001', 'Full Cream UHT Fresh Milk 1L',             'Dairy, Eggs & Fridge',      '6001000001016', 'Brookside',    'liter',  '1L',   12, 115.00,  140.00, 175.00),
    ('KE', 'KESA001', 'Pure Sunflower Cooking Oil 3L',            'Sauces, Oils & Condiments', '6001000002013', 'Elianto',      'bottle', '3L',    6, 690.00,  820.00, 950.00),
    ('KE', 'KEBB001', 'Stage 1 Infant Milk Formula 800g',         'Baby Food & Formula',       '6001000003010', 'NutriBaby',    'can',    '800g',  6, 1450.00, 1720.00, 1980.00),
    ('KE', 'KELD001', 'Multi-Enzyme Laundry Detergent Powder 2kg','Laundry & Dishwashing',     '6001000004017', 'CleanWave',    'bag',    '2kg',   8, 460.00,  560.00, 650.00),
    ('KE', 'KEEL001', 'Rechargeable Emergency LED Lantern',       'Electronics & Batteries',   '6001000005014', 'LuminaTech',   'piece',  '12W',   4, 1350.00, 1680.00, 1990.00)
)
INSERT INTO public.product_master (
  country_code, sku, name, category, barcode, brand, unit, size, pack_quantity,
  cost_price, price_band_min, price_band_max, status, approved_by, approved_at
)
SELECT
  sc.country_code, sc.sku, sc.name, sc.category, sc.barcode, sc.brand, sc.unit, sc.size, sc.pack_quantity,
  sc.cost_price, sc.price_band_min, sc.price_band_max, 'APPROVED', 'System Seed', now()
FROM sample_catalog sc
ON CONFLICT (country_code, sku)
DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  barcode = EXCLUDED.barcode,
  brand = EXCLUDED.brand,
  unit = EXCLUDED.unit,
  size = EXCLUDED.size,
  pack_quantity = EXCLUDED.pack_quantity,
  cost_price = EXCLUDED.cost_price,
  price_band_min = EXCLUDED.price_band_min,
  price_band_max = EXCLUDED.price_band_max,
  status = 'APPROVED',
  updated_at = now();

-- 3. Seed Facility-Level Inventory Rows (public.products) Across Active Operational Sites
WITH product_specs (
  country_code, sku, price, cost_price, location, shelf_position,
  batch_number, expiry_date, sales_velocity, description, min_stock, max_stock
) AS (
  VALUES
    -- ETHIOPIA (ET - ETB)
    ('ET', 'ETDY001',  125.00,  95.00, 'A-01-01', 'Top Shelf',    'BATCH-DY-2610', DATE '2027-04-15', 'High',   'Pasteurized full cream UHT milk in aseptic 1L carton.', 20, 300),
    ('ET', 'ETSA001',  590.00, 480.00, 'B-01-02', 'Eye Level',    'BATCH-SA-2610', DATE '2027-10-18', 'High',   'Triple-refined cholesterol-free pure sunflower cooking oil.', 15, 250),
    ('ET', 'ETBB001', 1150.00, 920.00, 'C-01-01', 'Eye Level',    'BATCH-BB-2610', DATE '2027-12-01', 'Medium', 'Iron-fortified Stage 1 infant milk formula powder (0-6 months).', 10, 150),
    ('ET', 'ETLD001',  395.00, 310.00, 'D-01-03', 'Bottom Shelf', 'BATCH-LD-2610', NULL,              'High',   'High-efficiency multi-enzyme laundry washing powder for hand and machine wash.', 15, 200),
    ('ET', 'ETEL001', 1150.00, 850.00, 'E-01-01', 'Middle Shelf', 'BATCH-EL-2610', NULL,              'Medium', 'Dual-mode 12W rechargeable LED emergency lantern with USB charging port.', 8, 100),
    -- KENYA (KE - KES)
    ('KE', 'KEDY001',  155.00, 115.00, 'A-01-01', 'Top Shelf',    'BATCH-DY-2610', DATE '2027-04-15', 'High',   'Pasteurized full cream UHT milk in aseptic 1L carton.', 20, 300),
    ('KE', 'KESA001',  860.00, 690.00, 'B-01-02', 'Eye Level',    'BATCH-SA-2610', DATE '2027-10-18', 'High',   'Triple-refined cholesterol-free pure sunflower cooking oil.', 15, 250),
    ('KE', 'KEBB001', 1820.00, 1450.00,'C-01-01', 'Eye Level',    'BATCH-BB-2610', DATE '2027-12-01', 'Medium', 'Iron-fortified Stage 1 infant milk formula powder (0-6 months).', 10, 150),
    ('KE', 'KELD001',  590.00, 460.00, 'D-01-03', 'Bottom Shelf', 'BATCH-LD-2610', NULL,              'High',   'High-efficiency multi-enzyme laundry washing powder for hand and machine wash.', 15, 200),
    ('KE', 'KEEL001', 1790.00, 1350.00,'E-01-01', 'Middle Shelf', 'BATCH-EL-2610', NULL,              'Medium', 'Dual-mode 12W rechargeable LED emergency lantern with USB charging port.', 8, 100)
),
operational_sites AS (
  SELECT id, country, type
  FROM public.sites
  WHERE status = 'Active'
    AND country IN ('ET', 'KE')
    AND type IN ('Store', 'Warehouse', 'Distribution Center', 'Dark Store')
)
INSERT INTO public.products (
  site_id, master_id, name, sku, category, price, cost_price, stock, status,
  location, shelf_position, expiry_date, batch_number, sales_velocity,
  barcode, barcode_type, barcodes, brand, size, unit, pack_quantity,
  approval_status, approved_by, approved_at, description, min_stock, max_stock
)
SELECT
  s.id AS site_id,
  pm.id AS master_id,
  pm.name,
  pm.sku,
  pm.category,
  ps.price,
  ps.cost_price,
  CASE
    WHEN s.type IN ('Warehouse', 'Distribution Center') THEN 180
    ELSE 45
  END AS stock,
  'active' AS status,
  ps.location,
  ps.shelf_position,
  ps.expiry_date,
  ps.batch_number,
  ps.sales_velocity,
  pm.barcode,
  'EAN-13' AS barcode_type,
  ARRAY[pm.barcode] AS barcodes,
  pm.brand,
  pm.size,
  pm.unit,
  pm.pack_quantity,
  'approved' AS approval_status,
  'System Seed' AS approved_by,
  now() AS approved_at,
  ps.description,
  ps.min_stock,
  ps.max_stock
FROM operational_sites s
JOIN product_specs ps ON ps.country_code = s.country
JOIN public.product_master pm ON pm.country_code = ps.country_code AND pm.sku = ps.sku
ON CONFLICT (sku, site_id, location)
DO UPDATE SET
  master_id = EXCLUDED.master_id,
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  cost_price = EXCLUDED.cost_price,
  stock = EXCLUDED.stock,
  status = EXCLUDED.status,
  barcode = EXCLUDED.barcode,
  barcodes = EXCLUDED.barcodes,
  brand = EXCLUDED.brand,
  size = EXCLUDED.size,
  unit = EXCLUDED.unit,
  pack_quantity = EXCLUDED.pack_quantity,
  approval_status = 'approved',
  description = EXCLUDED.description,
  min_stock = EXCLUDED.min_stock,
  max_stock = EXCLUDED.max_stock,
  updated_at = now();

COMMIT;
