-- Canonical HQ directorate and regional manager role IDs.
-- Historical aliases appear here only to convert persisted data and existing authorization rules.
-- Keep regional scope predicates and existing policy command/role targets unchanged.

DO $role_migration$
DECLARE
  old_roles text[] := ARRAY[
    'operations_head', 'operations_manager', 'finance_head', 'finance_manager',
    'hr_head', 'hr_manager', 'procurement_head', 'procurement_manager',
    'supply_chain_head', 'supply_chain_manager', 'merchandising_head', 'merchandising_manager',
    'it_head', 'it_manager', 'audit_head',
    'regional_manager', 'regional_operations_director', 'regional_director',
    'regional_procurement_lead', 'regional_finance_officer', 'regional_hr_officer',
    'regional_merchandising_lead', 'regional_logistics_lead', 'regional_security_supervisor'
  ];
  new_roles text[] := ARRAY[
    'head_of_operations', 'head_of_operations', 'head_of_finance', 'head_of_finance',
    'head_of_hr', 'head_of_hr', 'head_of_procurement', 'head_of_procurement',
    'head_of_supply_chain', 'head_of_supply_chain', 'head_of_merchandising', 'head_of_merchandising',
    'head_of_it', 'head_of_it', 'head_of_audit',
    'regional_operations_manager', 'regional_operations_manager', 'regional_operations_manager',
    'regional_procurement_manager', 'regional_finance_manager', 'regional_hr_manager',
    'regional_merchandising_manager', 'regional_logistics_manager', 'regional_security_manager'
  ];
  item record;
  definition text;
  new_qual text;
  new_check text;
  i integer;
