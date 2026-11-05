BEGIN;
SET LOCAL statement_timeout='8s';
SELECT set_config('request.jwt.claim.sub','',true);SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
INSERT INTO public.facility_headcount_quotas(site_id,role,approved_quota,max_monthly_salary,country_code) VALUES('c1111111-1111-4000-8000-000000000110','picker',100000,10000,'ET') ON CONFLICT(site_id,role) DO UPDATE SET approved_quota=100000,max_monthly_salary=10000;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000083',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000083","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE e uuid:=gen_random_uuid(); blocked boolean:=false; BEGIN
 INSERT INTO public.employees(id,name,email,role,status,site_id,region_code,scope_level,job_title,join_date,salary)
 VALUES(e,'Audit pending hire','audit-'||e||'@example.invalid','picker','Pending Approval','c1111111-1111-4000-8000-000000000110','ADA','REGIONAL','Picker',current_date,100);
 PERFORM set_config('test.hire',e::text,true);
 BEGIN UPDATE public.employees SET status='Active' WHERE id=e;EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 ASSERT blocked OR EXISTS(SELECT 1 FROM public.employees WHERE id=e AND status='Pending Approval'),'Recruiter activated own hire';
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000073',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000073","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE r uuid; BEGIN
 UPDATE public.employees SET status='Active' WHERE id=current_setting('test.hire')::uuid;
 ASSERT EXISTS(SELECT 1 FROM public.employee_directory WHERE id=current_setting('test.hire')::uuid AND status='Active'),'Independent HR could not activate hire';
 INSERT INTO public.salary_requests(employee_id,employee_name,current_salary,proposed_salary,currency,site_id,country_code,reason,status,requested_by,requested_by_role)
 VALUES(current_setting('test.hire')::uuid,'Audit',100,150,'ETB','c1111111-1111-4000-8000-000000000110','ET','Salary proposal evidence','pending','Forged maker','regional_hr_manager') RETURNING id INTO r;
 PERFORM set_config('test.salary',r::text,true);
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000003',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000003","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE r public.salary_requests%ROWTYPE; blocked boolean:=false; BEGIN
 r:=public.review_salary_request(current_setting('test.salary')::uuid,true,NULL);ASSERT r.approved_by_id=auth.uid();ASSERT EXISTS(SELECT 1 FROM public.employee_directory WHERE id=r.employee_id AND salary=150),'Salary approval did not atomically update master';
 BEGIN PERFORM public.review_salary_request(r.id,true,NULL);EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;ASSERT blocked,'Salary approval replay accepted';
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000088',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000088","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ BEGIN ASSERT NOT EXISTS(SELECT 1 FROM public.system_logs WHERE action='SALARY_CHANGE_APPROVED' AND entity_id=current_setting('test.hire')),'Floor worker read confidential salary audit';END $$;
ROLLBACK;
SELECT 'PASS: pending hiring, independent activation, atomic salary review and confidential audit access; rolled back' result;
