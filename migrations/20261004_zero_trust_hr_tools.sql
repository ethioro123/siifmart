-- ============================================================================
-- SIIFMART ZERO-TRUST HR ENTERPRISE SUITE: ADVANCED TOOLS & RECRUITMENT PIPELINE
-- Migration: 20261004_zero_trust_hr_tools.sql
-- Purpose:
--   1. Country-scoped HR Policy configuration (hr_country_policies)
--   2. Disciplinary & Grievance Register (disciplinary_records)
--   3. Recruitment Pipeline: Requisitions & Candidates (job_requisitions, job_candidates)
--   4. Structured Performance Reviews (performance_reviews)
--   5. Training Records & Certifications (training_records)
-- Traceability: .agent/RULES.md (Rule 1, Rule 6, Rule 7, Rule 9, Rule 18)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. COUNTRY-SCOPED HR POLICY CONFIGURATION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hr_country_policies (
    country_code VARCHAR(10) PRIMARY KEY,
    annual_leave_days INTEGER NOT NULL DEFAULT 16,
    sick_leave_days INTEGER NOT NULL DEFAULT 30,
    maternity_leave_days INTEGER NOT NULL DEFAULT 120,
    paternity_leave_days INTEGER NOT NULL DEFAULT 3,
    carry_over_max_days INTEGER NOT NULL DEFAULT 5,
    standard_work_hours_per_day NUMERIC(4, 2) NOT NULL DEFAULT 8.00,
    late_grace_period_mins INTEGER NOT NULL DEFAULT 15,
    overtime_multiplier NUMERIC(3, 2) NOT NULL DEFAULT 1.25,
    geofence_radius_meters INTEGER NOT NULL DEFAULT 200,
    dormant_account_threshold_days INTEGER NOT NULL DEFAULT 30,
    two_tier_leave_approval_required BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_by TEXT
);

INSERT INTO public.hr_country_policies (
    country_code, annual_leave_days, sick_leave_days, maternity_leave_days, paternity_leave_days,
    carry_over_max_days, standard_work_hours_per_day, late_grace_period_mins, overtime_multiplier,
    geofence_radius_meters, dormant_account_threshold_days, two_tier_leave_approval_required
) VALUES
    ('ET', 16, 30, 120, 3, 5, 8.00, 15, 1.25, 200, 30, true),
    ('KE', 21, 30, 90, 14, 14, 8.00, 15, 1.25, 200, 30, true)
ON CONFLICT (country_code) DO NOTHING;

ALTER TABLE public.hr_country_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hr_policies_read" ON public.hr_country_policies;
DROP POLICY IF EXISTS "hr_policies_write" ON public.hr_country_policies;

CREATE POLICY "hr_policies_read" ON public.hr_country_policies
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "hr_policies_write" ON public.hr_country_policies
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 2. DISCIPLINARY & GRIEVANCE REGISTER
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.disciplinary_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET',
    site_id TEXT,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    record_type TEXT NOT NULL CHECK (
        record_type IN ('Verbal Warning', 'Written Warning', 'Final Warning', 'Suspension', 'Grievance', 'Formal Investigation')
    ),
    severity TEXT NOT NULL DEFAULT 'Medium' CHECK (
        severity IN ('Low', 'Medium', 'High', 'Critical')
    ),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    appeal_status TEXT NOT NULL DEFAULT 'None' CHECK (
        appeal_status IN ('None', 'Pending Appeal', 'Upheld', 'Overturned')
    ),
    issued_by TEXT NOT NULL,
    issued_by_role TEXT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at DATE,
    confidential_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_disciplinary_country ON public.disciplinary_records(country_code);
CREATE INDEX IF NOT EXISTS idx_disciplinary_emp ON public.disciplinary_records(employee_id);

ALTER TABLE public.disciplinary_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "disciplinary_read" ON public.disciplinary_records;
DROP POLICY IF EXISTS "disciplinary_write" ON public.disciplinary_records;

CREATE POLICY "disciplinary_read" ON public.disciplinary_records
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "disciplinary_write" ON public.disciplinary_records
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 3. RECRUITMENT PIPELINE: REQUISITIONS & CANDIDATES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET',
    site_id TEXT NOT NULL,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    role TEXT NOT NULL,
    headcount INTEGER NOT NULL DEFAULT 1 CHECK (headcount > 0),
    target_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'pending_hq_approval' CHECK (
        status IN ('pending_hq_approval', 'approved', 'active_recruiting', 'closed', 'cancelled')
    ),
    justification TEXT NOT NULL,
    requested_by TEXT NOT NULL,
    requested_by_role TEXT NOT NULL,
    approved_by TEXT,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_job_reqs_country ON public.job_requisitions(country_code);

ALTER TABLE public.job_requisitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_reqs_read" ON public.job_requisitions;
DROP POLICY IF EXISTS "job_reqs_write" ON public.job_requisitions;

