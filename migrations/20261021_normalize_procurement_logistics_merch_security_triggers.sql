-- ==============================================================================
-- Migration: 20261021_normalize_procurement_logistics_merch_security_triggers.sql
-- Description: Harmonize private schema security filters and trigger guards
--              with public.normalize_role() so canonical Directorate and Regional
--              titles (head_of_procurement, head_of_operations, etc.) satisfy
--              RLS and anti-fraud verification checks.
-- Environment: supabase-staging (and production)
-- ==============================================================================

-- 1. private.procurement_supplier_scope
CREATE OR REPLACE FUNCTION private.procurement_supplier_scope(p_country text, p_region text, p_write boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.employees actor
    JOIN public.sites home ON home.id = actor.site_id
    WHERE actor.id = (SELECT auth.uid())
      AND COALESCE(lower(actor.status), 'active') = 'active'
      AND upper(home.country) = upper(p_country)
      AND (
        public.normalize_role(actor.role) IN ('super_admin','ceo')
        OR (
          public.normalize_role(actor.role) IN (
            'admin','procurement_manager','regional_procurement_lead',
            'buyer','vendor_relations_manager','supply_chain_manager',
            'operations_manager','regional_manager','finance_manager',
            'auditor','store_manager','inventory_specialist',
            'demand_planner','customs_import_specialist'
          )
          AND (NOT p_write OR public.normalize_role(actor.role) IN
            ('admin','procurement_manager','regional_procurement_lead',
             'buyer','vendor_relations_manager'))
          AND (
            (home.type = 'Administration'
             AND home.code = upper(home.country) || '-HQ'
             AND home.region_code IS NULL AND actor.region_code IS NULL)
            OR (home.type = 'Administration'
                AND home.region_code IS NOT NULL
                AND actor.region_code = home.region_code
                AND (NOT p_write AND (p_region IS NULL OR p_region = home.region_code)
                     OR p_write AND p_region = home.region_code))
            OR (NOT p_write AND home.type <> 'Administration'
                AND (p_region IS NULL OR p_region = home.region_code))
          )
        )
      )
  );
$function$;

-- 2. private.guard_procurement_supplier_write
CREATE OR REPLACE FUNCTION private.guard_procurement_supplier_write()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE 
  actor public.employees%ROWTYPE;
  home public.sites%ROWTYPE;
  region_country text;
  lead_role boolean;
  actor_norm_role text;
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  SELECT * INTO actor FROM public.employees
    WHERE id = (SELECT auth.uid()) AND COALESCE(lower(status),'active') = 'active';
  IF actor.id IS NULL THEN RAISE EXCEPTION 'Active employee required'; END IF;
  SELECT * INTO home FROM public.sites WHERE id = actor.site_id;
  IF home.id IS NULL OR upper(NEW.country_code) <> upper(home.country) THEN
    RAISE EXCEPTION 'Supplier country is outside the employee scope';
  END IF;

  actor_norm_role := public.normalize_role(actor.role);
  lead_role := actor_norm_role IN
    ('super_admin','ceo','admin','procurement_manager','regional_procurement_lead');

  IF home.type = 'Administration' AND home.region_code IS NOT NULL THEN
    IF actor.region_code IS DISTINCT FROM home.region_code THEN
      RAISE EXCEPTION 'Employee regional assignment is inconsistent';
    END IF;
    IF TG_OP = 'INSERT' AND NEW.region_code IS NULL THEN
      NEW.region_code := home.region_code;
    END IF;
    IF NEW.region_code IS DISTINCT FROM home.region_code THEN
      RAISE EXCEPTION 'Regional supplier edits require the assigned region';
    END IF;
  END IF;

  IF NEW.region_code IS NOT NULL THEN
    SELECT upper(country) INTO region_country FROM public.regions
      WHERE code = NEW.region_code;
    IF region_country IS DISTINCT FROM upper(NEW.country_code) THEN
      RAISE EXCEPTION 'Supplier region must belong to its country';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.created_by := actor.id;
    IF NEW.verification_status IS DISTINCT FROM 'pending'
       OR NEW.verified_by IS NOT NULL OR NEW.verified_at IS NOT NULL THEN
      RAISE EXCEPTION 'New suppliers require independent verification';
    END IF;
  ELSE
    IF (NEW.country_code, NEW.region_code, NEW.created_by) IS DISTINCT FROM
       (OLD.country_code, OLD.region_code, OLD.created_by) THEN
      RAISE EXCEPTION 'Supplier assignment and creator cannot be changed';
    END IF;
    IF NOT lead_role AND OLD.verification_status = 'verified' THEN
      RAISE EXCEPTION 'Verified supplier edits require a procurement lead';
    END IF;
    IF (NEW.verification_status, NEW.verified_by, NEW.verified_at) IS DISTINCT FROM
       (OLD.verification_status, OLD.verified_by, OLD.verified_at) THEN
      IF NOT lead_role OR actor.id = OLD.created_by
         OR NEW.verification_status <> 'verified'
         OR NEW.verified_by IS DISTINCT FROM actor.id::text
         OR NEW.verified_at IS NULL THEN
        RAISE EXCEPTION 'Supplier verification requires a separate procurement lead';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. private.guard_procurement_order_decision
