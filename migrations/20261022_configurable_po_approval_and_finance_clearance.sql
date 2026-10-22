-- Regional PO authority is set in regions.autonomous_po_limit by country leadership.
-- Existing configured amounts are retained; new regions must supply their own limit.
ALTER TABLE public.regions ALTER COLUMN autonomous_po_limit DROP DEFAULT;

ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS finance_cleared_by_employee_id uuid,
  ADD COLUMN IF NOT EXISTS finance_cleared_at timestamptz,
  ADD COLUMN IF NOT EXISTS finance_clearance_reason text,
  ADD COLUMN IF NOT EXISTS finance_cleared_amount numeric,
  ADD COLUMN IF NOT EXISTS finance_cleared_supplier_id uuid,
  ADD COLUMN IF NOT EXISTS finance_cleared_currency text,
  ADD COLUMN IF NOT EXISTS finance_cleared_payment_terms text;

-- A procurement manager cannot change the spending authority they use.
CREATE OR REPLACE FUNCTION private.guard_regional_po_limit_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_actor public.employees%ROWTYPE;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.autonomous_po_limit IS NOT DISTINCT FROM OLD.autonomous_po_limit THEN RETURN NEW; END IF;
  END IF;
  IF NEW.autonomous_po_limit IS NULL OR NEW.autonomous_po_limit < 0 THEN
    RAISE EXCEPTION 'Regional PO limit must be set to a nonnegative amount' USING ERRCODE = '23514';
  END IF;
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  SELECT * INTO v_actor FROM public.employees
    WHERE id = (SELECT auth.uid()) AND lower(coalesce(status, 'active')) = 'active';
  IF v_actor.id IS NULL OR v_actor.role NOT IN ('super_admin', 'country_managing_director') THEN
    RAISE EXCEPTION 'Only country leadership can set the regional PO limit' USING ERRCODE = '42501';
  END IF;
  IF v_actor.role = 'country_managing_director' AND
     public.get_my_country_code_strict() IS DISTINCT FROM upper(NEW.country) THEN
    RAISE EXCEPTION 'Regional PO limit is outside your country' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_regional_po_limit_change() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_regional_po_limit_change ON public.regions;
CREATE TRIGGER guard_regional_po_limit_change
BEFORE INSERT OR UPDATE OF autonomous_po_limit ON public.regions
FOR EACH ROW EXECUTE FUNCTION private.guard_regional_po_limit_change();

-- Applies to all write paths, including direct table updates and the approval RPC.
CREATE OR REPLACE FUNCTION private.guard_purchase_order_approval_policy()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_actor public.employees%ROWTYPE;
  v_actor_country text;
  v_actor_region text;
  v_region_code text;
  v_region_country text;
  v_limit numeric;
  v_region_status text;
  v_is_clearance_change boolean;
  v_is_approval boolean;
