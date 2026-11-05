ALTER TABLE public.payroll_runs ADD COLUMN initiated_by_id uuid REFERENCES public.employees(id),ADD COLUMN hr_approved_by_id uuid REFERENCES public.employees(id),ADD COLUMN finance_approved_by_id uuid REFERENCES public.employees(id),ADD COLUMN settlement_reference text,ADD COLUMN settlement_evidence text;
ALTER TABLE public.payroll_runs DROP CONSTRAINT payroll_runs_status_check;
ALTER TABLE public.payroll_runs ADD CONSTRAINT payroll_runs_status_check CHECK(status IN('draft','pending_verification','pending_hr','pending_finance','approved','prepared','disbursed','rejected'));
CREATE TABLE private.payroll_snapshots(run_id text PRIMARY KEY REFERENCES public.payroll_runs(id),roster jsonb NOT NULL,fingerprint text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE private.payroll_snapshots ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.payroll_snapshots FROM PUBLIC,anon,authenticated;
CREATE UNIQUE INDEX payroll_settlement_reference_country ON public.payroll_runs(country_code,settlement_reference) WHERE settlement_reference IS NOT NULL;
REVOKE INSERT,UPDATE,DELETE ON public.payroll_runs FROM authenticated,anon;
CREATE OR REPLACE FUNCTION private.guard_payroll_run_signoffs() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role()='service_role' THEN RETURN NEW; END IF;
 IF auth.uid() IS NULL OR current_setting('siifmart.payroll_command',true) IS DISTINCT FROM NEW.id THEN RAISE EXCEPTION 'Use the trusted payroll command' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION private.assert_payroll_roster(p_run public.payroll_runs) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE saved jsonb; current_roster jsonb;
BEGIN
 SELECT roster INTO saved FROM private.payroll_snapshots WHERE run_id=p_run.id;
 SELECT jsonb_agg(jsonb_build_object('id',id,'salary',coalesce(salary,0),'site',site_id) ORDER BY id) INTO current_roster FROM public.employees WHERE site_id::text=p_run.site_id AND status='Active';
 IF saved IS NULL OR saved IS DISTINCT FROM current_roster THEN RAISE EXCEPTION 'Payroll roster changed or legacy evidence is missing; reject and prepare a new run'; END IF;
END $$;
REVOKE ALL ON FUNCTION private.assert_payroll_roster(public.payroll_runs) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.create_payroll_run(p_id text,p_period text,p_site uuid,p_country text,p_bonus numeric DEFAULT 0,p_deductions numeric DEFAULT 0) RETURNS public.payroll_runs
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; site public.sites%ROWTYPE; run public.payroll_runs%ROWTYPE; roster jsonb; gross numeric; n integer;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active'; SELECT * INTO site FROM public.sites WHERE id=p_site;
 IF actor.id IS NULL OR actor.role NOT IN('group_ceo','group_chro','group_cfo','country_managing_director','country_hr_director','country_finance_director','regional_hr_manager','regional_finance_manager','hr_generalist','payroll_specialist')
 OR site.id IS NULL OR site.country IS DISTINCT FROM p_country OR NOT private.hr_site_scope(site.id::text,p_country) THEN RAISE EXCEPTION 'Scoped payroll preparation authority required' USING ERRCODE='42501'; END IF;
 IF length(p_id) NOT BETWEEN 1 AND 150 OR length(btrim(p_period)) NOT BETWEEN 3 AND 80 OR p_bonus IS NULL OR p_deductions IS NULL OR p_bonus<0 OR p_deductions<0 OR p_bonus::text IN('NaN','Infinity','-Infinity') OR p_deductions::text IN('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid payroll proposal'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('payroll:'||p_site::text||':'||p_period,0));
 SELECT * INTO run FROM public.payroll_runs WHERE id=p_id;
 IF run.id IS NOT NULL THEN IF run.initiated_by_id=actor.id AND run.site_id=p_site::text AND run.period=p_period AND run.country_code=p_country THEN RETURN run; END IF; RAISE EXCEPTION 'Payroll request identity conflict'; END IF;
 IF EXISTS(SELECT 1 FROM public.payroll_runs WHERE site_id=p_site::text AND country_code=p_country AND period=p_period AND status<>'rejected') THEN RAISE EXCEPTION 'A payroll run already exists for this facility and period'; END IF;
 PERFORM 1 FROM public.employees WHERE site_id=p_site AND status='Active' ORDER BY id FOR SHARE;
 SELECT count(*),coalesce(sum(salary),0),jsonb_agg(jsonb_build_object('id',id,'salary',coalesce(salary,0),'site',site_id) ORDER BY id) INTO n,gross,roster FROM public.employees WHERE site_id=p_site AND status='Active';
 IF n=0 OR gross+p_bonus-p_deductions<=0 THEN RAISE EXCEPTION 'Active roster and positive payroll total required'; END IF;
 PERFORM set_config('siifmart.payroll_command',p_id,true);
 INSERT INTO public.payroll_runs(id,period,site_id,country_code,currency,employee_count,total_gross_salaries,total_bonuses,total_deductions,total_net_payout,status,initiated_by,initiated_by_role,initiated_by_id)
 VALUES(p_id,btrim(p_period),p_site,p_country,CASE p_country WHEN 'ET' THEN 'ETB' WHEN 'KE' THEN 'KES' ELSE site.currency END,n,gross,p_bonus,p_deductions,gross+p_bonus-p_deductions,'pending_verification',actor.name,actor.role,actor.id) RETURNING * INTO run;
 INSERT INTO private.payroll_snapshots VALUES(run.id,roster,md5(jsonb_build_array(roster,run.total_bonuses,run.total_deductions)::text),now());
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_id,details) VALUES('PAYROLL_RUN_PREPARED','Payroll',actor.id::text,site.id::text,p_country,run.id,'Roster and proposed adjustments saved for independent review');
 RETURN run;
