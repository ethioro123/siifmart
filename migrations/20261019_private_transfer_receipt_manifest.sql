-- Keep arrival quantities out of public WMS/transport JSON while retaining a
-- trusted comparison point for blind destination receipt counts.
CREATE TABLE IF NOT EXISTS private.transfer_receipt_manifests (
  job_id uuid PRIMARY KEY REFERENCES public.wms_jobs(id) ON DELETE CASCADE,
  items jsonb NOT NULL CHECK (jsonb_typeof(items) = 'array'),
  site_id uuid NOT NULL REFERENCES public.sites(id),
  country_code text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.transfer_receipt_manifests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.transfer_receipt_manifests FROM PUBLIC, anon, authenticated;
GRANT ALL ON private.transfer_receipt_manifests TO service_role;

CREATE OR REPLACE FUNCTION private.strip_transfer_quantities(p_items jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT CASE WHEN jsonb_typeof(p_items) = 'array' THEN coalesce(jsonb_agg(
    item.value - ARRAY['quantity','qty','expectedQty','expected_qty','requestedQty','requested_qty',
      'requestedMeasureQty','requested_measure_qty','orderedQty','ordered_qty','shippedQty','shipped_qty',
      'dispatchedQty','dispatched_qty','packedQty','packed_qty','pickedQty','picked_qty','deliveredQty',
      'delivered_qty','undeliveredQty','undelivered_qty','receivedQty','received_qty']
    ORDER BY item.ordinality), '[]'::jsonb) ELSE p_items END
  FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p_items) = 'array' THEN p_items ELSE '[]'::jsonb END)
    WITH ORDINALITY AS item(value, ordinality)
$$;
REVOKE ALL ON FUNCTION private.strip_transfer_quantities(jsonb) FROM PUBLIC, anon, authenticated;

-- Preserve currently arrived manifests before removing their public quantities.
INSERT INTO private.transfer_receipt_manifests(job_id, items, site_id, country_code)
SELECT parent.id, child.line_items, parent.dest_site_id, upper(parent.country_code)
FROM public.wms_jobs child
JOIN public.wms_jobs parent ON parent.type = 'TRANSFER'
  AND parent.country_code = child.country_code
  AND coalesce(parent.source_site_id,parent.site_id) = coalesce(child.source_site_id,child.site_id)
  AND parent.dest_site_id IS NOT DISTINCT FROM child.dest_site_id
  AND (parent.id::text = child.order_ref OR parent.job_number = child.order_ref OR parent.order_ref = child.order_ref)
WHERE child.type IN ('DISPATCH','DRIVER')
  AND child.transfer_status IN ('Delivered','Partially Delivered')
  AND parent.transfer_status IN ('Delivered','Partially Delivered')
  AND jsonb_typeof(child.line_items) = 'array'
ON CONFLICT (job_id) DO NOTHING;

CREATE OR REPLACE FUNCTION private.capture_and_strip_transfer_arrival()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  parent_id uuid;
BEGIN
  IF OLD.type NOT IN ('DISPATCH','DRIVER') OR NEW.transfer_status IS NOT DISTINCT FROM OLD.transfer_status
     OR NEW.transfer_status NOT IN ('Delivered','Partially Delivered') THEN RETURN NEW; END IF;
  SELECT p.id INTO parent_id FROM public.wms_jobs p
   WHERE p.type = 'TRANSFER' AND p.country_code = NEW.country_code
     AND coalesce(p.source_site_id,p.site_id) = coalesce(NEW.source_site_id,NEW.site_id)
     AND p.dest_site_id IS NOT DISTINCT FROM NEW.dest_site_id
     AND (p.id::text = NEW.order_ref OR p.job_number = NEW.order_ref OR p.order_ref = NEW.order_ref)
   ORDER BY (p.id::text = NEW.order_ref) DESC LIMIT 1;
  IF parent_id IS NULL THEN RAISE EXCEPTION 'Arrived shipment has no linked transfer manifest'; END IF;
  INSERT INTO private.transfer_receipt_manifests(job_id,items,site_id,country_code,captured_at)
  VALUES (parent_id,NEW.line_items,NEW.dest_site_id,upper(NEW.country_code),now())
  ON CONFLICT (job_id) DO UPDATE SET items=EXCLUDED.items,site_id=EXCLUDED.site_id,
    country_code=EXCLUDED.country_code,captured_at=EXCLUDED.captured_at;
  NEW.line_items := private.strip_transfer_quantities(NEW.line_items);
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.capture_and_strip_transfer_arrival() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS zz_capture_and_strip_transfer_arrival ON public.wms_jobs;
CREATE TRIGGER zz_capture_and_strip_transfer_arrival
  BEFORE UPDATE ON public.wms_jobs FOR EACH ROW
  EXECUTE FUNCTION private.capture_and_strip_transfer_arrival();

