-- Investigation only: authenticated actions on synthetic payroll runs, all rolled back.
BEGIN;
SET LOCAL statement_timeout='8s';
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000003',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE run text:='AUDIT-'||gen_random_uuid(); BEGIN
 INSERT INTO public.payroll_runs(id,period,country_code,site_id,employee_count,currency,total_gross_salaries,total_bonuses,total_deductions,total_net_payout,status,initiated_by,initiated_by_role,initiated_at)
 VALUES(run,'Audit November 2026','ET','c1111111-1111-4000-8000-000000000110',1,'ETB',100,0,0,100,'pending_hr','Audit preparer','payroll_specialist',now());
 -- A status-only transition does not touch the signoff columns checked by the deployed trigger.
 UPDATE public.payroll_runs SET status='disbursed',total_net_payout=999999,total_gross_salaries=999999 WHERE id=run;
 ASSERT EXISTS(SELECT 1 FROM public.payroll_runs WHERE id=run AND status='disbursed' AND hr_approved_by IS NULL AND finance_approved_by IS NULL AND disbursed_by IS NULL AND total_net_payout=999999),
 'Reproduction changed: payroll status and amount cannot bypass dual approval';
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000001',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000001","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE run text:='AUDIT-'||gen_random_uuid(); BEGIN
 INSERT INTO public.payroll_runs(id,period,country_code,site_id,employee_count,currency,total_gross_salaries,total_bonuses,total_deductions,total_net_payout,status,initiated_by,initiated_by_role,initiated_at)
 VALUES(run,'Audit November 2026','ET','c1111111-1111-4000-8000-000000000110',1,'ETB',100,0,0,100,'pending_hr','Audit preparer','payroll_specialist',now());
 UPDATE public.payroll_runs SET hr_approved_by='Audit HR alias',hr_approved_by_role='country_hr_director',hr_approved_at=now(),status='pending_finance' WHERE id=run;
 UPDATE public.payroll_runs SET finance_approved_by='Audit Finance alias',finance_approved_by_role='country_finance_director',finance_approved_at=now(),status='approved' WHERE id=run;
 ASSERT EXISTS(SELECT 1 FROM public.payroll_runs WHERE id=run AND status='approved' AND hr_approved_by='Audit HR alias' AND finance_approved_by='Audit Finance alias'),
 'Reproduction changed: one authenticated actor cannot supply both signatory identities';
END $$;
ROLLBACK;
SELECT 'CONFIRMED: payroll disbursed status/amount bypass and one actor supplies both HR/Finance aliases; no payment executed; rolled back' result;
