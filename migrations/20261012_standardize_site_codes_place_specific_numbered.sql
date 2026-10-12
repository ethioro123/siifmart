-- ============================================================================
-- Migration: 20261012_standardize_site_codes_place_specific_numbered.sql
-- Description: Standardizes all site human-readable codes to specific,
--              numbered place-identifying codes: [COUNTRY]-[REGION]-[TYPE]-[LOCATION]-[NUMBER]
-- ============================================================================

-- Ethiopia - Addis Ababa Central
UPDATE sites SET code = 'ET-ADD-ADM-HQ-01' WHERE name = 'Central Operations' AND country = 'ET';
UPDATE sites SET code = 'ET-ADD-STR-BOLE-01' WHERE name = 'Bole Supermarket' AND country = 'ET';
UPDATE sites SET code = 'ET-ADD-STR-MERKATO-01' WHERE id = '1ec434cc-e1cf-4ef4-a823-29521edd253c';
UPDATE sites SET code = 'ET-ADD-STR-MERKATO-02' WHERE id = '0e27440b-d6a3-40dc-b140-d7dbd5935de5';

-- Ethiopia - Adama & Oromia
UPDATE sites SET code = 'ET-ADA-DC-ADAMA-01' WHERE name = 'Adama Distribution Center' AND country = 'ET';
UPDATE sites SET code = 'ET-ADA-DC-AMBO-01' WHERE name = 'AMBO' AND country = 'ET';

-- Ethiopia - Dire Dawa Eastern & Harar
UPDATE sites SET code = 'ET-DIR-WH-STORAGE-01' WHERE name = 'Dire Dawa Storage Facility' AND country = 'ET';
UPDATE sites SET code = 'ET-DIR-WH-HARAR-01' WHERE name = 'Harar Logistics Hub' AND country = 'ET';
UPDATE sites SET code = 'ET-DIR-STR-AWADAY-01' WHERE name = 'Awaday Grocery' AND country = 'ET';
UPDATE sites SET code = 'ET-DIR-STR-ARATANYA-01' WHERE name = 'Aratanya Market' AND country = 'ET';
UPDATE sites SET code = 'ET-DIR-STR-BEDENO-01' WHERE name = 'BEDENO' AND country = 'ET';

-- Kenya - Nairobi Metro
UPDATE sites SET code = 'KE-NRB-ADM-HQ-01' WHERE name = 'Kenya Central Operations' AND country = 'KE';
UPDATE sites SET code = 'KE-NRB-WH-EASTLEIGH-01' WHERE name = 'Eastleigh 01' AND country = 'KE';
UPDATE sites SET code = 'KE-NRB-STR-KILELESHWA-01' WHERE name ILIKE '%kileleshwa%' AND country = 'KE';

-- Expansion Country HQs
UPDATE sites SET code = 'RW-KGL-ADM-HQ-01' WHERE name = 'Rwanda Central Operations' AND country = 'RW';
UPDATE sites SET code = 'TZ-DAR-ADM-HQ-01' WHERE name = 'Tanzania Central Operations' AND country = 'TZ';
UPDATE sites SET code = 'UG-KLA-ADM-HQ-01' WHERE name = 'Uganda Central Operations' AND country = 'UG';
