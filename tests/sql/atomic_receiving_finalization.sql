-- Rollback-only test of server receipt counts, transactionality and scope.
BEGIN;
DO $$
DECLARE site public.sites%ROWTYPE; product public.products%ROWTYPE; receiver uuid; outsider uuid;
 po uuid:=gen_random_uuid(); item uuid:=gen_random_uuid(); receive_job uuid:=gen_random_uuid(); second_job uuid:=gen_random_uuid();
 result jsonb; blocked boolean; work jsonb; pending_before integer;
BEGIN
 SELECT s.* INTO site FROM public.sites s WHERE country='ET' AND type IN('Warehouse','Distribution Center')
 AND EXISTS(SELECT 1 FROM public.employees e WHERE e.site_id=s.id AND e.role='receiver' AND lower(e.status)='active')
 AND EXISTS(SELECT 1 FROM public.products p WHERE p.site_id=s.id AND p.sku IS NOT NULL) ORDER BY s.id LIMIT 1;
 SELECT id INTO receiver FROM public.employees WHERE site_id=site.id AND role='receiver' AND lower(status)='active' LIMIT 1;
 SELECT id INTO outsider FROM public.employees WHERE site_id<>site.id AND role='receiver' AND lower(status)='active' LIMIT 1;
 SELECT * INTO product FROM public.products WHERE site_id=site.id AND sku IS NOT NULL LIMIT 1;
 ASSERT receiver IS NOT NULL AND outsider IS NOT NULL AND product.id IS NOT NULL;
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 INSERT INTO public.purchase_orders(id,site_id,country_code,supplier_name,total_amount,items_count,status,currency)
 VALUES(po,site.id,'ET','Rollback receipt supplier',100,1,'Approved','ETB');
 INSERT INTO public.po_items(id,po_id,product_id,product_name,sku,quantity,unit_cost,total_cost,pack_quantity,case_size)
 VALUES(item,po,product.id,product.name,product.sku,10,10,100,1,1);
 INSERT INTO public.wms_jobs(id,site_id,country_code,type,status,priority,items_count,order_ref,assigned_to,line_items)
 VALUES(receive_job,site.id,'ET','RECEIVE','In-Progress','Normal',1,po::text,receiver::text,'[]');
 PERFORM set_config('request.jwt.claim.sub',receiver::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',receiver,'role','authenticated')::text,true);
 blocked:=false;
 BEGIN PERFORM public.finalize_receiving_session(po); EXCEPTION WHEN raise_exception THEN blocked:=true; END;
 ASSERT blocked,'Unsubmitted counts must not complete receiving';
 work:=jsonb_build_array(jsonb_build_object('lineItems',jsonb_build_array(jsonb_build_object('productId',product.id,'sku',product.sku,'expectedQty',3,'condition','Good'))));
 PERFORM public.save_receiving_split(gen_random_uuid(),po,item,work,0);
 -- An unassigned peer task must fail the whole call, including any earlier task update.
 INSERT INTO public.wms_jobs(id,site_id,country_code,type,status,priority,items_count,order_ref,line_items)
 VALUES(second_job,site.id,'ET','RECEIVE','Pending','Normal',1,po::text,'[]');
 blocked:=false;
 BEGIN PERFORM public.finalize_receiving_session(po); EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 ASSERT blocked;
 ASSERT (SELECT status FROM public.purchase_orders WHERE id=po)='Approved';
 ASSERT (SELECT status FROM public.wms_jobs WHERE id=receive_job)='In-Progress','Failed finalization must roll back job completion';
 UPDATE public.wms_jobs SET assigned_to=receiver::text WHERE id=second_job;
 SELECT count(*) INTO pending_before FROM public.wms_jobs WHERE order_ref=po::text AND type='PUTAWAY' AND status='Pending';
 result:=public.finalize_receiving_session(po);
 ASSERT result->>'status'='Partially Received';
 ASSERT (SELECT status FROM public.wms_jobs WHERE id=receive_job)='Completed';
 ASSERT (SELECT count(*) FROM public.wms_jobs WHERE order_ref=po::text AND type='PUTAWAY' AND status='Pending')=pending_before;
 ASSERT public.finalize_receiving_session(po)->>'status'='Partially Received','Retry must remain safe';
 work:=jsonb_set(work,'{0,lineItems,0,expectedQty}','7');
 PERFORM public.save_receiving_split(gen_random_uuid(),po,item,work,3);
 result:=public.finalize_receiving_session(po);
 ASSERT result->>'status'='Received';
 ASSERT (SELECT received_qty FROM public.po_items WHERE id=item)=10;
 PERFORM set_config('request.jwt.claim.sub',outsider::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',outsider,'role','authenticated')::text,true);
 blocked:=false;
 BEGIN PERFORM public.finalize_receiving_session(po); EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 ASSERT blocked,'Other-facility worker must not finalize';
 ASSERT NOT has_function_privilege('anon','public.finalize_receiving_session(uuid)','EXECUTE');
END $$;
ROLLBACK;
