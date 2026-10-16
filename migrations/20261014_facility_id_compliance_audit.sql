-- Migration: 20261014_facility_id_compliance_audit.sql
-- Description: Standardize all facility codes to strict enterprise guidelines:
-- 1. National Corporate Headquarters: [COUNTRY]-HQ (ET-HQ, KE-HQ) with nationwide scope
-- 2. Operating Facilities: [COUNTRY]-[ZONE]-[TYPE]-[2_DIGIT_SEQUENCE] (e.g. ET-ADD-ADM-19)
-- 3. Eliminate trailing whitespaces from facility names

-- 1. Align Addis Ababa Regional Administration to strict 2-digit sequence pattern
UPDATE public.sites
SET code = 'ET-ADD-ADM-19',
    updated_at = NOW()
WHERE id = 'bb0425bc-3119-449a-a685-b871e552bee9';

-- 2. Clean trailing whitespace in Kileleshwa facility name
UPDATE public.sites
SET name = 'Kileleshwa',
    updated_at = NOW()
WHERE id = '4b8e7cd9-5af3-4bdd-b561-11d8fa7730af';

-- 3. Standardize Ethiopian Corporate HQ to national scope (region_code NULL)
UPDATE public.sites
SET region_code = NULL,
    updated_at = NOW()
WHERE id = 'bb0425bc-3119-449a-a685-b871e552bee0';
