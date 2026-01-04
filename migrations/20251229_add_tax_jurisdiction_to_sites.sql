-- Migration: Add tax_jurisdiction_id to sites table
-- This column links a site to a specific tax jurisdiction for location-aware tax calculations.

ALTER TABLE sites ADD COLUMN IF NOT EXISTS tax_jurisdiction_id TEXT NULL;

-- Add an index for faster lookups when resolving tax rules
CREATE INDEX IF NOT EXISTS idx_sites_tax_jurisdiction ON sites(tax_jurisdiction_id);
