-- ============================================================================
-- SIIFMART ZERO-TRUST EMPLOYEE PROFILE GOVERNANCE & CROSS-DEPARTMENT APPROVALS
-- Migration: 20261005_employee_change_requests_and_profile_governance.sql
-- Purpose:
--   1. Add 'age' and 'date_of_birth' columns to public.employees
--   2. Create 'employee_change_requests' table for cross-departmental HR approvals
--   3. Add policy toggles to 'hr_country_policies' for country-isolated governance
--   4. RLS policies and performance indices
-- Traceability: .agent/RULES.md (Rule 1, Rule 2, Rule 6, Rule 7, Rule 9, Rule 18)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ADD AGE AND DATE_OF_BIRTH TO EMPLOYEES
-- ----------------------------------------------------------------------------
ALTER TABLE public.employees
    ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age IS NULL OR (age >= 16 AND age <= 100)),
    ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- ----------------------------------------------------------------------------
-- 2. CREATE EMPLOYEE CHANGE REQUESTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET',
    site_id TEXT,
    requested_by TEXT NOT NULL,
    requested_by_role TEXT NOT NULL DEFAULT 'hr',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    governance_category TEXT NOT NULL DEFAULT 'composite',
    required_approvers JSONB NOT NULL DEFAULT '[]'::jsonb,
    diffs JSONB NOT NULL DEFAULT '[]'::jsonb,
    full_proposed_employee JSONB NOT NULL DEFAULT '{}'::jsonb,
    reason TEXT NOT NULL,
    approved_by TEXT,
    approved_by_role TEXT,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    rejected_by TEXT,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_emp_changes_country ON public.employee_change_requests(country_code);
CREATE INDEX IF NOT EXISTS idx_emp_changes_emp ON public.employee_change_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_changes_status ON public.employee_change_requests(status);
CREATE INDEX IF NOT EXISTS idx_emp_changes_req_at ON public.employee_change_requests(requested_at DESC);

ALTER TABLE public.employee_change_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employee_change_requests_read" ON public.employee_change_requests;
DROP POLICY IF EXISTS "employee_change_requests_insert" ON public.employee_change_requests;
DROP POLICY IF EXISTS "employee_change_requests_update" ON public.employee_change_requests;

CREATE POLICY "employee_change_requests_read" ON public.employee_change_requests
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "employee_change_requests_insert" ON public.employee_change_requests
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "employee_change_requests_update" ON public.employee_change_requests
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 3. ADD GOVERNANCE POLICY COLUMNS TO HR_COUNTRY_POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.hr_country_policies
    ADD COLUMN IF NOT EXISTS require_finance_approval_for_salary BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS require_dept_approval_for_transfers BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS require_compliance_approval_for_identity BOOLEAN NOT NULL DEFAULT true;
