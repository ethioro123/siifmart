BEGIN;
SET LOCAL statement_timeout='8s';
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);SELECT set_config('request.jwt.claim.sub','',true);
DO $$ DECLARE e uuid:=gen_random_uuid(); BEGIN
 INSERT INTO public.employees(id,name,email,role,status,site_id,region_code,scope_level,job_title,join_date,salary)
 VALUES(e,'Audit employee review','audit-'||e||'@example.invalid','picker','Active','c1111111-1111-4000-8000-000000000110','ADA','REGIONAL','Picker',current_date,100);
 PERFORM set_config('test.review.employee',e::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub','cdaf0fea-6326-4a84-b387-47ae2268e0b3',true);SELECT set_config('request.jwt.claims','{"sub":"cdaf0fea-6326-4a84-b387-47ae2268e0b3","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE r uuid; bad uuid; BEGIN
 INSERT INTO public.employee_change_requests(employee_id,employee_name,site_id,country_code,requested_by,requested_by_role,status,governance_category,required_approvers,diffs,full_proposed_employee,reason)
 VALUES(current_setting('test.review.employee')::uuid,'Untrusted name','c1111111-1111-4000-8000-000000000110','ET','Untrusted creator','hr_generalist','pending','composite','[]','[]','{"salary":999,"phone":"AUDIT-PHONE"}','Salary and contact review evidence') RETURNING id INTO r;
 PERFORM set_config('test.review.request',r::text,true);
 INSERT INTO public.employee_change_requests(employee_id,employee_name,site_id,country_code,requested_by,requested_by_role,status,governance_category,required_approvers,diffs,full_proposed_employee,reason)
 VALUES(current_setting('test.review.employee')::uuid,'Audit','c1111111-1111-4000-8000-000000000110','ET','Audit','hr_generalist','pending','identity','[]','[]','{"name":null}','Audit atomic failure scenario') RETURNING id INTO bad;
 PERFORM set_config('test.review.bad',bad::text,true);
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000003',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000003","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE r public.employee_change_requests%ROWTYPE; BEGIN r:=public.review_employee_change(current_setting('test.review.request')::uuid,true,'Finance salary reviewed');ASSERT r.status='pending';ASSERT EXISTS(SELECT 1 FROM public.employee_directory WHERE id=r.employee_id AND salary=100),'Partial approval applied salary';END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000004',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000004","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE r public.employee_change_requests%ROWTYPE; blocked boolean:=false; BEGIN
 r:=public.review_employee_change(current_setting('test.review.request')::uuid,true,'HR contact reviewed');ASSERT r.status='approved';ASSERT EXISTS(SELECT 1 FROM public.employee_directory WHERE id=r.employee_id AND salary=999 AND phone='AUDIT-PHONE');
 BEGIN PERFORM public.review_employee_change(r.id,true,'Attempt replay');EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;ASSERT blocked,'Completed snapshot replayed';
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','988fb8ef-8053-415b-9032-2aca981058d7',true);SELECT set_config('request.jwt.claims','{"sub":"988fb8ef-8053-415b-9032-2aca981058d7","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE blocked boolean:=false; BEGIN
 BEGIN PERFORM public.review_employee_change(current_setting('test.review.bad')::uuid,true,'Audit failed application');EXCEPTION WHEN not_null_violation THEN blocked:=true;END;
 ASSERT blocked,'Expected invalid field application rejection';ASSERT EXISTS(SELECT 1 FROM public.employee_change_requests WHERE id=current_setting('test.review.bad')::uuid AND status='pending'),'Failed apply recorded approval';
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000088',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000088","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE first public.employee_attendance%ROWTYPE; retry public.employee_attendance%ROWTYPE; closed public.employee_attendance%ROWTYPE; BEGIN
 first:=public.record_employee_attendance(auth.uid(),'c1111111-1111-4000-8000-000000000110','ET');retry:=public.record_employee_attendance(auth.uid(),'c1111111-1111-4000-8000-000000000110','ET');ASSERT first.id=retry.id,'Clock-in retry duplicated attendance';
 closed:=public.record_employee_attendance(auth.uid(),'c1111111-1111-4000-8000-000000000110','ET',first.id);ASSERT closed.clock_out>=first.clock_in AND closed.hours_worked<1,'Clock-out invented eight hours';
END $$;
ROLLBACK;
SELECT 'PASS: independent department reviews, atomic failed application, replay rejection and server attendance retry/duration; rolled back' result;
