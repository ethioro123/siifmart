-- ============================================================================
-- Migration: 20261028_hr_delegated_recruitment_pipeline.sql
-- Description: Phase 4: HR & Workforce Hiring Delegation of the Delegated Governance Framework.
--
-- Core Governance Rules:
-- 1. Hiring within approved site headcount quota & salary band:
--    Facility / Store Manager sources -> HR clearance (credentials & salary band) ->
--    Authorized Hiring Manager confirms offer (Routine fast-path: Finance not required).
-- 2. Unbudgeted Headcount or Salary Exceptions:
--    Department prepares -> HR & Finance clearance -> Country MD approval
--    (within national buffer of +10). Exceeding +10 escalates to Group CHRO / Group CEO.
-- 3. Dual Payroll Certification:
--    Maintained (Regional HR attestation -> Central HR certification -> Central Finance authorization).
-- 4. Invariants:
--    Zero Self-Approval: An employee cannot approve their own promotion, salary change, or hire.
--    Strict Multi-Country Sovereignty: strictly country-scoped.
-- ============================================================================

BEGIN;

-- 1. Country Governance Limits Table
CREATE TABLE IF NOT EXISTS public.country_governance_limits (
    country_code VARCHAR(10) PRIMARY KEY,
    po_regional_default_limit NUMERIC(14, 2) NOT NULL DEFAULT 10000000.00,
    po_country_limit NUMERIC(14, 2) NOT NULL DEFAULT 100000000.00,
    expense_regional_limit NUMERIC(14, 2) NOT NULL DEFAULT 2000000.00,
    expense_country_limit NUMERIC(14, 2) NOT NULL DEFAULT 20000000.00,
    headcount_country_buffer INTEGER NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.country_governance_limits (country_code, headcount_country_buffer)
VALUES ('KE', 10), ('ET', 10)
ON CONFLICT (country_code) DO UPDATE 
SET headcount_country_buffer = EXCLUDED.headcount_country_buffer;

ALTER TABLE public.country_governance_limits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'country_governance_limits' AND policyname = 'Allow authenticated read on country_governance_limits'
    ) THEN
        CREATE POLICY "Allow authenticated read on country_governance_limits"
        ON public.country_governance_limits FOR SELECT TO authenticated USING (true);
    END IF;
END $$;

-- 2. Enhance job_candidates Table
ALTER TABLE public.job_candidates
ADD COLUMN IF NOT EXISTS hiring_manager_approved_by text,
ADD COLUMN IF NOT EXISTS hiring_manager_approved_at timestamptz,
ADD COLUMN IF NOT EXISTS hiring_manager_notes text,
ADD COLUMN IF NOT EXISTS is_salary_exception boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_quota_exception boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cmd_approved_by text,
ADD COLUMN IF NOT EXISTS cmd_approved_at timestamptz,
ADD COLUMN IF NOT EXISTS cmd_notes text,
ADD COLUMN IF NOT EXISTS group_approved_by text,
ADD COLUMN IF NOT EXISTS group_approved_at timestamptz,
ADD COLUMN IF NOT EXISTS group_notes text;

-- 3. Enhance headcount_quota_requests Table
ALTER TABLE public.headcount_quota_requests
ADD COLUMN IF NOT EXISTS hr_cleared_by text,
ADD COLUMN IF NOT EXISTS hr_cleared_at timestamptz,
ADD COLUMN IF NOT EXISTS hr_clearance_notes text,
ADD COLUMN IF NOT EXISTS finance_cleared_by text,
ADD COLUMN IF NOT EXISTS finance_cleared_at timestamptz,
ADD COLUMN IF NOT EXISTS finance_clearance_notes text,
ADD COLUMN IF NOT EXISTS cmd_approved_by text,
ADD COLUMN IF NOT EXISTS cmd_approved_at timestamptz,
ADD COLUMN IF NOT EXISTS cmd_notes text,
ADD COLUMN IF NOT EXISTS escalated_to_group boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS group_approved_by text,
ADD COLUMN IF NOT EXISTS group_approved_at timestamptz,
ADD COLUMN IF NOT EXISTS group_notes text;

-- 4. Enhance salary_requests Table
ALTER TABLE public.salary_requests
ADD COLUMN IF NOT EXISTS hr_cleared_by text,
ADD COLUMN IF NOT EXISTS hr_cleared_at timestamptz,
ADD COLUMN IF NOT EXISTS hr_notes text,
ADD COLUMN IF NOT EXISTS finance_cleared_by text,
ADD COLUMN IF NOT EXISTS finance_cleared_at timestamptz,
ADD COLUMN IF NOT EXISTS finance_notes text,
ADD COLUMN IF NOT EXISTS cmd_approved_by text,
ADD COLUMN IF NOT EXISTS cmd_approved_at timestamptz,
ADD COLUMN IF NOT EXISTS escalated_to_group boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS group_approved_by text,
ADD COLUMN IF NOT EXISTS group_approved_at timestamptz;

