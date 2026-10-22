-- Canonical role hierarchy cleanup: removes legacy role aliases and re-points data, constraints,
-- RLS policies, functions and views to the canonical role IDs.
-- Mapping: super_admin/ceo/CEO -> group_ceo; admin -> country_managing_director;
-- head_of_operations/finance/hr/it/audit/supply_chain -> country_*_director / country_compliance_manager;
-- head_of_procurement/head_of_merchandising -> country_commercial_director; hr -> hr_generalist;
-- assistant_manager -> assistant_store_manager; shift_lead/store_supervisor -> shift_supervisor;
-- pos -> cashier; manager -> store_manager; logistics_manager -> regional_supply_chain_manager;
-- dispatch_manager -> dispatch_supervisor; security_manager -> regional_security_manager.
-- Historical audit columns (approved_by_role etc.) are intentionally left untouched.
BEGIN;

CREATE TEMP TABLE _role_map(old_role text PRIMARY KEY, new_role text NOT NULL) ON COMMIT DROP;
INSERT INTO _role_map VALUES
 ('super_admin','group_ceo'),('ceo','group_ceo'),('CEO','group_ceo'),
 ('admin','country_managing_director'),
 ('head_of_operations','country_operations_director'),
 ('head_of_finance','country_finance_director'),
 ('head_of_hr','country_hr_director'),
 ('head_of_procurement','country_commercial_director'),
 ('head_of_merchandising','country_commercial_director'),
 ('head_of_supply_chain','country_supply_chain_director'),
 ('head_of_it','country_technology_director'),
 ('head_of_audit','country_compliance_manager'),
 ('internal_auditor','auditor'),
 ('hr','hr_generalist'),
 ('assistant_manager','assistant_store_manager'),
 ('shift_lead','shift_supervisor'),('store_supervisor','shift_supervisor'),
 ('pos','cashier'),('manager','store_manager'),
 ('logistics_manager','regional_supply_chain_manager'),
 ('dispatch_manager','dispatch_supervisor'),
 ('security_manager','regional_security_manager');

-- 1. Live role data
ALTER TABLE public.employees DISABLE TRIGGER USER;
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS check_employee_role;
UPDATE public.employees e SET role = m.new_role FROM _role_map m WHERE e.role = m.old_role;
ALTER TABLE public.employees ENABLE TRIGGER USER;
ALTER TABLE public.employees ADD CONSTRAINT check_employee_role CHECK (role::text = ANY (ARRAY[
    'group_ceo',
    'group_coo',
    'group_cfo',
    'group_cco',
    'group_cmo',
    'group_csco',
    'group_chro',
    'group_cto',
    'group_cio',
    'group_clco',
    'group_cae',
    'country_managing_director',
    'country_operations_director',
    'country_finance_director',
    'country_commercial_director',
    'country_supply_chain_director',
    'country_hr_director',
    'country_technology_director',
    'country_compliance_manager',
    'regional_operations_manager',
    'area_operations_manager',
    'regional_supply_chain_manager',
    'regional_procurement_manager',
    'regional_finance_manager',
    'regional_hr_manager',
    'regional_merchandising_manager',
    'regional_logistics_manager',
    'regional_security_manager',
    'regional_it_manager',
    'regional_compliance_manager',
    'store_manager',
    'warehouse_manager',
    'warehouse_operations_manager',
    'transport_fleet_manager',
    'inventory_manager',
    'cs_manager',
    'vendor_relations_manager',
    'assistant_store_manager',
    'shift_supervisor',
    'receiving_supervisor',
    'stock_control_supervisor',
    'pos_supervisor',
    'inventory_control_supervisor',
    'putaway_replenishment_supervisor',
    'picking_supervisor',
    'packing_supervisor',
    'dispatch_supervisor',
    'returns_waste_supervisor',
    'fleet_maintenance_supervisor',
    'inbound_operations_supervisor',
    'outbound_operations_supervisor',
    'receiving_team_leader',
    'picking_team_leader',
    'packing_team_leader',
    'dispatch_team_leader',
    'store_operations_auditor',
    'auditor',
    'payroll_specialist',
    'treasury_officer',
    'tax_compliance_officer',
    'credit_control_officer',
    'cash_office_officer',
    'accountant',
    'data_analyst',
    'training_coordinator',
    'talent_recruiter',
    'hr_generalist',
    'merchandising_specialist',
    'customs_import_specialist',
    'it_support',
    'dispatcher',
    'buyer',
    'demand_planner',
    'replenishment_planner',
    'inbound_qc_inspector',
    'loss_prevention',
    'cashier',
    'store_associate',
    'sales_associate',
    'merchandiser',
    'inventory_specialist',
    'customer_service',
    'stock_clerk',
    'receiving_operator',
    'putaway_operator',
    'replenishment_operator',
    'inventory_controller',
    'stock_counter',
    'dispatch_operator',
    'returns_operator',
    'fleet_mechanic',
    'picker',
    'packer',
    'receiver',
    'returns_clerk',
    'driver',
    'forklift_operator',
    'warehouse_administrator'
]::text[]));

