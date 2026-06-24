-- Migration: Add region column to sites and enforce_regional_zoning column to system_config
-- Backfill initial default zones for existing sites

-- 1. Alter public.sites to add region column
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS region TEXT NULL;
COMMENT ON COLUMN public.sites.region IS 'User-defined logistics zone name (e.g. Harar Zone, Addis Ababa Zone) to group locations for replenishment restrictions.';

-- 2. Alter public.system_config to add enforce_regional_zoning column
ALTER TABLE public.system_config ADD COLUMN IF NOT EXISTS enforce_regional_zoning BOOLEAN DEFAULT false;
COMMENT ON COLUMN public.system_config.enforce_regional_zoning IS 'If true, restricts replenishment transfer requests to sites in the same logistics zone (unless overridden by CEO).';

-- 3. Backfill default zones for existing sites
UPDATE public.sites SET region = 'Addis Ababa Zone' WHERE name IN ('Central Operations', 'Bole Supermarket');
UPDATE public.sites SET region = 'Dire Dawa Zone' WHERE name = 'Dire Dawa Storage Facility';
UPDATE public.sites SET region = 'Harar Zone' WHERE name IN ('Harar Logistics Hub', 'Aratanya Market', 'Awaday Grocery', 'BEDENO');
UPDATE public.sites SET region = 'Adama Zone' WHERE name = 'Adama Distribution Center';
UPDATE public.sites SET region = 'Ambo Zone' WHERE name = 'AMBO';
