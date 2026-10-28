-- Staging-only trusted timestamp fixtures; all DDL/data/settings roll back.
BEGIN;
DO $test$
DECLARE target public.sites%ROWTYPE; foreign_site public.sites%ROWTYPE; product public.products%ROWTYPE;
 director uuid; regional uuid; requester uuid; v_request_id uuid; applied_history uuid; response jsonb;
 expired_history uuid:=gen_random_uuid(); held_history uuid:=gen_random_uuid(); foreign_history uuid:=gen_random_uuid(); recent_history uuid:=gen_random_uuid();
 rejected_request uuid:=gen_random_uuid(); held_request uuid:=gen_random_uuid(); pending_request uuid:=gen_random_uuid(); obsolete_product uuid:=gen_random_uuid();
BEGIN
 SELECT s.* INTO target FROM public.sites s WHERE s.country='ET' AND s.type='Store' AND EXISTS(SELECT 1 FROM public.products p WHERE p.site_id=s.id AND p.cost_price>0)
 AND EXISTS(SELECT 1 FROM public.employees e WHERE e.role='merchandising_specialist' AND e.region_code=s.region_code AND lower(e.status)='active') ORDER BY s.id LIMIT 1;
 SELECT * INTO product FROM public.products WHERE site_id=target.id AND cost_price>0 ORDER BY id LIMIT 1;
 SELECT * INTO foreign_site FROM public.sites WHERE country='KE' AND type='Store' ORDER BY id LIMIT 1;
 SELECT e.id INTO director FROM public.employees e JOIN public.sites home ON home.id=e.site_id WHERE e.role='country_commercial_director' AND home.country=target.country AND lower(e.status)='active' LIMIT 1;
 SELECT id INTO requester FROM public.employees WHERE role='merchandising_specialist' AND region_code=target.region_code AND lower(status)='active' LIMIT 1;
 IF product.id IS NULL OR director IS NULL OR requester IS NULL OR foreign_site.id IS NULL THEN RAISE EXCEPTION 'Missing staging retention fixtures'; END IF;
 -- A real authenticated approved price captures durable approval/cost evidence.
 EXECUTE 'SET LOCAL ROLE authenticated';
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',requester,'role','authenticated')::text,true);
 INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,requested_by,proposed_changes,adjustment_reason)
 VALUES(product.id::text,product.name,product.sku,target.id::text,target.country,'edit','pending','fixture',jsonb_build_object('price',round(product.cost_price*2+101),'isOnSale',false),'PRICE_CHANGE: retained evidence test') RETURNING id INTO v_request_id;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',director,'role','authenticated')::text,true);
 PERFORM public.approve_product_edit(v_request_id);
 SELECT id INTO applied_history FROM public.product_price_history WHERE product_id=product.id AND public.product_price_history.request_id=v_request_id ORDER BY changed_at DESC LIMIT 1;
 IF applied_history IS NULL THEN RAISE EXCEPTION 'Applied approval did not record price history'; END IF;
 BEGIN DELETE FROM public.product_price_history WHERE id=applied_history; RAISE EXCEPTION 'Authenticated history deletion allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM private.prune_product_price_history(target.country,10); RAISE EXCEPTION 'Authenticated user invoked retention maintenance'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 response:=public.manage_product_price_hold(product.id,target.country,'Open audit retention test',false);
 IF response->>'active'<>'true' THEN RAISE EXCEPTION 'Hold not saved'; END IF;
 EXECUTE 'RESET ROLE';
 IF NOT EXISTS(SELECT 1 FROM private.product_price_evidence e WHERE e.history_id=applied_history AND e.evidence->>'requestId'=v_request_id::text AND e.evidence ? 'oldCost' AND e.evidence ? 'newMarginPct') THEN RAISE EXCEPTION 'Approval evidence not captured'; END IF;
 -- Seed historical dates as trusted fixtures only. All assertions below restore normal triggers/RLS.
 ALTER TABLE public.inventory_requests DISABLE TRIGGER z_product_edit_request_guard;
 INSERT INTO public.product_price_history(id,product_id,site_id,country_code,product_name,sku,old_regular_price,new_regular_price,old_is_on_sale,new_is_on_sale,old_effective_price,new_effective_price,changed_at)
 VALUES(expired_history,obsolete_product,target.id,target.country,'Archived coffee','ET-OLD',100,110,false,false,100,110,now()-interval '11 years'),
 (held_history,product.id,target.id,target.country,product.name,product.sku,100,110,false,false,100,110,now()-interval '11 years'),
 (recent_history,obsolete_product,target.id,target.country,'Recent coffee','ET-NEW',100,110,false,false,100,110,now()-interval '9 years'),
 (foreign_history,gen_random_uuid(),foreign_site.id,foreign_site.country,'Other country coffee','KE-OLD',100,110,false,false,100,110,now()-interval '11 years');
 INSERT INTO public.inventory_requests(id,product_id,product_name,product_sku,site_id,country_code,change_type,status,requested_by,requested_at,rejected_at,proposed_changes)
 VALUES(rejected_request,obsolete_product::text,'Old rejected coffee','ET-OLD',target.id::text,target.country,'edit','rejected','Fixture requester',now()-interval '3 years',now()-interval '3 years','{"price":200}'),
 (held_request,product.id::text,product.name,product.sku,target.id::text,target.country,'edit','rejected','Fixture requester',now()-interval '3 years',now()-interval '3 years','{"price":200}'),
 (pending_request,obsolete_product::text,'Pending coffee','ET-PENDING',target.id::text,target.country,'edit','pending','Fixture requester',now()-interval '3 years',NULL,'{"price":200}');
 ALTER TABLE public.inventory_requests ENABLE TRIGGER z_product_edit_request_guard;
 BEGIN UPDATE public.product_price_history SET new_effective_price=999 WHERE id=applied_history; RAISE EXCEPTION 'Applied history update allowed'; EXCEPTION WHEN raise_exception THEN IF SQLERRM='Applied history update allowed' THEN RAISE; END IF; END;
 BEGIN DELETE FROM public.product_price_history WHERE id=recent_history; RAISE EXCEPTION 'Under-ten-year history deleted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM='Under-ten-year history deleted' THEN RAISE; END IF; END;
 BEGIN DELETE FROM public.product_price_history WHERE id=held_history; RAISE EXCEPTION 'Held history deleted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM='Held history deleted' THEN RAISE; END IF; END;
 BEGIN DELETE FROM public.inventory_requests WHERE id=held_request; RAISE EXCEPTION 'Held proposal deleted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM='Held proposal deleted' THEN RAISE; END IF; END;
 response:=private.prune_product_price_history(target.country,250);
 IF EXISTS(SELECT 1 FROM public.product_price_history WHERE id=expired_history) THEN RAISE EXCEPTION 'Expired history was not pruned'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.product_price_history WHERE id=held_history) OR NOT EXISTS(SELECT 1 FROM public.product_price_history WHERE id=foreign_history) OR NOT EXISTS(SELECT 1 FROM public.product_price_history WHERE id=recent_history) THEN RAISE EXCEPTION 'Cleanup lost held, foreign or unexpired history'; END IF;
 IF EXISTS(SELECT 1 FROM public.inventory_requests WHERE id=rejected_request) OR NOT EXISTS(SELECT 1 FROM public.inventory_requests WHERE id=held_request) OR NOT EXISTS(SELECT 1 FROM public.inventory_requests WHERE id=pending_request) THEN RAISE EXCEPTION 'Proposal retention/hold boundary failed'; END IF;
 EXECUTE 'SET LOCAL ROLE authenticated';
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',requester,'role','authenticated')::text,true);
 BEGIN PERFORM public.manage_product_price_hold(product.id,target.country,'Unauthorized release',true); RAISE EXCEPTION 'Specialist released hold'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',director,'role','authenticated')::text,true);
 PERFORM public.manage_product_price_hold(product.id,target.country,'Audit completed; release verified',true);
 IF EXISTS(SELECT 1 FROM public.list_product_price_history(target.id,target.country,product.id,now()-interval '12 months',NULL,0,10) h WHERE h.id=held_history) THEN RAISE EXCEPTION 'Recent view included old history'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.list_product_price_history(target.id,target.country,product.id,NULL,NULL,0,10) h WHERE h.id=held_history) THEN RAISE EXCEPTION 'Retained history not searchable'; END IF;
 IF EXISTS(SELECT 1 FROM public.list_product_price_history(target.id,foreign_site.country,product.id,NULL,NULL,0,10)) THEN RAISE EXCEPTION 'History country mismatch returned records'; END IF;
 EXECUTE 'RESET ROLE';
 PERFORM private.prune_product_price_history(target.country,250);
 IF EXISTS(SELECT 1 FROM public.product_price_history WHERE id=held_history) OR EXISTS(SELECT 1 FROM public.inventory_requests WHERE id=held_request) THEN RAISE EXCEPTION 'Released expired records not pruned'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.product_price_history WHERE id=applied_history) THEN RAISE EXCEPTION 'Cleanup removed current approved history'; END IF;
END;
$test$;
ROLLBACK;
