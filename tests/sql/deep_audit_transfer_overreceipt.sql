-- Deep audit: excess destination stock relative to recorded arrival; all changes roll back.
BEGIN;
SET LOCAL statement_timeout='5s';
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE source public.products%ROWTYPE; j uuid; n integer; ref text:=gen_random_uuid()::text; lines jsonb; BEGIN
 SELECT * INTO STRICT source FROM public.products WHERE id='dd450985-8a61-40c6-a1f6-7fe6723f0858';
 PERFORM set_config('test.intake.batch', 'AUDIT-'||ref,true);
 FOR n IN 1..1 LOOP
  j:=gen_random_uuid();
  lines:=jsonb_build_array(jsonb_build_object('productId',source.id,'sku',source.sku,'name',source.name,'expectedQty',5,
   'deliveredQty',5,'batchNumber','AUDIT-'||ref,'condition','Good'));
  INSERT INTO public.wms_jobs(id,site_id,source_site_id,dest_site_id,country_code,type,status,priority,transfer_status,order_ref,job_number,line_items,items_count,assigned_to)
  VALUES(j,source.site_id,source.site_id,'c1111111-1111-4000-8000-000000000112','ET','TRANSFER','Pending','Normal','Delivered',gen_random_uuid()::text,'AUDIT-'||n||ref,private.strip_transfer_quantities(lines),1,'c33cd397-8367-4f55-86d1-6b363001e7d5');
  INSERT INTO private.transfer_receipt_manifests(job_id,items,site_id,country_code) VALUES(j,lines,'c1111111-1111-4000-8000-000000000112','ET');
  PERFORM set_config('test.intake.job'||n,j::text,true);
 END LOOP;
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000095',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000095","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE j uuid:=current_setting('test.intake.job1')::uuid; blocked boolean:=false; state jsonb; BEGIN
 PERFORM public.record_transfer_receipt_count(j,'[{"index":0,"productId":"dd450985-8a61-40c6-a1f6-7fe6723f0858","receivedQty":7,"condition":"Good"}]');
 BEGIN PERFORM public.accept_verified_transfer(j);EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 ASSERT blocked,'Overreceipt posted before independent signatures';
 ASSERT NOT EXISTS(SELECT 1 FROM public.products WHERE site_id='c1111111-1111-4000-8000-000000000112' AND batch_number=current_setting('test.intake.batch')),'Blocked acceptance left stock';
 state:=public.get_transfer_variance(j);
 blocked:=false;BEGIN PERFORM public.sign_transfer_variance(j,'supervisor',state->>'fingerprint','Attempted maker approval');EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 ASSERT blocked,'Counter approved own variance';
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','c33cd397-8367-4f55-86d1-6b363001e7d5',true);
SELECT set_config('request.jwt.claims','{"sub":"c33cd397-8367-4f55-86d1-6b363001e7d5","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE j uuid:=current_setting('test.intake.job1')::uuid; state jsonb; BEGIN
 state:=public.get_transfer_variance(j);
 state:=public.sign_transfer_variance(j,'driver',state->>'fingerprint','Physical arrival count co-signed');
 ASSERT (state->>'driverSigned')::boolean;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','988fb8ef-8053-415b-9032-2aca981058d7',true);
SELECT set_config('request.jwt.claims','{"sub":"988fb8ef-8053-415b-9032-2aca981058d7","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE j uuid:=current_setting('test.intake.job1')::uuid; state jsonb; blocked boolean:=false; BEGIN
 state:=public.get_transfer_variance(j);
 BEGIN PERFORM public.sign_transfer_variance(j,'supervisor','stale','Count reviewed against custody evidence');EXCEPTION WHEN raise_exception THEN blocked:=true;END;
 ASSERT blocked,'Stale evidence accepted';
 state:=public.sign_transfer_variance(j,'supervisor',state->>'fingerprint','Count reviewed against custody evidence');
 ASSERT (state->>'approved')::boolean AND (state->>'driverSigned')::boolean;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000095',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000095","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE j uuid:=current_setting('test.intake.job1')::uuid; result jsonb; total numeric; BEGIN
 result:=public.accept_verified_transfer(j);
 ASSERT result->>'saved'='true' AND result->>'hasDiscrepancy'='true';
 SELECT sum(stock) INTO total FROM public.products WHERE site_id='c1111111-1111-4000-8000-000000000112' AND batch_number=current_setting('test.intake.batch');
 ASSERT total=7,'Authorized variance did not post the counted quantity';
 ASSERT EXISTS(SELECT 1 FROM public.wms_jobs WHERE id=j AND transfer_status='Received' AND status='Completed');
END $$;
ROLLBACK;
SELECT 'PASS: overreceipt blocked until independent supervisor and assigned driver signatures, then posted atomically; rolled back' AS result;