BEGIN
  IF array_length(old_roles, 1) <> array_length(new_roles, 1) THEN
    RAISE EXCEPTION 'Role migration mapping is incomplete';
  END IF;

  -- Rewrite function role checks from the live definitions, retaining each
  -- function's signature, language, owner, security mode, and search_path.
  FOR item IN
    SELECT n.nspname, p.proname, pg_get_functiondef(p.oid) AS ddl
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname IN ('public', 'private') AND p.proname <> 'normalize_role'
  LOOP
    definition := item.ddl;
    FOR i IN 1..array_length(old_roles, 1) LOOP
      definition := replace(definition, quote_literal(old_roles[i]), quote_literal(new_roles[i]));
    END LOOP;
    -- Head of Audit previously normalized to auditor. Retain the same access
    -- explicitly now that role normalization returns the actual role ID.
    IF definition IS DISTINCT FROM item.ddl AND position('''auditor''' IN definition) > 0 THEN
      definition := replace(definition, '''auditor''', '''auditor'', ''head_of_audit''');
    ELSIF item.proname IN (
      'enforce_employee_update_privileges', 'get_my_scope_level',
      'is_hq_executive', 'is_site_in_my_authorized_scope', 'procurement_supplier_scope'
    ) AND position('''auditor''' IN definition) > 0 THEN
      definition := replace(definition, '''auditor''', '''auditor'', ''head_of_audit''');
    END IF;
    IF definition IS DISTINCT FROM item.ddl THEN
      EXECUTE definition;
    END IF;
  END LOOP;

  -- Keep each policy's existing scope and grant target. Only role literals in
  -- its predicate change; head_of_audit retains the old auditor path.
  FOR item IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies WHERE schemaname IN ('public', 'private')
  LOOP
    new_qual := item.qual;
    new_check := item.with_check;
    FOR i IN 1..array_length(old_roles, 1) LOOP
      new_qual := replace(new_qual, quote_literal(old_roles[i]), quote_literal(new_roles[i]));
      new_check := replace(new_check, quote_literal(old_roles[i]), quote_literal(new_roles[i]));
    END LOOP;
    IF position('''auditor''::text' IN coalesce(new_qual, '')) > 0 THEN
      new_qual := replace(new_qual, '''auditor''::text', '''auditor''::text, ''head_of_audit''::text');
    END IF;
    IF position('''auditor''::text' IN coalesce(new_check, '')) > 0 THEN
      new_check := replace(new_check, '''auditor''::text', '''auditor''::text, ''head_of_audit''::text');
    END IF;
    IF new_qual IS DISTINCT FROM item.qual OR new_check IS DISTINCT FROM item.with_check THEN
      IF new_qual IS NOT NULL AND new_check IS NOT NULL THEN
        EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s) WITH CHECK (%s)',
          item.policyname, item.schemaname, item.tablename, new_qual, new_check);
      ELSIF new_qual IS NOT NULL THEN
        EXECUTE format('ALTER POLICY %I ON %I.%I USING (%s)',
          item.policyname, item.schemaname, item.tablename, new_qual);
      ELSIF new_check IS NOT NULL THEN
        EXECUTE format('ALTER POLICY %I ON %I.%I WITH CHECK (%s)',
          item.policyname, item.schemaname, item.tablename, new_check);
      END IF;
    END IF;
  END LOOP;

  SELECT pg_get_viewdef('public.role_hierarchy'::regclass, true) INTO definition;
  FOR i IN 1..array_length(old_roles, 1) LOOP
    definition := replace(definition, quote_literal(old_roles[i]), quote_literal(new_roles[i]));
  END LOOP;
  EXECUTE 'CREATE OR REPLACE VIEW public.role_hierarchy AS ' || definition;

  -- Convert live assignments and role-bearing workflow records. Actor-role
  -- audit columns are intentionally preserved as historical observations.
  ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS check_employee_role;
  FOR i IN 1..array_length(old_roles, 1) LOOP
    UPDATE public.employees SET role = new_roles[i] WHERE role = old_roles[i];
    FOR item IN
      SELECT table_name FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name = 'role'
        AND table_name IN (
          'facility_headcount_quotas', 'headcount_quota_requests',
          'job_candidates', 'job_requisitions', 'staff_schedules'
        )
    LOOP
      EXECUTE format('UPDATE public.%I SET role = %L WHERE role = %L',
        item.table_name, new_roles[i], old_roles[i]);
    END LOOP;
  END LOOP;

  UPDATE public.employees SET job_title = CASE job_title
    WHEN 'Regional Operations Director' THEN 'Regional Operations Manager'
    WHEN 'Regional Procurement Lead' THEN 'Regional Procurement Manager'
    WHEN 'Regional Finance Officer' THEN 'Regional Finance Manager'
    WHEN 'Regional HR Officer' THEN 'Regional Human Resources Manager'
    WHEN 'Regional Human Resources Officer' THEN 'Regional Human Resources Manager'
    WHEN 'Regional Merchandising Lead' THEN 'Regional Merchandising Manager'
    WHEN 'Regional Logistics Lead' THEN 'Regional Logistics Manager'
    WHEN 'Regional Security Supervisor' THEN 'Regional Security Manager'
    ELSE job_title END
  WHERE role LIKE 'regional_%_manager'
    AND job_title IN (
      'Regional Operations Director', 'Regional Procurement Lead', 'Regional Finance Officer',
      'Regional HR Officer', 'Regional Human Resources Officer', 'Regional Merchandising Lead',
      'Regional Logistics Lead', 'Regional Security Supervisor'
    );

  -- Auth app metadata is trusted but its role snapshot can differ from the
  -- employee record. Align it for the changed HQ and regional roles.
  UPDATE auth.users u SET
    raw_app_meta_data = jsonb_set(coalesce(u.raw_app_meta_data, '{}'::jsonb), '{role}', to_jsonb(e.role), true),
    raw_user_meta_data = jsonb_set(coalesce(u.raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb(e.role), true)
  FROM public.employees e
  WHERE e.id = u.id
    AND (e.role LIKE 'head_of_%' OR e.role LIKE 'regional_%_manager')
    AND ((u.raw_app_meta_data->>'role') IS DISTINCT FROM e.role
      OR (u.raw_user_meta_data->>'role') IS DISTINCT FROM e.role);
END $role_migration$;

-- No HQ or regional role is rewritten to a different department at runtime.
CREATE OR REPLACE FUNCTION public.normalize_role(p_role text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = '' AS $normalize$
  SELECT CASE lower(trim(coalesce(p_role, '')))
    WHEN 'country_managing_director' THEN 'admin'
    ELSE lower(trim(coalesce(p_role, '')))
  END;
$normalize$;

ALTER TABLE public.employees ADD CONSTRAINT check_employee_role
CHECK (role::text = ANY (ARRAY[
  'super_admin', 'CEO', 'ceo', 'country_managing_director', 'admin', 'head_of_operations',
  'head_of_finance', 'head_of_hr', 'head_of_procurement', 'head_of_supply_chain', 'head_of_merchandising', 'head_of_it',
  'head_of_audit', 'regional_operations_manager', 'regional_procurement_manager', 'regional_finance_manager', 'regional_hr_manager', 'regional_merchandising_manager',
  'regional_logistics_manager', 'regional_security_manager', 'store_manager', 'warehouse_manager', 'logistics_manager', 'inventory_manager',
  'security_manager', 'dispatch_manager', 'cs_manager', 'vendor_relations_manager', 'assistant_manager', 'fleet_maintenance_supervisor',
  'store_supervisor', 'shift_lead', 'store_operations_auditor', 'auditor', 'payroll_specialist', 'treasury_officer',
  'tax_compliance_officer', 'credit_control_officer', 'accountant', 'data_analyst', 'training_coordinator', 'talent_recruiter',
  'hr_generalist', 'merchandising_specialist', 'customs_import_specialist', 'it_support', 'dispatcher', 'buyer',
  'demand_planner', 'replenishment_planner', 'inbound_qc_inspector', 'loss_prevention', 'cashier', 'sales_associate',
  'pos', 'merchandiser', 'inventory_specialist', 'customer_service', 'stock_clerk', 'picker',
  'packer', 'receiver', 'returns_clerk', 'driver', 'forklift_operator', 'hr',
  'internal_auditor'
]::text[])) NOT VALID;
ALTER TABLE public.employees VALIDATE CONSTRAINT check_employee_role;

DO $verify_roles$
BEGIN
  IF public.normalize_role('head_of_finance') <> 'head_of_finance'
     OR public.normalize_role('regional_finance_manager') <> 'regional_finance_manager'
     OR public.normalize_role('regional_procurement_manager') <> 'regional_procurement_manager'
     OR EXISTS (SELECT 1 FROM public.employees WHERE role IN (
       'operations_manager', 'finance_manager', 'hr_manager', 'procurement_manager',
       'supply_chain_manager', 'merchandising_manager', 'regional_manager',
       'regional_procurement_lead', 'regional_finance_officer', 'regional_hr_officer',
       'regional_merchandising_lead', 'regional_logistics_lead', 'regional_security_supervisor'
     )) THEN
    RAISE EXCEPTION 'Canonical role migration did not complete';
  END IF;
END $verify_roles$;
