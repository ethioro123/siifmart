-- ============================================================================
-- Migration: 20261014_regional_loan_and_lp_tasks.sql
-- Description: Support Emergency Staff Loaning repatriation & LP transfer discrepancy task escalation
-- Author: SIIFMART Architecture Team
-- Rule 9 compliant: Saved to migrations and provided runnable in-chat
-- ============================================================================

-- Step 1: Add loan tracking columns to employees table
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS home_site_id TEXT,
ADD COLUMN IF NOT EXISTS is_loaned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS loaned_at TIMESTAMPTZ;

-- Step 2: Add region and task classification columns to employee_tasks
ALTER TABLE public.employee_tasks
ADD COLUMN IF NOT EXISTS region_code TEXT,
ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'GENERAL';

-- Step 3: Performance indexes for loaned personnel queries and security audit task escalation
CREATE INDEX IF NOT EXISTS idx_employees_loaned 
  ON public.employees (is_loaned) WHERE is_loaned = TRUE;

CREATE INDEX IF NOT EXISTS idx_employee_tasks_region 
  ON public.employee_tasks (region_code);

CREATE INDEX IF NOT EXISTS idx_employee_tasks_assigned 
  ON public.employee_tasks (assigned_to);
