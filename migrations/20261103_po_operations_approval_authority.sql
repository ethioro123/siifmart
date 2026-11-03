-- Align trusted PO approval role checks with the existing application policy.
BEGIN;
CREATE OR REPLACE FUNCTION public.approve_purchase_order(p_po_id uuid, p_approver_id text, p_approver_name text, p_approver_role text, p_reason_code text, p_notes text DEFAULT ''::text, p_gps_coords text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_actor public.employees%ROWTYPE;
  v_po public.purchase_orders%ROWTYPE;
  v_actor_country text;
  v_actor_region text;
  v_region_code text;
  v_region_country text;
  v_region_status text;
  v_reg_limit numeric := 10000000.00;
  v_country_limit numeric := 100000000.00;
  v_escalated boolean := false; v_group_tier boolean := false;
  v_notes text;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Authenticated employee required for PO approval' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_actor FROM public.employees
    WHERE id = (SELECT auth.uid()) AND lower(coalesce(status, 'active')) = 'active';
  IF v_actor.id IS NULL OR v_actor.role NOT IN (
    'regional_procurement_manager', 'regional_operations_manager', 'country_operations_director', 'country_commercial_director', 'country_managing_director',
    'head_of_procurement', 'group_cfo', 'group_ceo', 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Procurement approval authority required' USING ERRCODE = '42501';
  END IF;
  IF p_approver_id IS DISTINCT FROM v_actor.id::text OR p_approver_role IS DISTINCT FROM v_actor.role THEN
    RAISE EXCEPTION 'PO approver identity does not match the signed-in employee' USING ERRCODE = '42501';
  END IF;
  IF nullif(btrim(p_reason_code), '') IS NULL THEN
    RAISE EXCEPTION 'A structured PO approval reason is required' USING ERRCODE = '23514';
  END IF;

  SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id FOR UPDATE;
  IF v_po.id IS NULL OR v_po.status NOT IN ('Draft','Pending') THEN
    RAISE EXCEPTION 'An open purchase order is required for approval' USING ERRCODE = '23514';
  END IF;
  IF v_po.total_amount IS NULL OR v_po.total_amount < 0 THEN
    RAISE EXCEPTION 'Purchase order amount is invalid' USING ERRCODE = '23514';
  END IF;
  IF lower(btrim(coalesce(v_po.created_by, ''))) IN (lower(btrim(v_actor.name)), v_actor.id::text)
     OR lower(btrim(coalesce(v_po.requested_by, ''))) IN (lower(btrim(v_actor.name)), v_actor.id::text) THEN
    RAISE EXCEPTION 'PO creator or requester cannot approve their own order' USING ERRCODE = '42501';
  END IF;

  SELECT upper(s.country), coalesce(v_actor.region_code, s.region_code)
    INTO v_actor_country, v_actor_region FROM public.sites s WHERE s.id = v_actor.site_id;
  IF v_actor.role NOT IN ('group_ceo', 'group_cfo', 'super_admin') AND v_actor_country IS DISTINCT FROM upper(v_po.country_code) THEN
    RAISE EXCEPTION 'Approver is outside the PO country' USING ERRCODE = '42501';
  END IF;

  v_region_code := coalesce(v_po.region_code, (SELECT s.region_code FROM public.sites s WHERE s.id = v_po.site_id));
  IF v_region_code IS NOT NULL THEN
    SELECT upper(r.country), lower(r.status), coalesce(r.autonomous_po_limit, 10000000.00)
      INTO v_region_country, v_region_status, v_reg_limit
      FROM public.regions r WHERE r.code = v_region_code;
    IF NOT FOUND OR v_region_status <> 'active' OR v_reg_limit IS NULL OR v_reg_limit < 0 THEN
      RAISE EXCEPTION 'An active configured regional PO limit is required' USING ERRCODE = '23514';
    END IF;
    IF v_region_country IS DISTINCT FROM upper(v_po.country_code) THEN
      RAISE EXCEPTION 'PO region does not belong to the order country' USING ERRCODE = '42501';
    END IF;
  ELSE
    v_reg_limit := 10000000.00;
  END IF;

  SELECT coalesce(cgl.po_country_limit, 100000000.00) INTO v_country_limit
    FROM public.country_governance_limits cgl WHERE upper(cgl.country_code) = upper(v_po.country_code);
  IF v_country_limit IS NULL THEN v_country_limit := 100000000.00; END IF;
  v_escalated := v_po.total_amount > v_reg_limit;
  v_group_tier := v_po.total_amount > v_country_limit;

  -- Tier 1: PO <= 10M (Regional Autonomous Limit)
  IF NOT v_escalated AND v_actor.role IN ('regional_procurement_manager', 'regional_operations_manager') AND
     (v_region_code IS NULL OR v_actor_region IS DISTINCT FROM v_region_code) THEN
    RAISE EXCEPTION 'Order is outside your assigned region' USING ERRCODE = '42501';
  END IF;

  -- Tier 2: 10M < PO <= 100M (Country Autonomous Limit)
  IF v_escalated AND NOT v_group_tier THEN
    IF v_actor.role IN ('regional_procurement_manager', 'regional_operations_manager') THEN
      RAISE EXCEPTION 'Order exceeds the configured regional PO limit (10M) and requires country leadership approval' USING ERRCODE = '42501';
    END IF;
    IF v_po.finance_cleared_by_employee_id IS NULL OR v_po.finance_cleared_by_employee_id = v_actor.id OR
       v_po.finance_cleared_at IS NULL OR v_po.finance_cleared_amount IS DISTINCT FROM v_po.total_amount OR
       v_po.finance_cleared_supplier_id IS DISTINCT FROM v_po.supplier_id OR
       v_po.finance_cleared_currency IS DISTINCT FROM v_po.currency OR
       v_po.finance_cleared_payment_terms IS DISTINCT FROM v_po.payment_terms THEN
      RAISE EXCEPTION 'Current Country Finance clearance is required above the regional PO limit' USING ERRCODE = '42501';
    END IF;
    IF v_actor.role NOT IN ('country_commercial_director', 'country_managing_director', 'country_operations_director', 'head_of_procurement', 'group_cfo', 'group_ceo', 'super_admin') THEN
      RAISE EXCEPTION 'Order between 10M and 100M requires Country Commercial Director or Country MD approval' USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Tier 3: PO > 100M (Above Country Autonomous Limit)
  IF v_group_tier THEN
    IF v_actor.role NOT IN ('group_cfo', 'group_ceo', 'super_admin') THEN
      RAISE EXCEPTION 'Orders above 100M country limit require Group Executive (Group CFO/CEO) sign-off' USING ERRCODE = '42501';
    END IF;
    IF v_po.country_md_recommended_at IS NULL AND v_actor.role <> 'super_admin' THEN
      RAISE EXCEPTION 'Orders above 100M country limit require Country Managing Director recommendation' USING ERRCODE = '42501';
    END IF;
    IF v_po.finance_cleared_by_employee_id IS NULL OR v_po.finance_cleared_at IS NULL OR
       v_po.finance_cleared_amount IS DISTINCT FROM v_po.total_amount OR
       v_po.finance_cleared_supplier_id IS DISTINCT FROM v_po.supplier_id OR
       v_po.finance_cleared_currency IS DISTINCT FROM v_po.currency OR
       v_po.finance_cleared_payment_terms IS DISTINCT FROM v_po.payment_terms THEN
      RAISE EXCEPTION 'Group Finance clearance is required for orders above the 100M country limit' USING ERRCODE = '42501';
    END IF;
  END IF;

  v_notes := coalesce(v_po.notes, '') || E'\n[APPROVED_BY:' || v_actor.name || ' (' || v_actor.role || '):' || now()::text || ' REASON:' || btrim(p_reason_code) || ']';
  IF nullif(btrim(coalesce(p_notes, '')), '') IS NOT NULL THEN v_notes := v_notes || E'\n[APPROVAL_NOTE:' || left(btrim(p_notes), 1000) || ']'; END IF;

  UPDATE public.purchase_orders SET
    status = 'Approved', approved_by = v_actor.name, approved_at = now(), approver_role = v_actor.role,
    approver_employee_id = v_actor.id::text, approver_gps = p_gps_coords, approval_reason_code = btrim(p_reason_code),
    approval_notes = left(coalesce(p_notes, ''), 1000), notes = v_notes, requires_hq_approval = false,
    hq_approved_by = CASE WHEN v_escalated THEN v_actor.name ELSE v_po.hq_approved_by END,
    hq_approved_at = CASE WHEN v_escalated THEN now() ELSE v_po.hq_approved_at END, updated_at = now()
  WHERE id = p_po_id;

  -- Invariant: Approved PO atomically creates a WMS RECEIVE job
  IF NOT EXISTS (SELECT 1 FROM public.wms_jobs WHERE order_ref = p_po_id::text AND type = 'RECEIVE') THEN
    INSERT INTO public.wms_jobs (
      id, site_id, type, priority, status, items_count, location, order_ref, job_number, country_code, line_items, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_po.site_id, 'RECEIVE',
      CASE WHEN v_po.priority = 'Urgent' THEN 'Critical' ELSE 'Normal' END,
      'Pending', coalesce(v_po.items_count, 0), 'INBOUND_DOCK',
      p_po_id::text, coalesce(v_po.po_number, p_po_id::text), v_po.country_code,
      coalesce((SELECT jsonb_agg(jsonb_build_object(
        'productId', coalesce(poi.product_id::text, 'UNKNOWN'),
        'name', coalesce(poi.product_name, 'Unknown Item'),
        'sku', coalesce(poi.sku, ''),
        'expectedQty', coalesce(poi.quantity, 0),
        'unitCost', coalesce(poi.unit_cost, 0),
        'pickedQty', 0, 'receivedQty', 0, 'status', 'Pending'
      )) FROM public.po_items poi WHERE poi.po_id = p_po_id), '[]'::jsonb), now(), now()
    );
  END IF;

  INSERT INTO public.system_logs (user_name, action, module, details, site_id, country_code, entity_type, entity_id, performed_by)
  VALUES (v_actor.name, 'PURCHASE_ORDER_APPROVED', 'Procurement',
    jsonb_build_object('po_id',p_po_id,'amount',v_po.total_amount,'currency',v_po.currency, 'approver_role',v_actor.role,
      'reason_code',btrim(p_reason_code),'regional_limit',v_reg_limit,'country_limit',v_country_limit,'hq_escalation',v_escalated,'group_tier',v_group_tier)::text,
    v_po.site_id, v_po.country_code, 'purchase_orders', p_po_id::text, v_actor.id::text);

  RETURN jsonb_build_object('success',true,'po_id',p_po_id,'status','Approved',
    'approved_by',v_actor.name,'hq_escalation',v_escalated,'group_tier',v_group_tier);
END;
$function$
;
REVOKE ALL ON FUNCTION public.approve_purchase_order(uuid,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_purchase_order(uuid,text,text,text,text,text,text) TO authenticated;
COMMIT;

