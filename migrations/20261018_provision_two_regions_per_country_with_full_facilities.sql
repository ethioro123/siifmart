-- ============================================================================
-- Migration: 20261018_provision_two_regions_per_country_with_full_facilities.sql
-- Purpose:
--   1. Fix public.bind_system_log_actor() referencing non-existent column
--      employees.full_name (should be employees.name) which blocked region
--      audit logging in public.system_logs.
--   2. Provision 2 complete operational regions in BOTH Ethiopia (ET) and
--      Kenya (KE) — 4 regions total (ET-ADD, ET-ADA, KE-NRB, KE-MBA).
--      Each region is equipped with:
--        - 1 Regional Administration Hub ('Administration')
--        - 1 Distribution Center ('Distribution Center')
--        - 1 Warehouse ('Warehouse')
--        - 1 Online Store ('Dark Store')
--        - 3 Retail Stores ('Store')
--   3. Configure supply-chain replenishment links (replenishment_source_id +
--      site_replenishment_sources) and seed the 5 canonical master products
--      across all newly provisioned operational sites.
-- ============================================================================

BEGIN;

-- 0. Fix bind_system_log_actor() trigger helper to query employees.name instead of full_name
CREATE OR REPLACE FUNCTION public.bind_system_log_actor()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_uid text;
    v_email text;
    v_emp_id text;
    v_emp_name text;
BEGIN
    v_uid := (SELECT auth.uid())::text;
    v_email := (SELECT auth.jwt()->>'email');

    SELECT id::text, name INTO v_emp_id, v_emp_name
    FROM public.employees
    WHERE (v_uid IS NOT NULL AND id::text = v_uid)
       OR (v_email IS NOT NULL AND lower(email) = lower(v_email))
    LIMIT 1;

    IF v_uid IS NOT NULL THEN
        NEW.performed_by := COALESCE(NEW.performed_by, v_emp_id, v_uid);
    END IF;

    IF v_emp_name IS NOT NULL AND (NEW.user_name IS NULL OR NEW.user_name = '') THEN
        NEW.user_name := v_emp_name;
    END IF;

    IF NEW.created_at IS NULL THEN
        NEW.created_at := now();
    END IF;

    RETURN NEW;
END;
$function$;

