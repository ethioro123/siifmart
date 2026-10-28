CREATE OR REPLACE FUNCTION private.single_approve_price_change(request_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  r public.inventory_requests%ROWTYPE;
  p public.products%ROWTYPE;
  actor public.employees%ROWTYPE;
  route jsonb;
  updated public.products%ROWTYPE;
BEGIN
  SELECT * INTO r FROM public.inventory_requests WHERE id = request_id FOR UPDATE;
  SELECT * INTO p FROM public.products WHERE id::text = r.product_id AND site_id::text = r.site_id FOR UPDATE;
  route := private.price_approval_route(request_id);
  IF NOT coalesce((route->>'canApprove')::boolean, false) THEN
    RAISE EXCEPTION '%', coalesce(route->>'block', 'Price approval is outside your country, region or role') USING ERRCODE = '42501';
  END IF;
  SELECT * INTO actor FROM public.employees WHERE id = auth.uid();
  INSERT INTO private.price_change_decisions(request_id, employee_id, role, pricing_baseline, proposed_changes)
  VALUES (r.id, actor.id, actor.role, route->'pricingBaseline', r.proposed_changes);
  PERFORM set_config('app.price_change_decision_id', r.id::text, true);
  updated := jsonb_populate_record(p, private.product_edit_patch(r.proposed_changes));
  UPDATE public.products
  SET price = updated.price,
      cost_price = updated.cost_price,
      sale_price = updated.sale_price,
      is_on_sale = updated.is_on_sale,
      approval_status = CASE
        WHEN coalesce(p.approval_status, 'pending') = 'pending' AND coalesce(updated.price, 0) > 0 THEN 'approved'
        ELSE p.approval_status
      END,
      approved_by = CASE
        WHEN coalesce(p.approval_status, 'pending') = 'pending' AND coalesce(updated.price, 0) > 0 THEN actor.name
        ELSE p.approved_by
      END,
      approved_at = CASE
        WHEN coalesce(p.approval_status, 'pending') = 'pending' AND coalesce(updated.price, 0) > 0 THEN now()
        ELSE p.approved_at
      END
  WHERE id = p.id;
  UPDATE public.inventory_requests
  SET status = 'approved',
      approved_by = actor.name,
      approved_at = now()
  WHERE id = r.id;
  PERFORM set_config('app.price_change_decision_id', '', true);
  INSERT INTO public.system_logs(action, module, user_name, employee_id, site_id, country_code, entity_type, entity_id, details)
  VALUES (
    'PRICE_CHANGE_APPROVED',
    'Merchandising',
    actor.name,
    actor.id,
    p.site_id,
    r.country_code,
    'inventory_request',
    r.id::text,
    jsonb_build_object(
      'role', actor.role,
      'requiresFinance', route->'requiresFinance',
      'financeApprover', r.finance_approved_by_employee_id,
      'proposedChanges', r.proposed_changes
    )
  );
  RETURN jsonb_build_object('applied', true, 'approvalCount', 1, 'workflow', 'price');
END;
$function$
;
REVOKE ALL ON FUNCTION private.single_approve_price_change(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.approve_price_change(request_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.inventory_requests%ROWTYPE; route jsonb; t record; next_p public.products%ROWTYPE; actor public.employees%ROWTYPE;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM private.price_proposal_targets WHERE price_proposal_targets.request_id=approve_price_change.request_id) THEN RETURN private.single_approve_price_change(request_id); END IF;
 SELECT * INTO r FROM public.inventory_requests WHERE id=request_id FOR UPDATE;
 PERFORM p.id FROM public.products p JOIN private.price_proposal_targets target ON target.product_id=p.id WHERE target.request_id=r.id ORDER BY p.id FOR UPDATE OF p;
 route:=private.price_approval_route(request_id);
 IF NOT coalesce((route->>'canApprove')::boolean,false) THEN RAISE EXCEPTION '%',coalesce(route->>'block','Scoped price approval denied') USING ERRCODE='42501'; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid();
 INSERT INTO private.price_change_decisions(request_id,employee_id,role,pricing_baseline,proposed_changes) VALUES(r.id,actor.id,actor.role,route->'pricingBaseline',r.proposed_changes);
 PERFORM set_config('app.price_change_decision_id',r.id::text,true);
 FOR t IN SELECT target.*,p AS product FROM private.price_proposal_targets target JOIN public.products p ON p.id=target.product_id WHERE target.request_id=r.id ORDER BY target.product_id LOOP
  next_p:=jsonb_populate_record(t.product,private.product_edit_patch(t.proposed_changes));
  UPDATE public.products SET price=next_p.price,sale_price=next_p.sale_price,is_on_sale=next_p.is_on_sale,
   approval_status=CASE WHEN coalesce((t.product).approval_status,'pending')='pending' AND next_p.price>0 THEN 'approved' ELSE (t.product).approval_status END,
   approved_by=CASE WHEN coalesce((t.product).approval_status,'pending')='pending' AND next_p.price>0 THEN actor.name ELSE (t.product).approved_by END,
   approved_at=CASE WHEN coalesce((t.product).approval_status,'pending')='pending' AND next_p.price>0 THEN now() ELSE (t.product).approved_at END WHERE id=t.product_id;
 END LOOP;
 UPDATE public.inventory_requests SET status='approved',approved_by=actor.name,approved_at=now() WHERE id=r.id;
 PERFORM set_config('app.price_change_decision_id','',true);
 INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('SCOPED_PRICE_CHANGE_APPROVED','Merchandising',actor.name,actor.id,r.site_id::uuid,r.country_code,'inventory_request',r.id::text,route-ARRAY['pricingBaseline','block']);
 RETURN jsonb_build_object('applied',true,'approvalCount',1,'workflow','price','targetCount',route->'targetCount');
END;
$$;
