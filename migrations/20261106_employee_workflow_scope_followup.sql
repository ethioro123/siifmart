-- Personnel audit events must not re-expose the columns protected in the employee directory.
CREATE POLICY personnel_audit_read_guard ON public.system_logs AS RESTRICTIVE FOR SELECT TO authenticated USING(
 NOT (module IN('HR','Human Resources','Payroll') OR action LIKE 'SALARY_%' OR action LIKE 'PAYROLL_%' OR action LIKE 'EMPLOYEE_%' OR action='APPROVE_EMPLOYEE_PROFILE_CHANGE')
 OR (employee_id=auth.uid()::text AND action IN('EMPLOYEE_CLOCK_IN','EMPLOYEE_CLOCK_OUT'))
 OR public.get_my_role() IN('group_ceo','group_chro','group_cfo')
 OR (public.get_my_role() IN('country_managing_director','country_hr_director','regional_hr_manager','hr_generalist','payroll_specialist','country_finance_director','regional_finance_manager','accountant','auditor','country_compliance_manager') AND private.hr_site_scope(site_id,country_code))
);
CREATE POLICY payroll_treasury_read ON public.payroll_runs FOR SELECT TO authenticated USING(private.has_active_operational_employee() AND public.get_my_role()='treasury_officer' AND private.finance_site_scope(site_id,country_code));
CREATE OR REPLACE FUNCTION private.record_employee_recruiter() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND auth.role()<>'service_role' THEN
 INSERT INTO public.system_logs(action,module,employee_id,entity_type,entity_id,site_id,country_code,details)
 VALUES('EMPLOYEE_RECRUITED','HR',auth.uid()::text,'employee',NEW.id::text,NEW.site_id::text,(SELECT country FROM public.sites WHERE id=NEW.site_id),'Pending independent onboarding');END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION private.guard_employee_authority() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
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
  IF OLD.status='Pending Approval' AND NEW.status='Active' AND actor.role<>'group_ceo' THEN
   IF actor.role NOT IN('group_chro','country_hr_director','regional_hr_manager','hr_generalist') OR private.employee_role_rank(actor.role)<=private.employee_role_rank(NEW.role) OR actor.id=NEW.id OR
    EXISTS(SELECT 1 FROM public.system_logs WHERE action='EMPLOYEE_RECRUITED' AND entity_id=NEW.id::text AND employee_id=actor.id::text) THEN
    RAISE EXCEPTION 'Independent HR onboarding approval required' USING ERRCODE='42501'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION private.payroll_command(p_run text,p_action text,p_notes text DEFAULT NULL,p_reference text DEFAULT NULL) RETURNS public.payroll_runs
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; run public.payroll_runs%ROWTYPE; expense uuid; site public.sites%ROWTYPE;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';
 SELECT * INTO run FROM public.payroll_runs WHERE id=p_run FOR UPDATE;
 SELECT * INTO site FROM public.sites WHERE id::text=run.site_id;
 IF actor.id IS NULL OR run.id IS NULL OR site.country IS DISTINCT FROM run.country_code OR NOT (private.hr_site_scope(run.site_id,run.country_code) OR private.finance_site_scope(run.site_id,run.country_code)) THEN RAISE EXCEPTION 'Scoped payroll authority required' USING ERRCODE='42501'; END IF;
 PERFORM set_config('siifmart.payroll_command',run.id,true);
 IF p_action='reject' THEN
  IF run.status IN('prepared','disbursed','rejected') OR actor.role NOT IN('group_ceo','country_managing_director','country_hr_director','country_finance_director','regional_hr_manager','regional_finance_manager') OR length(btrim(coalesce(p_notes,'')))<10 THEN RAISE EXCEPTION 'Open payroll and authorized rejection reason required'; END IF;
  UPDATE public.payroll_runs SET status='rejected',rejected_by=actor.name,rejected_by_role=actor.role,rejected_at=now(),rejection_reason=btrim(p_notes) WHERE id=run.id RETURNING * INTO run;
 ELSIF p_action IN('hr','finance','regional') THEN
  IF run.status IN('rejected','prepared','disbursed') OR run.initiated_by_id IS NULL OR actor.id=run.initiated_by_id THEN RAISE EXCEPTION 'Independent reviewer and current payroll evidence required' USING ERRCODE='42501'; END IF;
  PERFORM private.assert_payroll_roster(run);
  IF p_action='hr' THEN
   IF actor.role NOT IN('group_ceo','group_chro','country_managing_director','country_hr_director') OR actor.id=run.finance_approved_by_id THEN RAISE EXCEPTION 'Distinct HR authority required' USING ERRCODE='42501'; END IF;
   IF run.hr_approved_by_id IS NOT NULL THEN RETURN run; END IF;
   UPDATE public.payroll_runs SET hr_approved_by=actor.name,hr_approved_by_role=actor.role,hr_approved_by_id=actor.id,hr_approved_at=now(),hr_notes=p_notes,status=CASE WHEN finance_approved_by_id IS NULL THEN 'pending_finance' ELSE 'approved' END WHERE id=run.id RETURNING * INTO run;
  ELSIF p_action='finance' THEN
   IF actor.role NOT IN('group_ceo','group_cfo','country_managing_director','country_finance_director','regional_finance_manager') OR actor.id=run.hr_approved_by_id THEN RAISE EXCEPTION 'Distinct Finance authority required' USING ERRCODE='42501'; END IF;
   IF run.finance_approved_by_id IS NOT NULL THEN RETURN run; END IF;
   UPDATE public.payroll_runs SET finance_approved_by=actor.name,finance_approved_by_role=actor.role,finance_approved_by_id=actor.id,finance_approved_at=now(),finance_notes=p_notes,status=CASE WHEN hr_approved_by_id IS NULL THEN 'pending_hr' ELSE 'approved' END WHERE id=run.id RETURNING * INTO run;
  ELSE
   IF actor.role<>'regional_hr_manager' OR actor.region_code IS DISTINCT FROM site.region_code OR actor.site_id IS NULL THEN RAISE EXCEPTION 'Regional HR roster authority required' USING ERRCODE='42501'; END IF;
   IF run.regional_attested_by_id IS NOT NULL THEN RETURN run; END IF;
   UPDATE public.payroll_runs SET regional_attested_by_id=actor.id,regional_attested_by=actor.name,regional_attested_by_role=actor.role,regional_attested_at=now(),regional_notes=p_notes WHERE id=run.id RETURNING * INTO run;
  END IF;
 ELSIF p_action='prepare' THEN
  IF actor.role NOT IN('group_ceo','group_cfo','country_finance_director','regional_finance_manager','country_managing_director') THEN RAISE EXCEPTION 'Finance preparation authority required' USING ERRCODE='42501'; END IF;
  IF run.status='prepared' THEN RETURN run; END IF;
  IF run.status<>'approved' OR run.hr_approved_by_id IS NULL OR run.finance_approved_by_id IS NULL OR run.hr_approved_by_id=run.finance_approved_by_id THEN RAISE EXCEPTION 'Two independent payroll approvals required'; END IF;
  PERFORM private.assert_payroll_roster(run);
  INSERT INTO public.expenses(site_id,country_code,expense_date,category,description,amount,status,created_by_id,created_by_name,approved_by_id,approved_by,approved_at)
  VALUES(site.id,run.country_code,current_date,'Payroll','Payroll '||run.period||' · '||run.id,run.total_net_payout,'Approved',run.initiated_by_id,run.initiated_by,run.finance_approved_by_id,run.finance_approved_by,run.finance_approved_at) RETURNING id INTO expense;
  UPDATE public.payroll_runs SET status='prepared',expense_id=expense::text WHERE id=run.id RETURNING * INTO run;
 ELSIF p_action='settle' THEN
  IF actor.role NOT IN('group_ceo','group_cfo','country_finance_director','regional_finance_manager','treasury_officer') OR actor.id IN(run.initiated_by_id,run.hr_approved_by_id,run.finance_approved_by_id)
   OR length(btrim(coalesce(p_reference,''))) NOT BETWEEN 6 AND 150 OR length(btrim(coalesce(p_notes,''))) NOT BETWEEN 10 AND 1200 THEN RAISE EXCEPTION 'Independent settlement recorder, payment reference and evidence required' USING ERRCODE='42501'; END IF;
  IF run.status='disbursed' THEN IF run.settlement_reference=btrim(p_reference) THEN RETURN run; END IF; RAISE EXCEPTION 'Settlement already recorded'; END IF;
  IF run.status<>'prepared' OR run.expense_id IS NULL THEN RAISE EXCEPTION 'Prepare the approved payroll expense first'; END IF;
  UPDATE public.expenses SET status='Paid',payment_ref=btrim(p_reference) WHERE id=run.expense_id::uuid AND status='Approved' AND amount=run.total_net_payout AND site_id=site.id AND country_code=run.country_code;
  IF NOT FOUND THEN RAISE EXCEPTION 'Prepared payroll expense does not match'; END IF;
  UPDATE public.payroll_runs SET status='disbursed',settlement_reference=btrim(p_reference),settlement_evidence=btrim(p_notes),disbursed_by=actor.name,disbursed_at=now() WHERE id=run.id RETURNING * INTO run;
 ELSE RAISE EXCEPTION 'Unknown payroll action'; END IF;
 INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_id,details) VALUES('PAYROLL_'||upper(p_action),'Payroll',actor.name,actor.id::text,run.site_id,run.country_code,run.id,jsonb_build_object('status',run.status,'notes',p_notes,'reference',p_reference)::text);
 RETURN run;
END $$;
