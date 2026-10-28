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
   OR NOT (private.price_review_scope(t.site_id::text,t.country_code) OR private.merchandising_site_scope(t.site_id::text,t.country_code)) THEN RETURN NULL; END IF;
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
-- Individual request paths cannot create a competing edit for a grouped target.
CREATE FUNCTION private.guard_pending_price_group() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE sku text; country text;
BEGIN
 IF NEW.change_type<>'edit' OR NEW.status<>'pending' THEN RETURN NEW; END IF;
 SELECT p.sku,upper(s.country) INTO sku,country FROM public.products p JOIN public.sites s ON s.id=p.site_id WHERE p.id::text=NEW.product_id AND s.id::text=NEW.site_id;
 IF sku IS NULL THEN RETURN NEW; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(country||':'||sku,0));
 IF EXISTS(SELECT 1 FROM private.price_proposal_targets t JOIN public.inventory_requests r ON r.id=t.request_id WHERE t.product_id::text=NEW.product_id AND r.status='pending') THEN RAISE EXCEPTION 'This product already belongs to a pending scoped price proposal'; END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_pending_price_group() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_pending_price_group BEFORE INSERT ON public.inventory_requests FOR EACH ROW EXECUTE FUNCTION private.guard_pending_price_group();
CREATE OR REPLACE FUNCTION public.record_product_effective_price_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    request public.inventory_requests%ROWTYPE; history_id uuid; target_currency text;
    v_old_effective numeric;
    v_new_effective numeric;
    v_country text;
    v_actor_name text;
BEGIN
    v_old_effective := CASE WHEN OLD.is_on_sale IS TRUE AND COALESCE(OLD.sale_price, 0) > 0 THEN OLD.sale_price ELSE OLD.price END;
    v_new_effective := CASE WHEN NEW.is_on_sale IS TRUE AND COALESCE(NEW.sale_price, 0) > 0 THEN NEW.sale_price ELSE NEW.price END;
    IF (OLD.price,OLD.cost_price,OLD.sale_price,OLD.is_on_sale) IS NOT DISTINCT FROM (NEW.price,NEW.cost_price,NEW.sale_price,NEW.is_on_sale) OR NEW.site_id IS NULL THEN
        RETURN NEW;
    END IF;
    SELECT upper(s.country) INTO v_country FROM public.sites s WHERE s.id = NEW.site_id;
    IF v_country IS NULL THEN
        RAISE EXCEPTION 'Cannot record product price history without a valid site country';
    END IF;
    SELECT e.name INTO v_actor_name FROM public.employees e WHERE e.id = auth.uid() LIMIT 1;
    SELECT * INTO request FROM public.inventory_requests r WHERE r.id::text=nullif(current_setting('app.price_change_decision_id',true),'')
       OR r.id::text=nullif(current_setting('app.product_edit_decision_id',true),'') ORDER BY r.id LIMIT 1;
    IF request.id IS NOT NULL AND EXISTS(SELECT 1 FROM private.price_proposal_targets t WHERE t.request_id=request.id AND t.product_id=NEW.id) THEN
      SELECT t.proposed_changes,
        jsonb_build_object('pricingBaseline',t.pricing_baseline,'groupRequestId',request.id,'targetProductId',NEW.id),
        (SELECT jsonb_object_agg(k,t.pricing_baseline->k) FROM jsonb_object_keys(private.product_edit_patch(t.proposed_changes))k)
      INTO request.proposed_changes,request.price_review_context,request.product_edit_baseline
      FROM private.price_proposal_targets t WHERE t.request_id=request.id AND t.product_id=NEW.id;
    END IF;
    SELECT coalesce(reg.default_currency,CASE v_country WHEN 'ET' THEN 'ETB' WHEN 'KE' THEN 'KES' END) INTO target_currency
    FROM public.sites site LEFT JOIN public.regions reg ON reg.code=site.region_code WHERE site.id=NEW.site_id;
    INSERT INTO public.product_price_history (
        product_id, site_id, country_code, product_name, sku,
        old_regular_price, new_regular_price, old_sale_price, new_sale_price,
        old_is_on_sale, new_is_on_sale, old_effective_price, new_effective_price,
        actor_id, actor_name, changed_at,request_id,currency,reason,requester_name,finance_approver_name
    ) VALUES (
        NEW.id, NEW.site_id, v_country, NEW.name, NEW.sku,
        OLD.price, NEW.price, OLD.sale_price, NEW.sale_price,
        COALESCE(OLD.is_on_sale, false), COALESCE(NEW.is_on_sale, false),
        v_old_effective, v_new_effective, auth.uid(),
        COALESCE(v_actor_name, auth.jwt() ->> 'email', 'System update'), now(),request.id,target_currency,request.adjustment_reason,request.requested_by,
        (SELECT name FROM public.employees WHERE id=request.finance_approved_by_employee_id)
    ) RETURNING id INTO history_id;
    INSERT INTO private.product_price_evidence(history_id,evidence) VALUES(history_id,jsonb_build_object(
      'requestId',request.id,'requesterId',request.requested_by_employee_id,'requester',request.requested_by,
      'approverId',auth.uid(),'approver',v_actor_name,'financeApproverId',request.finance_approved_by_employee_id,
      'financeClearedAt',request.finance_approved_at,'reason',request.adjustment_reason,'currency',target_currency,
      'oldCost',OLD.cost_price,'newCost',NEW.cost_price,
      'oldMarginPct',CASE WHEN v_old_effective>0 THEN round((v_old_effective-OLD.cost_price)*100/v_old_effective) END,
      'newMarginPct',CASE WHEN v_new_effective>0 THEN round((v_new_effective-NEW.cost_price)*100/v_new_effective) END,
      'pricingBaseline',request.price_review_context,'proposalBaseline',request.product_edit_baseline,'proposedChanges',request.proposed_changes,
      'effectiveAt',now()));
    RETURN NEW;
END;
$function$
;
