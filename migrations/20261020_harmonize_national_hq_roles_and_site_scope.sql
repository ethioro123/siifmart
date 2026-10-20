-- ============================================================================
-- Migration: 20261020_harmonize_national_hq_roles_and_site_scope.sql
-- Purpose:
--   1. Expands public.employees check constraint (check_employee_role) to
--      include all canonical National Corporate HQ Directorate roles and aliases.
--   2. Expands public.is_hq_executive() in Postgres so ALL National Corporate
--      Directorate and HQ roles (both new canonical codes and legacy aliases)
--      can see facilities across their sovereign nation.
--   3. Updates existing staging HQ Directorate employees to use canonical codes:
--      'country_managing_director', 'head_of_operations', 'head_of_finance',
--      'head_of_procurement', 'head_of_hr', 'head_of_supply_chain',
--      'head_of_merchandising', 'head_of_it', 'head_of_audit'.
--   4. Syncs public.users and auth.users raw_user_meta_data for staging users.
-- ============================================================================

-- 1. Upgrade public.employees role check constraint
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS check_employee_role;

ALTER TABLE public.employees ADD CONSTRAINT check_employee_role CHECK (
  role::text = ANY (ARRAY[
    -- Executive & Central Leadership
    'super_admin'::text, 'CEO'::text, 'ceo'::text,
    'country_managing_director'::text, 'admin'::text,
    -- Corporate Directorate & Department Heads
    'head_of_operations'::text, 'operations_head'::text, 'operations_manager'::text,
    'head_of_finance'::text, 'finance_head'::text, 'finance_manager'::text,
    'head_of_procurement'::text, 'procurement_head'::text, 'procurement_manager'::text,
    'head_of_hr'::text, 'hr_head'::text, 'hr_manager'::text, 'hr'::text,
    'head_of_supply_chain'::text, 'supply_chain_head'::text, 'supply_chain_manager'::text,
    'head_of_merchandising'::text, 'merchandising_head'::text, 'merchandising_manager'::text,
    'head_of_it'::text, 'it_head'::text, 'it_support'::text,
    'head_of_audit'::text, 'audit_head'::text, 'auditor'::text, 'internal_auditor'::text,
    -- Regional Governance
    'regional_manager'::text, 'regional_procurement_lead'::text,
    'regional_finance_officer'::text, 'regional_hr_officer'::text,
    'regional_logistics_lead'::text, 'regional_security_supervisor'::text,
    -- Facility Management
    'store_manager'::text, 'warehouse_manager'::text, 'logistics_manager'::text,
    'inventory_manager'::text, 'security_manager'::text, 'dispatch_manager'::text,
    'assistant_manager'::text, 'vendor_relations_manager'::text,
    'fleet_maintenance_supervisor'::text, 'shift_lead'::text, 'cs_manager'::text,
    'store_supervisor'::text,
    -- Frontline Store Operations
    'cashier'::text, 'sales_associate'::text, 'pos'::text,
    'customer_service'::text, 'merchandiser'::text,
    -- Frontline Warehouse & Logistics
    'stock_clerk'::text, 'picker'::text, 'packer'::text,
    'receiver'::text, 'driver'::text, 'forklift_operator'::text,
    'inventory_specialist'::text, 'dispatcher'::text, 'returns_clerk'::text,
    -- Specialists & Officers
    'buyer'::text, 'demand_planner'::text, 'replenishment_planner'::text,
    'customs_import_specialist'::text, 'inbound_qc_inspector'::text,
    'store_operations_auditor'::text, 'loss_prevention'::text,
    'accountant'::text, 'data_analyst'::text, 'treasury_officer'::text,
    'tax_compliance_officer'::text, 'credit_control_officer'::text,
    'training_coordinator'::text, 'payroll_specialist'::text,
    'talent_recruiter'::text, 'hr_generalist'::text
  ])
);

-- 2. Upgrade public.is_hq_executive()
CREATE OR REPLACE FUNCTION public.is_hq_executive()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
  SELECT auth.uid() IS NOT NULL
     AND (
       lower(coalesce(public.get_my_role(), '')) IN (
         'super_admin', 'ceo',
         -- Sovereign Country Leadership
         'country_managing_director', 'admin',
         -- Operations Directorate
         'head_of_operations', 'operations_head', 'operations_manager',
         -- Finance Directorate
         'head_of_finance', 'finance_head', 'finance_manager',
         -- Procurement Directorate
         'head_of_procurement', 'procurement_head', 'procurement_manager', 'buyer',
         -- Supply Chain Directorate
         'head_of_supply_chain', 'supply_chain_head', 'supply_chain_manager', 'demand_planner',
         -- Human Resources Directorate
         'head_of_hr', 'hr_head', 'hr_manager',
         -- Merchandising Directorate
         'head_of_merchandising', 'merchandising_head', 'merchandising_manager',
         -- IT & Infrastructure Directorate
         'head_of_it', 'it_head', 'it_support',
         -- Internal Audit & Compliance Directorate
         'head_of_audit', 'audit_head', 'auditor', 'internal_auditor'
       )
       OR EXISTS (
         SELECT 1 FROM public.employees e
         JOIN public.sites s ON s.id = e.site_id
         WHERE e.id = auth.uid()
           AND s.type = 'Administration'
           AND (s.code LIKE '%-HQ' OR s.name ILIKE '%Central Operations%' OR s.name ILIKE '%National HQ%')
       )
     );