CREATE OR REPLACE FUNCTION private.guard_procurement_order_decision()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE 
  actor public.employees%ROWTYPE;
  actor_norm_role text;
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
  SELECT * INTO actor FROM public.employees
    WHERE id = (SELECT auth.uid()) AND COALESCE(lower(status),'active') = 'active';
  IF actor.id IS NULL THEN RAISE EXCEPTION 'Active employee required'; END IF;
  IF (NEW.site_id, NEW.country_code, NEW.region_code, NEW.created_by)
      IS DISTINCT FROM (OLD.site_id, OLD.country_code, OLD.region_code, OLD.created_by) THEN
    RAISE EXCEPTION 'Purchase order origin cannot be changed';
  END IF;

  actor_norm_role := public.normalize_role(actor.role);

  IF actor_norm_role = 'buyer' AND
      (OLD.status NOT IN ('Draft','Pending') OR NEW.status NOT IN ('Draft','Pending')) THEN
    RAISE EXCEPTION 'Buyers may prepare draft purchase orders only';
  END IF;

  IF (NEW.approved_by, NEW.approved_at, NEW.rejected_by, NEW.rejected_at,
      NEW.approver_role, NEW.approver_employee_id, NEW.hq_approved_by, NEW.hq_approved_at)
      IS DISTINCT FROM
      (OLD.approved_by, OLD.approved_at, OLD.rejected_by, OLD.rejected_at,
       OLD.approver_role, OLD.approver_employee_id, OLD.hq_approved_by, OLD.hq_approved_at)
      OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('Approved','Rejected')) THEN
    IF actor_norm_role NOT IN
       ('super_admin','ceo','admin','procurement_manager','regional_procurement_lead') THEN
      RAISE EXCEPTION 'Purchase order decision requires a procurement lead';
    END IF;
    IF actor_norm_role NOT IN ('super_admin','ceo') AND
       (lower(trim(COALESCE(OLD.created_by,''))) IN
          (lower(trim(actor.name)),actor.id::text)
        OR lower(trim(COALESCE(OLD.requested_by,''))) IN
          (lower(trim(actor.name)),actor.id::text)) THEN
      RAISE EXCEPTION 'Purchase order creator cannot decide their own order';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. private.procurement_site_scope
