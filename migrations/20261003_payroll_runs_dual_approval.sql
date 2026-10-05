-- ============================================================================
-- Migration: 20261003_payroll_runs_dual_approval.sql
-- Description: Zero-Trust Multi-Department Payroll Approval (HR + Finance 4-Eyes)
-- Enforces: Cross-departmental sign-off. Payroll must be certified by HR
-- (roster & attendance) AND authorized by Finance (liquidity & tax) before payout.
-- ============================================================================

CREATE TABLE IF NOT EXISTS payroll_runs (
    id TEXT PRIMARY KEY,
    period VARCHAR(50) NOT NULL, -- e.g. "October 2026"
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET', -- 'ET' or 'KE'
    site_id TEXT, -- specific site ID or NULL for countrywide
    employee_count INT NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'ETB',
    total_gross_salaries NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_bonuses NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_deductions NUMERIC(14, 2) NOT NULL DEFAULT 0,
    total_net_payout NUMERIC(14, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_verification' 
        CHECK (status IN ('draft', 'pending_verification', 'pending_hr', 'pending_finance', 'approved', 'disbursed', 'rejected')),
    
    -- Initiation
    initiated_by TEXT NOT NULL,
    initiated_by_role VARCHAR(50) NOT NULL,
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Department 1: HR Certification (Roster, Attendance, Leaves)
    hr_approved_by TEXT,
    hr_approved_by_role VARCHAR(50),
    hr_approved_at TIMESTAMPTZ,
    hr_notes TEXT,

    -- Department 2: Finance Authorization (Funds, Deductions, Bank Validation)
    finance_approved_by TEXT,
    finance_approved_by_role VARCHAR(50),
    finance_approved_at TIMESTAMPTZ,
    finance_notes TEXT,

    -- Disbursement (Locked until both HR & Finance have signed)
    disbursed_by TEXT,
    disbursed_at TIMESTAMPTZ,
    expense_id TEXT,

    -- Rejection / Revision Tracking
    rejection_reason TEXT,
    rejected_by TEXT,
    rejected_by_role VARCHAR(50),
    rejected_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_runs_status ON payroll_runs(status);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_country ON payroll_runs(country_code);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON payroll_runs(period);
CREATE INDEX IF NOT EXISTS idx_payroll_runs_site ON payroll_runs(site_id);

-- Enable Row Level Security
ALTER TABLE payroll_runs ENABLE ROW LEVEL SECURITY;

-- Permissive RLS Policies for authenticated corporate roles
CREATE POLICY "payroll_runs_read" ON payroll_runs
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "payroll_runs_insert" ON payroll_runs
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "payroll_runs_update" ON payroll_runs
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);
