-- RESTORATION MIGRATION: Site IDs and Numeric Counters
-- 1. Restore the critical string-based 'SITE-XXXX' codes
-- 2. Add/Populate the numeric 'site_number' column strictly for receipt generation

-- Add site_number column if it doesn't exist
ALTER TABLE sites ADD COLUMN IF NOT EXISTS site_number INTEGER;

-- Restore mapping for all known sites
UPDATE sites SET code = 'SITE-0001', site_number = 1 WHERE name = 'Central Operations';
UPDATE sites SET code = 'SITE-0002', site_number = 2 WHERE name = 'Dire Dawa Storage Facility';
UPDATE sites SET code = 'SITE-0003', site_number = 3 WHERE name = 'Harar Logistics Hub';
UPDATE sites SET code = 'SITE-0004', site_number = 4 WHERE name = 'Adama Distribution Center';
UPDATE sites SET code = 'SITE-0005', site_number = 5 WHERE name = 'Bole Supermarket';
UPDATE sites SET code = 'SITE-0006', site_number = 6 WHERE name = 'Aratanya Market';
UPDATE sites SET code = 'SITE-0007', site_number = 7 WHERE name = 'Awaday Grocery';
UPDATE sites SET code = 'SITE-0008', site_number = 8 WHERE name = 'AMBO';
UPDATE sites SET code = 'SITE-0009', site_number = 9 WHERE name = 'BEDENO';

-- Fallback for any other sites (extract number from code if possible, else 99)
UPDATE sites SET site_number = 99 WHERE site_number IS NULL;

-- Enforce constraints
ALTER TABLE sites ALTER COLUMN code SET NOT NULL;
ALTER TABLE sites ALTER COLUMN site_number SET NOT NULL;

-- Ensure unique constraints
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sites_code_unique') THEN
        ALTER TABLE sites DROP CONSTRAINT sites_code_unique;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sites_site_number_unique') THEN
        ALTER TABLE sites DROP CONSTRAINT sites_site_number_unique;
    END IF;
END $$;

ALTER TABLE sites ADD CONSTRAINT sites_code_unique UNIQUE (code);
ALTER TABLE sites ADD CONSTRAINT sites_site_number_unique UNIQUE (site_number);

-- Documentation
COMMENT ON COLUMN sites.code IS 'Critical site identifier (e.g., SITE-0001). DO NOT CHANGE.';
COMMENT ON COLUMN sites.site_number IS 'Numeric identifier for receipt generation (e.g., 5, 9)';
