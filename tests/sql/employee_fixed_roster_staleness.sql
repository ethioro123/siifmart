BEGIN;
SET LOCAL statement_timeout='8s';
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);SELECT set_config('request.jwt.claim.sub','',true);
DO $$ DECLARE e uuid:=gen_random_uuid(); BEGIN
 INSERT INTO public.employees(id,name,email,role,status,site_id,region_code,scope_level,job_title,join_date,salary) VALUES(e,'Audit roster member','audit-'||e||'@example.invalid','picker','Active','c1111111-1111-4000-8000-000000000110','ADA','REGIONAL','Picker',current_date,100);
 PERFORM set_config('test.roster.member',e::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000001',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000001","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE run public.payroll_runs%ROWTYPE; BEGIN run:=public.create_payroll_run('AUDIT-'||gen_random_uuid(),'AUDIT-'||gen_random_uuid(),'c1111111-1111-4000-8000-000000000110','ET',0,0);PERFORM set_config('test.roster.run',run.id,true);END $$;
RESET ROLE;SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);SELECT set_config('request.jwt.claim.sub','',true);
UPDATE public.employees SET salary=101 WHERE id=current_setting('test.roster.member')::uuid;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000004',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000004","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE blocked boolean:=false; BEGIN
 BEGIN PERFORM public.payroll_command(current_setting('test.roster.run'),'hr','Changed salary evidence');EXCEPTION WHEN raise_exception THEN blocked:=true;END;
 ASSERT blocked,'Payroll approved after salary snapshot changed';
 ASSERT EXISTS(SELECT 1 FROM public.payroll_runs WHERE id=current_setting('test.roster.run') AND hr_approved_by_id IS NULL),'Failed roster check left a signature';
END $$;
ROLLBACK;
SELECT 'PASS: roster/compensation change invalidates payroll approval without leaving a signature; rolled back' result;
