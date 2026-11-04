-- Migration: 20261105_clean_stock_movement_reasons_no_raw_uuid.sql
-- Description: Clean up historical stock movement reasons to remove raw UUIDs and convert 0-indexed line numbers
--              to human-friendly 1-indexed lines, and update placement & reconciliation functions to prevent raw UUID leakage.

-- 1. Backfill historical stock movement reasons to replace raw UUIDs with readable job numbers and 1-indexed lines
UPDATE public.stock_movements sm
SET reason = 'Putaway job ' || coalesce(nullif(j.job_number, ''), upper(substr(replace(j.id::text, '-', ''), 1, 6))) || ' line ' || ((regexp_match(sm.reason, 'line\s+(\d+)'))[1]::integer + 1) || ' to ' || (regexp_match(sm.reason, 'to\s+([A-Z0-9-]+)'))[1]
FROM public.wms_jobs j
WHERE sm.reason ~* '^Putaway job [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
  AND sm.reason ILIKE '%' || j.id::text || '%';

-- 2. Backfill historical Pick job reasons to replace raw UUIDs with readable job numbers and 1-indexed lines
UPDATE public.stock_movements sm
SET reason = 'Pick job ' || coalesce(nullif(j.job_number, ''), upper(substr(replace(j.id::text, '-', ''), 1, 6))) || ' line ' || ((regexp_match(sm.reason, 'line\s+(\d+)'))[1]::integer + 1)
FROM public.wms_jobs j
WHERE sm.reason ~* '^Pick job [0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
  AND sm.reason ILIKE '%' || j.id::text || '%';

-- 3. Backfill historical POS Sale receipt reasons to replace raw UUIDs with short receipt codes
UPDATE public.stock_movements
SET reason = regexp_replace(reason, 'POS-([0-9a-f]{6})[0-9a-f-]{30}', 'POS-\1', 'i')
WHERE reason ~* 'POS Sale — Receipt POS-[0-9a-f]{8}-[0-9a-f]{4}';

