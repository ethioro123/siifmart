-- Update Database Schema to Support New Warehouse Roles
-- Run this in your Supabase SQL Editor FIRST, then run the migration script

-- Step 1: Drop the old constraint
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;

-- Step 2: Add new constraint with updated roles
ALTER TABLE employees ADD CONSTRAINT employees_role_check 
CHECK (role IN (
    'super_admin',
    'admin', 
    'manager',
    'warehouse_manager',  -- NEW: Replaces 'wms'
    'dispatcher',         -- NEW: Warehouse coordinator
    'pos',
    'picker',
    'hr',
    'auditor',
    'driver',
    'finance_manager',
    'procurement_manager',
    'store_supervisor',
    'inventory_specialist',
    'cs_manager',
    'it_support'
));

-- Step 3: Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'employees'::regclass 
AND conname = 'employees_role_check';

-- Step 4: Show current employees with old 'wms' role (if any)
SELECT id, name, email, role, site_id
FROM employees
WHERE role = 'wms';

COMMENT ON CONSTRAINT employees_role_check ON employees IS 
'Updated to support new warehouse hierarchy: warehouse_manager and dispatcher replace wms';