CREATE OR REPLACE FUNCTION private.strip_arrived_transfer_mirrors()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF OLD.type NOT IN ('DISPATCH','DRIVER') OR NEW.transfer_status IS NOT DISTINCT FROM OLD.transfer_status
     OR NEW.transfer_status NOT IN ('Delivered','Partially Delivered') THEN RETURN NEW; END IF;
  UPDATE public.wms_jobs p SET line_items=private.strip_transfer_quantities(p.line_items)
   WHERE p.type='TRANSFER' AND p.country_code=NEW.country_code
     AND coalesce(p.source_site_id,p.site_id)=coalesce(NEW.source_site_id,NEW.site_id)
     AND p.dest_site_id IS NOT DISTINCT FROM NEW.dest_site_id
     AND (p.id::text=NEW.order_ref OR p.job_number=NEW.order_ref OR p.order_ref=NEW.order_ref)
     AND p.transfer_status IN ('Delivered','Partially Delivered');
  UPDATE public.transfers t SET items=private.strip_transfer_quantities(t.items)
   WHERE t.country_code=NEW.country_code AND t.source_site_id=coalesce(NEW.source_site_id,NEW.site_id)
     AND t.dest_site_id IS NOT DISTINCT FROM NEW.dest_site_id
     AND (t.id::text=NEW.order_ref OR t.id::text=NEW.id::text OR t.order_ref=NEW.order_ref)
     AND t.transfer_status IN ('Delivered','Partially Delivered');
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.strip_arrived_transfer_mirrors() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS zz_strip_arrived_transfer_mirrors ON public.wms_jobs;
CREATE TRIGGER zz_strip_arrived_transfer_mirrors
  AFTER UPDATE ON public.wms_jobs FOR EACH ROW
  EXECUTE FUNCTION private.strip_arrived_transfer_mirrors();

-- Existing tamper protection blocks ordinary workers from changing a manifest.
-- Permit this one-way scrub only for arrived transfer rows and only when every
-- other field is unchanged. The local flag is used only by this migration's
-- historical backfill; nested trigger calls use the trigger-depth check.
CREATE OR REPLACE FUNCTION public.enforce_wms_job_update_restrictions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'pg_catalog','public','pg_temp' AS $function$
DECLARE
  old_item jsonb; new_item jsonb; old_sku text; new_sku text;
  old_exp numeric; new_exp numeric; i int; old_count int; new_count int;
  is_private_scrub boolean := current_setting('siifmart.private_transfer_manifest_scrub',true)='on';
BEGIN
  IF OLD.type='TRANSFER' AND NEW.transfer_status IN ('Delivered','Partially Delivered')
     AND NEW.line_items IS DISTINCT FROM OLD.line_items
     AND NEW.line_items=private.strip_transfer_quantities(OLD.line_items)
     AND (to_jsonb(NEW)-'line_items'-'updated_at')=(to_jsonb(OLD)-'line_items'-'updated_at')
     AND (pg_trigger_depth()>1 OR is_private_scrub) THEN
    NEW.updated_at:=now(); RETURN NEW;
  END IF;
  IF public.is_ceo() OR public.is_manager() OR (
    lower(public.get_my_role()) IN ('dispatcher','regional_logistics_lead')
    AND upper(OLD.country_code)=upper(public.get_my_country_code())
    AND public.is_site_in_my_authorized_scope(coalesce(OLD.source_site_id,OLD.site_id)::text,OLD.country_code)
    AND (OLD.type IN ('DISPATCH','DRIVER') OR (OLD.type='TRANSFER' AND pg_trigger_depth()>1))
  ) THEN NEW.updated_at:=now(); RETURN NEW; END IF;
  IF NEW.site_id::text IS DISTINCT FROM OLD.site_id::text THEN RAISE EXCEPTION 'Zero-Trust Security Violation: Floor workers cannot reassign the facility site_id of a job.'; END IF;
  IF NEW.country_code::text IS DISTINCT FROM OLD.country_code::text THEN RAISE EXCEPTION 'Zero-Trust Security Violation: Floor workers cannot alter the country_code of a job.'; END IF;
  IF NEW.order_ref::text IS DISTINCT FROM OLD.order_ref::text THEN RAISE EXCEPTION 'Zero-Trust Security Violation: Floor workers cannot alter the order reference of a job.'; END IF;
  IF OLD.assigned_to IS NOT NULL AND OLD.assigned_to::text<>'' AND NEW.assigned_to::text IS DISTINCT FROM OLD.assigned_to::text THEN
    RAISE EXCEPTION 'Zero-Trust Security Violation: Only supervisors and dispatchers can reassign active jobs.';
  END IF;
  IF OLD.line_items IS NOT NULL AND jsonb_typeof(OLD.line_items)='array' THEN
    old_count:=jsonb_array_length(OLD.line_items); new_count:=coalesce(jsonb_array_length(NEW.line_items),0);
    IF new_count<old_count THEN RAISE EXCEPTION 'Zero-Trust Security Violation: Workers cannot delete line items from a job manifest.'; END IF;
    IF old_count>0 THEN
      FOR i IN 0..(old_count-1) LOOP
        old_item:=OLD.line_items->i; new_item:=NEW.line_items->i;
        old_sku:=coalesce(old_item->>'sku',old_item->>'productId',''); new_sku:=coalesce(new_item->>'sku',new_item->>'productId','');
        IF old_sku<>'' AND new_sku<>'' AND old_sku=new_sku THEN
          old_exp:=coalesce((old_item->>'expectedQty')::numeric,(old_item->>'expected_qty')::numeric,(old_item->>'orderedQty')::numeric,0);
          new_exp:=coalesce((new_item->>'expectedQty')::numeric,(new_item->>'expected_qty')::numeric,(new_item->>'orderedQty')::numeric,0);
          IF old_exp>0 AND new_exp<>old_exp THEN RAISE EXCEPTION 'Zero-Trust Security Violation: Workers cannot modify expected quantity (SKU: %, Expected: %, Attempted: %). Discrepancies must be recorded as Short/Discrepancy.',old_sku,old_exp,new_exp; END IF;
        END IF;
      END LOOP;
    END IF;
  END IF;
  NEW.updated_at:=now(); RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.enforce_wms_job_update_restrictions() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.enforce_wms_job_update_restrictions() TO authenticated;

