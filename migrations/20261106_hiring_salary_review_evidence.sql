CREATE OR REPLACE FUNCTION private.candidate_decision(p_id uuid, p_action text, p_salary numeric, p_notes text)
 RETURNS job_candidates
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  UPDATE public.job_candidates SET finance_approved_by=actor.name,finance_approved_by_id=actor.id,finance_approved_at=now(),finance_notes=btrim(p_notes),offered_salary=p_salary,
 hiring_manager_approved_by_id=CASE WHEN c.offered_salary IS DISTINCT FROM p_salary THEN NULL ELSE hiring_manager_approved_by_id END,
 hiring_manager_approved_by=CASE WHEN c.offered_salary IS DISTINCT FROM p_salary THEN NULL ELSE hiring_manager_approved_by END,
 hiring_manager_approved_at=CASE WHEN c.offered_salary IS DISTINCT FROM p_salary THEN NULL ELSE hiring_manager_approved_at END,
 cmd_approved_by_id=CASE WHEN c.offered_salary IS DISTINCT FROM p_salary THEN NULL ELSE cmd_approved_by_id END,
 cmd_approved_by=CASE WHEN c.offered_salary IS DISTINCT FROM p_salary THEN NULL ELSE cmd_approved_by END,
 cmd_approved_at=CASE WHEN c.offered_salary IS DISTINCT FROM p_salary THEN NULL ELSE cmd_approved_at END WHERE id=c.id RETURNING * INTO c;
 WHEN 'executive' THEN
  IF actor.role NOT IN('group_ceo','country_managing_director') OR actor.id IN(c.hr_approved_by_id,c.finance_approved_by_id,c.hiring_manager_approved_by_id) THEN RAISE EXCEPTION 'Independent executive exception authority required' USING ERRCODE='42501'; END IF;
  UPDATE public.job_candidates SET cmd_approved_by=actor.name,cmd_approved_by_id=actor.id,cmd_approved_at=now() WHERE id=c.id RETURNING * INTO c;
 ELSE RAISE EXCEPTION 'Unknown candidate decision'; END CASE;
 RETURN c;
END $function$;

