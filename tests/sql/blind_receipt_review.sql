-- Real authenticated RPCs and triggers; every fixture and mutation rolls back.
BEGIN;
CREATE TEMP TABLE receipt_review_checks(name text);
GRANT INSERT ON receipt_review_checks TO authenticated;
DO $test$
DECLARE site public.sites%ROWTYPE; product public.products%ROWTYPE; receiver uuid; supervisor uuid; outsider uuid;
 po uuid:=gen_random_uuid(); item uuid:=gen_random_uuid(); receipt uuid:=gen_random_uuid(); damaged uuid:=gen_random_uuid();
 correction uuid:=gen_random_uuid(); job uuid; damage_job uuid; jobs jsonb; result jsonb; detail jsonb; blocked boolean;
BEGIN
 SELECT s.* INTO site FROM public.sites s WHERE country='ET' AND type IN('Warehouse','Distribution Center')
 AND EXISTS(SELECT 1 FROM public.employees e WHERE e.site_id=s.id AND e.role='receiver' AND lower(e.status)='active')
 AND EXISTS(SELECT 1 FROM public.employees e WHERE e.site_id=s.id AND e.role='warehouse_manager' AND lower(e.status)='active')
 AND EXISTS(SELECT 1 FROM public.products p WHERE p.site_id=s.id AND p.sku IS NOT NULL) ORDER BY s.id LIMIT 1;
 SELECT id INTO receiver FROM public.employees WHERE site_id=site.id AND role='receiver' AND lower(status)='active' LIMIT 1;
 SELECT id INTO supervisor FROM public.employees WHERE site_id=site.id AND role='warehouse_manager' AND lower(status)='active' LIMIT 1;
 SELECT e.id INTO outsider FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE s.country='KE' AND lower(e.status)='active' LIMIT 1;
 SELECT * INTO product FROM public.products WHERE site_id=site.id AND sku IS NOT NULL LIMIT 1;
 IF receiver IS NULL OR supervisor IS NULL OR outsider IS NULL OR product.id IS NULL THEN RAISE EXCEPTION 'Missing staging fixtures'; END IF;
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 INSERT INTO public.purchase_orders(id,site_id,country_code,supplier_name,total_amount,items_count,status,currency)
 VALUES(po,site.id,'ET','Rollback receipt review supplier',100,1,'Approved','ETB');
 INSERT INTO public.po_items(id,po_id,product_id,product_name,sku,quantity,unit_cost,total_cost,pack_quantity,case_size,
 custom_attributes) VALUES(item,po,product.id,product.name,product.sku,10,10,100,1,1,'{"storage":{"requirementsConfirmed":true,"isPerishable":false,"type":"Ambient"}}');
 jobs:=jsonb_build_array(jsonb_build_object('lineItems',jsonb_build_array(jsonb_build_object('productId',product.id,'sku',product.sku,'name',product.name,'expectedQty',3,'condition','Good'))));
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',receiver,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 result:=public.save_receiving_split(receipt,po,item,jobs,0); job:=(result->'jobIds'->>0)::uuid;
 IF result<>public.save_receiving_split(receipt,po,item,jobs,0) THEN RAISE EXCEPTION 'Idempotency failed'; END IF;
 detail:=public.blind_receipt_detail(receipt);
 IF detail ? 'expected_qty' OR detail ? 'previous_qty' OR (detail->>'can_review')::boolean OR (detail->>'physical_qty')::numeric<>3 THEN RAISE EXCEPTION 'Worker response leaked expectation or lost count'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(public.blind_receipt_queue_filtered(site.id,'ET')) q WHERE q->>'id'=receipt::text) THEN RAISE EXCEPTION 'Routine receipt entered exception queue'; END IF;
 blocked:=false;BEGIN PERFORM public.decide_blind_receipt(receipt,NULL,true,'Self review attempt');EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Self approval allowed'; END IF;
 INSERT INTO receipt_review_checks VALUES('original counter stays blind; self review denied; good partial intake is not an exception; retries deduplicate');
 jobs:=jsonb_set(jobs,'{0,lineItems,0,expectedQty}','1');jobs:=jsonb_set(jobs,'{0,lineItems,0,condition}','"Damaged"');
 result:=public.save_receiving_split(damaged,po,item,jobs,3); damage_job:=(result->'jobIds'->>0)::uuid;
 PERFORM public.request_blind_receipt_correction(correction,receipt,job,2,'Physical recount found two sealed units');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',supervisor,'role','authenticated')::text,true);
 detail:=public.blind_receipt_detail(receipt);
 IF (detail->>'expected_qty')::numeric<>10 OR NOT (detail->>'can_review')::boolean THEN RAISE EXCEPTION 'Manager comparison unavailable'; END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.blind_receipt_queue_filtered(site.id,'ET')) q WHERE q->>'id'=damaged::text) THEN RAISE EXCEPTION 'Damage exception missing'; END IF;
 blocked:=false;BEGIN UPDATE public.wms_jobs SET status='In-Progress' WHERE id=job; EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%Independent receiving review%' THEN RAISE; END IF; blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Pending correction did not hold handling'; END IF;
 PERFORM public.decide_blind_receipt(receipt,correction,true,'Independent recount evidence verified');
 EXECUTE 'RESET ROLE';
 IF (SELECT received_qty FROM public.po_items WHERE id=item)<>3 OR (SELECT (line_items->0->>'expectedQty')::numeric FROM public.wms_jobs WHERE id=job)<>2 THEN RAISE EXCEPTION 'Reviewed downward correction was not atomic'; END IF;
 IF (SELECT physical_qty FROM private.blind_receipt_counts WHERE id=receipt)<>3 THEN RAISE EXCEPTION 'Original snapshot overwritten'; END IF;
 EXECUTE 'SET LOCAL ROLE authenticated';
 -- Normal corrected goods proceed without a separate acknowledgment for every product.
 BEGIN
 UPDATE public.wms_jobs SET status='In-Progress' WHERE id=job;
 IF NOT FOUND THEN RAISE EXCEPTION 'Normal receipt unavailable'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',receiver,'role','authenticated')::text,true);
 blocked:=false;BEGIN PERFORM public.request_blind_receipt_correction(gen_random_uuid(),receipt,job,1,'Attempt after handling begins');EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%unstarted putaway%' THEN RAISE; END IF;blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Post-start correction allowed'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',supervisor,'role','authenticated')::text,true);
 RAISE SQLSTATE 'P1234' USING MESSAGE='Rollback normal start after proving success';
 EXCEPTION WHEN SQLSTATE 'P1234' THEN NULL; END;
 blocked:=false;BEGIN UPDATE public.wms_jobs SET line_items=jsonb_set(line_items,'{0,expectedQty}','9') WHERE id=job; EXCEPTION WHEN raise_exception THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Direct count tampering allowed'; END IF;
 blocked:=false;BEGIN UPDATE public.wms_jobs SET status='In-Progress' WHERE id=damage_job;EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE '%Independent receiving review%' THEN RAISE; END IF;blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Damage exception did not hold handling'; END IF;
 PERFORM public.decide_blind_receipt(damaged,NULL,true,'Damaged goods reviewed and segregated for quality disposition');
 INSERT INTO receipt_review_checks VALUES('independent manager sees comparison; correction preserves original and adjusts pending count; clean goods proceed without routine approval; damage held for review; tampering denied');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',outsider,'role','authenticated')::text,true);
 blocked:=false;BEGIN PERFORM public.blind_receipt_detail(receipt);EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Cross-country detail allowed'; END IF;
 blocked:=false;BEGIN PERFORM public.blind_receipt_queue_filtered(site.id,'ET');EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Cross-country queue allowed'; END IF;
 EXECUTE 'RESET ROLE';
 blocked:=false;BEGIN UPDATE private.blind_receipt_counts SET physical_qty=9 WHERE id=receipt;EXCEPTION WHEN raise_exception THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Immutable snapshot changed'; END IF;
 -- Explicit delivery concerns enter the queue without revealing order counts to the worker.
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',receiver,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 PERFORM public.report_blind_receipt_issue(receipt,'Driver says delivery is complete; one pallet appears missing');
 detail:=public.blind_receipt_detail(receipt);
 IF detail ? 'expected_qty' OR detail->>'issue' IS NULL THEN RAISE EXCEPTION 'Delivery issue leaked expectations or was not saved'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',supervisor,'role','authenticated')::text,true);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.blind_receipt_queue_filtered(site.id,'ET')) q WHERE q->>'id'=receipt::text) THEN RAISE EXCEPTION 'Reported issue missing from exceptions'; END IF;
 EXECUTE 'RESET ROLE';
 INSERT INTO receipt_review_checks VALUES('cross-country access denied; immutable evidence protected');
 INSERT INTO receipt_review_checks VALUES('worker delivery issue enters manager exception queue without revealing expected count');
END; $test$;
SELECT * FROM receipt_review_checks;
ROLLBACK;
