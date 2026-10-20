-- Generalists submit a scoped case for lead approval. They cannot approve it.
CREATE POLICY employee_change_requests_hr_generalist_insert
ON public.employee_change_requests FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) = 'hr_generalist'
  AND private.hr_site_scope(site_id, country_code::text)
  AND EXISTS (
    SELECT 1 FROM public.employees subject
    WHERE subject.id = employee_id
      AND private.hr_site_scope(subject.site_id::text, country_code::text)
  )
  AND lower(requested_by_role) = 'hr_generalist'
  AND status = 'pending'
  AND approved_by IS NULL AND approved_at IS NULL
  AND rejected_by IS NULL AND rejected_at IS NULL
);

-- A preparer cannot insert a run already marked approved or disbursed.
DROP POLICY IF EXISTS payroll_runs_insert ON public.payroll_runs;
CREATE POLICY payroll_runs_insert ON public.payroll_runs
FOR INSERT TO authenticated WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer','finance_manager','regional_finance_officer','payroll_specialist')
  AND private.hr_site_scope(site_id, country_code::text)
  AND initiated_by IS NOT NULL
  AND status IN ('draft','pending_verification','pending_hr','pending_finance')
  AND hr_approved_by IS NULL AND hr_approved_at IS NULL
  AND finance_approved_by IS NULL AND finance_approved_at IS NULL
  AND disbursed_by IS NULL AND disbursed_at IS NULL
  AND rejected_by IS NULL AND rejected_at IS NULL
);
