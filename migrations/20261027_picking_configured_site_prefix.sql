-- Honor the stored facility prefix used by printed labels and the scanner.
-- Existing function ownership, grants, authorization and scan checks are preserved.
CREATE OR REPLACE FUNCTION private.record_pick_line(p_job_id uuid,p_item_index integer,p_quantity numeric,p_location_barcode text,p_item_barcode text,p_shortage_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE; p public.products%ROWTYPE; line jsonb; expected numeric; receipt private.pick_line_receipts%ROWTYPE; site_code text; reason text:=nullif(btrim(p_shortage_reason),'');
BEGIN
 j:=private.authorized_pick(p_job_id);
 IF j.status NOT IN ('Pending','In-Progress') THEN RAISE EXCEPTION 'An active PICK job is required'; END IF;
 IF p_item_index IS NULL OR p_item_index<0 OR p_item_index>=jsonb_array_length(j.line_items) THEN RAISE EXCEPTION 'Invalid picking line'; END IF;
 line:=j.line_items->p_item_index; expected:=(line->>'expectedQty')::numeric;
 IF p_quantity IS NULL OR p_quantity::text IN ('NaN','Infinity','-Infinity') OR expected IS NULL OR expected<=0 OR p_quantity<0 OR p_quantity>expected THEN RAISE EXCEPTION 'Physical quantity must be between zero and the requested quantity'; END IF;
 IF p_quantity<expected AND (reason IS NULL OR length(reason)<3 OR length(reason)>500) THEN RAISE EXCEPTION 'Explain the picking shortage (3–500 characters)'; END IF;
 SELECT * INTO p FROM public.products WHERE id::text=line->>'productId' AND site_id=j.site_id AND sku=line->>'sku' FOR SHARE;
 IF p.id IS NULL OR p.location IS NULL OR p.location !~ '^[A-Z]-[0-9]{2}-[0-9]{2}$'
  OR (nullif(line->>'location','') IS NOT NULL AND line->>'location'<>p.location)
  OR (nullif(line->>'batchNumber','') IS NOT NULL AND line->>'batchNumber' IS DISTINCT FROM p.batch_number)
 THEN RAISE EXCEPTION 'Manifest product or source bin changed; request a supervised correction'; END IF;
 -- Match label generation: configured four-digit prefix takes precedence.
 SELECT CASE WHEN nullif(barcode_prefix,'') IS NULL THEN code
  WHEN length(barcode_prefix)=4 THEN 'SITE-'||barcode_prefix ELSE 'SITE-8888' END
 INTO site_code FROM public.sites WHERE id=j.site_id;
 IF p_location_barcode IS DISTINCT FROM private.pick_location_barcode(site_code,p.location) THEN RAISE EXCEPTION 'Scan the source bin label for this facility'; END IF;
 IF p_quantity>0 AND (p.expiry_date<current_date OR lower(p.status) IN ('quarantined','damaged','expired','inactive')) THEN RAISE EXCEPTION 'Hold expired or unavailable stock for supervisor review'; END IF;
 IF p_quantity>0 AND upper(btrim(coalesce(p_item_barcode,''))) NOT IN (upper(p.sku),upper(coalesce(p.barcode,p.sku))) THEN RAISE EXCEPTION 'Scan the product on this picking line'; END IF;
 IF EXISTS(SELECT 1 FROM public.storefront_orders WHERE pick_job_id=j.id) AND p_quantity<>expected THEN RAISE EXCEPTION 'Online orders require full reserved quantities; ask a supervisor to resolve the order shortage'; END IF;
 SELECT * INTO receipt FROM private.pick_line_receipts WHERE job_id=j.id AND item_index=p_item_index;
 IF receipt.job_id IS NOT NULL THEN
  IF receipt.actor_id=public.get_my_employee_id() AND receipt.quantity=p_quantity AND receipt.product_id=p.id AND receipt.shortage_reason IS NOT DISTINCT FROM reason THEN RETURN to_jsonb(j); END IF;
  RAISE EXCEPTION 'This picking line was already verified; refresh the job';
 END IF;
 INSERT INTO private.pick_line_receipts(job_id,item_index,actor_id,product_id,quantity,source_location,shortage_reason,batch_number,expiry_date)
 VALUES(j.id,p_item_index,public.get_my_employee_id(),p.id,p_quantity,p.location,reason,p.batch_number,p.expiry_date);
 UPDATE public.wms_jobs SET line_items=jsonb_set(line_items,ARRAY[p_item_index::text],line||jsonb_build_object(
  'pickedQty',p_quantity,'status',CASE WHEN p_quantity<expected THEN 'Short' ELSE 'Picked' END,'location',p.location,'shortageReason',reason)),status='In-Progress'
 WHERE id=j.id RETURNING * INTO j;
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('PICK_LINE_VERIFIED','Fulfillment',public.get_my_employee_id(),j.site_id::text,j.country_code,'wms_job',j.id::text,
  jsonb_build_object('line',p_item_index,'productId',p.id,'quantity',p_quantity,'sourceBin',p.location,'shortageReason',reason)::text);
 RETURN to_jsonb(j);
END; $$;