BEGIN
  v_is_clearance_change :=
    (NEW.finance_cleared_by_employee_id, NEW.finance_cleared_at,
     NEW.finance_clearance_reason, NEW.finance_cleared_amount,
     NEW.finance_cleared_supplier_id, NEW.finance_cleared_currency,
     NEW.finance_cleared_payment_terms) IS DISTINCT FROM
    (OLD.finance_cleared_by_employee_id, OLD.finance_cleared_at,
     OLD.finance_clearance_reason, OLD.finance_cleared_amount,
     OLD.finance_cleared_supplier_id, OLD.finance_cleared_currency,
     OLD.finance_cleared_payment_terms);
  v_is_approval := NEW.status = 'Approved' AND OLD.status IS DISTINCT FROM 'Approved';
  IF NOT v_is_clearance_change AND NOT v_is_approval THEN RETURN NEW; END IF;
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;

  SELECT * INTO v_actor FROM public.employees
    WHERE id = (SELECT auth.uid()) AND lower(coalesce(status, 'active')) = 'active';
  IF v_actor.id IS NULL THEN
    RAISE EXCEPTION 'Active employee required for PO decision' USING ERRCODE = '42501';
  END IF;
  SELECT upper(s.country), coalesce(v_actor.region_code, s.region_code)
    INTO v_actor_country, v_actor_region FROM public.sites s WHERE s.id = v_actor.site_id;
  v_region_code := NEW.region_code;
  IF v_region_code IS NULL THEN
    SELECT s.region_code INTO v_region_code FROM public.sites s WHERE s.id = NEW.site_id;
  END IF;
  IF v_region_code IS NOT NULL THEN
    SELECT upper(r.country), r.autonomous_po_limit, lower(r.status)
      INTO v_region_country, v_limit, v_region_status
      FROM public.regions r WHERE r.code = v_region_code;
    IF NOT FOUND OR v_limit IS NULL OR v_limit < 0 OR v_region_status <> 'active' THEN
      RAISE EXCEPTION 'An active region with a configured PO limit is required' USING ERRCODE = '23514';
    END IF;
    IF v_region_country IS DISTINCT FROM upper(NEW.country_code) THEN
      RAISE EXCEPTION 'PO country does not match the configured region' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF v_is_clearance_change THEN
    IF current_setting('siifmart.po_finance_clearance', true) IS DISTINCT FROM 'yes'
       OR v_actor.role <> 'head_of_finance'
       OR v_actor_country IS DISTINCT FROM upper(NEW.country_code)
       OR NEW.status NOT IN ('Draft', 'Pending')
       OR v_region_code IS NULL OR NEW.total_amount <= v_limit
       OR v_actor.id IS DISTINCT FROM NEW.finance_cleared_by_employee_id
       OR NEW.finance_cleared_at IS NULL
       OR nullif(btrim(NEW.finance_clearance_reason), '') IS NULL
       OR NEW.finance_cleared_amount IS DISTINCT FROM NEW.total_amount
       OR NEW.finance_cleared_supplier_id IS DISTINCT FROM NEW.supplier_id
       OR NEW.finance_cleared_currency IS DISTINCT FROM NEW.currency
       OR NEW.finance_cleared_payment_terms IS DISTINCT FROM NEW.payment_terms
       OR lower(btrim(coalesce(NEW.created_by, ''))) IN (lower(btrim(v_actor.name)), v_actor.id::text)
       OR lower(btrim(coalesce(NEW.requested_by, ''))) IN (lower(btrim(v_actor.name)), v_actor.id::text)
       OR (to_jsonb(NEW) - ARRAY['finance_cleared_by_employee_id','finance_cleared_at',
          'finance_clearance_reason','finance_cleared_amount','finance_cleared_supplier_id',
          'finance_cleared_currency','finance_cleared_payment_terms','updated_at']) IS DISTINCT FROM
          (to_jsonb(OLD) - ARRAY['finance_cleared_by_employee_id','finance_cleared_at',
          'finance_clearance_reason','finance_cleared_amount','finance_cleared_supplier_id',
          'finance_cleared_currency','finance_cleared_payment_terms','updated_at']) THEN
      RAISE EXCEPTION 'Finance clearance requires an independent HQ finance officer and unchanged PO terms' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF v_is_approval THEN
    IF v_actor.role NOT IN ('head_of_procurement','regional_procurement_manager','super_admin') THEN
      RAISE EXCEPTION 'Final PO approval requires an authorized procurement lead' USING ERRCODE = '42501';
    END IF;
    IF lower(btrim(coalesce(OLD.created_by, ''))) IN (lower(btrim(v_actor.name)), v_actor.id::text)
       OR lower(btrim(coalesce(OLD.requested_by, ''))) IN (lower(btrim(v_actor.name)), v_actor.id::text) THEN
      RAISE EXCEPTION 'PO creator cannot approve their own order' USING ERRCODE = '42501';
    END IF;
    IF v_actor.role <> 'super_admin' AND v_actor_country IS DISTINCT FROM upper(NEW.country_code) THEN
      RAISE EXCEPTION 'PO approver is outside the order country' USING ERRCODE = '42501';
    END IF;
    IF v_actor.role = 'regional_procurement_manager' AND
       (v_region_code IS NULL OR v_actor_region IS DISTINCT FROM v_region_code
        OR NEW.total_amount > v_limit) THEN
      RAISE EXCEPTION 'PO exceeds your configured regional procurement authority' USING ERRCODE = '42501';
    END IF;
    IF v_region_code IS NOT NULL AND NEW.total_amount > v_limit AND
       (v_actor.role NOT IN ('head_of_procurement','super_admin')
        OR NEW.finance_cleared_by_employee_id IS NULL
        OR NEW.finance_cleared_by_employee_id = v_actor.id
        OR NEW.finance_cleared_at IS NULL
        OR NEW.finance_cleared_amount IS DISTINCT FROM NEW.total_amount
        OR NEW.finance_cleared_supplier_id IS DISTINCT FROM NEW.supplier_id
        OR NEW.finance_cleared_currency IS DISTINCT FROM NEW.currency
        OR NEW.finance_cleared_payment_terms IS DISTINCT FROM NEW.payment_terms) THEN
      RAISE EXCEPTION 'PO above its regional limit requires current HQ finance clearance and HQ procurement approval' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_purchase_order_approval_policy() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_purchase_order_approval_policy ON public.purchase_orders;
CREATE TRIGGER guard_purchase_order_approval_policy
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION private.guard_purchase_order_approval_policy();

CREATE OR REPLACE FUNCTION public.clear_purchase_order_finance(p_po_id uuid, p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_po public.purchase_orders%ROWTYPE; v_actor public.employees%ROWTYPE;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR nullif(btrim(p_reason), '') IS NULL THEN
    RAISE EXCEPTION 'Authenticated finance officer and clearance reason required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_actor FROM public.employees
    WHERE id = (SELECT auth.uid()) AND role = 'head_of_finance'
      AND lower(coalesce(status, 'active')) = 'active';
  IF v_actor.id IS NULL THEN
    RAISE EXCEPTION 'HQ Head of Finance role required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id FOR UPDATE;
  IF v_po.id IS NULL OR v_po.status NOT IN ('Draft', 'Pending') THEN
    RAISE EXCEPTION 'Open purchase order required for finance clearance' USING ERRCODE = '23514';
  END IF;
  PERFORM set_config('siifmart.po_finance_clearance', 'yes', true);
  UPDATE public.purchase_orders SET
    finance_cleared_by_employee_id = v_actor.id,
    finance_cleared_at = now(),
    finance_clearance_reason = btrim(p_reason),
    finance_cleared_amount = v_po.total_amount,
    finance_cleared_supplier_id = v_po.supplier_id,
    finance_cleared_currency = v_po.currency,
    finance_cleared_payment_terms = v_po.payment_terms
  WHERE id = p_po_id;
  INSERT INTO public.system_logs
    (user_name, action, module, details, site_id, country_code, entity_type, entity_id, performed_by)
  VALUES (v_actor.name, 'PURCHASE_ORDER_FINANCE_CLEARED', 'Procurement',
    jsonb_build_object('po_id',p_po_id,'amount',v_po.total_amount,'currency',v_po.currency,
      'reason',btrim(p_reason))::text, v_po.site_id, v_po.country_code,
    'purchase_orders', p_po_id::text, v_actor.id::text);
  RETURN jsonb_build_object('po_id',p_po_id,'finance_cleared_at',now());
END;
$$;
REVOKE ALL ON FUNCTION public.clear_purchase_order_finance(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clear_purchase_order_finance(uuid,text) TO authenticated;
