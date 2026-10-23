-- Preserve the first PICK and cancel only the reported unused duplicate; no physical stock changes.
DO $$
DECLARE duplicate public.wms_jobs%ROWTYPE; canonical public.wms_jobs%ROWTYPE;
BEGIN
 SELECT * INTO canonical FROM public.wms_jobs WHERE id='7e0f10d7-3c4b-431c-bfd0-e75021d7ea7a' AND type='PICK' AND status='Pending' FOR UPDATE;
 SELECT * INTO duplicate FROM public.wms_jobs WHERE id='e7dfed06-d348-4213-9aa1-486b681644fe' AND type='PICK' AND status='Pending' FOR UPDATE;
 IF duplicate.id IS NULL THEN RETURN; END IF;
 IF canonical.id IS NULL OR (canonical.order_ref,canonical.site_id,canonical.country_code,canonical.dest_site_id,canonical.line_items)
  IS DISTINCT FROM (duplicate.order_ref,duplicate.site_id,duplicate.country_code,duplicate.dest_site_id,duplicate.line_items)
  OR nullif(duplicate.assigned_to,'') IS NOT NULL
  OR EXISTS(SELECT 1 FROM public.job_assignments WHERE job_id=duplicate.id)
  OR EXISTS(SELECT 1 FROM public.wms_jobs WHERE order_ref=duplicate.id::text)
  OR EXISTS(SELECT 1 FROM jsonb_array_elements(duplicate.line_items)i WHERE coalesce((i->>'pickedQty')::numeric,0)<>0 OR coalesce(i->>'status','Pending')<>'Pending') THEN
  RAISE EXCEPTION 'Duplicate PICK has changed or has work; supervisor review required'; END IF;
 UPDATE public.wms_jobs SET status='Cancelled',notes=concat_ws(E'\n',notes,'Unused duplicate cancelled; canonical PICK: '||canonical.id::text) WHERE id=duplicate.id;
 INSERT INTO public.system_logs(action,module,user_name,site_id,country_code,entity_type,entity_id,details)
 VALUES('DUPLICATE_PICK_CANCELLED','Fulfillment','Staging repair',duplicate.site_id,duplicate.country_code,'wms_job',duplicate.id::text,jsonb_build_object('canonicalPickId',canonical.id,'transferId',duplicate.order_ref));
END $$;
