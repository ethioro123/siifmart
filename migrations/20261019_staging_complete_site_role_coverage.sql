-- STAGING ONLY (utykzifrblpyxlvlknsm): explicitly labelled test employees.
-- Existing active staff satisfy coverage. No existing employee is changed.
BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations
                 WHERE name = 'staging_schema_snapshot_01') THEN
    RAISE EXCEPTION 'Staging fixture migration cannot run without the staging snapshot marker';
  END IF;
END;
$$;
SELECT pg_advisory_xact_lock(hashtextextended('staging-site-role-coverage', 0));

CREATE TEMP TABLE coverage_roles (
  facility_group text, role text, job_title text, department text,
  PRIMARY KEY (facility_group, role)
) ON COMMIT DROP;
INSERT INTO coverage_roles VALUES
('WMS','warehouse_manager','Warehouse Manager','Logistics & Warehouse'),
('WMS','inventory_manager','Inventory Manager','Logistics & Warehouse'),
('WMS','logistics_manager','Logistics Manager','Transport'),
('WMS','dispatch_manager','Dispatch Manager','Logistics & Warehouse'),
('WMS','fleet_maintenance_supervisor','Fleet Maintenance Supervisor','Transport'),
('WMS','security_manager','Security Manager','Security'),
('WMS','dispatcher','Dispatcher','Logistics & Warehouse'),
('WMS','replenishment_planner','Replenishment Planner','Logistics & Warehouse'),
('WMS','inbound_qc_inspector','Quality Control Inspector','Logistics & Warehouse'),
('WMS','picker','Warehouse Order Picker','Logistics & Warehouse'),
('WMS','packer','Warehouse Packer','Logistics & Warehouse'),
('WMS','receiver','Warehouse Receiving Specialist','Logistics & Warehouse'),
('WMS','forklift_operator','Forklift Operator','Logistics & Warehouse'),
('WMS','driver','Delivery Driver','Transport'),
('WMS','inventory_specialist','Inventory Control Specialist','Logistics & Warehouse'),
('WMS','stock_clerk','Inventory Clerk','Logistics & Warehouse'),
('WMS','returns_clerk','Returns Specialist','Logistics & Warehouse'),
('POS','store_manager','Store Manager','Retail Operations'),
('POS','assistant_manager','Assistant Store Manager','Retail Operations'),
('POS','store_supervisor','Store Supervisor','Retail Operations'),
('POS','shift_lead','Shift Supervisor','Retail Operations'),
('POS','cashier','Cashier','Retail Operations'),
('POS','sales_associate','Retail Sales Associate','Retail Operations'),
('POS','stock_clerk','Inventory Clerk','Retail Operations'),
('POS','inventory_specialist','Inventory Control Specialist','Retail Operations'),
('POS','customer_service','Customer Service Representative','Retail Operations'),
('POS','returns_clerk','Returns Specialist','Retail Operations'),
('POS','merchandiser','Merchandiser','Retail Operations'),
('POS','loss_prevention','Loss Prevention Officer','Security');

CREATE TEMP TABLE coverage_sites ON COMMIT DROP AS
SELECT s.*, CASE WHEN s.type IN ('Warehouse','Distribution Center') THEN 'WMS' ELSE 'POS' END AS facility_group
FROM public.sites s
WHERE lower(s.status) = 'active'
  AND s.type IN ('Warehouse','Distribution Center','Store','Dark Store','Online Store');
CREATE TEMP TABLE coverage_existing ON COMMIT DROP AS
SELECT e.id, md5(to_jsonb(e)::text) AS fingerprint FROM public.employees e;

DO $$
DECLARE
  rec record;
  v_id uuid;
  v_code text;
  v_email text;
  v_name text;
  v_sequence bigint;
  v_created integer := 0;
