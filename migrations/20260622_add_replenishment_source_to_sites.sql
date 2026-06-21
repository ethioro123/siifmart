-- Migration: Add replenishment_source_id to sites table
ALTER TABLE sites
ADD COLUMN IF NOT EXISTS replenishment_source_id UUID REFERENCES sites(id);

-- Create index for faster lookup on replenishment sources
CREATE INDEX IF NOT EXISTS idx_sites_replenishment_source 
ON sites(replenishment_source_id) 
WHERE replenishment_source_id IS NOT NULL;
