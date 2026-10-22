-- Migration: Add Group CEO (group_ceo) Global Executive Role
-- Codified under SOP-ORG-036 and Global Enterprise Governance Guidelines
-- Establishes 'group_ceo' as the top-level multinational executive role while maintaining backward compatibility with 'super_admin' and 'CEO'.

DO $migration$
BEGIN
    -- 1. Update the check_employee_role constraint on employees table to include 'group_ceo'
    ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS check_employee_role;
    ALTER TABLE public.employees ADD CONSTRAINT check_employee_role CHECK (
        role::text = ANY (ARRAY[
            'group_ceo'::text,
            'super_admin'::text, 'CEO'::text, 'ceo'::text,
            'country_managing_director'::text, 'admin'::text,
            'head_of_operations'::text, 'head_of_finance'::text, 'head_of_hr'::text,
            'head_of_procurement'::text, 'head_of_supply_chain'::text, 'head_of_merchandising'::text,
            'head_of_it'::text, 'head_of_audit'::text,
            'regional_operations_manager'::text, 'regional_procurement_manager'::text,
            'regional_finance_manager'::text, 'regional_hr_manager'::text,
            'regional_merchandising_manager'::text, 'regional_logistics_manager'::text,
            'regional_security_manager'::text,
            'store_manager'::text, 'warehouse_manager'::text,
            'logistics_manager'::text, 'inventory_manager'::text, 'security_manager'::text,
            'dispatch_manager'::text, 'cs_manager'::text, 'vendor_relations_manager'::text,
            'assistant_manager'::text, 'fleet_maintenance_supervisor'::text,
            'store_supervisor'::text, 'shift_lead'::text,
            'store_operations_auditor'::text, 'auditor'::text, 'payroll_specialist'::text,
            'treasury_officer'::text, 'tax_compliance_officer'::text, 'credit_control_officer'::text,
            'accountant'::text, 'data_analyst'::text, 'training_coordinator'::text,
            'talent_recruiter'::text, 'hr_generalist'::text, 'merchandising_specialist'::text,
            'customs_import_specialist'::text, 'it_support'::text, 'dispatcher'::text,
            'buyer'::text, 'demand_planner'::text, 'replenishment_planner'::text,
            'inbound_qc_inspector'::text, 'loss_prevention'::text,
            'cashier'::text, 'sales_associate'::text, 'pos'::text,
            'merchandiser'::text, 'inventory_specialist'::text, 'customer_service'::text,
            'stock_clerk'::text, 'picker'::text, 'packer'::text,
            'receiver'::text, 'returns_clerk'::text, 'driver'::text,
            'forklift_operator'::text, 'hr'::text, 'internal_auditor'::text
        ])
    );

    -- 2. Update normalize_role function to normalize 'group_ceo' to 'super_admin' for legacy RLS policies
    CREATE OR REPLACE FUNCTION public.normalize_role(p_role text)
    RETURNS text
    LANGUAGE sql
    IMMUTABLE
    SET search_path TO ''
    AS $$
      SELECT CASE lower(trim(coalesce(p_role, '')))
        WHEN 'group_ceo' THEN 'super_admin'
        WHEN 'country_managing_director' THEN 'admin'
        ELSE lower(trim(coalesce(p_role, ''))
      )
      END;
    $$;

    -- 3. Update is_hq_executive to recognize group_ceo
    CREATE OR REPLACE FUNCTION public.is_hq_executive()
    RETURNS boolean
    LANGUAGE sql
    STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'auth'
    AS $$
      SELECT auth.uid() IS NOT NULL
         AND lower(coalesce(public.get_my_role(), '')) IN ('group_ceo', 'super_admin', 'ceo', 'head_of_operations', 'head_of_finance');
    $$;

    -- 4. Update is_admin to recognize group_ceo
    CREATE OR REPLACE FUNCTION public.is_admin()
    RETURNS boolean
    LANGUAGE plpgsql
    STABLE SECURITY DEFINER
    SET search_path TO 'pg_catalog', 'public', 'auth'
    AS $$
    BEGIN
      IF (SELECT auth.uid()) IS NULL THEN
        RETURN false;
      END IF;

      RETURN lower(coalesce((SELECT public.get_my_role()), '')) IN (
        'group_ceo', 'super_admin', 'ceo', 'admin',
        'regional_operations_manager', 'head_of_operations', 'head_of_finance',
        'head_of_hr', 'head_of_procurement', 'head_of_supply_chain'
      );
    END;
    $$;

END $migration$;
