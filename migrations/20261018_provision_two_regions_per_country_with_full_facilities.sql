-- ============================================================================
-- Migration: 20261018_provision_two_regions_per_country_with_full_facilities.sql
-- Purpose: Provision 2 complete operational regions in BOTH Ethiopia (ET) and
--          Kenya (KE) — 4 regions total (ET-ADD, ET-ADA, KE-NRB, KE-MBA).
--          Each region is equipped with:
--            - 1 Regional Administration Hub ('Administration')
--            - 1 Distribution Center ('Distribution Center')
--            - 1 Warehouse ('Warehouse')
--            - 1 Online Store ('Dark Store')
--            - 3 Retail Stores ('Store')
--          Includes supply-chain replenishment links (replenishment_source_id +
--          site_replenishment_sources) and seeds the 5 canonical master products
--          across all newly provisioned operational sites.
-- ============================================================================

BEGIN;

-- 1. Remove unused empty region ET-DIR so Ethiopia has cleanly 2 active regions (ET-ADD, ET-ADA)
DELETE FROM public.regions
WHERE code = 'ET-DIR'
  AND NOT EXISTS (SELECT 1 FROM public.sites WHERE region_code = 'ET-DIR')
  AND NOT EXISTS (SELECT 1 FROM public.employees WHERE region_code = 'ET-DIR');

-- 2. Ensure the 4 target regions exist with valid governance budgets & audit reason
INSERT INTO public.regions (
  code, name, country, city, default_currency, default_language,
  monthly_procurement_budget, autonomous_po_limit,
  monthly_expense_budget, autonomous_expense_limit,
  status, last_change_reason
)
VALUES
  ('ET-ADD', 'Addis Ababa Central Region', 'ET', 'Addis Ababa', 'ETB', 'en', 5000000, 250000, 750000, 50000, 'active', 'Provisioned full regional topology for Addis Ababa Central Region'),
  ('ET-ADA', 'Adama Oromia Region',        'ET', 'Adama',       'ETB', 'en', 3500000, 175000, 500000, 35000, 'active', 'Provisioned full regional topology for Adama Oromia Region'),
  ('KE-NRB', 'Nairobi Central Region',     'KE', 'Nairobi',     'KES', 'en', 12000000, 600000, 1800000, 120000, 'active', 'Provisioned full regional topology for Nairobi Central Region'),
  ('KE-MBA', 'Mombasa Coastal Region',     'KE', 'Mombasa',     'KES', 'en', 8500000, 425000, 1200000, 85000, 'active', 'Provisioned full regional topology for Mombasa Coastal Region')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  country = EXCLUDED.country,
  city = EXCLUDED.city,
  default_currency = EXCLUDED.default_currency,
  monthly_procurement_budget = EXCLUDED.monthly_procurement_budget,
  autonomous_po_limit = EXCLUDED.autonomous_po_limit,
  monthly_expense_budget = EXCLUDED.monthly_expense_budget,
  autonomous_expense_limit = EXCLUDED.autonomous_expense_limit,
  status = 'active',
  last_change_reason = EXCLUDED.last_change_reason,
  updated_at = now();

