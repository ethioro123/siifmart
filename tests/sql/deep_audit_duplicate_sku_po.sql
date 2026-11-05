-- Rollback-only: two distinct PO lines of the same SKU, each with explicit receipt-line identity.
BEGIN;
SET LOCAL statement_timeout='5s';
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE po uuid:=gen_random_uuid(); item uuid; job uuid; site uuid:='c1111111-1111-4000-8000-000000000110';
 product public.products%ROWTYPE; supervisor uuid; n integer; BEGIN
 SELECT * INTO STRICT product FROM public.products WHERE id='dd450985-8a61-40c6-a1f6-7fe6723f0858';
 SELECT id INTO supervisor FROM public.employees WHERE site_id=site AND role='warehouse_manager' AND lower(status)='active' LIMIT 1;
 INSERT INTO public.purchase_orders(id,site_id,country_code,supplier_name,total_amount,items_count,status,currency)
 VALUES(po,site,'ET','Audit duplicate-line supplier',100,2,'Partially Received','ETB');
 INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,items_count,order_ref,line_items)
 VALUES(site,'ET','RECEIVE','Completed','Normal',2,po::text,'[]');
 FOR n IN 1..2 LOOP
  item:=gen_random_uuid();job:=gen_random_uuid();
  INSERT INTO public.po_items(id,po_id,product_id,product_name,sku,quantity,unit_cost,total_cost,pack_quantity,received_qty,custom_attributes)
  VALUES(item,po,NULL,product.name,product.sku,5,10,50,1,5,'{"storage":{"requirementsConfirmed":true,"isPerishable":false,"type":"Ambient"}}');
  INSERT INTO public.wms_jobs(id,site_id,country_code,type,status,priority,items_count,order_ref,job_number,line_items)
  VALUES(job,site,'ET','PUTAWAY','Completed','Normal',1,po::text,'AUDIT-'||job,
   jsonb_build_array(jsonb_build_object('productId',product.id,'poItemId',item,'sku',product.sku,'expectedQty',5,'pickedQty',5,'status','Completed','condition','Good','location','A-01-01')));
  INSERT INTO public.stock_movements(site_id,product_id,product_name,type,quantity,movement_date,performed_by,reason)
  VALUES(site,product.id,product.name,'IN',5,now(),'Audit','Putaway job AUDIT-'||job||' line 1 to A-01-01');
  PERFORM set_config('test.duplicate.job',job::text,true);
 END LOOP;
 PERFORM set_config('request.jwt.claim.sub',supervisor::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',supervisor,'role','authenticated')::text,true);
END $$;
SET LOCAL ROLE authenticated;
DO $$ DECLARE result jsonb; BEGIN
 result:=public.finalize_po_from_putaway(current_setting('test.duplicate.job')::uuid);
 ASSERT result->>'state'='needs_review','Reproduction changed: explicit PO line identities now reconcile';
END $$;
ROLLBACK;
SELECT 'CONFIRMED: same SKU on two PO lines requires review despite explicit poItemId and matching placement evidence; rolled back' AS result;