-- 4. Update private.finalize_po_from_putaway to accept both readable job numbers and legacy formats
CREATE OR REPLACE FUNCTION private.finalize_po_from_putaway(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE actor public.employees%ROWTYPE; job public.wms_jobs%ROWTYPE; po public.purchase_orders%ROWTYPE;
 item public.po_items%ROWTYPE; placement record; matched uuid; matches integer; qty numeric; audited numeric;
 counts jsonb:='{}'; expected numeric; full_receipt boolean:=true; next_status text; changed boolean:=false;
 job_ref text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 SELECT * INTO job FROM public.wms_jobs WHERE id=p_job_id AND type='PUTAWAY';
 IF actor.id IS NULL OR job.id IS NULL OR job.status<>'Completed'
  OR NOT public.is_site_in_my_authorized_scope(job.site_id::text,job.country_code)
  OR NOT (public.is_manager() OR public.is_ceo() OR (actor.site_id=job.site_id AND job.assigned_to=actor.id::text
    AND job.completed_by=actor.id::text AND EXISTS(SELECT 1 FROM public.job_assignments a WHERE a.job_id=job.id AND a.employee_id=actor.id))) THEN
  RAISE EXCEPTION 'Completed Putaway job requires its assigned worker or scoped supervisor' USING ERRCODE='42501'; END IF;
 SELECT * INTO po FROM public.purchase_orders p WHERE p.id::text=job.order_ref OR p.po_number=job.order_ref FOR UPDATE;
 IF po.id IS NULL THEN RETURN jsonb_build_object('state','not_found'); END IF;
 IF po.site_id IS DISTINCT FROM job.site_id OR upper(po.country_code) IS DISTINCT FROM upper(job.country_code)
  OR NOT public.is_site_in_my_authorized_scope(po.site_id::text,po.country_code) THEN
  RAISE EXCEPTION 'PO and Putaway facility/country must match' USING ERRCODE='42501'; END IF;
 IF po.status NOT IN ('Approved','Partially Received','Received') THEN RETURN jsonb_build_object('state','needs_review','po_id',po.id); END IF;
 PERFORM 1 FROM public.wms_jobs j WHERE j.type='PUTAWAY' AND j.order_ref IN (po.id::text,po.po_number) ORDER BY j.id FOR SHARE;
 IF EXISTS(SELECT 1 FROM public.wms_jobs j WHERE j.type='PUTAWAY' AND j.order_ref IN (po.id::text,po.po_number)
   AND (j.site_id IS DISTINCT FROM po.site_id OR upper(j.country_code) IS DISTINCT FROM upper(po.country_code))) THEN
  RAISE EXCEPTION 'Related Putaway jobs have inconsistent facility scope' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.wms_jobs j WHERE j.type='PUTAWAY' AND j.order_ref IN (po.id::text,po.po_number) AND j.status NOT IN ('Completed','Cancelled')) THEN
  RETURN jsonb_build_object('state','awaiting_putaway','po_id',po.id); END IF;
 IF NOT EXISTS(SELECT 1 FROM public.wms_jobs r WHERE r.type='RECEIVE' AND r.status='Completed'
  AND r.site_id=po.site_id AND upper(r.country_code)=upper(po.country_code) AND r.order_ref IN (po.id::text,po.po_number)) THEN
  RETURN jsonb_build_object('state','needs_review','po_id',po.id); END IF;
 IF NOT EXISTS(SELECT 1 FROM public.po_items WHERE po_id=po.id) THEN RETURN jsonb_build_object('state','needs_review','po_id',po.id); END IF;
 FOR placement IN SELECT j.id,j.site_id,j.job_number,line.value AS line,line.ordinality-1 AS item_index
  FROM public.wms_jobs j CROSS JOIN LATERAL jsonb_array_elements(j.line_items) WITH ORDINALITY line
  WHERE j.type='PUTAWAY' AND j.status='Completed' AND j.order_ref IN (po.id::text,po.po_number) LOOP
  IF coalesce(placement.line->>'condition','Good')<>'Good' OR coalesce(placement.line->>'status','Pending') NOT IN ('Picked','Completed','Short') THEN
   RETURN jsonb_build_object('state','needs_review','po_id',po.id); END IF;
  SELECT count(*),(array_agg(i.id))[1] INTO matches,matched FROM public.po_items i WHERE i.po_id=po.id AND i.sku=placement.line->>'sku';
  IF matches<>1 THEN RETURN jsonb_build_object('state','needs_review','po_id',po.id); END IF;
  qty:=coalesce((placement.line->>'pickedQty')::numeric,0);
  IF qty::text IN ('NaN','Infinity','-Infinity') OR qty<0 THEN RAISE EXCEPTION 'Invalid physical placement quantity'; END IF;
  IF qty>0 THEN
   job_ref := coalesce(nullif(placement.job_number, ''), upper(substr(replace(placement.id::text, '-', ''), 1, 6)));
   SELECT sum(m.quantity) INTO audited FROM public.stock_movements m JOIN public.products p ON p.id=m.product_id
    WHERE m.site_id=po.site_id AND m.type='IN' AND p.site_id=po.site_id AND p.sku=placement.line->>'sku'
     AND (
       m.reason = 'Putaway job '||job_ref||' line '||(placement.item_index+1)||' to '||(placement.line->>'location')
       OR m.reason = 'Putaway job '||placement.id::text||' line '||placement.item_index||' to '||(placement.line->>'location')
       OR m.reason = 'Putaway job '||job_ref||' line '||placement.item_index||' to '||(placement.line->>'location')
     );
   IF audited IS DISTINCT FROM qty THEN RETURN jsonb_build_object('state','needs_review','po_id',po.id); END IF;
  END IF;
  counts:=jsonb_set(counts,ARRAY[matched::text],to_jsonb(coalesce((counts->>matched::text)::numeric,0)+qty),true);
 END LOOP;
 FOR item IN SELECT * FROM public.po_items WHERE po_id=po.id ORDER BY id FOR UPDATE LOOP
  expected:=private.po_expected_sellable_units(item);
  IF expected IS NULL OR expected<=0 THEN RETURN jsonb_build_object('state','needs_review','po_id',po.id); END IF;
  IF coalesce((counts->>item.id::text)::numeric,0)<expected THEN full_receipt:=false; END IF;
 END LOOP;
 UPDATE public.po_items i SET received_qty=greatest(coalesce(i.received_qty,0),coalesce((counts->>i.id::text)::numeric,0))
  WHERE i.po_id=po.id AND coalesce(i.received_qty,0)<coalesce((counts->>i.id::text)::numeric,0);
 changed:=FOUND;
 next_status:=CASE WHEN full_receipt THEN 'Received' ELSE 'Partially Received' END;
 IF po.status IS DISTINCT FROM next_status THEN
  UPDATE public.purchase_orders SET status=next_status,updated_at=now() WHERE id=po.id; changed:=true;
 END IF;
 IF changed THEN
  INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
   VALUES('PO_RECEIPT_RECONCILED','Fulfillment',actor.name,actor.id,po.site_id,po.country_code,'purchase_order',po.id::text,
    jsonb_build_object('jobId',job.id,'status',next_status));
 END IF;
 RETURN jsonb_build_object('state','synced','po_id',po.id,'po_number',po.po_number,'status',next_status,'changed',changed);
