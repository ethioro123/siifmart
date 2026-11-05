-- Rollback-only regression for verified shipment intake and idempotent inventory posting.
BEGIN;
SET LOCAL statement_timeout='5s';
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE source public.products%ROWTYPE; j uuid; n integer; ref text:=gen_random_uuid()::text; lines jsonb; BEGIN
 SELECT * INTO STRICT source FROM public.products WHERE id='dd450985-8a61-40c6-a1f6-7fe6723f0858';
 PERFORM set_config('test.intake.batch', 'AUDIT-'||ref,true);
 FOR n IN 1..4 LOOP
  j:=gen_random_uuid();
  lines:=jsonb_build_array(jsonb_build_object('productId',source.id,'sku',source.sku,'name',source.name,'expectedQty',5,
   'deliveredQty',5,'batchNumber','AUDIT-'||ref,'condition','Good'));
  IF n=4 THEN lines:=lines||jsonb_build_array(jsonb_build_object('productId','99999999-9999-4999-8999-999999999999','sku','ET-MISSING-AUDIT','expectedQty',5,'deliveredQty',5,'condition','Good')); END IF;
  INSERT INTO public.wms_jobs(id,site_id,source_site_id,dest_site_id,country_code,type,status,priority,transfer_status,order_ref,job_number,line_items,items_count)
  VALUES(j,source.site_id,source.site_id,'c1111111-1111-4000-8000-000000000112','ET','TRANSFER','Pending','Normal','Delivered',gen_random_uuid()::text,'AUDIT-'||n||ref,private.strip_transfer_quantities(lines),1);
  INSERT INTO private.transfer_receipt_manifests(job_id,items,site_id,country_code) VALUES(j,lines,'c1111111-1111-4000-8000-000000000112','ET');
  PERFORM set_config('test.intake.job'||n,j::text,true);
 END LOOP;
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000095',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000095","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE j uuid; counts jsonb; first jsonb; retry jsonb; total numeric; blocked boolean; BEGIN
 counts:='[{"index":0,"productId":"dd450985-8a61-40c6-a1f6-7fe6723f0858","receivedQty":5,"condition":"Good"}]';
 j:=current_setting('test.intake.job1')::uuid;
 blocked:=false;BEGIN PERFORM public.accept_verified_transfer(j);EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 ASSERT blocked,'Unverified counts accepted';
 PERFORM public.record_transfer_receipt_count(j,counts);
 first:=public.accept_verified_transfer(j);
 ASSERT first->>'saved'='true';
 retry:=public.accept_verified_transfer(j);
 ASSERT first=retry,'Retry confirmation changed';
 j:=current_setting('test.intake.job2')::uuid;
 PERFORM public.record_transfer_receipt_count(j,counts);
 PERFORM public.accept_verified_transfer(j);
 SELECT sum(stock) INTO total FROM public.products WHERE site_id='c1111111-1111-4000-8000-000000000112' AND batch_number=current_setting('test.intake.batch');
 ASSERT total=10,'Different shipments lost an inventory increment';
 j:=current_setting('test.intake.job4')::uuid;
 PERFORM public.record_transfer_receipt_count(j,counts||'[{"index":1,"productId":"99999999-9999-4999-8999-999999999999","receivedQty":5,"condition":"Good"}]');
 blocked:=false;
 BEGIN PERFORM public.accept_verified_transfer(j);
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Trusted source product is missing' THEN blocked:=true; ELSE RAISE; END IF; END;
 ASSERT blocked,'Broken later line was accepted';
 ASSERT (SELECT sum(stock) FROM public.products WHERE site_id='c1111111-1111-4000-8000-000000000112' AND batch_number=current_setting('test.intake.batch'))=10,'Failed later line left partial stock';
 j:=current_setting('test.intake.job3')::uuid;
 blocked:=false;
 BEGIN UPDATE public.wms_jobs SET transfer_status='Received',status='Completed',received_by='Teshome Negeri' WHERE id=j;
 EXCEPTION WHEN raise_exception THEN blocked:=true; END;
 ASSERT blocked,'Legacy PATCH accepted unposted receiving';
END $$;
RESET ROLE;
DO $$ BEGIN
 ASSERT NOT EXISTS(SELECT 1 FROM private.transfer_intake_posts WHERE job_id=current_setting('test.intake.job4')::uuid);
 ASSERT (SELECT count(*) FROM private.transfer_intake_posts WHERE job_id IN(current_setting('test.intake.job1')::uuid,current_setting('test.intake.job2')::uuid))=2;
 ASSERT (SELECT count(*) FROM public.stock_movements WHERE site_id='c1111111-1111-4000-8000-000000000112' AND batch_number=current_setting('test.intake.batch'))=2;
END $$;
-- A foreign-site receiver cannot replay another site's accepted receipt.
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000088',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000088","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE blocked boolean:=false; BEGIN
 BEGIN PERFORM public.accept_verified_transfer(current_setting('test.intake.job1')::uuid); EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 ASSERT blocked,'Other-site receiver could access intake';
END $$;
ROLLBACK;
SELECT 'PASS: atomic stock intake, distinct shipments, idempotent retry, count and site gates' AS result;
