BEGIN;
SET LOCAL statement_timeout='8s';
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE p public.products%ROWTYPE; source uuid:=gen_random_uuid(); job uuid:=gen_random_uuid(); lines jsonb; batch text:='AUDIT-'||gen_random_uuid(); BEGIN
 SELECT * INTO p FROM public.products WHERE id='dd450985-8a61-40c6-a1f6-7fe6723f0858';
 INSERT INTO public.products SELECT (jsonb_populate_record(NULL::public.products,to_jsonb(p)||jsonb_build_object('id',source,'site_id','c1111111-1111-4000-8000-000000000109','batch_number',batch))).*;
 lines:=jsonb_build_array(jsonb_build_object('productId',source,'sku',p.sku,'name',p.name,'expectedQty',5,'deliveredQty',5,'batchNumber',batch,'condition','Good'));
 INSERT INTO public.wms_jobs(id,site_id,source_site_id,dest_site_id,country_code,type,status,priority,transfer_status,order_ref,line_items,items_count)
 VALUES(job,'c1111111-1111-4000-8000-000000000109','c1111111-1111-4000-8000-000000000109','c1111111-1111-4000-8000-000000000110','ET','TRANSFER','Pending','Normal','Delivered',gen_random_uuid()::text,private.strip_transfer_quantities(lines),1);
 INSERT INTO private.transfer_receipt_manifests(job_id,items,site_id,country_code) VALUES(job,lines,'c1111111-1111-4000-8000-000000000110','ET');
 PERFORM set_config('test.warehouse.job',job::text,true);PERFORM set_config('test.warehouse.source',source::text,true);PERFORM set_config('test.warehouse.batch',batch,true);
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000083',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000083","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE j uuid:=current_setting('test.warehouse.job')::uuid; saved jsonb; replay jsonb; BEGIN
 PERFORM public.record_transfer_receipt_count(j,jsonb_build_array(jsonb_build_object('index',0,'productId',current_setting('test.warehouse.source'),'receivedQty',5,'condition','Good')));
 saved:=public.accept_verified_transfer(j);replay:=public.accept_verified_transfer(j);
 ASSERT saved=replay AND saved->>'putawayJobId' IS NOT NULL,'Warehouse handoff not idempotent';
 ASSERT (SELECT coalesce(sum(stock),0) FROM public.products WHERE site_id='c1111111-1111-4000-8000-000000000110' AND batch_number=current_setting('test.warehouse.batch'))=0,'Warehouse intake posted stock before physical placement';
 ASSERT (SELECT count(*) FROM public.wms_jobs WHERE type='PUTAWAY' AND order_ref=j::text)=1,'Missing or duplicate putaway';
END $$;
ROLLBACK;
SELECT 'PASS: warehouse receipt queues one putaway without posting stock before placement; rolled back' result;