-- Backfill already-arrived rows. Keep line identity, labels, pack metadata and
-- actual destination counts; remove only manifest quantity fields.
DO $backfill$
BEGIN
  ALTER TABLE public.wms_jobs DISABLE TRIGGER USER;
  ALTER TABLE public.transfers DISABLE TRIGGER USER;
  BEGIN
    PERFORM set_config('siifmart.private_transfer_manifest_scrub','on',true);
    UPDATE public.wms_jobs j SET line_items=private.strip_transfer_quantities(j.line_items)
     WHERE j.type='TRANSFER' AND j.transfer_status IN ('Delivered','Partially Delivered')
       AND j.line_items IS DISTINCT FROM private.strip_transfer_quantities(j.line_items)
       AND EXISTS (SELECT 1 FROM private.transfer_receipt_manifests m WHERE m.job_id=j.id);
    UPDATE public.wms_jobs j SET line_items=private.strip_transfer_quantities(j.line_items)
     WHERE j.type IN ('DISPATCH','DRIVER') AND j.transfer_status IN ('Delivered','Partially Delivered')
       AND j.line_items IS DISTINCT FROM private.strip_transfer_quantities(j.line_items)
       AND EXISTS (SELECT 1 FROM private.transfer_receipt_manifests m JOIN public.wms_jobs p ON p.id=m.job_id
         WHERE p.country_code=j.country_code AND coalesce(p.source_site_id,p.site_id)=coalesce(j.source_site_id,j.site_id)
           AND p.dest_site_id IS NOT DISTINCT FROM j.dest_site_id
           AND (p.id::text=j.order_ref OR p.job_number=j.order_ref OR p.order_ref=j.order_ref));
    UPDATE public.transfers t SET items=private.strip_transfer_quantities(t.items)
     WHERE t.transfer_status IN ('Delivered','Partially Delivered')
       AND t.items IS DISTINCT FROM private.strip_transfer_quantities(t.items)
       AND EXISTS (SELECT 1 FROM private.transfer_receipt_manifests m JOIN public.wms_jobs p ON p.id=m.job_id
         WHERE p.country_code=t.country_code AND p.source_site_id=t.source_site_id
           AND p.dest_site_id IS NOT DISTINCT FROM t.dest_site_id
           AND (t.id=p.id OR t.id::text=p.order_ref OR t.order_ref=p.order_ref));
    PERFORM set_config('siifmart.private_transfer_manifest_scrub','off',true);
  EXCEPTION WHEN OTHERS THEN
    PERFORM set_config('siifmart.private_transfer_manifest_scrub','off',true);
    ALTER TABLE public.wms_jobs ENABLE TRIGGER USER;
    ALTER TABLE public.transfers ENABLE TRIGGER USER;
    RAISE;
  END;
  ALTER TABLE public.wms_jobs ENABLE TRIGGER USER;
  ALTER TABLE public.transfers ENABLE TRIGGER USER;
END;
$backfill$;

