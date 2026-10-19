-- Transport custody and receipt are separate events. Existing RLS remains in force.
-- Private trigger functions perform only the validated linked-record cascade.
CREATE OR REPLACE FUNCTION private.guard_shipment_workflow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
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
BEGIN
  IF OLD.type NOT IN ('DISPATCH','DRIVER','TRANSFER') THEN RETURN NEW; END IF;
  IF auth.jwt()->>'role' = 'service_role' THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authenticated employee required'; END IF;
  SELECT e.* INTO actor FROM public.employees e
   WHERE (e.id = auth.uid() OR lower(e.email) = lower(auth.jwt()->>'email'))
     AND lower(e.status) = 'active' ORDER BY (e.id = auth.uid()) DESC LIMIT 1;
  IF actor.id IS NULL THEN RAISE EXCEPTION 'Active employee required'; END IF;
  IF OLD.type = 'TRANSFER' THEN
    IF NEW.transfer_status IS DISTINCT FROM OLD.transfer_status AND NEW.transfer_status = 'Received' THEN
      IF NEW.received_by IS DISTINCT FROM actor.name OR lower(actor.role) NOT IN
        ('super_admin','ceo','regional_manager','warehouse_manager','store_manager','receiver','inventory_manager')
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
  manager := lower(actor.role) IN ('super_admin','ceo','admin','manager','regional_manager',
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
  IF lower(actor.role) NOT IN ('super_admin','ceo') AND NOT EXISTS
    (SELECT 1 FROM public.sites s WHERE s.id = actor.site_id AND upper(s.country) = upper(OLD.country_code)) THEN
    RAISE EXCEPTION 'Shipment country is outside employee scope';
  END IF;
  IF manager AND NOT public.is_site_in_my_authorized_scope(origin::text, OLD.country_code) THEN
    RAISE EXCEPTION 'Dispatch control requires authority at the origin site';
  END IF;
  IF NOT manager AND (lower(actor.role) <> 'driver' OR OLD.assigned_to IS DISTINCT FROM actor.id::text) THEN
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
      AND lower(e.role) = 'driver' AND lower(e.status) = 'active' AND e.site_id = origin) THEN
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
$$;

CREATE OR REPLACE FUNCTION private.sync_shipment_workflow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  origin uuid := COALESCE(NEW.source_site_id,NEW.site_id);
  phase text := NEW.transfer_status;
