-- Calibrate transfer draft creation to include store managers, replenishment planners,
-- and supervisors, while maintaining strict warehouse leadership approval and zero self-approval.

CREATE OR REPLACE FUNCTION public.guard_wms_transfer_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
  v_actor public.employees%ROWTYPE;
  v_can_approve boolean;
  v_can_create boolean;
  v_approving boolean;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND lower(COALESCE(OLD.type, '')) <> 'transfer'
     AND lower(COALESCE(NEW.type, '')) <> 'transfer' THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' AND lower(COALESCE(NEW.type, '')) <> 'transfer' THEN
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
    'group_ceo', 'ceo', 'super_admin', 'admin', 'country_managing_director',
    'country_operations_director', 'country_supply_chain_director',
    'regional_operations_manager', 'regional_supply_chain_manager',
    'regional_logistics_manager', 'warehouse_manager', 'inventory_manager'
  );

  v_can_create := v_can_approve OR lower(v_actor.role) IN (
    'inventory_specialist', 'store_manager', 'assistant_store_manager',
    'warehouse_operations_manager', 'stock_control_supervisor',
    'inventory_control_supervisor', 'putaway_replenishment_supervisor',
    'replenishment_planner', 'demand_planner', 'operations_manager',
    'logistics_manager'
  );

  v_approving := lower(COALESCE(NEW.transfer_status, '')) IN ('approved', 'picking')
    OR lower(COALESCE(NEW.status, '')) IN ('approved', 'picking');

  -- Auto-populate requested_by, created_by, country_code if missing on draft creation
  IF TG_OP = 'INSERT' AND lower(COALESCE(NEW.type, '')) = 'transfer' THEN
    IF NEW.requested_by IS NULL OR trim(NEW.requested_by) = '' THEN
      NEW.requested_by := v_actor.name;
    END IF;
    IF NEW.created_by IS NULL OR trim(NEW.created_by) = '' THEN
      NEW.created_by := v_actor.name;
    END IF;
    IF NEW.country_code IS NULL OR trim(NEW.country_code) = '' THEN
      NEW.country_code := COALESCE(v_actor.country_code, 'ET');
    END IF;
  END IF;

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
    IF TG_OP = 'UPDATE' AND lower(v_actor.role) NOT IN ('group_ceo', 'ceo', 'super_admin')
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
    IF TG_OP = 'UPDATE' AND OLD.requested_by IS DISTINCT FROM v_actor.name THEN
      RAISE EXCEPTION 'Inventory Specialist may only edit their own transfer drafts';
    END IF;
    IF TG_OP = 'UPDATE' AND lower(COALESCE(OLD.type, '')) <> 'transfer' THEN
      RAISE EXCEPTION 'Inventory Specialists may only edit transfer drafts';
    END IF;
  ELSIF TG_OP = 'UPDATE' AND lower(COALESCE(OLD.type, '')) = 'transfer'
        AND lower(COALESCE(OLD.transfer_status, '')) IN ('draft', 'requested')
        AND NOT v_can_approve AND NOT (lower(v_actor.role) IN ('store_manager', 'assistant_store_manager') AND lower(COALESCE(OLD.requested_by, '')) = lower(v_actor.name)) THEN
    RAISE EXCEPTION 'Only the requesting Inventory Specialist or warehouse leadership may edit a transfer draft';
  ELSIF lower(COALESCE(NEW.type, '')) = 'transfer'
        AND NOT v_can_create AND TG_OP = 'INSERT' THEN
    RAISE EXCEPTION 'Only Inventory Specialists, store managers, and operations leadership may create transfer requests';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.guard_wms_transfer_approval() FROM PUBLIC, anon, authenticated, service_role;
