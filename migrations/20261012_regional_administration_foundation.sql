-- ============================================================================
-- Migration: 20261012_regional_administration_foundation.sql
-- Description: Extends regions table to support full Regional Administration
--              and links sites & employees to regional operational territories.
-- ============================================================================

-- 1. Extend regions table with regional administration management columns
ALTER TABLE regions
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS admin_hub_site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS regional_manager_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS monthly_procurement_budget numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS autonomous_po_limit numeric DEFAULT 150000,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'planning')),
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Populate descriptive names for existing regions if null
UPDATE regions SET name = 'Nairobi Metro Region' WHERE code = 'ke_nairobi' AND (name IS NULL OR name = '');
UPDATE regions SET name = 'Mombasa Coastal Region' WHERE code = 'ke_mombasa' AND (name IS NULL OR name = '');
UPDATE regions SET name = 'Addis Ababa Central Region' WHERE code = 'et_addis' AND (name IS NULL OR name = '');
UPDATE regions SET name = 'Dire Dawa Eastern Region' WHERE code = 'et_dire' AND (name IS NULL OR name = '');
UPDATE regions SET name = 'Hawassa Southern Region' WHERE code = 'et_hawassa' AND (name IS NULL OR name = '');
UPDATE regions SET name = 'Adama Oromia Region' WHERE code = 'et_adama' AND (name IS NULL OR name = '');
UPDATE regions SET name = 'Bahir Dar Amhara Region' WHERE code = 'et_bahirdar' AND (name IS NULL OR name = '');

-- 3. Link sites to regions via region_code
ALTER TABLE sites
  ADD COLUMN IF NOT EXISTS region_code text REFERENCES regions(code) ON DELETE SET NULL;

-- 4. Backfill existing sites' region_code based on location/name hints where possible
UPDATE sites SET region_code = 'ke_nairobi' WHERE country = 'KE' AND region_code IS NULL AND (name ILIKE '%nairobi%' OR name ILIKE '%hq%' OR name ILIKE '%central%');
UPDATE sites SET region_code = 'ke_mombasa' WHERE country = 'KE' AND region_code IS NULL AND (name ILIKE '%mombasa%' OR name ILIKE '%port%' OR name ILIKE '%coast%');
UPDATE sites SET region_code = 'et_addis' WHERE country = 'ET' AND region_code IS NULL AND (name ILIKE '%addis%' OR name ILIKE '%finfinne%' OR name ILIKE '%hq%');
UPDATE sites SET region_code = 'et_dire' WHERE country = 'ET' AND region_code IS NULL AND (name ILIKE '%dire%' OR region ILIKE '%dire%');

-- 5. Add regional operational scope column to employees
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS region_code text REFERENCES regions(code) ON DELETE SET NULL;

-- 6. Add performance indexes for scoped egress queries
CREATE INDEX IF NOT EXISTS idx_sites_region_code ON sites(region_code);
CREATE INDEX IF NOT EXISTS idx_employees_region_code ON employees(region_code);
CREATE INDEX IF NOT EXISTS idx_regions_country ON regions(country);
