-- Real RLS, lot allocation and stock deduction; all fixture data rolls back.
BEGIN;
DO $test$
DECLARE s public.sites%ROWTYPE; base public.products%ROWTYPE; e public.employees%ROWTYPE;
 early uuid:=gen_random_uuid(); late uuid:=gen_random_uuid(); expired uuid:=gen_random_uuid(); undated uuid:=gen_random_uuid(); oldest uuid:=gen_random_uuid();
 first_job uuid:=gen_random_uuid(); second_job uuid:=gen_random_uuid(); blocked boolean; data jsonb; again jsonb; sku text:='ET-FEFO-'||substr(gen_random_uuid()::text,1,8);
 web uuid:=gen_random_uuid(); wearly uuid:=gen_random_uuid(); wlate uuid:=gen_random_uuid(); wjob uuid:=gen_random_uuid(); po uuid:=gen_random_uuid(); item uuid:=gen_random_uuid(); receipt uuid:=gen_random_uuid();
 line jsonb; proof text; n integer; target uuid; qty numeric; exp date; batch text; barcode text; v record;
BEGIN
 SELECT st.* INTO s FROM public.sites st WHERE st.country='ET' AND st.type IN('Warehouse','Distribution Center')
 AND EXISTS(SELECT 1 FROM public.employees WHERE site_id=st.id AND role='picker' AND lower(status)='active')
 AND EXISTS(SELECT 1 FROM public.products WHERE site_id=st.id) ORDER BY st.id LIMIT 1;
 SELECT * INTO e FROM public.employees WHERE site_id=s.id AND role='picker' AND lower(status)='active' LIMIT 1;
 SELECT * INTO base FROM public.products WHERE site_id=s.id LIMIT 1;
 -- Empty production warehouses use disposable stock and the existing CEO identity.
 -- This remains inside the rollback transaction and creates no employee accounts.
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 IF s.id IS NULL THEN SELECT * INTO s FROM public.sites WHERE country='ET' AND type IN('Warehouse','Distribution Center') ORDER BY id LIMIT 1; END IF;
 IF e.id IS NULL THEN SELECT * INTO e FROM public.employees WHERE role='group_ceo' AND lower(status)='active' LIMIT 1; END IF;
 IF base.id IS NULL THEN INSERT INTO public.products(name,sku,category,price,stock,status,location,site_id) VALUES('Rollback cooking oil',sku||'-BASE','Pantry',10,0,'active','On Order',s.id) RETURNING * INTO base; END IF;
 IF s.id IS NULL OR e.id IS NULL OR base.id IS NULL THEN RAISE EXCEPTION 'Missing warehouse regression fixture'; END IF;
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 FOR v IN SELECT * FROM (VALUES(early,'EARLY',2,current_date+1),(late,'LATE',5,current_date+5),(expired,'EXPIRED',50,current_date-1),(undated,'UNDATED',2,NULL::date),(oldest,'UNDATED-OLD',1,NULL::date))t(id,batch,stock,expiry) LOOP
  INSERT INTO public.products SELECT (jsonb_populate_record(NULL::public.products,to_jsonb(base)||jsonb_build_object('id',v.id,'sku',sku,'name','FEFO rollback cooking oil','stock',v.stock,'batch_number',v.batch,'expiry_date',v.expiry,'status','active','location','A-01-01','zone_id',NULL,'site_id',s.id,'received_on',CASE WHEN v.batch='UNDATED-OLD' THEN NULL ELSE current_date END,'created_at',CASE WHEN v.batch='UNDATED-OLD' THEN now()-interval '10 days' ELSE now() END,'barcode',sku))).*;
 END LOOP;
 INSERT INTO public.wms_jobs(id,site_id,country_code,type,status,priority,items_count,order_ref,assigned_to,line_items)
 VALUES(first_job,s.id,'ET','PICK','Pending','Normal',1,gen_random_uuid()::text,e.id::text,jsonb_build_array(jsonb_build_object('productId',late,'sku',sku,'name','Cooking oil','expectedQty',4,'pickedQty',0,'status','Pending')));
 SELECT line_items INTO data FROM public.wms_jobs WHERE id=first_job;
 IF jsonb_array_length(data)<>2 OR data->0->>'productId'<>early::text OR (data->0->>'expectedQty')::numeric<>2 OR data->1->>'productId'<>late::text OR (data->1->>'expectedQty')::numeric<>2 THEN RAISE EXCEPTION 'FEFO did not split earliest lots'; END IF;
 INSERT INTO public.job_assignments(job_id,employee_id,employee_name,status) VALUES(first_job,e.id,e.name,'Assigned');
 INSERT INTO public.wms_jobs(id,site_id,country_code,type,status,priority,items_count,order_ref,line_items)
 VALUES(second_job,s.id,'ET','PICK','Pending','Normal',1,gen_random_uuid()::text,jsonb_build_array(jsonb_build_object('productId',late,'sku',sku,'expectedQty',6,'pickedQty',0,'status','Pending')));
 SELECT line_items INTO again FROM public.wms_jobs WHERE id=second_job;
 IF jsonb_array_length(again)<>3 OR again->0->>'productId'<>late::text OR (again->0->>'expectedQty')::numeric<>3 OR again->1->>'productId'<>oldest::text OR again->2->>'productId'<>undated::text THEN RAISE EXCEPTION 'Reservation or undated-last allocation failed'; END IF;
 blocked:=false;BEGIN
 INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,items_count,order_ref,line_items) VALUES(s.id,'ET','PICK','Pending','Normal',1,gen_random_uuid()::text,jsonb_build_array(jsonb_build_object('sku',sku,'expectedQty',1)));
 EXCEPTION WHEN raise_exception THEN blocked:=SQLERRM LIKE '%Insufficient available unexpired stock%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'Reserved or expired stock allocated'; END IF;
 -- Simulate an older, untouched one-lot manifest; preparation must safely upgrade it.
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',(SELECT id FROM public.employees WHERE role='group_ceo' AND lower(status)='active' LIMIT 1),'role','service_role')::text,true);
 UPDATE public.wms_jobs SET line_items=jsonb_build_array(jsonb_build_object('productId',late,'sku',sku,'expectedQty',4,'pickedQty',0,'status','Pending')),items_count=1 WHERE id=first_job;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',e.id,'role','authenticated')::text,true);EXECUTE 'SET LOCAL ROLE authenticated';
 again:=public.prepare_fefo_pick(first_job);
 IF again->'line_items' IS DISTINCT FROM data THEN RAISE EXCEPTION 'Legacy preparation failed to rebuild the FEFO plan'; END IF;
 EXECUTE 'RESET ROLE';PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 blocked:=false;BEGIN UPDATE public.products SET stock=stock-1 WHERE id=early;EXCEPTION WHEN raise_exception THEN blocked:=SQLERRM LIKE '%reserved%';END;
 IF NOT blocked THEN RAISE EXCEPTION 'Another writer consumed reserved pick stock'; END IF;
 IF private.fefo_today(s.id) IS DISTINCT FROM (now() AT TIME ZONE 'Africa/Addis_Ababa')::date THEN RAISE EXCEPTION 'Expiry uses the wrong country date'; END IF;
 proof:=private.pick_location_barcode(CASE WHEN nullif(s.barcode_prefix,'') IS NULL THEN s.code WHEN length(s.barcode_prefix)=4 THEN 'SITE-'||s.barcode_prefix ELSE 'SITE-8888' END,'A-01-01');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',e.id,'role','authenticated')::text,true);EXECUTE 'SET LOCAL ROLE authenticated';
 blocked:=false;BEGIN PERFORM public.record_pick_line(first_job,0,2,proof,sku,NULL);EXCEPTION WHEN raise_exception THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Old RPC bypassed lot verification'; END IF;
 blocked:=false;BEGIN PERFORM public.verify_pick_lot_and_record(first_job,0,2,proof,sku,'LATE',current_date+1,true,NULL);EXCEPTION WHEN raise_exception THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Wrong batch in shared bin was accepted'; END IF;
 blocked:=false;BEGIN PERFORM public.verify_pick_lot_and_record(first_job,0,2,proof,sku,'EARLY',current_date+5,true,NULL);EXCEPTION WHEN raise_exception THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Wrong expiry accepted'; END IF;
 FOR n IN 0..1 LOOP
  line:=data->n;
  again:=public.verify_pick_lot_and_record(first_job,n,(line->>'expectedQty')::numeric,proof,sku,line->>'batchNumber',(line->>'expiryDate')::date,true,NULL);
 END LOOP;
 EXECUTE 'RESET ROLE';PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 UPDATE public.products SET expiry_date=current_date-1 WHERE id=early;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',e.id,'role','authenticated')::text,true);EXECUTE 'SET LOCAL ROLE authenticated';
 blocked:=false;BEGIN PERFORM public.complete_pick_job(first_job);EXCEPTION WHEN raise_exception THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Expired lot completed'; END IF;
 EXECUTE 'RESET ROLE';
 IF (SELECT stock FROM public.products WHERE id=early)<>2 THEN RAISE EXCEPTION 'Failed completion changed stock'; END IF;
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);UPDATE public.products SET expiry_date=current_date+1 WHERE id=early;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',e.id,'role','authenticated')::text,true);EXECUTE 'SET LOCAL ROLE authenticated';
 data:=public.complete_pick_job(first_job);again:=public.complete_pick_job(first_job);
 IF data<>again OR data->'job'->>'status'<>'Completed' THEN RAISE EXCEPTION 'Completion retry failed'; END IF;
 EXECUTE 'RESET ROLE';
 IF (SELECT stock FROM public.products WHERE id=early)<>0 OR (SELECT stock FROM public.products WHERE id=late)<>3 OR (SELECT stock FROM public.products WHERE id=expired)<>50 THEN RAISE EXCEPTION 'Wrong shared-bin lot quantity deducted'; END IF;

 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 FOR v IN SELECT * FROM (VALUES(wearly,'WEB-EARLY',2,current_date+1),(wlate,'WEB-LATE',5,current_date+5))t(id,batch,stock,expiry) LOOP
  INSERT INTO public.products SELECT (jsonb_populate_record(NULL::public.products,to_jsonb(base)||jsonb_build_object('id',v.id,'sku',sku||'-WEB','stock',v.stock,'batch_number',v.batch,'expiry_date',v.expiry,'status','active','location','A-01-01','zone_id',NULL,'site_id',s.id,'barcode',sku||'-WEB'))).*;
 END LOOP;
 INSERT INTO public.storefront_orders(id,order_number,site_id,country_code,currency,customer_name,customer_phone,fulfillment_method,payment_method,merchandise_subtotal)
 VALUES(web,'FEFO-'||web::text,s.id,'ET','ETB','Rollback customer','0700000000','pickup','cash_on_pickup',40);
 INSERT INTO public.storefront_stock_reservations(order_id,product_id,quantity) VALUES(web,wlate,4);
 INSERT INTO public.wms_jobs(id,site_id,country_code,type,status,priority,items_count,order_ref,assigned_to,line_items)
 VALUES(wjob,s.id,'ET','PICK','Pending','Normal',1,web::text,e.id::text,jsonb_build_array(jsonb_build_object('productId',wlate,'sku',sku||'-WEB','expectedQty',4,'pickedQty',0)));
 UPDATE public.storefront_orders SET status='accepted',pick_job_id=wjob WHERE id=web;
 INSERT INTO public.job_assignments(job_id,employee_id,employee_name,status) VALUES(wjob,e.id,e.name,'Assigned');
 IF NOT EXISTS(SELECT 1 FROM public.storefront_stock_reservations WHERE order_id=web AND product_id=wearly AND quantity=2) OR NOT EXISTS(SELECT 1 FROM public.storefront_stock_reservations WHERE order_id=web AND product_id=wlate AND quantity=2) THEN RAISE EXCEPTION 'Web reservations did not follow FEFO'; END IF;
 SELECT line_items INTO data FROM public.wms_jobs WHERE id=wjob;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',e.id,'role','authenticated')::text,true);EXECUTE 'SET LOCAL ROLE authenticated';
 FOR n IN 0..1 LOOP
  line:=data->n;
  again:=public.verify_pick_lot_and_record(wjob,n,(line->>'expectedQty')::numeric,proof,sku||'-WEB',line->>'batchNumber',(line->>'expiryDate')::date,true,NULL);
 END LOOP;
 again:=public.complete_pick_job(wjob);
 EXECUTE 'RESET ROLE';
 IF (SELECT stock FROM public.products WHERE id=wearly)<>0 OR (SELECT stock FROM public.products WHERE id=wlate)<>3 OR EXISTS(SELECT 1 FROM public.storefront_stock_reservations WHERE order_id=web AND released_at IS NULL) THEN RAISE EXCEPTION 'Web FEFO completion or reservation release failed'; END IF;
 -- Receipt audit now supplies the receiving day needed by same-day shared-bin matching.
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 INSERT INTO public.purchase_orders(id,site_id,country_code,supplier_name,total_amount,items_count,status,currency) VALUES(po,s.id,'ET','FEFO rollback supplier',100,1,'Approved','ETB');
 INSERT INTO public.po_items(id,po_id,product_id,product_name,sku,quantity,unit_cost,total_cost,pack_quantity,case_size) VALUES(item,po,base.id,base.name,base.sku,10,10,100,1,1);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',e.id,'role','authenticated')::text,true);EXECUTE 'SET LOCAL ROLE authenticated';
 data:=public.save_receiving_split(receipt,po,item,jsonb_build_array(jsonb_build_object('lineItems',jsonb_build_array(jsonb_build_object('productId',base.id,'sku',base.sku,'name',base.name,'expectedQty',1,'condition','Good')))),0);
 EXECUTE 'RESET ROLE';
 IF private.putaway_receiving_day((data->'jobIds'->>0)::uuid) IS NULL THEN RAISE EXCEPTION 'Receipt foundation did not establish the physical receiving day'; END IF;
 IF has_function_privilege('authenticated','private.record_verified_pick_line(uuid,integer,numeric,text,text,text)','EXECUTE') THEN RAISE EXCEPTION 'Verification implementation is exposed'; END IF;
END $test$;
ROLLBACK;
