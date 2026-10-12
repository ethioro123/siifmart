-- Migration: 20261012_regional_transfers_and_inventory.sql
-- Description: Add regional tracking and sovereign boundaries to transfers and inventory requests.

-- 1. Enhance transfers table with regional routing, sovereignty and operational columns
ALTER TABLE transfers 
ADD COLUMN IF NOT EXISTS source_region_code TEXT,
ADD COLUMN IF NOT EXISTS dest_region_code TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS is_inter_region BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS order_ref TEXT,
ADD COLUMN IF NOT EXISTS requested_by TEXT,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS received_by TEXT;

-- 2. Create performance indexes for transfer routing and regional audits
CREATE INDEX IF NOT EXISTS idx_transfers_source_region ON transfers(source_region_code);
CREATE INDEX IF NOT EXISTS idx_transfers_dest_region ON transfers(dest_region_code);
CREATE INDEX IF NOT EXISTS idx_transfers_country ON transfers(country_code);
CREATE INDEX IF NOT EXISTS idx_transfers_inter_region ON transfers(is_inter_region);

-- 3. Enhance inventory_requests table with region_code
ALTER TABLE inventory_requests
ADD COLUMN IF NOT EXISTS region_code TEXT;

CREATE INDEX IF NOT EXISTS idx_inventory_requests_region ON inventory_requests(region_code);

-- 4. Backfill existing inventory requests with region_code from sites
UPDATE inventory_requests ir
SET region_code = s.region_code
FROM sites s
WHERE ir.site_id::text = s.id::text
  AND ir.region_code IS NULL
  AND s.region_code IS NOT NULL;

-- 5. Backfill transfers if any exist
UPDATE transfers t
SET 
  source_region_code = s1.region_code,
  country_code = s1.country
FROM sites s1
WHERE t.source_site_id::text = s1.id::text
  AND t.source_region_code IS NULL;

UPDATE transfers t
SET 
  dest_region_code = s2.region_code
FROM sites s2
WHERE t.dest_site_id::text = s2.id::text
  AND t.dest_region_code IS NULL;

UPDATE transfers
SET is_inter_region = (source_region_code IS DISTINCT FROM dest_region_code)
WHERE is_inter_region IS FALSE AND source_region_code IS NOT NULL AND dest_region_code IS NOT NULL;