$function$;

-- 3. Update HQ Directorate employees in public.employees to canonical roles
UPDATE public.employees
SET role = 'country_managing_director'
WHERE site_id IN ('bb0425bc-3119-449a-a685-b871e552bee0', '6c38f106-4590-4ff3-ae68-b9ab657fff99')
  AND (role = 'admin' OR email IN ('et.admin@staging.siifmart.com', 'ke.admin@staging.siifmart.com'));

UPDATE public.employees
SET role = 'head_of_operations'
WHERE site_id IN ('bb0425bc-3119-449a-a685-b871e552bee0', '6c38f106-4590-4ff3-ae68-b9ab657fff99')
  AND (role = 'operations_manager' OR email IN ('et.operationsmanager@staging.siifmart.com', 'ke.operationsmanager@staging.siifmart.com'));

UPDATE public.employees
SET role = 'head_of_finance'
WHERE site_id IN ('bb0425bc-3119-449a-a685-b871e552bee0', '6c38f106-4590-4ff3-ae68-b9ab657fff99')
  AND (role = 'finance_manager' OR email IN ('et.financemanager@staging.siifmart.com', 'ke.financemanager@staging.siifmart.com'));

UPDATE public.employees
SET role = 'head_of_procurement'
WHERE site_id IN ('bb0425bc-3119-449a-a685-b871e552bee0', '6c38f106-4590-4ff3-ae68-b9ab657fff99')
  AND (role = 'procurement_manager' OR email IN ('et.procurementmanager@staging.siifmart.com', 'ke.procurementmanager@staging.siifmart.com'));

UPDATE public.employees
SET role = 'head_of_hr'
WHERE site_id IN ('bb0425bc-3119-449a-a685-b871e552bee0', '6c38f106-4590-4ff3-ae68-b9ab657fff99')
  AND (role = 'hr_manager' OR email IN ('et.hrmanager@staging.siifmart.com', 'ke.hrmanager@staging.siifmart.com'));

UPDATE public.employees
SET role = 'head_of_supply_chain'
WHERE site_id IN ('bb0425bc-3119-449a-a685-b871e552bee0', '6c38f106-4590-4ff3-ae68-b9ab657fff99')
  AND (role = 'supply_chain_manager' OR email IN ('et.supplychainmanager@staging.siifmart.com', 'ke.supplychainmanager@staging.siifmart.com'));

UPDATE public.employees
SET role = 'head_of_merchandising'
WHERE site_id IN ('bb0425bc-3119-449a-a685-b871e552bee0', '6c38f106-4590-4ff3-ae68-b9ab657fff99')
  AND (role = 'merchandising_manager' OR email IN ('et.merchandisingmanager@staging.siifmart.com', 'ke.merchandisingmanager@staging.siifmart.com'));

UPDATE public.employees
SET role = 'head_of_it'
WHERE site_id IN ('bb0425bc-3119-449a-a685-b871e552bee0', '6c38f106-4590-4ff3-ae68-b9ab657fff99')
  AND (role = 'it_support' OR email IN ('et.itsupport@staging.siifmart.com', 'ke.itsupport@staging.siifmart.com'));

UPDATE public.employees
SET role = 'head_of_audit'
WHERE site_id IN ('bb0425bc-3119-449a-a685-b871e552bee0', '6c38f106-4590-4ff3-ae68-b9ab657fff99')
  AND (role = 'auditor' OR email IN ('et.auditor@staging.siifmart.com', 'ke.auditor@staging.siifmart.com'));

-- 4. Sync public.users
UPDATE public.users u
SET role = e.role
FROM public.employees e
WHERE lower(u.email) = lower(e.email)
  AND u.role IS DISTINCT FROM e.role;

-- 5. Sync auth.users metadata
UPDATE auth.users u
SET raw_user_meta_data = jsonb_set(coalesce(u.raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb(e.role))
FROM public.employees e
WHERE lower(u.email) = lower(e.email)
  AND (u.raw_user_meta_data->>'role' IS DISTINCT FROM e.role);
