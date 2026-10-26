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
SELECT 'PASS: picker assignment, history bypass and count writes denied; independent packer completes' AS result;