CREATE OR REPLACE FUNCTION private.procurement_site_scope(p_site_id text, p_country_code text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT public.is_site_in_my_authorized_scope(p_site_id, p_country_code)
    OR EXISTS (
      SELECT 1 FROM public.employees actor
      JOIN public.sites home ON home.id = actor.site_id
      JOIN public.sites target ON target.id::text = p_site_id OR target.code = p_site_id
      WHERE actor.id = (SELECT auth.uid())
        AND COALESCE(lower(actor.status), 'active') = 'active'
        AND public.normalize_role(actor.role) IN ('buyer','vendor_relations_manager','demand_planner','customs_import_specialist')
        AND home.type = 'Administration'
        AND upper(home.country) = upper(target.country)
        AND (p_country_code IS NULL OR upper(p_country_code) = upper(target.country))
        AND ((home.code = upper(home.country) || '-HQ'
              AND home.region_code IS NULL AND actor.region_code IS NULL)
          OR (home.region_code IS NOT NULL
              AND actor.region_code = home.region_code
              AND target.region_code = home.region_code))
    );
$function$;

-- 5. private.guard_shipment_workflow
CREATE OR REPLACE FUNCTION private.guard_shipment_workflow()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  actor public.employees%ROWTYPE;
  origin uuid := COALESCE(OLD.source_site_id, OLD.site_id);
  manager boolean;
  arrival boolean;
  partial boolean := false;
  manifest jsonb := '[]'::jsonb;
  item jsonb;
  qty numeric;
  delivered numeric;
  idx integer := 0;
  actor_norm_role text;
BEGIN
  IF OLD.type NOT IN ('DISPATCH','DRIVER','TRANSFER') THEN RETURN NEW; END IF;
  IF auth.jwt()->>'role' = 'service_role' THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authenticated employee required'; END IF;
  SELECT e.* INTO actor FROM public.employees e
   WHERE (e.id = auth.uid() OR lower(e.email) = lower(auth.jwt()->>'email'))
     AND lower(e.status) = 'active' ORDER BY (e.id = auth.uid()) DESC LIMIT 1;
  IF actor.id IS NULL THEN RAISE EXCEPTION 'Active employee required'; END IF;

  actor_norm_role := public.normalize_role(actor.role);

  IF OLD.type = 'TRANSFER' THEN
    IF NEW.transfer_status IS DISTINCT FROM OLD.transfer_status AND NEW.transfer_status = 'Received' THEN
      IF NEW.received_by IS DISTINCT FROM actor.name OR actor_norm_role NOT IN
        ('super_admin','ceo','admin','manager','regional_manager','operations_manager','warehouse_manager','store_manager','receiver','inventory_manager','logistics_manager','replenishment_planner','inventory_specialist','dispatch_manager','regional_logistics_lead','supply_chain_manager')
        OR NOT public.is_site_in_my_authorized_scope(NEW.dest_site_id::text,NEW.country_code) THEN
        RAISE EXCEPTION 'Receipt requires the authenticated destination receiving custodian'; END IF;
    END IF;
    IF NEW.transfer_status IS DISTINCT FROM OLD.transfer_status AND NEW.transfer_status = 'Received'
      AND COALESCE(OLD.transfer_status,'') NOT IN ('Delivered','Partially Delivered') THEN
      RAISE EXCEPTION 'Record transport arrival before receiving inspection'; END IF;
    IF NEW.transfer_status IS DISTINCT FROM OLD.transfer_status
      AND NEW.transfer_status IN ('Shipped','In-Transit','Delivered','Partially Delivered') AND pg_trigger_depth() < 2 THEN
      RAISE EXCEPTION 'Transport handoffs must come from the linked dispatch shipment'; END IF;
    RETURN NEW;
  END IF;
  IF OLD.type NOT IN ('DISPATCH','DRIVER') THEN RETURN NEW; END IF;
  manager := actor_norm_role IN ('super_admin','ceo','admin','manager','regional_manager',
    'operations_manager','warehouse_manager','logistics_manager','dispatch_manager','dispatcher',
    'fleet_maintenance_supervisor','regional_logistics_lead','supply_chain_manager');
  IF NEW.type IS DISTINCT FROM OLD.type OR NEW.site_id IS DISTINCT FROM OLD.site_id
    OR NEW.source_site_id IS DISTINCT FROM OLD.source_site_id
    OR NEW.dest_site_id IS DISTINCT FROM OLD.dest_site_id
    OR NEW.country_code IS DISTINCT FROM OLD.country_code
    OR NEW.order_ref IS DISTINCT FROM OLD.order_ref THEN
    RAISE EXCEPTION 'Shipment identity and route cannot be changed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.sites s WHERE s.id = origin AND upper(s.country) = upper(OLD.country_code))
    OR (OLD.dest_site_id IS NOT NULL AND NOT EXISTS
      (SELECT 1 FROM public.sites s WHERE s.id = OLD.dest_site_id AND upper(s.country) = upper(OLD.country_code))) THEN
    RAISE EXCEPTION 'Shipment route must stay within its country';
  END IF;
  IF actor_norm_role NOT IN ('super_admin','ceo') AND NOT EXISTS
    (SELECT 1 FROM public.sites s WHERE s.id = actor.site_id AND upper(s.country) = upper(OLD.country_code)) THEN
    RAISE EXCEPTION 'Shipment country is outside employee scope';
  END IF;
  IF manager AND NOT public.is_site_in_my_authorized_scope(origin::text, OLD.country_code) THEN
    RAISE EXCEPTION 'Dispatch control requires authority at the origin site';
  END IF;
  IF NOT manager AND (actor_norm_role <> 'driver' OR OLD.assigned_to IS DISTINCT FROM actor.id::text) THEN
    RAISE EXCEPTION 'Only the assigned verified driver can operate this delivery';
  END IF;
  IF NEW.received_at IS DISTINCT FROM OLD.received_at OR NEW.received_by IS DISTINCT FROM OLD.received_by
    OR NEW.transfer_status = 'Received' THEN RAISE EXCEPTION 'Receipt belongs to the destination receiving workflow'; END IF;
  IF (NEW.assigned_to IS DISTINCT FROM OLD.assigned_to OR NEW.delivery_method IS DISTINCT FROM OLD.delivery_method
    OR NEW.external_carrier_name IS DISTINCT FROM OLD.external_carrier_name OR NEW.location IS DISTINCT FROM OLD.location)
    AND NOT manager THEN RAISE EXCEPTION 'Dispatch leadership controls allocation and dock release'; END IF;
  IF OLD.transfer_status IN ('Shipped','In-Transit','Delivered','Partially Delivered','Received','Completed')
    AND (NEW.assigned_to IS DISTINCT FROM OLD.assigned_to OR NEW.delivery_method IS DISTINCT FROM OLD.delivery_method
      OR NEW.external_carrier_name IS DISTINCT FROM OLD.external_carrier_name) THEN
    RAISE EXCEPTION 'Transport allocation is locked after departure';
  END IF;
  IF COALESCE(NEW.delivery_method,'Internal') = 'Internal' AND NULLIF(NEW.assigned_to,'') IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.employees e WHERE e.id::text = NEW.assigned_to
      AND public.normalize_role(e.role) = 'driver' AND lower(e.status) = 'active' AND e.site_id = origin) THEN
    RAISE EXCEPTION 'Assign an active verified driver from the origin site';
  END IF;
  IF NEW.location ~ '^Dock D[1-6]$' AND NEW.transfer_status IN ('Packed','Staged','Ready') THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('outbound:' || origin::text, 0));
    IF EXISTS (SELECT 1 FROM public.wms_jobs j WHERE j.id <> NEW.id AND j.type IN ('DISPATCH','DRIVER')
      AND COALESCE(j.source_site_id,j.site_id) = origin AND j.country_code = NEW.country_code
      AND j.location = NEW.location AND j.status NOT IN ('Completed','Cancelled','Deleted')
      AND j.transfer_status IN ('Packed','Staged','Ready')) THEN RAISE EXCEPTION 'Outbound dock is already occupied'; END IF;
  END IF;
  arrival := NEW.transfer_status IS DISTINCT FROM OLD.transfer_status AND NEW.transfer_status IN ('Delivered','Partially Delivered');
  IF NEW.line_items IS DISTINCT FROM OLD.line_items AND NOT COALESCE(arrival,false) THEN
    RAISE EXCEPTION 'Packed manifests can only receive arrival quantities'; END IF;
  IF NEW.transfer_status = 'Cancelled' OR NEW.status = 'Cancelled' THEN
    IF NOT manager OR OLD.transfer_status IN ('Shipped','In-Transit','Delivered','Partially Delivered','Received','Completed') THEN
      RAISE EXCEPTION 'In-transit goods require a recorded arrival or return before cancellation'; END IF;
  END IF;
  IF NEW.transfer_status IS DISTINCT FROM OLD.transfer_status AND NEW.transfer_status IN ('Shipped','In-Transit') THEN
    IF COALESCE(OLD.transfer_status,'') NOT IN ('Packed','Staged','Ready','Shipped','In-Transit')
      OR OLD.status IN ('Completed','Cancelled','Deleted') THEN RAISE EXCEPTION 'Shipment is not ready for departure'; END IF;
    IF COALESCE(OLD.transfer_status,'') NOT IN ('Shipped','In-Transit') THEN
      IF NOT manager OR OLD.location !~ '^Dock D[1-6]$' OR OLD.location IS NULL THEN
        RAISE EXCEPTION 'Dispatch must release the shipment from an outbound dock'; END IF;
      IF COALESCE(NEW.delivery_method,'Internal') = 'External' THEN
        IF NULLIF(btrim(NEW.external_carrier_name),'') IS NULL OR NULLIF(NEW.assigned_to,'') IS NOT NULL THEN
          RAISE EXCEPTION 'External shipments require a named carrier and no internal driver'; END IF;
      ELSIF NULLIF(NEW.assigned_to,'') IS NULL THEN RAISE EXCEPTION 'Assign a verified driver before departure'; END IF;
    END IF;
    NEW.shipped_at := COALESCE(OLD.shipped_at, now());
    NEW.status := 'In-Progress'; NEW.location := 'In-Transit';
  ELSIF arrival THEN
    IF COALESCE(OLD.transfer_status,'') NOT IN ('Shipped','In-Transit') THEN RAISE EXCEPTION 'Record departure before arrival'; END IF;
    IF jsonb_typeof(NEW.line_items) <> 'array' OR jsonb_array_length(NEW.line_items) <> jsonb_array_length(OLD.line_items)
      OR COALESCE(jsonb_array_length(OLD.line_items),0) = 0 THEN RAISE EXCEPTION 'Arrival manifest is incomplete'; END IF;
    FOR item IN SELECT value FROM jsonb_array_elements(OLD.line_items) LOOP
      qty := COALESCE(NULLIF((item->>'dispatchedQty')::numeric,0), NULLIF((item->>'shippedQty')::numeric,0),
        NULLIF((item->>'packedQty')::numeric,0), NULLIF((item->>'pickedQty')::numeric,0),
        (item->>'expectedQty')::numeric, (item->>'quantity')::numeric, 0);
      delivered := (NEW.line_items->idx->>'deliveredQty')::numeric;
      IF delivered IS NULL OR delivered < 0 OR delivered > qty THEN RAISE EXCEPTION 'Invalid arrival quantity'; END IF;
      partial := partial OR delivered < qty;
      manifest := manifest || jsonb_build_array(item || jsonb_build_object('deliveredQty',delivered,'undeliveredQty',qty-delivered));
      idx := idx + 1;
    END LOOP;
    IF partial AND (NULLIF(btrim(NEW.notes),'') IS NULL OR NEW.notes IS NOT DISTINCT FROM OLD.notes) THEN
      RAISE EXCEPTION 'Explain the undelivered goods'; END IF;
    NEW.line_items := manifest;
    NEW.transfer_status := CASE WHEN partial THEN 'Partially Delivered' ELSE 'Delivered' END;
    NEW.status := 'Completed'; NEW.delivered_at := now(); NEW.completed_at := now(); NEW.completed_by := actor.id::text;
    NEW.has_discrepancy := partial OR COALESCE(OLD.has_discrepancy,false);
  ELSIF NEW.transfer_status IS DISTINCT FROM OLD.transfer_status AND COALESCE(NEW.transfer_status,'') <> 'Cancelled' THEN
    RAISE EXCEPTION 'Shipment lifecycle cannot skip or reverse a handoff';
  ELSIF NEW.status = 'Completed' AND OLD.status <> 'Completed' THEN
    RAISE EXCEPTION 'Record arrival from the driver workflow';
  END IF;
  IF OLD.transfer_status IN ('Delivered','Partially Delivered','Received','Completed')
    AND (NEW.line_items IS DISTINCT FROM OLD.line_items OR NEW.status IS DISTINCT FROM OLD.status) THEN
    RAISE EXCEPTION 'Recorded arrivals are immutable'; END IF;
  RETURN NEW;
END;
$function$;
