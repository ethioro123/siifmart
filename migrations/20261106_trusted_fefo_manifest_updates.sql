CREATE OR REPLACE FUNCTION public.enforce_wms_job_update_restrictions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
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
  -- Only the assigned-worker FEFO planner can replace an unverified manifest.
  IF OLD.type='PICK' AND OLD.status IN('Pending','In-Progress') AND NEW.status=OLD.status
    AND NEW.line_items IS DISTINCT FROM OLD.line_items
    AND NOT EXISTS(SELECT 1 FROM private.pick_line_receipts WHERE job_id=OLD.id)
    AND (to_jsonb(NEW)-ARRAY['line_items','items_count','updated_at']) IS NOT DISTINCT FROM (to_jsonb(OLD)-ARRAY['line_items','items_count','updated_at'])
    AND EXISTS(SELECT 1 FROM private.fefo_pick_plans WHERE job_id=OLD.id AND manifest=NEW.line_items)
  THEN NEW.updated_at:=now(); RETURN NEW; END IF;
  IF public.is_ceo() OR public.is_manager() OR (
    lower(public.get_my_role()) IN ('dispatcher','regional_logistics_manager')
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
$function$
;

