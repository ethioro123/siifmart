-- Let inventory specialists prepare transfer drafts while reserving approval
-- for warehouse leadership. Enforce the transition in Postgres as well as UI.

CREATE OR REPLACE FUNCTION public.guard_wms_transfer_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
  v_actor public.employees%ROWTYPE;
  v_can_approve boolean;
  v_approving boolean;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND lower(COALESCE(OLD.type, '')) <> 'transfer'
     AND lower(COALESCE(NEW.type, '')) <> 'transfer' THEN
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

  v_can_approve := lower(v_actor.role) IN (
    'super_admin', 'ceo', 'admin', 'regional_manager', 'operations_manager',
    'warehouse_manager', 'supply_chain_manager', 'logistics_manager',
    'inventory_manager', 'regional_logistics_lead'
  );
  v_approving := lower(COALESCE(NEW.transfer_status, '')) IN ('approved', 'picking')
    OR lower(COALESCE(NEW.status, '')) IN ('approved', 'picking');

  IF lower(COALESCE(NEW.type, '')) = 'transfer' AND v_approving
     AND (TG_OP = 'INSERT'
       OR OLD.transfer_status IS DISTINCT FROM NEW.transfer_status
       OR OLD.status IS DISTINCT FROM NEW.status) THEN
    IF NOT v_can_approve THEN
      RAISE EXCEPTION 'Only a warehouse manager or higher may approve a transfer';
    END IF;
    IF NEW.approved_by IS DISTINCT FROM v_actor.name THEN
      RAISE EXCEPTION 'Transfer approver must match the authenticated employee';
    END IF;
    IF TG_OP = 'UPDATE' AND lower(v_actor.role) NOT IN ('super_admin', 'ceo')
       AND lower(COALESCE(OLD.requested_by, '')) = lower(v_actor.name) THEN
      RAISE EXCEPTION 'Transfer requester cannot approve their own transfer';
    END IF;
  END IF;

  IF lower(COALESCE(NEW.type, '')) = 'transfer'
     AND lower(v_actor.role) = 'inventory_specialist' THEN
    IF lower(COALESCE(NEW.status, '')) NOT IN ('draft', 'pending')
       OR lower(COALESCE(NEW.transfer_status, '')) NOT IN ('draft', 'requested') THEN
      RAISE EXCEPTION 'Inventory Specialists may only create or edit transfer drafts';
    END IF;
    IF NEW.requested_by IS DISTINCT FROM v_actor.name THEN
      RAISE EXCEPTION 'Inventory Specialist may only edit their own transfer drafts';
    END IF;
    IF TG_OP = 'UPDATE' AND lower(COALESCE(OLD.type, '')) <> 'transfer' THEN
      RAISE EXCEPTION 'Inventory Specialists may only edit transfer drafts';
    END IF;
  ELSIF lower(COALESCE(NEW.type, '')) = 'transfer'
        AND NOT v_can_approve AND TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Only Inventory Specialists and warehouse leadership may create transfer requests';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_wms_transfer_approval() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guard_wms_transfer_approval() TO authenticated, service_role;

DROP TRIGGER IF EXISTS guard_wms_transfer_approval ON public.wms_jobs;
CREATE TRIGGER guard_wms_transfer_approval
BEFORE INSERT OR UPDATE ON public.wms_jobs
FOR EACH ROW EXECUTE FUNCTION public.guard_wms_transfer_approval();

DROP POLICY IF EXISTS wms_jobs_zero_trust_insert ON public.wms_jobs;
CREATE POLICY wms_jobs_zero_trust_insert ON public.wms_jobs FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','operations_manager','logistics_manager',
    'warehouse_manager','store_manager','inventory_manager','receiver','picker','packer','forklift_operator',
    'stock_clerk','dispatcher','cashier','driver','inventory_specialist'])
  AND upper(wms_jobs.country_code) = upper(public.get_my_country_code())
  AND (public.is_site_in_my_authorized_scope(wms_jobs.site_id::text, wms_jobs.country_code)
       OR public.is_site_in_my_authorized_scope(wms_jobs.dest_site_id::text, wms_jobs.country_code))
  AND (lower(public.get_my_role()) <> 'inventory_specialist'
       OR (lower(wms_jobs.type) = 'transfer'
           AND lower(COALESCE(wms_jobs.status, '')) IN ('draft', 'pending')
           AND lower(COALESCE(wms_jobs.transfer_status, '')) IN ('draft', 'requested')))
);

