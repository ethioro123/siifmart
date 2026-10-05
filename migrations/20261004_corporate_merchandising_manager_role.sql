-- Migration: Add corporate merchandising_manager role to employees check constraint
-- Establishes Merchandising as a centralized Corporate Administration Directorate role
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
    
    -- Level 2: Directors & Regional (Corporate Administration)
    'regional_manager',
    'operations_manager',
    'finance_manager',
    'hr_manager',
    'procurement_manager',
    'supply_chain_manager',
    'merchandising_manager', -- Corporate Merchandising & Category Pricing Lead
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
    'fleet_maintenance_supervisor',
    
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
    'merchandiser', -- Store Floor Visual Merchandiser & Facing Specialist
    'loss_prevention',
    'accountant',
    'data_analyst',
    'training_coordinator',
    'payroll_specialist',
    'talent_recruiter',
    'treasury_officer',
    'tax_compliance_officer',
    'credit_control_officer',
    'buyer',
    'demand_planner',
    'replenishment_planner',
    'vendor_relations_manager',
    'customs_import_specialist',
    'inbound_qc_inspector',
    'store_operations_auditor'
  )
);

COMMENT ON COLUMN public.employees.role IS 'SIIFMART enterprise role with strict Zero-Trust RBAC boundaries. Merchandising Manager is a Level 2 Corporate Administration role.';