BEGIN
  IF NEW.type NOT IN ('DISPATCH','DRIVER','TRANSFER') OR
    (NEW.transfer_status IS NOT DISTINCT FROM OLD.transfer_status AND NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.assigned_to IS NOT DISTINCT FROM OLD.assigned_to) THEN RETURN NEW; END IF;
  IF NEW.type IN ('DISPATCH','DRIVER') THEN
    UPDATE public.wms_jobs p SET
      transfer_status = phase,
      status = CASE WHEN phase IN ('Delivered','Partially Delivered') THEN 'Pending' ELSE p.status END,
      assigned_to = NEW.assigned_to, delivery_method = NEW.delivery_method,
      external_carrier_name = NEW.external_carrier_name,
      shipped_at = COALESCE(NEW.shipped_at,p.shipped_at), delivered_at = COALESCE(NEW.delivered_at,p.delivered_at),
      has_discrepancy = COALESCE(p.has_discrepancy,false) OR COALESCE(NEW.has_discrepancy,false)
    WHERE p.type = 'TRANSFER' AND p.country_code = NEW.country_code
      AND COALESCE(p.source_site_id,p.site_id) = origin AND p.dest_site_id IS NOT DISTINCT FROM NEW.dest_site_id
      AND NULLIF(NEW.order_ref,'') IS NOT NULL AND (p.id::text = NEW.order_ref OR p.job_number = NEW.order_ref OR p.order_ref = NEW.order_ref)
      AND p.transfer_status IS DISTINCT FROM 'Received' AND p.status <> 'Cancelled';
    IF phase IN ('Shipped','In-Transit','Delivered','Partially Delivered') THEN
      UPDATE public.sales SET fulfillment_status = CASE WHEN phase IN ('Shipped','In-Transit') THEN 'Shipped' ELSE 'Delivered' END
      WHERE id::text = NEW.order_ref AND site_id = origin AND country_code = NEW.country_code;
    END IF;
    INSERT INTO public.system_logs(action,module,entity_type,entity_id,performed_by,site_id,country_code,details)
    VALUES ('SHIPMENT_HANDOFF','Fulfillment','wms_job',NEW.id::text,auth.uid()::text,origin::text,NEW.country_code,
      jsonb_build_object('phase',phase,'previousPhase',OLD.transfer_status,'driverId',NEW.assigned_to,'receivingAccepted',false)::text);
  END IF;
  UPDATE public.transfers t SET
    transfer_status = phase,
    status = CASE WHEN NEW.type = 'TRANSFER' AND phase = 'Received' THEN 'Completed'
      WHEN phase = 'Cancelled' THEN 'Cancelled' ELSE t.status END,
    shipped_at = COALESCE(NEW.shipped_at,t.shipped_at), delivered_at = COALESCE(NEW.delivered_at,t.delivered_at),
    received_at = CASE WHEN NEW.type = 'TRANSFER' AND phase = 'Received' THEN NEW.received_at ELSE t.received_at END,
    received_by = CASE WHEN NEW.type = 'TRANSFER' AND phase = 'Received' THEN NEW.received_by ELSE t.received_by END,
    driver_id = (SELECT e.id FROM public.employees e WHERE e.id::text = NEW.assigned_to AND lower(e.role)='driver'),
    driver_type = lower(COALESCE(NEW.delivery_method,'Internal')),
    driver_name = CASE WHEN NEW.delivery_method = 'External' THEN NEW.external_carrier_name ELSE
      (SELECT e.name FROM public.employees e WHERE e.id::text = NEW.assigned_to AND lower(e.role)='driver') END,
    has_discrepancy = COALESCE(t.has_discrepancy,false) OR COALESCE(NEW.has_discrepancy,false)
  WHERE t.country_code = NEW.country_code AND t.source_site_id = origin AND t.dest_site_id IS NOT DISTINCT FROM NEW.dest_site_id
    AND (t.id::text = NEW.id::text OR (NULLIF(NEW.order_ref,'') IS NOT NULL AND (t.id::text = NEW.order_ref OR t.order_ref = NEW.order_ref)))
    AND t.transfer_status IS DISTINCT FROM 'Received' AND t.status <> 'Cancelled';
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.guard_inbound_dock()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.dock_slot IS NOT DISTINCT FROM OLD.dock_slot OR NEW.dock_slot IS NULL OR NEW.dock_slot = '' THEN RETURN NEW; END IF;
  IF NEW.dock_slot !~ '^D[1-6]$' OR NEW.status NOT IN ('Approved','Ordered','Partially Received') THEN
    RAISE EXCEPTION 'Select an inbound dock for an approved outstanding purchase order'; END IF;
  IF auth.uid() IS NULL OR NOT public.is_site_in_my_authorized_scope(NEW.site_id::text,NEW.country_code) THEN
    RAISE EXCEPTION 'Inbound dock assignment requires authorized site access'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('inbound:' || NEW.site_id::text,0));
  IF EXISTS (SELECT 1 FROM public.purchase_orders p WHERE p.id <> NEW.id AND p.site_id = NEW.site_id
    AND p.country_code = NEW.country_code AND p.dock_slot = NEW.dock_slot
    AND p.status IN ('Approved','Ordered','Partially Received')) THEN RAISE EXCEPTION 'Inbound dock is already occupied'; END IF;
  RETURN NEW;
END;
$$;

-- Dispatchers manage transport within their authorized origin, without becoming global managers.
CREATE OR REPLACE FUNCTION public.enforce_wms_job_update_restrictions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
    old_item JSONB;
    new_item JSONB;
    old_sku TEXT;
    new_sku TEXT;
    old_exp NUMERIC;
    new_exp NUMERIC;
    i INT;
    old_count INT;
    new_count INT;
BEGIN
    IF public.is_ceo() OR public.is_manager() OR (
        lower(public.get_my_role()) IN ('dispatcher','regional_logistics_lead')
        AND upper(OLD.country_code) = upper(public.get_my_country_code())
        AND public.is_site_in_my_authorized_scope(COALESCE(OLD.source_site_id,OLD.site_id)::text,OLD.country_code)
        AND (OLD.type IN ('DISPATCH','DRIVER') OR (OLD.type = 'TRANSFER' AND pg_trigger_depth() > 1))
    ) THEN
        NEW.updated_at = NOW();
        RETURN NEW;
    END IF;

    IF NEW.site_id::text IS DISTINCT FROM OLD.site_id::text THEN
        RAISE EXCEPTION 'Zero-Trust Security Violation: Floor workers cannot reassign the facility site_id of a job.';
    END IF;

    IF NEW.country_code::text IS DISTINCT FROM OLD.country_code::text THEN
        RAISE EXCEPTION 'Zero-Trust Security Violation: Floor workers cannot alter the country_code of a job.';
    END IF;

    IF NEW.order_ref::text IS DISTINCT FROM OLD.order_ref::text THEN
        RAISE EXCEPTION 'Zero-Trust Security Violation: Floor workers cannot alter the order reference of a job.';
    END IF;

    IF OLD.assigned_to IS NOT NULL AND OLD.assigned_to::text <> '' THEN
        IF NEW.assigned_to::text IS DISTINCT FROM OLD.assigned_to::text THEN
            RAISE EXCEPTION 'Zero-Trust Security Violation: Only supervisors and dispatchers can reassign active jobs.';
        END IF;
    END IF;

    IF OLD.line_items IS NOT NULL AND jsonb_typeof(OLD.line_items) = 'array' THEN
        old_count := jsonb_array_length(OLD.line_items);
        new_count := COALESCE(jsonb_array_length(NEW.line_items), 0);

        IF new_count < old_count THEN
            RAISE EXCEPTION 'Zero-Trust Security Violation: Workers cannot delete line items from a job manifest.';
        END IF;

        FOR i IN 0..(old_count - 1) LOOP
            old_item := OLD.line_items->i;
            new_item := NEW.line_items->i;

            old_sku := COALESCE(old_item->>'sku', old_item->>'productId', '');
            new_sku := COALESCE(new_item->>'sku', new_item->>'productId', '');

            IF old_sku <> '' AND new_sku <> '' AND old_sku = new_sku THEN
                old_exp := COALESCE((old_item->>'expectedQty')::numeric, (old_item->>'expected_qty')::numeric, (old_item->>'orderedQty')::numeric, 0);
                new_exp := COALESCE((new_item->>'expectedQty')::numeric, (new_item->>'expected_qty')::numeric, (new_item->>'orderedQty')::numeric, 0);

                IF old_exp > 0 AND new_exp <> old_exp THEN
                    RAISE EXCEPTION 'Zero-Trust Security Violation: Workers cannot modify expected quantity (SKU: %, Expected: %, Attempted: %). Discrepancies must be recorded as Short/Discrepancy.',
                        old_sku, old_exp, new_exp;
                END IF;
            END IF;
        END LOOP;
    END IF;

    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;
