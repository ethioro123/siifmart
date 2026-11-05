ALTER TABLE public.job_candidates ADD COLUMN created_by_id uuid, ADD COLUMN hr_approved_by_id uuid, ADD COLUMN finance_approved_by_id uuid,
 ADD COLUMN hiring_manager_approved_by text, ADD COLUMN hiring_manager_approved_at timestamptz, ADD COLUMN hiring_manager_notes text, ADD COLUMN hiring_manager_approved_by_id uuid,
 ADD COLUMN cmd_approved_by text, ADD COLUMN cmd_approved_at timestamptz, ADD COLUMN cmd_approved_by_id uuid;
CREATE FUNCTION private.guard_candidate_creation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE site public.sites%ROWTYPE;
BEGIN
 IF auth.role()='service_role' THEN RETURN NEW; END IF;
 SELECT * INTO site FROM public.sites WHERE id::text=NEW.site_id;
 IF NOT FOUND OR NOT public.is_site_in_my_authorized_scope(site.id::text,site.country) OR NOT public.is_country_in_my_authorized_scope(site.country) THEN RAISE EXCEPTION 'Candidate workplace and country required' USING ERRCODE='42501'; END IF;
 NEW.country_code:=site.country;NEW.created_by_id:=auth.uid();NEW.stage:='applied';NEW.hired_employee_id:=NULL;
 NEW.hr_approved_by:=NULL;NEW.hr_approved_at:=NULL;NEW.hr_approved_by_id:=NULL;
 NEW.finance_approved_by:=NULL;NEW.finance_approved_at:=NULL;NEW.finance_approved_by_id:=NULL;
 NEW.hiring_manager_approved_by:=NULL;NEW.hiring_manager_approved_at:=NULL;NEW.hiring_manager_approved_by_id:=NULL;
 NEW.cmd_approved_by:=NULL;NEW.cmd_approved_at:=NULL;NEW.cmd_approved_by_id:=NULL;
 RETURN NEW;
END $$;
CREATE TRIGGER bind_candidate_creation BEFORE INSERT ON public.job_candidates FOR EACH ROW EXECUTE FUNCTION private.guard_candidate_creation();
CREATE OR REPLACE FUNCTION private.guard_candidate_decisions() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role()='service_role' THEN RETURN NEW; END IF;
 IF (NEW.site_id,NEW.country_code,NEW.requisition_id,NEW.created_by_id) IS DISTINCT FROM (OLD.site_id,OLD.country_code,OLD.requisition_id,OLD.created_by_id) THEN RAISE EXCEPTION 'Candidate origin and territory are immutable'; END IF;
 IF OLD.stage='hired' AND to_jsonb(NEW)-'updated_at' IS DISTINCT FROM to_jsonb(OLD)-'updated_at' THEN RAISE EXCEPTION 'Hired candidate evidence is immutable'; END IF;
 IF current_setting('siifmart.candidate_command',true) IS DISTINCT FROM NEW.id::text THEN
  IF (to_jsonb(NEW)-ARRAY['stage','interview_score','technical_score','culture_fit_score','interviewer_notes','updated_at']) IS DISTINCT FROM
   (to_jsonb(OLD)-ARRAY['stage','interview_score','technical_score','culture_fit_score','interviewer_notes','updated_at']) OR NEW.stage='hired' THEN
   RAISE EXCEPTION 'Use the trusted candidate decision command' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE POLICY candidate_hiring_manager_read ON public.job_candidates FOR SELECT TO authenticated USING(public.get_my_role() IN('warehouse_manager','store_manager','country_operations_director','regional_operations_manager') AND public.is_site_in_my_authorized_scope(site_id,country_code) AND public.is_country_in_my_authorized_scope(country_code));
