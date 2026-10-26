BEGIN;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE site uuid; actor uuid; source uuid; job uuid; BEGIN
 SELECT e.id,e.site_id INTO actor,site FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE s.type='Store' AND s.country='ET' AND e.role='store_manager' AND lower(e.status)='active' LIMIT 1;
 SELECT id INTO source FROM public.sites WHERE type='Distribution Center' AND country='ET' LIMIT 1;
 INSERT INTO public.wms_jobs(site_id,source_site_id,dest_site_id,country_code,type,status,priority,transfer_status,order_ref,line_items,items_count)
 VALUES(source,source,site,'ET','TRANSFER','Pending','Normal','In-Transit',gen_random_uuid()::text,'[{"productId":"11111111-1111-4111-8111-111111111111","sku":"ET-TEST","name":"Blind test","expectedQty":23,"pickedQty":23,"packedQty":23,"unit":"UNIT"}]',23) RETURNING id INTO job;
 PERFORM set_config('test.blind_job',job::text,true);PERFORM set_config('test.blind_actor',actor::text,true);
END; $$;
SELECT set_config('request.jwt.claim.sub',current_setting('test.blind_actor'),true);
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.blind_actor'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE row jsonb; BEGIN
 IF EXISTS(SELECT 1 FROM public.wms_jobs WHERE id=current_setting('test.blind_job')::uuid) THEN RAISE EXCEPTION 'TEST: direct unredacted manifest visible'; END IF;
 SELECT to_jsonb(j) INTO row FROM public.blind_receiving_wms j WHERE id=current_setting('test.blind_job')::uuid;
 IF row IS NULL OR row->'line_items'->0 ? 'expectedQty' OR row->'line_items'->0 ? 'pickedQty' OR row->>'items_count'<>'0' THEN RAISE EXCEPTION 'TEST: blind shipment leaks quantity'; END IF;
 BEGIN
  PERFORM public.get_transfer_receipt_verification(current_setting('test.blind_job')::uuid);
  RAISE EXCEPTION 'TEST: receiving started before arrival';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
END; $$;
RESET ROLE;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE j public.wms_jobs%ROWTYPE; BEGIN
 SELECT * INTO j FROM public.wms_jobs WHERE id=current_setting('test.blind_job')::uuid;
 -- Trusted fixture simulates a driver-recorded arrival, retaining its private expected count.
 INSERT INTO private.transfer_receipt_manifests(job_id,items,site_id,country_code) VALUES(j.id,j.line_items,j.dest_site_id,j.country_code);
 UPDATE public.wms_jobs SET transfer_status='Delivered',line_items=private.strip_transfer_quantities(line_items) WHERE id=j.id;
END; $$;
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.blind_actor'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE result jsonb; BEGIN
 result:=public.record_transfer_receipt_count(current_setting('test.blind_job')::uuid,'[{"index":0,"productId":"11111111-1111-4111-8111-111111111111","receivedQty":20,"condition":"Good"}]');
 IF result->>'status'<>'verified' THEN RAISE EXCEPTION 'TEST: single accountable receiver was forced to obtain a second count'; END IF;
END; $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: pending API redaction, direct-read denial and arrival gate' AS result;
