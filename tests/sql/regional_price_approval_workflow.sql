-- Authenticated staging regression. All prices, requests, logs and clearances roll back.
BEGIN;
DO $test$
DECLARE target public.sites%ROWTYPE; product public.products%ROWTYPE; requester uuid; regional uuid; commercial uuid; finance uuid; md uuid;
 other_regional uuid; foreign_commercial uuid; other_site public.sites%ROWTYPE; other_product public.products%ROWTYPE;
 request_id uuid; response jsonb; route jsonb; pprice numeric; snapshot jsonb;
BEGIN
 SELECT s.* INTO target FROM public.sites s WHERE s.type='Store' AND s.country='ET'
 AND EXISTS(SELECT 1 FROM public.products p WHERE p.site_id=s.id AND p.price>0 AND p.cost_price>0)
 AND EXISTS(SELECT 1 FROM public.employees e WHERE e.role='merchandising_specialist' AND e.region_code=s.region_code AND lower(e.status)='active')
 AND EXISTS(SELECT 1 FROM public.employees e WHERE e.role='regional_merchandising_manager' AND e.region_code=s.region_code AND lower(e.status)='active') ORDER BY s.id LIMIT 1;
 SELECT * INTO product FROM public.products WHERE site_id=target.id AND price>0 AND cost_price>0 ORDER BY id LIMIT 1;
 SELECT id INTO requester FROM public.employees WHERE role='merchandising_specialist' AND region_code=target.region_code AND lower(status)='active' LIMIT 1;
 SELECT id INTO regional FROM public.employees WHERE role='regional_merchandising_manager' AND region_code=target.region_code AND lower(status)='active' LIMIT 1;
 SELECT e.id INTO commercial FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='country_commercial_director' AND s.country=target.country AND lower(e.status)='active' LIMIT 1;
 SELECT e.id INTO finance FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='country_finance_director' AND s.country=target.country AND lower(e.status)='active' LIMIT 1;
 SELECT e.id INTO md FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='country_managing_director' AND s.country=target.country AND lower(e.status)='active' LIMIT 1;
 SELECT e.id INTO other_regional FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='regional_merchandising_manager' AND coalesce(e.region_code,s.region_code)<>target.region_code AND s.country=target.country AND lower(e.status)='active' LIMIT 1;
 SELECT e.id INTO foreign_commercial FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='country_commercial_director' AND s.country<>target.country AND lower(e.status)='active' LIMIT 1;
 IF product.id IS NULL OR requester IS NULL OR regional IS NULL OR commercial IS NULL OR finance IS NULL OR md IS NULL OR other_regional IS NULL OR foreign_commercial IS NULL THEN RAISE EXCEPTION 'Missing staging price-workflow fixtures'; END IF;
 EXECUTE 'SET LOCAL ROLE authenticated';
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',requester,'role','authenticated')::text,true);
 INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,requested_by,proposed_changes,adjustment_reason)
 VALUES(product.id::text,product.name,product.sku,target.id::text,target.country,'edit','pending','server replaces requester','{"price":10000,"costPrice":50,"isOnSale":false}','PRICE_CHANGE: price approval regression') RETURNING id INTO request_id;
 -- No percentage cap when margin complies, and no Operations/Supply Chain votes.
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',regional,'role','authenticated')::text,true);
 response:=public.get_price_approval_routes(ARRAY[request_id]); route:=response->request_id::text;
 IF NOT (route->>'canApprove')::boolean OR (route->>'requiresFinance')::boolean THEN RAISE EXCEPTION 'Compliant regional price not approvable: %',route; END IF;
 response:=public.approve_product_edit(request_id);
 IF response->>'workflow'<>'price' OR response->>'applied'<>'true' OR response->>'approvalCount'<>'1' THEN RAISE EXCEPTION 'Price did not apply with one approval: %',response; END IF;
 SELECT price INTO pprice FROM public.products WHERE id=product.id;
 IF pprice<>10000 THEN RAISE EXCEPTION 'Approved price not applied'; END IF;
 BEGIN PERFORM public.approve_product_edit(request_id); RAISE EXCEPTION 'Duplicate approval allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 -- Exactly 15% margin remains regional; another region and another country are blocked.
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',requester,'role','authenticated')::text,true);
 INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,requested_by,proposed_changes,adjustment_reason)
 VALUES(product.id::text,product.name,product.sku,target.id::text,target.country,'edit','pending','fixture','{"price":100,"costPrice":85,"isOnSale":false}','PRICE_CHANGE: exact floor') RETURNING id INTO request_id;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',other_regional,'role','authenticated')::text,true);
 BEGIN PERFORM public.approve_product_edit(request_id); RAISE EXCEPTION 'Other region approved price'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',foreign_commercial,'role','authenticated')::text,true);
 BEGIN PERFORM public.approve_product_edit(request_id); RAISE EXCEPTION 'Other country approved price'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',regional,'role','authenticated')::text,true);
 PERFORM public.approve_product_edit(request_id);
 -- Below floor requires Country Finance then Country Commercial, never the regional manager.
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',requester,'role','authenticated')::text,true);
 INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,requested_by,proposed_changes,adjustment_reason)
 VALUES(product.id::text,product.name,product.sku,target.id::text,target.country,'edit','pending','fixture','{"price":100,"costPrice":86,"isOnSale":false}','PRICE_CHANGE: below floor') RETURNING id INTO request_id;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',commercial,'role','authenticated')::text,true);
 BEGIN PERFORM public.approve_product_edit(request_id); RAISE EXCEPTION 'Below floor skipped Finance'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',regional,'role','authenticated')::text,true);
 BEGIN PERFORM public.finance_signoff_merchandising_price(request_id); RAISE EXCEPTION 'Regional manager cleared Finance'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',finance,'role','authenticated')::text,true);
 PERFORM public.finance_signoff_merchandising_price(request_id);
 BEGIN PERFORM public.approve_product_edit(request_id); RAISE EXCEPTION 'Finance gave final commercial approval'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',regional,'role','authenticated')::text,true);
 BEGIN PERFORM public.approve_product_edit(request_id); RAISE EXCEPTION 'Regional approved below-floor price after Finance'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',commercial,'role','authenticated')::text,true);
 PERFORM public.approve_product_edit(request_id);
 -- A regional manager's own proposal escalates; a country director can approve any region in-country.
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',regional,'role','authenticated')::text,true);
 INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,requested_by,proposed_changes,adjustment_reason)
 VALUES(product.id::text,product.name,product.sku,target.id::text,target.country,'edit','pending','fixture','{"price":120,"costPrice":50,"isOnSale":false}','PRICE_CHANGE: manager requested') RETURNING id INTO request_id;
 BEGIN PERFORM public.approve_product_edit(request_id); RAISE EXCEPTION 'Regional self-approval allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',commercial,'role','authenticated')::text,true);
 PERFORM public.approve_product_edit(request_id);
 -- Country Commercial's own request requires another authorized person (Country MD).
 INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,requested_by,proposed_changes,adjustment_reason)
 VALUES(product.id::text,product.name,product.sku,target.id::text,target.country,'edit','pending','fixture','{"price":140,"costPrice":50,"isOnSale":false}','PRICE_CHANGE: director requested') RETURNING id INTO request_id;
 BEGIN PERFORM public.approve_product_edit(request_id); RAISE EXCEPTION 'Country self-approval allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',md,'role','authenticated')::text,true);
 PERFORM public.approve_product_edit(request_id);
 -- Direct writes and forged workflow markers cannot bypass the server decision evidence.
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',requester,'role','authenticated')::text,true);
 INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,requested_by,proposed_changes,adjustment_reason)
 VALUES(product.id::text,product.name,product.sku,target.id::text,target.country,'edit','pending','fixture','{"price":150,"costPrice":50,"isOnSale":false}','PRICE_CHANGE: bypass regression') RETURNING id INTO request_id;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',md,'role','authenticated')::text,true);
 PERFORM set_config('app.price_change_decision_id',request_id::text,true);
 BEGIN UPDATE public.products SET price=150 WHERE id=product.id; RAISE EXCEPTION 'Forged marker updated product'; EXCEPTION WHEN raise_exception THEN IF SQLERRM='Forged marker updated product' THEN RAISE; END IF; END;
 BEGIN UPDATE public.inventory_requests SET status='approved' WHERE id=request_id; RAISE EXCEPTION 'Direct request approval allowed'; EXCEPTION WHEN raise_exception THEN IF SQLERRM='Direct request approval allowed' THEN RAISE; END IF; END;
 -- Country rejection works across region, requires a reason and never applies a price.
 PERFORM public.reject_product_edit(request_id,'Pricing proposal needs revision');
 SELECT price INTO pprice FROM public.products WHERE id=product.id;
 IF pprice<>140 THEN RAISE EXCEPTION 'Rejection changed live price'; END IF;
 -- A full product form with unchanged price fields remains a normal catalog edit.
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',requester,'role','authenticated')::text,true);
 INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,requested_by,proposed_changes,adjustment_reason)
 VALUES(product.id::text,product.name,product.sku,target.id::text,target.country,'edit','pending','fixture','{"price":140,"costPrice":50,"isOnSale":false,"name":"Coffee catalog correction"}','MERCHANDISING: catalog form') RETURNING id INTO request_id;
 SELECT proposed_changes INTO snapshot FROM public.inventory_requests WHERE id=request_id;
 IF snapshot ?| ARRAY['price','costPrice','isOnSale'] OR NOT snapshot ? 'name' THEN RAISE EXCEPTION 'Unchanged form prices misclassified catalog edit: %',snapshot; END IF;
 -- Separate mixed detail edits from the price approval shortcut.
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',requester,'role','authenticated')::text,true);
 BEGIN
 INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,requested_by,proposed_changes,adjustment_reason)
 VALUES(product.id::text,product.name,product.sku,target.id::text,target.country,'edit','pending','fixture','{"price":150,"name":"Coffee changed"}','PRICE_CHANGE: mixed regression');
 RAISE EXCEPTION 'Mixed price/detail shortcut allowed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Mixed price/detail shortcut allowed' THEN RAISE; END IF; END;
 EXECUTE 'RESET ROLE';
 IF (SELECT count(*) FROM private.product_edit_votes v JOIN public.inventory_requests r ON r.id=v.request_id WHERE r.product_id=product.id::text AND r.adjustment_reason LIKE 'PRICE_CHANGE:%regression%')<>0 THEN RAISE EXCEPTION 'Price changes inserted three-way votes'; END IF;
END;
$test$;
ROLLBACK;
