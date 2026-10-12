-- ============================================================================
-- Migration: 20261012_standardize_site_codes_place_specific.sql
-- Description: Standardizes all site human-readable codes to specific,
--              place-identifying hierarchical codes: [COUNTRY]-[REGION]-[TYPE]-[LOCATION]
-- ============================================================================

-- 1. Ensure type is correctly set to 'Distribution Center' for Adama Distribution Center
UPDATE sites 
SET type = 'Distribution Center'
WHERE name = 'Adama Distribution Center' AND country = 'ET';

-- 2. Update all site display codes to place-specific identifiers
-- Ethiopia Addis Ababa
UPDATE sites SET code = 'ET-ADD-ADM-HQ' WHERE name = 'Central Operations' AND country = 'ET';
UPDATE sites SET code = 'ET-ADD-STR-BOLE' WHERE name = 'Bole Supermarket' AND country = 'ET';
UPDATE sites SET code = 'ET-ADD-STR-MERKATO-01' WHERE id = '1ec434cc-e1cf-4ef4-a823-29521edd253c';
UPDATE sites SET code = 'ET-ADD-STR-MERKATO-02' WHERE id = '0e27440b-d6a3-40dc-b140-d7dbd5935de5';

-- Ethiopia Adama & Oromia
UPDATE sites SET code = 'ET-ADA-DC-ADAMA' WHERE name = 'Adama Distribution Center' AND country = 'ET';
UPDATE sites SET code = 'ET-ADA-DC-AMBO' WHERE name = 'AMBO' AND country = 'ET';

-- Ethiopia Dire Dawa & Eastern
UPDATE sites SET code = 'ET-DIR-WH-STORAGE' WHERE name = 'Dire Dawa Storage Facility' AND country = 'ET';
UPDATE sites SET code = 'ET-DIR-WH-HARAR' WHERE name = 'Harar Logistics Hub' AND country = 'ET';
UPDATE sites SET code = 'ET-DIR-STR-AWADAY' WHERE name = 'Awaday Grocery' AND country = 'ET';
UPDATE sites SET code = 'ET-DIR-STR-ARATANYA' WHERE name = 'Aratanya Market' AND country = 'ET';
UPDATE sites SET code = 'ET-DIR-STR-BEDENO' WHERE name = 'BEDENO' AND country = 'ET';

-- Kenya Nairobi Metro
UPDATE sites SET code = 'KE-NRB-ADM-HQ' WHERE name = 'Kenya Central Operations' AND country = 'KE';
UPDATE sites SET code = 'KE-NRB-WH-EASTLEIGH' WHERE name = 'Eastleigh 01' AND country = 'KE';
UPDATE sites SET code = 'KE-NRB-STR-KILELESHWA' WHERE name ILIKE '%kileleshwa%' AND country = 'KE';

-- Expansion Country HQs
UPDATE sites SET code = 'RW-KGL-ADM-HQ' WHERE name = 'Rwanda Central Operations' AND country = 'RW';
UPDATE sites SET code = 'TZ-DAR-ADM-HQ' WHERE name = 'Tanzania Central Operations' AND country = 'TZ';
UPDATE sites SET code = 'UG-KLA-ADM-HQ' WHERE name = 'Uganda Central Operations' AND country = 'UG';