END;
$function$;

-- 5. Update private.place_putaway_stock to record clean readable job references
CREATE OR REPLACE FUNCTION private.place_putaway_stock(p_job_id uuid, p_item_index integer, p_quantity numeric, p_location text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE actor public.employees%ROWTYPE; job public.wms_jobs%ROWTYPE;
 source public.products%ROWTYPE; destination public.products%ROWTYPE;
 line jsonb; expected numeric; item_sku text; bin_code text := upper(btrim(p_location)); country text;
 next_line jsonb; manager boolean; job_ref text;
 target_zone public.warehouse_zones%ROWTYPE; zone_count integer; used numeric; required_storage text; actual_storage text;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authenticated warehouse employee required' USING ERRCODE='42501'; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 IF actor.id IS NULL THEN RAISE EXCEPTION 'Active warehouse employee required' USING ERRCODE='42501'; END IF;
 SELECT * INTO job FROM public.wms_jobs WHERE id=p_job_id FOR UPDATE;
 IF job.id IS NULL OR job.type<>'PUTAWAY' OR job.status NOT IN ('Pending','In-Progress') THEN
  RAISE EXCEPTION 'Active PUTAWAY job required'; END IF;
 SELECT upper(s.country) INTO country FROM public.sites s WHERE s.id=job.site_id AND s.type IN ('Warehouse','Distribution Center');
 manager := actor.role IN ('group_ceo','warehouse_manager','country_operations_director','country_managing_director');
 IF NOT manager AND actor.role NOT IN ('picker','packer','receiver','receiving_operator','putaway_operator','replenishment_operator','inventory_controller','stock_counter','dispatch_operator','returns_operator','fleet_mechanic','inventory_specialist','forklift_operator','stock_clerk','inbound_qc_inspector','returns_clerk','driver') THEN
  RAISE EXCEPTION 'Warehouse floor role required' USING ERRCODE='42501'; END IF;
 IF country IS NULL OR country IS DISTINCT FROM upper(job.country_code)
  OR NOT public.is_site_in_my_authorized_scope(job.site_id::text,country)
  OR (actor.role<>'group_ceo' AND (actor.site_id IS DISTINCT FROM job.site_id OR country IS DISTINCT FROM public.get_my_country_code_strict()))
  OR (NOT manager AND (job.assigned_to IS DISTINCT FROM actor.id::text OR NOT EXISTS
    (SELECT 1 FROM public.job_assignments a WHERE a.job_id=job.id AND a.employee_id=actor.id))) THEN
  RAISE EXCEPTION 'Putaway requires the assigned worker at this facility' USING ERRCODE='42501'; END IF;
 IF p_item_index IS NULL OR p_item_index<0 OR p_item_index>=jsonb_array_length(job.line_items) THEN RAISE EXCEPTION 'Invalid job line'; END IF;
 line:=job.line_items->p_item_index;
 IF coalesce(line->>'status','Pending') IN ('Picked','Completed','Short') THEN RAISE EXCEPTION 'Placement already recorded; refresh the job'; END IF;
 expected:=coalesce((line->>'expectedQty')::numeric,0); item_sku:=nullif(btrim(line->>'sku'),'');
 IF item_sku IS NULL OR p_quantity IS NULL OR p_quantity::text IN ('NaN','Infinity','-Infinity') OR p_quantity<=0 OR p_quantity>expected THEN RAISE EXCEPTION 'Invalid physical placement quantity'; END IF;
 IF bin_code IS NULL OR bin_code !~ '^[A-Z]-[0-9]{2}-[0-9]{2}$' OR bin_code ~ '-00' THEN RAISE EXCEPTION 'Scan a valid storage bin'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(job.site_id::text||':'||item_sku||':'||bin_code,0));
 IF coalesce(line->>'condition','Good') <> 'Good' THEN RAISE EXCEPTION 'Hold damaged or rejected goods for supervised resolution before putaway'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('putaway-capacity:'||job.site_id::text,0));
 SELECT p.* INTO source FROM public.products p WHERE p.site_id=job.site_id AND p.sku=item_sku
 ORDER BY (p.id::text=coalesce(line->>'productId','')) DESC,(coalesce(p.stock,0)=0 AND p.location='On Order') DESC,p.id LIMIT 1 FOR UPDATE;
 IF source.id IS NULL THEN RAISE EXCEPTION 'Receiving product is missing at this facility'; END IF;

 required_storage:=lower(coalesce(nullif(source.custom_attributes#>>'{storage,type}',''),source.category,''));
 required_storage:=CASE WHEN required_storage ~ 'froz|freez' THEN 'frozen' WHEN required_storage ~ 'chill|cold|refriger' THEN 'chilled' ELSE 'ambient' END;
 IF coalesce(nullif(line->>'expiryDate','')::date,source.expiry_date)<current_date OR lower(source.status) IN ('quarantined','damaged','expired') THEN
  RAISE EXCEPTION 'Hold expired or unavailable goods for supervised resolution'; END IF;
 SELECT count(*) INTO zone_count FROM public.warehouse_zones z WHERE z.site_id=job.site_id
 AND (upper(btrim(z.name)) ~ ('^(ZONE[[:space:]]+)?'||left(bin_code,1)||'($|[[:space:]-])')
 OR EXISTS(SELECT 1 FROM public.products p WHERE p.site_id=job.site_id AND p.zone_id=z.id AND upper(p.location) LIKE left(bin_code,1)||'-%'));
 IF zone_count>1 THEN RAISE EXCEPTION 'Storage zone mapping is ambiguous'; END IF;
 SELECT z.* INTO target_zone FROM public.warehouse_zones z WHERE z.site_id=job.site_id
 AND (upper(btrim(z.name)) ~ ('^(ZONE[[:space:]]+)?'||left(bin_code,1)||'($|[[:space:]-])')
 OR EXISTS(SELECT 1 FROM public.products p WHERE p.site_id=job.site_id AND p.zone_id=z.id AND upper(p.location) LIKE left(bin_code,1)||'-%')) FOR UPDATE;
 IF target_zone.id IS NULL THEN
  IF required_storage<>'ambient' OR EXISTS(SELECT 1 FROM public.warehouse_zones z WHERE z.site_id=job.site_id) THEN
   RAISE EXCEPTION 'Configure a compatible storage zone for this bin'; END IF;
 ELSE
  IF coalesce(target_zone.is_locked,false) OR target_zone.allow_putaway=false OR lower(target_zone.type) IN ('staging','damaged','secure') THEN
   RAISE EXCEPTION 'This zone is locked or unavailable for putaway'; END IF;
  actual_storage:=lower(coalesce(nullif(target_zone.temperature,''),target_zone.type,''));
  actual_storage:=CASE WHEN actual_storage ~ 'froz|freez' THEN 'frozen' WHEN actual_storage ~ 'chill|cold|refriger' THEN 'chilled' ELSE 'ambient' END;
  IF actual_storage<>required_storage THEN RAISE EXCEPTION 'Product storage requirement does not match the zone'; END IF;
  SELECT greatest(coalesce(target_zone.occupied,0),coalesce(sum(greatest(p.stock,0)),0)) INTO used FROM public.products p
   WHERE p.site_id=job.site_id AND (p.zone_id=target_zone.id OR upper(p.location) LIKE left(bin_code,1)||'-%');
  IF target_zone.capacity>0 AND used+p_quantity>target_zone.capacity THEN RAISE EXCEPTION 'Storage zone capacity would be exceeded'; END IF;
 END IF;

 SELECT p.* INTO destination FROM public.products p WHERE p.site_id=job.site_id AND p.sku=item_sku AND p.location=bin_code
 ORDER BY p.id LIMIT 1 FOR UPDATE;
 IF destination.id IS NOT NULL THEN
  IF coalesce(destination.stock,0)>0 AND (
    destination.batch_number IS DISTINCT FROM coalesce(nullif(line->>'batchNumber',''),source.batch_number)
    OR destination.expiry_date IS DISTINCT FROM coalesce(nullif(line->>'expiryDate','')::date,source.expiry_date)
  ) THEN
   RAISE EXCEPTION 'The bin contains this SKU with a different batch or expiry. Scan another bin.'
     USING ERRCODE='P0001', DETAIL='PUTAWAY_BIN_LOT_CONFLICT';
  END IF;
  UPDATE public.products SET stock=coalesce(stock,0)+p_quantity,status='active',
    batch_number=coalesce(nullif(line->>'batchNumber',''),source.batch_number),
    expiry_date=coalesce(nullif(line->>'expiryDate','')::date,source.expiry_date)
  WHERE id=destination.id RETURNING * INTO destination;
 ELSIF coalesce(source.stock,0)=0 AND source.location IN ('On Order','Receiving Dock','Pending Putaway') THEN
  UPDATE public.products SET location=bin_code,stock=p_quantity,status='active',
    batch_number=coalesce(nullif(line->>'batchNumber',''),source.batch_number),
    expiry_date=coalesce(nullif(line->>'expiryDate','')::date,source.expiry_date)
  WHERE id=source.id RETURNING * INTO destination;
 ELSE
  INSERT INTO public.products SELECT (jsonb_populate_record(NULL::public.products,to_jsonb(source)||jsonb_build_object(
    'id',gen_random_uuid(),'location',bin_code,'stock',p_quantity,'status','active','created_at',now(),'updated_at',now(),
    'batch_number',coalesce(nullif(line->>'batchNumber',''),source.batch_number),
    'expiry_date',coalesce(nullif(line->>'expiryDate','')::date,source.expiry_date)))).* RETURNING * INTO destination;
 END IF;
 IF destination.site_id IS DISTINCT FROM job.site_id OR destination.location IS DISTINCT FROM bin_code THEN
  RAISE EXCEPTION 'Placement location was changed before confirmation';
 END IF;
 IF target_zone.id IS NOT NULL THEN UPDATE public.products SET zone_id=target_zone.id WHERE id=destination.id; END IF;
 next_line:=line||jsonb_build_object('status',CASE WHEN p_quantity<expected THEN 'Short' ELSE 'Picked' END,
   'pickedQty',p_quantity,'location',bin_code);
 UPDATE public.wms_jobs SET line_items=jsonb_set(line_items,ARRAY[p_item_index::text],next_line),status='In-Progress' WHERE id=job.id;
 job_ref := coalesce(nullif(job.job_number, ''), upper(substr(replace(job.id::text, '-', ''), 1, 6)));
 INSERT INTO public.stock_movements(site_id,product_id,product_name,type,quantity,movement_date,performed_by,reason,batch_number)
 VALUES(job.site_id,destination.id,destination.name,'IN',p_quantity,now(),actor.name,'Putaway job '||job_ref||' line '||(p_item_index+1)||' to '||bin_code,destination.batch_number);
 RETURN jsonb_build_object('product_id',destination.id,'job_id',job.id,'item_index',p_item_index,'quantity',p_quantity,'location',bin_code);
END;
$function$;
