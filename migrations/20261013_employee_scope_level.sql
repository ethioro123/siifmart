-- ============================================================================
-- Migration: 20261013_employee_scope_level.sql
-- Description: Separates HQ workers (country-wide) from Regional workers
--              (locked to one region). All existing workers become HQ.
-- ============================================================================

-- 1. Scope column (HQ default)
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS scope_level text NOT NULL DEFAULT 'HQ';

ALTER TABLE employees
  DROP CONSTRAINT IF EXISTS employees_scope_level_check;
ALTER TABLE employees
  ADD CONSTRAINT employees_scope_level_check CHECK (scope_level IN ('HQ', 'REGIONAL'));

-- 2. Every current worker is HQ; clear the region lock that the earlier backfill applied
UPDATE employees SET scope_level = 'HQ', region_code = NULL;

-- 3. A REGIONAL worker must have a region
ALTER TABLE employees
  DROP CONSTRAINT IF EXISTS employees_regional_requires_region;
ALTER TABLE employees
  ADD CONSTRAINT employees_regional_requires_region
  CHECK (scope_level <> 'REGIONAL' OR region_code IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_employees_scope_level ON employees(scope_level);
