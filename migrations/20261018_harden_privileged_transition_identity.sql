-- Security hardening for privileged row transitions and overly broad row policies.
-- Verified against production and staging schema on 2026-10-18.

CREATE OR REPLACE FUNCTION public.enforce_authenticated_sensitive_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
  v_actor public.employees%ROWTYPE;
  v_actor_country text;
  v_actor_region text;
  v_row_country text;
  v_hq boolean;
BEGIN
  -- Trusted server-side jobs may perform controlled transitions with service_role.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authenticated employee session required';
  END IF;

  SELECT e.* INTO v_actor
  FROM public.employees e
  WHERE e.id = auth.uid()
    AND COALESCE(lower(e.status), 'active') = 'active'
  LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active employee profile required';
  END IF;

  SELECT upper(s.country), s.region_code
    INTO v_actor_country, v_actor_region
  FROM public.sites s
  WHERE s.id = v_actor.site_id
  LIMIT 1;
  v_hq := lower(v_actor.role) IN ('super_admin', 'ceo');

  IF TG_TABLE_NAME = 'expenses'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.status = 'Approved' THEN
    IF lower(v_actor.role) NOT IN
       ('super_admin','ceo','finance_manager','cfo','regional_manager','regional_finance_officer') THEN
      RAISE EXCEPTION 'Role is not authorized to approve expenses';
    END IF;
    IF NEW.approved_by_id IS DISTINCT FROM v_actor.id
       OR NEW.approved_by IS DISTINCT FROM v_actor.name THEN
      RAISE EXCEPTION 'Expense approver must match the authenticated employee';
    END IF;
    IF OLD.created_by_id = v_actor.id AND NOT v_hq THEN
      RAISE EXCEPTION 'Expense creator cannot approve their own expense';
    END IF;
    IF COALESCE(OLD.escalated_to_ceo, false) AND NOT v_hq THEN
      RAISE EXCEPTION 'Executive approval required for this expense';
    END IF;
    SELECT upper(COALESCE(NEW.country_code, s.country)) INTO v_row_country
    FROM (SELECT 1) q LEFT JOIN public.sites s ON s.id = NEW.site_id;
    IF v_row_country IS DISTINCT FROM v_actor_country AND NOT v_hq THEN
      RAISE EXCEPTION 'Expense approval is limited to the employee country';
    END IF;
    IF lower(v_actor.role) IN ('regional_manager','regional_finance_officer')
       AND OLD.region_code IS DISTINCT FROM v_actor_region THEN
      RAISE EXCEPTION 'Expense approval is limited to the employee region';
    END IF;
  ELSIF TG_TABLE_NAME = 'transfers' THEN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Approved' THEN
      IF lower(v_actor.role) NOT IN
         ('super_admin','ceo','operations_manager','logistics_manager','regional_manager',
          'warehouse_manager','procurement_manager','inventory_manager') THEN
        RAISE EXCEPTION 'Role is not authorized to approve transfers';
      END IF;
      IF NEW.approved_by IS DISTINCT FROM v_actor.name
         OR lower(COALESCE(NEW.approved_by_role,'')) <> lower(v_actor.role) THEN
        RAISE EXCEPTION 'Transfer approver must match the authenticated employee';
      END IF;
      SELECT upper(COALESCE(NEW.country_code, s.country)) INTO v_row_country
      FROM (SELECT 1) q LEFT JOIN public.sites s ON s.id = NEW.source_site_id;
      IF NOT v_hq AND v_row_country IS DISTINCT FROM v_actor_country THEN
        RAISE EXCEPTION 'Transfer approval is limited to the employee country';
      END IF;
      IF NOT v_hq AND lower(v_actor.role) = 'regional_manager'
         AND (NEW.source_region_code IS DISTINCT FROM v_actor_region
              OR NEW.dest_region_code IS DISTINCT FROM v_actor_region) THEN
        RAISE EXCEPTION 'Regional approval is limited to the employee region';
      END IF;
      IF NOT v_hq AND lower(v_actor.role) NOT IN ('regional_manager','operations_manager','logistics_manager')
         AND NEW.source_site_id IS DISTINCT FROM v_actor.site_id THEN
        RAISE EXCEPTION 'Transfer approval is limited to the employee site';
      END IF;
      IF (COALESCE(NEW.is_inter_region,false)
          OR (NEW.source_region_code IS NOT NULL AND NEW.dest_region_code IS NOT NULL
              AND NEW.source_region_code <> NEW.dest_region_code)) AND NOT v_hq
         AND lower(v_actor.role) NOT IN ('operations_manager','logistics_manager') THEN
        RAISE EXCEPTION 'Inter-region transfer requires executive operations approval';
      END IF;
    ELSIF OLD.transfer_status IS DISTINCT FROM NEW.transfer_status
       AND NEW.transfer_status = 'Received' THEN
      IF lower(v_actor.role) NOT IN
         ('super_admin','ceo','regional_manager','warehouse_manager','store_manager','receiver','inventory_manager') THEN
        RAISE EXCEPTION 'Role is not authorized to receive transfers';
      END IF;
      IF NEW.received_by IS DISTINCT FROM v_actor.name THEN
        RAISE EXCEPTION 'Transfer receiver must match the authenticated employee';
      END IF;
      SELECT upper(COALESCE(NEW.country_code, s.country)) INTO v_row_country
      FROM (SELECT 1) q LEFT JOIN public.sites s ON s.id = NEW.dest_site_id;
      IF NOT v_hq AND v_row_country IS DISTINCT FROM v_actor_country THEN
        RAISE EXCEPTION 'Transfer receiving is limited to the employee country';
      END IF;
      IF NOT v_hq AND lower(v_actor.role) = 'regional_manager'
         AND NEW.dest_region_code IS DISTINCT FROM v_actor_region THEN
        RAISE EXCEPTION 'Transfer receiving is limited to the employee region';
      END IF;
      IF NOT v_hq AND lower(v_actor.role) <> 'regional_manager'
         AND NEW.dest_site_id IS DISTINCT FROM v_actor.site_id THEN
        RAISE EXCEPTION 'Transfer receiving is limited to the destination site';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'purchase_orders'
     AND OLD.status IS DISTINCT FROM NEW.status
     AND NEW.status IN ('Approved','Rejected') THEN
    IF lower(v_actor.role) NOT IN
       ('super_admin','ceo','admin','procurement_manager','finance_manager','operations_manager',
        'regional_manager','regional_procurement_lead','regional_finance_officer','buyer',
        'supply_chain_manager') THEN
      RAISE EXCEPTION 'Role is not authorized to approve or reject purchase orders';
    END IF;
    IF NEW.status = 'Approved' AND
       (NEW.approver_employee_id IS DISTINCT FROM v_actor.id::text
        OR lower(COALESCE(NEW.approver_role,'')) <> lower(v_actor.role)
        OR NEW.approved_by IS DISTINCT FROM v_actor.name) THEN
      RAISE EXCEPTION 'Purchase order approver must match the authenticated employee';
    END IF;
    IF NEW.status = 'Rejected' AND NEW.rejected_by IS DISTINCT FROM v_actor.name THEN
      RAISE EXCEPTION 'Purchase order rejector must match the authenticated employee';
    END IF;
    SELECT upper(COALESCE(NEW.country_code, s.country)) INTO v_row_country
    FROM (SELECT 1) q LEFT JOIN public.sites s ON s.id = NEW.site_id;
    IF NOT v_hq AND v_row_country IS DISTINCT FROM v_actor_country THEN
      RAISE EXCEPTION 'Purchase order decision is limited to the employee country';
    END IF;
    IF lower(v_actor.role) IN ('regional_manager','regional_procurement_lead','regional_finance_officer')
       AND NEW.region_code IS DISTINCT FROM v_actor_region THEN
      RAISE EXCEPTION 'Purchase order decision is limited to the employee region';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.is_site_in_my_authorized_scope(p_site_id text, p_country_code text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees actor
    LEFT JOIN public.sites actor_site ON actor_site.id = actor.site_id
    JOIN public.sites target_site
      ON target_site.id::text = p_site_id OR target_site.code = p_site_id
    WHERE actor.id = auth.uid()
      AND COALESCE(lower(actor.status), 'active') = 'active'
      AND (p_country_code IS NULL OR upper(p_country_code) = upper(target_site.country))
      AND (
        lower(actor.role) IN ('super_admin','ceo')
        OR (
          upper(actor_site.country) = upper(target_site.country)
          AND (
            (lower(actor.role) IN ('admin','operations_manager','finance_manager','procurement_manager',
                                   'hr_manager','supply_chain_manager','inventory_manager','logistics_manager',
                                   'auditor','regional_manager','regional_procurement_lead',
                                   'regional_finance_officer','regional_hr_officer','regional_logistics_lead')
             AND (lower(actor.role) NOT LIKE 'regional_%' OR actor.region_code = target_site.region_code))
            OR actor.site_id = target_site.id
          )
        )
      )
  );
$function$;

REVOKE ALL ON FUNCTION public.is_site_in_my_authorized_scope(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_site_in_my_authorized_scope(text, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.enforce_authenticated_sensitive_transition() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_expense_approval_identity ON public.expenses;
CREATE TRIGGER guard_expense_approval_identity
BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.enforce_authenticated_sensitive_transition();

DROP TRIGGER IF EXISTS guard_transfer_approval_and_receipt_identity ON public.transfers;
CREATE TRIGGER guard_transfer_approval_and_receipt_identity
BEFORE UPDATE ON public.transfers
FOR EACH ROW EXECUTE FUNCTION public.enforce_authenticated_sensitive_transition();

DROP TRIGGER IF EXISTS guard_purchase_order_decision_identity ON public.purchase_orders;
CREATE TRIGGER guard_purchase_order_decision_identity
BEFORE UPDATE ON public.purchase_orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_authenticated_sensitive_transition();

