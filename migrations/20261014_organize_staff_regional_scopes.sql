-- Migration: 20261014_organize_staff_regional_scopes.sql
-- Description: Organize staff records by territorial region and partition scope levels between HQ executive directors and REGIONAL field/branch teams.

-- 1. Sync employee region_code with their assigned site's region_code
UPDATE employees e
SET region_code = s.region_code
FROM sites s
WHERE e.site_id = s.id AND (e.region_code IS DISTINCT FROM s.region_code);

-- 2. Partition scope_level between HQ executive roles and REGIONAL territorial/branch workers
UPDATE employees
SET scope_level = CASE
  WHEN role IN (
    'super_admin',
    'ceo',
    'operations_manager',
    'hr_manager',
    'finance_manager',
    'procurement_manager',
    'auditor',
    'it_support'
  ) THEN 'HQ'
  ELSE 'REGIONAL'
END;
