-- ============================================================================
-- Migration: 20261012_standardize_regions_country_iso.sql
-- Description: Standardizes regions.country from full names ('Kenya', 'Ethiopia')
--              to standard 2-letter uppercase ISO codes ('KE', 'ET') matching sites.country.
-- ============================================================================

-- 1. Migrate existing country names to standard 2-letter ISO codes
UPDATE regions 
SET country = 'KE' 
WHERE UPPER(country) = 'KENYA' OR country = 'ke';

UPDATE regions 
SET country = 'ET' 
WHERE UPPER(country) = 'ETHIOPIA' OR country = 'et';

-- 2. Add check constraint ensuring country is always a 2-letter uppercase ISO code
ALTER TABLE regions 
  DROP CONSTRAINT IF EXISTS regions_country_iso_check;

ALTER TABLE regions 
  ADD CONSTRAINT regions_country_iso_check 
  CHECK (country ~ '^[A-Z]{2}$');
