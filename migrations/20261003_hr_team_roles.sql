-- Migration: Register Human Resources Team Roles (payroll_specialist, talent_recruiter)
-- Authorizes new Level 4 HR operational roles in public.employees check constraint
-- Executable in Supabase SQL Editor: https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/sql/new

ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS check_employee_role;

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
    'admin',
    'hr',
    
    -- Level 3: Site Managers & Dept Heads
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
    'vendor_relations_manager',
    'fleet_maintenance_supervisor',
    
    -- Level 4: Staff & Individual Contributors
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
    'customs_import_specialist',
    'inbound_qc_inspector',
    'replenishment_planner',
    'store_operations_auditor',
    'treasury_officer',
    'tax_compliance_officer',
    'credit_control_officer',
    
    -- Human Resources Operational Team (Level 4 Professional Staff)
    'payroll_specialist',
    'talent_recruiter'
  )
);

COMMENT ON CONSTRAINT check_employee_role ON public.employees IS 
'Enforces authorized SIIFMART roles including HR Team roles: payroll_specialist, talent_recruiter, and training_coordinator';