-- 5. Update RLS on job_candidates to empower site/facility hiring managers
DROP POLICY IF EXISTS job_candidates_insert_scoped ON public.job_candidates;
CREATE POLICY job_candidates_insert_scoped ON public.job_candidates FOR INSERT TO authenticated
WITH CHECK (
    (
        lower(public.get_my_role()) = ANY (ARRAY[
            'group_ceo', 'country_managing_director', 'hr_generalist', 
            'country_hr_director', 'regional_hr_manager', 'talent_recruiter',
            'store_manager', 'warehouse_manager', 'regional_operations_manager', 'country_operations_director'
        ])
    )
    AND (
        private.hr_site_scope(site_id, country_code::text)
        OR public.is_site_in_my_authorized_scope(site_id, country_code::text)
    )
    AND (stage = 'applied' OR stage = 'screening' OR stage = 'interview')
    AND (hired_employee_id IS NULL)
);

DROP POLICY IF EXISTS job_candidates_read_scoped ON public.job_candidates;
CREATE POLICY job_candidates_read_scoped ON public.job_candidates FOR SELECT TO authenticated
USING (
    (
        lower(public.get_my_role()) = ANY (ARRAY[
            'group_ceo', 'country_managing_director', 'hr_generalist', 
            'country_hr_director', 'regional_hr_manager', 'talent_recruiter',
            'store_manager', 'warehouse_manager', 'regional_operations_manager', 'country_operations_director'
        ])
        AND (
            private.hr_site_scope(site_id, country_code::text)
            OR public.is_site_in_my_authorized_scope(site_id, country_code::text)
        )
    )
    OR (
        lower(public.get_my_role()) = ANY (ARRAY['country_finance_director', 'regional_finance_manager'])
        AND private.finance_site_scope(site_id, country_code::text)
    )
);

DROP POLICY IF EXISTS job_candidates_update_scoped ON public.job_candidates;
CREATE POLICY job_candidates_update_scoped ON public.job_candidates FOR UPDATE TO authenticated
USING (
    (
        lower(public.get_my_role()) = ANY (ARRAY[
            'group_ceo', 'country_managing_director', 'hr_generalist', 
            'country_hr_director', 'regional_hr_manager', 'talent_recruiter',
            'store_manager', 'warehouse_manager', 'regional_operations_manager', 'country_operations_director'
        ])
        AND (
            private.hr_site_scope(site_id, country_code::text)
            OR public.is_site_in_my_authorized_scope(site_id, country_code::text)
        )
    )
    OR (
        lower(public.get_my_role()) = ANY (ARRAY['country_finance_director', 'regional_finance_manager'])
        AND private.finance_site_scope(site_id, country_code::text)
    )
)
WITH CHECK (
    (
        lower(public.get_my_role()) = ANY (ARRAY[
            'group_ceo', 'country_managing_director', 'hr_generalist', 
            'country_hr_director', 'regional_hr_manager', 'talent_recruiter',
            'store_manager', 'warehouse_manager', 'regional_operations_manager', 'country_operations_director'
        ])
        AND (
            private.hr_site_scope(site_id, country_code::text)
            OR public.is_site_in_my_authorized_scope(site_id, country_code::text)
        )
    )
    OR (
        lower(public.get_my_role()) = ANY (ARRAY['country_finance_director', 'regional_finance_manager'])
        AND private.finance_site_scope(site_id, country_code::text)
    )
);

-- 6. Updated Trigger: private.guard_candidate_decisions()
CREATE OR REPLACE FUNCTION private.guard_candidate_decisions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    actor_role text := lower(coalesce(public.get_my_role(), ''));
    v_uid uuid := auth.uid();
    v_buffer int := 10;
