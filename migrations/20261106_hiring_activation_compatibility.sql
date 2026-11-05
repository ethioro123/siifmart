CREATE OR REPLACE FUNCTION private.guard_employee_authority()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE actor public.employees%ROWTYPE; home public.sites%ROWTYPE; target public.sites%ROWTYPE; command public.employee_change_requests%ROWTYPE; sensitive boolean;
BEGIN
 IF auth.role()='service_role' THEN RETURN NEW; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 IF actor.id IS NULL THEN RAISE EXCEPTION 'Active employee required' USING ERRCODE='42501'; END IF;
 SELECT * INTO home FROM public.sites WHERE id=actor.site_id;
 SELECT * INTO target FROM public.sites WHERE id=NEW.site_id;
 IF NEW.role<>'group_ceo' AND target.id IS NULL THEN RAISE EXCEPTION 'Employee workplace required'; END IF;
 IF actor.role<>'group_ceo' AND (NOT public.is_site_in_my_authorized_scope(NEW.site_id::text,target.country) OR home.country IS DISTINCT FROM target.country) THEN RAISE EXCEPTION 'Employee country and workplace authority required' USING ERRCODE='42501'; END IF;
 IF TG_OP='INSERT' OR NEW.role IS DISTINCT FROM OLD.role THEN
  IF private.employee_role_rank(NEW.role)=0 OR (actor.role<>'group_ceo' AND (private.employee_role_rank(actor.role)<=private.employee_role_rank(NEW.role)
   OR NEW.role LIKE 'group_%' OR (NEW.role LIKE 'country_%' AND actor.role NOT IN('country_managing_director','country_hr_director')))) THEN
   RAISE EXCEPTION 'Higher authorized employee appointment authority required' USING ERRCODE='42501'; END IF;
 END IF;
 IF TG_OP='INSERT' THEN
  IF actor.role<>'group_ceo' AND NEW.status<>'Pending Approval' THEN RAISE EXCEPTION 'New employees require independent onboarding approval'; END IF;
 ELSE
  IF (NEW.attendance_rate,NEW.performance_score) IS DISTINCT FROM (OLD.attendance_rate,OLD.performance_score) AND actor.id=OLD.id THEN
   RAISE EXCEPTION 'Employee metrics cannot be self-certified' USING ERRCODE='42501'; END IF;
  sensitive:=(NEW.role,NEW.salary,NEW.site_id,NEW.region_code,NEW.scope_level,NEW.department,NEW.name,NEW.date_of_birth,NEW.national_id_number)
   IS DISTINCT FROM (OLD.role,OLD.salary,OLD.site_id,OLD.region_code,OLD.scope_level,OLD.department,OLD.name,OLD.date_of_birth,OLD.national_id_number);
  IF sensitive AND actor.role<>'group_ceo' THEN
   SELECT * INTO command FROM public.employee_change_requests WHERE id::text=current_setting('siifmart.employee_change',true) AND employee_id=NEW.id AND status='approved';
   IF command.id IS NULL AND NOT EXISTS(SELECT 1 FROM public.salary_requests sr WHERE sr.id::text=current_setting('siifmart.salary_review',true) AND sr.employee_id=NEW.id AND sr.status='approved' AND sr.approved_by_id=actor.id
    AND NEW.salary=sr.proposed_salary AND (to_jsonb(NEW)-ARRAY['salary','updated_at'])=(to_jsonb(OLD)-ARRAY['salary','updated_at'])) THEN RAISE EXCEPTION 'Use a reviewed employee change transaction' USING ERRCODE='42501'; END IF;
  END IF;
  IF OLD.status='Pending Approval' AND NEW.status='Active' AND actor.role<>'group_ceo' AND NOT EXISTS(SELECT 1 FROM public.job_candidates c WHERE c.id::text=current_setting('siifmart.hiring_candidate',true) AND c.hired_employee_id=NEW.id AND c.stage='hired' AND c.hr_approved_by_id IS NOT NULL AND c.hiring_manager_approved_by_id IS NOT NULL AND c.hr_approved_by_id IS DISTINCT FROM c.created_by_id AND c.hr_approved_by_id IS DISTINCT FROM c.hiring_manager_approved_by_id) THEN
   IF actor.role NOT IN('group_chro','country_hr_director','regional_hr_manager','hr_generalist') OR private.employee_role_rank(actor.role)<=private.employee_role_rank(NEW.role) OR actor.id=NEW.id OR
    EXISTS(SELECT 1 FROM public.system_logs WHERE action='EMPLOYEE_RECRUITED' AND entity_id=NEW.id::text AND employee_id=actor.id::text) THEN
    RAISE EXCEPTION 'Independent HR onboarding approval required' USING ERRCODE='42501'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END $function$;

