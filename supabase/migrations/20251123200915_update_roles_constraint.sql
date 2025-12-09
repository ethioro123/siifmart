-- Update the check constraint for employee roles to include new positions
ALTER TABLE employees DROP CONSTRAINT employees_role_check;

ALTER TABLE employees ADD CONSTRAINT employees_role_check CHECK (role IN (
  'super_admin', 'admin', 'manager', 'wms', 'pos', 'picker', 'hr', 'auditor', 'driver',
  'finance_manager', 'procurement_manager', 'store_supervisor', 'inventory_specialist', 'cs_manager', 'it_support'
));