DROP POLICY IF EXISTS dispatcher_transport_read ON public.wms_jobs;
CREATE POLICY dispatcher_transport_read ON public.wms_jobs FOR SELECT TO authenticated USING (
  lower(public.get_my_role()) IN ('dispatcher','regional_logistics_lead')
  AND upper(country_code) = upper(public.get_my_country_code())
  AND public.is_site_in_my_authorized_scope(COALESCE(source_site_id,site_id)::text,country_code)
  AND type IN ('DISPATCH','DRIVER','TRANSFER')
);
DROP POLICY IF EXISTS dispatcher_transport_update ON public.wms_jobs;
CREATE POLICY dispatcher_transport_update ON public.wms_jobs FOR UPDATE TO authenticated USING (
  lower(public.get_my_role()) IN ('dispatcher','regional_logistics_lead')
  AND upper(country_code) = upper(public.get_my_country_code())
  AND public.is_site_in_my_authorized_scope(COALESCE(source_site_id,site_id)::text,country_code)
  AND type IN ('DISPATCH','DRIVER')
) WITH CHECK (
  lower(public.get_my_role()) IN ('dispatcher','regional_logistics_lead')
  AND upper(country_code) = upper(public.get_my_country_code())
  AND public.is_site_in_my_authorized_scope(COALESCE(source_site_id,site_id)::text,country_code)
  AND type IN ('DISPATCH','DRIVER')
);
DROP POLICY IF EXISTS destination_transfer_receipt_read ON public.wms_jobs;
CREATE POLICY destination_transfer_receipt_read ON public.wms_jobs FOR SELECT TO authenticated USING (
  type = 'TRANSFER' AND lower(public.get_my_role()) = 'receiver'
  AND dest_site_id = public.get_my_site_id() AND upper(country_code) = upper(public.get_my_country_code())
  AND transfer_status IN ('Shipped','In-Transit','Delivered','Partially Delivered','Received')
);
DROP POLICY IF EXISTS destination_transfer_receipt_update ON public.wms_jobs;
CREATE POLICY destination_transfer_receipt_update ON public.wms_jobs FOR UPDATE TO authenticated USING (
  type = 'TRANSFER' AND lower(public.get_my_role()) = 'receiver'
  AND dest_site_id = public.get_my_site_id() AND upper(country_code) = upper(public.get_my_country_code())
  AND transfer_status IN ('Delivered','Partially Delivered')
) WITH CHECK (
  type = 'TRANSFER' AND lower(public.get_my_role()) = 'receiver'
  AND dest_site_id = public.get_my_site_id() AND upper(country_code) = upper(public.get_my_country_code())
  AND transfer_status = 'Received' AND status = 'Completed'
);

REVOKE ALL ON FUNCTION private.guard_shipment_workflow(), private.sync_shipment_workflow(), private.guard_inbound_dock() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS guard_shipment_workflow ON public.wms_jobs;
CREATE TRIGGER guard_shipment_workflow BEFORE UPDATE ON public.wms_jobs FOR EACH ROW EXECUTE FUNCTION private.guard_shipment_workflow();
DROP TRIGGER IF EXISTS sync_shipment_workflow ON public.wms_jobs;
CREATE TRIGGER sync_shipment_workflow AFTER UPDATE ON public.wms_jobs FOR EACH ROW EXECUTE FUNCTION private.sync_shipment_workflow();
DROP TRIGGER IF EXISTS guard_inbound_dock ON public.purchase_orders;
CREATE TRIGGER guard_inbound_dock BEFORE UPDATE OF dock_slot ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION private.guard_inbound_dock();
