-- ============================================================================
-- Migration: 20261014_employee_extended_profile_columns.sql
-- Description: Adds scope_level, emergency_contact, address, and national_id_number
--              to employees table with check constraints and index.
-- ============================================================================

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS scope_level text NOT NULL DEFAULT 'HQ',
  ADD COLUMN IF NOT EXISTS emergency_contact text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS national_id_number text;

ALTER TABLE employees
  DROP CONSTRAINT IF EXISTS employees_scope_level_check;
ALTER TABLE employees
  ADD CONSTRAINT employees_scope_level_check CHECK (scope_level IN ('HQ', 'REGIONAL'));

CREATE INDEX IF NOT EXISTS idx_employees_scope_level ON employees(scope_level);
