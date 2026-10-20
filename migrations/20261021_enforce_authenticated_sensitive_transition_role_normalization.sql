-- ==============================================================================
-- Migration: 20261021_enforce_authenticated_sensitive_transition_role_normalization.sql
-- Description: Upgrade enforce_authenticated_sensitive_transition trigger function
--              to use public.normalize_role() so canonical Directorate titles
--              (country_managing_director, head_of_finance, head_of_operations, etc.)
--              are fully authorized for purchase order, transfer, and expense sign-offs.
-- Environment: supabase-staging (and production)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.enforce_authenticated_sensitive_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
  v_actor public.employees%ROWTYPE;
  v_actor_country text;
  v_actor_region text;
  v_row_country text;
  v_norm_role text;
  v_hq boolean;
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authenticated employee session required'; END IF;

  SELECT e.* INTO v_actor FROM public.employees e
  WHERE e.id = auth.uid() AND COALESCE(lower(e.status), 'active') = 'active' LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active employee profile required'; END IF;

  SELECT upper(s.country), s.region_code INTO v_actor_country, v_actor_region
  FROM public.sites s WHERE s.id = v_actor.site_id LIMIT 1;

  v_norm_role := public.normalize_role(v_actor.role);
  v_hq := v_norm_role IN ('super_admin', 'ceo');

  -- 1. TRANSFERS WORKFLOW
  IF TG_TABLE_NAME = 'transfers' THEN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Approved' THEN
      IF v_norm_role NOT IN ('super_admin','ceo','admin','operations_manager','regional_manager',
          'regional_logistics_lead','supply_chain_manager','logistics_manager','warehouse_manager','inventory_manager') THEN
        RAISE EXCEPTION 'Only a warehouse manager or higher may approve transfers';
      END IF;
      IF NEW.approved_by IS DISTINCT FROM v_actor.name
         OR public.normalize_role(COALESCE(NEW.approved_by_role,'')) <> v_norm_role THEN
        RAISE EXCEPTION 'Transfer approver must match the authenticated employee';
      END IF;
      SELECT upper(COALESCE(NEW.country_code, s.country)) INTO v_row_country
      FROM (SELECT 1) q LEFT JOIN public.sites s ON s.id = NEW.source_site_id;
      IF v_row_country IS DISTINCT FROM v_actor_country AND NOT v_hq THEN
        RAISE EXCEPTION 'Transfer approval is limited to the employee country';
      END IF;
      IF NOT v_hq AND v_norm_role = 'regional_manager'
         AND (NEW.source_region_code IS DISTINCT FROM v_actor_region OR NEW.dest_region_code IS DISTINCT FROM v_actor_region) THEN
        RAISE EXCEPTION 'Regional approval is limited to the employee region';
      END IF;
      IF NOT v_hq AND v_norm_role NOT IN ('admin','regional_manager','operations_manager','logistics_manager','regional_logistics_lead','supply_chain_manager')
         AND NEW.source_site_id IS DISTINCT FROM v_actor.site_id THEN
        RAISE EXCEPTION 'Transfer approval is limited to the employee site';
      END IF;
      IF (COALESCE(NEW.is_inter_region,false)
          OR (NEW.source_region_code IS NOT NULL AND NEW.dest_region_code IS NOT NULL AND NEW.source_region_code <> NEW.dest_region_code))
         AND NOT v_hq AND v_norm_role NOT IN ('admin','operations_manager','logistics_manager','supply_chain_manager') THEN
        RAISE EXCEPTION 'Inter-region transfer requires executive operations approval';
      END IF;
    ELSIF OLD.transfer_status IS DISTINCT FROM NEW.transfer_status AND NEW.transfer_status = 'Received' THEN
      IF v_norm_role NOT IN ('super_admin','ceo','regional_manager','warehouse_manager','store_manager','receiver','inventory_manager') THEN
        RAISE EXCEPTION 'Role is not authorized to receive transfers';
      END IF;
      IF NEW.received_by IS DISTINCT FROM v_actor.name THEN RAISE EXCEPTION 'Transfer receiver must match the authenticated employee'; END IF;
      SELECT upper(COALESCE(NEW.country_code, s.country)) INTO v_row_country
      FROM (SELECT 1) q LEFT JOIN public.sites s ON s.id = NEW.dest_site_id;
      IF v_row_country IS DISTINCT FROM v_actor_country AND NOT v_hq THEN
        RAISE EXCEPTION 'Transfer receiving is limited to the employee country';
      END IF;
      IF NOT v_hq AND v_norm_role = 'regional_manager' AND NEW.dest_region_code IS DISTINCT FROM v_actor_region THEN
        RAISE EXCEPTION 'Regional approval is limited to the employee region';
      END IF;
      IF NOT v_hq AND v_norm_role <> 'regional_manager' AND NEW.dest_site_id IS DISTINCT FROM v_actor.site_id THEN
        RAISE EXCEPTION 'Transfer receiving is limited to the destination site';
      END IF;
    END IF;

  -- 2. EXPENSES WORKFLOW
  ELSIF TG_TABLE_NAME = 'expenses' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Approved' THEN
    IF v_norm_role NOT IN ('super_admin','ceo','finance_manager','cfo','regional_manager','regional_finance_officer') THEN
      RAISE EXCEPTION 'Role is not authorized to approve expenses';
    END IF;
    IF NEW.approved_by_id IS DISTINCT FROM v_actor.id OR NEW.approved_by IS DISTINCT FROM v_actor.name THEN
      RAISE EXCEPTION 'Expense approver must match the authenticated employee';
    END IF;
    IF OLD.created_by_id = v_actor.id AND NOT v_hq THEN RAISE EXCEPTION 'Expense creator cannot approve their own expense'; END IF;
    IF COALESCE(OLD.escalated_to_ceo, false) AND NOT v_hq THEN RAISE EXCEPTION 'Executive approval required for this expense'; END IF;
    SELECT upper(COALESCE(NEW.country_code, s.country)) INTO v_row_country
    FROM (SELECT 1) q LEFT JOIN public.sites s ON s.id = NEW.site_id;
    IF v_row_country IS DISTINCT FROM v_actor_country AND NOT v_hq THEN RAISE EXCEPTION 'Expense approval is limited to the employee country'; END IF;
    IF v_norm_role IN ('regional_manager','regional_finance_officer') AND OLD.region_code IS DISTINCT FROM v_actor_region THEN
      RAISE EXCEPTION 'Expense approval is limited to the employee region';
    END IF;

  -- 3. PURCHASE ORDERS WORKFLOW
  ELSIF TG_TABLE_NAME = 'purchase_orders' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('Approved','Rejected') THEN
    IF v_norm_role NOT IN ('super_admin','ceo','admin','procurement_manager','finance_manager','operations_manager',
        'regional_manager','regional_procurement_lead','regional_finance_officer','buyer','supply_chain_manager') THEN
      RAISE EXCEPTION 'Role is not authorized to approve or reject purchase orders';
    END IF;
    IF NEW.status = 'Approved' AND (NEW.approver_employee_id IS DISTINCT FROM v_actor.id::text
        OR (public.normalize_role(COALESCE(NEW.approver_role,'')) <> v_norm_role AND lower(COALESCE(NEW.approver_role,'')) <> lower(v_actor.role))
        OR NEW.approved_by IS DISTINCT FROM v_actor.name) THEN
      RAISE EXCEPTION 'Purchase order approver must match the authenticated employee';
    END IF;
    IF NEW.status = 'Rejected' AND NEW.rejected_by IS DISTINCT FROM v_actor.name THEN
      RAISE EXCEPTION 'Purchase order rejector must match the authenticated employee';
    END IF;
    SELECT upper(COALESCE(NEW.country_code, s.country)) INTO v_row_country
    FROM (SELECT 1) q LEFT JOIN public.sites s ON s.id = NEW.site_id;
    IF v_row_country IS DISTINCT FROM v_actor_country AND NOT v_hq THEN RAISE EXCEPTION 'Purchase order decision is limited to the employee country'; END IF;
    IF v_norm_role IN ('regional_manager','regional_procurement_lead','regional_finance_officer') AND NEW.region_code IS DISTINCT FROM v_actor_region THEN
      RAISE EXCEPTION 'Purchase order decision is limited to the employee region';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
