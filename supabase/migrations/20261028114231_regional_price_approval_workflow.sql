BEGIN;
-- Price-only changes use one independent commercial approval, plus country Finance below 15%.
ALTER TABLE public.inventory_requests ADD COLUMN price_review_context jsonb;
CREATE TABLE private.price_change_clearances (
 request_id uuid PRIMARY KEY REFERENCES public.inventory_requests(id) ON DELETE CASCADE,
 employee_id uuid NOT NULL REFERENCES public.employees(id), pricing_baseline jsonb NOT NULL,
 cleared_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE private.price_change_decisions (
 request_id uuid PRIMARY KEY REFERENCES public.inventory_requests(id) ON DELETE CASCADE,
 employee_id uuid NOT NULL REFERENCES public.employees(id), role text NOT NULL,
 pricing_baseline jsonb NOT NULL, proposed_changes jsonb NOT NULL,
 decided_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.price_change_clearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.price_change_decisions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.price_change_clearances,private.price_change_decisions FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.is_price_change(proposal jsonb) RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT coalesce(jsonb_typeof(proposal)='object' AND proposal ?| ARRAY['price','costPrice','salePrice','isOnSale'],false);
$$;
CREATE FUNCTION private.price_review_scope(target_site text,target_country text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.employees e JOIN public.sites home ON home.id=e.site_id JOIN public.sites target ON target.id::text=target_site
 WHERE e.id=auth.uid() AND lower(coalesce(e.status,'active'))='active'
 AND upper(home.country)=upper(target.country) AND upper(target.country)=upper(target_country)
 AND (e.role IN ('country_commercial_director','country_managing_director','country_finance_director')
 OR (e.role='regional_merchandising_manager' AND lower(coalesce(e.region_code,home.region_code))=lower(target.region_code))));
$$;
REVOKE ALL ON FUNCTION private.is_price_change(jsonb),private.price_review_scope(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.is_price_change(jsonb),private.price_review_scope(text,text) TO authenticated;
CREATE POLICY price_workflow_read ON public.inventory_requests FOR SELECT TO authenticated
 USING(change_type='edit' AND private.is_price_change(proposed_changes) AND private.price_review_scope(site_id,country_code));
CREATE POLICY price_workflow_prepare ON public.inventory_requests FOR INSERT TO authenticated
 WITH CHECK(change_type='edit' AND status='pending' AND private.is_price_change(proposed_changes)
 AND private.price_review_scope(site_id,country_code) AND public.get_my_role() IN ('country_commercial_director','country_managing_director','regional_merchandising_manager'));
CREATE POLICY price_workflow_products_read ON public.products FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.sites s WHERE s.id=products.site_id AND private.price_review_scope(s.id::text,s.country)));
CREATE FUNCTION private.price_approval_route(request_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
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
$$;
REVOKE ALL ON FUNCTION private.price_approval_route(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.price_approval_route(uuid) TO authenticated;
CREATE FUNCTION public.get_price_approval_routes(p_request_ids uuid[]) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL OR coalesce(array_length(p_request_ids,1),0)>100 THEN RAISE EXCEPTION 'Authenticated bounded price review required' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_object_agg(id::text,route-'pricingBaseline'),'{}') INTO result
 FROM (SELECT id,private.price_approval_route(id) route FROM unnest(p_request_ids)id) entries WHERE route IS NOT NULL;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_price_approval_routes(uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_price_approval_routes(uuid[]) TO authenticated;
-- Private decision evidence prevents forged session settings from authorizing writes.
CREATE FUNCTION private.price_decision_matches(product_id uuid,site_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.inventory_requests r JOIN private.price_change_decisions d ON d.request_id=r.id
 WHERE r.id::text=current_setting('app.price_change_decision_id',true) AND r.product_id=product_id::text AND r.site_id=site_id::text
 AND r.status='pending' AND d.employee_id=auth.uid() AND d.proposed_changes=r.proposed_changes);
$$;
REVOKE ALL ON FUNCTION private.price_decision_matches(uuid,uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.approve_price_change(request_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
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
$$;
REVOKE ALL ON FUNCTION private.approve_price_change(uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.clear_price_change_finance(request_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
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
$$;
REVOKE ALL ON FUNCTION private.clear_price_change_finance(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.clear_price_change_finance(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.finance_signoff_merchandising_price(p_request_id uuid) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.clear_price_change_finance(p_request_id); $$;
REVOKE ALL ON FUNCTION public.finance_signoff_merchandising_price(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.finance_signoff_merchandising_price(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION private.approve_nonprice_product_edit(p_request_id uuid) RETURNS jsonb LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.inventory_requests%ROWTYPE; sibling public.inventory_requests%ROWTYPE;
 result jsonb; first_result jsonb;
BEGIN
 SELECT * INTO r FROM public.inventory_requests WHERE id=p_request_id;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Proposal not found'; END IF;
 IF r.layout_revision_id IS NULL THEN RETURN private.approve_planogram_product_edit(p_request_id); END IF;
 -- All decisions lock the revision before any member to avoid opposing row lock order.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(r.layout_revision_id::text,0));
 PERFORM id FROM public.inventory_requests WHERE layout_revision_id=r.layout_revision_id ORDER BY id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.inventory_requests WHERE layout_revision_id=r.layout_revision_id
   AND (status<>'pending' OR site_id IS DISTINCT FROM r.site_id OR country_code IS DISTINCT FROM r.country_code
     OR requested_by_employee_id IS DISTINCT FROM r.requested_by_employee_id OR change_type<>'edit'
     OR (SELECT count(*) FROM jsonb_object_keys(proposed_changes))<>1 OR NOT proposed_changes ? 'shelfPosition')) THEN
   RAISE EXCEPTION 'The complete layout revision must be pending and contain only same-store shelf moves';
 END IF;
 IF EXISTS(SELECT product_id FROM public.inventory_requests WHERE layout_revision_id=r.layout_revision_id GROUP BY product_id HAVING count(*)>1) THEN
   RAISE EXCEPTION 'Layout revision contains duplicate products';
 END IF;
 -- Each member passes the same baseline, requester, scope, active-voter and value checks.
 FOR sibling IN SELECT * FROM public.inventory_requests WHERE layout_revision_id=r.layout_revision_id ORDER BY product_id,id LOOP
   result:=private.approve_planogram_product_edit(sibling.id);
   IF first_result IS NULL THEN first_result:=result;
   ELSIF result IS DISTINCT FROM first_result THEN
     RAISE EXCEPTION 'Layout approval records are inconsistent; submit a fresh revision';
   END IF;
 END LOOP;
 RETURN first_result || jsonb_build_object('revisionId',r.layout_revision_id);
END;
$function$
;
REVOKE ALL ON FUNCTION private.approve_nonprice_product_edit(uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.dispatch_product_approval(request_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.inventory_requests%ROWTYPE;
BEGIN
 SELECT * INTO r FROM public.inventory_requests WHERE id=request_id;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Proposal not found'; END IF;
 IF r.change_type='edit' AND private.is_price_change(r.proposed_changes) THEN RETURN private.approve_price_change(request_id); END IF;
 RETURN private.approve_nonprice_product_edit(request_id);
END;
$$;
REVOKE ALL ON FUNCTION private.dispatch_product_approval(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.dispatch_product_approval(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.approve_product_edit(p_request_id uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.dispatch_product_approval(p_request_id); $$;
REVOKE ALL ON FUNCTION public.approve_product_edit(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.approve_product_edit(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION private.product_edit_decision_matches(p_product_id uuid,p_site_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT private.price_decision_matches(p_product_id,p_site_id) OR EXISTS(SELECT 1 FROM public.inventory_requests r
 WHERE r.id::text=current_setting('app.product_edit_decision_id',true) AND r.product_id=p_product_id::text AND r.site_id=p_site_id::text
 AND r.change_type='edit' AND r.status='pending' AND NOT private.is_price_change(r.proposed_changes)
 AND private.product_edit_region_scope(r.site_id) AND (SELECT count(*) FROM private.product_edit_votes v WHERE v.request_id=r.id)=3);
$$;
REVOKE ALL ON FUNCTION private.product_edit_decision_matches(uuid,uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.guard_product_edit_request() RETURNS trigger LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE p public.products%ROWTYPE; actor public.employees%ROWTYPE; votes jsonb;
BEGIN
 IF TG_OP='UPDATE' AND OLD.change_type<>'edit' AND NEW.change_type<>'edit' THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' AND NEW.change_type<>'edit' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN
  IF OLD.status<>'pending' AND NEW IS DISTINCT FROM OLD THEN RAISE EXCEPTION 'Completed product decisions are immutable'; END IF;
  IF (NEW.approved_by IS DISTINCT FROM OLD.approved_by OR NEW.approved_at IS DISTINCT FROM OLD.approved_at)
   AND NOT private.product_edit_decision_matches(OLD.product_id::uuid,OLD.site_id::uuid) THEN
   RAISE EXCEPTION 'Approval identity is server controlled'; END IF;
  IF NEW.status='rejected' AND OLD.status='pending' AND (
   (CASE WHEN private.is_price_change(OLD.proposed_changes) THEN NOT coalesce((private.price_approval_route(OLD.id)->>'canReject')::boolean,false) ELSE NOT private.product_edit_region_scope(OLD.site_id) END) OR length(trim(coalesce(NEW.rejection_reason,'')))=0
   OR NEW.rejected_by IS DISTINCT FROM (SELECT name FROM public.employees WHERE id=auth.uid())) THEN
   RAISE EXCEPTION 'Regional manager and a reason required to reject product edits'; END IF;
  IF (to_jsonb(NEW)-ARRAY['status','approved_by','approved_at','rejection_reason','rejected_by','rejected_at','finance_approved_by_employee_id','finance_approved_at','product_edit_approvals'])
   IS DISTINCT FROM (to_jsonb(OLD)-ARRAY['status','approved_by','approved_at','rejection_reason','rejected_by','rejected_at','finance_approved_by_employee_id','finance_approved_at','product_edit_approvals']) THEN
   RAISE EXCEPTION 'Product edit proposals are immutable; submit a new request';
  END IF;
  SELECT coalesce(jsonb_agg(jsonb_build_object('employeeId',v.employee_id,'name',v.employee_name,'role',v.role,'approvedAt',v.approved_at) ORDER BY v.role),'[]')
   INTO votes FROM private.product_edit_votes v WHERE v.request_id=OLD.id;
  IF NEW.product_edit_approvals IS DISTINCT FROM votes THEN RAISE EXCEPTION 'Approval records are server controlled'; END IF;
  IF NEW.status='approved' AND OLD.status IS DISTINCT FROM 'approved'
   AND NOT private.product_edit_decision_matches(OLD.product_id::uuid,OLD.site_id::uuid) THEN
   RAISE EXCEPTION 'Product edits require Operations, Supply Chain and Merchandising approval';
  END IF;
  RETURN NEW;
 END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active';
 SELECT product.* INTO p FROM public.products product WHERE product.id::text=NEW.product_id AND product.site_id::text=NEW.site_id;
 IF actor.id IS NULL OR p.id IS NULL OR NEW.status<>'pending' OR NEW.approved_by IS NOT NULL OR NEW.approved_at IS NOT NULL THEN
  RAISE EXCEPTION 'Product edits must be submitted as pending proposals by an active employee';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.sites target LEFT JOIN public.sites home ON home.id=actor.site_id
 WHERE target.id=p.site_id AND (upper(target.country)=upper(home.country) OR (actor.role='group_ceo' AND public.is_country_in_my_authorized_scope(target.country)))) THEN
  RAISE EXCEPTION 'Product edit is outside your country';
 END IF;
 IF jsonb_typeof(NEW.proposed_changes)='object' THEN
  NEW.proposed_changes:=(SELECT coalesce(jsonb_object_agg(field.key,field.value),'{}') FROM jsonb_each(NEW.proposed_changes) field
   WHERE private.product_edit_patch(jsonb_build_object(field.key,field.value))='{}' OR private.product_edit_patch(jsonb_build_object(field.key,field.value)) IS DISTINCT FROM
   (SELECT coalesce(jsonb_object_agg(k,to_jsonb(p)->k),'{}') FROM jsonb_object_keys(private.product_edit_patch(jsonb_build_object(field.key,field.value))) k));
 END IF;
 IF NEW.proposed_changes IS NULL OR jsonb_typeof(NEW.proposed_changes)<>'object'
 OR private.product_edit_patch(NEW.proposed_changes)='{}' THEN RAISE EXCEPTION 'No editable product fields supplied'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(NEW.proposed_changes) k WHERE NOT k=ANY(ARRAY['name','sku','category','brand','description','image','size','unit','barcode','barcodes','barcodeType','price','costPrice','salePrice','isOnSale','minStock','maxStock','packQuantity','customAttributes','shelfPosition'])) THEN RAISE EXCEPTION 'Product proposal includes unauthorized fields'; END IF;
 IF private.is_price_change(NEW.proposed_changes) THEN
  IF NEW.layout_revision_id IS NOT NULL OR EXISTS(SELECT 1 FROM jsonb_object_keys(NEW.proposed_changes) k WHERE k<>ALL(ARRAY['price','costPrice','salePrice','isOnSale'])) THEN
   RAISE EXCEPTION 'Submit price changes separately from product details and shelf layouts'; END IF;
  IF EXISTS(SELECT 1 FROM jsonb_each(NEW.proposed_changes) field WHERE field.key IN ('price','costPrice','salePrice') AND (jsonb_typeof(field.value)<>'number' OR (field.value::text)::numeric<>round((field.value::text)::numeric))) THEN
   RAISE EXCEPTION 'Prices and costs must be whole numbers'; END IF;
  NEW.price_review_context:=jsonb_build_object('requesterRole',actor.role,'pricingBaseline',jsonb_build_object('price',p.price,'cost_price',p.cost_price,'sale_price',p.sale_price,'is_on_sale',p.is_on_sale));
 ELSE NEW.price_review_context:=NULL; END IF;
 NEW.requested_by_employee_id:=actor.id; NEW.requested_by:=actor.name;
 NEW.requested_at:=now(); NEW.product_edit_approvals:='[]';
 NEW.finance_approved_by_employee_id:=NULL; NEW.finance_approved_at:=NULL;
 NEW.product_edit_baseline:=(SELECT jsonb_object_agg(k,to_jsonb(p)->k) FROM jsonb_object_keys(private.product_edit_patch(NEW.proposed_changes)) k);
 SELECT upper(country),region_code INTO NEW.country_code,NEW.region_code FROM public.sites WHERE id=p.site_id;
 RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION private.guard_merchandising_finance_signoff() RETURNS trigger LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  IF NEW.finance_approved_by_employee_id IS NOT DISTINCT FROM OLD.finance_approved_by_employee_id
     AND NEW.finance_approved_at IS NOT DISTINCT FROM OLD.finance_approved_at THEN
    RETURN NEW;
  END IF;
  IF current_setting('app.merchandising_finance_signoff_id', true) IS DISTINCT FROM OLD.id::text
     OR NEW.finance_approved_by_employee_id IS DISTINCT FROM (SELECT auth.uid())
     OR NEW.finance_approved_at IS NULL
     OR OLD.status <> 'pending'
     OR NOT private.is_price_change(OLD.proposed_changes)
     OR (to_jsonb(NEW) - ARRAY['finance_approved_by_employee_id','finance_approved_at'])
       <> (to_jsonb(OLD) - ARRAY['finance_approved_by_employee_id','finance_approved_at']) THEN
    RAISE EXCEPTION 'Finance signoff requires the authorized decision workflow';
  END IF;
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION private.reject_nonprice_product_edit(p_request_id uuid, p_reason text) RETURNS void LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.inventory_requests%ROWTYPE; actor public.employees%ROWTYPE;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active';
 SELECT * INTO r FROM public.inventory_requests WHERE id=p_request_id;
 IF actor.id IS NULL OR r.id IS NULL OR NOT private.product_edit_region_scope(r.site_id)
 OR actor.role NOT IN ('regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager')
 OR length(trim(coalesce(p_reason,''))) NOT BETWEEN 1 AND 1200 THEN RAISE EXCEPTION 'Regional approver and a reason required'; END IF;
 IF r.layout_revision_id IS NOT NULL THEN
   PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(r.layout_revision_id::text,0));
   PERFORM id FROM public.inventory_requests WHERE layout_revision_id=r.layout_revision_id ORDER BY id FOR UPDATE;
 ELSE
   PERFORM id FROM public.inventory_requests WHERE id=r.id FOR UPDATE;
 END IF;
 IF EXISTS(SELECT 1 FROM public.inventory_requests WHERE (id=r.id OR (r.layout_revision_id IS NOT NULL AND layout_revision_id=r.layout_revision_id))
    AND (status<>'pending' OR change_type<>'edit' OR site_id IS DISTINCT FROM r.site_id)) THEN RAISE EXCEPTION 'Proposal is no longer pending'; END IF;
 UPDATE public.inventory_requests SET status='rejected',rejection_reason=trim(p_reason),rejected_by=actor.name,rejected_at=now()
 WHERE id=r.id OR (r.layout_revision_id IS NOT NULL AND layout_revision_id=r.layout_revision_id);
END;
$function$
;
REVOKE ALL ON FUNCTION private.reject_nonprice_product_edit(uuid,text) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.dispatch_product_rejection(request_id uuid,reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.inventory_requests%ROWTYPE; route jsonb;
BEGIN
 SELECT * INTO r FROM public.inventory_requests WHERE id=request_id FOR UPDATE;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Proposal not found'; END IF;
 IF NOT private.is_price_change(r.proposed_changes) THEN PERFORM private.reject_nonprice_product_edit(request_id,reason); RETURN; END IF;
 route:=private.price_approval_route(request_id);
 IF NOT coalesce((route->>'canReject')::boolean,false) OR length(trim(coalesce(reason,''))) NOT BETWEEN 1 AND 1200 THEN
  RAISE EXCEPTION 'An independent scoped commercial reviewer and rejection reason are required' USING ERRCODE='42501'; END IF;
 UPDATE public.inventory_requests SET status='rejected',rejection_reason=trim(reason),rejected_by=(SELECT name FROM public.employees WHERE id=auth.uid()),rejected_at=now() WHERE id=request_id;
END;
$$;
REVOKE ALL ON FUNCTION private.dispatch_product_rejection(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.dispatch_product_rejection(uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.reject_product_edit(p_request_id uuid,p_reason text) RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.dispatch_product_rejection(p_request_id,p_reason); $$;
REVOKE ALL ON FUNCTION public.reject_product_edit(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reject_product_edit(uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.get_my_product_approval_inbox(p_country_code text, p_limit integer DEFAULT 5) RETURNS jsonb LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
DECLARE actor record; result jsonb;
BEGIN
 SELECT e.id,e.name,e.email,e.role,coalesce(e.region_code,home.region_code) AS region_code,upper(home.country) AS country_code
 INTO actor FROM public.employees e JOIN public.sites home ON home.id=e.site_id
 WHERE e.id=(SELECT auth.uid()) AND lower(coalesce(e.status,'active'))='active';
 IF actor.id IS NULL OR actor.role NOT IN ('regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager')
 OR actor.region_code IS NULL OR actor.country_code IS DISTINCT FROM upper(p_country_code) THEN
  RAISE EXCEPTION 'Regional approval inbox requires an active regional approver in the requested country' USING ERRCODE='42501';
 END IF;
 WITH scoped AS (
  SELECT r.id,r.layout_revision_id,r.product_name,r.site_id,s.name AS site_name,r.requested_at,r.requested_by,
   r.proposed_changes,
   coalesce(r.requested_by_employee_id=actor.id OR lower(trim(r.requested_by))=lower(trim(actor.name))
    OR lower(trim(r.requested_by))=lower(trim(actor.email)),false)
   OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(r.product_edit_approvals,'[]'::jsonb)) vote
    WHERE vote->>'role'=actor.role OR vote->>'employeeId'=actor.id::text) AS already_handled
  FROM public.inventory_requests r JOIN public.sites s ON s.id::text=r.site_id
  WHERE r.change_type='edit' AND r.status='pending' AND (NOT private.is_price_change(r.proposed_changes) OR coalesce((private.price_approval_route(r.id)->>'canApprove')::boolean,false))
   AND upper(r.country_code)=actor.country_code AND upper(s.country)=actor.country_code
   AND lower(s.region_code)=lower(actor.region_code)
   AND private.product_edit_region_scope(r.site_id)
 ), grouped AS (
  SELECT coalesce(layout_revision_id,id) AS id,min(id::text)::uuid AS request_id,
   min(layout_revision_id::text)::uuid AS revision_id,min(site_id) AS site_id,min(site_name) AS site_name,
   min(requested_at) AS submitted_at,min(requested_by) AS requester,count(*)::integer AS move_count,
   min(product_name) AS product_name,bool_or(proposed_changes ?| ARRAY['price','costPrice','salePrice','isOnSale']) AS is_price
  FROM scoped GROUP BY coalesce(layout_revision_id,id)
  HAVING NOT bool_or(already_handled)
 ), labeled AS (
  SELECT id,request_id,revision_id,site_id,site_name,submitted_at,requester,move_count,
   CASE WHEN revision_id IS NOT NULL THEN 'planogram' WHEN is_price THEN 'price' ELSE 'product' END AS kind,
   CASE WHEN revision_id IS NOT NULL THEN move_count::text || ' shelf move' || CASE WHEN move_count=1 THEN '' ELSE 's' END
    ELSE coalesce(product_name,'Product change') END AS title
  FROM grouped
 )
 SELECT jsonb_build_object('total',count(*),'planogramCount',count(*) FILTER(WHERE kind='planogram'),
  'priceCount',count(*) FILTER(WHERE kind='price'),'productCount',count(*) FILTER(WHERE kind='product'),
  'items',coalesce((SELECT jsonb_agg(jsonb_build_object('id',i.id,'requestId',i.request_id,'revisionId',i.revision_id,
   'siteId',i.site_id,'siteName',i.site_name,'submittedAt',i.submitted_at,'requester',i.requester,
   'productCount',i.move_count,'kind',i.kind,'title',i.title) ORDER BY i.submitted_at,i.id)
   FROM (SELECT id,request_id,revision_id,site_id,site_name,submitted_at,requester,move_count,kind,title
    FROM labeled ORDER BY submitted_at,id LIMIT greatest(1,least(coalesce(p_limit,5),25))) i),'[]'::jsonb))
 INTO result FROM labeled;
 RETURN result;
END;
$function$
;
CREATE FUNCTION public.get_my_price_approval_inbox(p_country_code text) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF auth.uid() IS NULL OR upper(p_country_code) IS DISTINCT FROM upper(public.get_my_country_code()) THEN RAISE EXCEPTION 'Price inbox requires your assigned country' USING ERRCODE='42501'; END IF;
 SELECT jsonb_build_object('priceCount',count(*) FILTER(WHERE coalesce((route->>'canApprove')::boolean,false)),
 'financeCount',count(*) FILTER(WHERE coalesce((route->>'canFinance')::boolean,false))) INTO result
 FROM (SELECT private.price_approval_route(r.id) route FROM public.inventory_requests r
 WHERE r.status='pending' AND r.change_type='edit' AND upper(r.country_code)=upper(p_country_code) AND private.is_price_change(r.proposed_changes)) routes;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_my_price_approval_inbox(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_price_approval_inbox(text) TO authenticated;
CREATE OR REPLACE FUNCTION public.get_my_approval_inbox(p_country_code text) RETURNS jsonb LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
DECLARE actor record; q record; n bigint; entries jsonb:='[]'; total bigint:=0;
 product_inbox jsonb; item record; unavailable integer:=0;
BEGIN
 SELECT e.id,e.name,e.email,e.role,coalesce(e.region_code,s.region_code) region_code,upper(s.country) country
 INTO actor FROM public.employees e JOIN public.sites s ON s.id=e.site_id
 WHERE e.id=(SELECT auth.uid()) AND lower(coalesce(e.status,'active'))='active';
 IF actor.id IS NULL OR p_country_code IS NULL OR (actor.role<>'group_ceo' AND actor.country IS DISTINCT FROM upper(p_country_code)) THEN
  RAISE EXCEPTION 'Active employee in the requested country required' USING ERRCODE='42501';
 END IF;
 IF actor.role IN ('regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager') THEN
  BEGIN
   product_inbox:=public.get_my_product_approval_inbox(upper(p_country_code),1);
   FOR item IN SELECT * FROM (VALUES ('product', 'productCount'),('planogram','planogramCount')) x(key,field) LOOP
    n:=(product_inbox->>item.field)::bigint;
    entries:=entries||jsonb_build_array(jsonb_build_object('key',item.key,'count',n,'status','ready'));
    total:=total+n;
   END LOOP;
  EXCEPTION WHEN insufficient_privilege OR undefined_function THEN
   entries:=entries||jsonb_build_array(jsonb_build_object('key','product','count',null,'status','unavailable'));
   unavailable:=unavailable+1;
  END;
 END IF;
 FOR q IN SELECT * FROM (VALUES
('purchase_orders',ARRAY['group_ceo','country_commercial_director','regional_procurement_manager']::text[],$query$SELECT count(*) FROM public.purchase_orders r WHERE upper(r.country_code)=$1 AND r.status IN ('Draft','Pending') AND lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,''))))
 AND r.total_amount>=0 AND EXISTS(SELECT 1 FROM public.suppliers v WHERE v.id=r.supplier_id AND upper(v.country_code)=$1
 AND (lower(v.verification_status)='verified' OR (lower(v.type)='one-time' AND lower(v.status)='active' AND lower(v.verification_status)='pending'))
 AND (lower(v.type) IS DISTINCT FROM 'one-time' OR NOT EXISTS(SELECT 1 FROM public.purchase_orders used WHERE used.supplier_id=v.id AND used.approved_at IS NOT NULL AND used.id<>r.id)))
 AND lower(trim(coalesce(r.created_by,''))) NOT IN($2::text,lower(trim($3)))
 AND EXISTS(SELECT 1 FROM public.sites dest LEFT JOIN public.regions reg ON reg.code=coalesce(r.region_code,dest.region_code)
 WHERE dest.id=r.site_id AND upper(dest.country)=$1
 AND (coalesce(r.region_code,dest.region_code) IS NULL OR (lower(reg.status)='active' AND upper(reg.country)=$1 AND reg.autonomous_po_limit>=0))
 AND ($5<>'regional_procurement_manager' OR (reg.code=$4 AND r.total_amount<=reg.autonomous_po_limit))
 AND (reg.code IS NULL OR r.total_amount<=reg.autonomous_po_limit OR
 (r.finance_cleared_by_employee_id IS NOT NULL AND r.finance_cleared_by_employee_id<>$2 AND r.finance_cleared_at IS NOT NULL
 AND r.finance_cleared_amount=r.total_amount AND r.finance_cleared_supplier_id IS NOT DISTINCT FROM r.supplier_id
 AND r.finance_cleared_currency IS NOT DISTINCT FROM r.currency AND r.finance_cleared_payment_terms IS NOT DISTINCT FROM r.payment_terms)))$query$),
('po_finance',ARRAY['country_finance_director']::text[],$query$SELECT count(*) FROM public.purchase_orders r WHERE upper(r.country_code)=$1 AND r.status IN ('Draft','Pending') AND lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,'')))) AND lower(trim(coalesce(r.created_by,''))) NOT IN($2::text,lower(trim($3)))
 AND EXISTS(SELECT 1 FROM public.sites s JOIN public.regions reg ON reg.code=coalesce(r.region_code,s.region_code)
 WHERE s.id=r.site_id AND upper(reg.country)=$1 AND lower(reg.status)='active' AND reg.autonomous_po_limit>=0 AND r.total_amount>reg.autonomous_po_limit)
 AND NOT(r.finance_cleared_at IS NOT NULL AND r.finance_cleared_by_employee_id IS NOT NULL AND r.finance_cleared_amount=r.total_amount
 AND r.finance_cleared_supplier_id IS NOT DISTINCT FROM r.supplier_id AND r.finance_cleared_currency IS NOT DISTINCT FROM r.currency
 AND r.finance_cleared_payment_terms IS NOT DISTINCT FROM r.payment_terms)$query$),
('purchase_requests',ARRAY['buyer','regional_procurement_manager','country_supply_chain_director']::text[],$query$SELECT count(*) FROM public.purchase_requisitions r WHERE upper(r.country_code)=$1 AND r.status='Submitted' AND r.requester_employee_id<>$2 AND private.procurement_site_scope(r.destination_site_id::text,$1)$query$),
('product_suggestions',ARRAY['group_ceo','country_commercial_director','country_supply_chain_director','regional_procurement_manager','regional_merchandising_manager','buyer','demand_planner','vendor_relations_manager','merchandising_specialist']::text[],$query$SELECT count(*) FROM public.product_suggestions r WHERE upper(r.country_code)=$1 AND r.status IN ('Submitted','Under Review') AND r.submitter_employee_id<>$2 AND private.product_suggestion_site_scope(r.site_id::text,$1)$query$),
('expenses',ARRAY['group_ceo','country_managing_director','country_finance_director','regional_finance_manager','regional_operations_manager']::text[],$query$SELECT count(*) FROM public.expenses r WHERE upper(r.country_code)=$1 AND r.status='Pending' AND r.created_by_id::text IS DISTINCT FROM $2::text AND lower(trim(coalesce(r.created_by_name,'')))<>lower(trim($3))
 AND private.finance_site_scope(r.site_id::text,$1) AND (NOT coalesce(r.escalated_to_ceo,false) OR $5='group_ceo')
 AND ($5 NOT IN ('regional_operations_manager','regional_finance_manager') OR r.amount<=coalesce((SELECT reg.autonomous_expense_limit FROM public.regions reg JOIN public.sites s ON s.id=r.site_id WHERE reg.code=coalesce(r.region_code,s.region_code) AND upper(reg.country)=$1),25000))$query$),
('margin',ARRAY['group_ceo','country_managing_director','country_finance_director']::text[],$query$SELECT count(*) FROM public.margin_approval_requests r WHERE upper(r.country_code)=$1 AND r.status='Pending' AND r.requested_by_id::text IS DISTINCT FROM $2::text AND public.is_site_in_my_authorized_scope(r.site_id::text,$1)$query$),
('price_finance',ARRAY['group_ceo','country_finance_director','regional_finance_manager']::text[],$query$SELECT count(*) FROM public.inventory_requests r WHERE upper(r.country_code)=$1 AND r.status='pending' AND r.change_type='edit' AND r.adjustment_reason LIKE 'PRICE_CHANGE%' AND r.finance_approved_by_employee_id IS NULL
 AND r.requested_by_employee_id IS DISTINCT FROM $2 AND private.merchandising_finance_scope(r.site_id,$1)
 AND EXISTS(SELECT 1 FROM public.products p WHERE p.id::text=r.product_id AND p.site_id::text=r.site_id
 AND coalesce((r.proposed_changes->>'costPrice')::numeric,p.cost_price)>0
 AND CASE WHEN coalesce((r.proposed_changes->>'isOnSale')::boolean,p.is_on_sale) AND coalesce((r.proposed_changes->>'salePrice')::numeric,p.sale_price)>0
 THEN coalesce((r.proposed_changes->>'salePrice')::numeric,p.sale_price) ELSE coalesce((r.proposed_changes->>'price')::numeric,p.price) END
 < coalesce((r.proposed_changes->>'costPrice')::numeric,p.cost_price)/0.85)$query$),
('transfers',ARRAY['group_ceo','country_managing_director','regional_operations_manager','country_operations_director','warehouse_manager','country_supply_chain_director','regional_supply_chain_manager','inventory_manager','regional_logistics_manager']::text[],$query$SELECT count(*) FROM public.wms_jobs r WHERE upper(r.country_code)=$1 AND r.type='TRANSFER' AND r.status NOT IN ('Cancelled','Completed') AND coalesce(r.transfer_status,'Requested') IN ('Draft','Requested','Approved') AND lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,''))))
 AND public.is_site_in_my_authorized_scope(coalesce(r.source_site_id,r.site_id)::text,$1)
 AND EXISTS(SELECT 1 FROM public.sites s JOIN public.sites d ON d.id=r.dest_site_id
 WHERE s.id=coalesce(r.source_site_id,r.site_id) AND s.type IN ('Warehouse','Distribution Center') AND upper(s.country)=$1 AND upper(d.country)=$1)
 AND jsonb_array_length(coalesce(r.line_items,'[]'))>0$query$),
('hiring_requests',ARRAY['group_ceo','country_managing_director','country_hr_director','regional_hr_manager']::text[],$query$SELECT count(*) FROM public.job_requisitions r WHERE upper(r.country_code)=$1 AND r.status='pending_hq_approval' AND lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,'')))) AND private.hr_site_scope(r.site_id,$1)$query$),
('candidate_hr',ARRAY['group_ceo','country_managing_director','country_hr_director','hr_generalist','regional_hr_manager']::text[],$query$SELECT count(*) FROM public.job_candidates r WHERE upper(r.country_code)=$1 AND r.stage='offered' AND r.hr_approved_at IS NULL AND private.hr_site_scope(r.site_id,$1)$query$),
('candidate_finance',ARRAY['group_ceo','country_managing_director','country_finance_director','regional_finance_manager']::text[],$query$SELECT count(*) FROM public.job_candidates r WHERE upper(r.country_code)=$1 AND r.stage='offered' AND r.finance_approved_at IS NULL AND lower(coalesce(r.hr_approved_by,''))<>lower($3) AND private.hr_site_scope(r.site_id,$1)$query$),
('salary',ARRAY['group_ceo','country_managing_director','country_finance_director']::text[],$query$SELECT count(*) FROM public.salary_requests r WHERE upper(r.country_code)=$1 AND r.status='pending' AND r.employee_id<>$2 AND lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,'')))) AND public.is_site_in_my_authorized_scope(r.site_id::text,$1)$query$),
('headcount',ARRAY['group_ceo','country_managing_director','country_hr_director','country_operations_director','regional_operations_manager']::text[],$query$SELECT count(*) FROM public.headcount_quota_requests r WHERE upper(r.country_code)=$1 AND r.status='PENDING' AND lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,'')))) AND private.hr_site_scope(r.site_id,$1)$query$),
('payroll_attestation',ARRAY['regional_hr_manager']::text[],$query$SELECT count(*) FROM public.payroll_runs r WHERE upper(r.country_code)=$1 AND r.status NOT IN ('draft','rejected','disbursed') AND r.regional_attested_at IS NULL AND r.regional_attested_by_id IS NULL AND public.is_site_in_my_authorized_scope(r.site_id::text,$1)$query$),
('payroll_hr',ARRAY['group_ceo','country_managing_director','country_hr_director','hr_generalist']::text[],$query$SELECT count(*) FROM public.payroll_runs r WHERE upper(r.country_code)=$1 AND r.status IN ('pending_verification','pending_hr','pending_finance') AND r.hr_approved_by IS NULL AND lower(trim(r.initiated_by)) NOT IN ($2::text,lower(trim($3))) AND lower(coalesce(r.finance_approved_by,''))<>lower($3) AND private.hr_site_scope(r.site_id,$1)$query$),
('payroll_finance',ARRAY['group_ceo','country_managing_director','country_finance_director']::text[],$query$SELECT count(*) FROM public.payroll_runs r WHERE upper(r.country_code)=$1 AND r.status IN ('pending_verification','pending_hr','pending_finance') AND r.finance_approved_by IS NULL AND lower(trim(r.initiated_by)) NOT IN ($2::text,lower(trim($3))) AND lower(coalesce(r.hr_approved_by,''))<>lower($3) AND private.hr_site_scope(r.site_id,$1)$query$),
('inventory',ARRAY['group_ceo','country_managing_director','regional_operations_manager','regional_procurement_manager','country_operations_director','country_commercial_director']::text[],$query$SELECT count(*) FROM public.inventory_requests r WHERE upper(r.country_code)=$1 AND r.status='pending' AND r.change_type<>'edit' AND lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,'')))) AND r.requested_by_employee_id IS DISTINCT FROM $2 AND public.is_site_in_my_authorized_scope(r.site_id::text,$1)$query$),
('campaigns',ARRAY['group_ceo','country_commercial_director','regional_merchandising_manager']::text[],$query$SELECT count(*) FROM public.merchandising_campaign_proposals r WHERE upper(r.country_code)=$1 AND r.status='pending' AND r.requested_by_employee_id<>$2 AND private.merchandising_site_scope(r.scope_site_id::text,$1)$query$),
('leave',ARRAY['group_ceo','country_managing_director','country_hr_director','hr_generalist','regional_hr_manager','country_operations_director','regional_operations_manager','area_operations_manager','store_manager','warehouse_manager']::text[],$query$SELECT count(*) FROM public.leave_requests r WHERE upper(r.country_code)=$1 AND lower(r.status)='pending' AND r.employee_id<>$2 AND lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,'')))) AND private.hr_site_scope(r.site_id,$1)$query$),
('employee_changes',ARRAY['group_ceo','hr_generalist','regional_hr_manager','regional_supply_chain_manager','country_managing_director','regional_procurement_manager','group_cfo','regional_operations_manager','country_supply_chain_director','warehouse_manager','country_commercial_director','country_finance_director','regional_security_manager','store_manager','country_technology_director','regional_finance_manager','compliance_officer','regional_logistics_manager','country_hr_director','country_compliance_manager','country_operations_director','group_ceo']::text[],$query$SELECT count(*) FROM public.employee_change_requests r WHERE upper(r.country_code)=$1 AND r.status='pending' AND r.employee_id<>$2 AND private.hr_site_scope(r.site_id,$1) AND ($5='group_ceo' OR (lower(trim(coalesce(r.requested_by,''))) NOT IN ($2::text,lower(trim($3)),lower(trim(coalesce($6,'')))) AND (($5=ANY(ARRAY['country_managing_director','country_hr_director','regional_hr_manager','hr_generalist']::text[]) AND r.required_approvers ? 'Human Resources') OR ($5=ANY(ARRAY['country_managing_director','country_finance_director','regional_finance_manager','group_cfo']::text[]) AND r.required_approvers ? 'Finance Department') OR ($5=ANY(ARRAY['country_managing_director','country_operations_director','regional_operations_manager','store_manager']::text[]) AND r.required_approvers ? 'Operations Management') OR ($5=ANY(ARRAY['country_managing_director','country_supply_chain_director','country_operations_director','regional_logistics_manager','regional_operations_manager','warehouse_manager','regional_supply_chain_manager']::text[]) AND r.required_approvers ? 'Logistics & Warehouse') OR ($5=ANY(ARRAY['country_managing_director','country_commercial_director','country_supply_chain_director','country_operations_director','regional_procurement_manager','regional_operations_manager']::text[]) AND r.required_approvers ? 'Procurement') OR ($5=ANY(ARRAY['country_managing_director','country_compliance_manager','country_technology_director','country_operations_director','regional_security_manager','regional_operations_manager']::text[]) AND r.required_approvers ? 'Security Management') OR ($5=ANY(ARRAY['group_ceo','country_managing_director','country_compliance_manager','compliance_officer']::text[]) AND r.required_approvers ? 'Executive / Compliance')) AND EXISTS(SELECT 1 FROM public.employees subject WHERE subject.id=r.employee_id AND (CASE $5 WHEN 'group_ceo' THEN 100 WHEN 'group_coo' THEN 99 WHEN 'group_cfo' THEN 99 WHEN 'group_cco' THEN 99 WHEN 'group_cmo' THEN 99 WHEN 'group_csco' THEN 99 WHEN 'group_chro' THEN 99 WHEN 'group_cto' THEN 99 WHEN 'group_cio' THEN 99 WHEN 'group_clco' THEN 99 WHEN 'group_cae' THEN 99 WHEN 'country_managing_director' THEN 98 WHEN 'country_operations_director' THEN 97 WHEN 'country_finance_director' THEN 97 WHEN 'country_commercial_director' THEN 97 WHEN 'country_supply_chain_director' THEN 97 WHEN 'country_hr_director' THEN 97 WHEN 'country_technology_director' THEN 97 WHEN 'country_compliance_manager' THEN 97 WHEN 'regional_operations_manager' THEN 90 WHEN 'area_operations_manager' THEN 88 WHEN 'regional_supply_chain_manager' THEN 83 WHEN 'regional_procurement_manager' THEN 81 WHEN 'regional_finance_manager' THEN 81 WHEN 'regional_merchandising_manager' THEN 81 WHEN 'regional_hr_manager' THEN 81 WHEN 'regional_logistics_manager' THEN 81 WHEN 'regional_security_manager' THEN 81 WHEN 'regional_it_manager' THEN 81 WHEN 'regional_compliance_manager' THEN 81 WHEN 'store_manager' THEN 80 WHEN 'warehouse_manager' THEN 80 WHEN 'warehouse_operations_manager' THEN 78 WHEN 'transport_fleet_manager' THEN 78 WHEN 'inventory_manager' THEN 80 WHEN 'cs_manager' THEN 60 WHEN 'assistant_store_manager' THEN 60 WHEN 'vendor_relations_manager' THEN 60 WHEN 'fleet_maintenance_supervisor' THEN 58 WHEN 'inventory_control_supervisor' THEN 57 WHEN 'shift_supervisor' THEN 56 WHEN 'stock_control_supervisor' THEN 56 WHEN 'receiving_supervisor' THEN 56 WHEN 'pos_supervisor' THEN 56 WHEN 'putaway_replenishment_supervisor' THEN 56 WHEN 'picking_supervisor' THEN 56 WHEN 'packing_supervisor' THEN 56 WHEN 'dispatch_supervisor' THEN 56 WHEN 'returns_waste_supervisor' THEN 56 WHEN 'inbound_operations_supervisor' THEN 56 WHEN 'outbound_operations_supervisor' THEN 56 WHEN 'receiving_team_leader' THEN 50 WHEN 'picking_team_leader' THEN 50 WHEN 'packing_team_leader' THEN 50 WHEN 'dispatch_team_leader' THEN 50 WHEN 'store_operations_auditor' THEN 45 WHEN 'auditor' THEN 40 WHEN 'payroll_specialist' THEN 40 WHEN 'treasury_officer' THEN 38 WHEN 'tax_compliance_officer' THEN 38 WHEN 'credit_control_officer' THEN 36 WHEN 'cash_office_officer' THEN 36 WHEN 'accountant' THEN 35 WHEN 'data_analyst' THEN 35 WHEN 'training_coordinator' THEN 35 WHEN 'talent_recruiter' THEN 35 WHEN 'hr_generalist' THEN 35 WHEN 'merchandising_specialist' THEN 35 WHEN 'customs_import_specialist' THEN 35 WHEN 'it_support' THEN 35 WHEN 'dispatcher' THEN 35 WHEN 'buyer' THEN 30 WHEN 'demand_planner' THEN 30 WHEN 'replenishment_planner' THEN 30 WHEN 'inbound_qc_inspector' THEN 30 WHEN 'loss_prevention' THEN 30 WHEN 'cashier' THEN 30 WHEN 'store_associate' THEN 28 WHEN 'sales_associate' THEN 28 WHEN 'inventory_controller' THEN 26 WHEN 'stock_counter' THEN 25 WHEN 'merchandiser' THEN 25 WHEN 'inventory_specialist' THEN 25 WHEN 'customer_service' THEN 25 WHEN 'stock_clerk' THEN 25 WHEN 'receiving_operator' THEN 24 WHEN 'putaway_operator' THEN 24 WHEN 'replenishment_operator' THEN 24 WHEN 'dispatch_operator' THEN 24 WHEN 'returns_operator' THEN 24 WHEN 'fleet_mechanic' THEN 24 WHEN 'picker' THEN 22 WHEN 'packer' THEN 22 WHEN 'receiver' THEN 22 WHEN 'returns_clerk' THEN 22 WHEN 'driver' THEN 20 WHEN 'forklift_operator' THEN 20 WHEN 'warehouse_administrator' THEN 24 ELSE 0 END)>(CASE subject.role WHEN 'group_ceo' THEN 100 WHEN 'group_coo' THEN 99 WHEN 'group_cfo' THEN 99 WHEN 'group_cco' THEN 99 WHEN 'group_cmo' THEN 99 WHEN 'group_csco' THEN 99 WHEN 'group_chro' THEN 99 WHEN 'group_cto' THEN 99 WHEN 'group_cio' THEN 99 WHEN 'group_clco' THEN 99 WHEN 'group_cae' THEN 99 WHEN 'country_managing_director' THEN 98 WHEN 'country_operations_director' THEN 97 WHEN 'country_finance_director' THEN 97 WHEN 'country_commercial_director' THEN 97 WHEN 'country_supply_chain_director' THEN 97 WHEN 'country_hr_director' THEN 97 WHEN 'country_technology_director' THEN 97 WHEN 'country_compliance_manager' THEN 97 WHEN 'regional_operations_manager' THEN 90 WHEN 'area_operations_manager' THEN 88 WHEN 'regional_supply_chain_manager' THEN 83 WHEN 'regional_procurement_manager' THEN 81 WHEN 'regional_finance_manager' THEN 81 WHEN 'regional_merchandising_manager' THEN 81 WHEN 'regional_hr_manager' THEN 81 WHEN 'regional_logistics_manager' THEN 81 WHEN 'regional_security_manager' THEN 81 WHEN 'regional_it_manager' THEN 81 WHEN 'regional_compliance_manager' THEN 81 WHEN 'store_manager' THEN 80 WHEN 'warehouse_manager' THEN 80 WHEN 'warehouse_operations_manager' THEN 78 WHEN 'transport_fleet_manager' THEN 78 WHEN 'inventory_manager' THEN 80 WHEN 'cs_manager' THEN 60 WHEN 'assistant_store_manager' THEN 60 WHEN 'vendor_relations_manager' THEN 60 WHEN 'fleet_maintenance_supervisor' THEN 58 WHEN 'inventory_control_supervisor' THEN 57 WHEN 'shift_supervisor' THEN 56 WHEN 'stock_control_supervisor' THEN 56 WHEN 'receiving_supervisor' THEN 56 WHEN 'pos_supervisor' THEN 56 WHEN 'putaway_replenishment_supervisor' THEN 56 WHEN 'picking_supervisor' THEN 56 WHEN 'packing_supervisor' THEN 56 WHEN 'dispatch_supervisor' THEN 56 WHEN 'returns_waste_supervisor' THEN 56 WHEN 'inbound_operations_supervisor' THEN 56 WHEN 'outbound_operations_supervisor' THEN 56 WHEN 'receiving_team_leader' THEN 50 WHEN 'picking_team_leader' THEN 50 WHEN 'packing_team_leader' THEN 50 WHEN 'dispatch_team_leader' THEN 50 WHEN 'store_operations_auditor' THEN 45 WHEN 'auditor' THEN 40 WHEN 'payroll_specialist' THEN 40 WHEN 'treasury_officer' THEN 38 WHEN 'tax_compliance_officer' THEN 38 WHEN 'credit_control_officer' THEN 36 WHEN 'cash_office_officer' THEN 36 WHEN 'accountant' THEN 35 WHEN 'data_analyst' THEN 35 WHEN 'training_coordinator' THEN 35 WHEN 'talent_recruiter' THEN 35 WHEN 'hr_generalist' THEN 35 WHEN 'merchandising_specialist' THEN 35 WHEN 'customs_import_specialist' THEN 35 WHEN 'it_support' THEN 35 WHEN 'dispatcher' THEN 35 WHEN 'buyer' THEN 30 WHEN 'demand_planner' THEN 30 WHEN 'replenishment_planner' THEN 30 WHEN 'inbound_qc_inspector' THEN 30 WHEN 'loss_prevention' THEN 30 WHEN 'cashier' THEN 30 WHEN 'store_associate' THEN 28 WHEN 'sales_associate' THEN 28 WHEN 'inventory_controller' THEN 26 WHEN 'stock_counter' THEN 25 WHEN 'merchandiser' THEN 25 WHEN 'inventory_specialist' THEN 25 WHEN 'customer_service' THEN 25 WHEN 'stock_clerk' THEN 25 WHEN 'receiving_operator' THEN 24 WHEN 'putaway_operator' THEN 24 WHEN 'replenishment_operator' THEN 24 WHEN 'dispatch_operator' THEN 24 WHEN 'returns_operator' THEN 24 WHEN 'fleet_mechanic' THEN 24 WHEN 'picker' THEN 22 WHEN 'packer' THEN 22 WHEN 'receiver' THEN 22 WHEN 'returns_clerk' THEN 22 WHEN 'driver' THEN 20 WHEN 'forklift_operator' THEN 20 WHEN 'warehouse_administrator' THEN 24 ELSE 0 END))))$query$),
('onboarding',ARRAY['group_ceo','group_chro','country_hr_director','regional_hr_manager','hr_generalist']::text[],$query$SELECT count(*) FROM public.employees r JOIN public.sites home ON home.id=r.site_id WHERE upper(home.country)=$1 AND r.status='Pending Approval' AND r.id<>$2 AND public.is_site_in_my_authorized_scope(r.site_id::text,$1)$query$)
 ) registry(key,roles,query) WHERE actor.role=ANY(roles) AND key<>'price_finance' LOOP
  BEGIN
   EXECUTE q.query INTO n USING upper(p_country_code),actor.id,actor.name,actor.region_code,actor.role,actor.email;
   entries:=entries||jsonb_build_array(jsonb_build_object('key',q.key,'count',n,'status','ready'));
   total:=total+n;
  EXCEPTION WHEN insufficient_privilege OR undefined_table OR undefined_column OR undefined_function THEN
   entries:=entries||jsonb_build_array(jsonb_build_object('key',q.key,'count',null,'status','unavailable'));
   unavailable:=unavailable+1;
  END;
 END LOOP;
 IF actor.role IN ('regional_merchandising_manager','country_commercial_director','country_managing_director','country_finance_director') THEN
  product_inbox:=public.get_my_price_approval_inbox(upper(p_country_code));
  IF actor.role='country_finance_director' THEN
   n:=(product_inbox->>'financeCount')::bigint;
   entries:=entries||jsonb_build_array(jsonb_build_object('key','price_finance','count',n,'status','ready'));
  ELSE
   n:=(product_inbox->>'priceCount')::bigint;
   entries:=entries||jsonb_build_array(jsonb_build_object('key','price','count',n,'status','ready'));
  END IF;
  total:=total+n;
 END IF;
 RETURN jsonb_build_object('total',total,'queues',entries,'unavailable',unavailable,'checkedAt',statement_timestamp());
END;
$function$
;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.inventory_requests'::regclass AND tgname='guard_merchandising_preparation') THEN ALTER TRIGGER guard_merchandising_preparation ON public.inventory_requests RENAME TO zz_merchandising_preparation; END IF; END; $$;
COMMIT;
