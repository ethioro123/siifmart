-- ============================================================================
-- Migration: 20261012_standardize_zone_region_codes.sql
-- Description: Standardizes all regional zone codes from lowercase snake_case
--              (et_addis, ke_nairobi) to clean operational Zone IDs:
--              [COUNTRY]-[ZONE] (ET-ADD, ET-ADA, ET-DIR, KE-NRB, RW-KGL, etc.)
--              Updates foreign keys to ON UPDATE CASCADE and migrates all
--              referencing records across sites, users, drivers, POs, and trips.
-- ============================================================================

-- 1. Upgrade foreign key constraints to ON UPDATE CASCADE
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_region_code_fkey;
ALTER TABLE users ADD CONSTRAINT users_region_code_fkey 
  FOREIGN KEY (region_code) REFERENCES regions(code) ON UPDATE CASCADE;

ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_region_code_fkey;
ALTER TABLE drivers ADD CONSTRAINT drivers_region_code_fkey 
  FOREIGN KEY (region_code) REFERENCES regions(code) ON UPDATE CASCADE;

ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_region_code_fkey;
ALTER TABLE trips ADD CONSTRAINT trips_region_code_fkey 
  FOREIGN KEY (region_code) REFERENCES regions(code) ON UPDATE CASCADE;

ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_region_code_fkey;
ALTER TABLE agents ADD CONSTRAINT agents_region_code_fkey 
  FOREIGN KEY (region_code) REFERENCES regions(code) ON UPDATE CASCADE;

ALTER TABLE sites DROP CONSTRAINT IF EXISTS sites_region_code_fkey;
ALTER TABLE sites ADD CONSTRAINT sites_region_code_fkey 
  FOREIGN KEY (region_code) REFERENCES regions(code) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_region_code_fkey;
ALTER TABLE employees ADD CONSTRAINT employees_region_code_fkey 
  FOREIGN KEY (region_code) REFERENCES regions(code) ON UPDATE CASCADE ON DELETE SET NULL;

-- 2. Update Primary Region Codes in regions table (cascades to all foreign key tables)
UPDATE regions SET code = 'ET-ADD' WHERE code = 'et_addis';
UPDATE regions SET code = 'ET-ADA' WHERE code = 'et_adama';
UPDATE regions SET code = 'ET-DIR' WHERE code = 'et_dire';
UPDATE regions SET code = 'ET-HAW' WHERE code = 'et_hawassa';
UPDATE regions SET code = 'ET-BDR' WHERE code = 'et_bahirdar';
UPDATE regions SET code = 'KE-NRB' WHERE code = 'ke_nairobi';
UPDATE regions SET code = 'KE-MBA' WHERE code = 'ke_mombasa';
UPDATE regions SET code = 'RW-KGL' WHERE code = 'rw_kigali';
UPDATE regions SET code = 'TZ-DAR' WHERE code = 'tz_dar';
UPDATE regions SET code = 'UG-KLA' WHERE code = 'ug_kampala';

-- 3. Synchronize purchase_orders non-FK column
UPDATE purchase_orders SET region_code = 'ET-ADD' WHERE region_code = 'et_addis';
UPDATE purchase_orders SET region_code = 'ET-ADA' WHERE region_code = 'et_adama';
UPDATE purchase_orders SET region_code = 'ET-DIR' WHERE region_code = 'et_dire';
UPDATE purchase_orders SET region_code = 'ET-HAW' WHERE region_code = 'et_hawassa';
UPDATE purchase_orders SET region_code = 'ET-BDR' WHERE region_code = 'et_bahirdar';
UPDATE purchase_orders SET region_code = 'KE-NRB' WHERE region_code = 'ke_nairobi';
UPDATE purchase_orders SET region_code = 'KE-MBA' WHERE region_code = 'ke_mombasa';
UPDATE purchase_orders SET region_code = 'RW-KGL' WHERE region_code = 'rw_kigali';
UPDATE purchase_orders SET region_code = 'TZ-DAR' WHERE region_code = 'tz_dar';
UPDATE purchase_orders SET region_code = 'UG-KLA' WHERE region_code = 'ug_kampala';

-- 4. Synchronize inventory_requests and staff_schedules if present
UPDATE inventory_requests SET region_code = 'ET-ADD' WHERE region_code = 'et_addis';
UPDATE inventory_requests SET region_code = 'ET-ADA' WHERE region_code = 'et_adama';
UPDATE inventory_requests SET region_code = 'ET-DIR' WHERE region_code = 'et_dire';
UPDATE inventory_requests SET region_code = 'KE-NRB' WHERE region_code = 'ke_nairobi';
UPDATE staff_schedules SET region_code = 'ET-ADD' WHERE region_code = 'et_addis';
UPDATE staff_schedules SET region_code = 'ET-ADA' WHERE region_code = 'et_adama';
UPDATE staff_schedules SET region_code = 'ET-DIR' WHERE region_code = 'et_dire';
UPDATE staff_schedules SET region_code = 'KE-NRB' WHERE region_code = 'ke_nairobi';
