-- Staging-only fixtures for SIIFMART Staging (utykzifrblpyxlvlknsm).
-- Add two support employees to each existing regional administration department.
-- Random passwords remain server-side; local staging quick login uses one-time tokens.
BEGIN;
DO $seed$
DECLARE
  rec record;
  employee_id uuid;
  employee_email text;
  employee_name text;
  support_role text;
  support_title text;
BEGIN
  FOR rec IN
    SELECT s.id AS site_id, s.code AS site_code, s.country, s.region_code,
           e.department, e.id AS manager_id, slots.slot
    FROM public.sites s
    JOIN public.employees e ON e.site_id = s.id AND e.status = 'Active'
    CROSS JOIN generate_series(1, 2) AS slots(slot)
    WHERE s.type = 'Administration' AND s.status = 'Active'
      AND s.country IN ('ET', 'KE') AND s.region_code LIKE s.country || '-%'
      AND (e.department, e.role) IN (
        ('Management', 'regional_operations_manager'),
        ('Procurement', 'regional_procurement_manager'),
        ('Finance', 'regional_finance_manager'),
        ('Human Resources', 'regional_hr_manager'),
        ('Transport', 'regional_logistics_manager'),
        ('Security', 'regional_security_manager'),
        ('Merchandising', 'regional_merchandising_manager')
      )
    ORDER BY s.code, e.department, slots.slot
  LOOP
    support_role := CASE rec.department
      WHEN 'Management' THEN 'data_analyst'
      WHEN 'Procurement' THEN 'buyer'
      WHEN 'Finance' THEN 'accountant'
      WHEN 'Human Resources' THEN CASE rec.slot WHEN 1 THEN 'hr_generalist' ELSE 'training_coordinator' END
      WHEN 'Transport' THEN CASE rec.slot WHEN 1 THEN 'customs_import_specialist' ELSE 'replenishment_planner' END
      WHEN 'Security' THEN 'auditor'
      WHEN 'Merchandising' THEN 'merchandising_specialist'
    END;
    support_title := initcap(replace(support_role, '_', ' '));
    employee_email := lower(rec.site_code || '.support.' || replace(rec.department, ' ', '') || '.' || rec.slot || '@staging.siifmart.com');
    employee_name := rec.site_code || ' ' || rec.department || ' Support ' || rec.slot;
    -- Re-runs leave already provisioned accounts intact.
    IF EXISTS (SELECT 1 FROM public.employees WHERE email = employee_email) THEN
      CONTINUE;
    END IF;
    employee_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', employee_id, 'authenticated', 'authenticated',
      employee_email, crypt(gen_random_uuid()::text, gen_salt('bf')), now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', support_role),
      jsonb_build_object('full_name', employee_name), now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), employee_id, employee_id::text,
      jsonb_build_object('sub', employee_id::text, 'email', employee_email, 'email_verified', true),
      'email', now(), now()
    );
    INSERT INTO public.users (
      id, auth_id, email, full_name, default_language, region_code, created_at, updated_at
    ) VALUES (
      employee_id, employee_id, employee_email, employee_name, 'en', rec.region_code, now(), now()
    ) ON CONFLICT (auth_id) DO UPDATE SET
      full_name = EXCLUDED.full_name, region_code = EXCLUDED.region_code, updated_at = now();
    INSERT INTO public.employees (
      id, site_id, name, role, job_title, email, status, join_date, department,
      code, region_code, scope_level, reports_to_employee_id, functional_manager_employee_id
    ) VALUES (
      employee_id, rec.site_id, employee_name, support_role, support_title,
      employee_email, 'Active', CURRENT_DATE, rec.department,
      rec.site_code || '-SUP-' || upper(replace(rec.department, ' ', '')) || '-' || rec.slot,
      rec.region_code, 'REGIONAL', rec.manager_id, rec.manager_id
    );
  END LOOP;
END;
$seed$;
COMMIT;
