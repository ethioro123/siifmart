-- Receipt dates, lot identity, shared-bin placement and isolation; all changes roll back.
BEGIN;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$
DECLARE worker public.employees%ROWTYPE; receiver uuid; supervisor uuid; outsider uuid; po uuid:=gen_random_uuid(); item uuid:=gen_random_uuid(); src uuid:=gen_random_uuid();
 job uuid; ids uuid[]:='{}'; fixture_sku text:='ETDAYTEST'||replace(gen_random_uuid()::text,'-',''); zone uuid;
 n integer; result jsonb; first_product uuid; second_product uuid; blocked boolean;
BEGIN
 SELECT * INTO worker FROM public.employees WHERE role='packer' AND site_id='a1111111-1111-4000-8000-000000000001' AND lower(status)='active' LIMIT 1;
 SELECT id INTO receiver FROM public.employees WHERE role='receiver' AND site_id=worker.site_id AND lower(status)='active' LIMIT 1;
 SELECT id INTO supervisor FROM public.employees WHERE role='group_ceo' AND lower(status)='active' LIMIT 1;
 SELECT e.id INTO outsider FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE s.country='KE' AND lower(e.status)='active' LIMIT 1;
 ASSERT worker.id IS NOT NULL AND receiver IS NOT NULL AND supervisor IS NOT NULL AND outsider IS NOT NULL;
 INSERT INTO public.warehouse_zones(site_id,name,type,capacity,occupied,is_locked,allow_putaway) VALUES(worker.site_id,'Zone Z','Dry',1000,0,false,true) RETURNING id INTO zone;
 INSERT INTO public.products(id,site_id,name,sku,category,stock,price,status,location,approval_status) VALUES(src,worker.site_id,'Same day regression',fixture_sku,'General',0,10,'active','On Order','approved');
 INSERT INTO public.purchase_orders(id,site_id,country_code,supplier_name,total_amount,items_count,status,currency) VALUES(po,worker.site_id,'ET','Rollback supplier',100,1,'Approved','ETB');
 INSERT INTO public.po_items(id,po_id,product_id,product_name,sku,quantity,unit_cost,total_cost,received_qty,pack_quantity,case_size) VALUES(item,po,src,'Same day regression',fixture_sku,100,1,100,20,1,1);
 FOR n IN 1..4 LOOP
  job:=gen_random_uuid();ids:=array_append(ids,job);
  INSERT INTO public.wms_jobs(id,site_id,country_code,type,status,priority,order_ref,assigned_to,items_count,line_items)
  VALUES(job,worker.site_id,'ET','PUTAWAY','In-Progress','Normal',po::text,worker.id::text,1,
  jsonb_build_array(jsonb_build_object('productId',src,'sku',fixture_sku,'name','Same day regression','expectedQty',5,'status','Pending','batchNumber','BATCH-'||n,'expiryDate',CASE WHEN n=2 THEN '2031-01-01' ELSE '2030-01-01' END)));
  INSERT INTO public.job_assignments(job_id,employee_id,employee_name) VALUES(job,worker.id,worker.name);
  INSERT INTO private.fulfillment_receipts(id,po_id,item_id,employee_id,fingerprint,job_ids,created_at)
  VALUES(gen_random_uuid(),po,item,receiver,'same-day-'||n,ARRAY[job],CASE WHEN n=1 THEN '2026-11-04 21:05+00'::timestamptz WHEN n=2 THEN '2026-11-05 20:55+00'::timestamptz ELSE '2026-11-05 21:05+00'::timestamptz END);
 END LOOP;
 PERFORM set_config('request.jwt.claim.sub',worker.id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',worker.id,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 ASSERT public.putaway_receiving_day(ids[1])=DATE '2026-11-05';
 ASSERT public.putaway_receiving_day(ids[2])=DATE '2026-11-05';
 ASSERT public.putaway_receiving_day(ids[3])=DATE '2026-11-06','Use local midnight, not UTC date';
 result:=public.place_putaway_stock(ids[1],0,5,'Z-98-98');first_product:=(result->>'product_id')::uuid;
 result:=public.place_putaway_stock(ids[2],0,5,'Z-98-98');second_product:=(result->>'product_id')::uuid;
 ASSERT first_product<>second_product,'Different batches must retain separate identities';
 ASSERT (SELECT count(*) FROM public.products WHERE site_id=worker.site_id AND products.sku=fixture_sku AND location='Z-98-98')=2;
 ASSERT (SELECT stock FROM public.products WHERE id=first_product)=5 AND (SELECT stock FROM public.products WHERE id=second_product)=5;
 blocked:=false;BEGIN PERFORM public.place_putaway_stock(ids[3],0,5,'Z-98-98');EXCEPTION WHEN SQLSTATE 'P0001' THEN blocked:=true;END;
 ASSERT blocked,'Next-day batch must not join this bin';
 blocked:=false;BEGIN UPDATE public.products SET received_on=DATE '2026-11-06' WHERE id=first_product;EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 -- An RLS-denied UPDATE may affect zero rows rather than raise.
 EXECUTE 'RESET ROLE';
 ASSERT (SELECT received_on FROM public.products WHERE id=first_product)=DATE '2026-11-05','Client may not alter receiving-day provenance';
 EXECUTE 'RESET ROLE';
 ASSERT (SELECT count(*) FROM public.stock_movements WHERE product_id IN(first_product,second_product))=2;
 ASSERT (SELECT batch_number FROM public.products WHERE id=first_product)='BATCH-1';
 ASSERT (SELECT batch_number FROM public.products WHERE id=second_product)='BATCH-2';
 ASSERT (SELECT expiry_date FROM public.products WHERE id=second_product)=DATE '2031-01-01','Shared bins must preserve separate expiry evidence';
 ASSERT (SELECT count(DISTINCT batch_number) FROM public.stock_movements WHERE product_id IN(first_product,second_product))=2;
 PERFORM set_config('request.jwt.claim.sub',supervisor::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',supervisor,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 blocked:=false;BEGIN UPDATE public.products SET received_on=DATE '2026-11-06' WHERE id=first_product;EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 ASSERT blocked,'Even supervisors must not edit the server receiving date';
 PERFORM set_config('request.jwt.claim.sub',outsider::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',outsider,'role','authenticated')::text,true);
 blocked:=false;BEGIN PERFORM public.putaway_receiving_day(ids[1]);EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 ASSERT blocked,'Receiving-day lookup must not cross countries';
 EXECUTE 'RESET ROLE';
 ASSERT NOT has_function_privilege('anon','public.putaway_receiving_day(uuid)','EXECUTE');
END $$;
ROLLBACK;
