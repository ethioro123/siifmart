CREATE OR REPLACE FUNCTION private.price_group_visible(p_request_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT auth.uid() IS NOT NULL AND NOT EXISTS(
 SELECT 1 FROM private.price_proposal_targets t WHERE t.request_id=p_request_id
 AND NOT (private.price_review_scope(t.site_id::text,t.country_code) OR private.merchandising_site_scope(t.site_id::text,t.country_code)
 OR EXISTS(SELECT 1 FROM public.employees e WHERE e.id=auth.uid() AND e.role='group_ceo' AND lower(coalesce(e.status,'active'))='active' AND public.is_site_in_my_authorized_scope(t.site_id::text,t.country_code))));
$$;
CREATE OR REPLACE FUNCTION private.price_approval_route(request_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.inventory_requests%ROWTYPE; actor public.employees%ROWTYPE; base jsonb; t record; next_p public.products%ROWTYPE;
 snapshot jsonb:='[]'; problem text; needs_finance boolean:=false; cleared boolean; elevated boolean; effective numeric; margin numeric;
 min_margin numeric; regions text[]; target_count integer; self_request boolean;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM private.price_proposal_targets WHERE price_proposal_targets.request_id=price_approval_route.request_id) THEN RETURN private.single_price_approval_route(request_id); END IF;
 IF NOT private.price_group_visible(request_id) THEN RETURN NULL; END IF;
 base:=private.single_price_approval_route(request_id);
 IF base IS NULL THEN
  base:=jsonb_build_object('valid',true,'canApprove',false,'canFinance',false,'canReject',false);
 END IF;
 SELECT * INTO r FROM public.inventory_requests WHERE id=request_id;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active';
 FOR t IN SELECT target.*,p AS product FROM private.price_proposal_targets target LEFT JOIN public.products p ON p.id=target.product_id WHERE target.request_id=r.id ORDER BY target.product_id LOOP
  IF (t.product).id IS NULL OR (t.product).site_id IS DISTINCT FROM t.site_id OR (t.product).sku IS DISTINCT FROM r.product_sku
   OR NOT (private.price_review_scope(t.site_id::text,t.country_code) OR private.merchandising_site_scope(t.site_id::text,t.country_code) OR (actor.role='group_ceo' AND public.is_site_in_my_authorized_scope(t.site_id::text,t.country_code))) THEN RETURN NULL; END IF;
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
CREATE OR REPLACE FUNCTION private.list_price_group_targets(p_request_id uuid,p_offset integer,p_limit integer) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT private.price_group_visible(p_request_id) OR NOT EXISTS(SELECT 1 FROM public.inventory_requests r WHERE r.id=p_request_id
 AND (private.price_review_scope(r.site_id,r.country_code) OR private.merchandising_site_scope(r.site_id,r.country_code) OR EXISTS(SELECT 1 FROM public.employees e WHERE e.id=auth.uid() AND e.role='group_ceo' AND lower(coalesce(e.status,'active'))='active' AND public.is_site_in_my_authorized_scope(r.site_id,r.country_code)))) THEN RAISE EXCEPTION 'Scoped price review denied' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(row_data),'[]') INTO result FROM (
 SELECT jsonb_build_object('productId',t.product_id,'siteId',s.id,'siteCode',s.code,'siteName',s.name,'regionCode',s.region_code,'baseline',t.pricing_baseline,'proposal',t.proposed_changes) row_data
 FROM private.price_proposal_targets t JOIN public.sites s ON s.id=t.site_id WHERE t.request_id=p_request_id ORDER BY s.code,t.product_id OFFSET greatest(0,p_offset) LIMIT least(100,greatest(1,p_limit))) rows;
 RETURN result;
END;
$$;
