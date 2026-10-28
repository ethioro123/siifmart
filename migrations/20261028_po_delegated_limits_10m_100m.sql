-- Delegated Governance Framework Phase 2:
-- PO Spending Thresholds: 10M Regional Autonomous Limit / 100M Country Limit
-- 1. PO <= 10M: Buyer creates -> Regional Procurement Manager approves
-- 2. 10M < PO <= 100M: Country Finance clearance -> Country Commercial Director or Country MD approves
-- 3. PO > 100M: Country MD recommendation -> Group Finance clearance -> Group CFO / Group CEO approves
-- Invariants: Zero Self-Approval, Multi-Country Isolation, Atomic WMS RECEIVE Job

-- 1. Country governance limits table for configurable national thresholds
CREATE TABLE IF NOT EXISTS public.country_governance_limits (
    country_code VARCHAR(10) PRIMARY KEY,
    po_regional_default_limit NUMERIC(14, 2) NOT NULL DEFAULT 10000000.00, po_country_limit NUMERIC(14, 2) NOT NULL DEFAULT 100000000.00,
    expense_regional_limit NUMERIC(14, 2) NOT NULL DEFAULT 2000000.00, expense_country_limit NUMERIC(14, 2) NOT NULL DEFAULT 20000000.00,
    headcount_country_buffer INTEGER NOT NULL DEFAULT 10, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.country_governance_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS country_governance_limits_read ON public.country_governance_limits;
CREATE POLICY country_governance_limits_read ON public.country_governance_limits
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.country_governance_limits (country_code, po_regional_default_limit, po_country_limit, expense_regional_limit, expense_country_limit, headcount_country_buffer)
VALUES ('KE', 10000000.00, 100000000.00, 2000000.00, 20000000.00, 10),
       ('ET', 10000000.00, 100000000.00, 2000000.00, 20000000.00, 10)
ON CONFLICT (country_code) DO UPDATE SET
  po_regional_default_limit = EXCLUDED.po_regional_default_limit,
  po_country_limit = EXCLUDED.po_country_limit;

-- 2. Configure default regional limits in public.regions.autonomous_po_limit (10,000,000.00)
CREATE OR REPLACE FUNCTION private.guard_regional_po_limit_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_actor public.employees%ROWTYPE;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.autonomous_po_limit IS NOT DISTINCT FROM OLD.autonomous_po_limit THEN RETURN NEW; END IF;
  IF NEW.autonomous_po_limit IS NULL OR NEW.autonomous_po_limit < 0 THEN
    RAISE EXCEPTION 'Regional PO limit must be set to a nonnegative amount' USING ERRCODE = '23514';
  END IF;
  IF current_user IN ('postgres', 'supabase_admin') OR (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  SELECT * INTO v_actor FROM public.employees WHERE id = (SELECT auth.uid()) AND lower(coalesce(status, 'active')) = 'active';
  IF v_actor.id IS NULL OR v_actor.role NOT IN ('super_admin', 'country_managing_director') THEN
    RAISE EXCEPTION 'Only country leadership can set the regional PO limit' USING ERRCODE = '42501';
  END IF;
  IF v_actor.role = 'country_managing_director' AND public.get_my_country_code_strict() IS DISTINCT FROM upper(NEW.country) THEN
    RAISE EXCEPTION 'Regional PO limit is outside your country' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

ALTER TABLE public.regions ALTER COLUMN autonomous_po_limit SET DEFAULT 10000000.00;
UPDATE public.regions SET autonomous_po_limit = 10000000.00
  WHERE autonomous_po_limit IS NULL OR autonomous_po_limit < 10000000.00;

-- 3. Extend purchase_orders table with Country MD recommendation and Group Finance fields
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS country_md_recommended_by_employee_id uuid, ADD COLUMN IF NOT EXISTS country_md_recommended_at timestamptz,
  ADD COLUMN IF NOT EXISTS country_md_recommendation_notes text, ADD COLUMN IF NOT EXISTS group_finance_cleared_by_employee_id uuid,
  ADD COLUMN IF NOT EXISTS group_finance_cleared_at timestamptz, ADD COLUMN IF NOT EXISTS group_finance_clearance_reason text;

-- 4. Country MD recommendation RPC for high-value orders exceeding Country Autonomous Limit (> 100M)
CREATE OR REPLACE FUNCTION public.recommend_purchase_order_country_md(p_po_id uuid, p_notes text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_po public.purchase_orders%ROWTYPE;
  v_actor public.employees%ROWTYPE;
  v_actor_country text;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR nullif(btrim(p_notes), '') IS NULL THEN
    RAISE EXCEPTION 'Authenticated Country Managing Director and recommendation notes required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_actor FROM public.employees
    WHERE id = (SELECT auth.uid()) AND role IN ('country_managing_director', 'super_admin')
      AND lower(coalesce(status, 'active')) = 'active';
  IF v_actor.id IS NULL THEN
    RAISE EXCEPTION 'Country Managing Director role required for country recommendation' USING ERRCODE = '42501';
  END IF;
  SELECT upper(s.country) INTO v_actor_country FROM public.sites s WHERE s.id = v_actor.site_id;
  SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id FOR UPDATE;
  IF v_po.id IS NULL OR v_po.status NOT IN ('Draft', 'Pending') THEN
    RAISE EXCEPTION 'Open purchase order required for Country MD recommendation' USING ERRCODE = '23514';
  END IF;
  IF v_actor.role <> 'super_admin' AND v_actor_country IS DISTINCT FROM upper(v_po.country_code) THEN
    RAISE EXCEPTION 'Country Managing Director cannot recommend orders outside their country' USING ERRCODE = '42501';
  END IF;
  IF lower(btrim(coalesce(v_po.created_by, ''))) IN (lower(btrim(v_actor.name)), v_actor.id::text)
     OR lower(btrim(coalesce(v_po.requested_by, ''))) IN (lower(btrim(v_actor.name)), v_actor.id::text) THEN
    RAISE EXCEPTION 'PO creator or requester cannot recommend their own order' USING ERRCODE = '42501';
  END IF;
  UPDATE public.purchase_orders SET
    country_md_recommended_by_employee_id = v_actor.id,
    country_md_recommended_at = now(),
    country_md_recommendation_notes = btrim(p_notes),
    updated_at = now()
  WHERE id = p_po_id;
  INSERT INTO public.system_logs (user_name, action, module, details, site_id, country_code, entity_type, entity_id, performed_by)
  VALUES (v_actor.name, 'PURCHASE_ORDER_COUNTRY_MD_RECOMMENDED', 'Procurement',
    jsonb_build_object('po_id', p_po_id, 'amount', v_po.total_amount, 'currency', v_po.currency, 'notes', btrim(p_notes))::text,
    v_po.site_id, v_po.country_code, 'purchase_orders', p_po_id::text, v_actor.id::text);
  RETURN jsonb_build_object('po_id', p_po_id, 'recommended_at', now(), 'recommended_by', v_actor.name);
END;
$$;
REVOKE ALL ON FUNCTION public.recommend_purchase_order_country_md(uuid, text) FROM PUBLIC, anon; GRANT EXECUTE ON FUNCTION public.recommend_purchase_order_country_md(uuid, text) TO authenticated;

-- 5. Finance clearance RPC supporting Country Finance (10M - 100M) and Group Finance (> 100M)
CREATE OR REPLACE FUNCTION public.clear_purchase_order_finance(p_po_id uuid, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_po public.purchase_orders%ROWTYPE;
  v_actor public.employees%ROWTYPE;
  v_actor_country text;
  v_country_limit numeric := 100000000.00;
  v_is_group_tier boolean;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR nullif(btrim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Authenticated finance officer and clearance reason required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_actor FROM public.employees
    WHERE id = (SELECT auth.uid()) AND role IN ('country_finance_director', 'head_of_finance', 'group_cfo', 'super_admin')
      AND lower(coalesce(status, 'active')) = 'active';
  IF v_actor.id IS NULL THEN
    RAISE EXCEPTION 'Authorized Finance Director or Group CFO role required for finance clearance' USING ERRCODE = '42501';
  END IF;
  SELECT upper(s.country) INTO v_actor_country FROM public.sites s WHERE s.id = v_actor.site_id;
  SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id FOR UPDATE;
  IF v_po.id IS NULL OR v_po.status NOT IN ('Draft', 'Pending') THEN
    RAISE EXCEPTION 'Open purchase order required for finance clearance' USING ERRCODE = '23514';
  END IF;
  IF v_actor.role NOT IN ('group_cfo', 'super_admin') AND v_actor_country IS DISTINCT FROM upper(v_po.country_code) THEN
    RAISE EXCEPTION 'Finance approver is outside the order country' USING ERRCODE = '42501';
  END IF;
  IF lower(btrim(coalesce(v_po.created_by, ''))) IN (lower(btrim(v_actor.name)), v_actor.id::text)
     OR lower(btrim(coalesce(v_po.requested_by, ''))) IN (lower(btrim(v_actor.name)), v_actor.id::text) THEN
    RAISE EXCEPTION 'PO creator or requester cannot clear finance for their own order' USING ERRCODE = '42501';
  END IF;
  SELECT coalesce(cgl.po_country_limit, 100000000.00) INTO v_country_limit
    FROM public.country_governance_limits cgl WHERE upper(cgl.country_code) = upper(v_po.country_code);
  IF v_country_limit IS NULL THEN v_country_limit := 100000000.00; END IF;
  v_is_group_tier := v_po.total_amount > v_country_limit;
  PERFORM set_config('siifmart.po_finance_clearance', 'yes', true);
  UPDATE public.purchase_orders SET
    finance_cleared_by_employee_id = v_actor.id, finance_cleared_at = now(), finance_clearance_reason = btrim(p_reason),
    finance_cleared_amount = v_po.total_amount, finance_cleared_supplier_id = v_po.supplier_id, finance_cleared_currency = v_po.currency,
    finance_cleared_payment_terms = v_po.payment_terms, updated_at = now(),
    group_finance_cleared_by_employee_id = CASE WHEN v_is_group_tier OR v_actor.role IN ('group_cfo', 'super_admin') THEN v_actor.id ELSE group_finance_cleared_by_employee_id END,
    group_finance_cleared_at = CASE WHEN v_is_group_tier OR v_actor.role IN ('group_cfo', 'super_admin') THEN now() ELSE group_finance_cleared_at END,
    group_finance_clearance_reason = CASE WHEN v_is_group_tier OR v_actor.role IN ('group_cfo', 'super_admin') THEN btrim(p_reason) ELSE group_finance_clearance_reason END
  WHERE id = p_po_id;
  INSERT INTO public.system_logs (user_name, action, module, details, site_id, country_code, entity_type, entity_id, performed_by)
  VALUES (v_actor.name, 'PURCHASE_ORDER_FINANCE_CLEARED', 'Procurement',
    jsonb_build_object('po_id', p_po_id, 'amount', v_po.total_amount, 'currency', v_po.currency, 'is_group_tier', v_is_group_tier, 'reason', btrim(p_reason))::text,
    v_po.site_id, v_po.country_code, 'purchase_orders', p_po_id::text, v_actor.id::text);
  RETURN jsonb_build_object('po_id', p_po_id, 'finance_cleared_at', now(), 'group_tier', v_is_group_tier);
END;
$$;
REVOKE ALL ON FUNCTION public.clear_purchase_order_finance(uuid, text) FROM PUBLIC, anon; GRANT EXECUTE ON FUNCTION public.clear_purchase_order_finance(uuid, text) TO authenticated;

-- 6. Upgraded approve_purchase_order RPC enforcing 10M / 100M tiered limits and atomic WMS RECEIVE job
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
    'regional_procurement_manager', 'country_commercial_director', 'country_managing_director',
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
  IF NOT v_escalated AND v_actor.role = 'regional_procurement_manager' AND
     (v_region_code IS NULL OR v_actor_region IS DISTINCT FROM v_region_code) THEN
    RAISE EXCEPTION 'Order is outside your assigned region' USING ERRCODE = '42501';
  END IF;

  -- Tier 2: 10M < PO <= 100M (Country Autonomous Limit)
  IF v_escalated AND NOT v_group_tier THEN
    IF v_actor.role = 'regional_procurement_manager' THEN
      RAISE EXCEPTION 'Order exceeds the configured regional PO limit (10M) and requires country leadership approval' USING ERRCODE = '42501';
    END IF;
    IF v_po.finance_cleared_by_employee_id IS NULL OR v_po.finance_cleared_by_employee_id = v_actor.id OR
       v_po.finance_cleared_at IS NULL OR v_po.finance_cleared_amount IS DISTINCT FROM v_po.total_amount OR
       v_po.finance_cleared_supplier_id IS DISTINCT FROM v_po.supplier_id OR
       v_po.finance_cleared_currency IS DISTINCT FROM v_po.currency OR
       v_po.finance_cleared_payment_terms IS DISTINCT FROM v_po.payment_terms THEN
      RAISE EXCEPTION 'Current Country Finance clearance is required above the regional PO limit' USING ERRCODE = '42501';
    END IF;
    IF v_actor.role NOT IN ('country_commercial_director', 'country_managing_director', 'head_of_procurement', 'group_cfo', 'group_ceo', 'super_admin') THEN
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
  IF nullif(btrim(coalesce(p_notes, '')), '') IS NOT NULL THEN
    v_notes := v_notes || E'\n[APPROVAL_NOTE:' || left(btrim(p_notes), 1000) || ']';
  END IF;

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
$$;
REVOKE ALL ON FUNCTION public.approve_purchase_order(uuid,text,text,text,text,text,text) FROM PUBLIC, anon; GRANT EXECUTE ON FUNCTION public.approve_purchase_order(uuid,text,text,text,text,text,text) TO authenticated;

-- 7. Trigger guard enforcing 10M / 100M tiered limits on all write paths
CREATE OR REPLACE FUNCTION private.guard_purchase_order_approval_policy()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_actor public.employees%ROWTYPE;
  v_actor_country text;
  v_actor_region text;
  v_region_code text;
  v_region_country text; v_reg_limit numeric := 10000000.00; v_country_limit numeric := 100000000.00;
  v_region_status text;
  v_is_clearance_change boolean; v_is_recommendation_change boolean; v_is_approval boolean;
BEGIN
  v_is_clearance_change :=
    (NEW.finance_cleared_by_employee_id, NEW.finance_cleared_at, NEW.finance_clearance_reason,
     NEW.finance_cleared_amount, NEW.finance_cleared_supplier_id, NEW.finance_cleared_currency,
     NEW.finance_cleared_payment_terms) IS DISTINCT FROM
    (OLD.finance_cleared_by_employee_id, OLD.finance_cleared_at, OLD.finance_clearance_reason,
     OLD.finance_cleared_amount, OLD.finance_cleared_supplier_id, OLD.finance_cleared_currency,
     OLD.finance_cleared_payment_terms);

  v_is_recommendation_change :=
    (NEW.country_md_recommended_by_employee_id, NEW.country_md_recommended_at, NEW.country_md_recommendation_notes) IS DISTINCT FROM
    (OLD.country_md_recommended_by_employee_id, OLD.country_md_recommended_at, OLD.country_md_recommendation_notes);

  v_is_approval := NEW.status = 'Approved' AND OLD.status IS DISTINCT FROM 'Approved';
  IF NOT v_is_clearance_change AND NOT v_is_recommendation_change AND NOT v_is_approval THEN
    RETURN NEW;
  END IF;

  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;

  SELECT * INTO v_actor FROM public.employees
    WHERE id = (SELECT auth.uid()) AND lower(coalesce(status, 'active')) = 'active';
  IF v_actor.id IS NULL THEN
    RAISE EXCEPTION 'Active employee required for PO decision' USING ERRCODE = '42501';
  END IF;

  SELECT upper(s.country), coalesce(v_actor.region_code, s.region_code)
    INTO v_actor_country, v_actor_region FROM public.sites s WHERE s.id = v_actor.site_id;

  v_region_code := coalesce(NEW.region_code, (SELECT s.region_code FROM public.sites s WHERE s.id = NEW.site_id));
  IF v_region_code IS NOT NULL THEN
    SELECT upper(r.country), coalesce(r.autonomous_po_limit, 10000000.00), lower(r.status)
      INTO v_region_country, v_reg_limit, v_region_status FROM public.regions r WHERE r.code = v_region_code;
    IF NOT FOUND OR v_reg_limit IS NULL OR v_reg_limit < 0 OR v_region_status <> 'active' THEN
      RAISE EXCEPTION 'An active region with a configured PO limit is required' USING ERRCODE = '23514';
    END IF;
    IF v_region_country IS DISTINCT FROM upper(NEW.country_code) THEN
      RAISE EXCEPTION 'PO country does not match the configured region' USING ERRCODE = '42501';
    END IF;
  ELSE
    v_reg_limit := 10000000.00;
  END IF;

  SELECT coalesce(cgl.po_country_limit, 100000000.00) INTO v_country_limit
    FROM public.country_governance_limits cgl WHERE upper(cgl.country_code) = upper(NEW.country_code);
  IF v_country_limit IS NULL THEN v_country_limit := 100000000.00; END IF;

  IF lower(btrim(coalesce(NEW.created_by, ''))) IN (lower(btrim(v_actor.name)), v_actor.id::text)
     OR lower(btrim(coalesce(NEW.requested_by, ''))) IN (lower(btrim(v_actor.name)), v_actor.id::text) THEN
    RAISE EXCEPTION 'PO creator or requester cannot act on their own order' USING ERRCODE = '42501';
  END IF;

  IF v_is_clearance_change THEN
    IF current_setting('siifmart.po_finance_clearance', true) IS DISTINCT FROM 'yes'
       OR v_actor.role NOT IN ('country_finance_director', 'head_of_finance', 'group_cfo', 'super_admin')
       OR (v_actor.role NOT IN ('group_cfo', 'super_admin') AND v_actor_country IS DISTINCT FROM upper(NEW.country_code))
       OR NEW.status NOT IN ('Draft', 'Pending') OR NEW.total_amount <= v_reg_limit
       OR v_actor.id IS DISTINCT FROM NEW.finance_cleared_by_employee_id OR NEW.finance_cleared_at IS NULL
       OR nullif(btrim(NEW.finance_clearance_reason), '') IS NULL
       OR NEW.finance_cleared_amount IS DISTINCT FROM NEW.total_amount
       OR NEW.finance_cleared_supplier_id IS DISTINCT FROM NEW.supplier_id
       OR NEW.finance_cleared_currency IS DISTINCT FROM NEW.currency
       OR NEW.finance_cleared_payment_terms IS DISTINCT FROM NEW.payment_terms THEN
      RAISE EXCEPTION 'Finance clearance requires an independent finance director and unchanged PO terms' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF v_is_recommendation_change THEN
    IF v_actor.role NOT IN ('country_managing_director', 'super_admin')
       OR (v_actor.role <> 'super_admin' AND v_actor_country IS DISTINCT FROM upper(NEW.country_code))
       OR NEW.total_amount <= v_country_limit THEN
      RAISE EXCEPTION 'Country MD recommendation requires Country Managing Director role and PO above 100M' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF v_is_approval THEN
    IF v_actor.role NOT IN ('regional_procurement_manager', 'country_commercial_director', 'country_managing_director', 'head_of_procurement', 'group_cfo', 'group_ceo', 'super_admin') THEN
      RAISE EXCEPTION 'Final PO approval requires an authorized procurement lead or executive' USING ERRCODE = '42501';
    END IF;
    IF v_actor.role NOT IN ('group_ceo', 'group_cfo', 'super_admin') AND v_actor_country IS DISTINCT FROM upper(NEW.country_code) THEN
      RAISE EXCEPTION 'PO approver is outside the order country' USING ERRCODE = '42501';
    END IF;

    IF NEW.total_amount <= v_reg_limit THEN
      IF v_actor.role = 'regional_procurement_manager' AND (v_region_code IS NULL OR v_actor_region IS DISTINCT FROM v_region_code) THEN
        RAISE EXCEPTION 'PO is outside your assigned region' USING ERRCODE = '42501';
      END IF;
    END IF;

    IF NEW.total_amount > v_reg_limit AND NEW.total_amount <= v_country_limit THEN
      IF v_actor.role = 'regional_procurement_manager' THEN
        RAISE EXCEPTION 'PO exceeds your configured regional procurement authority (10M)' USING ERRCODE = '42501';
      END IF;
      IF NEW.finance_cleared_by_employee_id IS NULL OR NEW.finance_cleared_by_employee_id = v_actor.id
         OR NEW.finance_cleared_at IS NULL OR NEW.finance_cleared_amount IS DISTINCT FROM NEW.total_amount
         OR NEW.finance_cleared_supplier_id IS DISTINCT FROM NEW.supplier_id
         OR NEW.finance_cleared_currency IS DISTINCT FROM NEW.currency
         OR NEW.finance_cleared_payment_terms IS DISTINCT FROM NEW.payment_terms THEN
        RAISE EXCEPTION 'PO between 10M and 100M requires current Country Finance clearance' USING ERRCODE = '42501';
      END IF;
    END IF;

    IF NEW.total_amount > v_country_limit THEN
      IF v_actor.role NOT IN ('group_cfo', 'group_ceo', 'super_admin') THEN
        RAISE EXCEPTION 'PO above 100M requires Group Executive (Group CFO/CEO) sign-off' USING ERRCODE = '42501';
      END IF;
      IF NEW.country_md_recommended_at IS NULL AND v_actor.role <> 'super_admin' THEN
        RAISE EXCEPTION 'PO above 100M requires Country Managing Director recommendation' USING ERRCODE = '42501';
      END IF;
      IF NEW.finance_cleared_by_employee_id IS NULL OR NEW.finance_cleared_at IS NULL
         OR NEW.finance_cleared_amount IS DISTINCT FROM NEW.total_amount
         OR NEW.finance_cleared_supplier_id IS DISTINCT FROM NEW.supplier_id
         OR NEW.finance_cleared_currency IS DISTINCT FROM NEW.currency
         OR NEW.finance_cleared_payment_terms IS DISTINCT FROM NEW.payment_terms THEN
        RAISE EXCEPTION 'PO above 100M requires Group Finance clearance' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_purchase_order_approval_policy() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_purchase_order_approval_policy ON public.purchase_orders;
CREATE TRIGGER guard_purchase_order_approval_policy BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION private.guard_purchase_order_approval_policy();

-- 8. Upgraded get_po_finance_review_queue RPC supporting Country Finance and Group CFO
CREATE OR REPLACE FUNCTION public.get_po_finance_review_queue(
  p_country text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0
) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH eligible AS MATERIALIZED (
    SELECT po.id, po.po_number, po.supplier_name, po.total_amount, po.currency,
           po.status, po.created_by, po.requested_by, po.created_at,
           r.code AS region_code, coalesce(r.autonomous_po_limit, 10000000.00) AS regional_limit,
           coalesce(cgl.po_country_limit, 100000000.00) AS country_limit
    FROM public.purchase_orders po
    JOIN public.sites s ON s.id = po.site_id
    JOIN public.regions r ON r.code = coalesce(po.region_code, s.region_code)
      AND upper(r.country) = upper(po.country_code)
    LEFT JOIN public.country_governance_limits cgl ON upper(cgl.country_code) = upper(po.country_code)
    WHERE po.country_code = upper(p_country)
      AND po.status IN ('Draft','Pending')
      AND lower(r.status) = 'active'
      AND po.total_amount > coalesce(r.autonomous_po_limit, 10000000.00)
      AND NOT (po.finance_cleared_at IS NOT NULL
        AND po.finance_cleared_amount IS NOT DISTINCT FROM po.total_amount
        AND po.finance_cleared_supplier_id IS NOT DISTINCT FROM po.supplier_id
        AND po.finance_cleared_currency IS NOT DISTINCT FROM po.currency
        AND po.finance_cleared_payment_terms IS NOT DISTINCT FROM po.payment_terms)
      AND (
        upper(p_country) = public.get_my_country_code_strict()
        OR EXISTS (
          SELECT 1 FROM public.employees e WHERE e.id = (SELECT auth.uid())
          AND e.role IN ('group_cfo', 'group_ceo', 'super_admin')
          AND lower(coalesce(e.status,'active')) = 'active'
        )
      )
      AND EXISTS (
        SELECT 1 FROM public.employees e WHERE e.id = (SELECT auth.uid())
        AND e.role IN ('country_finance_director', 'head_of_finance', 'group_cfo', 'super_admin')
        AND lower(coalesce(e.status,'active')) = 'active'
      )
  ), page AS (
    SELECT * FROM eligible ORDER BY created_at, id
    LIMIT least(greatest(coalesce(p_limit,20),1),50)
    OFFSET greatest(coalesce(p_offset,0),0)
  )
  SELECT jsonb_build_object('data', coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY created_at,id) FROM page),'[]'::jsonb),
    'count', (SELECT count(*) FROM eligible));
$$;
REVOKE ALL ON FUNCTION public.get_po_finance_review_queue(text,integer,integer) FROM PUBLIC, anon; GRANT EXECUTE ON FUNCTION public.get_po_finance_review_queue(text,integer,integer) TO authenticated;
