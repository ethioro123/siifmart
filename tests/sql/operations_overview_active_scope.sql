-- Rollback-only regression for administrative oversight and persistent active receiving.
BEGIN;
CREATE TEMP TABLE operations_overview_checks(name text);
GRANT INSERT ON operations_overview_checks TO authenticated;
DO $test$
DECLARE regional public.employees%ROWTYPE; branch public.employees%ROWTYPE; receiver public.employees%ROWTYPE;
 facility public.sites%ROWTYPE; home public.sites%ROWTYPE; product public.products%ROWTYPE;
 po uuid:=gen_random_uuid(); item uuid:=gen_random_uuid(); receive_job uuid:=gen_random_uuid(); receipt uuid:=gen_random_uuid(); jobs jsonb; rows jsonb; row jsonb; result jsonb; blocked boolean;
BEGIN
 SELECT e.* INTO regional FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='regional_operations_manager' AND e.status='Active' AND s.country='ET' AND s.type='Administration' ORDER BY e.id LIMIT 1;
 SELECT * INTO home FROM public.sites WHERE id=regional.site_id;
 SELECT s.* INTO facility FROM public.sites s WHERE s.country='ET' AND s.region_code=coalesce(regional.region_code,home.region_code) AND s.type='Warehouse' AND s.status='Active'
 AND EXISTS(SELECT 1 FROM public.employees e WHERE e.site_id=s.id AND e.role='warehouse_manager' AND e.status='Active')
 AND EXISTS(SELECT 1 FROM public.employees e WHERE e.site_id=s.id AND e.role='receiver' AND e.status='Active')
 AND EXISTS(SELECT 1 FROM public.products p WHERE p.site_id=s.id AND p.sku IS NOT NULL) ORDER BY s.id LIMIT 1;
 SELECT * INTO branch FROM public.employees WHERE site_id=facility.id AND role='warehouse_manager' AND status='Active' LIMIT 1;
 SELECT * INTO receiver FROM public.employees WHERE site_id=facility.id AND role='receiver' AND status='Active' LIMIT 1;
 SELECT * INTO product FROM public.products WHERE site_id=facility.id AND sku IS NOT NULL LIMIT 1;
 IF regional.id IS NULL OR branch.id IS NULL OR receiver.id IS NULL OR product.id IS NULL THEN RAISE EXCEPTION 'Missing staging regression fixtures'; END IF;
 PERFORM set_config('request.jwt.claim.sub','',true);PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 INSERT INTO public.purchase_orders(id,po_number,site_id,country_code,supplier_name,total_amount,items_count,status,currency)
 VALUES(po,'TEST-OVERVIEW-'||left(po::text,8),facility.id,'ET','Rollback supplier',100,1,'Approved','ETB');
 INSERT INTO public.po_items(id,po_id,product_id,product_name,sku,quantity,unit_cost,total_cost,pack_quantity,case_size,custom_attributes)
 VALUES(item,po,product.id,product.name,product.sku,10,10,100,1,1,'{"storage":{"requirementsConfirmed":true,"isPerishable":false,"type":"Ambient"}}');
 INSERT INTO public.wms_jobs(id,site_id,country_code,type,status,priority,items_count,job_number,order_ref,assigned_to,line_items)
 VALUES(receive_job,facility.id,'ET','RECEIVE','In-Progress','Normal',1,'ACTIVE-RECEIVE-TEST',po::text,receiver.id::text,'[]');
 PERFORM set_config('request.jwt.claim.sub',receiver.id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',receiver.id,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 jobs:=jsonb_build_array(jsonb_build_object('lineItems',jsonb_build_array(jsonb_build_object('productId',product.id,'name',product.name,'sku',product.sku,'expectedQty',2,'condition','Good'))));
 PERFORM set_config('request.jwt.claim.sub',branch.id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',branch.id,'role','authenticated')::text,true);
 result:=public.operations_review_detail(facility.id,'ET','job',receive_job,0)->'receiving';
 IF result->'items'->0->>'ordered' IS NOT NULL THEN RAISE EXCEPTION 'Manager saw expected quantity before submission'; END IF;
 PERFORM set_config('request.jwt.claim.sub',receiver.id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',receiver.id,'role','authenticated')::text,true);
 result:=public.save_receiving_split(receipt,po,item,jobs,0);
 PERFORM set_config('request.jwt.claim.sub',regional.id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',regional.id,'role','authenticated')::text,true);
 rows:=public.operations_review_queue(home.id,'ET','RECEIVE','active',0);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(rows) r WHERE r->>'id'=receive_job::text AND r->>'site_id'=facility.id::text AND r->>'status'='Partially Received') THEN
 RAISE EXCEPTION 'Regional manager at administration cannot see partial receiving in warehouse'; END IF;
 FOR row IN SELECT value FROM jsonb_array_elements(rows) LOOP
 IF NOT public.is_site_in_my_authorized_scope(row->>'site_id','ET') THEN RAISE EXCEPTION 'Queue included an unauthorized site'; END IF;
 END LOOP;
 IF jsonb_array_length(rows)>25 THEN RAISE EXCEPTION 'Queue exceeded bounded pagination'; END IF;
 result:=public.operations_review_detail(facility.id,'ET','job',receive_job,0)->'receiving';
 IF (result->'items'->0->>'ordered')::numeric<>10 OR (result->'items'->0->>'received')::numeric<>2
 OR (result->'items'->0->>'outstanding')::numeric<>8 OR jsonb_array_length(result->'submissions')<>1 OR jsonb_array_length(result->'putaway')<>1 THEN RAISE EXCEPTION 'Submitted receiving details or related work missing'; END IF;
 IF result->'putaway'->0->>'reference' IS DISTINCT FROM (SELECT coalesce(nullif(j.job_number,''),p.po_number) FROM public.wms_jobs j JOIN public.purchase_orders p ON p.id=po WHERE j.id=(result->'putaway'->0->>'id')::uuid) THEN RAISE EXCEPTION 'Related putaway did not use stored or inherited job number'; END IF;
 row:=public.operations_review_detail(facility.id,'ET','job',(result->'putaway'->0->>'id')::uuid,0);
 IF row#>>'{summary,reference}' IS DISTINCT FROM result->'putaway'->0->>'reference'
 OR row#>>'{fields,order}' IS DISTINCT FROM (SELECT po_number FROM public.purchase_orders WHERE id=po) THEN RAISE EXCEPTION 'Putaway detail identifiers do not match related work'; END IF;
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.operations_review_queue(home.id,'ET','RECEIVE','partial',0)) r WHERE r->>'id'=receive_job::text AND (r->>'exception')::boolean=false) THEN
 RAISE EXCEPTION 'Partial receipt missing or incorrectly treated as exception'; END IF;

 INSERT INTO operations_overview_checks VALUES('regional administration includes authorized warehouse; active RECEIVE persists after count submission; actual facility detail works; pagination stays bounded');
 PERFORM set_config('request.jwt.claim.sub',branch.id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',branch.id,'role','authenticated')::text,true);
 rows:=public.operations_review_queue(facility.id,'ET','ALL','active',0);
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(rows) r WHERE r->>'site_id'<>facility.id::text) THEN RAISE EXCEPTION 'Branch manager saw another facility'; END IF;
 blocked:=false;BEGIN PERFORM public.operations_review_queue(home.id,'ET','ALL','active',0);EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Branch manager expanded scope via administration'; END IF;
 blocked:=false;BEGIN PERFORM public.operations_review_queue(facility.id,'KE','ALL','active',0);EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Country boundary bypassed'; END IF;
 INSERT INTO operations_overview_checks VALUES('branch manager remains facility-only, cannot expand through administration, and cannot cross the country boundary');
 PERFORM public.save_receiving_split(gen_random_uuid(),po,item,jobs,2);
 result:=public.operations_review_detail(facility.id,'ET','job',receive_job,0)->'receiving';
 IF result->'items'->0->>'ordered' IS NOT NULL OR result->'items'->0->>'outstanding' IS NOT NULL THEN RAISE EXCEPTION 'Original counter with manager role saw comparisons'; END IF;
 INSERT INTO operations_overview_checks VALUES('submitted quantities and partial view verified; expectations hidden before submission and from a manager who counted');

 EXECUTE 'RESET ROLE';
END; $test$;
SELECT * FROM operations_overview_checks;
ROLLBACK;
