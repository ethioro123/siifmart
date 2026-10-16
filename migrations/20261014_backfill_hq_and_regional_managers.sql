-- Migration: 20261014_backfill_hq_and_regional_managers.sql
-- Description: Align HQ corporate staff and Regional Managers across Kenya and Ethiopia.
-- Best Practice Architecture:
-- 1. Operations Managers sit at Corporate HQ (scope_level = 'HQ') with nationwide authority over all regions.
-- 2. Regional Managers sit in their territory's Regional Administration Hub (scope_level = 'REGIONAL') governing local stores and warehouses.

DO $$
DECLARE
    v_et_hq_site_id UUID := 'bb0425bc-3119-449a-a685-b871e552bee0'; -- Central Operations
    v_ke_hq_site_id UUID := '6c38f106-4590-4ff3-ae68-b9ab657fff8e'; -- Nairobi Region Administration
    v_et_rm_id UUID := '550e8400-e29b-41d4-a716-446655440047';     -- Henok Tadesse
    v_ke_rm_id UUID;
BEGIN
    -- 1. Align Ethiopia Super Admin (Shukri Kamal) to Ethiopia Corporate HQ
    UPDATE public.employees
    SET site_id = v_et_hq_site_id,
        region_code = 'ET-ADD',
        scope_level = 'HQ',
        department = 'Executive',
        updated_at = NOW()
    WHERE code = 'ET-SIIF0001';

    -- 2. Align Ethiopia Corporate HQ Staff (Operations, HR, Finance, Procurement, Audit, IT)
    UPDATE public.employees
    SET site_id = v_et_hq_site_id,
        region_code = 'ET-ADD',
        scope_level = 'HQ',
        updated_at = NOW()
    WHERE code IN (
        'ET-SIIF0002', -- Sara Tesfaye (Operations Manager)
        'ET-SIIF0021', -- Elias Kebede (IT Support)
        'ET-SIIF0024', -- Tigist Alemayehu (HR Manager)
        'ET-SIIF0025', -- Rahel Tesfaye (Finance Manager)
        'ET-SIIF0026', -- Yohannes Bekele (Procurement Manager)
        'ET-SIIF0027'  -- Dawit Haile (Auditor)
    );

    -- 3. Align Kenya Corporate HQ Staff (Operations, HR, Procurement)
    UPDATE public.employees
    SET site_id = v_ke_hq_site_id,
        region_code = 'KE-NRB',
        scope_level = 'HQ',
        updated_at = NOW()
    WHERE code IN (
        'KE-SIIF0041', -- Omondi Samuel (Operations Manager)
        'KE-SIIF0043', -- Musyoka Kioko (HR Manager)
        'KE-SIIF0045'  -- Oscar Kennedy (Procurement Manager)
    );

    -- 4. Align Kenya Regional Manager (Kamau Ndenga) in Nairobi Metro Region
    UPDATE public.employees
    SET site_id = v_ke_hq_site_id,
        region_code = 'KE-NRB',
        scope_level = 'REGIONAL',
        role = 'regional_manager',
        department = 'Management',
        updated_at = NOW()
    WHERE code = 'KE-SIIF0040';

    SELECT id INTO v_ke_rm_id FROM public.employees WHERE code = 'KE-SIIF0040' LIMIT 1;

    UPDATE public.regions
    SET regional_manager_id = v_ke_rm_id,
        admin_hub_site_id = v_ke_hq_site_id,
        updated_at = NOW()
    WHERE code = 'KE-NRB';

    -- 5. Backfill Ethiopia Regional Manager (Henok Tadesse) in Addis Ababa Central Region
    INSERT INTO public.employees (
        id,
        code,
        name,
        role,
        department,
        site_id,
        region_code,
        scope_level,
        email,
        phone,
        status,
        join_date,
        salary,
        created_at,
        updated_at
    )
    VALUES (
        v_et_rm_id,
        'ET-SIIF0047',
        'Henok Tadesse',
        'regional_manager',
        'Management',
        v_et_hq_site_id,
        'ET-ADD',
        'REGIONAL',
        'et-siif0047@siifmart.com',
        '+251 91 123 4567',
        'Active',
        CURRENT_DATE,
        45000,
        NOW(),
        NOW()
    )
    ON CONFLICT (code) DO UPDATE
    SET role = 'regional_manager',
        scope_level = 'REGIONAL',
        region_code = 'ET-ADD',
        site_id = v_et_hq_site_id,
        updated_at = NOW();

    -- Link Ethiopian Regional Manager to Addis Ababa Central Region
    UPDATE public.regions
    SET regional_manager_id = v_et_rm_id,
        admin_hub_site_id = v_et_hq_site_id,
        updated_at = NOW()
    WHERE code = 'ET-ADD';

END $$;
