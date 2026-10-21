-- Verify fixture integrity and actual employee/country RLS under representative roles.
BEGIN;
DO $$
DECLARE v_count integer;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.sites s
    CROSS JOIN LATERAL unnest(CASE WHEN s.type IN ('Warehouse','Distribution Center') THEN ARRAY[
      'warehouse_manager','inventory_manager','logistics_manager','dispatch_manager',
      'fleet_maintenance_supervisor','security_manager','dispatcher','replenishment_planner',
      'inbound_qc_inspector','picker','packer','receiver','forklift_operator','driver',
      'inventory_specialist','stock_clerk','returns_clerk'
    ] ELSE ARRAY[
      'store_manager','assistant_manager','store_supervisor','shift_lead','cashier','sales_associate',
      'stock_clerk','inventory_specialist','customer_service','returns_clerk','merchandiser','loss_prevention'
    ] END) required(role)
    WHERE lower(s.status) = 'active'
      AND s.type IN ('Warehouse','Distribution Center','Store')
      AND NOT EXISTS (SELECT 1 FROM public.employees e
                      WHERE e.site_id = s.id AND e.role = required.role AND lower(e.status) = 'active')
  ) THEN RAISE EXCEPTION 'An operational site is missing an active employee for a required role'; END IF;
  SELECT count(*) INTO v_count FROM public.employees
  WHERE email LIKE '%@role-coverage.staging.siifmart.invalid';
  IF v_count = 0 THEN RAISE EXCEPTION 'Role coverage fixtures are absent'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.employees e JOIN public.sites s ON s.id = e.site_id
    LEFT JOIN auth.users a ON a.id = e.id
    LEFT JOIN auth.identities i ON i.user_id = e.id AND i.provider = 'email'
    LEFT JOIN public.users u ON u.auth_id = e.id
    LEFT JOIN public.wallets w ON w.user_id = u.id
    WHERE e.email LIKE '%@role-coverage.staging.siifmart.invalid'
      AND (a.id IS NULL OR i.id IS NULL OR u.id IS NULL OR w.id IS NULL
        OR e.name NOT LIKE '[TEST] %' OR a.raw_app_meta_data->>'staging_test' IS DISTINCT FROM 'true'
        OR a.raw_app_meta_data->>'role' IS DISTINCT FROM e.role
        OR a.raw_app_meta_data->>'site_id' IS DISTINCT FROM e.site_id::text
        OR a.raw_app_meta_data->>'country_code' IS DISTINCT FROM upper(s.country)
        OR e.region_code IS DISTINCT FROM s.region_code
        OR e.code NOT LIKE upper(s.country) || '-SIIF%'
        OR w.currency_code IS DISTINCT FROM s.currency OR w.balance_cents <> 0
        OR e.salary IS NOT NULL OR e.phone IS NOT NULL OR e.national_id_number IS NOT NULL
        OR e.quota_status IS NOT NULL
        OR e.credentials_handed_over_at IS NOT NULL OR e.credentials_handed_over_by IS NOT NULL
        OR u.verified_id OR u.verified_face OR u.verified_phone
        OR a.encrypted_password NOT LIKE '$2%')
  ) THEN RAISE EXCEPTION 'Fixture identity, credentials, or national scope is inconsistent'; END IF;
  IF (SELECT count(DISTINCT a.encrypted_password)
      FROM auth.users a JOIN public.employees e ON e.id = a.id
      WHERE e.email LIKE '%@role-coverage.staging.siifmart.invalid') <> v_count THEN
    RAISE EXCEPTION 'Fixture accounts reuse password hashes';
  END IF;
END;
$$;
SELECT set_config('test.coverage_actors', (
  SELECT jsonb_agg(to_jsonb(actor))::text FROM (
    SELECT DISTINCT ON (s.country,s.type) e.id,e.email,e.role,e.site_id,s.country,
      (SELECT foreign_site.id FROM public.sites foreign_site
       WHERE foreign_site.country <> s.country AND foreign_site.type = s.type LIMIT 1) AS foreign_site
    FROM public.employees e JOIN public.sites s ON s.id = e.site_id
    WHERE e.email LIKE '%@role-coverage.staging.siifmart.invalid'
      AND ((s.type = 'Distribution Center' AND e.role = 'picker')
        OR (s.type = 'Warehouse' AND e.role = 'driver')
        OR (s.type = 'Store' AND e.role = 'cashier'))
    ORDER BY s.country,s.type,e.id
  ) actor
), true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE actor jsonb; v_cases integer := 0;
BEGIN
  FOR actor IN SELECT value FROM jsonb_array_elements(current_setting('test.coverage_actors')::jsonb)
  LOOP
    PERFORM set_config('request.jwt.claims', jsonb_build_object(
      'sub', actor->>'id', 'email', actor->>'email', 'role', 'authenticated')::text, true);
    IF public.get_my_role() IS DISTINCT FROM actor->>'role'
       OR public.get_my_country_code() IS DISTINCT FROM actor->>'country'
       OR NOT public.is_site_in_my_authorized_scope(actor->>'site_id', actor->>'country')
       OR public.is_site_in_my_authorized_scope(actor->>'foreign_site', NULL)
       OR NOT EXISTS (SELECT 1 FROM public.employees WHERE id = (actor->>'id')::uuid) THEN
      RAISE EXCEPTION 'Fixture employee authorization or country boundary failed';
    END IF;
    v_cases := v_cases + 1;
  END LOOP;
  IF v_cases <> 6 THEN RAISE EXCEPTION 'Expected six representative role/country cases'; END IF;
END;
$$;
ROLLBACK;
SELECT 'All operational roles covered; fixture profiles, unique hashes, currencies and six role/site RLS checks passed' AS result;
