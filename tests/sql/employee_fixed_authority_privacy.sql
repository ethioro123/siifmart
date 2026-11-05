BEGIN;
SET LOCAL statement_timeout='8s';
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);SELECT set_config('request.jwt.claim.sub','',true);
DO $$ DECLARE target uuid:=gen_random_uuid(); foreign_worker uuid; BEGIN
 INSERT INTO public.employees(id,name,email,role,status,site_id,region_code,scope_level,job_title,join_date,salary,address)
 VALUES(target,'Audit privacy target','audit-'||target||'@example.invalid','picker','Active','c1111111-1111-4000-8000-000000000110','ADA','REGIONAL','Picker',current_date,98765,'PRIVATE AUDIT');
 SELECT e.id INTO foreign_worker FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE s.country='KE' AND e.status='Active' LIMIT 1;
 PERFORM set_config('test.employee.target',target::text,true);PERFORM set_config('test.employee.foreign',foreign_worker::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000073',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000073","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE blocked boolean:=false; BEGIN
 BEGIN UPDATE public.employees SET role='group_cfo' WHERE id=current_setting('test.employee.target')::uuid;EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;ASSERT blocked,'Regional HR appointed group executive';
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000088',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000088","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE blocked boolean:=false; BEGIN
 BEGIN PERFORM salary FROM public.employees WHERE id=current_setting('test.employee.target')::uuid;EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;ASSERT blocked,'Base salary readable';
 ASSERT EXISTS(SELECT 1 FROM public.employee_directory WHERE id=current_setting('test.employee.target')::uuid AND salary IS NULL AND address IS NULL),'Directory did not mask confidential fields';
 ASSERT EXISTS(SELECT 1 FROM public.employee_directory WHERE id=auth.uid()),'Own directory profile missing';
 blocked:=false;BEGIN UPDATE public.employees SET attendance_rate=100,performance_score=100 WHERE id=auth.uid();EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;ASSERT blocked,'Self metrics accepted';
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000083',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000083","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE blocked boolean:=false; employee uuid:=gen_random_uuid(); BEGIN
 BEGIN INSERT INTO public.employees(id,name,email,role,status,site_id,job_title,join_date) VALUES(employee,'Audit executive','audit-'||employee||'@example.invalid','group_cfo','Active','c1111111-1111-4000-8000-000000000110','Group CFO',current_date);EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;ASSERT blocked,'Facility manager recruited group executive';
 blocked:=false;BEGIN INSERT INTO public.staff_schedules(site_id,employee_id,date,start_time,end_time,country_code) VALUES('c1111111-1111-4000-8000-000000000110',current_setting('test.employee.foreign')::uuid,current_date,'09:00','17:00','ET');EXCEPTION WHEN raise_exception THEN blocked:=true;END;ASSERT blocked,'Cross-country roster accepted';
END $$;
ROLLBACK;
SELECT 'PASS: executive assignment blocked, confidential columns protected, self metrics and cross-country schedule denied; rolled back' result;
