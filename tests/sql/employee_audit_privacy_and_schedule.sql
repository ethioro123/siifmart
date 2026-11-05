-- Investigation only: synthetic compensation and schedule rows, all rolled back.
BEGIN;
SET LOCAL statement_timeout='8s';
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE target uuid:=gen_random_uuid(); foreign_worker uuid; BEGIN
 INSERT INTO public.employees(id,name,email,role,status,site_id,region_code,scope_level,job_title,salary,phone,address,join_date)
 VALUES(target,'Audit privacy target','audit-'||target||'@example.invalid','picker','Active','c1111111-1111-4000-8000-000000000110','ADA','REGIONAL','Picker',98765,'AUDIT-PHONE','AUDIT-PRIVATE-ADDRESS',current_date);
 SELECT e.id INTO foreign_worker FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE s.country='KE' AND lower(e.status)='active' LIMIT 1;
 PERFORM set_config('test.employee.target',target::text,true);
 PERFORM set_config('test.employee.foreign',foreign_worker::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000088',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000088","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 ASSERT EXISTS(SELECT 1 FROM public.employees WHERE id='c33cd397-8367-4f55-86d1-6b363001e7d5' AND role='driver'),'Receiver cannot read driver identity needed by reset handler';
 ASSERT EXISTS(SELECT 1 FROM public.employees WHERE id=current_setting('test.employee.target')::uuid AND salary=98765 AND address='AUDIT-PRIVATE-ADDRESS'),
 'Reproduction changed: floor worker cannot read another worker compensation/private address';
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000083',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000083","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE schedule uuid:=gen_random_uuid(); BEGIN
 INSERT INTO public.staff_schedules(id,site_id,employee_id,employee_name,date,start_time,end_time,country_code,region_code,status)
 VALUES(schedule,'c1111111-1111-4000-8000-000000000110',current_setting('test.employee.foreign')::uuid,'Audit employee',current_date,'09:00','17:00','ET','ADA','Scheduled');
 ASSERT EXISTS(SELECT 1 FROM public.staff_schedules WHERE id=schedule AND employee_id=current_setting('test.employee.foreign')::uuid),
 'Reproduction changed: schedule validates employee country/site membership';
END $$;
ROLLBACK;
SELECT 'CONFIRMED: floor worker reads peer salary/address; ET manager schedules a KE employee on an ET roster; rolled back' result;
