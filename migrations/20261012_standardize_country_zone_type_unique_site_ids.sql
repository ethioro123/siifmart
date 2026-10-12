-- ============================================================================
-- Migration: 20261012_standardize_country_zone_type_unique_site_ids.sql
-- Description: Standardizes all site IDs to clean operational codes:
--              [COUNTRY]-[ZONE]-[TYPE]-[UNIQUE_NUMBER]
--              (e.g. ET-ADD-ADM-01, ET-DIR-WH-02, KE-NRB-WH-12, KE-NRB-STR-17)
--              Strictly decouples facility names from IDs and guarantees that
--              every facility possesses a globally unique number sequence
--              (no two facilities anywhere share the same number, e.g. 01 and 01).
-- ============================================================================

-- 1. Ethiopia - Addis Ababa Metro (ADD)
UPDATE sites SET code = 'ET-ADD-ADM-01' WHERE id = 'bb0425bc-3119-449a-a685-b871e552bee0'; -- Central Operations
UPDATE sites SET code = 'ET-ADD-STR-05' WHERE id = 'b0be4397-16bf-4b72-b504-d56d073d4458'; -- Bole Supermarket
UPDATE sites SET code = 'ET-ADD-STR-10' WHERE id = '1ec434cc-e1cf-4ef4-a823-29521edd253c'; -- Merkato Retail Store
UPDATE sites SET code = 'ET-ADD-STR-11' WHERE id = '0e27440b-d6a3-40dc-b140-d7dbd5935de5'; -- Merkato retail store

-- 2. Ethiopia - Adama & Oromia (ADA)
UPDATE sites SET code = 'ET-ADA-DC-04' WHERE id = '97452359-705d-44dd-b2de-1002d6c19a81'; -- Adama Distribution Center
UPDATE sites SET code = 'ET-ADA-DC-08' WHERE id = 'b2293359-9b3b-4468-9c2f-8a6e288791e3'; -- AMBO

-- 3. Ethiopia - Dire Dawa Eastern Corridor & Harar (DIR)
UPDATE sites SET code = 'ET-DIR-WH-02' WHERE id = '1a76065e-fd57-4344-b2fe-9f7f0eb347a6'; -- Dire Dawa Storage Facility
UPDATE sites SET code = 'ET-DIR-WH-03' WHERE id = '96719be0-77de-4445-a8fe-e9713111255a'; -- Harar Logistics Hub
UPDATE sites SET code = 'ET-DIR-STR-06' WHERE id = '3f957b9b-99b3-46ef-aaff-5dcd22179e61'; -- Aratanya Market
UPDATE sites SET code = 'ET-DIR-STR-07' WHERE id = 'e1dce3fa-3c84-4047-adc9-b90897f5ff97'; -- Awaday Grocery
UPDATE sites SET code = 'ET-DIR-STR-09' WHERE id = 'e1db6eda-6c54-476d-9669-e7bfe3749c30'; -- BEDENO

-- 4. Kenya - Nairobi Metro (NRB)
UPDATE sites SET code = 'KE-NRB-WH-12' WHERE id = 'b74b26ff-da36-4381-912c-63c2b45b5d16'; -- Eastleigh 01
UPDATE sites SET code = 'KE-NRB-ADM-13' WHERE id = '6c38f106-4590-4ff3-ae68-b9ab657fff8e'; -- Kenya Central Operations
UPDATE sites SET code = 'KE-NRB-STR-17' WHERE id = '4b8e7cd9-5af3-4bdd-b561-11d8fa7730af'; -- Kileleshwa Branch

-- 5. Regional Administration HQs
UPDATE sites SET code = 'UG-KLA-ADM-14' WHERE id = '397b33b1-a7b9-4a38-a0c4-e5ace6474183'; -- Uganda Central Operations
UPDATE sites SET code = 'RW-KGL-ADM-15' WHERE id = '818fc6ef-c640-4ad9-82e9-b878a898aaf7'; -- Rwanda Central Operations
UPDATE sites SET code = 'TZ-DAR-ADM-16' WHERE id = 'c4c2c116-79ac-4b35-bdcb-fe3edcc5e372'; -- Tanzania Central Operations
