BEGIN;
SET LOCAL statement_timeout='8s';
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000001',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000001","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE run public.payroll_runs%ROWTYPE; blocked boolean:=false; BEGIN
 run:=public.create_payroll_run('AUDIT-'||gen_random_uuid(),'AUDIT-'||gen_random_uuid(),'c1111111-1111-4000-8000-000000000110','ET',0,0);
 PERFORM set_config('test.payroll',run.id,true);
 ASSERT run.initiated_by_id=auth.uid() AND run.total_net_payout=run.total_gross_salaries AND run.employee_count>0;
 BEGIN UPDATE public.payroll_runs SET status='disbursed',total_net_payout=999999 WHERE id=run.id;EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;ASSERT blocked,'Direct payout bypass accepted';
 blocked:=false;BEGIN PERFORM public.payroll_command(run.id,'hr','Creator attempts review');EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;ASSERT blocked,'Maker signed payroll';
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000073',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000073","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE run public.payroll_runs%ROWTYPE; BEGIN run:=public.attest_payroll_regional_hr(current_setting('test.payroll'),'Regional roster checked');ASSERT run.regional_attested_by_id=auth.uid();END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000004',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000004","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE run public.payroll_runs%ROWTYPE; blocked boolean:=false; BEGIN
 run:=public.payroll_command(current_setting('test.payroll'),'hr','HR roster checked');ASSERT run.hr_approved_by_id=auth.uid();
 BEGIN PERFORM public.payroll_command(run.id,'finance','Attempt second department');EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;ASSERT blocked,'Same actor supplied both signatures';
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000003',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000003","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE run public.payroll_runs%ROWTYPE; replay public.payroll_runs%ROWTYPE; blocked boolean:=false; BEGIN
 run:=public.payroll_command(current_setting('test.payroll'),'finance','Finance totals checked');ASSERT run.status='approved' AND run.finance_approved_by_id=auth.uid();
 run:=public.payroll_command(run.id,'prepare');replay:=public.payroll_command(run.id,'prepare');ASSERT run.status='prepared' AND run.expense_id=replay.expense_id AND run.disbursed_at IS NULL;
 BEGIN PERFORM public.payroll_command(run.id,'settle','Bank evidence independently checked','AUDIT-REFERENCE');EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;ASSERT blocked,'Approver recorded own settlement';
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','988fb8ef-8053-415b-9032-2aca981058d7',true);SELECT set_config('request.jwt.claims','{"sub":"988fb8ef-8053-415b-9032-2aca981058d7","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE run public.payroll_runs%ROWTYPE; replay public.payroll_runs%ROWTYPE; BEGIN
 run:=public.payroll_command(current_setting('test.payroll'),'settle','Audit-only bank evidence independently checked','AUDIT-'||current_setting('test.payroll'));
 replay:=public.payroll_command(run.id,'settle','Audit-only evidence replay',run.settlement_reference);
 ASSERT run.status='disbursed' AND replay.expense_id=run.expense_id AND run.disbursed_at=replay.disbursed_at;
END $$;
RESET ROLE;
DO $$ BEGIN ASSERT EXISTS(SELECT 1 FROM public.expenses e JOIN public.payroll_runs r ON e.id::text=r.expense_id WHERE r.id=current_setting('test.payroll') AND e.status='Paid' AND e.amount=r.total_net_payout AND e.payment_ref=r.settlement_reference);END $$;
ROLLBACK;
SELECT 'PASS: roster snapshot, independent signatures, regional attestation, atomic unpaid expense and independent settlement replay; rolled back, no payment sent' result;
