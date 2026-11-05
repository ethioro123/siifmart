-- Apply the existing country/regional expense authority limits to the payroll Finance decision.
CREATE OR REPLACE FUNCTION private.payroll_command(p_run text,p_action text,p_notes text DEFAULT NULL,p_reference text DEFAULT NULL) RETURNS public.payroll_runs
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; run public.payroll_runs%ROWTYPE; expense uuid; site public.sites%ROWTYPE; regional_limit numeric; country_limit numeric;
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
   SELECT coalesce(r.autonomous_expense_limit,c.expense_regional_limit),c.expense_country_limit INTO regional_limit,country_limit
    FROM public.country_governance_limits c LEFT JOIN public.regions r ON r.code=site.region_code AND r.country=c.country_code WHERE c.country_code=run.country_code;
   IF regional_limit IS NULL OR country_limit IS NULL THEN RAISE EXCEPTION 'Payroll approval limits unavailable'; END IF;
   IF run.total_net_payout>country_limit AND actor.role NOT IN('group_ceo','group_cfo') THEN RAISE EXCEPTION 'Group Finance approval required for this payroll amount' USING ERRCODE='42501'; END IF;
   IF run.total_net_payout>regional_limit AND actor.role='regional_finance_manager' THEN RAISE EXCEPTION 'Country Finance approval required for this payroll amount' USING ERRCODE='42501'; END IF;
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