-- 3. Upsert all Regional Administration Hubs, Distribution Centers, Warehouses, Online Stores, and 3 Retail Stores per region
INSERT INTO public.sites (
  id, code, name, type, address, status, country, currency,
  region, region_code, site_number, barcode_prefix,
  capacity, terminal_count, bonus_enabled, warehouse_bonus_enabled,
  fulfillment_strategy, is_fulfillment_node
)
VALUES
  -- ==========================================================================
  -- ETHIOPIA — REGION 1: ET-ADD (Addis Ababa Central Region)
  -- ==========================================================================
  ('bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD',        'Addis Ababa Regional Administration', 'Administration',      'Bole Road, Addis Ababa',          'Active', 'ET', 'ETB', 'Addis Ababa Central Region', 'ET-ADD', 19, '1019', 500,   0, true, true, 'NEAREST', false),
  ('a1111111-1111-4000-8000-000000000001', 'ET-ADD-DC-01',  'Addis Ababa Distribution Center',     'Distribution Center', 'Akaki Kality, Addis Ababa',       'Active', 'ET', 'ETB', 'Addis Ababa Central Region', 'ET-ADD', 1,  '1001', 50000, 0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000005', 'ET-ADD-WH-01',  'Kality Storage Warehouse',            'Warehouse',           'Kality Industrial, Addis Ababa',  'Active', 'ET', 'ETB', 'Addis Ababa Central Region', 'ET-ADD', 5,  '1005', 25000, 0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000006', 'ET-ADD-ONL-01', 'Addis Ababa Online Store',            'Dark Store',          'Kazanchis Digital Hub, Addis',    'Active', 'ET', 'ETB', 'Addis Ababa Central Region', 'ET-ADD', 6,  '1006', 8000,  0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000002', 'ET-ADD-STR-01', 'Bole Supermarket',                    'Store',               'Bole Medhanealem, Addis Ababa',   'Active', 'ET', 'ETB', 'Addis Ababa Central Region', 'ET-ADD', 2,  '1002', 5000,  6, true, true, 'NEAREST', false),
  ('a1111111-1111-4000-8000-000000000011', 'ET-ADD-STR-02', 'Piassa Heritage Supermarket',         'Store',               'Arada Piassa Avenue, Addis Ababa','Active', 'ET', 'ETB', 'Addis Ababa Central Region', 'ET-ADD', 21, '1021', 5000,  4, true, true, 'NEAREST', false),
  ('a1111111-1111-4000-8000-000000000012', 'ET-ADD-STR-03', 'CMC Summit Supermarket',              'Store',               'CMC Michael Roundabout, Addis',   'Active', 'ET', 'ETB', 'Addis Ababa Central Region', 'ET-ADD', 22, '1022', 5000,  4, true, true, 'NEAREST', false),

  -- ==========================================================================
  -- ETHIOPIA — REGION 2: ET-ADA (Adama Oromia Region)
  -- ==========================================================================
  ('bb0425bc-3119-449a-a685-b871e552beea', 'ET-ADA',        'Adama Regional Administration',       'Administration',      'Adama Main Boulevard, Adama',     'Active', 'ET', 'ETB', 'Adama Oromia Region',        'ET-ADA', 23, '1023', 500,   0, true, true, 'NEAREST', false),
  ('a1111111-1111-4000-8000-000000000021', 'ET-ADA-DC-01',  'Adama Central Distribution Center',   'Distribution Center', 'Adama Expressway Dry Port, Adama','Active', 'ET', 'ETB', 'Adama Oromia Region',        'ET-ADA', 24, '1024', 45000, 0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000022', 'ET-ADA-WH-01',  'Adama Industrial Warehouse',          'Warehouse',           'Boku Industrial Park, Adama',     'Active', 'ET', 'ETB', 'Adama Oromia Region',        'ET-ADA', 25, '1025', 22000, 0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000023', 'ET-ADA-ONL-01', 'Adama Online Store',                  'Dark Store',          'Adama Post Office Hub, Adama',    'Active', 'ET', 'ETB', 'Adama Oromia Region',        'ET-ADA', 26, '1026', 6000,  0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000024', 'ET-ADA-STR-01', 'Adama Central Supermarket',           'Store',               'Franco Intersection, Adama',      'Active', 'ET', 'ETB', 'Adama Oromia Region',        'ET-ADA', 27, '1027', 4500,  4, true, true, 'NEAREST', false),
  ('a1111111-1111-4000-8000-000000000025', 'ET-ADA-STR-02', 'Bishoftu Lakefront Supermarket',      'Store',               'Bishoftu Main Road, Oromia',      'Active', 'ET', 'ETB', 'Adama Oromia Region',        'ET-ADA', 28, '1028', 4500,  4, true, true, 'NEAREST', false),
  ('a1111111-1111-4000-8000-000000000026', 'ET-ADA-STR-03', 'Mojo Gateway Supermarket',            'Store',               'Mojo Town Center, Oromia',        'Active', 'ET', 'ETB', 'Adama Oromia Region',        'ET-ADA', 29, '1029', 4500,  4, true, true, 'NEAREST', false),

  -- ==========================================================================
  -- KENYA — REGION 1: KE-NRB (Nairobi Central Region)
  -- ==========================================================================
  ('6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB',        'Nairobi Region Administration',       'Administration',      'Westlands Road, Nairobi',         'Active', 'KE', 'KES', 'Nairobi Central Region',     'KE-NRB', 13, '2013', 500,   0, true, true, 'NEAREST', false),
  ('a1111111-1111-4000-8000-000000000003', 'KE-NRB-DC-01',  'Nairobi Distribution Center',         'Distribution Center', 'Embakasi North ICD, Nairobi',     'Active', 'KE', 'KES', 'Nairobi Central Region',     'KE-NRB', 3,  '2001', 50000, 0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000007', 'KE-NRB-WH-01',  'Eastleigh Storage Warehouse',         'Warehouse',           'First Avenue Eastleigh, Nairobi', 'Active', 'KE', 'KES', 'Nairobi Central Region',     'KE-NRB', 7,  '2007', 25000, 0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000008', 'KE-NRB-ONL-01', 'Nairobi Online Store',                'Dark Store',          'Kilimani Digital Hub, Nairobi',   'Active', 'KE', 'KES', 'Nairobi Central Region',     'KE-NRB', 8,  '2008', 8000,  0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000004', 'KE-NRB-STR-01', 'Westlands Supermarket',               'Store',               'Waiyaki Way, Westlands, Nairobi', 'Active', 'KE', 'KES', 'Nairobi Central Region',     'KE-NRB', 4,  '2002', 5000,  6, true, true, 'NEAREST', false),
  ('a1111111-1111-4000-8000-000000000031', 'KE-NRB-STR-02', 'Kilimani Junction Supermarket',       'Store',               'Ngong Road, Kilimani, Nairobi',   'Active', 'KE', 'KES', 'Nairobi Central Region',     'KE-NRB', 31, '2031', 5000,  4, true, true, 'NEAREST', false),
  ('a1111111-1111-4000-8000-000000000032', 'KE-NRB-STR-03', 'Karen Crossroads Supermarket',        'Store',               'Langata Road, Karen, Nairobi',    'Active', 'KE', 'KES', 'Nairobi Central Region',     'KE-NRB', 32, '2032', 5000,  4, true, true, 'NEAREST', false),

  -- ==========================================================================
  -- KENYA — REGION 2: KE-MBA (Mombasa Coastal Region)
  -- ==========================================================================
  ('6c38f106-4590-4ff3-ae68-b9ab657fff8f', 'KE-MBA',        'Mombasa Region Administration',       'Administration',      'Moi Avenue, Mombasa',             'Active', 'KE', 'KES', 'Mombasa Coastal Region',     'KE-MBA', 33, '2033', 500,   0, true, true, 'NEAREST', false),
  ('a1111111-1111-4000-8000-000000000041', 'KE-MBA-DC-01',  'Mombasa Coastal Distribution Center', 'Distribution Center', 'Miritini Logistics Park, Mombasa','Active', 'KE', 'KES', 'Mombasa Coastal Region',     'KE-MBA', 34, '2034', 45000, 0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000042', 'KE-MBA-WH-01',  'Changamwe Port Warehouse',            'Warehouse',           'Changamwe Industrial, Mombasa',   'Active', 'KE', 'KES', 'Mombasa Coastal Region',     'KE-MBA', 35, '2035', 22000, 0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000043', 'KE-MBA-ONL-01', 'Mombasa Online Store',                'Dark Store',          'Nyali Bridge Digital Hub, MBA',   'Active', 'KE', 'KES', 'Mombasa Coastal Region',     'KE-MBA', 36, '2036', 6000,  0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000044', 'KE-MBA-STR-01', 'Nyali Cinemax Supermarket',           'Store',               'Links Road, Nyali, Mombasa',      'Active', 'KE', 'KES', 'Mombasa Coastal Region',     'KE-MBA', 37, '2037', 4500,  4, true, true, 'NEAREST', false),
  ('a1111111-1111-4000-8000-000000000045', 'KE-MBA-STR-02', 'Bamburi Beach Supermarket',           'Store',               'Malindi Road, Bamburi, Mombasa',  'Active', 'KE', 'KES', 'Mombasa Coastal Region',     'KE-MBA', 38, '2038', 4500,  4, true, true, 'NEAREST', false),
  ('a1111111-1111-4000-8000-000000000046', 'KE-MBA-STR-03', 'Diani Coast Supermarket',             'Store',               'Beach Road, Diani, Kwale',        'Active', 'KE', 'KES', 'Mombasa Coastal Region',     'KE-MBA', 39, '2039', 4500,  4, true, true, 'NEAREST', false)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  address = EXCLUDED.address,
  status = EXCLUDED.status,
  country = EXCLUDED.country,
  currency = EXCLUDED.currency,
  region = EXCLUDED.region,
  region_code = EXCLUDED.region_code,
  site_number = EXCLUDED.site_number,
  barcode_prefix = EXCLUDED.barcode_prefix,
  capacity = EXCLUDED.capacity,
  terminal_count = EXCLUDED.terminal_count,
  bonus_enabled = EXCLUDED.bonus_enabled,
  warehouse_bonus_enabled = EXCLUDED.warehouse_bonus_enabled,
  fulfillment_strategy = EXCLUDED.fulfillment_strategy,
  is_fulfillment_node = EXCLUDED.is_fulfillment_node,
  updated_at = now();

-- 4. Link Regional Administration Hubs and Regional Managers on public.regions
UPDATE public.regions
SET admin_hub_site_id = 'bb0425bc-3119-449a-a685-b871e552bee9',
    regional_manager_id = (SELECT id FROM public.employees WHERE id = 'e1000000-0000-4000-8000-000000000024' AND role = 'regional_manager'),
    last_change_reason = 'Linked Addis Ababa Regional Administration hub and regional manager'
WHERE code = 'ET-ADD';

UPDATE public.regions
SET admin_hub_site_id = 'bb0425bc-3119-449a-a685-b871e552beea',
    last_change_reason = 'Linked Adama Regional Administration hub'
WHERE code = 'ET-ADA';

UPDATE public.regions
SET admin_hub_site_id = '6c38f106-4590-4ff3-ae68-b9ab657fff8e',
    regional_manager_id = (SELECT id FROM public.employees WHERE id = 'e2000000-0000-4000-8000-000000000024' AND role = 'regional_manager'),
    last_change_reason = 'Linked Nairobi Region Administration hub and regional manager'
WHERE code = 'KE-NRB';

UPDATE public.regions
SET admin_hub_site_id = '6c38f106-4590-4ff3-ae68-b9ab657fff8f',
    last_change_reason = 'Linked Mombasa Region Administration hub'
WHERE code = 'KE-MBA';

-- 5. Configure Supply Chain Replenishment Topology (DC -> Warehouse -> Stores & Online Store)
-- 5a. Update primary replenishment_source_id on sites
-- Warehouses replenished by their Regional Distribution Center:
UPDATE public.sites SET replenishment_source_id = 'a1111111-1111-4000-8000-000000000001' WHERE id = 'a1111111-1111-4000-8000-000000000005'; -- ET-ADD WH <- DC
UPDATE public.sites SET replenishment_source_id = 'a1111111-1111-4000-8000-000000000021' WHERE id = 'a1111111-1111-4000-8000-000000000022'; -- ET-ADA WH <- DC
UPDATE public.sites SET replenishment_source_id = 'a1111111-1111-4000-8000-000000000003' WHERE id = 'a1111111-1111-4000-8000-000000000007'; -- KE-NRB WH <- DC
UPDATE public.sites SET replenishment_source_id = 'a1111111-1111-4000-8000-000000000041' WHERE id = 'a1111111-1111-4000-8000-000000000042'; -- KE-MBA WH <- DC

-- Stores & Online Stores replenished primarily by their Regional Warehouse:
UPDATE public.sites SET replenishment_source_id = 'a1111111-1111-4000-8000-000000000005'
WHERE region_code = 'ET-ADD' AND type IN ('Store', 'Dark Store');

UPDATE public.sites SET replenishment_source_id = 'a1111111-1111-4000-8000-000000000022'
WHERE region_code = 'ET-ADA' AND type IN ('Store', 'Dark Store');

UPDATE public.sites SET replenishment_source_id = 'a1111111-1111-4000-8000-000000000007'
WHERE region_code = 'KE-NRB' AND type IN ('Store', 'Dark Store');

UPDATE public.sites SET replenishment_source_id = 'a1111111-1111-4000-8000-000000000042'
WHERE region_code = 'KE-MBA' AND type IN ('Store', 'Dark Store');

-- 5b. Populate public.site_replenishment_sources join table (Warehouse + DC sources)
INSERT INTO public.site_replenishment_sources (site_id, source_site_id)
SELECT s.id, s.replenishment_source_id
FROM public.sites s
WHERE s.replenishment_source_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Also allow Stores & Online Stores to pull directly from their regional Distribution Center as secondary source
INSERT INTO public.site_replenishment_sources (site_id, source_site_id)
SELECT s.id, dc.id
FROM public.sites s
JOIN public.sites dc
  ON dc.region_code = s.region_code
 AND dc.type = 'Distribution Center'
WHERE s.type IN ('Store', 'Dark Store')
ON CONFLICT DO NOTHING;

-- 6. Seed the 5 Canonical Master Products Across All New Operational Sites
WITH product_specs (
  country_code, sku, price, cost_price, location, shelf_position,
  batch_number, expiry_date, sales_velocity, description, min_stock, max_stock
) AS (
  VALUES
    ('ET', 'ETDY001',  125.00,  95.00, 'A-01-01', 'Top Shelf',    'BATCH-DY-2610', DATE '2027-04-15', 'High',   'Pasteurized full cream UHT milk in aseptic 1L carton.', 20, 300),
    ('ET', 'ETSA001',  590.00, 480.00, 'B-01-02', 'Eye Level',    'BATCH-SA-2610', DATE '2027-10-18', 'High',   'Triple-refined cholesterol-free pure sunflower cooking oil.', 15, 250),
    ('ET', 'ETBB001', 1150.00, 920.00, 'C-01-01', 'Eye Level',    'BATCH-BB-2610', DATE '2027-12-01', 'Medium', 'Iron-fortified Stage 1 infant milk formula powder (0-6 months).', 10, 150),
    ('ET', 'ETLD001',  395.00, 310.00, 'D-01-03', 'Bottom Shelf', 'BATCH-LD-2610', NULL,              'High',   'High-efficiency multi-enzyme laundry washing powder for hand and machine wash.', 15, 200),
    ('ET', 'ETEL001', 1150.00, 850.00, 'E-01-01', 'Middle Shelf', 'BATCH-EL-2610', NULL,              'Medium', 'Dual-mode 12W rechargeable LED emergency lantern with USB charging port.', 8, 100),
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
  os.id AS site_id,
  pm.id AS master_id,
  pm.name,
  pm.sku,
  pm.category,
  ps.price,
  ps.cost_price,
  CASE
    WHEN os.type = 'Distribution Center' THEN 250
    WHEN os.type = 'Warehouse' THEN 150
    WHEN os.type = 'Dark Store' THEN 80
    ELSE 60
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
FROM product_specs ps
JOIN public.product_master pm
  ON pm.country_code = ps.country_code
 AND pm.sku = ps.sku
JOIN operational_sites os
  ON os.country = ps.country_code
WHERE NOT EXISTS (
  SELECT 1
  FROM public.products existing
  WHERE existing.site_id = os.id
    AND existing.sku = ps.sku
);

COMMIT;
