-- Migration: 20261012_staff_schedules_regional.sql
-- Description: Add regional scoping and multi-country sovereign boundaries to staff_schedules and employees.

-- 1. Enhance staff_schedules table with regional and country metadata
ALTER TABLE staff_schedules
ADD COLUMN IF NOT EXISTS region_code TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT;

-- 2. Create performance indexes for weekly roster queries and territorial audits
CREATE INDEX IF NOT EXISTS idx_staff_schedules_region_date ON staff_schedules(region_code, date);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_country_date ON staff_schedules(country_code, date);
CREATE INDEX IF NOT EXISTS idx_employees_region_code ON employees(region_code);

-- 3. Backfill staff_schedules with region_code and country_code from sites
UPDATE staff_schedules ss
SET 
  region_code = s.region_code,
  country_code = s.country
FROM sites s
WHERE ss.site_id::text = s.id::text
  AND ss.region_code IS NULL
  AND s.region_code IS NOT NULL;
