-- Resolve records without a site_id through the employee's assigned site.
CREATE FUNCTION private.hr_employee_scope(p_employee_id uuid, p_country_code text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.employees subject
    WHERE subject.id = p_employee_id
      AND private.hr_site_scope(subject.site_id::text, p_country_code)
  );
$function$;
REVOKE ALL ON FUNCTION private.hr_employee_scope(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.hr_employee_scope(uuid, text) TO authenticated, service_role;

DROP POLICY IF EXISTS training_records_read_scoped ON public.training_records;
CREATE POLICY training_records_read_scoped ON public.training_records
FOR SELECT TO authenticated USING (
  employee_id = (SELECT auth.uid()) OR
  (lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer','training_coordinator','hr_generalist')
   AND private.hr_employee_scope(employee_id, country_code::text))
);
DROP POLICY IF EXISTS training_records_insert_scoped ON public.training_records;
CREATE POLICY training_records_insert_scoped ON public.training_records
FOR INSERT TO authenticated WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer','training_coordinator')
  AND private.hr_employee_scope(employee_id, country_code::text)
);
DROP POLICY IF EXISTS training_records_update_scoped ON public.training_records;
CREATE POLICY training_records_update_scoped ON public.training_records
FOR UPDATE TO authenticated USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer','training_coordinator')
  AND private.hr_employee_scope(employee_id, country_code::text)
) WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer','training_coordinator')
  AND private.hr_employee_scope(employee_id, country_code::text)
);

DROP POLICY IF EXISTS performance_reviews_read_scoped ON public.performance_reviews;
CREATE POLICY performance_reviews_read_scoped ON public.performance_reviews
FOR SELECT TO authenticated USING (
  employee_id = (SELECT auth.uid()) OR
  (lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer','hr_generalist')
   AND private.hr_employee_scope(employee_id, country_code::text))
);
DROP POLICY IF EXISTS performance_reviews_insert_scoped ON public.performance_reviews;
CREATE POLICY performance_reviews_insert_scoped ON public.performance_reviews
FOR INSERT TO authenticated WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer')
  AND private.hr_employee_scope(employee_id, country_code::text)
);
DROP POLICY IF EXISTS performance_reviews_update_scoped ON public.performance_reviews;
CREATE POLICY performance_reviews_update_scoped ON public.performance_reviews
FOR UPDATE TO authenticated USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer')
  AND private.hr_employee_scope(employee_id, country_code::text)
) WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer')
  AND private.hr_employee_scope(employee_id, country_code::text)
);

DROP POLICY IF EXISTS job_candidates_scoped ON public.job_candidates;
CREATE POLICY job_candidates_read_scoped ON public.job_candidates
FOR SELECT TO authenticated USING (
  (lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer','talent_recruiter')
   AND private.hr_site_scope(site_id, country_code::text))
  OR (lower(public.get_my_role()) IN ('finance_manager','regional_finance_officer')
      AND private.finance_site_scope(site_id, country_code::text))
);
CREATE POLICY job_candidates_insert_scoped ON public.job_candidates
FOR INSERT TO authenticated WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer','talent_recruiter')
  AND private.hr_site_scope(site_id, country_code::text)
  AND stage = 'applied'
  AND hr_approved_by IS NULL AND finance_approved_by IS NULL
  AND hired_employee_id IS NULL
);
CREATE POLICY job_candidates_update_scoped ON public.job_candidates
FOR UPDATE TO authenticated USING (
  (lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer','talent_recruiter')
   AND private.hr_site_scope(site_id, country_code::text))
  OR (lower(public.get_my_role()) IN ('finance_manager','regional_finance_officer')
      AND private.finance_site_scope(site_id, country_code::text))
) WITH CHECK (
  (lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer','talent_recruiter')
   AND private.hr_site_scope(site_id, country_code::text))
  OR (lower(public.get_my_role()) IN ('finance_manager','regional_finance_officer')
      AND private.finance_site_scope(site_id, country_code::text))
);

CREATE FUNCTION private.guard_candidate_decisions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
DECLARE actor_role text := lower(public.get_my_role());
BEGIN
  IF (NEW.site_id, NEW.country_code, NEW.requisition_id)
      IS DISTINCT FROM (OLD.site_id, OLD.country_code, OLD.requisition_id) THEN
    RAISE EXCEPTION 'Candidate territory cannot be changed';
  END IF;
  IF (NEW.hr_approved_by, NEW.hr_approved_at)
      IS DISTINCT FROM (OLD.hr_approved_by, OLD.hr_approved_at)
    AND actor_role NOT IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer') THEN
    RAISE EXCEPTION 'HR candidate approval requires an HR lead';
  END IF;
  IF (NEW.finance_approved_by, NEW.finance_approved_at, NEW.offered_salary)
      IS DISTINCT FROM (OLD.finance_approved_by, OLD.finance_approved_at, OLD.offered_salary)
    AND actor_role NOT IN ('super_admin','ceo','admin','finance_manager','regional_finance_officer') THEN
    RAISE EXCEPTION 'Salary approval requires a finance lead';
  END IF;
  IF NEW.stage = 'hired' AND OLD.stage IS DISTINCT FROM 'hired' THEN
    IF actor_role NOT IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer')
      OR NEW.hr_approved_by IS NULL OR NEW.finance_approved_by IS NULL THEN
      RAISE EXCEPTION 'Hiring activation requires HR and Finance approval';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.guard_candidate_decisions() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_candidate_decisions BEFORE UPDATE ON public.job_candidates
FOR EACH ROW EXECUTE FUNCTION private.guard_candidate_decisions();

CREATE FUNCTION private.guard_requisition_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $function$
BEGIN
  IF (NEW.site_id, NEW.country_code, NEW.requested_by)
      IS DISTINCT FROM (OLD.site_id, OLD.country_code, OLD.requested_by) THEN
    RAISE EXCEPTION 'Requisition origin cannot be changed';
  END IF;
  IF (NEW.approved_by, NEW.approved_at, NEW.status)
      IS DISTINCT FROM (OLD.approved_by, OLD.approved_at, OLD.status)
    AND NEW.status = 'approved'
    AND (lower(public.get_my_role()) NOT IN ('super_admin','ceo','admin','hr','hr_manager','regional_hr_officer')
         OR NEW.approved_by IS NULL OR NEW.approved_by = OLD.requested_by) THEN
    RAISE EXCEPTION 'Requisition approval requires a separate HR lead';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.guard_requisition_approval() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_requisition_approval BEFORE UPDATE ON public.job_requisitions
FOR EACH ROW EXECUTE FUNCTION private.guard_requisition_approval();
