-- Extend the Administration support scope to the general HR caseworker.
CREATE OR REPLACE FUNCTION private.hr_site_scope(p_site_id text, p_country_code text DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT public.is_site_in_my_authorized_scope(p_site_id, p_country_code)
    OR EXISTS (
      SELECT 1 FROM public.employees actor
      JOIN public.sites home ON home.id = actor.site_id
      JOIN public.sites target ON target.id::text = p_site_id OR target.code = p_site_id
      WHERE actor.id = (SELECT auth.uid())
        AND COALESCE(lower(actor.status), 'active') = 'active'
        AND lower(actor.role) IN ('talent_recruiter','training_coordinator','payroll_specialist','hr_generalist')
        AND home.type = 'Administration'
        AND upper(home.country) = upper(target.country)
        AND (p_country_code IS NULL OR upper(p_country_code) = upper(target.country))
        AND ((home.code = upper(home.country) || '-HQ'
              AND home.region_code IS NULL AND actor.region_code IS NULL)
          OR (home.region_code IS NOT NULL
              AND actor.region_code = home.region_code
              AND target.region_code = home.region_code))
    );
$function$;
REVOKE ALL ON FUNCTION private.hr_site_scope(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.hr_site_scope(text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.hr_hq_scope(p_country_code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.employees actor
    JOIN public.sites home ON home.id = actor.site_id
    WHERE actor.id = (SELECT auth.uid())
      AND COALESCE(lower(actor.status), 'active') = 'active'
      AND lower(actor.role) IN ('talent_recruiter','training_coordinator','payroll_specialist','hr_generalist')
      AND home.type = 'Administration'
      AND home.code = upper(home.country) || '-HQ'
      AND home.region_code IS NULL AND actor.region_code IS NULL
      AND upper(home.country) = upper(p_country_code)
  );
$function$;
REVOKE ALL ON FUNCTION private.hr_hq_scope(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.hr_hq_scope(text) TO authenticated, service_role;

-- Generalists may inspect cases in their territory; only leads can decide them.
DROP POLICY IF EXISTS employee_change_requests_read_scoped ON public.employee_change_requests;
CREATE POLICY employee_change_requests_read_scoped ON public.employee_change_requests
FOR SELECT TO authenticated USING (
  (employee_id = (SELECT auth.uid()) OR
    lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr_manager','regional_hr_officer','hr_generalist'))
  AND private.hr_site_scope(site_id, country_code::text)
);
DROP POLICY IF EXISTS disciplinary_read_scoped ON public.disciplinary_records;
CREATE POLICY disciplinary_read_scoped ON public.disciplinary_records
FOR SELECT TO authenticated USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr_manager','regional_hr_officer','hr_generalist')
  AND private.hr_site_scope(site_id, country_code::text)
);

-- The old permissive INSERT policy bypassed the scoped requisition policy.
DROP POLICY IF EXISTS job_reqs_insert ON public.job_requisitions;
DROP POLICY IF EXISTS job_requisitions_read_scoped ON public.job_requisitions;
CREATE POLICY job_requisitions_read_scoped ON public.job_requisitions
FOR SELECT TO authenticated USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr_manager','regional_hr_officer','operations_manager','department_manager','talent_recruiter','hr_generalist')
  AND private.hr_site_scope(site_id, country_code::text)
);

-- Payroll specialists can prepare runs within their Administration territory.
-- Approval and disbursement updates remain with named leads.
DROP POLICY IF EXISTS payroll_runs_insert ON public.payroll_runs;
CREATE POLICY payroll_runs_insert ON public.payroll_runs
FOR INSERT TO authenticated WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer','finance_manager','regional_finance_officer','payroll_specialist')
  AND private.hr_site_scope(site_id, country_code::text)
  AND initiated_by IS NOT NULL
  AND hr_approved_by IS NULL AND finance_approved_by IS NULL
  AND disbursed_by IS NULL AND rejected_by IS NULL
);
DROP POLICY IF EXISTS payroll_runs_update ON public.payroll_runs;
CREATE POLICY payroll_runs_update ON public.payroll_runs
FOR UPDATE TO authenticated USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer','finance_manager','regional_finance_officer')
  AND private.hr_site_scope(site_id, country_code::text)
) WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer','finance_manager','regional_finance_officer')
  AND private.hr_site_scope(site_id, country_code::text)
  AND (hr_approved_by IS NULL OR hr_approved_by <> initiated_by)
);
DROP POLICY IF EXISTS payroll_runs_read_hr_support ON public.payroll_runs;
CREATE POLICY payroll_runs_read_hr_support ON public.payroll_runs
FOR SELECT TO authenticated USING (
  lower(public.get_my_role()) = 'payroll_specialist'
  AND private.hr_site_scope(site_id, country_code::text)
);

-- RLS selects rows; the trigger checks which lead is allowed to sign each
-- decision field, including changes sent directly to the API.
CREATE OR REPLACE FUNCTION private.guard_payroll_run_signoffs()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE actor_role text := lower(public.get_my_role());
BEGIN
  IF (NEW.hr_approved_by, NEW.hr_approved_at, NEW.hr_approved_by_role)
       IS DISTINCT FROM (OLD.hr_approved_by, OLD.hr_approved_at, OLD.hr_approved_by_role)
     AND actor_role NOT IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer') THEN
    RAISE EXCEPTION 'HR approval requires an HR lead';
  END IF;
  IF (NEW.finance_approved_by, NEW.finance_approved_at, NEW.finance_approved_by_role)
       IS DISTINCT FROM (OLD.finance_approved_by, OLD.finance_approved_at, OLD.finance_approved_by_role)
     AND actor_role NOT IN ('super_admin','ceo','admin','finance_manager','regional_finance_officer') THEN
    RAISE EXCEPTION 'Finance approval requires a finance lead';
  END IF;
  IF (NEW.disbursed_by, NEW.disbursed_at, NEW.expense_id)
       IS DISTINCT FROM (OLD.disbursed_by, OLD.disbursed_at, OLD.expense_id)
     AND actor_role NOT IN ('super_admin','ceo','admin','finance_manager','regional_finance_officer') THEN
    RAISE EXCEPTION 'Payroll disbursement requires a finance lead';
  END IF;
  IF (NEW.initiated_by, NEW.country_code, NEW.site_id)
       IS DISTINCT FROM (OLD.initiated_by, OLD.country_code, OLD.site_id) THEN
    RAISE EXCEPTION 'Payroll origin cannot be changed';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.guard_payroll_run_signoffs() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_payroll_run_signoffs ON public.payroll_runs;
CREATE TRIGGER guard_payroll_run_signoffs BEFORE UPDATE ON public.payroll_runs
FOR EACH ROW EXECUTE FUNCTION private.guard_payroll_run_signoffs();
