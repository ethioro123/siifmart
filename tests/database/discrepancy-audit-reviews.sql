-- Rollback-only staging regression: no lasting counts, stock changes or events.
BEGIN;
SET LOCAL statement_timeout='15s';
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$
DECLARE picker uuid; packer uuid; supervisor uuid; site uuid; pack_id uuid; pick_id uuid; p public.products%ROWTYPE; bin text;
BEGIN
 SELECT id,site_id INTO picker,site FROM public.employees WHERE role='picker' AND site_id='a1111111-1111-4000-8000-000000000001' LIMIT 1;
 SELECT id INTO packer FROM public.employees WHERE role='packer' AND site_id=site LIMIT 1;
 SELECT id INTO supervisor FROM public.employees WHERE role='warehouse_manager' AND site_id=site LIMIT 1;
 SELECT * INTO p FROM public.products WHERE site_id=site AND location ~ '^[A-Z]-[0-9]{2}-[0-9]{2}$' LIMIT 1;
 IF picker IS NULL OR packer IS NULL OR supervisor IS NULL OR p.id IS NULL THEN RAISE EXCEPTION 'Missing staging fixtures'; END IF;
 p.id:=gen_random_uuid();p.sku:='ET-DIFF-'||substr(p.id::text,1,8);p.barcode:=p.sku;p.stock:=23;p.expiry_date:=current_date+90;
 INSERT INTO public.products SELECT p.*;
 INSERT INTO public.wms_jobs(country_code,site_id,type,status,priority,assigned_to,order_ref,line_items,items_count)
 VALUES('ET',site,'PICK','In-Progress','Normal',picker::text,'PICK-DIFF-'||gen_random_uuid()::text,
 jsonb_build_array(jsonb_build_object('productId',p.id,'sku',p.sku,'name',p.name,'expectedQty',23,'pickedQty',0,'status','Pending','location',p.location)),1) RETURNING id INTO pick_id;
 INSERT INTO public.job_assignments(job_id,employee_id,employee_name,status) VALUES(pick_id,picker,'Picking regression','In-Progress');
 INSERT INTO public.wms_jobs(country_code,site_id,type,status,priority,assigned_to,order_ref,line_items,items_count)
 VALUES('ET',site,'PACK','In-Progress','Normal',packer::text,'PACK-DIFF-'||gen_random_uuid()::text,
 jsonb_build_array(jsonb_build_object('productId',p.id,'sku',p.sku,'name',p.name,'expectedQty',23,'pickedQty',23,'packedQty',0,'status','Pending')),1) RETURNING id INTO pack_id;
 INSERT INTO public.job_assignments(job_id,employee_id,employee_name,status) VALUES(pack_id,packer,'Packing regression','In-Progress');
 SELECT private.pick_location_barcode(CASE WHEN nullif(barcode_prefix,'') IS NULL THEN code ELSE 'SITE-'||barcode_prefix END,p.location) INTO bin FROM public.sites WHERE id=site;
 PERFORM set_config('test.diff_pick',pick_id::text,true);PERFORM set_config('test.diff_pack',pack_id::text,true);
 PERFORM set_config('test.diff_picker',picker::text,true);PERFORM set_config('test.diff_packer',packer::text,true);
 PERFORM set_config('test.diff_supervisor',supervisor::text,true);PERFORM set_config('test.diff_product',p.id::text,true);
 PERFORM set_config('test.diff_sku',p.sku,true);PERFORM set_config('test.diff_bin',bin,true);
