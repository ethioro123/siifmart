BEGIN;
SET LOCAL statement_timeout='12s';
SELECT set_config('request.jwt.claim.sub','',true);SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE manager uuid:=gen_random_uuid(); BEGIN
 INSERT INTO public.facility_headcount_quotas(site_id,role,approved_quota,max_monthly_salary,country_code) VALUES('c1111111-1111-4000-8000-000000000110','picker',0,1,'ET') ON CONFLICT(site_id,role) DO UPDATE SET approved_quota=0,max_monthly_salary=1;
 INSERT INTO public.employees(id,name,email,role,status,site_id,job_title,join_date) VALUES(manager,'Rollback hiring manager','audit-'||manager||'@example.invalid','warehouse_manager','Active','c1111111-1111-4000-8000-000000000110','Warehouse Manager',current_date);
 PERFORM set_config('test.hiring.manager',manager::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000083',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000083","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE employee uuid:=gen_random_uuid(); candidate uuid:=gen_random_uuid(); BEGIN
 INSERT INTO public.employees(id,name,email,role,status,site_id,job_title,join_date,salary) VALUES(employee,'Rollback unbudgeted hire','audit-'||employee||'@example.invalid','picker','Pending Approval','c1111111-1111-4000-8000-000000000110','Picker',current_date,1000000);
 INSERT INTO public.job_candidates(id,country_code,site_id,role,name,email,phone,stage,offered_salary) VALUES(candidate,'ET','c1111111-1111-4000-8000-000000000110','picker','Rollback reviewed hire','audit-'||candidate||'@example.invalid','','applied',100);
 PERFORM set_config('test.hiring.employee',employee::text,true);PERFORM set_config('test.hiring.candidate',candidate::text,true);
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000073',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000073","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE blocked boolean:=false; BEGIN
 BEGIN UPDATE public.employees SET status='Active' WHERE id=current_setting('test.hiring.employee')::uuid;EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;ASSERT blocked,'Over-budget direct activation accepted';
 PERFORM public.candidate_decision(current_setting('test.hiring.candidate')::uuid,'hr',NULL,'Identity and credentials reviewed');
 blocked:=false;BEGIN PERFORM public.candidate_decision(current_setting('test.hiring.candidate')::uuid,'manager',NULL,'Own manager signature');EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;ASSERT blocked,'One actor filled two departments';
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub',current_setting('test.hiring.manager'),true);SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.hiring.manager'),'role','authenticated')::text,true);SET LOCAL ROLE authenticated;
SELECT public.candidate_decision(current_setting('test.hiring.candidate')::uuid,'manager',NULL,'Operational hiring need reviewed');
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000003',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000003","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
SELECT public.candidate_decision(current_setting('test.hiring.candidate')::uuid,'finance',100,'Salary exception reviewed');
RESET ROLE;SELECT set_config('request.jwt.claim.sub','988fb8ef-8053-415b-9032-2aca981058d7',true);SELECT set_config('request.jwt.claims','{"sub":"988fb8ef-8053-415b-9032-2aca981058d7","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
SELECT public.candidate_decision(current_setting('test.hiring.candidate')::uuid,'executive',NULL,'Quota exception reviewed');
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000004',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000004","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE employee uuid; retry uuid; BEGIN
 employee:=public.activate_candidate(current_setting('test.hiring.candidate')::uuid,'Operations');retry:=public.activate_candidate(current_setting('test.hiring.candidate')::uuid,'Operations');ASSERT employee=retry,'Activation retry duplicated employee';
 ASSERT coalesce(current_setting('siifmart.hiring_candidate',true),'')='' AND coalesce(current_setting('siifmart.candidate_command',true),'')='','Hiring authority leaked after return';
 ASSERT EXISTS(SELECT 1 FROM public.employee_directory WHERE id=employee AND status='Active' AND salary=100),'Reviewed employee was not activated atomically';
 ASSERT EXISTS(SELECT 1 FROM public.job_candidates WHERE id=current_setting('test.hiring.candidate')::uuid AND stage='hired' AND hired_employee_id=employee),'Candidate linkage missing';
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','',true);SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
UPDATE public.facility_headcount_quotas SET approved_quota=100000,max_monthly_salary=1000 WHERE site_id='c1111111-1111-4000-8000-000000000110' AND role='picker';
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000083',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000083","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE candidate uuid:=gen_random_uuid(); BEGIN
 INSERT INTO public.job_candidates(id,country_code,site_id,role,name,email,phone,stage,offered_salary) VALUES(candidate,'ET','c1111111-1111-4000-8000-000000000110','picker','Rollback routine hire','audit-'||candidate||'@example.invalid','','applied',100);
 PERFORM set_config('test.hiring.routine',candidate::text,true);
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000073',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000073","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
SELECT public.candidate_decision(current_setting('test.hiring.routine')::uuid,'hr',NULL,'Routine identity review');
RESET ROLE;SELECT set_config('request.jwt.claim.sub',current_setting('test.hiring.manager'),true);SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.hiring.manager'),'role','authenticated')::text,true);SET LOCAL ROLE authenticated;
SELECT public.candidate_decision(current_setting('test.hiring.routine')::uuid,'manager',NULL,'Routine hiring need reviewed');
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000004',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000004","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE employee uuid; BEGIN
 employee:=public.activate_candidate(current_setting('test.hiring.routine')::uuid,'Operations');
 ASSERT EXISTS(SELECT 1 FROM public.employee_directory WHERE id=employee AND status='Active');
 ASSERT EXISTS(SELECT 1 FROM public.job_candidates WHERE id=current_setting('test.hiring.routine')::uuid AND finance_approved_by_id IS NULL AND cmd_approved_by_id IS NULL),'Routine hire required unnecessary Finance or executive action';
END $$;
ROLLBACK;
SELECT 'PASS: quota denial, independent department evidence and atomic reviewed activation retry; rolled back' result;
