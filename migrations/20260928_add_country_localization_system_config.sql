-- ============================================================================
-- Migration: Add Country & Enhanced Localization Support to system_config
-- Date: 2026-09-28
-- Description:
--   1. Adds `country` column to system_config ('ET' for Ethiopia, 'KE' for Kenya)
--   2. Adds `compliance_standard` and `tax_authority` columns
--   3. Enables full multi-market East Africa retail configuration
-- ============================================================================

ALTER TABLE IF EXISTS public.system_config 
    ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'ET',
    ADD COLUMN IF NOT EXISTS tax_authority TEXT DEFAULT 'Ministry of Revenues (ERCA)',
    ADD COLUMN IF NOT EXISTS compliance_standard TEXT DEFAULT 'Authorized ERCA Fiscal Electronic Register',
    ADD COLUMN IF NOT EXISTS e_tims_enabled BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.system_config.country IS 'Operating market country code: ET (Ethiopia) or KE (Kenya)';
COMMENT ON COLUMN public.system_config.tax_authority IS 'National tax authority, e.g., ERCA or KRA';
COMMENT ON COLUMN public.system_config.compliance_standard IS 'Fiscal receipt or electronic invoice compliance standard';
COMMENT ON COLUMN public.system_config.e_tims_enabled IS 'Kenya KRA Electronic Tax Invoice Management System (eTIMS) compliance flag';

-- Update existing default record if present
UPDATE public.system_config
SET 
    country = COALESCE(country, CASE WHEN currency = 'KES' THEN 'KE' ELSE 'ET' END),
    tax_authority = COALESCE(tax_authority, CASE WHEN currency = 'KES' THEN 'Kenya Revenue Authority (KRA)' ELSE 'Ministry of Revenues (ERCA)' END)
WHERE id = '00000000-0000-0000-0000-000000000001';