END; $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE actor uuid:=current_setting('test.diff_packer')::uuid; pack uuid:=current_setting('test.diff_pack')::uuid; pick uuid:=current_setting('test.diff_pick')::uuid; d jsonb; original jsonb; supervisor uuid:=current_setting('test.diff_supervisor')::uuid; result jsonb;
BEGIN
 PERFORM set_config('request.jwt.claim.sub',actor::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 SELECT line_items INTO original FROM public.wms_jobs WHERE id=pack;
 d:=public.report_floor_discrepancy(pack,0,20,20,'Only 20 units at the packing station');
 IF public.report_floor_discrepancy(pack,0,20,20,'Only 20 units at the packing station')->>'id' IS DISTINCT FROM d->>'id' THEN RAISE EXCEPTION 'TEST: duplicate retry report'; END IF;
 BEGIN
  UPDATE public.wms_jobs SET line_items=jsonb_set(line_items,'{0,packedQty}','23') WHERE id=pack;
  RAISE EXCEPTION 'TEST: work continued on hold';
 EXCEPTION WHEN raise_exception OR insufficient_privilege THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
 BEGIN
  PERFORM public.resolve_floor_discrepancy(pack,(d->>'id')::uuid,'goods_recovered',23,'Found three units');
  RAISE EXCEPTION 'TEST: reporter approved own discrepancy';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 IF (SELECT line_items FROM public.wms_jobs WHERE id=pack) IS DISTINCT FROM original THEN RAISE EXCEPTION 'TEST: reporting rewrote pick evidence'; END IF;
 PERFORM set_config('test.diff_report',d->>'id',true);
 PERFORM set_config('request.jwt.claim.sub',supervisor::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',supervisor,'role','authenticated')::text,true);
 BEGIN
  UPDATE public.wms_jobs SET status='Completed' WHERE id=pack;
  RAISE EXCEPTION 'TEST: completion bypassed hold';
 EXCEPTION WHEN raise_exception OR insufficient_privilege THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
 BEGIN
  INSERT INTO public.wms_jobs(country_code,site_id,source_site_id,type,status,priority,order_ref,line_items,items_count)
  SELECT country_code,site_id,site_id,'DISPATCH','Pending','Normal',order_ref,'[]',0 FROM public.wms_jobs WHERE id=pack;
  RAISE EXCEPTION 'TEST: dispatch created despite hold';
 EXCEPTION WHEN raise_exception OR insufficient_privilege THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
 BEGIN
  PERFORM public.resolve_floor_discrepancy(pack,(d->>'id')::uuid,'goods_recovered',20,'Accept three missing');
  RAISE EXCEPTION 'TEST: short packing approved';
 EXCEPTION WHEN raise_exception OR insufficient_privilege THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
 PERFORM public.resolve_floor_discrepancy(pack,(d->>'id')::uuid,'goods_recovered',23,'Recovered three units from the original tote');
 BEGIN
  UPDATE public.wms_jobs SET line_items=jsonb_set(line_items,'{0,pickedQty}','20') WHERE id=pack;
  RAISE EXCEPTION 'TEST: original picked count overwritten';
 EXCEPTION WHEN raise_exception OR insufficient_privilege THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
 PERFORM set_config('request.jwt.claim.sub',actor::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 BEGIN
  UPDATE public.wms_jobs SET line_items=jsonb_set(line_items,'{0,packedQty}','23.0001') WHERE id=pack;
  RAISE EXCEPTION 'TEST: packing variance slipped through a tolerance';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
 d:=public.report_floor_discrepancy(pack,0,25,25,'25 physical units observed');
 PERFORM set_config('request.jwt.claim.sub',supervisor::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',supervisor,'role','authenticated')::text,true);
 PERFORM public.resolve_floor_discrepancy(pack,(d->>'id')::uuid,'excess_segregated',23,'Two excess units segregated for controlled return');
 actor:=current_setting('test.diff_picker')::uuid;
 PERFORM set_config('request.jwt.claim.sub',actor::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 BEGIN
  PERFORM public.record_pick_line(pick,0,20,current_setting('test.diff_bin'),current_setting('test.diff_sku'),'Only 20 physical units');
  RAISE EXCEPTION 'TEST: pick shortage lacked recount and approval';
 EXCEPTION WHEN raise_exception OR insufficient_privilege THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
 d:=public.report_floor_discrepancy(pick,0,20,20,'Only 20 physical units at the source');
 PERFORM set_config('request.jwt.claim.sub',supervisor::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',supervisor,'role','authenticated')::text,true);
 PERFORM public.resolve_floor_discrepancy(pick,(d->>'id')::uuid,'short_pick',20,'Verified recount and approved short picking');
 PERFORM set_config('request.jwt.claim.sub',actor::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 PERFORM public.record_pick_line(pick,0,20,current_setting('test.diff_bin'),current_setting('test.diff_sku'),'Only 20 physical units');
 result:=public.complete_pick_job(pick);
 IF result->'pack'->'line_items'->0->>'expectedQty'<>'20' THEN RAISE EXCEPTION 'TEST: incorrect downstream quantity'; END IF;
 BEGIN
  PERFORM public.floor_discrepancy_history(pack);
  RAISE EXCEPTION 'TEST: unrelated worker read packing reports';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
DO $$
DECLARE supervisor uuid:=current_setting('test.diff_supervisor')::uuid; pick uuid:=current_setting('test.diff_pick')::uuid; site uuid; d jsonb; award jsonb; history jsonb;
BEGIN
 PERFORM set_config('request.jwt.claim.sub',supervisor::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',supervisor,'role','authenticated')::text,true);
 SELECT site_id INTO site FROM public.wms_jobs WHERE id=pick;
 history:=public.floor_audit_timeline(site,'ET','product',current_setting('test.diff_product')::uuid,0);
 IF jsonb_array_length(history)<>3 THEN RAISE EXCEPTION 'TEST: product history missing linked reports'; END IF;
 history:=public.floor_audit_timeline(site,'ET','employee',current_setting('test.diff_picker')::uuid,0);
 IF jsonb_array_length(history)<>1 THEN RAISE EXCEPTION 'TEST: staff history missing picker involvement'; END IF;
 award:=public.award_completed_warehouse_job(pick);
 IF award->>'pending_review'<>'true' THEN RAISE EXCEPTION 'TEST: unreviewed award was not deferred'; END IF;
 d:=public.floor_discrepancy_history(pick)->0;
 PERFORM public.review_floor_discrepancy(pick,(d->>'id')::uuid,'stock_issue',NULL,'No staff error established; physical shortage verified');
 PERFORM public.review_floor_discrepancy(pick,(d->>'id')::uuid,'stock_issue',NULL,'No staff error established; physical shortage verified');
 IF (SELECT count(*) FROM public.points_transactions WHERE job_id=pick::text AND type='JOB_COMPLETE')<>1 THEN RAISE EXCEPTION 'TEST: deferred award missing or duplicated'; END IF;
 BEGIN
  PERFORM public.review_floor_discrepancy(pick,(d->>'id')::uuid,'undetermined',NULL,'Overwrite the decision');
  RAISE EXCEPTION 'TEST: finalized review overwritten';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
 BEGIN
  PERFORM public.floor_audit_timeline(site,'KE','product',current_setting('test.diff_product')::uuid,0);
  RAISE EXCEPTION 'TEST: cross-country history leaked';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
RESET ROLE;
DO $$ BEGIN
 IF (SELECT stock FROM public.products WHERE id=current_setting('test.diff_product')::uuid)<>3 THEN RAISE EXCEPTION 'TEST: stock deducted beyond approved 20'; END IF;
 IF (SELECT count(*) FROM private.floor_discrepancies WHERE job_id=current_setting('test.diff_pack')::uuid)<>2 THEN RAISE EXCEPTION 'TEST: shortage/excess audit missing'; END IF;
END; $$;
SET LOCAL ROLE anon;
DO $$ BEGIN
 BEGIN
  PERFORM public.floor_discrepancy_history(current_setting('test.diff_pack')::uuid);
  RAISE EXCEPTION 'TEST: anonymous audit access';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: 23/20 and 23/25 recounts, immutable pick proof, holds, supervisor separation, scope and approved stock deduction' AS result;
