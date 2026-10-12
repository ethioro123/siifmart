-- ============================================================================
-- Migration: 20261012_backfill_employees_region_code.sql
-- Description: Backfills employees.region_code from their assigned site's
--              region_code, and associates regional admin hubs and managers.
-- ============================================================================

-- 1. Backfill employees' region_code from their operating site
UPDATE employees e
SET region_code = s.region_code
FROM sites s
WHERE e.site_id = s.id
  AND s.region_code IS NOT NULL
  AND e.region_code IS NULL;

-- 2. Link Regional Administration Hub Sites to Regions
UPDATE regions
SET admin_hub_site_id = '6c38f106-4590-4ff3-ae68-b9ab657fff8e'
WHERE code = 'KE-NRB'
  AND admin_hub_site_id IS NULL;

UPDATE regions
SET admin_hub_site_id = 'bb0425bc-3119-449a-a685-b871e552bee0'
WHERE code = 'ET-ADD'
  AND admin_hub_site_id IS NULL;

-- 3. Link Regional Manager to Nairobi Region
UPDATE regions
SET regional_manager_id = '0e3367a8-96ad-4a97-ade4-adc979a3fd51'
WHERE code = 'KE-NRB'
  AND regional_manager_id IS NULL;
