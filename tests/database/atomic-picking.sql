-- Rollback-only staging regression: real auth scopes, synthetic jobs and stock.
BEGIN;
SET LOCAL statement_timeout='8s';
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$
DECLARE p public.products%ROWTYPE; other_lot public.products%ROWTYPE; j public.wms_jobs%ROWTYPE; actor uuid; bin text; parent_id uuid;
BEGIN
 IF private.pick_location_barcode('ET-ADD-DC-01','A-01-02') IS DISTINCT FROM '394101010200002' THEN RAISE EXCEPTION 'TEST: label hash differs from app encoder'; END IF;
 SELECT id INTO actor FROM public.employees WHERE role='picker' AND site_id='a1111111-1111-4000-8000-000000000001' AND lower(status)='active' LIMIT 1;
 IF actor IS NULL THEN RAISE EXCEPTION 'Fixture requires staging picker'; END IF;
 SELECT * INTO p FROM public.products WHERE id='f9516562-dba3-4ba3-a6b6-2476d2b89220';
 p.id:=gen_random_uuid(); p.sku:='ET-TEST-PICK-'||substr(p.id::text,1,8);p.stock:=5;p.name:='Picking rollback fixture';
 INSERT INTO public.products SELECT p.*;
 other_lot:=p;other_lot.id:=gen_random_uuid();other_lot.location:='B-01-02';other_lot.batch_number:='ANOTHER-LOT';other_lot.stock:=9;
 INSERT INTO public.products SELECT other_lot.*;
 PERFORM set_config('test.pick_other_lot',other_lot.id::text,true);
 INSERT INTO public.wms_jobs(site_id,source_site_id,dest_site_id,country_code,type,status,priority,transfer_status,line_items,items_count,job_number)
 VALUES(p.site_id,p.site_id,'c1111111-1111-4000-8000-000000000106','ET','TRANSFER','Pending','Normal','Picking','[]',1,'TEST-PICK') RETURNING id INTO parent_id;
 INSERT INTO public.wms_jobs(site_id,source_site_id,dest_site_id,country_code,type,status,priority,assigned_to,line_items,items_count,order_ref)
 VALUES(p.site_id,p.site_id,'c1111111-1111-4000-8000-000000000106','ET','PICK','In-Progress','Normal',actor::text,
  jsonb_build_array(jsonb_build_object('productId',p.id,'sku',p.sku,'name',p.name,'expectedQty',2,'pickedQty',0,'status','Pending')),1,parent_id::text) RETURNING * INTO j;
 INSERT INTO public.job_assignments(job_id,employee_id,employee_name,status) VALUES(j.id,actor,'Picking test','In-Progress');
 -- Exercise a configured prefix that differs from the site-code hash.
 UPDATE public.sites SET barcode_prefix='7654' WHERE id=p.site_id;
 SELECT private.pick_location_barcode('SITE-'||s.barcode_prefix,p.location) INTO bin
 FROM public.sites s WHERE s.id=p.site_id;
 IF left(bin,4)<>'7654' THEN RAISE EXCEPTION 'TEST: configured facility prefix was ignored'; END IF;
 PERFORM set_config('test.pick_actor',actor::text,true);PERFORM set_config('test.pick_job',j.id::text,true);
 PERFORM set_config('test.pick_product',p.id::text,true);PERFORM set_config('test.pick_sku',p.sku,true);PERFORM set_config('test.pick_bin',bin,true);
 PERFORM set_config('test.pick_parent',parent_id::text,true);
 PERFORM set_config('request.jwt.claim.sub',actor::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
END; $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE job_id uuid:=current_setting('test.pick_job')::uuid; result jsonb; retry jsonb; qty numeric;
BEGIN
 BEGIN
  PERFORM public.complete_pick_job(job_id); RAISE EXCEPTION 'TEST: unscanned completion accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
 BEGIN
  UPDATE public.wms_jobs SET status='Completed' WHERE id=job_id; RAISE EXCEPTION 'TEST: direct completion accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
 BEGIN
  PERFORM public.record_pick_line(job_id,0,2,'000000000000000',current_setting('test.pick_sku'),NULL); RAISE EXCEPTION 'TEST: wrong bay accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
 BEGIN
  PERFORM public.record_pick_line(job_id,0,0,current_setting('test.pick_bin'),'',NULL); RAISE EXCEPTION 'TEST: unreasoned shortage accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
 BEGIN
  UPDATE public.wms_jobs SET line_items=jsonb_set(line_items,'{0,pickedQty}','2') WHERE id=job_id; RAISE EXCEPTION 'TEST: direct count tampering accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
 PERFORM public.record_pick_line(job_id,0,2,current_setting('test.pick_bin'),current_setting('test.pick_sku'),NULL);
 result:=public.complete_pick_job(job_id);retry:=public.complete_pick_job(job_id);
 IF result->'job'->>'status'<>'Completed' OR result->'pack'->>'id' IS NULL OR result->'pack'->>'id' IS DISTINCT FROM retry->'pack'->>'id' THEN RAISE EXCEPTION 'TEST: completion is not idempotent'; END IF;
 PERFORM set_config('test.pick_result',result::text,true);
END; $$;
RESET ROLE;
DO $$ BEGIN
 IF (SELECT stock FROM public.products WHERE id=current_setting('test.pick_product')::uuid) IS DISTINCT FROM 3 THEN RAISE EXCEPTION 'TEST: stock deducted incorrectly'; END IF;
 IF (SELECT stock FROM public.products WHERE id=current_setting('test.pick_other_lot')::uuid) IS DISTINCT FROM 9 THEN RAISE EXCEPTION 'TEST: wrong lot deducted'; END IF;
 IF (SELECT count(*) FROM public.wms_jobs WHERE type='PACK' AND order_ref=current_setting('test.pick_parent'))<>1 THEN RAISE EXCEPTION 'TEST: duplicate packing'; END IF;
END; $$;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$
DECLARE j public.wms_jobs%ROWTYPE; online_id uuid:=gen_random_uuid(); actor uuid:=current_setting('test.pick_actor')::uuid;
BEGIN
 SELECT * INTO j FROM public.wms_jobs WHERE id=current_setting('test.pick_job')::uuid;
 j.id:=gen_random_uuid();j.order_ref:=gen_random_uuid()::text;j.status:='In-Progress';j.completed_at:=NULL;j.completed_by:=NULL;
 j.line_items:=jsonb_set(jsonb_set(jsonb_set(j.line_items,'{0,expectedQty}','6'),'{0,pickedQty}','0'),'{0,status}','"Pending"');
 INSERT INTO public.wms_jobs SELECT j.*;
 INSERT INTO public.job_assignments(job_id,employee_id,employee_name,status) VALUES(j.id,actor,'Picking test','In-Progress');
 PERFORM set_config('test.pick_insufficient',j.id::text,true);
 j.id:=gen_random_uuid();j.order_ref:=gen_random_uuid()::text;j.line_items:=jsonb_set(j.line_items,'{0,expectedQty}','2');
 INSERT INTO public.wms_jobs SELECT j.*;
 INSERT INTO public.job_assignments(job_id,employee_id,employee_name,status) VALUES(j.id,actor,'Picking test','In-Progress');
 PERFORM set_config('test.pick_zero',j.id::text,true);
 j.id:=gen_random_uuid();j.order_ref:=gen_random_uuid()::text;j.country_code:='KE';
 INSERT INTO public.wms_jobs SELECT j.*;
 INSERT INTO public.job_assignments(job_id,employee_id,employee_name,status) VALUES(j.id,actor,'Picking test','In-Progress');
 PERFORM set_config('test.pick_cross_country',j.id::text,true);
 j.country_code:='ET';

 j.id:=gen_random_uuid();j.order_ref:=gen_random_uuid()::text;
 INSERT INTO public.wms_jobs SELECT j.*;
 INSERT INTO public.job_assignments(job_id,employee_id,employee_name,status) VALUES(j.id,actor,'Picking test','In-Progress');
 PERFORM set_config('test.pick_partial',j.id::text,true);
 j.id:=gen_random_uuid();j.order_ref:=online_id::text;
 INSERT INTO public.wms_jobs SELECT j.*;
 INSERT INTO public.job_assignments(job_id,employee_id,employee_name,status) VALUES(j.id,actor,'Picking test','In-Progress');
 INSERT INTO public.storefront_orders(id,order_number,site_id,country_code,currency,customer_name,customer_phone,fulfillment_method,payment_method,status,merchandise_subtotal,pick_job_id)
 VALUES(online_id,'PICK-TEST-'||online_id::text,j.site_id,'ET','ETB','Rollback Test','0000000000','pickup','cash_on_pickup','accepted',0,j.id);
 INSERT INTO public.storefront_stock_reservations(order_id,product_id,quantity) VALUES(online_id,current_setting('test.pick_product')::uuid,2);
 PERFORM set_config('test.pick_online',j.id::text,true);
 PERFORM set_config('test.pick_online_order',online_id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
END; $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE result jsonb; qty numeric; actor uuid:=current_setting('test.pick_actor')::uuid;
BEGIN
 BEGIN
  PERFORM public.complete_pick_job(current_setting('test.pick_cross_country')::uuid); RAISE EXCEPTION 'TEST: cross-country picking accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM public.record_pick_line(current_setting('test.pick_insufficient')::uuid,0,6,current_setting('test.pick_bin'),current_setting('test.pick_sku'),NULL);
 BEGIN
  PERFORM public.complete_pick_job(current_setting('test.pick_insufficient')::uuid); RAISE EXCEPTION 'TEST: insufficient stock accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
 result:=public.record_pick_line(current_setting('test.pick_insufficient')::uuid,0,6,current_setting('test.pick_bin'),current_setting('test.pick_sku'),NULL);
 IF result->>'status'<>'In-Progress' THEN RAISE EXCEPTION 'TEST: failed transaction leaked job completion'; END IF;
 PERFORM public.record_pick_line(current_setting('test.pick_zero')::uuid,0,0,current_setting('test.pick_bin'),'','Bin physically empty');
 result:=public.complete_pick_job(current_setting('test.pick_zero')::uuid);
 IF result->'job'->>'status'<>'Completed' OR result->'pack'<>'null'::jsonb THEN RAISE EXCEPTION 'TEST: zero shortage created packing'; END IF;

 PERFORM public.record_pick_line(current_setting('test.pick_partial')::uuid,0,1,current_setting('test.pick_bin'),current_setting('test.pick_sku'),'Only one physical unit');
 result:=public.complete_pick_job(current_setting('test.pick_partial')::uuid);
 IF result->'pack'->'line_items'->0->>'expectedQty'<>'1' THEN RAISE EXCEPTION 'TEST: partial PACK contains unpicked units'; END IF;
 BEGIN
  PERFORM public.record_pick_line(current_setting('test.pick_online')::uuid,0,0,current_setting('test.pick_bin'),'','Empty bay'); RAISE EXCEPTION 'TEST: online reservation shortage accepted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
 PERFORM public.record_pick_line(current_setting('test.pick_online')::uuid,0,2,current_setting('test.pick_bin'),current_setting('test.pick_sku'),NULL);
 result:=public.complete_pick_job(current_setting('test.pick_online')::uuid);
 PERFORM public.complete_pick_job(current_setting('test.pick_online')::uuid);
 IF result->'pack'->>'id' IS NULL THEN RAISE EXCEPTION 'TEST: online packing missing'; END IF;
 PERFORM set_config('request.jwt.claim.sub','27331fda-2fcf-4c1f-b08a-6742837c94e2',true);
 PERFORM set_config('request.jwt.claims','{"sub":"27331fda-2fcf-4c1f-b08a-6742837c94e2","role":"authenticated"}',true);
 BEGIN
  PERFORM public.complete_pick_job(current_setting('test.pick_job')::uuid); RAISE EXCEPTION 'TEST: different worker accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
RESET ROLE;
DO $$ BEGIN
 IF (SELECT stock FROM public.products WHERE id=current_setting('test.pick_product')::uuid) IS DISTINCT FROM 0 THEN RAISE EXCEPTION 'TEST: stock not deducted exactly once'; END IF;
 IF EXISTS(SELECT 1 FROM public.storefront_stock_reservations WHERE order_id=current_setting('test.pick_online_order')::uuid AND released_at IS NULL) THEN RAISE EXCEPTION 'TEST: online reservation not released'; END IF;
END; $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN
  PERFORM public.complete_pick_job(current_setting('test.pick_job')::uuid); RAISE EXCEPTION 'TEST: anonymous completion accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: verified pick, exact lot, idempotency, atomic rollback, partial/zero shortages, online reservations and worker scope' AS result;
