-- Migration: Update role check constraint on employees table to support Finance Team additions
-- Roles added: treasury_officer, tax_compliance_officer, credit_control_officer
-- Copy this SQL and run it in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/sql/new

-- 1. Drop existing constraint if it exists
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS check_employee_role;

-- 2. Add the updated check constraint containing all roles (active, legacy, and newly introduced)
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
    'payroll_specialist',
    'talent_recruiter',
    'customs_import_specialist',
    'inbound_qc_inspector',
    
    -- Finance Directorate Team Additions (Level 4 Professional Staff)
    'treasury_officer',
    'tax_compliance_officer',
    'credit_control_officer'
  )
);
