-- ============================================================================
-- Migration: 20261012_bind_sites_to_regions.sql
-- Description: Establishes complete regional topology by provisioning capital
--              regions for EA markets and binding all facilities to their region_code.
-- ============================================================================

-- 1. Insert capital administrative regions for expansion markets
INSERT INTO regions (code, name, country, city, default_currency, default_language, status)
VALUES 
  ('rw_kigali', 'Kigali Central Region', 'RW', 'Kigali', NULL, 'en', 'active'),
  ('tz_dar', 'Dar es Salaam Coastal Region', 'TZ', 'Dar es Salaam', NULL, 'sw', 'active'),
  ('ug_kampala', 'Kampala Central Region', 'UG', 'Kampala', NULL, 'en', 'active')
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, 
    country = EXCLUDED.country,
    city = EXCLUDED.city;

-- 2. Bind Addis Ababa facilities to et_addis
UPDATE sites 
SET region_code = 'et_addis' 
WHERE country = 'ET' AND (
  name ILIKE '%central operations%' OR 
  name ILIKE '%bole%' OR 
  name ILIKE '%merkato%' OR
  address ILIKE '%addis ababa%'
);

-- 3. Bind Eastern / Hararghe facilities to et_dire
UPDATE sites 
SET region_code = 'et_dire' 
WHERE country = 'ET' AND (
  name ILIKE '%dire%' OR 
  name ILIKE '%harar%' OR 
  name ILIKE '%aratanya%' OR 
  name ILIKE '%awaday%' OR 
  name ILIKE '%bedeno%' OR
  region ILIKE '%harar%' OR
  region ILIKE '%dire%'
);

-- 4. Bind Adama / Oromia facilities to et_adama
UPDATE sites 
SET region_code = 'et_adama' 
WHERE country = 'ET' AND (
  name ILIKE '%adama%' OR 
  name ILIKE '%ambo%' OR
  region ILIKE '%ambo%' OR
  region ILIKE '%adama%'
);

-- 5. Bind Nairobi facilities to ke_nairobi
UPDATE sites 
SET region_code = 'ke_nairobi' 
WHERE country = 'KE' AND (
  name ILIKE '%nairobi%' OR 
  name ILIKE '%eastleigh%' OR 
  name ILIKE '%kileleshwa%' OR
  address ILIKE '%nairobi%'
);

-- 6. Bind expansion markets
UPDATE sites SET region_code = 'rw_kigali' WHERE country = 'RW';
UPDATE sites SET region_code = 'tz_dar' WHERE country = 'TZ';
UPDATE sites SET region_code = 'ug_kampala' WHERE country = 'UG';
