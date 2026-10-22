-- ============================================================================
-- Migration: Add Guideline Hierarchy Extensions & Dynamic Reporting Columns
-- File: migrations/20261022_add_guideline_hierarchy_extensions.sql
-- Description:
--   1. Adds dynamic reporting manager foreign keys to public.employees
--      (reports_to_employee_id, functional_manager_employee_id).
--   2. Updates check_employee_role constraint with blueprint extension roles:
--      - group_cmo (Group Chief Marketing Officer)
--      - regional_it_manager (Regional IT Manager)
--      - regional_compliance_manager (Regional Quality & Compliance Manager)
--      - inbound_operations_supervisor (Combined Inbound Supervisor)
--      - outbound_operations_supervisor (Combined Outbound Supervisor)
--      - cash_office_officer (Store Cash Office / Control Officer)
--      - warehouse_administrator (Warehouse Documentation Administrator)
--   3. Updates public.is_admin() to include group_cmo.
-- ============================================================================

-- 1. Add Dynamic Reporting Line Foreign Keys to public.employees
ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS reports_to_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS functional_manager_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_reports_to
    ON public.employees(reports_to_employee_id);

CREATE INDEX IF NOT EXISTS idx_employees_functional_manager
    ON public.employees(functional_manager_employee_id);

-- 2. Update check_employee_role Constraint
ALTER TABLE public.employees
    DROP CONSTRAINT IF EXISTS check_employee_role;

ALTER TABLE public.employees
    ADD CONSTRAINT check_employee_role CHECK (
        role IN (
            -- Level 1: Global Executives
            'group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo',
            'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae',
            'super_admin', 'CEO', 'ceo',

            -- Level 2: Country Leadership
            'country_managing_director', 'admin',
            'country_operations_director', 'country_finance_director',
            'country_commercial_director', 'country_supply_chain_director',
            'country_hr_director', 'country_technology_director',
            'country_compliance_manager',

            -- Level 3: Corporate HQ Directorate Heads
            'head_of_operations', 'head_of_finance', 'head_of_hr', 'hr',
            'head_of_procurement', 'head_of_supply_chain', 'head_of_merchandising',
            'head_of_it', 'head_of_audit', 'internal_auditor',

            -- Level 4: Regional Operations & Area Managers
            'regional_operations_manager', 'area_operations_manager',

            -- Level 5: Regional Department Managers
            'regional_supply_chain_manager', 'regional_procurement_manager',
            'regional_finance_manager', 'regional_merchandising_manager',
            'regional_hr_manager', 'regional_logistics_manager',
            'regional_security_manager', 'regional_it_manager',
            'regional_compliance_manager',

            -- Level 6: Facility Captains
            'store_manager', 'warehouse_manager',

            -- Level 7: Functional & Department Managers
            'warehouse_operations_manager', 'transport_fleet_manager',
            'logistics_manager', 'inventory_manager', 'security_manager',
            'dispatch_manager', 'cs_manager', 'vendor_relations_manager',

            -- Level 8: Deputy, Shift Supervisors & Team Leaders
            'assistant_store_manager', 'assistant_manager',
            'shift_supervisor', 'store_supervisor', 'shift_lead',
            'pos_supervisor', 'stock_control_supervisor', 'receiving_supervisor',
            'inventory_control_supervisor', 'putaway_replenishment_supervisor',
            'picking_supervisor', 'packing_supervisor', 'dispatch_supervisor',
            'returns_waste_supervisor', 'fleet_maintenance_supervisor',
            'inbound_operations_supervisor', 'outbound_operations_supervisor',
            'receiving_team_leader', 'picking_team_leader', 'packing_team_leader',
            'dispatch_team_leader',

            -- Level 9: Specialists, Auditors & Planning Officers
            'store_operations_auditor', 'auditor', 'payroll_specialist',
            'treasury_officer', 'tax_compliance_officer', 'credit_control_officer',
            'cash_office_officer', 'accountant', 'data_analyst', 'training_coordinator',
            'talent_recruiter', 'hr_generalist', 'merchandising_specialist',
            'customs_import_specialist', 'it_support', 'dispatcher', 'buyer',
            'demand_planner', 'replenishment_planner', 'inbound_qc_inspector',
            'loss_prevention',

            -- Level 10: Frontline Store, Warehouse & Fleet Staff
            'cashier', 'store_associate', 'sales_associate', 'pos', 'merchandiser',
            'inventory_specialist', 'customer_service', 'stock_clerk',
            'receiving_operator', 'putaway_operator', 'replenishment_operator',
            'inventory_controller', 'stock_counter', 'dispatch_operator',
            'returns_operator', 'fleet_mechanic', 'picker', 'packer',
            'receiver', 'returns_clerk', 'driver', 'forklift_operator',
            'warehouse_administrator'
        )
    );

-- 3. Update public.is_admin() Function
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
        'group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo',
        'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae',
        'super_admin', 'ceo', 'admin', 'country_managing_director',
        'country_operations_director', 'country_finance_director',
        'country_commercial_director', 'country_supply_chain_director',
        'country_hr_director', 'country_technology_director', 'country_compliance_manager',
        'regional_operations_manager', 'area_operations_manager',
        'regional_supply_chain_manager', 'head_of_operations', 'head_of_finance',
        'head_of_hr', 'head_of_procurement', 'head_of_supply_chain'
    );
END;
$$;
