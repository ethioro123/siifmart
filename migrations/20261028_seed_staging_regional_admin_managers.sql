-- ============================================================================
-- SIIFMART STAGING REGIONAL ADMINISTRATION MANAGERS SEED
-- Migration: 20261028_seed_staging_regional_admin_managers.sql
-- Purpose:
--   Seeds the missing manager-and-above roles across all four Regional
--   Administration hubs (ET-ADD, ET-ADA, KE-NRB, KE-MBA) for Staging Quick Login:
--     - area_operations_manager
--     - regional_supply_chain_manager
--     - regional_merchandising_manager (ET-ADA & KE-MBA)
--     - regional_it_manager
--     - regional_compliance_manager
--     - vendor_relations_manager
--     - cs_manager
--   Also replaces generic merchandising lead labels at ET-ADD & KE-NRB with
--   authentic Ethiopian and Kenyan names.
-- ============================================================================

BEGIN;

DO $seed$
DECLARE
  rec record;
  target_site public.sites%ROWTYPE;
  regional_mgr_id uuid;
BEGIN
  -- 1. Replace placeholder names on existing ET-ADD and KE-NRB merchandising managers
  UPDATE public.employees
  SET name = 'Frehiwot Tamiru', updated_at = now()
  WHERE code = 'ET-STG-202' AND role = 'regional_merchandising_manager';

  UPDATE public.users
  SET full_name = 'Frehiwot Tamiru', updated_at = now()
  WHERE id = 'e1000000-0000-4000-8000-000000000202'::uuid;

  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', 'Frehiwot Tamiru'),
      updated_at = now()
  WHERE id = 'e1000000-0000-4000-8000-000000000202'::uuid;

  UPDATE public.employees
  SET name = 'Amina Mohamed', updated_at = now()
  WHERE code = 'KE-STG-202' AND role = 'regional_merchandising_manager';

  UPDATE public.users
  SET full_name = 'Amina Mohamed', updated_at = now()
  WHERE id = 'e2000000-0000-4000-8000-000000000202'::uuid;

  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('full_name', 'Amina Mohamed'),
      updated_at = now()
  WHERE id = 'e2000000-0000-4000-8000-000000000202'::uuid;

  -- 2. Seed all missing Regional Administration manager accounts across ET-ADD, ET-ADA, KE-NRB, KE-MBA
  FOR rec IN
    SELECT * FROM (VALUES
      -- Addis Ababa Regional Administration (ET-ADD)
      ('e1000000-0000-4000-8000-000000000204'::uuid, 'ET-ADD', 'Yohannes Mekonnen', 'area_operations_manager', 'Area Manager', 'Management', 'ET-STG-204', 'et.add.areaoperationsmanager@staging.siifmart.com', '+251911000204', 'ET-ADD', 52000),
      ('e1000000-0000-4000-8000-000000000205'::uuid, 'ET-ADD', 'Biniam Girmay', 'regional_supply_chain_manager', 'Regional Supply Chain Manager', 'Logistics & Warehouse', 'ET-STG-205', 'et.add.regionalsupplychainmanager@staging.siifmart.com', '+251911000205', 'ET-ADD', 50000),
      ('e1000000-0000-4000-8000-000000000206'::uuid, 'ET-ADD', 'Nahom Girma', 'regional_it_manager', 'Regional IT Manager', 'Management', 'ET-STG-206', 'et.add.regionalitmanager@staging.siifmart.com', '+251911000206', 'ET-ADD', 48000),
      ('e1000000-0000-4000-8000-000000000207'::uuid, 'ET-ADD', 'Rahel Tesfaye', 'regional_compliance_manager', 'Regional Quality & Compliance Manager', 'Security', 'ET-STG-207', 'et.add.regionalcompliancemanager@staging.siifmart.com', '+251911000207', 'ET-ADD', 48000),
      ('e1000000-0000-4000-8000-000000000208'::uuid, 'ET-ADD', 'Elias Kassahun', 'vendor_relations_manager', 'Vendor Relations Manager', 'Procurement', 'ET-STG-208', 'et.add.vendorrelationsmanager@staging.siifmart.com', '+251911000208', 'ET-ADD', 44000),
      ('e1000000-0000-4000-8000-000000000209'::uuid, 'ET-ADD', 'Mekdes Hailu', 'cs_manager', 'Customer Service Manager', 'Retail Operations', 'ET-STG-209', 'et.add.csmanager@staging.siifmart.com', '+251911000209', 'ET-ADD', 42000),

      -- Adama Regional Administration (ET-ADA)
      ('e1000000-0000-4000-8000-000000000210'::uuid, 'ET-ADA', 'Bekele Debele', 'area_operations_manager', 'Area Manager', 'Management', 'ET-STG-210', 'et.ada.areaoperationsmanager@staging.siifmart.com', '+251911000210', 'ET-ADA', 52000),
      ('e1000000-0000-4000-8000-000000000211'::uuid, 'ET-ADA', 'Roba Gari', 'regional_supply_chain_manager', 'Regional Supply Chain Manager', 'Logistics & Warehouse', 'ET-STG-211', 'et.ada.regionalsupplychainmanager@staging.siifmart.com', '+251911000211', 'ET-ADA', 50000),
      ('e1000000-0000-4000-8000-000000000212'::uuid, 'ET-ADA', 'Ayantu Idossa', 'regional_merchandising_manager', 'Regional Merchandising Manager', 'Merchandising', 'ET-STG-212', 'et.ada.regionalmerchandisingmanager@staging.siifmart.com', '+251911000212', 'ET-ADA', 46000),
      ('e1000000-0000-4000-8000-000000000213'::uuid, 'ET-ADA', 'Gadisa Birhanu', 'regional_it_manager', 'Regional IT Manager', 'Management', 'ET-STG-213', 'et.ada.regionalitmanager@staging.siifmart.com', '+251911000213', 'ET-ADA', 48000),
      ('e1000000-0000-4000-8000-000000000214'::uuid, 'ET-ADA', 'Buzunesh Deba', 'regional_compliance_manager', 'Regional Quality & Compliance Manager', 'Security', 'ET-STG-214', 'et.ada.regionalcompliancemanager@staging.siifmart.com', '+251911000214', 'ET-ADA', 48000),
      ('e1000000-0000-4000-8000-000000000215'::uuid, 'ET-ADA', 'Feyisa Lilesa', 'vendor_relations_manager', 'Vendor Relations Manager', 'Procurement', 'ET-STG-215', 'et.ada.vendorrelationsmanager@staging.siifmart.com', '+251911000215', 'ET-ADA', 44000),
      ('e1000000-0000-4000-8000-000000000216'::uuid, 'ET-ADA', 'Aberu Kebede', 'cs_manager', 'Customer Service Manager', 'Retail Operations', 'ET-STG-216', 'et.ada.csmanager@staging.siifmart.com', '+251911000216', 'ET-ADA', 42000),

      -- Nairobi Region Administration (KE-NRB)
      ('e2000000-0000-4000-8000-000000000204'::uuid, 'KE-NRB', 'Peter Ndegwa', 'area_operations_manager', 'Area Manager', 'Management', 'KE-STG-204', 'ke.nrb.areaoperationsmanager@staging.siifmart.com', '+254711000204', 'KE-NRB', 120000),
      ('e2000000-0000-4000-8000-000000000205'::uuid, 'KE-NRB', 'Kelvin Kiptum', 'regional_supply_chain_manager', 'Regional Supply Chain Manager', 'Logistics & Warehouse', 'KE-STG-205', 'ke.nrb.regionalsupplychainmanager@staging.siifmart.com', '+254711000205', 'KE-NRB', 115000),
      ('e2000000-0000-4000-8000-000000000206'::uuid, 'KE-NRB', 'Sylvia Mulinge', 'regional_it_manager', 'Regional IT Manager', 'Management', 'KE-STG-206', 'ke.nrb.regionalitmanager@staging.siifmart.com', '+254711000206', 'KE-NRB', 110000),
      ('e2000000-0000-4000-8000-000000000207'::uuid, 'KE-NRB', 'Dorcas Oduor', 'regional_compliance_manager', 'Regional Quality & Compliance Manager', 'Security', 'KE-STG-207', 'ke.nrb.regionalcompliancemanager@staging.siifmart.com', '+254711000207', 'KE-NRB', 110000),
      ('e2000000-0000-4000-8000-000000000208'::uuid, 'KE-NRB', 'James Mwangi', 'vendor_relations_manager', 'Vendor Relations Manager', 'Procurement', 'KE-STG-208', 'ke.nrb.vendorrelationsmanager@staging.siifmart.com', '+254711000208', 'KE-NRB', 98000),
      ('e2000000-0000-4000-8000-000000000209'::uuid, 'KE-NRB', 'Grace Msalame', 'cs_manager', 'Customer Service Manager', 'Retail Operations', 'KE-STG-209', 'ke.nrb.csmanager@staging.siifmart.com', '+254711000209', 'KE-NRB', 95000),

      -- Mombasa Region Administration (KE-MBA)
      ('e2000000-0000-4000-8000-000000000210'::uuid, 'KE-MBA', 'Hassan Joho', 'area_operations_manager', 'Area Manager', 'Management', 'KE-STG-210', 'ke.mba.areaoperationsmanager@staging.siifmart.com', '+254711000210', 'KE-MBA', 120000),
      ('e2000000-0000-4000-8000-000000000211'::uuid, 'KE-MBA', 'Suleiman Shahbal', 'regional_supply_chain_manager', 'Regional Supply Chain Manager', 'Logistics & Warehouse', 'KE-STG-211', 'ke.mba.regionalsupplychainmanager@staging.siifmart.com', '+254711000211', 'KE-MBA', 115000),
      ('e2000000-0000-4000-8000-000000000212'::uuid, 'KE-MBA', 'Fatuma Achani', 'regional_merchandising_manager', 'Regional Merchandising Manager', 'Merchandising', 'KE-STG-212', 'ke.mba.regionalmerchandisingmanager@staging.siifmart.com', '+254711000212', 'KE-MBA', 105000),
      ('e2000000-0000-4000-8000-000000000213'::uuid, 'KE-MBA', 'Omar Boga', 'regional_it_manager', 'Regional IT Manager', 'Management', 'KE-STG-213', 'ke.mba.regionalitmanager@staging.siifmart.com', '+254711000213', 'KE-MBA', 110000),
      ('e2000000-0000-4000-8000-000000000214'::uuid, 'KE-MBA', 'Zuleikha Juma', 'regional_compliance_manager', 'Regional Quality & Compliance Manager', 'Security', 'KE-STG-214', 'ke.mba.regionalcompliancemanager@staging.siifmart.com', '+254711000214', 'KE-MBA', 110000),
      ('e2000000-0000-4000-8000-000000000215'::uuid, 'KE-MBA', 'Ali Mbogo', 'vendor_relations_manager', 'Vendor Relations Manager', 'Procurement', 'KE-STG-215', 'ke.mba.vendorrelationsmanager@staging.siifmart.com', '+254711000215', 'KE-MBA', 98000),
      ('e2000000-0000-4000-8000-000000000216'::uuid, 'KE-MBA', 'Mwanamaka Mabruki', 'cs_manager', 'Customer Service Manager', 'Retail Operations', 'KE-STG-216', 'ke.mba.csmanager@staging.siifmart.com', '+254711000216', 'KE-MBA', 95000)
    ) AS fixtures(id, site_code, name, role, job_title, department, code, email, phone, region_code, salary)
  LOOP
    SELECT * INTO target_site FROM public.sites WHERE code = rec.site_code;
    IF target_site.id IS NULL THEN
      RAISE EXCEPTION 'Regional Administration site % not found', rec.site_code;
    END IF;

    SELECT id INTO regional_mgr_id
    FROM public.employees
    WHERE site_id = target_site.id AND role = 'regional_operations_manager' AND status = 'Active'
    LIMIT 1;

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', rec.id, 'authenticated', 'authenticated',
      rec.email, crypt(gen_random_uuid()::text, gen_salt('bf')), now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', rec.role),
      jsonb_build_object('full_name', rec.name, 'role', rec.role, 'job_title', rec.job_title),
      now(), now(), '', '', '', ''
    ) ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      raw_app_meta_data = EXCLUDED.raw_app_meta_data,
      raw_user_meta_data = EXCLUDED.raw_user_meta_data,
      updated_at = now();

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      rec.id, rec.id, rec.id::text,
      jsonb_build_object('sub', rec.id::text, 'email', rec.email, 'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now()
    ) ON CONFLICT (provider_id, provider) DO NOTHING;

    INSERT INTO public.users (
      id, auth_id, email, phone, full_name, default_language, region_code,
      verified_phone, verified_id, verified_face, created_at, updated_at
    ) VALUES (
      rec.id, rec.id, rec.email, rec.phone, rec.name, 'en', rec.region_code,
      true, true, true, now(), now()
    ) ON CONFLICT (auth_id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      region_code = EXCLUDED.region_code,
      updated_at = now();

    INSERT INTO public.employees (
      id, site_id, name, role, job_title, email, phone, status,
      join_date, department, performance_score, attendance_rate,
      salary, code, region_code, scope_level,
      reports_to_employee_id, functional_manager_employee_id,
      created_at, updated_at
    ) VALUES (
      rec.id, target_site.id, rec.name, rec.role, rec.job_title,
      rec.email, rec.phone, 'Active', CURRENT_DATE, rec.department, 95, 98,
      rec.salary, rec.code, rec.region_code, 'REGIONAL',
      regional_mgr_id, regional_mgr_id,
      now(), now()
    ) ON CONFLICT (id) DO UPDATE SET
      site_id = EXCLUDED.site_id,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      job_title = EXCLUDED.job_title,
      email = EXCLUDED.email,
      department = EXCLUDED.department,
      salary = EXCLUDED.salary,
      code = EXCLUDED.code,
      region_code = EXCLUDED.region_code,
      scope_level = EXCLUDED.scope_level,
      reports_to_employee_id = EXCLUDED.reports_to_employee_id,
      functional_manager_employee_id = EXCLUDED.functional_manager_employee_id,
      updated_at = now();
  END LOOP;
END;
$seed$;

COMMIT;