CREATE POLICY candidate_hiring_manager_insert ON public.job_candidates FOR INSERT TO authenticated WITH CHECK(public.get_my_role() IN('warehouse_manager','store_manager','country_operations_director','regional_operations_manager') AND public.is_site_in_my_authorized_scope(site_id,country_code) AND public.is_country_in_my_authorized_scope(country_code));
CREATE FUNCTION private.candidate_decision(p_id uuid,p_action text,p_salary numeric,p_notes text) RETURNS public.job_candidates LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.job_candidates%ROWTYPE; actor public.employees%ROWTYPE;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';
 SELECT * INTO c FROM public.job_candidates WHERE id=p_id FOR UPDATE;
 IF actor.id IS NULL OR c.id IS NULL OR c.created_by_id IS NULL OR c.stage IN('hired','rejected') OR actor.id=c.created_by_id
 OR NOT public.is_site_in_my_authorized_scope(c.site_id,c.country_code) OR NOT public.is_country_in_my_authorized_scope(c.country_code)
 OR length(btrim(coalesce(p_notes,''))) NOT BETWEEN 3 AND 2000 THEN RAISE EXCEPTION 'Independent scoped candidate reviewer and reason required' USING ERRCODE='42501'; END IF;
 PERFORM set_config('siifmart.candidate_command',c.id::text,true);
 CASE p_action
 WHEN 'hr' THEN
  IF actor.role NOT IN('group_ceo','group_chro','country_hr_director','regional_hr_manager','hr_generalist') OR actor.id IN(c.finance_approved_by_id,c.hiring_manager_approved_by_id) THEN RAISE EXCEPTION 'Independent HR clearance required' USING ERRCODE='42501'; END IF;
  IF c.hr_approved_by_id IS NOT NULL THEN IF c.hr_approved_by_id=actor.id THEN RETURN c; ELSE RAISE EXCEPTION 'HR clearance already recorded'; END IF; END IF;
  UPDATE public.job_candidates SET hr_approved_by=actor.name,hr_approved_by_id=actor.id,hr_approved_at=now(),hr_notes=btrim(p_notes) WHERE id=c.id RETURNING * INTO c;
 WHEN 'manager' THEN
  IF actor.role NOT IN('group_ceo','country_managing_director','country_operations_director','regional_operations_manager','warehouse_manager','store_manager') OR c.hr_approved_by_id IS NULL OR actor.id=c.hr_approved_by_id THEN RAISE EXCEPTION 'Independent hiring manager after HR clearance required' USING ERRCODE='42501'; END IF;
  IF c.hiring_manager_approved_by_id IS NOT NULL THEN IF c.hiring_manager_approved_by_id=actor.id THEN RETURN c; ELSE RAISE EXCEPTION 'Manager clearance already recorded'; END IF; END IF;
  UPDATE public.job_candidates SET hiring_manager_approved_by=actor.name,hiring_manager_approved_by_id=actor.id,hiring_manager_approved_at=now(),hiring_manager_notes=btrim(p_notes),stage='offered' WHERE id=c.id RETURNING * INTO c;
 WHEN 'finance' THEN
  IF actor.role NOT IN('group_ceo','group_cfo','country_finance_director','regional_finance_manager') OR c.hr_approved_by_id IS NULL OR actor.id IN(c.hr_approved_by_id,c.hiring_manager_approved_by_id) OR p_salary IS NULL OR p_salary<=0 OR p_salary>100000000 OR p_salary::text IN('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Independent Finance salary clearance required' USING ERRCODE='42501'; END IF;
  UPDATE public.job_candidates SET finance_approved_by=actor.name,finance_approved_by_id=actor.id,finance_approved_at=now(),finance_notes=btrim(p_notes),offered_salary=p_salary WHERE id=c.id RETURNING * INTO c;
 WHEN 'executive' THEN
  IF actor.role NOT IN('group_ceo','country_managing_director') OR actor.id IN(c.hr_approved_by_id,c.finance_approved_by_id,c.hiring_manager_approved_by_id) THEN RAISE EXCEPTION 'Independent executive exception authority required' USING ERRCODE='42501'; END IF;
  UPDATE public.job_candidates SET cmd_approved_by=actor.name,cmd_approved_by_id=actor.id,cmd_approved_at=now() WHERE id=c.id RETURNING * INTO c;
 ELSE RAISE EXCEPTION 'Unknown candidate decision'; END CASE;
 RETURN c;
END $$;
CREATE FUNCTION private.validate_hiring_budget(p_employee public.employees) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE quota public.facility_headcount_quotas%ROWTYPE; current_count integer; c public.job_candidates%ROWTYPE; exception boolean;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('hiring-budget:'||p_employee.site_id::text||':'||p_employee.role,0));
 SELECT * INTO quota FROM public.facility_headcount_quotas WHERE site_id=p_employee.site_id::text AND role=p_employee.role FOR SHARE;
 SELECT count(*) INTO current_count FROM public.employees WHERE site_id=p_employee.site_id AND role=p_employee.role AND status='Active' AND id<>p_employee.id;
 exception:=quota.id IS NULL OR quota.max_monthly_salary IS NULL OR current_count>=quota.approved_quota OR p_employee.salary>quota.max_monthly_salary;
 IF p_employee.salary IS NULL OR p_employee.salary<0 OR p_employee.salary::text IN('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Valid employee salary required'; END IF;
 IF exception THEN
  SELECT * INTO c FROM public.job_candidates WHERE id::text=current_setting('siifmart.hiring_candidate',true) AND hired_employee_id=p_employee.id AND stage='hired';
  IF c.id IS NULL OR c.finance_approved_by_id IS NULL OR c.cmd_approved_by_id IS NULL OR c.hr_approved_by_id IS NULL OR c.hiring_manager_approved_by_id IS NULL
   OR c.finance_approved_by_id IN(c.hr_approved_by_id,c.hiring_manager_approved_by_id,c.created_by_id) OR c.cmd_approved_by_id IN(c.hr_approved_by_id,c.finance_approved_by_id,c.hiring_manager_approved_by_id,c.created_by_id)
   OR c.offered_salary IS DISTINCT FROM p_employee.salary OR c.role IS DISTINCT FROM p_employee.role OR c.site_id IS DISTINCT FROM p_employee.site_id::text THEN
   RAISE EXCEPTION 'Hiring quota or salary exception requires reviewed recruitment, independent Finance and executive clearance' USING ERRCODE='42501'; END IF;
 END IF;
END $$;
CREATE FUNCTION private.guard_hiring_budget() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role()='service_role' THEN RETURN NEW; END IF;
 IF NEW.status='Active' AND (TG_OP='INSERT' OR OLD.status='Pending Approval') THEN PERFORM private.validate_hiring_budget(NEW); END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER zy_hiring_budget BEFORE INSERT OR UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION private.guard_hiring_budget();
CREATE FUNCTION private.activate_candidate(p_candidate uuid,p_department text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE c public.job_candidates%ROWTYPE; actor public.employees%ROWTYPE; employee uuid:=gen_random_uuid(); site public.sites%ROWTYPE; code text;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';
 SELECT * INTO c FROM public.job_candidates WHERE id=p_candidate FOR UPDATE;
 IF c.id IS NULL OR actor.role NOT IN('group_ceo','group_chro','country_managing_director','country_hr_director','regional_hr_manager','hr_generalist') OR NOT public.is_site_in_my_authorized_scope(c.site_id,c.country_code) OR NOT public.is_country_in_my_authorized_scope(c.country_code) THEN RAISE EXCEPTION 'Scoped hiring activation authority required' USING ERRCODE='42501'; END IF;
 IF c.stage='hired' AND c.hired_employee_id IS NOT NULL THEN RETURN c.hired_employee_id; END IF;
 IF c.created_by_id IS NULL OR c.hr_approved_by_id IS NULL OR c.hiring_manager_approved_by_id IS NULL OR c.hr_approved_by_id=c.hiring_manager_approved_by_id OR c.created_by_id IN(c.hr_approved_by_id,c.hiring_manager_approved_by_id) OR c.role IS NULL OR c.offered_salary IS NULL OR length(btrim(coalesce(p_department,''))) NOT BETWEEN 2 AND 100 THEN RAISE EXCEPTION 'Saved independent HR and hiring-manager evidence required'; END IF;
 SELECT * INTO site FROM public.sites WHERE id::text=c.site_id;
 code:=public.reserve_next_employee_code(c.country_code);
 INSERT INTO public.employees(id,code,name,email,phone,role,site_id,region_code,scope_level,job_title,department,salary,status,join_date,attendance_rate,performance_score)
 VALUES(employee,code,c.name,lower(c.email),c.phone,c.role,site.id,site.region_code,'REGIONAL',initcap(replace(c.role,'_',' ')),btrim(p_department),c.offered_salary,'Pending Approval',current_date,0,0);
 PERFORM set_config('siifmart.candidate_command',c.id::text,true);
 UPDATE public.job_candidates SET stage='hired',hired_employee_id=employee WHERE id=c.id;
 PERFORM set_config('siifmart.hiring_candidate',c.id::text,true);
 UPDATE public.employees SET status='Active' WHERE id=employee;
 RETURN employee;
END $$;
CREATE FUNCTION public.candidate_decision(p_id uuid,p_action text,p_salary numeric DEFAULT NULL,p_notes text DEFAULT NULL) RETURNS public.job_candidates LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.candidate_decision(p_id,p_action,p_salary,p_notes); $$;
CREATE FUNCTION public.activate_candidate(p_candidate uuid,p_department text) RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.activate_candidate(p_candidate,p_department); $$;
REVOKE ALL ON FUNCTION private.guard_candidate_creation(),private.validate_hiring_budget(public.employees),private.guard_hiring_budget() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION private.candidate_decision(uuid,text,numeric,text),private.activate_candidate(uuid,text),public.candidate_decision(uuid,text,numeric,text),public.activate_candidate(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.candidate_decision(uuid,text,numeric,text),private.activate_candidate(uuid,text),public.candidate_decision(uuid,text,numeric,text),public.activate_candidate(uuid,text) TO authenticated;
