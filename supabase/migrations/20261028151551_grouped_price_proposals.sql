-- One request per SKU and selected scope; private immutable site-level evidence.
CREATE TABLE private.price_proposal_targets (
 request_id uuid NOT NULL REFERENCES public.inventory_requests(id) ON DELETE CASCADE,
 product_id uuid NOT NULL REFERENCES public.products(id), site_id uuid NOT NULL REFERENCES public.sites(id),
 country_code text NOT NULL, region_code text, proposed_changes jsonb NOT NULL, pricing_baseline jsonb NOT NULL,
 PRIMARY KEY(request_id,product_id)
);
CREATE INDEX price_proposal_targets_product ON private.price_proposal_targets(product_id,request_id);
ALTER TABLE private.price_proposal_targets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.price_proposal_targets FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.price_snapshot(p public.products) RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT jsonb_build_object('price',p.price,'cost_price',p.cost_price,'sale_price',p.sale_price,'is_on_sale',p.is_on_sale);
$$;
REVOKE ALL ON FUNCTION private.price_snapshot(public.products) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.price_group_visible(p_request_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND NOT EXISTS(
 SELECT 1 FROM private.price_proposal_targets t WHERE t.request_id=p_request_id
 AND NOT (private.price_review_scope(t.site_id::text,t.country_code) OR private.merchandising_site_scope(t.site_id::text,t.country_code)));
$$;
REVOKE ALL ON FUNCTION private.price_group_visible(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.price_group_visible(uuid) TO authenticated;
CREATE POLICY grouped_price_visibility ON public.inventory_requests AS RESTRICTIVE FOR SELECT TO authenticated USING(private.price_group_visible(id));
CREATE FUNCTION private.submit_price_group(p_country text,p_changes jsonb,p_source text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; p public.products%ROWTYPE; entry jsonb; changes jsonb:='[]'; patch jsonb;
 new_id uuid; existing uuid; fingerprint text; country text:=upper(p_country); sku text; first_product public.products%ROWTYPE;
 finance_count integer:=0; next_p public.products%ROWTYPE; effective numeric;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active';
 IF actor.id IS NULL OR actor.role NOT IN ('group_ceo','country_managing_director','country_commercial_director','regional_merchandising_manager','merchandising_specialist','merchandiser') THEN
 RAISE EXCEPTION 'Active merchandising preparation authority required' USING ERRCODE='42501'; END IF;
 IF jsonb_typeof(p_changes) IS DISTINCT FROM 'array' OR jsonb_array_length(p_changes) NOT BETWEEN 1 AND 2000 THEN RAISE EXCEPTION 'Select between 1 and 2000 product locations'; END IF;
 IF (SELECT count(DISTINCT value->>'productId') FROM jsonb_array_elements(p_changes))<>jsonb_array_length(p_changes) THEN RAISE EXCEPTION 'Duplicate product locations'; END IF;
 SELECT product.sku INTO sku FROM public.products product WHERE product.id=(p_changes->0->>'productId')::uuid;
 IF sku IS NULL THEN RAISE EXCEPTION 'Product not found'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(country||':'||sku,0));
 PERFORM product.id FROM public.products product WHERE product.id IN(SELECT (value->>'productId')::uuid FROM jsonb_array_elements(p_changes)) ORDER BY product.id FOR UPDATE;
 FOR entry IN SELECT value FROM jsonb_array_elements(p_changes) ORDER BY value->>'productId' LOOP
  SELECT * INTO p FROM public.products WHERE id=(entry->>'productId')::uuid;
  IF p.id IS NULL OR p.sku IS DISTINCT FROM sku OR NOT EXISTS(SELECT 1 FROM public.sites s WHERE s.id=p.site_id AND upper(s.country)=country)
  OR NOT (private.merchandising_site_scope(p.site_id::text,country)
    OR (actor.role IN ('country_managing_director','country_commercial_director') AND private.price_review_scope(p.site_id::text,country))
    OR (actor.role='group_ceo' AND public.is_site_in_my_authorized_scope(p.site_id::text,country))) THEN
   RAISE EXCEPTION 'Every product must be the same SKU in your authorized country and territory' USING ERRCODE='42501'; END IF;
  patch:=entry->'proposal';
  IF jsonb_typeof(patch) IS DISTINCT FROM 'object' OR NOT patch ? 'price' OR EXISTS(SELECT 1 FROM jsonb_object_keys(patch) k WHERE k<>ALL(ARRAY['price','salePrice','isOnSale']))
  OR EXISTS(SELECT 1 FROM jsonb_each(patch) field WHERE field.key IN('price','salePrice') AND (jsonb_typeof(field.value)<>'number' OR (field.value::text)::numeric<>round((field.value::text)::numeric)))
  OR (patch ? 'isOnSale' AND jsonb_typeof(patch->'isOnSale')<>'boolean') THEN RAISE EXCEPTION 'Whole-number selling prices only; scoped proposals preserve recorded costs'; END IF;
  next_p:=jsonb_populate_record(p,private.product_edit_patch(patch));
  effective:=CASE WHEN next_p.is_on_sale AND next_p.sale_price>0 THEN next_p.sale_price ELSE next_p.price END;
  IF next_p.price IS NULL OR next_p.price<=0 OR p.cost_price IS NULL OR p.cost_price<=0 OR effective<=0 OR (next_p.is_on_sale AND (next_p.sale_price IS NULL OR next_p.sale_price<=0 OR next_p.sale_price>=next_p.price)) THEN RAISE EXCEPTION 'Every location needs a positive recorded cost and valid selling price'; END IF;
  IF (effective-p.cost_price)*100<effective*15 THEN finance_count:=finance_count+1; END IF;
  changes:=changes||jsonb_build_array(jsonb_build_object('productId',p.id,'siteId',p.site_id,'patch',patch,'baseline',private.price_snapshot(p)));
  IF first_product.id IS NULL THEN first_product:=p; END IF;
 END LOOP;
 fingerprint:=md5(changes::text);
 SELECT r.id INTO existing FROM public.inventory_requests r JOIN private.price_proposal_targets t ON t.request_id=r.id
 WHERE r.status='pending' AND r.requested_by_employee_id=actor.id AND r.country_code=country AND r.product_sku=sku
 GROUP BY r.id HAVING md5(jsonb_agg(jsonb_build_object('productId',t.product_id,'siteId',t.site_id,'patch',t.proposed_changes,'baseline',t.pricing_baseline) ORDER BY t.product_id::text)::text)=fingerprint LIMIT 1;
 IF existing IS NOT NULL THEN RETURN jsonb_build_object('requestId',existing,'targetCount',jsonb_array_length(changes),'financeCount',finance_count,'reused',true); END IF;
 IF EXISTS(SELECT 1 FROM public.inventory_requests r WHERE r.status='pending' AND r.change_type='edit' AND
 (r.product_id IN(SELECT value->>'productId' FROM jsonb_array_elements(changes)) OR EXISTS(SELECT 1 FROM private.price_proposal_targets t WHERE t.request_id=r.id AND t.product_id::text IN(SELECT value->>'productId' FROM jsonb_array_elements(changes))))) THEN
 RAISE EXCEPTION 'A selected product already has a pending proposal. Review it before submitting another'; END IF;
 INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,requested_by,proposed_changes,adjustment_reason)
 VALUES(first_product.id::text,first_product.name,sku,first_product.site_id::text,country,'edit','pending',actor.name,changes->0->'patch','PRICE_CHANGE: '||left(coalesce(p_source,'Scoped price change'),200)) RETURNING id INTO new_id;
 INSERT INTO private.price_proposal_targets(request_id,product_id,site_id,country_code,region_code,proposed_changes,pricing_baseline)
 SELECT new_id,(value->>'productId')::uuid,(value->>'siteId')::uuid,country,s.region_code,value->'patch',value->'baseline'
 FROM jsonb_array_elements(changes) JOIN public.sites s ON s.id=(value->>'siteId')::uuid;
 RETURN jsonb_build_object('requestId',new_id,'targetCount',jsonb_array_length(changes),'financeCount',finance_count,'reused',false);
END;
$$;
REVOKE ALL ON FUNCTION private.submit_price_group(text,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.submit_price_group(text,jsonb,text) TO authenticated;
CREATE FUNCTION public.submit_price_proposal_group(p_country text,p_changes jsonb,p_source text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.submit_price_group(p_country,p_changes,p_source); $$;
REVOKE ALL ON FUNCTION public.submit_price_proposal_group(text,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_price_proposal_group(text,jsonb,text) TO authenticated;
CREATE OR REPLACE FUNCTION private.single_price_approval_route(request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.inventory_requests%ROWTYPE; p public.products%ROWTYPE; next_p public.products%ROWTYPE;
 actor public.employees%ROWTYPE; requester_role text; snapshot jsonb; baseline jsonb;
 effective numeric; needs_finance boolean; clearance boolean; elevated boolean; self_request boolean;
 valid boolean:=true; problem text; may_approve boolean; may_finance boolean;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active';
 SELECT * INTO r FROM public.inventory_requests WHERE id=request_id;
 IF actor.id IS NULL OR r.id IS NULL OR r.change_type<>'edit' OR NOT private.is_price_change(r.proposed_changes)
 OR NOT private.price_review_scope(r.site_id,r.country_code) THEN RETURN NULL; END IF;
 SELECT * INTO p FROM public.products WHERE id::text=r.product_id AND site_id::text=r.site_id;
 IF p.id IS NULL THEN RETURN jsonb_build_object('canApprove',false,'canFinance',false,'canReject',false,'block','Product no longer exists at its requested site.'); END IF;
 SELECT role INTO requester_role FROM public.employees WHERE id=r.requested_by_employee_id;
 snapshot:=jsonb_build_object('price',p.price,'cost_price',p.cost_price,'sale_price',p.sale_price,'is_on_sale',p.is_on_sale);
 SELECT jsonb_object_agg(k,to_jsonb(p)->k) INTO baseline FROM jsonb_object_keys(private.product_edit_patch(r.proposed_changes))k;
 next_p:=jsonb_populate_record(p,private.product_edit_patch(r.proposed_changes));
 effective:=CASE WHEN next_p.is_on_sale AND next_p.sale_price>0 THEN next_p.sale_price ELSE next_p.price END;
 self_request:=coalesce(r.requested_by_employee_id=actor.id,false) OR lower(trim(coalesce(r.requested_by,''))) IN(lower(trim(actor.name)),lower(trim(coalesce(actor.email,''))),actor.id::text);
 needs_finance:=coalesce(next_p.cost_price>0 AND effective>0 AND (effective-next_p.cost_price)*100<effective*15,true);
 clearance:=EXISTS(SELECT 1 FROM private.price_change_clearances c JOIN public.employees e ON e.id=c.employee_id JOIN public.sites home ON home.id=e.site_id
 WHERE c.request_id=r.id AND c.employee_id=r.finance_approved_by_employee_id AND c.pricing_baseline=snapshot
 AND e.role='country_finance_director' AND lower(coalesce(e.status,'active'))='active' AND upper(home.country)=upper(r.country_code));
 elevated:=needs_finance OR requester_role IN ('regional_merchandising_manager','country_commercial_director')
 OR r.price_review_context->>'requesterRole' IN ('regional_merchandising_manager','country_commercial_director');
 IF r.layout_revision_id IS NOT NULL OR EXISTS(SELECT 1 FROM jsonb_object_keys(r.proposed_changes) k WHERE k<>ALL(ARRAY['price','costPrice','salePrice','isOnSale'])) THEN problem:='Submit price changes separately from product details and shelf layouts.';
 ELSIF r.product_edit_baseline IS NULL OR baseline IS DISTINCT FROM r.product_edit_baseline OR (r.price_review_context IS NOT NULL AND snapshot IS DISTINCT FROM r.price_review_context->'pricingBaseline') THEN problem:='Product pricing changed since this proposal. Submit a fresh price request.';
 ELSIF effective IS NULL OR effective<=0 OR next_p.cost_price IS NULL OR next_p.cost_price<=0 OR next_p.price<0 OR next_p.sale_price<0 THEN problem:='Positive selling price and recorded cost are required.';
 ELSIF EXISTS(SELECT 1 FROM jsonb_each(r.proposed_changes) field WHERE field.key IN ('price','costPrice','salePrice') AND (jsonb_typeof(field.value)<>'number' OR (field.value::text)::numeric<>round((field.value::text)::numeric))) THEN problem:='Prices and costs must be whole numbers.';
 END IF;
 valid:=problem IS NULL;
 may_approve:=r.status='pending' AND valid AND NOT self_request AND (NOT needs_finance OR (clearance AND r.finance_approved_by_employee_id<>actor.id))
 AND (actor.role IN ('country_commercial_director','country_managing_director') OR (actor.role='regional_merchandising_manager' AND NOT coalesce(elevated,false)));
 may_finance:=r.status='pending' AND valid AND NOT self_request AND needs_finance AND NOT clearance AND actor.role='country_finance_director';
 IF problem IS NULL THEN
  IF r.status<>'pending' THEN problem:='This proposal is no longer pending.';
  ELSIF self_request THEN problem:='You cannot approve a proposal you requested.';
  ELSIF needs_finance AND NOT clearance THEN problem:='Country Finance Director clearance is required before country commercial approval.';
  ELSIF actor.role='country_finance_director' THEN problem:='Finance provides clearance; final approval requires a separate commercial approver.';
  ELSIF coalesce(elevated,false) AND actor.role='regional_merchandising_manager' THEN problem:='Country Commercial Director or Country Managing Director approval is required.';
  END IF;
 END IF;
 RETURN jsonb_build_object('canApprove',coalesce(may_approve,false),'canFinance',coalesce(may_finance,false),
 'canReject',r.status='pending' AND NOT self_request AND actor.role IN ('regional_merchandising_manager','country_commercial_director','country_managing_director'),
 'requiresFinance',needs_finance,'financeCleared',clearance,'requiresCountry',coalesce(elevated,false),
 'workflow','price','block',problem,'valid',valid,'pricingBaseline',snapshot);
END;
$function$
;
REVOKE ALL ON FUNCTION private.single_price_approval_route(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.price_approval_route(request_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.inventory_requests%ROWTYPE; actor public.employees%ROWTYPE; base jsonb; t record; next_p public.products%ROWTYPE;
 snapshot jsonb:='[]'; problem text; needs_finance boolean:=false; cleared boolean; elevated boolean; effective numeric; margin numeric;
 min_margin numeric; regions text[]; target_count integer; self_request boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM private.price_proposal_targets WHERE price_proposal_targets.request_id=price_approval_route.request_id) THEN RETURN private.single_price_approval_route(request_id); END IF;
 IF NOT private.price_group_visible(request_id) THEN RETURN NULL; END IF;
 base:=private.single_price_approval_route(request_id);
 IF base IS NULL THEN RETURN NULL; END IF;
 SELECT * INTO r FROM public.inventory_requests WHERE id=request_id;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active';
 FOR t IN SELECT target.*,p AS product FROM private.price_proposal_targets target LEFT JOIN public.products p ON p.id=target.product_id WHERE target.request_id=r.id ORDER BY target.product_id LOOP
  IF (t.product).id IS NULL OR (t.product).site_id IS DISTINCT FROM t.site_id OR (t.product).sku IS DISTINCT FROM r.product_sku
   OR NOT private.price_review_scope(t.site_id::text,t.country_code) THEN RETURN NULL; END IF;
  snapshot:=snapshot||jsonb_build_array(jsonb_build_object('productId',t.product_id,'baseline',private.price_snapshot(t.product)));
  IF private.price_snapshot(t.product) IS DISTINCT FROM t.pricing_baseline THEN problem:='A location price or cost changed since submission. Submit a fresh scoped proposal.'; END IF;
  next_p:=jsonb_populate_record(t.product,private.product_edit_patch(t.proposed_changes));
  effective:=CASE WHEN next_p.is_on_sale AND next_p.sale_price>0 THEN next_p.sale_price ELSE next_p.price END;
  IF effective IS NULL OR effective<=0 OR next_p.cost_price IS NULL OR next_p.cost_price<=0 THEN problem:='Every location needs positive selling price and recorded cost';
  ELSE margin:=(effective-next_p.cost_price)*100/effective; min_margin:=least(min_margin,margin); needs_finance:=needs_finance OR margin<15; END IF;
 END LOOP;
 SELECT count(*),array_agg(DISTINCT region_code ORDER BY region_code) INTO target_count,regions FROM private.price_proposal_targets WHERE price_proposal_targets.request_id=r.id;
 self_request:=r.requested_by_employee_id=actor.id;
 elevated:=needs_finance OR cardinality(regions)>1 OR EXISTS(SELECT 1 FROM public.employees WHERE id=r.requested_by_employee_id AND role IN('regional_merchandising_manager','country_commercial_director'))
 OR r.price_review_context->>'requesterRole' IN('regional_merchandising_manager','country_commercial_director');
 cleared:=EXISTS(SELECT 1 FROM private.price_change_clearances c JOIN public.employees e ON e.id=c.employee_id JOIN public.sites home ON home.id=e.site_id
 WHERE c.request_id=r.id AND c.employee_id=r.finance_approved_by_employee_id AND c.pricing_baseline=snapshot AND e.role='country_finance_director' AND lower(coalesce(e.status,'active'))='active' AND upper(home.country)=r.country_code);
 IF NOT coalesce((base->>'valid')::boolean,false) THEN problem:=base->>'block'; END IF;
 base:=base||jsonb_build_object('canApprove',problem IS NULL AND r.status='pending' AND NOT self_request AND (NOT needs_finance OR (cleared AND r.finance_approved_by_employee_id<>actor.id))
 AND (actor.role IN('country_commercial_director','country_managing_director') OR (actor.role='regional_merchandising_manager' AND NOT coalesce(elevated,false))),
 'canFinance',problem IS NULL AND r.status='pending' AND NOT self_request AND needs_finance AND NOT cleared AND actor.role='country_finance_director',
 'canReject',r.status='pending' AND NOT self_request AND actor.role IN('country_commercial_director','country_managing_director','regional_merchandising_manager'),
 'requiresFinance',needs_finance,'financeCleared',cleared,'requiresCountry',coalesce(elevated,false),'pricingBaseline',snapshot,
 'valid',problem IS NULL,'targetCount',target_count,'regionCodes',regions,'minMarginPct',round(min_margin),
 'scopeLabel',CASE WHEN cardinality(regions)>1 THEN 'Country scope · '||r.country_code ELSE 'Regional scope · '||coalesce(regions[1],r.country_code) END);
 IF problem IS NULL THEN
  IF r.status<>'pending' THEN problem:='This proposal is no longer pending.';
  ELSIF self_request THEN problem:='You cannot approve a proposal you requested.';
  ELSIF needs_finance AND NOT cleared THEN problem:='Country Finance Director clearance is required for this scope.';
  ELSIF actor.role='country_finance_director' THEN problem:='Finance clearance requires a separate final commercial approver.';
  ELSIF elevated AND actor.role='regional_merchandising_manager' THEN problem:='Country Commercial Director or Country Managing Director approval is required.'; END IF;
 END IF;
 RETURN base||jsonb_build_object('block',problem);
END;
$$;
-- Existing authenticated entry points dispatch here; target writes require private evidence.
CREATE OR REPLACE FUNCTION private.price_decision_matches(product_id uuid,site_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.inventory_requests r JOIN private.price_change_decisions d ON d.request_id=r.id
 WHERE r.id::text=current_setting('app.price_change_decision_id',true) AND r.status='pending' AND d.employee_id=auth.uid() AND d.proposed_changes=r.proposed_changes
 AND ((r.product_id=price_decision_matches.product_id::text AND r.site_id=price_decision_matches.site_id::text)
 OR EXISTS(SELECT 1 FROM private.price_proposal_targets t WHERE t.request_id=r.id AND t.product_id=price_decision_matches.product_id AND t.site_id=price_decision_matches.site_id)));
$$;
CREATE OR REPLACE FUNCTION private.single_approve_price_change(request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.inventory_requests%ROWTYPE; p public.products%ROWTYPE; actor public.employees%ROWTYPE; route jsonb; updated public.products%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.inventory_requests WHERE id=request_id FOR UPDATE;
 SELECT * INTO p FROM public.products WHERE id::text=r.product_id AND site_id::text=r.site_id FOR UPDATE;
 route:=private.price_approval_route(request_id);
 IF NOT coalesce((route->>'canApprove')::boolean,false) THEN RAISE EXCEPTION '%',coalesce(route->>'block','Price approval is outside your country, region or role') USING ERRCODE='42501'; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid();
 INSERT INTO private.price_change_decisions(request_id,employee_id,role,pricing_baseline,proposed_changes)
 VALUES(r.id,actor.id,actor.role,route->'pricingBaseline',r.proposed_changes);
 PERFORM set_config('app.price_change_decision_id',r.id::text,true);
 updated:=jsonb_populate_record(p,private.product_edit_patch(r.proposed_changes));
 UPDATE public.products SET price=updated.price,cost_price=updated.cost_price,sale_price=updated.sale_price,is_on_sale=updated.is_on_sale WHERE id=p.id;
 UPDATE public.inventory_requests SET status='approved',approved_by=actor.name,approved_at=now() WHERE id=r.id;
 PERFORM set_config('app.price_change_decision_id','',true);
 INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('PRICE_CHANGE_APPROVED','Merchandising',actor.name,actor.id,p.site_id,r.country_code,'inventory_request',r.id::text,
 jsonb_build_object('role',actor.role,'requiresFinance',route->'requiresFinance','financeApprover',r.finance_approved_by_employee_id,'proposedChanges',r.proposed_changes));
 RETURN jsonb_build_object('applied',true,'approvalCount',1,'workflow','price');
END;
$function$
;
REVOKE ALL ON FUNCTION private.single_approve_price_change(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.single_clear_price_change_finance(request_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.inventory_requests%ROWTYPE; route jsonb;
BEGIN
 SELECT * INTO r FROM public.inventory_requests WHERE id=request_id FOR UPDATE;
 PERFORM id FROM public.products WHERE id::text=r.product_id AND site_id::text=r.site_id FOR UPDATE;
 route:=private.price_approval_route(request_id);
 IF NOT coalesce((route->>'canFinance')::boolean,false) THEN RAISE EXCEPTION '%',coalesce(route->>'block','Country Finance Director clearance authority required') USING ERRCODE='42501'; END IF;
 INSERT INTO private.price_change_clearances(request_id,employee_id,pricing_baseline) VALUES(r.id,auth.uid(),route->'pricingBaseline')
 ON CONFLICT ON CONSTRAINT price_change_clearances_pkey DO UPDATE SET employee_id=excluded.employee_id,pricing_baseline=excluded.pricing_baseline,cleared_at=now();
 PERFORM set_config('app.merchandising_finance_signoff_id',r.id::text,true);
 UPDATE public.inventory_requests SET finance_approved_by_employee_id=auth.uid(),finance_approved_at=now() WHERE id=r.id;
 PERFORM set_config('app.merchandising_finance_signoff_id','',true);
 INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
 SELECT 'PRICE_FINANCE_CLEARED','Merchandising',e.name,e.id,r.site_id::uuid,r.country_code,'inventory_request',r.id::text,jsonb_build_object('role',e.role)
 FROM public.employees e WHERE e.id=auth.uid();
END;
$function$
;
REVOKE ALL ON FUNCTION private.single_clear_price_change_finance(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.approve_price_change(request_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.inventory_requests%ROWTYPE; route jsonb; t record; next_p public.products%ROWTYPE; actor public.employees%ROWTYPE;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM private.price_proposal_targets WHERE price_proposal_targets.request_id=approve_price_change.request_id) THEN RETURN private.single_approve_price_change(request_id); END IF;
 SELECT * INTO r FROM public.inventory_requests WHERE id=request_id FOR UPDATE;
 PERFORM p.id FROM public.products p JOIN private.price_proposal_targets t ON t.product_id=p.id WHERE t.request_id=r.id ORDER BY p.id FOR UPDATE OF p;
 route:=private.price_approval_route(request_id);
 IF NOT coalesce((route->>'canApprove')::boolean,false) THEN RAISE EXCEPTION '%',coalesce(route->>'block','Scoped price approval denied') USING ERRCODE='42501'; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid();
 INSERT INTO private.price_change_decisions(request_id,employee_id,role,pricing_baseline,proposed_changes) VALUES(r.id,actor.id,actor.role,route->'pricingBaseline',r.proposed_changes);
 PERFORM set_config('app.price_change_decision_id',r.id::text,true);
 FOR t IN SELECT target.*,p AS product FROM private.price_proposal_targets target JOIN public.products p ON p.id=target.product_id WHERE target.request_id=r.id ORDER BY target.product_id LOOP
  next_p:=jsonb_populate_record(t.product,private.product_edit_patch(t.proposed_changes));
  UPDATE public.products SET price=next_p.price,sale_price=next_p.sale_price,is_on_sale=next_p.is_on_sale WHERE id=t.product_id;
 END LOOP;
 UPDATE public.inventory_requests SET status='approved',approved_by=actor.name,approved_at=now() WHERE id=r.id;
 PERFORM set_config('app.price_change_decision_id','',true);
 INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('SCOPED_PRICE_CHANGE_APPROVED','Merchandising',actor.name,actor.id,r.site_id::uuid,r.country_code,'inventory_request',r.id::text,route-ARRAY['pricingBaseline','block']);
 RETURN jsonb_build_object('applied',true,'approvalCount',1,'workflow','price','targetCount',route->'targetCount');
END;
$$;
CREATE OR REPLACE FUNCTION private.clear_price_change_finance(request_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.inventory_requests%ROWTYPE; route jsonb;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM private.price_proposal_targets WHERE price_proposal_targets.request_id=clear_price_change_finance.request_id) THEN PERFORM private.single_clear_price_change_finance(request_id); RETURN; END IF;
 SELECT * INTO r FROM public.inventory_requests WHERE id=request_id FOR UPDATE;
 PERFORM p.id FROM public.products p JOIN private.price_proposal_targets t ON t.product_id=p.id WHERE t.request_id=r.id ORDER BY p.id FOR UPDATE OF p;
 route:=private.price_approval_route(request_id);
 IF NOT coalesce((route->>'canFinance')::boolean,false) THEN RAISE EXCEPTION '%',coalesce(route->>'block','Scoped Finance clearance denied') USING ERRCODE='42501'; END IF;
 INSERT INTO private.price_change_clearances(request_id,employee_id,pricing_baseline) VALUES(r.id,auth.uid(),route->'pricingBaseline')
 ON CONFLICT ON CONSTRAINT price_change_clearances_pkey DO UPDATE SET employee_id=excluded.employee_id,pricing_baseline=excluded.pricing_baseline,cleared_at=now();
 PERFORM set_config('app.merchandising_finance_signoff_id',r.id::text,true);
 UPDATE public.inventory_requests SET finance_approved_by_employee_id=auth.uid(),finance_approved_at=now() WHERE id=r.id;
 PERFORM set_config('app.merchandising_finance_signoff_id','',true);
 INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
 SELECT 'SCOPED_PRICE_FINANCE_CLEARED','Merchandising',e.name,e.id,r.site_id::uuid,r.country_code,'inventory_request',r.id::text,jsonb_build_object('targetCount',route->'targetCount') FROM public.employees e WHERE e.id=auth.uid();
END;
$$;
CREATE FUNCTION private.list_price_group_targets(p_request_id uuid,p_offset integer,p_limit integer) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT private.price_group_visible(p_request_id) OR NOT EXISTS(SELECT 1 FROM public.inventory_requests r WHERE r.id=p_request_id
 AND (private.price_review_scope(r.site_id,r.country_code) OR private.merchandising_site_scope(r.site_id,r.country_code))) THEN RAISE EXCEPTION 'Scoped price review denied' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(row_data),'[]') INTO result FROM (
 SELECT jsonb_build_object('productId',t.product_id,'siteId',s.id,'siteCode',s.code,'siteName',s.name,'regionCode',s.region_code,'baseline',t.pricing_baseline,'proposal',t.proposed_changes) row_data
 FROM private.price_proposal_targets t JOIN public.sites s ON s.id=t.site_id WHERE t.request_id=p_request_id ORDER BY s.code,t.product_id OFFSET greatest(0,p_offset) LIMIT least(100,greatest(1,p_limit))) rows;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION private.list_price_group_targets(uuid,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.list_price_group_targets(uuid,integer,integer) TO authenticated;
CREATE FUNCTION public.list_price_proposal_targets(p_request_id uuid,p_offset integer DEFAULT 0,p_limit integer DEFAULT 25) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$ SELECT private.list_price_group_targets(p_request_id,p_offset,p_limit); $$;
REVOKE ALL ON FUNCTION public.list_price_proposal_targets(uuid,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_price_proposal_targets(uuid,integer,integer) TO authenticated;
