-- Require exact physical packing counts and preserve original lot evidence.
CREATE OR REPLACE FUNCTION private.guard_floor_discrepancy() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE line jsonb; idx integer:=0; actor uuid:=public.get_my_employee_id();
BEGIN
 IF TG_OP='DELETE' THEN
  IF EXISTS(SELECT 1 FROM private.floor_discrepancies WHERE job_id=OLD.id) THEN RAISE EXCEPTION 'Retain discrepancy evidence; jobs with reports cannot be deleted'; END IF;
  RETURN OLD;
 END IF;
 IF NEW.type IN ('DISPATCH','DRIVER','TRANSFER') THEN
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('floor-discrepancy:'||NEW.country_code||':'||coalesce(NEW.source_site_id,NEW.site_id)::text||':'||coalesce(NEW.order_ref,NEW.id::text),0));
  IF EXISTS(SELECT 1 FROM private.floor_discrepancies d JOIN public.wms_jobs j ON j.id=d.job_id
    WHERE d.resolved_at IS NULL AND d.country_code=NEW.country_code AND d.site_id=coalesce(NEW.source_site_id,NEW.site_id)
    AND (j.order_ref=NEW.order_ref OR j.order_ref=NEW.id::text)) THEN
   RAISE EXCEPTION 'Resolve the Pick/Pack discrepancy before downstream handoff'; END IF;
 END IF;
 IF TG_OP='INSERT' THEN RETURN NEW; END IF;
 IF EXISTS(SELECT 1 FROM private.floor_discrepancies WHERE job_id=OLD.id AND resolved_at IS NULL) THEN
  IF NEW.line_items IS DISTINCT FROM OLD.line_items OR NEW.status IN ('Completed','Dispatched','Deleted')
   OR NEW.assigned_to IS DISTINCT FROM OLD.assigned_to OR NEW.type IS DISTINCT FROM OLD.type
   OR NEW.site_id IS DISTINCT FROM OLD.site_id OR NEW.country_code IS DISTINCT FROM OLD.country_code OR NEW.order_ref IS DISTINCT FROM OLD.order_ref THEN
   RAISE EXCEPTION 'Job on discrepancy hold: a separate supervisor must reconcile it before work continues'; END IF;
  NEW.has_discrepancy:=true;
 END IF;
 IF OLD.type='PACK' AND (NEW.type IS DISTINCT FROM OLD.type OR NEW.site_id IS DISTINCT FROM OLD.site_id
  OR NEW.country_code IS DISTINCT FROM OLD.country_code OR NEW.order_ref IS DISTINCT FROM OLD.order_ref) THEN
  RAISE EXCEPTION 'Packing stage identity is immutable'; END IF;
 IF OLD.type='PACK' AND (NEW.line_items IS DISTINCT FROM OLD.line_items OR NEW.status='Completed') THEN
  IF jsonb_array_length(NEW.line_items) IS DISTINCT FROM jsonb_array_length(OLD.line_items) THEN RAISE EXCEPTION 'Packing cannot replace the picked manifest'; END IF;
  FOR line IN SELECT value FROM jsonb_array_elements(NEW.line_items) LOOP
   IF line->'expectedQty' IS DISTINCT FROM OLD.line_items->idx->'expectedQty' OR line->'pickedQty' IS DISTINCT FROM OLD.line_items->idx->'pickedQty'
    OR line->'productId' IS DISTINCT FROM OLD.line_items->idx->'productId' OR line->'sku' IS DISTINCT FROM OLD.line_items->idx->'sku' THEN
    RAISE EXCEPTION 'Packing preserves the original picked quantity and product identity'; END IF;
   IF (line->>'packedQty')::numeric<0 OR (line->>'packedQty')::numeric>1000000000
    OR (((line->>'packedQty')::numeric>0 OR (line->>'packed')::boolean IS TRUE OR NEW.status='Completed')
     AND (line->>'packedQty')::numeric IS DISTINCT FROM (line->>'expectedQty')::numeric) THEN
    RAISE EXCEPTION 'Report and reconcile the packing difference; only the exact original quantity can be confirmed'; END IF;
   IF line->'batchNumber' IS DISTINCT FROM OLD.line_items->idx->'batchNumber'
    OR line->'expiryDate' IS DISTINCT FROM OLD.line_items->idx->'expiryDate'
    OR line->'location' IS DISTINCT FROM OLD.line_items->idx->'location' THEN
    RAISE EXCEPTION 'Packing preserves the original source lot and bin'; END IF;
   idx:=idx+1;
  END LOOP;
 END IF;
 IF OLD.type='PICK' AND (NEW.line_items IS DISTINCT FROM OLD.line_items OR NEW.status='Completed') THEN
  FOR line IN SELECT value FROM jsonb_array_elements(NEW.line_items) LOOP
   IF line->>'status' IN ('Short','Completed') AND (line->>'pickedQty')::numeric<(line->>'expectedQty')::numeric
    AND NOT EXISTS(SELECT 1 FROM private.floor_discrepancies d WHERE d.job_id=NEW.id AND d.item_index=idx
     AND d.resolved_at IS NOT NULL AND d.resolution='short_pick' AND d.resolved_qty=(line->>'pickedQty')::numeric
     AND d.expected_qty=(line->>'expectedQty')::numeric AND d.manifest->>'productId' IS NOT DISTINCT FROM line->>'productId') THEN
    RAISE EXCEPTION 'Recount and report this picking shortage, then obtain independent supervisor approval'; END IF;
   idx:=idx+1;
  END LOOP;
 END IF;
 RETURN NEW;
END; $$;
