-- Staging-only quick-login fixtures. Never apply to production.
DO $function$
DECLARE rec record;
DECLARE target_site public.sites%ROWTYPE;
BEGIN
  FOR rec IN SELECT * FROM (VALUES
    ('e1000000-0000-4000-8000-000000000201'::uuid, 'ET-HQ', 'ET HQ Merchandising Specialist', 'merchandising_specialist', 'ET-STG-201', 'et.hq.merchandisingspecialist@staging.siifmart.com', '+251911000201', 'HQ', NULL::text, 30000),
    ('e1000000-0000-4000-8000-000000000202'::uuid, 'ET-ADD', 'ET Regional Merchandising Lead', 'regional_merchandising_lead', 'ET-STG-202', 'et.add.regionalmerchandisinglead@staging.siifmart.com', '+251911000202', 'REGIONAL', 'ET-ADD', 45000),
    ('e1000000-0000-4000-8000-000000000203'::uuid, 'ET-ADD', 'ET Regional Merchandising Specialist', 'merchandising_specialist', 'ET-STG-203', 'et.add.merchandisingspecialist@staging.siifmart.com', '+251911000203', 'REGIONAL', 'ET-ADD', 30000),
    ('e2000000-0000-4000-8000-000000000201'::uuid, 'KE-HQ', 'KE HQ Merchandising Specialist', 'merchandising_specialist', 'KE-STG-201', 'ke.hq.merchandisingspecialist@staging.siifmart.com', '+254711000201', 'HQ', NULL::text, 70000),
    ('e2000000-0000-4000-8000-000000000202'::uuid, 'KE-NRB', 'KE Regional Merchandising Lead', 'regional_merchandising_lead', 'KE-STG-202', 'ke.nrb.regionalmerchandisinglead@staging.siifmart.com', '+254711000202', 'REGIONAL', 'KE-NRB', 100000),
    ('e2000000-0000-4000-8000-000000000203'::uuid, 'KE-NRB', 'KE Regional Merchandising Specialist', 'merchandising_specialist', 'KE-STG-203', 'ke.nrb.merchandisingspecialist@staging.siifmart.com', '+254711000203', 'REGIONAL', 'KE-NRB', 70000)
  ) AS fixtures(id, site_code, name, role, code, email, phone, scope_level, region_code, salary)
  LOOP
    SELECT * INTO target_site FROM public.sites WHERE code = rec.site_code;
    IF target_site.id IS NULL OR target_site.type <> 'Administration' THEN
      RAISE EXCEPTION 'Staging Administration site % is unavailable', rec.site_code;
    END IF;

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', rec.id, 'authenticated', 'authenticated',
      rec.email, crypt(gen_random_uuid()::text, gen_salt('bf')), now(),
      jsonb_build_object('provider','email','providers',ARRAY['email'],'role',rec.role),
      jsonb_build_object('full_name',rec.name,'role',rec.role,'job_title',initcap(replace(rec.role,'_',' '))),
      now(), now(), '', '', '', ''
    ) ON CONFLICT (id) DO NOTHING;

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      rec.id, rec.id, rec.id::text,
      jsonb_build_object('sub',rec.id::text,'email',rec.email,'email_verified',true,'phone_verified',false),
      'email', now(), now(), now()
    ) ON CONFLICT (provider_id, provider) DO NOTHING;

    INSERT INTO public.users (
      id, auth_id, email, phone, full_name, default_language, region_code,
      verified_phone, verified_id, verified_face, created_at, updated_at
    ) VALUES (
      rec.id, rec.id, rec.email, rec.phone, rec.name, 'en', rec.region_code,
      true, true, true, now(), now()
    ) ON CONFLICT (auth_id) DO NOTHING;

    INSERT INTO public.employees (
      id, site_id, name, role, job_title, email, phone, status,
      join_date, department, performance_score, attendance_rate,
      salary, code, region_code, scope_level, created_at, updated_at
    ) VALUES (
      rec.id, target_site.id, rec.name, rec.role, initcap(replace(rec.role,'_',' ')),
      rec.email, rec.phone, 'Active', CURRENT_DATE, 'Merchandising', 95, 98,
      rec.salary, rec.code, rec.region_code, rec.scope_level, now(), now()
    ) ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$function$;
