CREATE FUNCTION private.payroll_review_export(p_run text) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; run public.payroll_runs%ROWTYPE; roster jsonb;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';SELECT * INTO run FROM public.payroll_runs WHERE id=p_run;
 IF actor.id IS NULL OR run.id IS NULL OR actor.role NOT IN('group_ceo','group_chro','group_cfo','country_managing_director','country_hr_director','country_finance_director','regional_hr_manager','regional_finance_manager','payroll_specialist','treasury_officer','accountant')
 OR NOT (private.hr_site_scope(run.site_id,run.country_code) OR private.finance_site_scope(run.site_id,run.country_code)) OR run.status NOT IN('approved','prepared','disbursed') THEN RAISE EXCEPTION 'Scoped approved payroll review required' USING ERRCODE='42501'; END IF;
 SELECT s.roster INTO roster FROM private.payroll_snapshots s WHERE s.run_id=run.id;
 IF roster IS NULL THEN RAISE EXCEPTION 'Payroll roster snapshot unavailable'; END IF;
 RETURN jsonb_build_object('runId',run.id,'period',run.period,'country',run.country_code,'currency',run.currency,'gross',run.total_gross_salaries,'bonus',run.total_bonuses,'deductions',run.total_deductions,'net',run.total_net_payout,'roster',roster);
END $$;
REVOKE ALL ON FUNCTION private.payroll_review_export(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.payroll_review_export(text) TO authenticated;
CREATE FUNCTION public.payroll_review_export(p_run text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.payroll_review_export(p_run); $$;
REVOKE ALL ON FUNCTION public.payroll_review_export(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.payroll_review_export(text) TO authenticated;
