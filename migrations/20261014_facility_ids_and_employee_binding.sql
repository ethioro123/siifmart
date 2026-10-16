-- Migration: 20261014_facility_ids_and_employee_binding.sql
-- Description: Standardize facility IDs (ET-HQ, KE-HQ, Regional Administration, Warehouses, Stores)
-- and tie all personnel to their specific operating facility ID (CEO sovereignly exempt).

-- 1. Standardize Ethiopian Corporate HQ facility ID to ET-HQ
UPDATE public.sites
SET code = 'ET-HQ',
    updated_at = NOW()
WHERE id = 'bb0425bc-3119-449a-a685-b871e552bee0';

-- 2. Ensure Kenyan Corporate HQ exists with facility ID KE-HQ
INSERT INTO public.sites (
    id,
    name,
    type,
    code,
    country,
    currency,
    status,
    address,
    site_number,
    bonus_enabled
) VALUES (
    '6c38f106-4590-4ff3-ae68-b9ab657fff99',
    'Kenya Central Operations',
    'Administration',
    'KE-HQ',
    'KE',
    'KES',
    'Active',
    'Nairobi HQ Towers, Upper Hill, Nairobi',
    18,
    true
)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, status = 'Active', updated_at = NOW();

-- 3. Ensure Addis Ababa Regional Administration exists with facility ID ET-ADD-ADM
INSERT INTO public.sites (
    id,
    name,
    type,
    code,
    country,
    currency,
    region_code,
    status,
    address,
    site_number,
    bonus_enabled
) VALUES (
    'bb0425bc-3119-449a-a685-b871e552bee9',
    'Addis Ababa Regional Administration',
    'Administration',
    'ET-ADD-ADM',
    'ET',
    'ETB',
    'ET-ADD',
    'Active',
    'Bole Medhanealem Road, Addis Ababa',
    19,
    true
)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name, region_code = 'ET-ADD', status = 'Active', updated_at = NOW();

-- 4. Update regions table to point admin hubs to dedicated regional administrations
UPDATE public.regions
SET admin_hub_site_id = 'bb0425bc-3119-449a-a685-b871e552bee9',
    updated_at = NOW()
WHERE code = 'ET-ADD';

UPDATE public.regions
SET admin_hub_site_id = '6c38f106-4590-4ff3-ae68-b9ab657fff8e',
    updated_at = NOW()
WHERE code = 'KE-NRB';

-- 5. Tie Kenyan Corporate HQ personnel to KE-HQ facility ID
UPDATE public.employees
SET site_id = '6c38f106-4590-4ff3-ae68-b9ab657fff99',
    scope_level = 'HQ',
    region_code = NULL,
    updated_at = NOW()
WHERE code IN ('KE-SIIF0041', 'KE-SIIF0043', 'KE-SIIF0045')
   OR (role IN ('operations_manager', 'hr_manager', 'procurement_manager') AND (code LIKE 'KE-%' OR name IN ('Omondi Samuel', 'Musyoka Kioko', 'Oscar Kennedy')));

-- 6. Tie Nairobi Regional Manager to Nairobi Region Administration (KE-NRB-ADM-13)
UPDATE public.employees
SET site_id = '6c38f106-4590-4ff3-ae68-b9ab657fff8e',
    scope_level = 'REGIONAL',
    region_code = 'KE-NRB',
    updated_at = NOW()
WHERE code = 'KE-SIIF0040' OR name = 'Kamau Ndenga';

-- 7. Tie Addis Ababa Regional Manager to Addis Ababa Regional Administration (ET-ADD-ADM)
UPDATE public.employees
SET site_id = 'bb0425bc-3119-449a-a685-b871e552bee9',
    scope_level = 'REGIONAL',
    region_code = 'ET-ADD',
    updated_at = NOW()
WHERE id = '550e8400-e29b-41d4-a716-446655440047' OR name = 'Henok Tadesse';

-- 8. Tie Ethiopian Corporate HQ personnel to ET-HQ facility ID
UPDATE public.employees
SET site_id = 'bb0425bc-3119-449a-a685-b871e552bee0',
    scope_level = 'HQ',
    region_code = NULL,
    updated_at = NOW()
WHERE code IN ('ET-SIIF0002', 'ET-SIIF0021', 'ET-SIIF0024', 'ET-SIIF0025', 'ET-SIIF0026', 'ET-SIIF0027')
   OR name IN ('Sara Tesfaye', 'Elias Kebede', 'Tigist Alemayehu', 'Rahel Tesfaye', 'Yohannes Bekele', 'Dawit Haile');
