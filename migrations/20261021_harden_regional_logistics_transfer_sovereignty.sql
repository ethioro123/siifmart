-- Migration: Harden Regional Logistics Lead transfer sovereignty and regional boundaries
-- Applied to supabase-staging per Rule 9

-- 1. Update enforce_authenticated_sensitive_transition() trigger function
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

  SELECT upper(s.country), COALESCE(v_actor.region_code, s.region_code) INTO v_actor_country, v_actor_region
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
      IF NOT v_hq AND v_norm_role IN ('regional_manager', 'regional_logistics_lead')
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
      IF NOT v_hq AND v_norm_role IN ('regional_manager', 'regional_logistics_lead') AND NEW.dest_region_code IS DISTINCT FROM v_actor_region THEN
        RAISE EXCEPTION 'Regional approval is limited to the employee region';
      END IF;
      IF NOT v_hq AND v_norm_role NOT IN ('regional_manager', 'regional_logistics_lead') AND NEW.dest_site_id IS DISTINCT FROM v_actor.site_id THEN
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

-- 2. Update approve_transfer() RPC function
CREATE OR REPLACE FUNCTION public.approve_transfer(
  p_transfer_id uuid,
  p_approver_id text,
  p_approver_name text,
  p_approver_role text,
  p_notes text DEFAULT ''::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
DECLARE
    v_transfer RECORD;
    v_actor public.employees%ROWTYPE;
    v_approver_id TEXT;
    v_approver_name TEXT;
    v_approver_role TEXT;
    v_actor_region TEXT;
    v_is_inter_regional BOOLEAN := false;
    v_is_hq_role BOOLEAN := false;
BEGIN
    IF auth.role() = 'service_role' THEN
      v_approver_id := p_approver_id;
      v_approver_name := p_approver_name;
      v_approver_role := lower(p_approver_role);
    ELSE
      IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authenticated employee session required'; END IF;
      SELECT e.* INTO v_actor FROM public.employees e
      WHERE e.id = auth.uid() AND COALESCE(lower(e.status), 'active') = 'active' LIMIT 1;
      IF NOT FOUND THEN RAISE EXCEPTION 'Active employee profile required'; END IF;
      v_approver_id := v_actor.id::text;
      v_approver_name := v_actor.name;
      v_approver_role := lower(v_actor.role);
    END IF;

    IF v_approver_role NOT IN ('super_admin','ceo','admin','regional_manager','operations_manager',
        'regional_logistics_lead','supply_chain_manager','logistics_manager','warehouse_manager','inventory_manager') THEN
      RAISE EXCEPTION 'Only a warehouse manager or higher may approve transfers';
    END IF;

    SELECT * INTO v_transfer FROM public.transfers WHERE id = p_transfer_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Transfer % not found', p_transfer_id; END IF;

    IF v_transfer.status NOT IN ('Requested', 'Draft') AND COALESCE(v_transfer.transfer_status, '') NOT IN ('Requested', 'Draft', '') THEN
      RAISE EXCEPTION 'Transfer cannot be approved from current status "%" (transfer_status: "%")', v_transfer.status, v_transfer.transfer_status;
    END IF;

    -- Zero-Trust 4-Eyes Segregation
    IF v_approver_role NOT IN ('super_admin','ceo') AND lower(COALESCE(v_transfer.requested_by,'')) = lower(v_approver_name) THEN
      RAISE EXCEPTION 'Zero-Trust 4-Eyes Violation: Transfer requester cannot approve their own transfer';
    END IF;

    v_is_inter_regional := COALESCE(v_transfer.is_inter_region, false)
      OR (v_transfer.source_region_code IS NOT NULL AND v_transfer.dest_region_code IS NOT NULL
          AND v_transfer.source_region_code <> v_transfer.dest_region_code);
    v_is_hq_role := v_approver_role IN ('super_admin','ceo','admin','operations_manager','logistics_manager','supply_chain_manager');

    IF v_is_inter_regional AND NOT v_is_hq_role THEN
      RAISE EXCEPTION 'Authority Boundary Violation: Inter-Regional transfers require national operations leadership approval';
    END IF;

    -- Regional Boundary Guard for Regional Leadership
    IF v_approver_role IN ('regional_manager', 'regional_logistics_lead') THEN
      SELECT COALESCE(v_actor.region_code, s.region_code) INTO v_actor_region
      FROM public.sites s WHERE s.id = v_actor.site_id LIMIT 1;

      IF (v_transfer.source_region_code IS NOT NULL AND v_transfer.source_region_code IS DISTINCT FROM v_actor_region)
         OR (v_transfer.dest_region_code IS NOT NULL AND v_transfer.dest_region_code IS DISTINCT FROM v_actor_region) THEN
        RAISE EXCEPTION 'Regional Boundary Violation: Regional Logistics / Manager approval is limited to own region (%)', v_actor_region;
      END IF;
    END IF;

    UPDATE public.transfers SET status='Approved', transfer_status='Approved', approved_by=v_approver_name,
      approved_at=NOW(), approved_by_role=v_approver_role, approval_notes=COALESCE(p_notes,''), updated_at=NOW()
    WHERE id=p_transfer_id;

    UPDATE public.wms_jobs SET transfer_status='Approved', approved_by=v_approver_name,
      status=CASE WHEN status='Draft' THEN 'Pending' ELSE status END, updated_at=NOW()
    WHERE (order_ref=p_transfer_id::text OR id::text=p_transfer_id::text OR order_ref=v_transfer.order_ref) AND type='TRANSFER';

    INSERT INTO public.system_logs (user_name,action,module,details,site_id,country_code,entity_type,entity_id,performed_by)
    VALUES (v_approver_name,'TRANSFER_APPROVED','Inventory',json_build_object(
      'transfer_id',p_transfer_id,'order_ref',v_transfer.order_ref,'source_site_id',v_transfer.source_site_id,
      'dest_site_id',v_transfer.dest_site_id,'is_inter_region',v_is_inter_regional,
      'approver_role',v_approver_role,'notes',p_notes)::text,v_transfer.source_site_id,
      v_transfer.country_code,'transfers',p_transfer_id::text,v_approver_id);

    RETURN json_build_object('success',true,'transfer_id',p_transfer_id,'status','Approved',
      'approved_by',v_approver_name,'approved_at',NOW());
END;
$function$;