DROP POLICY IF EXISTS wms_jobs_zero_trust_update ON public.wms_jobs;
CREATE POLICY wms_jobs_zero_trust_update ON public.wms_jobs FOR UPDATE TO authenticated
USING (
  public.is_ceo()
  OR (
    upper(wms_jobs.country_code) = upper(public.get_my_country_code())
    AND (public.is_site_in_my_authorized_scope(wms_jobs.site_id::text, wms_jobs.country_code)
         OR public.is_site_in_my_authorized_scope(wms_jobs.dest_site_id::text, wms_jobs.country_code))
    AND (public.is_manager() OR public.is_admin()
         OR wms_jobs.assigned_to IN (auth.uid()::text, public.get_my_employee_id()::text, public.get_my_employee_code())
         OR EXISTS (SELECT 1 FROM public.job_assignments ja
                    WHERE ja.job_id = wms_jobs.id
                      AND ja.employee_id IN (auth.uid(), public.get_my_employee_id()))
         OR (lower(public.get_my_role()) = 'inventory_specialist'
             AND lower(COALESCE(wms_jobs.type, '')) = 'transfer'
             AND lower(COALESCE(wms_jobs.transfer_status, '')) IN ('draft', 'requested')))
  )
)
WITH CHECK (
  public.is_ceo()
  OR (
    upper(wms_jobs.country_code) = upper(public.get_my_country_code())
    AND (public.is_site_in_my_authorized_scope(wms_jobs.site_id::text, wms_jobs.country_code)
         OR public.is_site_in_my_authorized_scope(wms_jobs.dest_site_id::text, wms_jobs.country_code))
    AND (public.is_manager() OR public.is_admin()
         OR wms_jobs.assigned_to IN (auth.uid()::text, public.get_my_employee_id()::text, public.get_my_employee_code())
         OR EXISTS (SELECT 1 FROM public.job_assignments ja
                    WHERE ja.job_id = wms_jobs.id
                      AND ja.employee_id IN (auth.uid(), public.get_my_employee_id()))
         OR (lower(public.get_my_role()) = 'inventory_specialist'
             AND lower(COALESCE(wms_jobs.type, '')) = 'transfer'
             AND lower(COALESCE(wms_jobs.status, '')) IN ('draft', 'pending')
             AND lower(COALESCE(wms_jobs.transfer_status, '')) IN ('draft', 'requested')))
  )
);

