BEGIN;
CREATE TEMP TABLE lifecycle_cancellation_results(test text);
DO $$
DECLARE buyer public.employees%ROWTYPE; requester public.employees%ROWTYPE; proc public.employees%ROWTYPE; logistics public.employees%ROWTYPE;
 compliance_a public.employees%ROWTYPE; compliance_b public.employees%ROWTYPE;
 source uuid; destination uuid; po uuid:=gen_random_uuid(); po_with_receipt uuid:=gen_random_uuid(); transfer_id uuid:=gen_random_uuid(); job uuid:=gen_random_uuid();
 req uuid; held uuid; result jsonb;
BEGIN
 SELECT e.* INTO requester FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='regional_operations_manager' AND e.status='Active' AND s.country='ET' ORDER BY e.id LIMIT 1;
 SELECT e.* INTO proc FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='regional_procurement_manager' AND e.region_code=requester.region_code AND e.status='Active' AND s.country='ET' LIMIT 1;
 SELECT e.* INTO logistics FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='regional_logistics_manager' AND e.region_code=requester.region_code AND e.status='Active' AND s.country='ET' LIMIT 1;
 SELECT e.* INTO compliance_a FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='country_compliance_manager' AND e.status='Active' AND s.country='ET' LIMIT 1;
 SELECT e.* INTO compliance_b FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='regional_compliance_manager' AND e.region_code=requester.region_code AND e.status='Active' AND s.country='ET' LIMIT 1;
 SELECT id INTO source FROM public.sites WHERE country='ET' AND region_code=requester.region_code AND type IN ('Warehouse','Distribution Center') AND status='Active' ORDER BY id LIMIT 1;
 SELECT id INTO destination FROM public.sites WHERE country='ET' AND region_code=requester.region_code AND id<>source AND status='Active' ORDER BY id LIMIT 1;
 IF requester.id IS NULL OR proc.id IS NULL OR logistics.id IS NULL OR compliance_a.id IS NULL OR compliance_b.id IS NULL OR source IS NULL OR destination IS NULL THEN RAISE EXCEPTION 'Staging cancellation test actors are missing'; END IF;
 PERFORM set_config('request.jwt.claim.sub','',true);
 INSERT INTO public.purchase_orders(id,supplier_name,total_amount,items_count,status,site_id,country_code,region_code,created_by,requested_by)
 VALUES(po,'Lifecycle rollback supplier',100,1,'Draft',source,'ET',requester.region_code,requester.name,requester.name),
       (po_with_receipt,'Lifecycle rollback supplier',100,1,'Draft',source,'ET',requester.region_code,requester.name,requester.name);
 INSERT INTO public.transfers(id,source_site_id,dest_site_id,status,items,country_code,source_region_code,dest_region_code,requested_by,order_ref)
 VALUES(transfer_id,source,destination,'Requested','[]','ET',requester.region_code,requester.region_code,requester.name,'LC-'||transfer_id::text);
 PERFORM set_config('request.jwt.claim.sub',requester.id::text,true);
 INSERT INTO public.wms_jobs(id,type,priority,items_count,status,site_id,source_site_id,dest_site_id,country_code,requested_by,transfer_status,line_items)
 VALUES(job,'TRANSFER','Normal',0,'Pending',source,source,destination,'ET',requester.name,'Draft','[]');
 PERFORM set_config('request.jwt.claim.sub',requester.id::text,true);
 req:=public.request_record_lifecycle('purchase_order',po,'Cancel the unexecuted regression purchase order','{}');
 BEGIN
   PERFORM set_config('role','authenticated',true);
   UPDATE public.record_lifecycle_requests SET reason='Attempted request tampering' WHERE id=req;
   RAISE EXCEPTION 'Unexpected client request mutation';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 INSERT INTO lifecycle_cancellation_results VALUES('client request evidence mutation denied');
 PERFORM set_config('role','authenticated',true);
 IF NOT EXISTS(SELECT 1 FROM public.record_lifecycle_requests WHERE id=req) THEN RAISE EXCEPTION 'Requester cannot read saved request'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.record_lifecycle_events WHERE request_id=req) THEN RAISE EXCEPTION 'Requester cannot read audit evidence'; END IF;
 PERFORM set_config('role','postgres',true);
 INSERT INTO lifecycle_cancellation_results VALUES('requester reads scoped request and event under RLS');
 PERFORM set_config('request.jwt.claim.sub',compliance_a.id::text,true);
 held:=public.set_record_lifecycle_hold('purchase_order',po,'Preserve this record during an open investigation',false);
 BEGIN
   PERFORM public.set_record_lifecycle_hold('purchase_order',po,'The same reviewer must not release their own hold',true);
   RAISE EXCEPTION 'Unexpected self-release';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%different compliance reviewer%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_cancellation_results VALUES('self-release of investigation hold denied');
 PERFORM set_config('request.jwt.claim.sub',proc.id::text,true);
 BEGIN
   PERFORM public.decide_record_lifecycle(req,true,'Procurement reviewed the cancellation evidence');
   RAISE EXCEPTION 'Unexpected action under hold';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%active investigation hold%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_cancellation_results VALUES('investigation hold blocks application');
 PERFORM set_config('request.jwt.claim.sub',compliance_b.id::text,true);
 PERFORM public.set_record_lifecycle_hold('purchase_order',po,'Independent compliance confirms investigation release',true);
 PERFORM set_config('request.jwt.claim.sub',proc.id::text,true);
 result:=public.decide_record_lifecycle(req,true,'Procurement verified that no receiving or invoice evidence exists');
 IF result->>'status'<>'Applied' OR (SELECT status FROM public.purchase_orders WHERE id=po)<>'Cancelled' THEN RAISE EXCEPTION 'PO cancellation not applied'; END IF;
 INSERT INTO lifecycle_cancellation_results VALUES('independent hold release permits reviewed PO cancellation');
 BEGIN
   INSERT INTO public.po_items(po_id,product_name,quantity,unit_cost,total_cost,received_qty,custom_attributes) VALUES(po,'Laundry powder test fixture',1,100,100,1,'{"storage":{"requirementsConfirmed":true,"isPerishable":false,"type":"Ambient"}}');
   RAISE EXCEPTION 'Unexpected receipt after cancellation';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%cannot accept new receipt%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_cancellation_results VALUES('new receipt evidence blocked after cancellation');
 PERFORM set_config('request.jwt.claim.sub',requester.id::text,true);
 req:=public.request_record_lifecycle('purchase_order',po_with_receipt,'Cancellation must fail if receiving evidence arrives','{}');
 PERFORM set_config('request.jwt.claim.sub','',true);
 INSERT INTO public.po_items(po_id,product_name,quantity,unit_cost,total_cost,received_qty,custom_attributes) VALUES(po_with_receipt,'Laundry powder test fixture',1,100,100,1,'{"storage":{"requirementsConfirmed":true,"isPerishable":false,"type":"Ambient"}}');
 PERFORM set_config('request.jwt.claim.sub',proc.id::text,true);
 BEGIN
   PERFORM public.decide_record_lifecycle(req,true,'Do not cancel an order with physical receiving evidence');
   RAISE EXCEPTION 'Unexpected cancellation with receipt';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%requires a reversal%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_cancellation_results VALUES('receiving evidence prevents cancellation');
 PERFORM set_config('request.jwt.claim.sub',requester.id::text,true);
 req:=public.request_record_lifecycle('transfer',transfer_id,'Cancel the unexecuted regression transfer','{}');
 PERFORM set_config('request.jwt.claim.sub',logistics.id::text,true);
 result:=public.decide_record_lifecycle(req,true,'Logistics independently verified that dispatch has not begun');
 IF result->>'status'<>'Applied' OR (SELECT transfer_status FROM public.transfers WHERE id=transfer_id)<>'Cancelled' THEN RAISE EXCEPTION 'Transfer cancellation not applied'; END IF;
 INSERT INTO lifecycle_cancellation_results VALUES('independent logistics review cancels unexecuted transfer');
 BEGIN
   PERFORM public.decide_record_lifecycle(req,true,'Repeated approval must not execute the action again');
   RAISE EXCEPTION 'Unexpected replay';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%already decided%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_cancellation_results VALUES('replayed decision rejected');
 PERFORM set_config('request.jwt.claim.sub',requester.id::text,true);
 req:=public.request_record_lifecycle('warehouse_job',job,'Cancel the unexecuted warehouse draft fixture','{}');
 BEGIN
   UPDATE public.wms_jobs SET status='Cancelled' WHERE id=job;
   RAISE EXCEPTION 'Unexpected warehouse direct cancellation';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%independent lifecycle review%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_cancellation_results VALUES('warehouse direct cancellation bypass denied');
 PERFORM set_config('request.jwt.claim.sub',logistics.id::text,true);
 result:=public.decide_record_lifecycle(req,true,'Logistics reviewed the unassigned warehouse draft');
 IF result->>'status'<>'Applied' OR (SELECT status FROM public.wms_jobs WHERE id=job)<>'Cancelled' THEN RAISE EXCEPTION 'Warehouse draft cancellation not applied'; END IF;
 INSERT INTO lifecycle_cancellation_results VALUES('warehouse draft retained as cancelled after review');
 SELECT e.* INTO buyer FROM public.employees e JOIN public.sites home ON home.id=e.site_id
 WHERE e.role='buyer' AND e.status='Active' AND home.country='ET' AND e.region_code=requester.region_code LIMIT 1;
 IF buyer.id IS NULL THEN RAISE EXCEPTION 'Staging buyer fixture missing'; END IF;
 PERFORM set_config('request.jwt.claim.sub','',true);
 INSERT INTO public.purchase_orders(supplier_name,total_amount,items_count,status,site_id,country_code,region_code,created_by,requested_by)
 VALUES('Lifecycle own-draft fixture',100,0,'Draft',source,'ET',requester.region_code,buyer.id::text,buyer.name) RETURNING id INTO po;
 PERFORM set_config('request.jwt.claim.sub',proc.id::text,true);
 BEGIN
   PERFORM public.discard_own_purchase_order_draft(po,'Another manager must not discard the buyer draft');
   RAISE EXCEPTION 'Unexpected other-preparer discard';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%Only the preparer%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_cancellation_results VALUES('another manager cannot discard the preparer draft');
 PERFORM set_config('request.jwt.claim.sub',buyer.id::text,true);
 result:=public.discard_own_purchase_order_draft(po,'Buyer no longer requires this unsubmitted draft');
 IF result->>'status'<>'Cancelled' OR (SELECT status FROM public.purchase_orders WHERE id=po)<>'Cancelled' THEN
   RAISE EXCEPTION 'Own draft discard failed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.record_lifecycle_events WHERE request_id=(result->>'request_id')::uuid AND action='Draft discarded') THEN
   RAISE EXCEPTION 'Draft discard missing audit event'; END IF;
 INSERT INTO lifecycle_cancellation_results VALUES('buyer discards own draft with retained record and audit evidence');

END;
$$;
SELECT * FROM lifecycle_cancellation_results;
ROLLBACK;
