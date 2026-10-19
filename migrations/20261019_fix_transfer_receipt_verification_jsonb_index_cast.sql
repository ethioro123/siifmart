-- WITH ORDINALITY returns bigint indexes. JSONB array subscripting with ->
-- expects integer, so cast the zero-based index before reading saved counts.
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
    'condition',CASE WHEN v_check.status='verified' THEN coalesce(v_check.final_counts->((i.ordinality-1)::integer)->>'condition','Good') ELSE 'Good' END,
    'receivedQty',CASE WHEN v_check.status='verified' THEN ((v_check.final_counts->((i.ordinality-1)::integer))->>'receivedQty')::numeric ELSE 0 END
  ) ORDER BY i.ordinality),'[]'::jsonb) INTO v_items
  FROM jsonb_array_elements(coalesce(v_job.line_items,'[]'::jsonb)) WITH ORDINALITY i(value,ordinality);
  RETURN jsonb_build_object('status',v_check.status,'canCount',v_can_count,
    'hasDiscrepancy',v_check.has_discrepancy,'firstCounterId',v_check.first_counter_id,
    'secondCounterId',v_check.second_counter_id,'discrepancyCount',v_discrepancy_count,'items',v_items);
END;
$function$;
