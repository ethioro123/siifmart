-- Migration: 20261105_sync_putaway_job_numbers_to_po.sql
-- Description: Sync WMS PUTAWAY job numbers with parent Purchase Order numbers (e.g. AAAA0033),
--              update historical stock movement reasons to display the authentic PO job number
--              instead of arbitrary hex prefixes (e.g. 621F15), and maintain consistent resolution in putaway functions.

BEGIN;

-- 1. Sync job_number for PUTAWAY jobs linked to a Purchase Order
WITH po_mapping AS (
    SELECT id, po_number
    FROM public.purchase_orders
    WHERE po_number IS NOT NULL AND btrim(po_number) <> ''
)
UPDATE public.wms_jobs AS job
SET job_number = pom.po_number
FROM po_mapping pom
WHERE (job.order_ref = pom.id::text OR job.order_ref = pom.po_number)
  AND job.type = 'PUTAWAY'
  AND (job.job_number IS NULL OR job.job_number <> pom.po_number);

-- 2. Update historical stock movement reasons to reflect the canonical putaway job number
UPDATE public.stock_movements sm
SET reason = 'Putaway job ' || j.job_number || ' line ' || greatest(1, ((regexp_match(sm.reason, 'line\s+(\d+)'))[1]::integer)) || ' to ' || (regexp_match(sm.reason, 'to\s+([A-Z0-9-]+)'))[1]
FROM public.wms_jobs j
WHERE j.type = 'PUTAWAY'
  AND j.job_number IS NOT NULL
  AND (
    sm.reason ILIKE '%' || j.id::text || '%'
    OR sm.reason ILIKE 'Putaway job ' || upper(substr(replace(j.id::text, '-', ''), 1, 6)) || ' %'
    OR (j.id = '621f1556-fd41-480e-af91-bce812a70ae9' AND sm.reason ILIKE 'Putaway job 621F15 %')
    OR (j.id = 'a098fffd-bad6-442d-9e96-36309317ac35' AND sm.reason ILIKE 'Putaway job XTZ8MZ %')
    OR (j.id = 'a611549b-6523-492c-b68b-066e45b09563' AND sm.reason ILIKE 'Putaway job RBOBWN %')
  );

-- 3. Enhance private.place_putaway_stock to prioritize canonical PO numbers and keep job_number synced
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

 -- Resolve canonical job reference: stored job_number -> parent PO number -> clean short slice
 job_ref := coalesce(
   nullif(job.job_number, ''),
   (SELECT p.po_number FROM public.purchase_orders p WHERE (p.id::text=job.order_ref OR p.po_number=job.order_ref) AND p.po_number IS NOT NULL LIMIT 1),
   upper(substr(replace(job.id::text, '-', ''), 1, 6))
 );

 -- Keep job_number synced in wms_jobs if it was previously unset or different
 IF job.job_number IS NULL OR job.job_number = '' OR (job.job_number <> job_ref AND job_ref ~ '^AAAA') THEN
   UPDATE public.wms_jobs SET job_number = job_ref WHERE id = job.id;
 END IF;

 INSERT INTO public.stock_movements(site_id,product_id,product_name,type,quantity,movement_date,performed_by,reason,batch_number)
 VALUES(job.site_id,destination.id,destination.name,'IN',p_quantity,now(),actor.name,'Putaway job '||job_ref||' line '||(p_item_index+1)||' to '||bin_code,destination.batch_number);
 RETURN jsonb_build_object('product_id',destination.id,'job_id',job.id,'item_index',p_item_index,'quantity',p_quantity,'location',bin_code);
END;
$function$;

COMMIT;
