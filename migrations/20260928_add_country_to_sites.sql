-- Migration: Add country and currency columns to sites table
-- Supports multi-country operations (Ethiopia ET and Kenya KE)

ALTER TABLE sites ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'ET';
ALTER TABLE sites ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'ETB';

-- Backfill any existing sites without a country to Ethiopia
UPDATE sites SET country = 'ET' WHERE country IS NULL;
UPDATE sites SET currency = 'ETB' WHERE currency IS NULL;

-- Index for country-scoped queries
CREATE INDEX IF NOT EXISTS idx_sites_country ON sites(country);
