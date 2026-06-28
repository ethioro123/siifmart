-- Migration: Update role check constraint on employees table
-- Copy this SQL and run it in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/sql/new

-- 1. Drop existing constraint if it exists
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS check_employee_role;

-- 2. Add the updated check constraint containing all roles (active, legacy, and newly introduced)
ALTER TABLE public.employees ADD CONSTRAINT check_employee_role CHECK (
  role IN (
    -- Level 1: Executive
    'super_admin',
    
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
    'store_supervisor',  -- Legacy
    'cs_manager',        -- Legacy
    'logistics_manager', -- New Manager
    'inventory_manager', -- New Manager
    'security_manager',  -- New Manager
    
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
    'pos',                  -- Legacy
    'dispatcher',           -- Legacy
    'returns_clerk',        -- Legacy
    'merchandiser',         -- Legacy
    'loss_prevention',      -- Legacy
    'accountant',           -- Legacy
    'data_analyst',         -- Legacy
    'training_coordinator', -- Legacy
    'buyer',                -- New Staff
    'demand_planner'        -- New Staff
  )
);
