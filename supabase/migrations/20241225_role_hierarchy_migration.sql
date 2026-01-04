-- ═══════════════════════════════════════════════════════════════════════════════
-- ROLE MIGRATION: 4-Level Hierarchy for Multi-Store/Multi-Warehouse Operations
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor
-- 
-- This migration:
-- 1. Updates the role CHECK constraint to allow new roles
-- 2. Migrates existing employees from old roles to new roles
-- 3. Preserves backwards compatibility for legacy role names
-- ═══════════════════════════════════════════════════════════════════════════════

-- STEP 1: Drop existing role constraint (if any)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;

-- STEP 2: Add new role constraint with ALL valid roles
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE employees ADD CONSTRAINT employees_role_check CHECK (
    role IN (
        -- Level 1 - Executive
        'super_admin',
        -- Level 2 - Regional/Directors
        'regional_manager', 'operations_manager', 'finance_manager', 
        'hr_manager', 'procurement_manager', 'supply_chain_manager',
        -- Level 3 - Site Managers
        'store_manager', 'warehouse_manager', 'dispatch_manager',
        'assistant_manager', 'shift_lead',
        -- Level 4 - Staff
        'cashier', 'sales_associate', 'stock_clerk', 'picker', 'packer',
        'receiver', 'driver', 'forklift_operator', 'inventory_specialist',
        'customer_service', 'auditor', 'it_support',
        -- Legacy roles (backwards compatibility)
        'admin', 'manager', 'hr', 'pos', 'dispatcher', 
        'cs_manager', 'returns_clerk', 'merchandiser', 'loss_prevention', 
        'accountant', 'data_analyst', 'training_coordinator', 'store_supervisor'
    )
);

-- STEP 3: Migrate existing roles to new names
-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTE: Only run these if you want to REPLACE old roles with new equivalents
-- If you want to keep legacy roles working, skip this step

-- Option A: Keep legacy roles as-is (RECOMMENDED for gradual migration)
-- No action needed - legacy roles will continue to work

-- Option B: Fully migrate to new roles (BREAKING CHANGE)
-- Uncomment the following lines to migrate:

/*
-- admin -> operations_manager
UPDATE employees SET role = 'operations_manager' WHERE role = 'admin';

-- manager -> store_manager
UPDATE employees SET role = 'store_manager' WHERE role = 'manager';

-- hr -> hr_manager  
UPDATE employees SET role = 'hr_manager' WHERE role = 'hr';

-- pos -> sales_associate
UPDATE employees SET role = 'sales_associate' WHERE role = 'pos';

-- dispatcher -> driver (or keep as dispatcher)
UPDATE employees SET role = 'driver' WHERE role = 'dispatcher';

-- store_supervisor -> shift_lead
UPDATE employees SET role = 'shift_lead' WHERE role = 'store_supervisor';

-- cs_manager -> customer_service (or keep as legacy)
UPDATE employees SET role = 'customer_service' WHERE role = 'cs_manager';
*/

-- STEP 4: Verify migration
-- ═══════════════════════════════════════════════════════════════════════════════
-- Run this to see current role distribution:
SELECT role, COUNT(*) as count 
FROM employees 
GROUP BY role 
ORDER BY count DESC;

-- STEP 5: Create role hierarchy view (optional, for reporting)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW role_hierarchy AS
SELECT 
    role,
    CASE 
        WHEN role = 'super_admin' THEN 1
        WHEN role IN ('regional_manager', 'operations_manager', 'finance_manager', 'hr_manager', 'procurement_manager', 'supply_chain_manager', 'admin', 'hr') THEN 2
        WHEN role IN ('store_manager', 'warehouse_manager', 'dispatch_manager', 'assistant_manager', 'shift_lead', 'manager', 'store_supervisor') THEN 3
        ELSE 4
    END as hierarchy_level,
    CASE 
        WHEN role = 'super_admin' THEN 'Executive'
        WHEN role IN ('regional_manager', 'operations_manager', 'finance_manager', 'hr_manager', 'procurement_manager', 'supply_chain_manager', 'admin', 'hr') THEN 'Director'
        WHEN role IN ('store_manager', 'warehouse_manager', 'dispatch_manager', 'assistant_manager', 'shift_lead', 'manager', 'store_supervisor') THEN 'Manager'
        ELSE 'Staff'
    END as hierarchy_name,
    COUNT(*) as employee_count
FROM employees
GROUP BY role
ORDER BY hierarchy_level, role;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (if needed)
-- ═══════════════════════════════════════════════════════════════════════════════
/*
-- To rollback new roles to old:
UPDATE employees SET role = 'admin' WHERE role = 'operations_manager';
UPDATE employees SET role = 'manager' WHERE role = 'store_manager';
UPDATE employees SET role = 'hr' WHERE role = 'hr_manager';
UPDATE employees SET role = 'pos' WHERE role = 'sales_associate';
UPDATE employees SET role = 'dispatcher' WHERE role = 'driver' AND created_at > '2024-12-25';
UPDATE employees SET role = 'store_supervisor' WHERE role = 'shift_lead';
*/
