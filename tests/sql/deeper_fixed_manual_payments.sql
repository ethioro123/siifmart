BEGIN;
SET LOCAL statement_timeout='10s';
SELECT set_config('request.jwt.claim.sub','',true);SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE p public.products%ROWTYPE; product uuid:=gen_random_uuid(); BEGIN
 SELECT * INTO p FROM public.products WHERE id='0bfe7446-613b-42c3-8f66-5a1d80ae1d0e';
 INSERT INTO public.products SELECT (jsonb_populate_record(NULL::public.products,to_jsonb(p)||jsonb_build_object('id',product,'sku','ET-AUDIT-'||product,'stock',50,'price',500,'sale_price',NULL,'is_on_sale',false,'status','active','approval_status','approved','batch_number','AUDIT','expiry_date',current_date+100))).*;
 PERFORM set_config('test.manual.product',product::text,true);PERFORM set_config('test.manual.sale',gen_random_uuid()::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000095',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000095","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE sale jsonb; retry jsonb; payload jsonb; items jsonb; blocked boolean:=false; BEGIN
 payload:=jsonb_build_object('id',current_setting('test.manual.sale'),'site_id','c1111111-1111-4000-8000-000000000112','payment_method','Mobile Money','type','In-Store');
 items:=jsonb_build_array(jsonb_build_object('product_id',current_setting('test.manual.product'),'quantity',1));
 BEGIN PERFORM public.create_pos_sale_atomic(payload,items);EXCEPTION WHEN raise_exception THEN blocked:=SQLERRM LIKE 'Actual payment reference%';END;ASSERT blocked,'Missing payment evidence accepted';
 payload:=payload||jsonb_build_object('mobile_payment_channel','TELEBIRR','mobile_transaction_ref','AUDIT-'||gen_random_uuid());
 blocked:=false;BEGIN PERFORM public.create_pos_sale_atomic(payload,items);EXCEPTION WHEN raise_exception THEN blocked:=SQLERRM LIKE 'Actual payment reference%';END;ASSERT blocked,'Missing manual confirmation accepted';
 payload:=payload||'{"manual_payment_verified":true}';
 sale:=public.create_pos_sale_atomic(payload,items);retry:=public.create_pos_sale_atomic(payload,items);
 ASSERT sale->>'id'=retry->>'id';ASSERT sale->>'manual_payment_verified_by'=auth.uid()::text;ASSERT sale->>'shift_id' IS NOT NULL;
 blocked:=false;BEGIN PERFORM public.create_pos_sale_atomic(payload||jsonb_build_object('id',gen_random_uuid()),items);EXCEPTION WHEN unique_violation THEN blocked:=true;END;ASSERT blocked,'Payment reference reused';
 blocked:=false;BEGIN UPDATE public.sales SET manual_payment_verified_by=NULL WHERE id=(sale->>'id')::uuid;EXCEPTION WHEN raise_exception THEN blocked:=true;END;ASSERT blocked,'Saved manual attestation edited';
 ASSERT coalesce(current_setting('siifmart.manual_payment_confirmed',true),'')='','Manual attestation context leaked after return';
 ASSERT (SELECT stock FROM public.products WHERE id=current_setting('test.manual.product')::uuid)=49,'Sale retry duplicated stock posting';
END $$;
RESET ROLE;
DO $$ BEGIN ASSERT (SELECT count(*) FROM private.manual_sale_payments WHERE sale_id=current_setting('test.manual.sale')::uuid)=1; END $$;
ROLLBACK;
SELECT 'PASS: manual reference, cashier attestation, duplicate denial and atomic sale retry; rolled back, no payment provider contacted' result;
