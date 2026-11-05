-- Investigation only: observations are not assertions that unsafe behavior is correct.
-- Synthetic fixtures and every mutation roll back. Run on staging only.
BEGIN;
SET LOCAL statement_timeout='12s';
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE p public.products%ROWTYPE; product uuid:=gen_random_uuid(); sale uuid:=gen_random_uuid(); foreign_sale uuid:=gen_random_uuid(); po uuid:=gen_random_uuid(); BEGIN
 SELECT * INTO p FROM public.products WHERE id='dd450985-8a61-40c6-a1f6-7fe6723f0858';
 INSERT INTO public.products SELECT (jsonb_populate_record(NULL::public.products,to_jsonb(p)||jsonb_build_object('id',product,'sku','ET-AUDIT-'||product,'stock',10,'price',500,'status','active','approval_status','approved','batch_number','AUDIT','expiry_date',current_date+100))).*;
 INSERT INTO public.sales(id,site_id,country_code,currency,subtotal,tax,total,payment_method,status,fulfillment_status)
 VALUES(sale,'c1111111-1111-4000-8000-000000000110','ET','ETB',500,0,500,'Card','Completed','Picking'),
 (foreign_sale,'c1111111-1111-4000-8000-000000000112','ET','ETB',500,0,500,'Card','Completed','Picking');
 INSERT INTO public.sale_items(sale_id,product_id,product_name,quantity,price) VALUES(sale,product,'Audit cooking oil',1,500);
 INSERT INTO public.purchase_orders(id,site_id,country_code,supplier_name,total_amount,items_count,status,currency)
 VALUES(po,'c1111111-1111-4000-8000-000000000110','ET','Audit supplier',500,1,'Approved','ETB');
 INSERT INTO public.po_items(po_id,product_id,product_name,sku,quantity,unit_cost,total_cost,pack_quantity,case_size)
 VALUES(po,product,'Audit cooking oil','ET-AUDIT-'||product,37,10,370,1,1);
 PERFORM set_config('test.deeper.product',product::text,true);PERFORM set_config('test.deeper.sale',sale::text,true);
 PERFORM set_config('test.deeper.foreign_sale',foreign_sale::text,true);PERFORM set_config('test.deeper.po',po::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000088',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000088","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE results jsonb:='{}'; saved jsonb; source public.products%ROWTYPE; placeholder uuid:=gen_random_uuid(); n integer; BEGIN
 SELECT count(*) INTO n FROM public.sales WHERE id=current_setting('test.deeper.foreign_sale')::uuid;
 results:=results||jsonb_build_object('receiver_reads_other_site_sale',n=1);
 SELECT count(*) INTO n FROM public.po_items WHERE po_id=current_setting('test.deeper.po')::uuid AND quantity=37;
 results:=results||jsonb_build_object('receiver_reads_expected_po_quantity',n=1);
 BEGIN
  SELECT * INTO source FROM public.products WHERE id=current_setting('test.deeper.product')::uuid;
  INSERT INTO public.products SELECT (jsonb_populate_record(NULL::public.products,to_jsonb(source)||jsonb_build_object('id',placeholder,'sku','ET-AUDIT-'||placeholder,'stock',0,'price',1,'location','On Order','approval_status','approved','approved_by',NULL,'rejected_by',NULL))).*;
  results:=results||jsonb_build_object('receiver_publishes_unreviewed_price',EXISTS(SELECT 1 FROM public.products WHERE id=placeholder AND price=1 AND approval_status='approved'));
 EXCEPTION WHEN OTHERS THEN results:=results||jsonb_build_object('receiver_publishes_unreviewed_price',SQLERRM);END;
 BEGIN
  saved:=public.create_pos_sale_atomic(jsonb_build_object('id',gen_random_uuid(),'site_id','c1111111-1111-4000-8000-000000000110','payment_method','Card','type','Delivery'),jsonb_build_array(jsonb_build_object('product_id',current_setting('test.deeper.product'),'quantity',1)));
  results:=results||jsonb_build_object('receiver_creates_completed_card_sale_without_counter',saved->>'status'='Completed' AND saved->>'shift_id' IS NULL);
 EXCEPTION WHEN OTHERS THEN results:=results||jsonb_build_object('receiver_creates_completed_card_sale_without_counter',SQLERRM);END;
 BEGIN
  saved:=public.create_pos_sale_atomic(jsonb_build_object('id',gen_random_uuid(),'site_id','c1111111-1111-4000-8000-000000000110','payment_method','Mobile Money','type','Delivery'),jsonb_build_array(jsonb_build_object('product_id',current_setting('test.deeper.product'),'quantity',1)));
  results:=results||jsonb_build_object('mobile_sale_without_transaction_reference',saved->>'status'='Completed' AND saved->>'mobile_transaction_ref' IS NULL);
 EXCEPTION WHEN OTHERS THEN results:=results||jsonb_build_object('mobile_sale_without_transaction_reference',SQLERRM);END;
 PERFORM set_config('test.deeper.results',results::text,true);
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000083',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000083","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE results jsonb:=current_setting('test.deeper.results')::jsonb; n integer; BEGIN
 BEGIN
  UPDATE public.products SET stock=stock+999 WHERE id=current_setting('test.deeper.product')::uuid;
  GET DIAGNOSTICS n=ROW_COUNT;results:=results||jsonb_build_object('manager_changes_stock_without_request',n=1);
 EXCEPTION WHEN OTHERS THEN results:=results||jsonb_build_object('manager_changes_stock_without_request',SQLERRM);END;
 BEGIN
  UPDATE public.sales SET fulfillment_status='Delivered',release_status='RELEASED' WHERE id=current_setting('test.deeper.sale')::uuid;
  GET DIAGNOSTICS n=ROW_COUNT;results:=results||jsonb_build_object('manager_marks_delivery_without_warehouse_work',n=1);
 EXCEPTION WHEN OTHERS THEN results:=results||jsonb_build_object('manager_marks_delivery_without_warehouse_work',SQLERRM);END;
 BEGIN
  UPDATE public.sales SET status='Refunded' WHERE id=current_setting('test.deeper.sale')::uuid;
  GET DIAGNOSTICS n=ROW_COUNT;results:=results||jsonb_build_object('warehouse_manager_marks_sale_refunded',n=1);
 EXCEPTION WHEN OTHERS THEN results:=results||jsonb_build_object('warehouse_manager_marks_sale_refunded',SQLERRM);END;
 PERFORM set_config('test.deeper.results',results::text,true);
END $$;
RESET ROLE;
SELECT current_setting('test.deeper.results')::jsonb AS observations;
ROLLBACK;
