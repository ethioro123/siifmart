-- All fixtures, decisions, price history and logs roll back.
BEGIN;
DO $test$
DECLARE maker uuid; commercial uuid; finance uuid; regional uuid; foreign_actor uuid; md uuid; other_product public.products%ROWTYPE; old_price numeric;
 a public.products%ROWTYPE; b public.products%ROWTYPE; payload jsonb; result jsonb; rid uuid; route jsonb; before_count bigint;
BEGIN
 SELECT e.id INTO maker FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='merchandising_specialist' AND s.country='ET' AND e.region_code='ADD' AND lower(e.status)='active' LIMIT 1;
 SELECT e.id INTO commercial FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='country_commercial_director' AND s.country='ET' AND lower(e.status)='active' LIMIT 1;
 SELECT e.id INTO finance FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='country_finance_director' AND s.country='ET' AND lower(e.status)='active' LIMIT 1;
 SELECT e.id INTO regional FROM public.employees e WHERE e.role='regional_merchandising_manager' AND e.region_code='ADD' AND lower(e.status)='active' LIMIT 1;
 SELECT e.id INTO md FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='country_managing_director' AND s.country='ET' AND lower(e.status)='active' LIMIT 1;
 SELECT e.id INTO foreign_actor FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='country_commercial_director' AND s.country='KE' AND lower(e.status)='active' LIMIT 1;
 SELECT p.* INTO a FROM public.products p JOIN public.sites s ON s.id=p.site_id WHERE s.country='ET' AND s.region_code='ADD' AND p.cost_price>0 AND p.price>0
 AND NOT EXISTS(SELECT 1 FROM public.inventory_requests r WHERE r.product_id=p.id::text AND r.status='pending')
 AND EXISTS(SELECT 1 FROM public.products other JOIN public.sites os ON os.id=other.site_id WHERE other.sku=p.sku AND other.id<>p.id AND os.country='ET' AND os.region_code='ADD' AND other.cost_price>0 AND other.price>0
 AND NOT EXISTS(SELECT 1 FROM public.inventory_requests r WHERE r.product_id=other.id::text AND r.status='pending')) ORDER BY p.id LIMIT 1;
 SELECT p.* INTO b FROM public.products p JOIN public.sites s ON s.id=p.site_id WHERE p.sku=a.sku AND p.id<>a.id AND s.country='ET' AND s.region_code='ADD' AND p.cost_price>0 AND p.price>0
 AND NOT EXISTS(SELECT 1 FROM public.inventory_requests r WHERE r.product_id=p.id::text AND r.status='pending') ORDER BY p.id LIMIT 1;
 IF maker IS NULL OR commercial IS NULL OR a.id IS NULL OR b.id IS NULL OR finance IS NULL OR regional IS NULL OR foreign_actor IS NULL THEN RAISE EXCEPTION 'Grouped regression fixtures missing'; END IF;
 payload:=jsonb_build_array(jsonb_build_object('productId',a.id,'proposal',jsonb_build_object('price',ceil(a.cost_price*2)+7,'isOnSale',false)),jsonb_build_object('productId',b.id,'proposal',jsonb_build_object('price',ceil(b.cost_price*2)+7,'isOnSale',false)));
 SELECT count(*) INTO before_count FROM public.inventory_requests;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',maker,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 result:=public.submit_price_proposal_group('ET',payload,'Grouped regression');rid:=(result->>'requestId')::uuid;
 IF (result->>'targetCount')::integer<>2 THEN RAISE EXCEPTION 'Expected two targets'; END IF;
 IF (public.submit_price_proposal_group('ET',payload,'Retry')->>'requestId')::uuid<>rid THEN RAISE EXCEPTION 'Retry duplicated proposal'; END IF;
 BEGIN PERFORM public.approve_product_edit(rid);RAISE EXCEPTION 'Self approval passed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 EXECUTE 'RESET ROLE';
 IF (SELECT count(*) FROM public.inventory_requests)<>before_count+1 THEN RAISE EXCEPTION 'Expected ONE proposal';END IF;
 IF (SELECT count(*) FROM private.price_proposal_targets WHERE request_id=rid)<>2 THEN RAISE EXCEPTION 'Expected private target evidence';END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',foreign_actor,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 IF EXISTS(SELECT 1 FROM public.inventory_requests WHERE id=rid) THEN RAISE EXCEPTION 'Foreign country read group';END IF;
 BEGIN PERFORM public.list_price_proposal_targets(rid);RAISE EXCEPTION 'Foreign target leak';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.submit_price_proposal_group('ET',payload,'Foreign');RAISE EXCEPTION 'Foreign submission allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 EXECUTE 'RESET ROLE';
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',regional,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 route:=public.get_price_approval_routes(ARRAY[rid])->rid::text;
 IF NOT (route->>'canApprove')::boolean OR (route->>'targetCount')::integer<>2 THEN RAISE EXCEPTION 'Regional grouped routing failed: %',route; END IF;
 IF jsonb_array_length(public.list_price_proposal_targets(rid,0,1))<>1 THEN RAISE EXCEPTION 'Pagination failed';END IF;
 PERFORM public.approve_product_edit(rid);
 EXECUTE 'RESET ROLE';
 IF (SELECT price FROM public.products WHERE id=a.id)<>ceil(a.cost_price*2)+7 OR (SELECT price FROM public.products WHERE id=b.id)<>ceil(b.cost_price*2)+7 THEN RAISE EXCEPTION 'Atomic group did not apply';END IF;
 IF (SELECT count(*) FROM public.product_price_history WHERE request_id=rid)<>2 THEN RAISE EXCEPTION 'Per-location audit missing';END IF;
 -- Below-floor target escalates the WHOLE proposal through Finance, then independent Commercial.
 payload:=jsonb_build_array(jsonb_build_object('productId',a.id,'proposal',jsonb_build_object('price',ceil(a.cost_price),'isOnSale',false)),jsonb_build_object('productId',b.id,'proposal',jsonb_build_object('price',ceil(b.cost_price*2)+9,'isOnSale',false)));
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',maker,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 result:=public.submit_price_proposal_group('ET',payload,'Below floor group');rid:=(result->>'requestId')::uuid;
 EXECUTE 'RESET ROLE';
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',commercial,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 BEGIN PERFORM public.approve_product_edit(rid);RAISE EXCEPTION 'Skipped Finance';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 EXECUTE 'RESET ROLE';
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',finance,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';PERFORM public.finance_signoff_merchandising_price(rid);EXECUTE 'RESET ROLE';
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',commercial,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';PERFORM public.approve_product_edit(rid);EXECUTE 'RESET ROLE';
 -- One country-level proposal across two regions; region managers must not receive a partial group.
 SELECT p.* INTO other_product FROM public.products p JOIN public.sites s ON s.id=p.site_id WHERE p.sku=a.sku AND s.country='ET' AND s.region_code<>'ADD' AND p.price>0 AND p.cost_price>0
 AND NOT EXISTS(SELECT 1 FROM public.inventory_requests r WHERE r.product_id=p.id::text AND r.status='pending') ORDER BY p.id LIMIT 1;
 IF other_product.id IS NULL OR md IS NULL THEN RAISE EXCEPTION 'Missing cross-region fixtures';END IF;
 payload:=jsonb_build_array(jsonb_build_object('productId',a.id,'proposal',jsonb_build_object('price',ceil(a.cost_price*2)+13,'isOnSale',false)),jsonb_build_object('productId',other_product.id,'proposal',jsonb_build_object('price',ceil(other_product.cost_price*2)+13,'isOnSale',false)));
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',commercial,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';result:=public.submit_price_proposal_group('ET',payload,'Country regression');rid:=(result->>'requestId')::uuid;
 BEGIN PERFORM public.approve_product_edit(rid);RAISE EXCEPTION 'Country self approval passed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 EXECUTE 'RESET ROLE';
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',regional,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 IF EXISTS(SELECT 1 FROM public.inventory_requests WHERE id=rid) THEN RAISE EXCEPTION 'Regional actor saw partial country scope';END IF;
 BEGIN PERFORM public.list_price_proposal_targets(rid);RAISE EXCEPTION 'Regional target leak';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.submit_price_proposal_group('ET',payload,'Overreach');RAISE EXCEPTION 'Regional country submission passed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 EXECUTE 'RESET ROLE';
 -- Force baseline drift in rollback-only private evidence: no target may be changed on approval failure.
 UPDATE private.price_proposal_targets SET pricing_baseline=pricing_baseline||'{"price":-1}' WHERE request_id=rid AND product_id=other_product.id;
 SELECT price INTO old_price FROM public.products WHERE id=a.id;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',md,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 route:=public.get_price_approval_routes(ARRAY[rid])->rid::text;
 IF (route->>'valid')::boolean THEN RAISE EXCEPTION 'Stale target baseline accepted';END IF;
 BEGIN PERFORM public.approve_product_edit(rid);RAISE EXCEPTION 'Stale group approved';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 EXECUTE 'RESET ROLE';
 IF (SELECT price FROM public.products WHERE id=a.id)<>old_price THEN RAISE EXCEPTION 'Group partially applied';END IF;
 UPDATE private.price_proposal_targets target SET pricing_baseline=private.price_snapshot(p) FROM public.products p WHERE target.request_id=rid AND target.product_id=p.id;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',md,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';PERFORM public.approve_product_edit(rid);EXECUTE 'RESET ROLE';
 IF (SELECT count(*) FROM public.product_price_history WHERE request_id=rid)<>2 THEN RAISE EXCEPTION 'Country per-location audit missing';END IF;
END;
$test$;
ROLLBACK;
