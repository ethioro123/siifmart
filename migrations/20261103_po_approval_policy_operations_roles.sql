-- Align the PO approval policy trigger with the Operations approval authority already
-- permitted by approve_purchase_order and private.guard_procurement_order_decision.
BEGIN;
CREATE OR REPLACE FUNCTION private.guard_purchase_order_approval_policy()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
    IF v_actor.role NOT IN ('regional_procurement_manager', 'regional_operations_manager', 'country_operations_director', 'country_commercial_director', 'country_managing_director', 'head_of_procurement', 'group_cfo', 'group_ceo', 'super_admin') THEN
      RAISE EXCEPTION 'Final PO approval requires an authorized procurement lead or executive' USING ERRCODE = '42501';
    END IF;
    IF v_actor.role NOT IN ('group_ceo', 'group_cfo', 'super_admin') AND v_actor_country IS DISTINCT FROM upper(NEW.country_code) THEN
      RAISE EXCEPTION 'PO approver is outside the order country' USING ERRCODE = '42501';
    END IF;

    IF NEW.total_amount <= v_reg_limit THEN
      IF v_actor.role IN ('regional_procurement_manager', 'regional_operations_manager') AND (v_region_code IS NULL OR v_actor_region IS DISTINCT FROM v_region_code) THEN
        RAISE EXCEPTION 'PO is outside your assigned region' USING ERRCODE = '42501';
      END IF;
    END IF;

    IF NEW.total_amount > v_reg_limit AND NEW.total_amount <= v_country_limit THEN
      IF v_actor.role IN ('regional_procurement_manager', 'regional_operations_manager') THEN
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
$function$;
REVOKE ALL ON FUNCTION private.guard_purchase_order_approval_policy() FROM PUBLIC, anon, authenticated;
COMMIT;