CREATE POLICY "job_reqs_read" ON public.job_requisitions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "job_reqs_write" ON public.job_requisitions
    FOR ALL TO authenticated USING (true) WITH CHECK (
        -- Maker-Checker 4-Eyes Principle: Requester cannot approve requisition
        approved_by IS NULL OR approved_by != requested_by
    );

CREATE TABLE IF NOT EXISTS public.job_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requisition_id UUID REFERENCES public.job_requisitions(id) ON DELETE SET NULL,
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET',
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    stage TEXT NOT NULL DEFAULT 'applied' CHECK (
        stage IN ('applied', 'screening', 'interview', 'offered', 'hired', 'rejected')
    ),
    interview_score NUMERIC(3, 1) DEFAULT 0.0,
    technical_score NUMERIC(3, 1) DEFAULT 0.0,
    culture_fit_score NUMERIC(3, 1) DEFAULT 0.0,
    interviewer_notes TEXT,
    offered_salary NUMERIC(12, 2),
    resume_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_candidates_country ON public.job_candidates(country_code);
CREATE INDEX IF NOT EXISTS idx_candidates_stage ON public.job_candidates(stage);

ALTER TABLE public.job_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "job_candidates_read" ON public.job_candidates;
DROP POLICY IF EXISTS "job_candidates_write" ON public.job_candidates;

CREATE POLICY "job_candidates_read" ON public.job_candidates
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "job_candidates_write" ON public.job_candidates
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 4. STRUCTURED PERFORMANCE REVIEWS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.performance_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET',
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    review_period TEXT NOT NULL, -- e.g. 'Q3 2026'
    operational_speed_score INTEGER NOT NULL CHECK (operational_speed_score BETWEEN 0 AND 100),
    shrinkage_prevention_score INTEGER NOT NULL CHECK (shrinkage_prevention_score BETWEEN 0 AND 100),
    attendance_score INTEGER NOT NULL CHECK (attendance_score BETWEEN 0 AND 100),
    collaboration_score INTEGER NOT NULL CHECK (collaboration_score BETWEEN 0 AND 100),
    composite_score INTEGER NOT NULL CHECK (composite_score BETWEEN 0 AND 100),
    strengths TEXT NOT NULL,
    growth_areas TEXT NOT NULL,
    pip_required BOOLEAN NOT NULL DEFAULT false,
    reviewer_id TEXT NOT NULL,
    reviewer_name TEXT NOT NULL,
    reviewer_role TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_perf_reviews_country ON public.performance_reviews(country_code);
CREATE INDEX IF NOT EXISTS idx_perf_reviews_emp ON public.performance_reviews(employee_id);

ALTER TABLE public.performance_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perf_reviews_read" ON public.performance_reviews;
DROP POLICY IF EXISTS "perf_reviews_write" ON public.performance_reviews;

CREATE POLICY "perf_reviews_read" ON public.performance_reviews
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "perf_reviews_write" ON public.performance_reviews
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 5. TRAINING RECORDS & CERTIFICATIONS (training_coordinator)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET',
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    module_name TEXT NOT NULL CHECK (
        module_name IN (
            'Cold Chain & FEFO Food Safety',
            'POS Anti-Theft & Drawer Balancing',
            'Heavy Equipment & Forklift Safety',
            'Zero-Trust Chain of Custody',
            'Customer Service Excellence',
            'Hazardous Materials & Fire Safety'
        )
    ),
    status TEXT NOT NULL DEFAULT 'certified' CHECK (
        status IN ('in_progress', 'certified', 'expired', 'failed')
    ),
    score INTEGER CHECK (score BETWEEN 0 AND 100),
    trainer_name TEXT NOT NULL,
    certified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    expires_at DATE,
    certificate_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_training_country ON public.training_records(country_code);
CREATE INDEX IF NOT EXISTS idx_training_emp ON public.training_records(employee_id);

ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "training_records_read" ON public.training_records;
DROP POLICY IF EXISTS "training_records_write" ON public.training_records;

CREATE POLICY "training_records_read" ON public.training_records
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "training_records_write" ON public.training_records
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

COMMENT ON TABLE public.hr_country_policies IS 'Country-specific HR statutory policies and attendance thresholds.';
COMMENT ON TABLE public.disciplinary_records IS 'Formal disciplinary warnings, investigations, and grievances.';
COMMENT ON TABLE public.job_requisitions IS 'Staff headcount requisitions requiring HQ executive approval.';
COMMENT ON TABLE public.job_candidates IS 'Applicant tracking and interview scorecards.';
COMMENT ON TABLE public.performance_reviews IS 'Quarterly performance reviews with 4 operational pillars.';
COMMENT ON TABLE public.training_records IS 'Mandatory training certifications managed by training coordinators.';