BEGIN
    -- 1. Territory immutability
    IF (NEW.site_id, NEW.country_code, NEW.requisition_id)
        IS DISTINCT FROM (OLD.site_id, OLD.country_code, OLD.requisition_id) THEN
        RAISE EXCEPTION 'Candidate territory cannot be changed';
    END IF;

    -- 2. Zero Self-Approval: Candidate cannot approve or clear themselves
    IF v_uid IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.employees e 
            WHERE e.id = v_uid 
            AND (lower(e.email) = lower(NEW.email) OR lower(e.name) = lower(NEW.name))
        ) THEN
            RAISE EXCEPTION 'Zero-Trust Anti-Fraud Violation: You cannot participate in approving or clearing your own hiring process';
        END IF;
    END IF;

    -- 3. HR Clearance
    IF (NEW.hr_approved_by, NEW.hr_approved_at)
        IS DISTINCT FROM (OLD.hr_approved_by, OLD.hr_approved_at) THEN
        IF v_uid IS NOT NULL AND actor_role NOT IN ('group_ceo','group_chro','country_managing_director','hr_generalist','country_hr_director','regional_hr_manager') THEN
            RAISE EXCEPTION 'HR candidate clearance requires an authorized HR lead';
        END IF;
        IF lower(trim(coalesce(NEW.hr_approved_by, ''))) IN (lower(trim(NEW.name)), lower(trim(NEW.email))) THEN
            RAISE EXCEPTION 'Zero-Trust Anti-Fraud Violation: Candidate cannot approve their own HR clearance';
        END IF;
    END IF;

    -- 4. Finance Clearance (Mandatory for salary or quota exceptions)
    IF (NEW.finance_approved_by, NEW.finance_approved_at, NEW.offered_salary)
        IS DISTINCT FROM (OLD.finance_approved_by, OLD.finance_approved_at, OLD.offered_salary) THEN
        IF v_uid IS NOT NULL AND actor_role NOT IN ('group_ceo','group_cfo','country_managing_director','country_finance_director','regional_finance_manager') THEN
            RAISE EXCEPTION 'Salary clearance requires an authorized finance lead';
        END IF;
        IF lower(trim(coalesce(NEW.finance_approved_by, ''))) IN (lower(trim(NEW.name)), lower(trim(NEW.email))) THEN
            RAISE EXCEPTION 'Zero-Trust Anti-Fraud Violation: Candidate cannot approve their own Finance clearance';
        END IF;
    END IF;

    -- 5. Hiring Manager Confirmation
    IF (NEW.hiring_manager_approved_by, NEW.hiring_manager_approved_at)
        IS DISTINCT FROM (OLD.hiring_manager_approved_by, OLD.hiring_manager_approved_at) THEN
        IF lower(trim(coalesce(NEW.hiring_manager_approved_by, ''))) IN (lower(trim(NEW.name)), lower(trim(NEW.email))) THEN
            RAISE EXCEPTION 'Zero-Trust Anti-Fraud Violation: Candidate cannot confirm their own hiring offer';
        END IF;
    END IF;

    -- 6. Stage transition to 'hired' (Synaptic Activation)
    IF NEW.stage = 'hired' AND OLD.stage IS DISTINCT FROM 'hired' THEN
        -- Must have at least HR compliance & credentials clearance
        IF NEW.hr_approved_by IS NULL THEN
            RAISE EXCEPTION 'Hiring activation requires HR identity & credential clearance';
        END IF;

        -- Look up country headcount buffer from country_governance_limits
        SELECT coalesce(headcount_country_buffer, 10) INTO v_buffer
        FROM public.country_governance_limits
        WHERE country_code = NEW.country_code;
        IF v_buffer IS NULL THEN v_buffer := 10; END IF;

        -- If exception (salary or unbudgeted quota):
        IF coalesce(NEW.is_salary_exception, false) = true OR coalesce(NEW.is_quota_exception, false) = true THEN
            -- Requires Finance clearance
            IF NEW.finance_approved_by IS NULL THEN
                RAISE EXCEPTION 'Unbudgeted headcount or salary exceptions strictly require Finance clearance';
            END IF;

            -- Requires Country MD or Group Executive approval
            IF v_uid IS NOT NULL AND actor_role NOT IN ('country_managing_director', 'group_ceo', 'group_chro', 'group_cfo')
               AND NEW.cmd_approved_by IS NULL AND NEW.group_approved_by IS NULL THEN
                RAISE EXCEPTION 'Unbudgeted headcount or salary exceptions require Country Managing Director or Group Executive approval';
            END IF;
        ELSE
            -- Routine hiring within approved headcount quota & salary band:
            -- Sourced by Facility/Store Manager -> HR clearance -> Authorized Hiring Manager sign-off
            IF v_uid IS NOT NULL AND actor_role NOT IN (
                'group_ceo','group_chro','country_managing_director','country_operations_director','regional_operations_manager',
                'store_manager','warehouse_manager','country_hr_director','regional_hr_manager','hr_generalist'
            ) AND NEW.hiring_manager_approved_by IS NULL THEN
                RAISE EXCEPTION 'Routine hiring within quota requires Authorized Hiring Manager confirmation';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- 7. Updated Trigger: private.guard_requisition_approval()