END $$;
CREATE FUNCTION private.payroll_command(p_run text,p_action text,p_notes text DEFAULT NULL,p_reference text DEFAULT NULL) RETURNS public.payroll_runs
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; run public.payroll_runs%ROWTYPE; expense uuid; site public.sites%ROWTYPE;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';
 SELECT * INTO run FROM public.payroll_runs WHERE id=p_run FOR UPDATE;
 SELECT * INTO site FROM public.sites WHERE id::text=run.site_id;
 IF actor.id IS NULL OR run.id IS NULL OR site.country IS DISTINCT FROM run.country_code OR NOT private.hr_site_scope(run.site_id,run.country_code) THEN RAISE EXCEPTION 'Scoped payroll authority required' USING ERRCODE='42501'; END IF;
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
REVOKE ALL ON FUNCTION private.create_payroll_run(text,text,uuid,text,numeric,numeric),private.payroll_command(text,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.create_payroll_run(text,text,uuid,text,numeric,numeric),private.payroll_command(text,text,text,text) TO authenticated;
CREATE FUNCTION public.create_payroll_run(p_id text,p_period text,p_site uuid,p_country text,p_bonus numeric DEFAULT 0,p_deductions numeric DEFAULT 0) RETURNS public.payroll_runs LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.create_payroll_run(p_id,p_period,p_site,p_country,p_bonus,p_deductions); $$;
CREATE FUNCTION public.payroll_command(p_run text,p_action text,p_notes text DEFAULT NULL,p_reference text DEFAULT NULL) RETURNS public.payroll_runs LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.payroll_command(p_run,p_action,p_notes,p_reference); $$;
CREATE OR REPLACE FUNCTION public.attest_payroll_regional_hr(p_run_id text,p_notes text DEFAULT NULL) RETURNS public.payroll_runs LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.payroll_command(p_run_id,'regional',p_notes); $$;
REVOKE ALL ON FUNCTION public.create_payroll_run(text,text,uuid,text,numeric,numeric),public.payroll_command(text,text,text,text),public.attest_payroll_regional_hr(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.create_payroll_run(text,text,uuid,text,numeric,numeric),public.payroll_command(text,text,text,text),public.attest_payroll_regional_hr(text,text) TO authenticated;