DO $do$
DECLARE r record;
BEGIN
  FOR r IN SELECT c.table_name, c.column_name FROM information_schema.columns c
           JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE'
          WHERE c.table_schema='public' AND c.column_name='role' AND c.table_name <> 'employees'
  LOOP
    EXECUTE format('UPDATE public.%I x SET %I = m.new_role FROM _role_map m WHERE x.%I::text = m.old_role', r.table_name, r.column_name, r.column_name);
  END LOOP;
END $do$;

UPDATE auth.users u
   SET raw_user_meta_data = jsonb_set(u.raw_user_meta_data, '{role}', to_jsonb(m.new_role))
  FROM _role_map m
 WHERE u.raw_user_meta_data->>'role' = m.old_role;

-- 2. Role normalizer: identity (no aliasing)
CREATE OR REPLACE FUNCTION public.normalize_role(p_role text)
 RETURNS text LANGUAGE sql IMMUTABLE SET search_path TO ''
AS $f$ SELECT lower(trim(coalesce(p_role, ''))) $f$;

-- 3. Rewrite functions, policies, view and defaults that hard-code legacy role literals
CREATE OR REPLACE FUNCTION pg_temp.remap_roles(src text) RETURNS text LANGUAGE plpgsql AS $f$
DECLARE r record; out text := src;
BEGIN
  FOR r IN SELECT old_role, new_role FROM _role_map LOOP
    out := replace(out, '''' || r.old_role || '''', '''' || r.new_role || '''');
  END LOOP;
  RETURN out;
END $f$;

DO $do$
DECLARE r record; def text; newdef text; cmd text; pat text;
BEGIN
  SELECT string_agg(old_role, '|') INTO pat FROM _role_map;
  FOR r IN
    SELECT p.oid, p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
     WHERE n.nspname IN ('public','private') AND p.prokind='f' AND p.proname <> 'normalize_role'
       AND pg_get_functiondef(p.oid) ~ ('''(' || pat || ')''')
  LOOP
    def := pg_get_functiondef(r.oid);
    newdef := pg_temp.remap_roles(def);
    IF newdef <> def THEN EXECUTE newdef; END IF;
  END LOOP;

  FOR r IN
    SELECT schemaname, tablename, policyname, qual, with_check FROM pg_policies
     WHERE (coalesce(qual,'') || coalesce(with_check,'')) ~ ('''(' || pat || ')''')
  LOOP
    cmd := format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    IF r.qual IS NOT NULL THEN cmd := cmd || ' USING (' || pg_temp.remap_roles(r.qual) || ')'; END IF;
    IF r.with_check IS NOT NULL THEN cmd := cmd || ' WITH CHECK (' || pg_temp.remap_roles(r.with_check) || ')'; END IF;
    EXECUTE cmd;
  END LOOP;

  FOR r IN
    SELECT schemaname, viewname, definition FROM pg_views
     WHERE schemaname IN ('public') AND definition ~ ('''(' || pat || ')''')
  LOOP
    EXECUTE format('CREATE OR REPLACE VIEW %I.%I AS %s', r.schemaname, r.viewname, rtrim(pg_temp.remap_roles(r.definition), ';'));
  END LOOP;

  FOR r IN
    SELECT table_name, column_name, column_default FROM information_schema.columns
     WHERE table_schema='public' AND column_default ~ ('''(' || pat || ')''')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I SET DEFAULT %s', r.table_name, r.column_name, pg_temp.remap_roles(r.column_default));
  END LOOP;
END $do$;

-- 4. Align error-message wording with canonical role names
DO $do$
DECLARE def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO def FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
   WHERE n.nspname='public' AND p.proname='check_system_config_country_sovereignty';
  IF def LIKE '%Only CEO or super_admin%' THEN
    EXECUTE replace(def, 'Only CEO or super_admin', 'Only the Group CEO');
  END IF;
END $do$;

COMMIT;
