-- Migration: Update role check constraint on employees table to support Procurement & Sourcing Team additions
-- Directorate: Procurement Manager (procurement_manager)
-- Team Roles Added:
--   1. vendor_relations_manager: Supplier onboarding, scorecard performance ratings, contract renewals, cooperative programs in ET & KE.
--   2. customs_import_specialist: Cross-border freight documentation, letters of credit (LC), Port of Djibouti & Port of Mombasa clearances.
--   3. inbound_qc_inspector: Receiving dock food safety, cold-chain temperature compliance, packaging standards.
--
-- Copy and run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/sql/new

-- 1. Drop existing constraint if it exists
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS check_employee_role;

-- 2. Re-create constraint containing all valid active and specialized roles
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
    'treasury_officer',
    'tax_compliance_officer',
    'credit_control_officer',
    'customs_import_specialist',
    'inbound_qc_inspector'
  )
);
