BEGIN;
SET LOCAL statement_timeout='8s';
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE source public.products%ROWTYPE; catalog public.products%ROWTYPE; source_id uuid:=gen_random_uuid(); catalog_id uuid:=gen_random_uuid(); sku text:='ET-AUDIT-'||gen_random_uuid(); BEGIN
 SELECT * INTO source FROM public.products WHERE id='dd450985-8a61-40c6-a1f6-7fe6723f0858';
 SELECT * INTO catalog FROM public.products WHERE id='0bfe7446-613b-42c3-8f66-5a1d80ae1d0e';
 INSERT INTO public.products SELECT (jsonb_populate_record(NULL::public.products,to_jsonb(source)||jsonb_build_object('id',source_id,'sku',sku,'stock',5,'price',500,'status','active','approval_status','approved','batch_number','AUDIT','expiry_date',current_date+100))).*;
 INSERT INTO public.products SELECT (jsonb_populate_record(NULL::public.products,to_jsonb(catalog)||jsonb_build_object('id',catalog_id,'sku',sku,'stock',5,'price',500,'status','active','approval_status','approved','batch_number','AUDIT','expiry_date',current_date+100))).*;
 PERFORM set_config('test.release.source',source_id::text,true);PERFORM set_config('test.release.catalog',catalog_id::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000095',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000095","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE sale jsonb; BEGIN
 sale:=public.create_pos_sale_atomic(jsonb_build_object('id',gen_random_uuid(),'site_id','c1111111-1111-4000-8000-000000000112','payment_method','Cash','amount_tendered',100000,'type','Delivery'),
 jsonb_build_array(jsonb_build_object('product_id',current_setting('test.release.catalog'),'quantity',1)));
 PERFORM set_config('test.release.sale',sale->>'id',true);
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
UPDATE public.sales SET release_status='PENDING' WHERE id=current_setting('test.release.sale')::uuid;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000083',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000083","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE first jsonb; retry jsonb; sale uuid:=current_setting('test.release.sale')::uuid; BEGIN
 first:=public.release_sale_to_picking(sale,'c1111111-1111-4000-8000-000000000110');
 retry:=public.release_sale_to_picking(sale,'c1111111-1111-4000-8000-000000000110');
 ASSERT first=retry,'Release retry created another handoff';
 ASSERT EXISTS(SELECT 1 FROM public.sales WHERE id=sale AND fulfillment_status='Picking' AND release_status='RELEASED'),'Release falsely marked delivery';
 ASSERT (SELECT count(*) FROM public.wms_jobs WHERE order_ref=sale::text AND type='PICK')=1,'Missing or duplicate pick';
 ASSERT EXISTS(SELECT 1 FROM public.wms_jobs WHERE id=(first->>'jobId')::uuid AND line_items->0->>'productId'=current_setting('test.release.source') AND line_items->0->>'fefoAllocated'='true'),'Source FEFO lot missing';
 ASSERT NOT EXISTS(SELECT 1 FROM public.wms_jobs WHERE order_ref=sale::text AND type='PACK'),'Unverified picking created premature packing';
END $$;
ROLLBACK;
SELECT 'PASS: order release creates one FEFO PICK, remains Picking and is retry-safe; rolled back' result;
