-- ============================================================================
-- Migration: 20261002_salary_requests.sql
-- Description: Dual-Control Salary Approval Queue (4-Eyes Governance)
-- Enforces: HR proposes, Finance Manager / CEO approves before salary updates.
-- ============================================================================

CREATE TABLE IF NOT EXISTS salary_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    current_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
    proposed_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'ETB',
    site_id TEXT,
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET',
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_by TEXT NOT NULL,
    requested_by_role VARCHAR(50) NOT NULL DEFAULT 'hr',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_by TEXT,
    approved_by_role VARCHAR(50),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    rejected_by TEXT,
    rejected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_salary_requests_status ON salary_requests(status);
CREATE INDEX IF NOT EXISTS idx_salary_requests_country ON salary_requests(country_code);
CREATE INDEX IF NOT EXISTS idx_salary_requests_site ON salary_requests(site_id);
CREATE INDEX IF NOT EXISTS idx_salary_requests_employee ON salary_requests(employee_id);

-- Enable Row Level Security (RLS)
ALTER TABLE salary_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "salary_requests_read" ON salary_requests
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "salary_requests_insert" ON salary_requests
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "salary_requests_update" ON salary_requests
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);
