-- Integration checks use metadata fixtures only; all changes roll back.
BEGIN;
CREATE TEMP TABLE remaining_security_results(test text);
DO $$
DECLARE person public.employees%ROWTYPE; hr public.employees%ROWTYPE; foreign_employee uuid; inactive uuid;
 ops public.employees%ROWTYPE; worker public.employees%ROWTYPE; site uuid; object_name text; affected integer;
 product_stock uuid:=gen_random_uuid(); product_history uuid:=gen_random_uuid(); unused uuid:=gen_random_uuid();
 po uuid:=gen_random_uuid(); line uuid:=gen_random_uuid(); doc uuid:=gen_random_uuid(); job uuid:=gen_random_uuid(); assignment uuid:=gen_random_uuid();
BEGIN
 SELECT e.* INTO person FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='cashier' AND e.status='Active' AND s.country='ET' AND e.region_code='ADD' ORDER BY e.id LIMIT 1;
 SELECT e.* INTO hr FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='regional_hr_manager' AND e.status='Active' AND s.country='ET' AND e.region_code='ADD' LIMIT 1;
 SELECT e.* INTO ops FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='regional_operations_manager' AND e.status='Active' AND s.country='ET' AND e.region_code='ADD' LIMIT 1;
 SELECT e.id INTO foreign_employee FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.status='Active' AND s.country='KE' LIMIT 1;
 SELECT id INTO inactive FROM public.employees WHERE status='Terminated' LIMIT 1;
 SELECT s.id INTO site FROM public.sites s WHERE s.country='ET' AND s.region_code='ADD' AND s.type IN ('Warehouse','Distribution Center') AND s.status='Active' ORDER BY s.id LIMIT 1;
 SELECT * INTO worker FROM public.employees WHERE site_id=site AND role IN ('picker','packer','receiver','stock_clerk','inventory_specialist') AND status='Active' LIMIT 1;
 IF person.id IS NULL OR hr.id IS NULL OR ops.id IS NULL OR foreign_employee IS NULL OR inactive IS NULL OR site IS NULL OR worker.id IS NULL THEN RAISE EXCEPTION 'Staging security test actors missing'; END IF;
 PERFORM set_config('request.jwt.claim.sub',person.id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',person.id,'role','group_ceo','email',hr.email)::text,true);
 IF public.get_my_role()<>'cashier' THEN RAISE EXCEPTION 'Role claims overrode employee identity'; END IF;
 IF public.is_hq_executive() THEN RAISE EXCEPTION 'Cashier gained executive authority'; END IF;
 INSERT INTO remaining_security_results VALUES('stale role and email claims cannot replace employee identity');
 IF NOT private.can_upload_employee_avatar('profile-photos/'||person.id::text||'/fixture.jpg') THEN RAISE EXCEPTION 'Self upload incorrectly denied'; END IF;
 IF private.can_upload_employee_avatar('profile-photos/'||hr.id::text||'/fixture.jpg') THEN RAISE EXCEPTION 'Coworker upload incorrectly allowed'; END IF;
 IF private.can_upload_employee_avatar('profile-photos/'||person.id::text||'/../other/fixture.jpg') THEN RAISE EXCEPTION 'Path traversal allowed'; END IF;
 INSERT INTO remaining_security_results VALUES('self avatar upload allowed; coworker and traversal paths denied');
 PERFORM set_config('request.jwt.claim.sub',hr.id::text,true);
 IF NOT private.can_upload_employee_avatar('profile-photos/'||person.id::text||'/fixture.jpg') THEN RAISE EXCEPTION 'Scoped HR upload denied'; END IF;
 IF private.can_upload_employee_avatar('profile-photos/'||foreign_employee::text||'/fixture.jpg') THEN RAISE EXCEPTION 'Cross-country HR upload allowed'; END IF;
 INSERT INTO remaining_security_results VALUES('HR avatar uploads respect employee scope and country');
 PERFORM set_config('request.jwt.claim.sub',inactive::text,true);
 IF public.get_my_role() IS NOT NULL OR public.get_my_site_id() IS NOT NULL OR public.get_my_region_code() IS NOT NULL OR public.is_hq_executive() THEN
   RAISE EXCEPTION 'Inactive identity retained authorization'; END IF;
 IF private.can_upload_employee_avatar('profile-photos/'||inactive::text||'/fixture.jpg') THEN RAISE EXCEPTION 'Inactive upload allowed'; END IF;
 INSERT INTO remaining_security_results VALUES('inactive identity loses role, site, region and avatar write authority');
 PERFORM set_config('request.jwt.claim.sub',person.id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',person.id,'role','authenticated')::text,true);
 object_name:='profile-photos/'||person.id::text||'/rollback-'||gen_random_uuid()::text||'.jpg';
 PERFORM set_config('role','authenticated',true);
 INSERT INTO storage.objects(bucket_id,name,owner,owner_id) VALUES('avatars',object_name,person.id,person.id::text);
 UPDATE storage.objects SET name='profile-photos/'||hr.id::text||'/moved.jpg' WHERE bucket_id='avatars' AND name=object_name;
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected<>0 THEN RAISE EXCEPTION 'Avatar overwrite/move allowed'; END IF;
 BEGIN
   DELETE FROM storage.objects WHERE bucket_id='avatars' AND name=object_name;
   GET DIAGNOSTICS affected=ROW_COUNT;
   IF affected<>0 THEN RAISE EXCEPTION 'Avatar deletion allowed'; END IF;
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%Use the Storage API instead%' THEN RAISE; END IF; END;
 PERFORM set_config('role','postgres',true);
 INSERT INTO remaining_security_results VALUES('Storage RLS allows scoped insertion but denies overwrite, move and destruction');
 IF EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relkind IN ('r','p')
   AND (has_table_privilege('authenticated',c.oid,'TRUNCATE') OR has_table_privilege('anon',c.oid,'TRUNCATE'))) THEN
   RAISE EXCEPTION 'Ordinary API role retains whole-table clearing privilege'; END IF;
 INSERT INTO remaining_security_results VALUES('ordinary API roles have no public-table TRUNCATE privilege');
 PERFORM set_config('request.jwt.claim.sub','',true);
 PERFORM set_config('request.jwt.claims','{}',true);
 INSERT INTO public.products(id,name,sku,category,price,stock,site_id,approval_status,status)
 VALUES(product_stock,'Laundry powder rollback fixture','ET-LC-'||product_stock::text,'Household',100,1,site,'approved','active'),
 (product_history,'Laundry powder history fixture','ET-LC-'||product_history::text,'Household',100,0,site,'approved','active'),
 (unused,'Unused laundry powder fixture','ET-LC-'||unused::text,'Household',0,0,site,'pending','out_of_stock');
 BEGIN DELETE FROM public.products WHERE id=product_stock; RAISE EXCEPTION 'Product stock lost';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%with stock cannot be deleted%' THEN RAISE; END IF; END;
 INSERT INTO remaining_security_results VALUES('stocked product deletion denied');
 INSERT INTO public.purchase_orders(id,supplier_name,total_amount,items_count,status,site_id,country_code,region_code,created_by,requested_by)
 VALUES(po,'Rollback supplier',100,1,'Draft',site,'ET','ADD',ops.id::text,ops.name);
 INSERT INTO public.po_items(id,po_id,product_id,product_name,quantity,unit_cost,total_cost,received_qty)
 VALUES(line,po,product_history,'Laundry powder history fixture',1,100,100,1);
 BEGIN DELETE FROM public.products WHERE id=product_history; RAISE EXCEPTION 'Referenced product lost';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%history must be retained%' THEN RAISE; END IF; END;
 INSERT INTO remaining_security_results VALUES('product with operational evidence cannot be deleted');
 BEGIN DELETE FROM public.po_items WHERE id=line; RAISE EXCEPTION 'Received line lost';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%Receiving evidence cannot be deleted%' THEN RAISE; END IF; END;
 BEGIN UPDATE public.po_items SET received_qty=0 WHERE id=line; RAISE EXCEPTION 'Receipt quantity erased';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%reviewed reversal%' THEN RAISE; END IF; END;
 BEGIN UPDATE public.po_items SET product_id=NULL WHERE id=line; RAISE EXCEPTION 'Receipt product detached';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%reviewed reversal%' THEN RAISE; END IF; END;
 INSERT INTO remaining_security_results VALUES('receipt deletion, zeroing and product detachment denied');
 DELETE FROM public.products WHERE id=unused;
 IF EXISTS(SELECT 1 FROM public.products WHERE id=unused) THEN RAISE EXCEPTION 'Unused zero-stock product cleanup failed'; END IF;
 INSERT INTO remaining_security_results VALUES('unused zero-stock product cleanup remains possible');
 PERFORM set_config('request.jwt.claim.sub',hr.id::text,true);
 INSERT INTO public.employee_documents(id,country_code,employee_id,name,doc_type,file_url,uploaded_by)
 VALUES(doc,'ET',person.id,'Rollback employment evidence','Employment Contract','https://example.invalid/rollback-evidence',person.id::text);
 IF (SELECT uploaded_by FROM public.employee_documents WHERE id=doc)<>hr.id::text THEN RAISE EXCEPTION 'Document uploader identity not bound'; END IF;
 BEGIN UPDATE public.employee_documents SET file_url='https://example.invalid/replaced' WHERE id=doc; RAISE EXCEPTION 'Personnel evidence replaced';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%Personnel document identity%' THEN RAISE; END IF; END;
 BEGIN DELETE FROM public.employee_documents WHERE id=doc; RAISE EXCEPTION 'Personnel evidence deleted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%Permanent deletion%' THEN RAISE; END IF; END;
 INSERT INTO remaining_security_results VALUES('document uploader is trusted and document identity cannot be replaced or deleted');
 PERFORM set_config('request.jwt.claim.sub',ops.id::text,true);
 INSERT INTO public.wms_jobs(id,type,priority,items_count,status,site_id,country_code) VALUES(job,'COUNT','Normal',0,'Pending',site,'ET');
 INSERT INTO public.job_assignments(id,job_id,employee_id,employee_name,status,started_at)
 VALUES(assignment,job,worker.id,worker.name,'In-Progress',now());
 BEGIN DELETE FROM public.job_assignments WHERE id=assignment; RAISE EXCEPTION 'Started assignment deleted';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%assignment history cannot be deleted%' THEN RAISE; END IF; END;
 BEGIN UPDATE public.job_assignments SET started_at=NULL WHERE id=assignment; RAISE EXCEPTION 'Assignment start erased';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%attribution and start evidence%' THEN RAISE; END IF; END;
 INSERT INTO remaining_security_results VALUES('started warehouse assignment cannot be deleted or reset');
END;
$$;
SELECT * FROM remaining_security_results;
ROLLBACK;
