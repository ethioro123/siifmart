-- Migration: Harmonize HR & Payroll Governance and Maker-Checker Segregation
-- Target: supabase-staging
-- Description:
-- 1. Upgrades private.guard_payroll_run_signoffs() to use public.normalize_role()
--    and recognize canonical displayed roles (head_of_hr, head_of_finance, country_managing_director).
-- 2. Upgrades salary_requests_insert_scoped to authorize payroll_specialist and regional_manager.
-- 3. Harmonizes payroll_runs RLS policies (insert, select, update) to support normalized roles.

-- 1. Upgrade private.guard_payroll_run_signoffs()
CREATE OR REPLACE FUNCTION private.guard_payroll_run_signoffs()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  raw_role text := lower(public.get_my_role());
  actor_role text := public.normalize_role(raw_role);
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;

  -- HR Signoff Guard
  IF (NEW.hr_approved_by, NEW.hr_approved_at, NEW.hr_approved_by_role)
       IS DISTINCT FROM (OLD.hr_approved_by, OLD.hr_approved_at, OLD.hr_approved_by_role)
     AND actor_role NOT IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer')
     AND raw_role NOT IN ('head_of_hr', 'country_managing_director') THEN
    RAISE EXCEPTION 'HR approval requires an HR lead';
  END IF;

  -- Finance Signoff Guard
  IF (NEW.finance_approved_by, NEW.finance_approved_at, NEW.finance_approved_by_role)
       IS DISTINCT FROM (OLD.finance_approved_by, OLD.finance_approved_at, OLD.finance_approved_by_role)
     AND actor_role NOT IN ('super_admin','ceo','admin','finance_manager','regional_finance_officer')
     AND raw_role NOT IN ('head_of_finance', 'country_managing_director') THEN
    RAISE EXCEPTION 'Finance approval requires a finance lead';
  END IF;

  -- Disbursement Guard
  IF (NEW.disbursed_by, NEW.disbursed_at, NEW.expense_id)
       IS DISTINCT FROM (OLD.disbursed_by, OLD.disbursed_at, OLD.expense_id)
     AND actor_role NOT IN ('super_admin','ceo','admin','finance_manager','regional_finance_officer')
     AND raw_role NOT IN ('head_of_finance', 'country_managing_director') THEN
    RAISE EXCEPTION 'Payroll disbursement requires a finance lead';
  END IF;

  -- Immutable Origin Guard
  IF (NEW.initiated_by, NEW.country_code, NEW.site_id)
       IS DISTINCT FROM (OLD.initiated_by, OLD.country_code, OLD.site_id) THEN
    RAISE EXCEPTION 'Payroll origin cannot be changed';
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Upgrade salary_requests_insert_scoped
DROP POLICY IF EXISTS salary_requests_insert_scoped ON public.salary_requests;
CREATE POLICY salary_requests_insert_scoped ON public.salary_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      (
        (public.normalize_role(public.get_my_role()) = ANY (ARRAY[
          'super_admin'::text, 'ceo'::text, 'admin'::text, 'hr_manager'::text, 'regional_hr_officer'::text, 'hr'::text, 'payroll_specialist'::text, 'regional_manager'::text
        ]))
        AND public.is_site_in_my_authorized_scope(site_id, (country_code)::text)
      )
      OR
      (
        (employee_id = auth.uid())
        AND public.is_site_in_my_authorized_scope(site_id, (country_code)::text)
      )
    )
    AND ((status)::text = ANY (ARRAY['pending'::text, 'Pending'::text, 'draft'::text, 'Draft'::text]))
  );

-- 3. Upgrade payroll_runs RLS policies
DROP POLICY IF EXISTS payroll_runs_insert ON public.payroll_runs;
CREATE POLICY payroll_runs_insert ON public.payroll_runs
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      (public.normalize_role(public.get_my_role()) = ANY (ARRAY[
        'super_admin'::text, 'ceo'::text, 'admin'::text, 'hr'::text, 'hr_manager'::text, 'regional_hr_officer'::text, 'finance_manager'::text, 'regional_finance_officer'::text, 'payroll_specialist'::text
      ]))
      AND private.hr_site_scope(site_id, (country_code)::text)
      AND (initiated_by IS NOT NULL)
      AND ((status)::text = ANY ((ARRAY['draft'::character varying, 'pending_verification'::character varying, 'pending_hr'::character varying, 'pending_finance'::character varying])::text[]))
      AND (hr_approved_by IS NULL)
      AND (hr_approved_at IS NULL)
      AND (finance_approved_by IS NULL)
      AND (finance_approved_at IS NULL)
      AND (disbursed_by IS NULL)
      AND (disbursed_at IS NULL)
      AND (rejected_by IS NULL)
      AND (rejected_at IS NULL)
    )
  );

DROP POLICY IF EXISTS payroll_runs_read_finance ON public.payroll_runs;
CREATE POLICY payroll_runs_read_finance ON public.payroll_runs
  FOR SELECT TO authenticated
  USING (
    (public.normalize_role(public.get_my_role()) = ANY (ARRAY[
      'super_admin'::text, 'ceo'::text, 'admin'::text, 'hr_manager'::text, 'finance_manager'::text, 'cfo'::text, 'regional_finance_officer'::text, 'accountant'::text, 'auditor'::text
    ]))
    AND private.finance_site_scope(site_id, (country_code)::text)
  );

DROP POLICY IF EXISTS payroll_runs_update ON public.payroll_runs;
CREATE POLICY payroll_runs_update ON public.payroll_runs
  FOR UPDATE TO authenticated
  USING (
    (public.normalize_role(public.get_my_role()) = ANY (ARRAY[
      'super_admin'::text, 'ceo'::text, 'admin'::text, 'hr'::text, 'hr_manager'::text, 'regional_hr_officer'::text, 'finance_manager'::text, 'regional_finance_officer'::text
    ]))
    AND private.hr_site_scope(site_id, (country_code)::text)
  )
  WITH CHECK (
    (public.normalize_role(public.get_my_role()) = ANY (ARRAY[
      'super_admin'::text, 'ceo'::text, 'admin'::text, 'hr'::text, 'hr_manager'::text, 'regional_hr_officer'::text, 'finance_manager'::text, 'regional_finance_officer'::text
    ]))
    AND private.hr_site_scope(site_id, (country_code)::text)
    AND ((hr_approved_by IS NULL) OR (hr_approved_by <> initiated_by))
  );
