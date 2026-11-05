BEGIN;
SET LOCAL statement_timeout='8s';
SELECT set_config('request.jwt.claim.sub','988fb8ef-8053-415b-9032-2aca981058d7',true);
SELECT set_config('request.jwt.claims','{"sub":"988fb8ef-8053-415b-9032-2aca981058d7","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE id1 uuid:=gen_random_uuid(); id2 uuid:=gen_random_uuid(); header jsonb; lines jsonb; blocked boolean:=false; BEGIN
 header:='{"site_id":"c1111111-1111-4000-8000-000000000110","country_code":"ET","currency":"ETB","supplier_name":"Audit supplier","status":"Draft","total_amount":10,"items_count":1}';
 lines:='[{"product_name":"Cooking oil","sku":"ET-AUDIT-OIL","quantity":1,"unit_cost":10,"total_cost":10,"pack_quantity":1,"custom_attributes":{"storage":{"requirementsConfirmed":true,"isPerishable":false,"type":"Ambient"}}}]';
 BEGIN PERFORM public.save_purchase_order_document(id1,header,'[{"quantity":-1}]',true); EXCEPTION WHEN OTHERS THEN blocked:=true; END;
 ASSERT blocked AND NOT EXISTS(SELECT 1 FROM public.purchase_orders WHERE id=id1),'Failed creation left a header';
 PERFORM public.save_purchase_order_document(id2,header,lines,true);
 blocked:=false; BEGIN PERFORM public.save_purchase_order_document(id2,'{"notes":"must roll back"}','[{"quantity":-1}]',false); EXCEPTION WHEN OTHERS THEN blocked:=true;END;
 ASSERT blocked AND (SELECT count(*) FROM public.po_items WHERE po_id=id2)=1,'Failed replacement erased lines';
 ASSERT (SELECT notes FROM public.purchase_orders WHERE id=id2) IS NULL,'Failed replacement changed header';
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE job uuid:=gen_random_uuid(); BEGIN
 INSERT INTO public.wms_jobs(id,site_id,country_code,type,status,priority,items_count,line_items)
 VALUES(job,'c1111111-1111-4000-8000-000000000110','ET','PUTAWAY','Pending','Normal',0,'[]');
 PERFORM set_config('test.assign.job',job::text,true);
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000083',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000083","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE job uuid:=current_setting('test.assign.job')::uuid; result jsonb; replay jsonb; BEGIN
 result:=public.assign_warehouse_job_atomic(job,'e1000000-0000-4000-8000-000000000088',15);
 replay:=public.assign_warehouse_job_atomic(job,'e1000000-0000-4000-8000-000000000088',15);
 ASSERT result#>>'{assignment,id}'=replay#>>'{assignment,id}','Retry duplicated assignment history';
 ASSERT EXISTS(SELECT 1 FROM public.wms_jobs j JOIN public.job_assignments a ON a.job_id=j.id WHERE j.id=job AND j.assigned_to=a.employee_id::text),'Assignment lacks execution authorization';
END $$;
ROLLBACK;
SELECT 'PASS: PO document rollback and atomic assignment retry; rolled back' result;
