-- Complete verified packing and create an unassigned downstream dispatch atomically.
CREATE TABLE private.pack_handoffs (
 pack_job_id uuid PRIMARY KEY REFERENCES public.wms_jobs(id), dispatch_job_id uuid UNIQUE NOT NULL REFERENCES public.wms_jobs(id),
 verifier_id uuid NOT NULL REFERENCES public.employees(id), initiated_by uuid NOT NULL REFERENCES public.employees(id), created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.pack_handoffs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.pack_handoffs FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.complete_pack_job(p_job_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE; dispatch public.wms_jobs%ROWTYPE; parent public.wms_jobs%ROWTYPE; actor public.employees%ROWTYPE;
 receipt private.pack_handoffs%ROWTYPE; line jsonb; manifest jsonb:='[]'; completed_lines jsonb:='[]'; manager boolean;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=public.get_my_employee_id() AND lower(status)='active';
 SELECT * INTO j FROM public.wms_jobs WHERE id=p_job_id AND type='PACK' FOR UPDATE;
 manager:=actor.role IN('group_ceo','country_managing_director','country_operations_director','warehouse_manager','inventory_manager','regional_operations_manager','regional_supply_chain_manager');
 IF auth.uid() IS NULL OR actor.id IS NULL OR j.id IS NULL OR NOT public.is_site_in_my_authorized_scope(j.site_id::text,j.country_code)
  OR NOT EXISTS(SELECT 1 FROM public.sites WHERE id=j.site_id AND upper(country)=upper(j.country_code) AND type IN('Warehouse','Distribution Center'))
  OR (j.status<>'Completed' AND j.assigned_to IS DISTINCT FROM actor.id::text)
  OR (j.status='Completed' AND j.completed_by IS DISTINCT FROM actor.id::text AND NOT manager) THEN
  RAISE EXCEPTION 'Packing completion requires the assigned verifier; completed handoff recovery requires that verifier or a scoped supervisor' USING ERRCODE='42501'; END IF;
 IF coalesce(j.source_site_id,j.site_id) IS DISTINCT FROM j.site_id OR (j.dest_site_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.sites WHERE id=j.dest_site_id AND upper(country)=upper(j.country_code))) OR j.completed_by=ANY(private.pack_picker_ids(j.site_id,j.country_code,j.order_ref)) THEN RAISE EXCEPTION 'Packing source, destination or independent verification requires reconciliation'; END IF;
 IF j.status NOT IN('Pending','In-Progress','Completed') OR nullif(j.order_ref,'') IS NULL OR coalesce(jsonb_array_length(j.line_items),0)=0 THEN RAISE EXCEPTION 'An active verified packing manifest and source order are required'; END IF;
 IF j.status='Completed' AND (j.completed_by IS DISTINCT FROM j.assigned_to OR NOT EXISTS(SELECT 1 FROM public.employees WHERE id::text=j.completed_by AND site_id=j.site_id)) THEN
  RAISE EXCEPTION 'Completed packing attribution needs supervised reconciliation'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('pack-handoff:'||j.country_code||':'||j.site_id::text||':'||j.order_ref,0));
 IF EXISTS(SELECT 1 FROM private.floor_discrepancies d JOIN public.wms_jobs s ON s.id=d.job_id WHERE d.resolved_at IS NULL AND s.site_id=j.site_id AND s.country_code=j.country_code AND s.order_ref=j.order_ref) THEN
  RAISE EXCEPTION 'Resolve all Pick/Pack discrepancies before handoff'; END IF;
 SELECT * INTO receipt FROM private.pack_handoffs WHERE pack_job_id=j.id;
 IF receipt.pack_job_id IS NOT NULL THEN
  SELECT * INTO dispatch FROM public.wms_jobs WHERE id=receipt.dispatch_job_id;
  RETURN jsonb_build_object('job',to_jsonb(j),'dispatch',to_jsonb(dispatch));
 END IF;
 FOR line IN SELECT value FROM jsonb_array_elements(j.line_items) LOOP
  IF (line->>'expectedQty')::numeric IS NULL OR (line->>'expectedQty')::numeric<=0
   OR (line->>'packedQty')::numeric IS DISTINCT FROM (line->>'expectedQty')::numeric THEN RAISE EXCEPTION 'Verify the exact physical quantity of every packing line'; END IF;
  manifest:=manifest||jsonb_build_array(line||jsonb_build_object('expectedQty',line->'packedQty','pickedQty',0,'packedQty',0,'packed',false,'status','Pending'));
  completed_lines:=completed_lines||jsonb_build_array(line||jsonb_build_object('status','Completed','packed',true));
 END LOOP;
 IF j.status<>'Completed' THEN
  UPDATE public.wms_jobs SET status='Completed',line_items=completed_lines,completed_by=actor.id::text,completed_at=now() WHERE id=j.id RETURNING * INTO j;
 END IF;
 IF (SELECT count(*) FROM public.wms_jobs WHERE type='DISPATCH' AND order_ref=j.order_ref AND site_id=j.site_id AND country_code=j.country_code AND status<>'Cancelled')>1 THEN
  RAISE EXCEPTION 'Multiple dispatch jobs require supervised reconciliation'; END IF;
 SELECT * INTO dispatch FROM public.wms_jobs WHERE type='DISPATCH' AND order_ref=j.order_ref AND site_id=j.site_id AND country_code=j.country_code AND status<>'Cancelled' FOR UPDATE;
 IF dispatch.id IS NOT NULL AND (SELECT jsonb_agg(jsonb_build_object('productId',i->'productId','sku',i->'sku','quantity',i->'expectedQty') ORDER BY ord) FROM jsonb_array_elements(dispatch.line_items) WITH ORDINALITY x(i,ord)) IS DISTINCT FROM
  (SELECT jsonb_agg(jsonb_build_object('productId',i->'productId','sku',i->'sku','quantity',i->'expectedQty') ORDER BY ord) FROM jsonb_array_elements(manifest) WITH ORDINALITY x(i,ord)) THEN
  RAISE EXCEPTION 'Existing dispatch manifest differs; supervised reconciliation required'; END IF;
 IF dispatch.id IS NULL THEN
  INSERT INTO public.wms_jobs(site_id,country_code,type,priority,status,items_count,line_items,location,order_ref,source_site_id,dest_site_id,transfer_status,job_number,assigned_by)
  VALUES(j.site_id,j.country_code,'DISPATCH',j.priority,'Pending',jsonb_array_length(manifest),manifest,'Dispatch Bay',j.order_ref,coalesce(j.source_site_id,j.site_id),j.dest_site_id,'Packed',j.job_number,actor.id::text) RETURNING * INTO dispatch;
 END IF;
 UPDATE public.job_assignments SET status='Completed',completed_at=j.completed_at WHERE job_id=j.id AND status NOT IN('Completed','Cancelled');
 SELECT * INTO parent FROM public.wms_jobs WHERE type='TRANSFER' AND site_id=j.site_id AND country_code=j.country_code AND (id::text=j.order_ref OR job_number=j.order_ref) ORDER BY (id::text=j.order_ref) DESC LIMIT 1 FOR UPDATE;
 IF parent.id IS NOT NULL AND parent.transfer_status IN('Picked','Picking','Approved') THEN UPDATE public.wms_jobs SET transfer_status='Packed' WHERE id=parent.id; END IF;
 INSERT INTO private.pack_handoffs(pack_job_id,dispatch_job_id,verifier_id,initiated_by) VALUES(j.id,dispatch.id,j.completed_by::uuid,actor.id);
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('PACK_HANDOFF_CONFIRMED','Fulfillment',actor.id,j.site_id::text,j.country_code,'wms_job',j.id::text,jsonb_build_object('dispatchJobId',dispatch.id,'verifierId',j.completed_by)::text);
 RETURN jsonb_build_object('job',to_jsonb(j),'dispatch',to_jsonb(dispatch));
END; $$;
REVOKE ALL ON FUNCTION private.complete_pack_job(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.complete_pack_job(uuid) TO authenticated;
CREATE FUNCTION public.complete_pack_job(p_job_id uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.complete_pack_job(p_job_id); $$;
REVOKE ALL ON FUNCTION public.complete_pack_job(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.complete_pack_job(uuid) TO authenticated;