CREATE OR REPLACE FUNCTION public.record_transfer_receipt_count(p_job_id uuid, p_counts jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp AS $$
DECLARE
  v_actor_id uuid := public.get_my_employee_id();
  v_role text := lower(coalesce(public.get_my_role(), ''));
  v_job public.wms_jobs%ROWTYPE;
  v_manifest jsonb;
  v_check public.transfer_receipt_verifications%ROWTYPE;
  v_actor public.employees%ROWTYPE;
  v_expected numeric;
  v_received numeric;
  v_first_received numeric;
  v_index integer := 0;
  v_has_variance boolean := false;
  v_first_variance boolean := false;
  v_status text;
  v_expected_count integer;
BEGIN
  IF auth.uid() IS NULL OR v_actor_id IS NULL THEN RAISE EXCEPTION 'Authenticated employee required'; END IF;
  IF v_role NOT IN ('receiver','store_manager','warehouse_manager','inventory_manager','regional_manager','operations_manager','super_admin','ceo') THEN
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
  END IF;
  IF v_check.status='awaiting_first_count' AND v_check.first_counter_id IS DISTINCT FROM v_actor_id THEN RAISE EXCEPTION 'The employee who started the count must finish it';
  ELSIF v_check.status='awaiting_recount' AND v_check.first_counter_id=v_actor_id THEN RAISE EXCEPTION 'A different authenticated destination employee must recount this transfer';
  ELSIF v_check.status='verified' THEN RAISE EXCEPTION 'Transfer receipt verification is already complete'; END IF;
  FOR v_expected,v_received IN
    SELECT coalesce(nullif(coalesce(m.item->>'deliveredQty',m.item->>'requestedMeasureQty',m.item->>'dispatchedQty',m.item->>'shippedQty',m.item->>'packedQty',m.item->>'pickedQty',m.item->>'expectedQty',m.item->>'quantity'),'')::numeric,0),
      coalesce(nullif(c.item->>'receivedQty','')::numeric,-1)
    FROM jsonb_array_elements(v_manifest) WITH ORDINALITY m(item,ordinality)
    JOIN jsonb_array_elements(p_counts) WITH ORDINALITY c(item,ordinality) USING (ordinality) ORDER BY m.ordinality
  LOOP
    IF v_received<0 OR v_received>100000000 THEN RAISE EXCEPTION 'Enter a valid non-negative received quantity'; END IF;
    IF coalesce(p_counts->v_index->>'index',v_index::text)::integer<>v_index THEN RAISE EXCEPTION 'Count list order is invalid'; END IF;
    IF coalesce(p_counts->v_index->>'productId','')<>coalesce(v_manifest->v_index->>'productId',v_manifest->v_index->>'product_id',v_manifest->v_index->>'id','') THEN RAISE EXCEPTION 'Counted product does not match the transfer manifest'; END IF;
    IF coalesce(p_counts->v_index->>'condition','Good') NOT IN ('Good','Damaged','Short') THEN RAISE EXCEPTION 'Invalid received condition'; END IF;
    v_has_variance:=v_has_variance OR v_received IS DISTINCT FROM v_expected OR coalesce(p_counts->v_index->>'condition','Good')<>'Good';
    IF v_check.status='awaiting_recount' THEN
      v_first_received:=coalesce(nullif(v_check.first_counts->v_index->>'receivedQty','')::numeric,-1);
      v_first_variance:=v_first_variance OR v_received IS DISTINCT FROM v_first_received OR coalesce(p_counts->v_index->>'condition','Good') IS DISTINCT FROM coalesce(v_check.first_counts->v_index->>'condition','Good');
    END IF;
    v_index:=v_index+1;
  END LOOP;
  IF v_check.status='awaiting_first_count' THEN
    IF v_has_variance THEN
      v_status:='awaiting_recount';
      UPDATE public.transfer_receipt_verifications SET status=v_status,first_counts=p_counts,first_counter_id=v_actor_id,first_counted_at=now(),has_discrepancy=true,updated_at=now() WHERE job_id=p_job_id;
    ELSE
      v_status:='verified';
      UPDATE public.transfer_receipt_verifications SET status=v_status,first_counts=p_counts,first_counter_id=v_actor_id,first_counted_at=now(),final_counts=p_counts,has_discrepancy=false,updated_at=now() WHERE job_id=p_job_id;
    END IF;
  ELSE
    v_status:='verified';
    UPDATE public.transfer_receipt_verifications SET status=v_status,second_counts=p_counts,second_counter_id=v_actor_id,second_counted_at=now(),final_counts=p_counts,has_discrepancy=v_has_variance OR v_first_variance,updated_at=now() WHERE job_id=p_job_id;
  END IF;
  RETURN jsonb_build_object('status',v_status,'canCount',false,
    'hasDiscrepancy',CASE WHEN v_check.status='awaiting_recount' THEN v_has_variance OR v_first_variance ELSE v_has_variance END,
    'counterId',v_actor_id,'items',p_counts);
END;
$$;
REVOKE ALL ON FUNCTION public.record_transfer_receipt_count(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_transfer_receipt_count(uuid,jsonb) TO authenticated;