BEGIN
  FOR rec IN
    SELECT s.id AS site_id, s.code AS site_code, upper(s.country) AS country,
           s.currency, s.region_code, r.role, r.job_title, r.department
    FROM coverage_sites s JOIN coverage_roles r USING (facility_group)
    WHERE NOT EXISTS (SELECT 1 FROM public.employees e
                      WHERE e.site_id = s.id AND e.role = r.role AND lower(e.status) = 'active')
    ORDER BY s.country, s.code, r.role
  LOOP
    IF rec.country IS NULL OR rec.currency IS NULL THEN
      RAISE EXCEPTION 'Site % requires country and currency before staffing', rec.site_code;
    END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended('employee-code:' || rec.country, 0));
    SELECT COALESCE(max(substring(e.code FROM '([0-9]+)$')::bigint), 0) + 1
    INTO v_sequence
    FROM public.employees e LEFT JOIN public.sites s ON s.id = e.site_id
    WHERE upper(s.country) = rec.country OR upper(e.code) LIKE rec.country || '-%';
    v_code := rec.country || '-SIIF' || lpad(v_sequence::text, greatest(4, length(v_sequence::text)), '0');
    v_id := gen_random_uuid();
    v_email := lower(rec.site_code || '.' || rec.role || '@role-coverage.staging.siifmart.invalid');
    v_name := '[TEST] ' || rec.site_code || ' - ' || rec.job_title;

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
      extensions.crypt(encode(extensions.gen_random_bytes(48), 'hex'), extensions.gen_salt('bf', 10)), now(),
      jsonb_build_object('provider','email','providers',ARRAY['email'],'role',rec.role,
                         'site_id',rec.site_id,'country_code',rec.country,'staging_test',true),
      jsonb_build_object('full_name',v_name,'staging_test',true), now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
    VALUES (gen_random_uuid(), v_id, v_id::text,
            jsonb_build_object('sub',v_id::text,'email',v_email,'email_verified',true,'phone_verified',false),
            'email', now(), now());

    -- The existing auth trigger creates the public profile and its empty wallet.
    -- Bind only this new profile to its region and its site's national currency.
    UPDATE public.users SET region_code = rec.region_code WHERE auth_id = v_id;
    UPDATE public.wallets w SET currency_code = rec.currency
    FROM public.users u WHERE u.auth_id = v_id AND w.user_id = u.id AND w.balance_cents = 0;

    INSERT INTO public.employees (
      id, code, site_id, name, role, job_title, email, status, join_date, department,
      region_code, scope_level, specialization, badges, onboarding_tier, quota_status
    ) VALUES (
      v_id, v_code, rec.site_id, v_name, rec.role, rec.job_title, v_email, 'Active', CURRENT_DATE,
      rec.department, rec.region_code, CASE WHEN rec.region_code IS NULL THEN 'HQ' ELSE 'REGIONAL' END,
      'Staging role-coverage fixture; not a real employee', '["STAGING_TEST"]'::jsonb,
      CASE WHEN rec.role LIKE '%manager' OR rec.role LIKE '%supervisor' THEN 'HQ_GOVERNANCE'
           ELSE 'FRONTLINE_FAST_TRACK' END, 'STAGING_TEST'
    );
    v_created := v_created + 1;
  END LOOP;

  IF EXISTS (
    SELECT 1 FROM coverage_sites s JOIN coverage_roles r USING (facility_group)
    WHERE NOT EXISTS (SELECT 1 FROM public.employees e
                      WHERE e.site_id = s.id AND e.role = r.role AND lower(e.status) = 'active')
  ) THEN RAISE EXCEPTION 'Some operational site roles remain unstaffed'; END IF;
  IF EXISTS (
    SELECT 1 FROM coverage_existing old LEFT JOIN public.employees e ON e.id = old.id
    WHERE e.id IS NULL OR md5(to_jsonb(e)::text) IS DISTINCT FROM old.fingerprint
  ) THEN RAISE EXCEPTION 'Existing employees changed during fixture creation'; END IF;
  RAISE NOTICE 'Created % staging test employees; all configured operational roles covered', v_created;
END;
$$;
COMMIT;
