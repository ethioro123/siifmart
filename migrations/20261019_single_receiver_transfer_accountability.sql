-- A single authorized receiver owns the blind physical count and the receipt.
-- Variances are recorded and accepted with that receiver's identity; no driver
-- signature or second destination employee is required.
CREATE OR REPLACE FUNCTION public.get_transfer_receipt_verification(p_job_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp AS $function$
DECLARE
  v_actor_id uuid := public.get_my_employee_id();
  v_role text := lower(coalesce(public.get_my_role(),''));
  v_job public.wms_jobs%ROWTYPE;
  v_check public.transfer_receipt_verifications%ROWTYPE;
  v_items jsonb;
  v_manifest jsonb;
  v_expected numeric;
  v_received numeric;
  v_condition text;
  v_discrepancy_count numeric := 0;
  v_can_count boolean;
BEGIN
  IF auth.uid() IS NULL OR v_actor_id IS NULL THEN RAISE EXCEPTION 'Authenticated employee required'; END IF;
  IF v_role NOT IN ('receiver','store_manager','warehouse_manager','inventory_manager','regional_manager','operations_manager','super_admin','ceo','admin','manager','logistics_manager','replenishment_planner','inventory_specialist','dispatch_manager','regional_logistics_lead','supply_chain_manager') THEN
    RAISE EXCEPTION 'This employee role cannot verify transfer receipt'; END IF;
  SELECT * INTO v_job FROM public.wms_jobs j WHERE j.id=p_job_id AND j.type='TRANSFER'
    AND j.transfer_status IN ('Delivered','Partially Delivered')
    AND public.is_site_in_my_authorized_scope(j.dest_site_id::text,j.country_code);
  IF NOT FOUND THEN RAISE EXCEPTION 'Transfer is not awaiting receipt at this employee site'; END IF;
  SELECT * INTO v_check FROM public.transfer_receipt_verifications c WHERE c.job_id=p_job_id;
  IF NOT FOUND THEN
    SELECT coalesce(jsonb_agg(jsonb_build_object(
      'index',i.ordinality-1,'productId',coalesce(i.value->>'productId',i.value->>'product_id',i.value->>'id'),
      'name',coalesce(i.value->>'name',i.value->>'productName',i.value->>'product_name','Item'),
      'sku',coalesce(i.value->>'sku',''),'unit',coalesce(i.value->>'unit','pcs'),
      'size',coalesce(i.value->>'size',''),'packQuantity',i.value->'packQuantity',
      'packageType',i.value->'packageType','barcode',coalesce(i.value->>'barcode',''),
      'condition','Good','receivedQty',0) ORDER BY i.ordinality),'[]'::jsonb) INTO v_items
    FROM jsonb_array_elements(coalesce(v_job.line_items,'[]'::jsonb)) WITH ORDINALITY i(value,ordinality);
    RETURN jsonb_build_object('status','awaiting_first_count','canCount',true,'items',v_items);
  END IF;
  IF v_check.status='verified' THEN
    SELECT m.items INTO v_manifest FROM private.transfer_receipt_manifests m WHERE m.job_id=p_job_id;
    FOR v_expected,v_received,v_condition IN
      SELECT coalesce(nullif(coalesce(m.item->>'deliveredQty',m.item->>'requestedMeasureQty',m.item->>'dispatchedQty',m.item->>'shippedQty',m.item->>'packedQty',m.item->>'pickedQty',m.item->>'expectedQty',m.item->>'quantity'),'')::numeric,0),
        coalesce(nullif(c.item->>'receivedQty','')::numeric,0),coalesce(c.item->>'condition','Good')
      FROM jsonb_array_elements(coalesce(v_manifest,'[]'::jsonb)) WITH ORDINALITY m(item,ordinality)
      JOIN jsonb_array_elements(coalesce(v_check.final_counts,'[]'::jsonb)) WITH ORDINALITY c(item,ordinality) USING (ordinality)
    LOOP
      IF v_received<>v_expected THEN v_discrepancy_count:=v_discrepancy_count+abs(v_received-v_expected);
      ELSIF v_condition<>'Good' THEN v_discrepancy_count:=v_discrepancy_count+greatest(v_received,1); END IF;
    END LOOP;
  END IF;
  v_can_count := v_check.status <> 'verified';
  SELECT coalesce(jsonb_agg(jsonb_build_object(
    'index',i.ordinality-1,'productId',coalesce(i.value->>'productId',i.value->>'product_id',i.value->>'id'),
    'name',coalesce(i.value->>'name',i.value->>'productName',i.value->>'product_name','Item'),
    'sku',coalesce(i.value->>'sku',''),'unit',coalesce(i.value->>'unit','pcs'),
    'size',coalesce(i.value->>'size',''),'packQuantity',i.value->'packQuantity',
    'packageType',i.value->'packageType','barcode',coalesce(i.value->>'barcode',''),
    'condition',CASE WHEN v_check.status='verified' THEN coalesce(v_check.final_counts->(i.ordinality-1)->>'condition','Good') ELSE 'Good' END,
    'receivedQty',CASE WHEN v_check.status='verified' THEN ((v_check.final_counts->(i.ordinality-1))->>'receivedQty')::numeric ELSE 0 END
  ) ORDER BY i.ordinality),'[]'::jsonb) INTO v_items
  FROM jsonb_array_elements(coalesce(v_job.line_items,'[]'::jsonb)) WITH ORDINALITY i(value,ordinality);
  RETURN jsonb_build_object('status',v_check.status,'canCount',v_can_count,
    'hasDiscrepancy',v_check.has_discrepancy,'firstCounterId',v_check.first_counter_id,
    'secondCounterId',v_check.second_counter_id,'discrepancyCount',v_discrepancy_count,'items',v_items);
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_transfer_receipt_count(p_job_id uuid,p_counts jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp AS $function$
DECLARE
  v_actor_id uuid := public.get_my_employee_id();
  v_role text := lower(coalesce(public.get_my_role(),''));
  v_job public.wms_jobs%ROWTYPE;
  v_manifest jsonb;
  v_check public.transfer_receipt_verifications%ROWTYPE;
  v_actor public.employees%ROWTYPE;
  v_expected numeric;
  v_received numeric;
  v_index integer := 0;
  v_has_variance boolean := false;
  v_discrepancy_count numeric := 0;
  v_condition text;
  v_difference numeric;
  v_status text := 'verified';
  v_expected_count integer;
BEGIN
  IF auth.uid() IS NULL OR v_actor_id IS NULL THEN RAISE EXCEPTION 'Authenticated employee required'; END IF;
  IF v_role NOT IN ('receiver','store_manager','warehouse_manager','inventory_manager','regional_manager','operations_manager','super_admin','ceo','admin','manager','logistics_manager','replenishment_planner','inventory_specialist','dispatch_manager','regional_logistics_lead','supply_chain_manager') THEN
    RAISE EXCEPTION 'This employee role cannot verify transfer receipt'; END IF;
  IF jsonb_typeof(p_counts)<>'array' THEN RAISE EXCEPTION 'A complete count list is required'; END IF;
  SELECT * INTO v_job FROM public.wms_jobs j WHERE j.id=p_job_id AND j.type='TRANSFER'
    AND j.transfer_status IN ('Delivered','Partially Delivered')
    AND public.is_site_in_my_authorized_scope(j.dest_site_id::text,j.country_code) FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transfer is not awaiting receipt at this employee site'; END IF;
  SELECT m.items INTO v_manifest FROM private.transfer_receipt_manifests m WHERE m.job_id=p_job_id;
  IF jsonb_typeof(v_manifest)<>'array' THEN RAISE EXCEPTION 'Private arrival manifest is unavailable; receipt is blocked'; END IF;
  SELECT * INTO v_actor FROM public.employees e WHERE e.id=v_actor_id AND lower(coalesce(e.status,'active'))='active';
  IF NOT FOUND THEN RAISE EXCEPTION 'Active employee required'; END IF;
  v_expected_count:=jsonb_array_length(v_manifest);
  IF v_expected_count=0 OR jsonb_array_length(p_counts)<>v_expected_count THEN RAISE EXCEPTION 'Count every transfer line before submitting'; END IF;
  SELECT * INTO v_check FROM public.transfer_receipt_verifications c WHERE c.job_id=p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.transfer_receipt_verifications(job_id,site_id,country_code,first_counter_id)
      VALUES (p_job_id,v_job.dest_site_id,upper(v_job.country_code),v_actor_id) RETURNING * INTO v_check;
  ELSIF v_check.status='verified' THEN RAISE EXCEPTION 'Transfer receipt verification is already complete'; END IF;
  FOR v_expected,v_received,v_condition IN
    SELECT coalesce(nullif(coalesce(m.item->>'deliveredQty',m.item->>'requestedMeasureQty',m.item->>'dispatchedQty',m.item->>'shippedQty',m.item->>'packedQty',m.item->>'pickedQty',m.item->>'expectedQty',m.item->>'quantity'),'')::numeric,0),
      coalesce(nullif(c.item->>'receivedQty','')::numeric,-1),coalesce(c.item->>'condition','Good')
    FROM jsonb_array_elements(v_manifest) WITH ORDINALITY m(item,ordinality)
    JOIN jsonb_array_elements(p_counts) WITH ORDINALITY c(item,ordinality) USING (ordinality) ORDER BY m.ordinality
  LOOP
    IF v_received<0 OR v_received>100000000 THEN RAISE EXCEPTION 'Enter a valid non-negative received quantity'; END IF;
    IF coalesce(p_counts->v_index->>'index',v_index::text)::integer<>v_index THEN RAISE EXCEPTION 'Count list order is invalid'; END IF;
    IF coalesce(p_counts->v_index->>'productId','')<>coalesce(v_manifest->v_index->>'productId',v_manifest->v_index->>'product_id',v_manifest->v_index->>'id','') THEN RAISE EXCEPTION 'Counted product does not match the transfer manifest'; END IF;
    IF v_condition NOT IN ('Good','Damaged','Short') THEN RAISE EXCEPTION 'Invalid received condition'; END IF;
    v_difference:=abs(v_received-v_expected);
    v_has_variance:=v_has_variance OR v_difference>0 OR v_condition<>'Good';
    IF v_difference>0 THEN v_discrepancy_count:=v_discrepancy_count+v_difference;
    ELSIF v_condition<>'Good' THEN v_discrepancy_count:=v_discrepancy_count+greatest(v_received,1); END IF;
    v_index:=v_index+1;
  END LOOP;
  IF v_check.status='awaiting_recount' THEN
    UPDATE public.transfer_receipt_verifications SET status=v_status,second_counts=p_counts,second_counter_id=v_actor_id,
      second_counted_at=now(),final_counts=p_counts,has_discrepancy=v_has_variance,updated_at=now() WHERE job_id=p_job_id;
  ELSE
    UPDATE public.transfer_receipt_verifications SET status=v_status,first_counts=p_counts,first_counter_id=v_actor_id,
      first_counted_at=now(),final_counts=p_counts,has_discrepancy=v_has_variance,updated_at=now() WHERE job_id=p_job_id;
  END IF;
  RETURN jsonb_build_object('status',v_status,'canCount',false,'hasDiscrepancy',v_has_variance,
    'discrepancyCount',v_discrepancy_count,'counterId',v_actor_id,'items',p_counts);
END;
$function$;
REVOKE ALL ON FUNCTION public.get_transfer_receipt_verification(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.record_transfer_receipt_count(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_transfer_receipt_verification(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_transfer_receipt_count(uuid,jsonb) TO authenticated;

-- Match transfer receipt access to the roles that are allowed to operate the
-- Transfer tab, while retaining authorized destination-site and country scope.
DROP POLICY IF EXISTS destination_transfer_receipt_read ON public.wms_jobs;
CREATE POLICY destination_transfer_receipt_read ON public.wms_jobs FOR SELECT TO authenticated USING (
  type='TRANSFER' AND lower(public.get_my_role()) IN ('receiver','store_manager','warehouse_manager','inventory_manager','regional_manager','operations_manager','super_admin','ceo','admin','manager','logistics_manager','replenishment_planner','inventory_specialist','dispatch_manager','regional_logistics_lead','supply_chain_manager')
  AND public.is_site_in_my_authorized_scope(dest_site_id::text,country_code)
  AND upper(country_code)=upper(public.get_my_country_code())
  AND transfer_status IN ('Shipped','In-Transit','Delivered','Partially Delivered','Received')
);
DROP POLICY IF EXISTS destination_transfer_receipt_update ON public.wms_jobs;
CREATE POLICY destination_transfer_receipt_update ON public.wms_jobs FOR UPDATE TO authenticated USING (
  type='TRANSFER' AND lower(public.get_my_role()) IN ('receiver','store_manager','warehouse_manager','inventory_manager','regional_manager','operations_manager','super_admin','ceo','admin','manager','logistics_manager','replenishment_planner','inventory_specialist','dispatch_manager','regional_logistics_lead','supply_chain_manager')
  AND public.is_site_in_my_authorized_scope(dest_site_id::text,country_code)
  AND upper(country_code)=upper(public.get_my_country_code())
  AND transfer_status IN ('Delivered','Partially Delivered')
) WITH CHECK (
  type='TRANSFER' AND lower(public.get_my_role()) IN ('receiver','store_manager','warehouse_manager','inventory_manager','regional_manager','operations_manager','super_admin','ceo','admin','manager','logistics_manager','replenishment_planner','inventory_specialist','dispatch_manager','regional_logistics_lead','supply_chain_manager')
  AND public.is_site_in_my_authorized_scope(dest_site_id::text,country_code)
  AND upper(country_code)=upper(public.get_my_country_code())
  AND transfer_status='Received' AND status='Completed'
);
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
REVOKE ALL ON FUNCTION private.guard_shipment_workflow() FROM PUBLIC,anon,authenticated;
