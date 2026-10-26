BEGIN;
SET LOCAL statement_timeout='8s';
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$
DECLARE picker uuid;packer uuid;j public.wms_jobs%ROWTYPE;pack_id uuid;ref text:=gen_random_uuid()::text;
BEGIN
 SELECT id INTO picker FROM public.employees WHERE role='picker' AND lower(status)='active' AND site_id='a1111111-1111-4000-8000-000000000001' LIMIT 1;
 SELECT id INTO packer FROM public.employees WHERE role='packer' AND lower(status)='active' AND site_id='a1111111-1111-4000-8000-000000000001' LIMIT 1;
 IF picker IS NULL OR packer IS NULL THEN RAISE EXCEPTION 'Staging floor fixtures required'; END IF;
 INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,items_count,order_ref,assigned_to,completed_by,line_items)
 VALUES('a1111111-1111-4000-8000-000000000001','ET','PICK','Completed','Normal',1,ref,picker::text,picker::text,
 '[{"productId":"f9516562-dba3-4ba3-a6b6-2476d2b89220","sku":"ETBB002","expectedQty":2,"pickedQty":2,"status":"Completed"}]') RETURNING * INTO j;
 INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,items_count,order_ref,line_items)
 VALUES(j.site_id,'ET','PACK','Pending','Normal',1,ref,
 '[{"productId":"f9516562-dba3-4ba3-a6b6-2476d2b89220","sku":"ETBB002","expectedQty":2,"pickedQty":2,"packedQty":0,"packed":false,"status":"Pending"}]') RETURNING id INTO pack_id;
 PERFORM set_config('test.sod_picker',picker::text,true);PERFORM set_config('test.sod_packer',packer::text,true);PERFORM set_config('test.sod_pack',pack_id::text,true);
 PERFORM set_config('request.jwt.claim.sub',picker::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',picker,'role','authenticated')::text,true);
END; $$;
-- Trigger assertions run with privileged row access but authenticated employee claims.
-- This avoids RLS silently updating zero rows and falsely passing denial tests.
DO $$ BEGIN
 IF NOT current_setting('test.sod_picker')=ANY(public.pack_excluded_workers(current_setting('test.sod_pack')::uuid)) THEN RAISE EXCEPTION 'TEST: picker exclusion absent'; END IF;
 BEGIN
  UPDATE public.wms_jobs SET assigned_to=current_setting('test.sod_picker') WHERE id=current_setting('test.sod_pack')::uuid;
  RAISE EXCEPTION 'TEST: self packing assignment accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  INSERT INTO public.job_assignments(job_id,employee_id,employee_name,status) VALUES(current_setting('test.sod_pack')::uuid,current_setting('test.sod_picker')::uuid,'Test','Assigned');
  RAISE EXCEPTION 'TEST: assignment history bypass accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  UPDATE public.wms_jobs SET line_items=jsonb_set(jsonb_set(line_items,'{0,packedQty}','2'),'{0,packed}','true') WHERE id=current_setting('test.sod_pack')::uuid;
  RAISE EXCEPTION 'TEST: picker packed counts accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
RESET ROLE;
DO $$
DECLARE manager uuid; stage text; target uuid; prior uuid; other_order text:=gen_random_uuid()::text; source public.wms_jobs%ROWTYPE;
BEGIN
 SELECT * INTO source FROM public.wms_jobs WHERE id=current_setting('test.sod_pack')::uuid;
 FOREACH stage IN ARRAY ARRAY['RECEIVE','PUTAWAY','COUNT','REPLENISH','WASTE','RETURNS'] LOOP
  INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,items_count,order_ref,line_items)
   VALUES(source.site_id,'ET',stage,'Pending','Normal',1,source.order_ref,source.line_items) RETURNING id INTO target;
  IF NOT current_setting('test.sod_picker')=ANY(public.floor_stage_excluded_workers(target)) THEN RAISE EXCEPTION 'TEST: missing exclusion for %',stage; END IF;
  BEGIN
   UPDATE public.wms_jobs SET assigned_to=current_setting('test.sod_picker') WHERE id=target;
   RAISE EXCEPTION 'TEST: cross-stage assignment accepted for %',stage;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
   UPDATE public.wms_jobs SET status='In-Progress' WHERE id=target;
   RAISE EXCEPTION 'TEST: cross-stage execution accepted for %',stage;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN
   UPDATE public.wms_jobs SET order_ref=gen_random_uuid()::text WHERE id=target;
   RAISE EXCEPTION 'TEST: order identity bypass accepted for %',stage;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 END LOOP;
 -- The worker may continue in the same stage or handle a different order.
 INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,items_count,order_ref,assigned_to,line_items)
 VALUES(source.site_id,'ET','PICK','Pending','Normal',1,source.order_ref,current_setting('test.sod_picker'),jsonb_set(jsonb_set(source.line_items,'{0,pickedQty}','0'),'{0,status}','"Pending"'));
 INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,items_count,order_ref,assigned_to,line_items)
 VALUES(source.site_id,'ET','PUTAWAY','Pending','Normal',1,gen_random_uuid()::text,current_setting('test.sod_picker'),jsonb_set(jsonb_set(source.line_items,'{0,pickedQty}','0'),'{0,status}','"Pending"'));
 -- Reassignment and cancellation retain the original handler even if a history insert was previously missed.
 INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,items_count,order_ref,assigned_to,line_items)
 VALUES(source.site_id,'ET','PUTAWAY','Pending','Normal',1,other_order,current_setting('test.sod_picker'),'[]') RETURNING id INTO prior;
 SELECT id INTO manager FROM public.employees WHERE role='warehouse_manager' AND lower(status)='active' AND site_id=source.site_id LIMIT 1;
 IF manager IS NULL THEN RAISE EXCEPTION 'Staging supervisor fixture required'; END IF;
 PERFORM set_config('request.jwt.claim.sub',manager::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',manager,'role','authenticated')::text,true);
 UPDATE public.wms_jobs SET assigned_to=NULL,status='Cancelled' WHERE id=prior;
 PERFORM set_config('request.jwt.claim.sub',current_setting('test.sod_picker'),true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.sod_picker'),'role','authenticated')::text,true);
 INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,items_count,order_ref,line_items)
 VALUES(source.site_id,'ET','COUNT','Pending','Normal',1,other_order,'[]') RETURNING id INTO target;
 BEGIN
  UPDATE public.wms_jobs SET assigned_to=current_setting('test.sod_picker') WHERE id=target;
  RAISE EXCEPTION 'TEST: lost prior handler after cancellation and reassignment';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
-- Assignment to an independent employee succeeds under trusted management setup.
UPDATE public.wms_jobs SET assigned_to=current_setting('test.sod_packer') WHERE id=current_setting('test.sod_pack')::uuid;
SELECT set_config('request.jwt.claim.sub',current_setting('test.sod_packer'),true);
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.sod_packer'),'role','authenticated')::text,true);
-- Trigger assertions run with privileged row access but authenticated employee claims.
-- This avoids RLS silently updating zero rows and falsely passing denial tests.
UPDATE public.wms_jobs SET line_items=jsonb_set(jsonb_set(jsonb_set(line_items,'{0,packedQty}','2'),'{0,packed}','true'),'{0,status}','"Picked"') WHERE id=current_setting('test.sod_pack')::uuid;
UPDATE public.wms_jobs SET status='Completed',completed_by=current_setting('test.sod_packer'),pack_security_seal_serial='TEST-ROLLBACK-SEAL' WHERE id=current_setting('test.sod_pack')::uuid;
RESET ROLE;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.wms_jobs WHERE id=current_setting('test.sod_pack')::uuid AND status='Completed' AND completed_by=current_setting('test.sod_packer')) THEN RAISE EXCEPTION 'TEST: independent completion missing'; END IF;
END; $$;
ROLLBACK;
SELECT 'PASS: all floor stage assignments and execution denied for prior handler; same stage and different orders allowed; independent packer completes' AS result;
