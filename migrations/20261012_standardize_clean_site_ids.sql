-- ============================================================================
-- Migration: 20261012_standardize_clean_site_ids.sql
-- Description: Standardizes all site IDs to clean operational codes:
--              [REGION]-[TYPE]-[NUMBER] (e.g. ADD-WH-01, ADD-STR-01, NRB-WH-01)
--              Completely decouples location name from the site ID.
-- ============================================================================

-- 1. Ethiopia - Addis Ababa (ADD)
UPDATE sites SET code = 'ADD-ADM-01' WHERE name = 'Central Operations' AND country = 'ET';
UPDATE sites SET code = 'ADD-STR-01' WHERE name = 'Bole Supermarket' AND country = 'ET';
UPDATE sites SET code = 'ADD-STR-02' WHERE id = '1ec434cc-e1cf-4ef4-a823-29521edd253c'; -- Merkato Retail Store
UPDATE sites SET code = 'ADD-STR-03' WHERE id = '0e27440b-d6a3-40dc-b140-d7dbd5935de5'; -- Merkato retail store

-- 2. Ethiopia - Adama & Oromia (ADA)
UPDATE sites SET code = 'ADA-DC-01' WHERE name = 'Adama Distribution Center' AND country = 'ET';
UPDATE sites SET code = 'ADA-DC-02' WHERE name = 'AMBO' AND country = 'ET';

-- 3. Ethiopia - Dire Dawa Eastern & Harar (DIR)
UPDATE sites SET code = 'DIR-WH-01' WHERE name = 'Dire Dawa Storage Facility' AND country = 'ET';
UPDATE sites SET code = 'DIR-WH-02' WHERE name = 'Harar Logistics Hub' AND country = 'ET';
UPDATE sites SET code = 'DIR-STR-01' WHERE name = 'Aratanya Market' AND country = 'ET';
UPDATE sites SET code = 'DIR-STR-02' WHERE name = 'Awaday Grocery' AND country = 'ET';
UPDATE sites SET code = 'DIR-STR-03' WHERE name = 'BEDENO' AND country = 'ET';

-- 4. Kenya - Nairobi Metro (NRB)
UPDATE sites SET code = 'NRB-ADM-01' WHERE name = 'Kenya Central Operations' AND country = 'KE';
UPDATE sites SET code = 'NRB-WH-01' WHERE name = 'Eastleigh 01' AND country = 'KE';
UPDATE sites SET code = 'NRB-STR-01' WHERE name ILIKE '%kileleshwa%' AND country = 'KE';

-- 5. Expansion Country Administration HQs
UPDATE sites SET code = 'KGL-ADM-01' WHERE name = 'Rwanda Central Operations' OR (country = 'RW' AND type IN ('Administration', 'Central Operations'));
UPDATE sites SET code = 'DAR-ADM-01' WHERE name = 'Tanzania Central Operations' OR (country = 'TZ' AND type IN ('Administration', 'Central Operations'));
UPDATE sites SET code = 'KLA-ADM-01' WHERE name = 'Uganda Central Operations' OR (country = 'UG' AND type IN ('Administration', 'Central Operations'));
