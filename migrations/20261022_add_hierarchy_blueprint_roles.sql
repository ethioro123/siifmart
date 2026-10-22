-- Migration: Add Enterprise Hierarchy Blueprint Roles
-- Codified under SOP-ORG-039 and Global Enterprise Governance Guidelines
-- Establishes the full spectrum of hierarchy roles from the multinational grocery retail blueprint:
--   - Level 3 Regional & Area Management: area_operations_manager, regional_supply_chain_manager
--   - Level 4 Store Management: assistant_store_manager, shift_supervisor, receiving_supervisor, stock_control_supervisor, pos_supervisor
--   - Level 4/5 Warehouse & Supply Chain: warehouse_operations_manager, transport_fleet_manager, inventory_control_supervisor, putaway_replenishment_supervisor, picking_supervisor, packing_supervisor, dispatch_supervisor, returns_waste_supervisor, receiving_team_leader, picking_team_leader, packing_team_leader, dispatch_team_leader, receiving_operator, putaway_operator, replenishment_operator, inventory_controller, stock_counter, dispatch_operator, returns_operator, fleet_mechanic, store_associate

DO $migration$
BEGIN
    -- 1. Update check_employee_role constraint on employees table
    ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS check_employee_role;
    ALTER TABLE public.employees ADD CONSTRAINT check_employee_role CHECK (
        role::text = ANY (ARRAY[
            -- Level 1: Global Executive
            'group_ceo'::text, 'group_coo'::text, 'group_cfo'::text,
            'group_cco'::text, 'group_csco'::text, 'group_chro'::text,
            'group_cto'::text, 'group_cio'::text, 'group_clco'::text, 'group_cae'::text,
            'super_admin'::text, 'CEO'::text, 'ceo'::text,

            -- Level 2: Country Executive
            'country_managing_director'::text, 'admin'::text,
            'country_operations_director'::text, 'country_finance_director'::text,
            'country_commercial_director'::text, 'country_supply_chain_director'::text,
            'country_hr_director'::text, 'country_technology_director'::text,
            'country_compliance_manager'::text,

            -- Level 3: Corporate HQ Directorate Heads (Legacy/Equivalent)
            'head_of_operations'::text, 'head_of_finance'::text, 'head_of_hr'::text,
            'head_of_procurement'::text, 'head_of_supply_chain'::text, 'head_of_merchandising'::text,
            'head_of_it'::text, 'head_of_audit'::text,

            -- Level 3: Regional & Area Management
            'regional_operations_manager'::text, 'area_operations_manager'::text,
            'regional_supply_chain_manager'::text,
            'regional_procurement_manager'::text, 'regional_finance_manager'::text,
            'regional_hr_manager'::text, 'regional_merchandising_manager'::text,
            'regional_logistics_manager'::text, 'regional_security_manager'::text,

            -- Level 4: Facility Captains & Operations Managers
            'store_manager'::text, 'warehouse_manager'::text,
            'warehouse_operations_manager'::text, 'transport_fleet_manager'::text,
            'logistics_manager'::text, 'inventory_manager'::text, 'security_manager'::text,
            'dispatch_manager'::text, 'cs_manager'::text, 'vendor_relations_manager'::text,

            -- Level 5: Assistant Managers, Shift Leads & Supervisors
            'assistant_store_manager'::text, 'assistant_manager'::text,
            'shift_supervisor'::text, 'store_supervisor'::text, 'shift_lead'::text,
            'receiving_supervisor'::text, 'stock_control_supervisor'::text, 'pos_supervisor'::text,
            'inventory_control_supervisor'::text, 'putaway_replenishment_supervisor'::text,
            'picking_supervisor'::text, 'packing_supervisor'::text, 'dispatch_supervisor'::text,
            'returns_waste_supervisor'::text, 'fleet_maintenance_supervisor'::text,

            -- Level 5: Team Leaders
            'receiving_team_leader'::text, 'picking_team_leader'::text,
            'packing_team_leader'::text, 'dispatch_team_leader'::text,

            -- Level 6: Corporate, Audit & Planning Specialists
            'store_operations_auditor'::text, 'auditor'::text, 'payroll_specialist'::text,
            'treasury_officer'::text, 'tax_compliance_officer'::text, 'credit_control_officer'::text,
            'accountant'::text, 'data_analyst'::text, 'training_coordinator'::text,
            'talent_recruiter'::text, 'hr_generalist'::text, 'merchandising_specialist'::text,
            'customs_import_specialist'::text, 'it_support'::text, 'dispatcher'::text,
            'buyer'::text, 'demand_planner'::text, 'replenishment_planner'::text,
            'inbound_qc_inspector'::text, 'loss_prevention'::text,

            -- Level 7: Frontline Store, Warehouse & Fleet Staff
            'cashier'::text, 'store_associate'::text, 'sales_associate'::text, 'pos'::text,
            'merchandiser'::text, 'inventory_specialist'::text, 'customer_service'::text,
            'stock_clerk'::text, 'receiving_operator'::text, 'putaway_operator'::text,
            'replenishment_operator'::text, 'inventory_controller'::text, 'stock_counter'::text,
            'dispatch_operator'::text, 'returns_operator'::text, 'fleet_mechanic'::text,
            'picker'::text, 'packer'::text, 'receiver'::text, 'returns_clerk'::text,
            'driver'::text, 'forklift_operator'::text, 'hr'::text, 'internal_auditor'::text
        ])
    );

    -- 2. Update is_admin to recognize Regional & Area Operations Leadership
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
        'group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_csco',
        'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae',
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

END $migration$;