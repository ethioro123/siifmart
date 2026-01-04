-- Migration: Add tax_jurisdictions JSONB column to system_config
-- This column stores the array of tax jurisdiction objects with their rules

ALTER TABLE system_config ADD COLUMN IF NOT EXISTS tax_jurisdictions JSONB DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN system_config.tax_jurisdictions IS 'Array of tax jurisdictions with nested rules for site-specific tax calculations';
