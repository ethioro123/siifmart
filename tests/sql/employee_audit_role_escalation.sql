-- Investigation only; synthetic employee and all mutations roll back.
BEGIN;
SET LOCAL statement_timeout='8s';
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE target uuid:=gen_random_uuid(); BEGIN
 INSERT INTO public.employees(id,name,email,role,status,site_id,region_code,scope_level,job_title,join_date)
 VALUES(target,'Audit role target','audit-'||target||'@example.invalid','picker','Active','c1111111-1111-4000-8000-000000000110','ADA','REGIONAL','Picker',current_date);
 PERFORM set_config('test.employee.target',target::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000073',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000073","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE target uuid:=current_setting('test.employee.target')::uuid; BEGIN
 UPDATE public.employees SET role='group_cfo',job_title='Group CFO' WHERE id=target;
 ASSERT EXISTS(SELECT 1 FROM public.employees WHERE id=target AND role='group_cfo'),
 'Reproduction changed: regional HR cannot assign group executive role';
 ASSERT NOT EXISTS(SELECT 1 FROM public.employee_change_requests WHERE employee_id=target),'Unexpected approval request created';
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000083',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000083","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE target uuid:=gen_random_uuid(); BEGIN
 INSERT INTO public.employees(id,name,email,role,status,site_id,region_code,scope_level,job_title,join_date)
 VALUES(target,'Audit executive recruit','audit-'||target||'@example.invalid','group_cfo','Active','c1111111-1111-4000-8000-000000000110','ADA','REGIONAL','Group CFO',current_date);
 ASSERT EXISTS(SELECT 1 FROM public.employees WHERE id=target AND role='group_cfo' AND status='Active'),
 'Reproduction changed: warehouse manager cannot directly create active group executive';
END $$;
ROLLBACK;
SELECT 'CONFIRMED: regional HR promoted a picker and warehouse manager recruited an Active group_cfo without independent review; rolled back' result;