CREATE OR REPLACE FUNCTION private.guard_requisition_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    actor_role text := lower(coalesce(public.get_my_role(), ''));
    v_uid uuid := auth.uid();
BEGIN
    IF (NEW.site_id, NEW.country_code, NEW.requested_by)
        IS DISTINCT FROM (OLD.site_id, OLD.country_code, OLD.requested_by) THEN
        RAISE EXCEPTION 'Requisition origin cannot be changed';
    END IF;

    IF (NEW.approved_by, NEW.approved_at, NEW.status)
        IS DISTINCT FROM (OLD.approved_by, OLD.approved_at, OLD.status)
        AND NEW.status = 'approved' THEN
        -- Maker-checker / Zero self-approval
        IF NEW.approved_by IS NULL OR lower(trim(NEW.approved_by)) = lower(trim(OLD.requested_by)) THEN
            RAISE EXCEPTION 'Maker-Checker Violation: Requisition requester cannot approve their own requisition';
        END IF;

        IF v_uid IS NOT NULL AND actor_role NOT IN ('group_ceo','group_chro','country_managing_director','hr_generalist','country_hr_director','regional_hr_manager') THEN
            RAISE EXCEPTION 'Requisition approval requires an authorized HR lead';
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- 8. Trigger on headcount_quota_requests
CREATE OR REPLACE FUNCTION private.guard_headcount_quota_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
    actor_role text := lower(coalesce(public.get_my_role(), ''));
    v_uid uuid := auth.uid();
    v_buffer int := 10;
BEGIN
    -- Origin cannot be changed once created
    IF (NEW.site_id, NEW.country_code, NEW.requested_by)
        IS DISTINCT FROM (OLD.site_id, OLD.country_code, OLD.requested_by) THEN
        RAISE EXCEPTION 'Headcount quota request origin cannot be changed';
    END IF;

    -- Maker-checker / Zero Self-Approval: Requester cannot approve or clear their own request
    IF (NEW.status = 'APPROVED' AND lower(trim(coalesce(NEW.reviewed_by, ''))) = lower(trim(OLD.requested_by)))
       OR (NEW.hr_cleared_by IS NOT NULL AND lower(trim(NEW.hr_cleared_by)) = lower(trim(OLD.requested_by)))
       OR (NEW.finance_cleared_by IS NOT NULL AND lower(trim(NEW.finance_cleared_by)) = lower(trim(OLD.requested_by))) THEN
        RAISE EXCEPTION 'Maker-Checker Violation: Requester cannot clear or approve their own headcount quota request';
    END IF;

    -- Look up country headcount buffer from country_governance_limits
    SELECT coalesce(headcount_country_buffer, 10) INTO v_buffer
    FROM public.country_governance_limits
    WHERE country_code = NEW.country_code;
    IF v_buffer IS NULL THEN v_buffer := 10; END IF;

    -- Automatic escalation detection: if increase_amount > v_buffer, mark escalated_to_group = true
    IF NEW.increase_amount > v_buffer THEN
        NEW.escalated_to_group := true;
    END IF;

    -- Approval guard
    IF NEW.status = 'APPROVED' AND OLD.status IS DISTINCT FROM 'APPROVED' THEN
        -- If exceeding national buffer (+10), escalates strictly to Group CHRO / Group CEO
        IF NEW.increase_amount > v_buffer THEN
            IF v_uid IS NOT NULL AND actor_role NOT IN ('group_ceo', 'group_chro')
               AND NEW.group_approved_by IS NULL THEN
                RAISE EXCEPTION 'Headcount expansion exceeding country buffer of +% requires Group CHRO or Group CEO approval', v_buffer;
            END IF;
        ELSE
            -- Within national buffer: Country MD, Country Ops Director, Country HR Director, or Group CEO
            IF v_uid IS NOT NULL AND actor_role NOT IN ('group_ceo', 'group_chro', 'country_managing_director', 'country_operations_director', 'country_hr_director') THEN
                RAISE EXCEPTION 'Headcount quota approval requires Country Managing Director or authorized Directorate approval';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS guard_headcount_quota_request ON public.headcount_quota_requests;
CREATE TRIGGER guard_headcount_quota_request
BEFORE UPDATE ON public.headcount_quota_requests
FOR EACH ROW EXECUTE FUNCTION private.guard_headcount_quota_request();

COMMIT;