-- Keep the legacy transfers table transition guard aligned with the WMS rule.
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
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authenticated employee session required'; END IF;

  SELECT e.* INTO v_actor FROM public.employees e
  WHERE e.id = auth.uid() AND COALESCE(lower(e.status), 'active') = 'active' LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active employee profile required'; END IF;
  SELECT upper(s.country), s.region_code INTO v_actor_country, v_actor_region
  FROM public.sites s WHERE s.id = v_actor.site_id LIMIT 1;
  v_hq := lower(v_actor.role) IN ('super_admin', 'ceo');

  IF TG_TABLE_NAME = 'transfers' THEN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Approved' THEN
      IF lower(v_actor.role) NOT IN ('super_admin','ceo','admin','operations_manager','regional_manager',
          'regional_logistics_lead','supply_chain_manager','logistics_manager','warehouse_manager','inventory_manager') THEN
        RAISE EXCEPTION 'Only a warehouse manager or higher may approve transfers';
      END IF;
      IF NEW.approved_by IS DISTINCT FROM v_actor.name
         OR lower(COALESCE(NEW.approved_by_role,'')) <> lower(v_actor.role) THEN
        RAISE EXCEPTION 'Transfer approver must match the authenticated employee';
      END IF;
      SELECT upper(COALESCE(NEW.country_code, s.country)) INTO v_row_country
      FROM (SELECT 1) q LEFT JOIN public.sites s ON s.id = NEW.source_site_id;
      IF v_row_country IS DISTINCT FROM v_actor_country AND NOT v_hq THEN
        RAISE EXCEPTION 'Transfer approval is limited to the employee country';
      END IF;
      IF NOT v_hq AND lower(v_actor.role) = 'regional_manager'
         AND (NEW.source_region_code IS DISTINCT FROM v_actor_region OR NEW.dest_region_code IS DISTINCT FROM v_actor_region) THEN
        RAISE EXCEPTION 'Regional approval is limited to the employee region';
      END IF;
      IF NOT v_hq AND lower(v_actor.role) NOT IN ('regional_manager','operations_manager','logistics_manager','regional_logistics_lead','supply_chain_manager')
         AND NEW.source_site_id IS DISTINCT FROM v_actor.site_id THEN
        RAISE EXCEPTION 'Transfer approval is limited to the employee site';
      END IF;
      IF (COALESCE(NEW.is_inter_region,false)
          OR (NEW.source_region_code IS NOT NULL AND NEW.dest_region_code IS NOT NULL AND NEW.source_region_code <> NEW.dest_region_code))
         AND NOT v_hq AND lower(v_actor.role) NOT IN ('operations_manager','logistics_manager','supply_chain_manager') THEN
        RAISE EXCEPTION 'Inter-region transfer requires executive operations approval';
      END IF;
    ELSIF OLD.transfer_status IS DISTINCT FROM NEW.transfer_status AND NEW.transfer_status = 'Received' THEN
      IF lower(v_actor.role) NOT IN ('super_admin','ceo','regional_manager','warehouse_manager','store_manager','receiver','inventory_manager') THEN
        RAISE EXCEPTION 'Role is not authorized to receive transfers';
      END IF;
      IF NEW.received_by IS DISTINCT FROM v_actor.name THEN RAISE EXCEPTION 'Transfer receiver must match the authenticated employee'; END IF;
      SELECT upper(COALESCE(NEW.country_code, s.country)) INTO v_row_country
      FROM (SELECT 1) q LEFT JOIN public.sites s ON s.id = NEW.dest_site_id;
      IF v_row_country IS DISTINCT FROM v_actor_country AND NOT v_hq THEN
        RAISE EXCEPTION 'Transfer receiving is limited to the employee country';
      END IF;
      IF NOT v_hq AND lower(v_actor.role) = 'regional_manager' AND NEW.dest_region_code IS DISTINCT FROM v_actor_region THEN
        RAISE EXCEPTION 'Regional approval is limited to the employee region';
      END IF;
      IF NOT v_hq AND lower(v_actor.role) <> 'regional_manager' AND NEW.dest_site_id IS DISTINCT FROM v_actor.site_id THEN
        RAISE EXCEPTION 'Transfer receiving is limited to the destination site';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'expenses' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Approved' THEN
    IF lower(v_actor.role) NOT IN ('super_admin','ceo','finance_manager','cfo','regional_manager','regional_finance_officer') THEN
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
    IF lower(v_actor.role) IN ('regional_manager','regional_finance_officer') AND OLD.region_code IS DISTINCT FROM v_actor_region THEN
      RAISE EXCEPTION 'Expense approval is limited to the employee region';
    END IF;
  ELSIF TG_TABLE_NAME = 'purchase_orders' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('Approved','Rejected') THEN
    IF lower(v_actor.role) NOT IN ('super_admin','ceo','admin','procurement_manager','finance_manager','operations_manager',
        'regional_manager','regional_procurement_lead','regional_finance_officer','buyer','supply_chain_manager') THEN
      RAISE EXCEPTION 'Role is not authorized to approve or reject purchase orders';
    END IF;
    IF NEW.status = 'Approved' AND (NEW.approver_employee_id IS DISTINCT FROM v_actor.id::text
        OR lower(COALESCE(NEW.approver_role,'')) <> lower(v_actor.role) OR NEW.approved_by IS DISTINCT FROM v_actor.name) THEN
      RAISE EXCEPTION 'Purchase order approver must match the authenticated employee';
    END IF;
    IF NEW.status = 'Rejected' AND NEW.rejected_by IS DISTINCT FROM v_actor.name THEN
      RAISE EXCEPTION 'Purchase order rejector must match the authenticated employee';
    END IF;
    SELECT upper(COALESCE(NEW.country_code, s.country)) INTO v_row_country
    FROM (SELECT 1) q LEFT JOIN public.sites s ON s.id = NEW.site_id;
    IF v_row_country IS DISTINCT FROM v_actor_country AND NOT v_hq THEN RAISE EXCEPTION 'Purchase order decision is limited to the employee country'; END IF;
    IF lower(v_actor.role) IN ('regional_manager','regional_procurement_lead','regional_finance_officer') AND NEW.region_code IS DISTINCT FROM v_actor_region THEN
      RAISE EXCEPTION 'Purchase order decision is limited to the employee region';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.approve_transfer(
    p_transfer_id UUID,
    p_approver_id TEXT,
    p_approver_name TEXT,
    p_approver_role TEXT,
    p_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_transfer RECORD;
    v_actor public.employees%ROWTYPE;
    v_approver_id TEXT;
    v_approver_name TEXT;
    v_approver_role TEXT;
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
    IF v_approver_role NOT IN ('super_admin','ceo') AND lower(COALESCE(v_transfer.requested_by,'')) = lower(v_approver_name) THEN
      RAISE EXCEPTION 'Zero-Trust 4-Eyes Violation: Transfer requester cannot approve their own transfer';
    END IF;

    v_is_inter_regional := COALESCE(v_transfer.is_inter_region, false)
      OR (v_transfer.source_region_code IS NOT NULL AND v_transfer.dest_region_code IS NOT NULL
          AND v_transfer.source_region_code <> v_transfer.dest_region_code);
    v_is_hq_role := v_approver_role IN ('super_admin','ceo','operations_manager','logistics_manager','supply_chain_manager');
    IF v_is_inter_regional AND NOT v_is_hq_role THEN
      RAISE EXCEPTION 'Authority Boundary Violation: Inter-Regional transfers require national operations leadership approval';
    END IF;

    UPDATE public.transfers SET status='Approved', transfer_status='Approved', approved_by=v_approver_name,
      approved_at=NOW(), approved_by_role=v_approver_role, approval_notes=COALESCE(p_notes,''), updated_at=NOW()
    WHERE id=p_transfer_id;
    UPDATE public.wms_jobs SET transfer_status='Approved', status=CASE WHEN status='Draft' THEN 'Pending' ELSE status END, updated_at=NOW()
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

REVOKE EXECUTE ON FUNCTION public.approve_transfer(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_transfer(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
