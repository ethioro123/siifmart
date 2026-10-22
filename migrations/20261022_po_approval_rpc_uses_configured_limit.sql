-- The RPC must make the same decision as the row trigger and never use a fixed amount.
CREATE OR REPLACE FUNCTION public.approve_purchase_order(
  p_po_id uuid, p_approver_id text, p_approver_name text, p_approver_role text,
  p_reason_code text, p_notes text DEFAULT ''::text, p_gps_coords text DEFAULT NULL::text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_actor public.employees%ROWTYPE;
  v_po public.purchase_orders%ROWTYPE;
  v_actor_country text;
  v_actor_region text;
  v_region_code text;
  v_region_country text;
  v_region_status text;
  v_limit numeric;
  v_escalated boolean := false;
  v_notes text;
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Authenticated employee required for PO approval' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_actor FROM public.employees
    WHERE id = (SELECT auth.uid()) AND lower(coalesce(status, 'active')) = 'active';
  IF v_actor.id IS NULL OR v_actor.role NOT IN
      ('super_admin','head_of_procurement','regional_procurement_manager') THEN
    RAISE EXCEPTION 'Procurement approval authority required' USING ERRCODE = '42501';
  END IF;
  IF p_approver_id IS DISTINCT FROM v_actor.id::text OR
     p_approver_role IS DISTINCT FROM v_actor.role THEN
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
  IF lower(btrim(coalesce(v_po.created_by, ''))) IN
        (lower(btrim(v_actor.name)), v_actor.id::text)
     OR lower(btrim(coalesce(v_po.requested_by, ''))) IN
        (lower(btrim(v_actor.name)), v_actor.id::text) THEN
    RAISE EXCEPTION 'PO creator cannot approve their own order' USING ERRCODE = '42501';
  END IF;
  SELECT upper(s.country), coalesce(v_actor.region_code, s.region_code)
    INTO v_actor_country, v_actor_region
    FROM public.sites s WHERE s.id = v_actor.site_id;
  IF v_actor.role <> 'super_admin' AND
     v_actor_country IS DISTINCT FROM upper(v_po.country_code) THEN
    RAISE EXCEPTION 'Approver is outside the PO country' USING ERRCODE = '42501';
  END IF;
  v_region_code := v_po.region_code;
  IF v_region_code IS NULL THEN
    SELECT s.region_code INTO v_region_code FROM public.sites s WHERE s.id = v_po.site_id;
  END IF;
  IF v_region_code IS NOT NULL THEN
    SELECT upper(r.country), lower(r.status), r.autonomous_po_limit
      INTO v_region_country, v_region_status, v_limit
      FROM public.regions r WHERE r.code = v_region_code;
    IF NOT FOUND OR v_region_status <> 'active' OR v_limit IS NULL OR v_limit < 0 THEN
      RAISE EXCEPTION 'An active configured regional PO limit is required' USING ERRCODE = '23514';
    END IF;
    IF v_region_country IS DISTINCT FROM upper(v_po.country_code) THEN
      RAISE EXCEPTION 'PO region does not belong to the order country' USING ERRCODE = '42501';
    END IF;
    v_escalated := v_po.total_amount > v_limit;
  END IF;
  IF v_actor.role = 'regional_procurement_manager' AND
     (v_region_code IS NULL OR v_actor_region IS DISTINCT FROM v_region_code OR v_escalated) THEN
    RAISE EXCEPTION 'Order exceeds your configured regional authority' USING ERRCODE = '42501';
  END IF;
  IF v_escalated AND
     (v_po.finance_cleared_by_employee_id IS NULL OR
      v_po.finance_cleared_by_employee_id = v_actor.id OR
      v_po.finance_cleared_at IS NULL OR
      v_po.finance_cleared_amount IS DISTINCT FROM v_po.total_amount OR
      v_po.finance_cleared_supplier_id IS DISTINCT FROM v_po.supplier_id OR
      v_po.finance_cleared_currency IS DISTINCT FROM v_po.currency OR
      v_po.finance_cleared_payment_terms IS DISTINCT FROM v_po.payment_terms) THEN
    RAISE EXCEPTION 'Current HQ finance clearance is required above the regional PO limit' USING ERRCODE = '42501';
  END IF;

  v_notes := coalesce(v_po.notes, '') || E'\n[APPROVED_BY:' || v_actor.name ||
    ' (' || v_actor.role || '):' || now()::text || ' REASON:' || btrim(p_reason_code) || ']';
  IF nullif(btrim(coalesce(p_notes, '')), '') IS NOT NULL THEN
    v_notes := v_notes || E'\n[APPROVAL_NOTE:' || left(btrim(p_notes), 1000) || ']';
  END IF;
  UPDATE public.purchase_orders SET
    status = 'Approved', approved_by = v_actor.name, approved_at = now(),
    approver_role = v_actor.role, approver_employee_id = v_actor.id::text,
    approver_gps = p_gps_coords, approval_reason_code = btrim(p_reason_code),
    approval_notes = left(coalesce(p_notes, ''), 1000), notes = v_notes,
    requires_hq_approval = false,
    hq_approved_by = CASE WHEN v_escalated THEN v_actor.name ELSE v_po.hq_approved_by END,
    hq_approved_at = CASE WHEN v_escalated THEN now() ELSE v_po.hq_approved_at END,
    updated_at = now()
  WHERE id = p_po_id;
  INSERT INTO public.system_logs
    (user_name, action, module, details, site_id, country_code, entity_type, entity_id, performed_by)
  VALUES (v_actor.name, 'PURCHASE_ORDER_APPROVED', 'Procurement',
    jsonb_build_object('po_id',p_po_id,'amount',v_po.total_amount,'currency',v_po.currency,
      'approver_role',v_actor.role,'reason_code',btrim(p_reason_code),
      'regional_limit',v_limit,'hq_escalation',v_escalated)::text,
    v_po.site_id, v_po.country_code, 'purchase_orders', p_po_id::text, v_actor.id::text);
  RETURN jsonb_build_object('success',true,'po_id',p_po_id,'status','Approved',
    'approved_by',v_actor.name,'hq_escalation',v_escalated);
END;
$$;
REVOKE ALL ON FUNCTION public.approve_purchase_order(uuid,text,text,text,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_purchase_order(uuid,text,text,text,text,text,text) TO authenticated;