-- 1. Remove unused empty region ET-DIR if it has no sites or employees
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
--    Uses ON CONFLICT (code) and non-colliding site_number values (101..128) for newly inserted rows
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
  ('bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD',        'Addis Ababa Regional Administration', 'Administration',      'Bole Road, Addis Ababa',          'Active', 'ET', 'ETB', 'Addis Ababa Central Region', 'ET-ADD', 101, '1019', 500,   0, true, true, 'NEAREST', false),
  ('a1111111-1111-4000-8000-000000000001', 'ET-ADD-DC-01',  'Addis Ababa Distribution Center',     'Distribution Center', 'Akaki Kality, Addis Ababa',       'Active', 'ET', 'ETB', 'Addis Ababa Central Region', 'ET-ADD', 102, '1001', 50000, 0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000005', 'ET-ADD-WH-01',  'Kality Storage Warehouse',            'Warehouse',           'Kality Industrial, Addis Ababa',  'Active', 'ET', 'ETB', 'Addis Ababa Central Region', 'ET-ADD', 103, '1005', 25000, 0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000006', 'ET-ADD-ONL-01', 'Addis Ababa Online Store',            'Dark Store',          'Kazanchis Digital Hub, Addis',    'Active', 'ET', 'ETB', 'Addis Ababa Central Region', 'ET-ADD', 104, '1006', 8000,  0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000002', 'ET-ADD-STR-01', 'Bole Supermarket',                    'Store',               'Bole Medhanealem, Addis Ababa',   'Active', 'ET', 'ETB', 'Addis Ababa Central Region', 'ET-ADD', 105, '1002', 5000,  6, true, true, 'NEAREST', false),
  ('c1111111-1111-4000-8000-000000000106', 'ET-ADD-STR-02', 'Piassa Heritage Supermarket',         'Store',               'Arada Piassa Avenue, Addis Ababa','Active', 'ET', 'ETB', 'Addis Ababa Central Region', 'ET-ADD', 106, '1021', 5000,  4, true, true, 'NEAREST', false),
  ('c1111111-1111-4000-8000-000000000107', 'ET-ADD-STR-03', 'CMC Summit Supermarket',              'Store',               'CMC Michael Roundabout, Addis',   'Active', 'ET', 'ETB', 'Addis Ababa Central Region', 'ET-ADD', 107, '1022', 5000,  4, true, true, 'NEAREST', false),

  -- ==========================================================================
  -- ETHIOPIA — REGION 2: ET-ADA (Adama Oromia Region)
  -- ==========================================================================
  ('bb0425bc-3119-449a-a685-b871e552beea', 'ET-ADA',        'Adama Regional Administration',       'Administration',      'Adama Main Boulevard, Adama',     'Active', 'ET', 'ETB', 'Adama Oromia Region',        'ET-ADA', 108, '1023', 500,   0, true, true, 'NEAREST', false),
  ('c1111111-1111-4000-8000-000000000109', 'ET-ADA-DC-01',  'Adama Central Distribution Center',   'Distribution Center', 'Adama Expressway Dry Port, Adama','Active', 'ET', 'ETB', 'Adama Oromia Region',        'ET-ADA', 109, '1024', 45000, 0, true, true, 'NEAREST', true),
  ('c1111111-1111-4000-8000-000000000110', 'ET-ADA-WH-01',  'Adama Industrial Warehouse',          'Warehouse',           'Boku Industrial Park, Adama',     'Active', 'ET', 'ETB', 'Adama Oromia Region',        'ET-ADA', 110, '1025', 22000, 0, true, true, 'NEAREST', true),
  ('c1111111-1111-4000-8000-000000000111', 'ET-ADA-ONL-01', 'Adama Online Store',                  'Dark Store',          'Adama Post Office Hub, Adama',    'Active', 'ET', 'ETB', 'Adama Oromia Region',        'ET-ADA', 111, '1026', 6000,  0, true, true, 'NEAREST', true),
  ('c1111111-1111-4000-8000-000000000112', 'ET-ADA-STR-01', 'Adama Central Supermarket',           'Store',               'Franco Intersection, Adama',      'Active', 'ET', 'ETB', 'Adama Oromia Region',        'ET-ADA', 112, '1027', 4500,  4, true, true, 'NEAREST', false),
  ('c1111111-1111-4000-8000-000000000113', 'ET-ADA-STR-02', 'Bishoftu Lakefront Supermarket',      'Store',               'Bishoftu Main Road, Oromia',      'Active', 'ET', 'ETB', 'Adama Oromia Region',        'ET-ADA', 113, '1028', 4500,  4, true, true, 'NEAREST', false),
  ('c1111111-1111-4000-8000-000000000114', 'ET-ADA-STR-03', 'Mojo Gateway Supermarket',            'Store',               'Mojo Town Center, Oromia',        'Active', 'ET', 'ETB', 'Adama Oromia Region',        'ET-ADA', 114, '1029', 4500,  4, true, true, 'NEAREST', false),

  -- ==========================================================================
  -- KENYA — REGION 1: KE-NRB (Nairobi Central Region)
  -- ==========================================================================
  ('6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB',        'Nairobi Region Administration',       'Administration',      'Westlands Road, Nairobi',         'Active', 'KE', 'KES', 'Nairobi Central Region',     'KE-NRB', 115, '2013', 500,   0, true, true, 'NEAREST', false),
  ('a1111111-1111-4000-8000-000000000003', 'KE-NRB-DC-01',  'Nairobi Distribution Center',         'Distribution Center', 'Embakasi North ICD, Nairobi',     'Active', 'KE', 'KES', 'Nairobi Central Region',     'KE-NRB', 116, '2001', 50000, 0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000007', 'KE-NRB-WH-01',  'Eastleigh Storage Warehouse',         'Warehouse',           'First Avenue Eastleigh, Nairobi', 'Active', 'KE', 'KES', 'Nairobi Central Region',     'KE-NRB', 117, '2007', 25000, 0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000008', 'KE-NRB-ONL-01', 'Nairobi Online Store',                'Dark Store',          'Kilimani Digital Hub, Nairobi',   'Active', 'KE', 'KES', 'Nairobi Central Region',     'KE-NRB', 118, '2008', 8000,  0, true, true, 'NEAREST', true),
  ('a1111111-1111-4000-8000-000000000004', 'KE-NRB-STR-01', 'Westlands Supermarket',               'Store',               'Waiyaki Way, Westlands, Nairobi', 'Active', 'KE', 'KES', 'Nairobi Central Region',     'KE-NRB', 119, '2002', 5000,  6, true, true, 'NEAREST', false),
  ('c1111111-1111-4000-8000-000000000120', 'KE-NRB-STR-02', 'Kilimani Junction Supermarket',       'Store',               'Ngong Road, Kilimani, Nairobi',   'Active', 'KE', 'KES', 'Nairobi Central Region',     'KE-NRB', 120, '2031', 5000,  4, true, true, 'NEAREST', false),
  ('c1111111-1111-4000-8000-000000000121', 'KE-NRB-STR-03', 'Karen Crossroads Supermarket',        'Store',               'Langata Road, Karen, Nairobi',    'Active', 'KE', 'KES', 'Nairobi Central Region',     'KE-NRB', 121, '2032', 5000,  4, true, true, 'NEAREST', false),

  -- ==========================================================================
  -- KENYA — REGION 2: KE-MBA (Mombasa Coastal Region)
  -- ==========================================================================
  ('6c38f106-4590-4ff3-ae68-b9ab657fff8f', 'KE-MBA',        'Mombasa Region Administration',       'Administration',      'Moi Avenue, Mombasa',             'Active', 'KE', 'KES', 'Mombasa Coastal Region',     'KE-MBA', 122, '2033', 500,   0, true, true, 'NEAREST', false),
  ('c1111111-1111-4000-8000-000000000123', 'KE-MBA-DC-01',  'Mombasa Coastal Distribution Center', 'Distribution Center', 'Miritini Logistics Park, Mombasa','Active', 'KE', 'KES', 'Mombasa Coastal Region',     'KE-MBA', 123, '2034', 45000, 0, true, true, 'NEAREST', true),
  ('c1111111-1111-4000-8000-000000000124', 'KE-MBA-WH-01',  'Changamwe Port Warehouse',            'Warehouse',           'Changamwe Industrial, Mombasa',   'Active', 'KE', 'KES', 'Mombasa Coastal Region',     'KE-MBA', 124, '2035', 22000, 0, true, true, 'NEAREST', true),
  ('c1111111-1111-4000-8000-000000000125', 'KE-MBA-ONL-01', 'Mombasa Online Store',                'Dark Store',          'Nyali Bridge Digital Hub, MBA',   'Active', 'KE', 'KES', 'Mombasa Coastal Region',     'KE-MBA', 125, '2036', 6000,  0, true, true, 'NEAREST', true),
  ('c1111111-1111-4000-8000-000000000126', 'KE-MBA-STR-01', 'Nyali Cinemax Supermarket',           'Store',               'Links Road, Nyali, Mombasa',      'Active', 'KE', 'KES', 'Mombasa Coastal Region',     'KE-MBA', 126, '2037', 4500,  4, true, true, 'NEAREST', false),
  ('c1111111-1111-4000-8000-000000000127', 'KE-MBA-STR-02', 'Bamburi Beach Supermarket',           'Store',               'Malindi Road, Bamburi, Mombasa',  'Active', 'KE', 'KES', 'Mombasa Coastal Region',     'KE-MBA', 127, '2038', 4500,  4, true, true, 'NEAREST', false),
  ('c1111111-1111-4000-8000-000000000128', 'KE-MBA-STR-03', 'Diani Coast Supermarket',             'Store',               'Beach Road, Diani, Kwale',        'Active', 'KE', 'KES', 'Mombasa Coastal Region',     'KE-MBA', 128, '2039', 4500,  4, true, true, 'NEAREST', false)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  address = EXCLUDED.address,
  status = EXCLUDED.status,
  country = EXCLUDED.country,
  currency = EXCLUDED.currency,
  region = EXCLUDED.region,
  region_code = EXCLUDED.region_code,
  barcode_prefix = COALESCE(public.sites.barcode_prefix, EXCLUDED.barcode_prefix),
  capacity = EXCLUDED.capacity,
  terminal_count = EXCLUDED.terminal_count,
  bonus_enabled = EXCLUDED.bonus_enabled,
  warehouse_bonus_enabled = EXCLUDED.warehouse_bonus_enabled,
  fulfillment_strategy = EXCLUDED.fulfillment_strategy,
  is_fulfillment_node = EXCLUDED.is_fulfillment_node,
  updated_at = now();

-- 4. Link Regional Administration Hubs and Regional Managers on public.regions
UPDATE public.regions
SET admin_hub_site_id = (SELECT id FROM public.sites WHERE code = 'ET-ADD'),
    regional_manager_id = COALESCE(
      regional_manager_id,
      (SELECT id FROM public.employees WHERE id = 'e1000000-0000-4000-8000-000000000024' AND role = 'regional_manager')
    ),
    last_change_reason = 'Linked Addis Ababa Regional Administration hub and regional manager'
WHERE code = 'ET-ADD';

UPDATE public.regions
SET admin_hub_site_id = (SELECT id FROM public.sites WHERE code = 'ET-ADA'),
    last_change_reason = 'Linked Adama Regional Administration hub'
WHERE code = 'ET-ADA';

UPDATE public.regions
SET admin_hub_site_id = (SELECT id FROM public.sites WHERE code = 'KE-NRB'),
    regional_manager_id = COALESCE(
      regional_manager_id,
      (SELECT id FROM public.employees WHERE id = 'e2000000-0000-4000-8000-000000000024' AND role = 'regional_manager')
    ),
    last_change_reason = 'Linked Nairobi Region Administration hub and regional manager'
WHERE code = 'KE-NRB';

UPDATE public.regions
SET admin_hub_site_id = (SELECT id FROM public.sites WHERE code = 'KE-MBA'),
    last_change_reason = 'Linked Mombasa Region Administration hub'
WHERE code = 'KE-MBA';

-- 5. Configure Supply Chain Replenishment Topology (DC -> Warehouse -> Stores & Online Store)
-- 5a. Warehouses replenished by their Regional Distribution Center:
UPDATE public.sites
SET replenishment_source_id = (SELECT id FROM public.sites WHERE code = 'ET-ADD-DC-01')
WHERE code = 'ET-ADD-WH-01';

UPDATE public.sites
SET replenishment_source_id = (SELECT id FROM public.sites WHERE code = 'ET-ADA-DC-01')
WHERE code = 'ET-ADA-WH-01';

UPDATE public.sites
SET replenishment_source_id = (SELECT id FROM public.sites WHERE code = 'KE-NRB-DC-01')
WHERE code = 'KE-NRB-WH-01';

UPDATE public.sites
SET replenishment_source_id = (SELECT id FROM public.sites WHERE code = 'KE-MBA-DC-01')
WHERE code = 'KE-MBA-WH-01';

-- 5b. Stores & Online Stores replenished primarily by their Regional Warehouse:
UPDATE public.sites
SET replenishment_source_id = (SELECT id FROM public.sites WHERE code = 'ET-ADD-WH-01')
WHERE region_code = 'ET-ADD' AND type IN ('Store', 'Dark Store');

UPDATE public.sites
SET replenishment_source_id = (SELECT id FROM public.sites WHERE code = 'ET-ADA-WH-01')
WHERE region_code = 'ET-ADA' AND type IN ('Store', 'Dark Store');

UPDATE public.sites
SET replenishment_source_id = (SELECT id FROM public.sites WHERE code = 'KE-NRB-WH-01')
WHERE region_code = 'KE-NRB' AND type IN ('Store', 'Dark Store');

UPDATE public.sites
SET replenishment_source_id = (SELECT id FROM public.sites WHERE code = 'KE-MBA-WH-01')
WHERE region_code = 'KE-MBA' AND type IN ('Store', 'Dark Store');

-- 5c. Populate public.site_replenishment_sources join table (Warehouse + DC sources)
INSERT INTO public.site_replenishment_sources (site_id, source_site_id)
SELECT s.id, s.replenishment_source_id
FROM public.sites s
WHERE s.replenishment_source_id IS NOT NULL
ON CONFLICT DO NOTHING;

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
