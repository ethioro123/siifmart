-- Restore the established single-receiver policy. Preserve blind reads, recorded counts and arrival authorization.
CREATE OR REPLACE FUNCTION public.record_transfer_receipt_count(p_job_id uuid, p_counts jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
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
  IF v_role NOT IN ('receiver','store_manager','warehouse_manager','inventory_manager','regional_operations_manager','country_operations_director','group_ceo','group_ceo','country_managing_director','store_manager','regional_supply_chain_manager','replenishment_planner','inventory_specialist','dispatch_supervisor','regional_logistics_manager','country_supply_chain_director') THEN
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
$function$
;
CREATE OR REPLACE FUNCTION public.get_transfer_receipt_verification(p_job_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
AS $function$
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
  IF v_role NOT IN ('receiver','store_manager','warehouse_manager','inventory_manager','regional_operations_manager','country_operations_director','group_ceo','group_ceo','country_managing_director','store_manager','regional_supply_chain_manager','replenishment_planner','inventory_specialist','dispatch_supervisor','regional_logistics_manager','country_supply_chain_director') THEN
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
$function$
;

