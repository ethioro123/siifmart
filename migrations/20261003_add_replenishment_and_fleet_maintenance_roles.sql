-- Migration: Add replenishment_planner and fleet_maintenance_supervisor roles
-- Also updates check constraint on employees table to include all active roles
-- Copy and run in Supabase SQL Editor: https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/sql/new

-- 1. Drop existing check constraints if they exist
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS check_employee_role;
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_role_check;

-- 2. Add updated check constraint with all active, supervisory, specialist, and legacy roles
ALTER TABLE public.employees ADD CONSTRAINT check_employee_role CHECK (
  role IN (
    -- Level 1: Executive
    'super_admin',
    'CEO',
    'ceo',
    
    -- Level 2: Directors & Regional
    'regional_manager',
    'operations_manager',
    'finance_manager',
    'hr_manager',
    'procurement_manager',
    'supply_chain_manager',
    'admin', -- Legacy
    'hr',    -- Legacy
    
    -- Level 3: Site Managers & Dept Heads & Supervisors
    'store_manager',
    'warehouse_manager',
    'dispatch_manager',
    'assistant_manager',
    'shift_lead',
    'store_supervisor',
    'cs_manager',
    'logistics_manager',
    'inventory_manager',
    'security_manager',
    'fleet_maintenance_supervisor', -- Supply Chain Fleet Maintenance Supervisor
    
    -- Level 4: Staff & Specialists
    'cashier',
    'sales_associate',
    'stock_clerk',
    'picker',
    'packer',
    'receiver',
    'driver',
    'forklift_operator',
    'inventory_specialist',
    'customer_service',
    'auditor',
    'it_support',
    'pos',
    'dispatcher',
    'returns_clerk',
    'merchandiser',
    'loss_prevention',
    'accountant',
    'data_analyst',
    'training_coordinator',
    'buyer',
    'demand_planner',
    'payroll_specialist',
    'talent_recruiter',
    'replenishment_planner' -- Supply Chain Replenishment Planner
  )
);

COMMENT ON CONSTRAINT check_employee_role ON public.employees IS 
'Enforces authorized SIIFMART roles including Supply Chain additions: replenishment_planner and fleet_maintenance_supervisor';
