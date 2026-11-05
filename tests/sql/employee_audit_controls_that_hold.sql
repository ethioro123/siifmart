-- Positive safety regressions; synthetic employees and any attempted mutations roll back.
BEGIN;
SET LOCAL statement_timeout='8s';
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE target uuid:=gen_random_uuid(); inactive uuid:=gen_random_uuid(); BEGIN
 INSERT INTO public.employees(id,name,email,role,status,site_id,join_date,job_title)
 VALUES(target,'Audit active employee','audit-'||target||'@example.invalid','cashier','Active','c1111111-1111-4000-8000-000000000112',current_date,'Cashier'),
 (inactive,'Audit offboarded employee','audit-'||inactive||'@example.invalid','cashier','Terminated','c1111111-1111-4000-8000-000000000112',current_date,'Cashier');
 PERFORM set_config('test.control.foreign_site',(SELECT id::text FROM public.sites WHERE country='KE' AND lower(status) IN('active','open') LIMIT 1),true);
 PERFORM set_config('test.control.active',target::text,true);PERFORM set_config('test.control.inactive',inactive::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000095',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000095","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE blocked boolean:=false; foreign_site uuid; BEGIN
 BEGIN UPDATE public.employees SET status='Terminated' WHERE id=current_setting('test.control.active')::uuid;
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 ASSERT blocked OR EXISTS(SELECT 1 FROM public.employees WHERE id=current_setting('test.control.active')::uuid AND status='Active'),'Manager bypassed independent offboarding lifecycle';
 foreign_site:=current_setting('test.control.foreign_site')::uuid;
 ASSERT foreign_site IS NOT NULL;
 blocked:=false;BEGIN
 PERFORM public.create_pos_sale_atomic(jsonb_build_object('id',gen_random_uuid(),'site_id',foreign_site,'payment_method','Cash','amount_tendered',1000),
 '[{"product_id":"0bfe7446-613b-42c3-8f66-5a1d80ae1d0e","quantity":1}]');
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Sale site is outside the authenticated employee scope' THEN blocked:=true; ELSE RAISE; END IF;END;
 ASSERT blocked,'ET manager could initiate a KE sale';
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub',current_setting('test.control.inactive'),true);
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.control.inactive'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE blocked boolean:=false; BEGIN
 ASSERT public.get_my_role() IS NULL,'Offboarded employee retains operational role';
 BEGIN PERFORM public.create_pos_sale_atomic(jsonb_build_object('id',gen_random_uuid(),'site_id','c1111111-1111-4000-8000-000000000112','payment_method','Cash','amount_tendered',1000),
 '[{"product_id":"0bfe7446-613b-42c3-8f66-5a1d80ae1d0e","quantity":1}]');
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Sale site is outside the authenticated employee scope' THEN blocked:=true; ELSE RAISE; END IF;END;
 ASSERT blocked,'Offboarded employee could save sale';
END $$;
ROLLBACK;
SELECT 'PASS: reviewed offboarding required, cross-country sale denied and terminated employee sale denied; rolled back' result;
