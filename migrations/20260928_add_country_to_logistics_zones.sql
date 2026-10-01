-- ============================================================================
-- Migration: Add country column to public.logistics_zones
-- Date: 2026-09-28
-- Description:
--   Partitions logistics zones per sovereign market (Ethiopia ET and Kenya KE)
-- ============================================================================

ALTER TABLE IF EXISTS public.logistics_zones 
    ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'ET';

-- Backfill existing zones to Ethiopia
UPDATE public.logistics_zones SET country = 'ET' WHERE country IS NULL;

-- Update unique constraint to allow identical zone names across different sovereign countries
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'logistics_zones_name_key' 
        AND conrelid = 'public.logistics_zones'::regclass
    ) THEN
        ALTER TABLE public.logistics_zones DROP CONSTRAINT logistics_zones_name_key;
    END IF;
END $$;

ALTER TABLE public.logistics_zones 
    DROP CONSTRAINT IF EXISTS logistics_zones_name_country_key;
ALTER TABLE public.logistics_zones 
    ADD CONSTRAINT logistics_zones_name_country_key UNIQUE (name, country);

-- Insert default logistics zones for Kenya
INSERT INTO public.logistics_zones (name, description, country) VALUES
    ('Nairobi Metro Zone', 'Nairobi distribution hubs and retail branches', 'KE'),
    ('Mombasa Coastal Zone', 'Coastal port logistics and retail stores', 'KE'),
    ('Kisumu Western Zone', 'Lake region distribution network', 'KE'),
    ('Nakuru Rift Valley Zone', 'Central Rift logistics corridor', 'KE')
ON CONFLICT (name, country) DO NOTHING;

-- Index for country-scoped zone lookups
CREATE INDEX IF NOT EXISTS idx_logistics_zones_country ON public.logistics_zones(country);

COMMENT ON COLUMN public.logistics_zones.country IS 'Operating market country code: ET (Ethiopia) or KE (Kenya)';
