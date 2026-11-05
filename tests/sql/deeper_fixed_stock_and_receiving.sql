BEGIN;
SET LOCAL statement_timeout='12s';
SELECT set_config('request.jwt.claim.sub','',true);SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE p public.products%ROWTYPE; product uuid:=gen_random_uuid(); po uuid:=gen_random_uuid(); item uuid:=gen_random_uuid(); BEGIN
 SELECT * INTO p FROM public.products WHERE id='dd450985-8a61-40c6-a1f6-7fe6723f0858';
 INSERT INTO public.products SELECT (jsonb_populate_record(NULL::public.products,to_jsonb(p)||jsonb_build_object('id',product,'sku','ET-AUDIT-'||product,'stock',10,'price',500,'status','active','approval_status','approved','batch_number','AUDIT','expiry_date',current_date+100))).*;
 INSERT INTO public.purchase_orders(id,site_id,country_code,supplier_name,total_amount,items_count,status,currency) VALUES(po,p.site_id,'ET','Audit supplier',370,1,'Approved','ETB');
 INSERT INTO public.po_items(id,po_id,product_id,product_name,sku,quantity,unit_cost,total_cost,pack_quantity,case_size) VALUES(item,po,product,'Audit cooking oil','ET-AUDIT-'||product,37,10,370,1,1);
 PERFORM set_config('test.stock.product',product::text,true);PERFORM set_config('test.stock.po',po::text,true);PERFORM set_config('test.stock.item',item::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000088',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000088","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE details jsonb; saved jsonb; request uuid:=gen_random_uuid(); BEGIN
 details:=public.purchase_order_items_safe(ARRAY[current_setting('test.stock.po')::uuid]);ASSERT jsonb_array_length(details)=1;ASSERT details->0->>'quantity' IS NULL;ASSERT details->0->>'unit_cost' IS NULL;ASSERT details->0->>'quantity_hidden'='true';ASSERT details->0->>'receipt_complete'='false';
 saved:=public.save_receiving_split(gen_random_uuid(),current_setting('test.stock.po')::uuid,current_setting('test.stock.item')::uuid,jsonb_build_array(jsonb_build_object('lineItems',jsonb_build_array(jsonb_build_object('productId',current_setting('test.stock.product'),'sku','ET-AUDIT-'||current_setting('test.stock.product'),'name','Audit cooking oil','expectedQty',5,'condition','Good')))),0);
 ASSERT saved->>'saved'='true','Blind receiver could not save physical count';
 INSERT INTO public.inventory_requests(id,product_id,product_name,product_sku,site_id,country_code,change_type,requested_by,requested_by_employee_id,status,adjustment_type,adjustment_qty,adjustment_reason)
 VALUES(request,current_setting('test.stock.product'),'Audit cooking oil','ET-AUDIT-'||current_setting('test.stock.product'),'c1111111-1111-4000-8000-000000000110','ET','stock_adjustment','Audit receiver',auth.uid(),'pending','IN',3,'Verified adjustment evidence');
 PERFORM set_config('test.stock.request',request::text,true);
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000083',true);SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000083","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE request uuid:=gen_random_uuid(); BEGIN
 INSERT INTO public.inventory_requests(id,product_id,product_name,product_sku,site_id,country_code,change_type,requested_by,requested_by_employee_id,status,proposed_changes,adjustment_qty)
 VALUES(request,gen_random_uuid()::text,'Audit reviewed cooking oil','ET-AUDIT-CATALOG-'||left(request::text,12),'c1111111-1111-4000-8000-000000000110','ET','create','Audit manager',auth.uid(),'pending',jsonb_build_object('name','Audit reviewed cooking oil','sku','ET-AUDIT-CATALOG-'||left(request::text,12),'price',500,'costPrice',100,'category','Food'),2);
 PERFORM set_config('test.stock.catalog',request::text,true);
END $$;
RESET ROLE;SELECT set_config('request.jwt.claim.sub','988fb8ef-8053-415b-9032-2aca981058d7',true);SELECT set_config('request.jwt.claims','{"sub":"988fb8ef-8053-415b-9032-2aca981058d7","role":"authenticated"}',true);SET LOCAL ROLE authenticated;
DO $$ DECLARE saved jsonb; product uuid; retry uuid; BEGIN
 saved:=public.apply_inventory_stock_request(current_setting('test.stock.request')::uuid);ASSERT saved->>'saved'='true';PERFORM public.apply_inventory_stock_request(current_setting('test.stock.request')::uuid);
 ASSERT (SELECT stock FROM public.products WHERE id=current_setting('test.stock.product')::uuid)=13,'Approved adjustment retry duplicated stock';
 product:=public.apply_inventory_catalog_request(current_setting('test.stock.catalog')::uuid);retry:=public.apply_inventory_catalog_request(current_setting('test.stock.catalog')::uuid);ASSERT product=retry;
 ASSERT coalesce(current_setting('siifmart.stock_command',true),'')='' AND coalesce(current_setting('siifmart.inventory_adjustment',true),'')='','Command authority leaked after return';
 ASSERT EXISTS(SELECT 1 FROM public.products WHERE id=product AND stock=0 AND price=500 AND approval_status='approved'),'Reviewed catalog identity or zero physical stock lost';
 ASSERT (SELECT count(*) FROM public.wms_jobs WHERE order_ref='CATALOG-'||current_setting('test.stock.catalog') AND type='PUTAWAY')=1,'Initial stock handoff missing or duplicated';
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: blind receipt remains usable, HQ adjustment and reviewed catalog/putaway are atomic and retry-safe; rolled back' result;
