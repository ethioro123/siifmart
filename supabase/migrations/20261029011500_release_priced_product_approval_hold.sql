-- Release unpriced product approval hold when a valid retail price proposal is approved
BEGIN;

CREATE OR REPLACE FUNCTION private.approve_price_change(request_id uuid)
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
$function$;

REVOKE ALL ON FUNCTION private.approve_price_change(uuid) FROM PUBLIC, anon, authenticated;

-- Backfill products that were held in pending approval solely until their retail price was set/approved
UPDATE public.products p
SET approval_status = 'approved',
    approved_by = coalesce(
      p.approved_by,
      (
        SELECT r.approved_by
        FROM public.inventory_requests r
        WHERE r.product_id = p.id::text
          AND r.status = 'approved'
        ORDER BY r.approved_at DESC NULLS LAST
        LIMIT 1
      ),
      'System Price Approval'
    ),
    approved_at = coalesce(
      p.approved_at,
      (
        SELECT r.approved_at
        FROM public.inventory_requests r
        WHERE r.product_id = p.id::text
          AND r.status = 'approved'
        ORDER BY r.approved_at DESC NULLS LAST
        LIMIT 1
      ),
      now()
    )
WHERE p.approval_status = 'pending'
  AND coalesce(p.price, 0) > 0;

COMMIT;
