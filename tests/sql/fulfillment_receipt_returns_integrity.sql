-- Every fixture and mutation rolls back; uses authenticated claims and the real guards.
BEGIN;
DO $test$
DECLARE site public.sites%ROWTYPE; product public.products%ROWTYPE; receiver uuid; supervisor uuid;
 po uuid:=gen_random_uuid(); item uuid:=gen_random_uuid(); receipt uuid:=gen_random_uuid(); sale uuid:=gen_random_uuid(); sale_line uuid:=gen_random_uuid(); request uuid:=gen_random_uuid(); second_request uuid:=gen_random_uuid();
 jobs jsonb; lines jsonb; result jsonb; again jsonb; quantity numeric; blocked boolean; n integer; job_id uuid;
BEGIN
 SELECT s.* INTO site FROM public.sites s WHERE country='ET' AND type IN('Warehouse','Distribution Center')
 AND EXISTS(SELECT 1 FROM public.employees e WHERE e.site_id=s.id AND e.role='receiver' AND lower(e.status)='active')
 AND EXISTS(SELECT 1 FROM public.products p WHERE p.site_id=s.id AND p.sku IS NOT NULL) ORDER BY s.id LIMIT 1;
 SELECT id INTO receiver FROM public.employees WHERE site_id=site.id AND role='receiver' AND lower(status)='active' LIMIT 1;
 SELECT id INTO supervisor FROM public.employees WHERE role='group_ceo' AND lower(status)='active' LIMIT 1;
 SELECT * INTO product FROM public.products WHERE site_id=site.id AND sku IS NOT NULL LIMIT 1;
 IF site.id IS NULL OR receiver IS NULL OR supervisor IS NULL OR product.id IS NULL THEN RAISE EXCEPTION 'Missing staging fixtures'; END IF;
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 INSERT INTO public.purchase_orders(id,site_id,country_code,supplier_name,total_amount,items_count,status,currency) VALUES(po,site.id,'ET','Rollback receipt supplier',100,1,'Approved','ETB');
 INSERT INTO public.po_items(id,po_id,product_id,product_name,sku,quantity,unit_cost,total_cost,pack_quantity,case_size) VALUES(item,po,product.id,product.name,product.sku,10,10,100,1,1);
 INSERT INTO public.sales(id,site_id,country_code,currency,subtotal,tax,total,payment_method,status,fulfillment_status) VALUES(sale,site.id,'ET','ETB',100,0,90,'Cash','Completed','Delivered');
 INSERT INTO public.sale_items(id,sale_id,product_id,product_name,quantity,price) VALUES(sale_line,sale,product.id,product.name,10,10);
 jobs:=jsonb_build_array(jsonb_build_object('lineItems',jsonb_build_array(jsonb_build_object('productId',product.id,'sku',product.sku,'name',product.name,'expectedQty',3,'condition','Good'))));
 lines:=jsonb_build_array(jsonb_build_object('saleItemId',sale_line,'quantity',2,'reason','Rollback review','condition','New / Sealed','action','Restock'));
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',receiver,'role','authenticated')::text,true);EXECUTE 'SET LOCAL ROLE authenticated';
 result:=public.save_receiving_split(receipt,po,item,jobs,0);again:=public.save_receiving_split(receipt,po,item,jobs,0);
 IF result<>again THEN RAISE EXCEPTION 'Receipt retry created different work'; END IF;
 blocked:=false;BEGIN PERFORM public.save_receiving_split(gen_random_uuid(),po,item,jobs,0);EXCEPTION WHEN serialization_failure THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Stale intake accepted'; END IF;
 blocked:=false;BEGIN PERFORM public.return_sale_lookup('',site.id,'ET');EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Blank receipt matched'; END IF;
 result:=public.return_sale_lookup(sale::text,site.id,'ET');IF (result->'items'->0->>'quantity')::numeric<>10 THEN RAISE EXCEPTION 'Wrong return eligibility';END IF;
 result:=public.submit_fulfillment_return(request,sale,site.id,'ET',lines);again:=public.submit_fulfillment_return(request,sale,site.id,'ET',lines);
 IF result<>again OR (result->>'refundAmount')::numeric<>18 THEN RAISE EXCEPTION 'Return amount or retry wrong'; END IF;
 blocked:=false;BEGIN PERFORM public.decide_fulfillment_return(request,true,'Self review');EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Self review accepted'; END IF;
 blocked:=false;BEGIN PERFORM public.submit_fulfillment_return(second_request,sale,site.id,'KE',lines);EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Cross-border return accepted';END IF;
 result:=public.return_sale_lookup(sale::text,site.id,'ET');IF (result->'items'->0->>'quantity')::numeric<>8 THEN RAISE EXCEPTION 'Pending quantities not reserved';END IF;
 EXECUTE 'RESET ROLE';
 SELECT received_qty INTO quantity FROM public.po_items WHERE id=item;IF quantity<>3 THEN RAISE EXCEPTION 'Receipt count not committed exactly once';END IF;
 job_id:=(again->>'unused')::uuid;
 SELECT id INTO job_id FROM public.wms_jobs WHERE order_ref=po::text AND type='PUTAWAY';
 IF job_id IS NULL THEN RAISE EXCEPTION 'Missing putaway work';END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',supervisor,'role','authenticated')::text,true);EXECUTE 'SET LOCAL ROLE authenticated';
 result:=public.decide_fulfillment_return(request,true,'Independent inspection complete');again:=public.decide_fulfillment_return(request,true,'Independent inspection complete');
 IF result<>again OR result->>'status'<>'approved' THEN RAISE EXCEPTION 'Decision not idempotent';END IF;
 result:=public.maintain_fulfillment_jobs(site.id,'ET','reset',job_id);IF (result->>'changed')::int<>1 THEN RAISE EXCEPTION 'Unstarted reset failed';END IF;
 EXECUTE 'RESET ROLE';
 SELECT count(*) INTO n FROM public.inventory_requests WHERE adjustment_reason='RMA restock request '||request::text;
 IF n<>1 THEN RAISE EXCEPTION 'Restock request missing or duplicated';END IF;
 IF (SELECT stock FROM public.products WHERE id=product.id) IS DISTINCT FROM product.stock THEN RAISE EXCEPTION 'Return changed stock before approval';END IF;
 IF (SELECT status FROM public.sales WHERE id=sale)<>'Completed' THEN RAISE EXCEPTION 'Credit approval claimed financial settlement';END IF;
 blocked:=false;BEGIN UPDATE public.wms_jobs SET status='Completed',completed_by=supervisor::text,line_items=jsonb_build_array(jsonb_build_object('status','Completed','pickedQty',3,'location','A-01-01')) WHERE id=job_id;EXCEPTION WHEN raise_exception THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Putaway completed without placement evidence';END IF;
END $test$;
ROLLBACK;
