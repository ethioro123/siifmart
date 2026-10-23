-- Packing scan proof, independent verification, authenticated discrepancy holds and atomic dispatch.
CREATE TABLE private.pack_line_receipts(
 job_id uuid NOT NULL REFERENCES public.wms_jobs(id),item_index integer NOT NULL CHECK(item_index>=0),
 actor_id uuid NOT NULL REFERENCES public.employees(id),quantity numeric NOT NULL CHECK(quantity>0),
 recorded_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(job_id,item_index)
);
CREATE TABLE private.pack_completions(
 job_id uuid PRIMARY KEY REFERENCES public.wms_jobs(id),actor_id uuid NOT NULL REFERENCES public.employees(id),
 dispatch_job_id uuid NOT NULL REFERENCES public.wms_jobs(id),details jsonb NOT NULL,completed_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE private.pack_discrepancies(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),job_id uuid NOT NULL REFERENCES public.wms_jobs(id),
 reported_by uuid NOT NULL REFERENCES public.employees(id),counts jsonb NOT NULL,reason text NOT NULL,
 resolved_by uuid REFERENCES public.employees(id),resolution text,created_at timestamptz NOT NULL DEFAULT now(),resolved_at timestamptz
);
CREATE INDEX pack_discrepancies_open_job ON private.pack_discrepancies(job_id) WHERE resolved_at IS NULL;
ALTER TABLE private.pack_line_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.pack_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.pack_discrepancies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.pack_line_receipts,private.pack_completions,private.pack_discrepancies FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.authorized_pack(p_job_id uuid,p_claim boolean DEFAULT false) RETURNS public.wms_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE;e public.employees%ROWTYPE;picker text;
BEGIN
 SELECT * INTO e FROM public.employees WHERE id=public.get_my_employee_id() AND lower(status)='active';
 SELECT * INTO j FROM public.wms_jobs WHERE id=p_job_id AND type='PACK' FOR UPDATE;
 IF auth.uid() IS NULL OR e.id IS NULL OR j.id IS NULL OR e.role NOT IN
 ('picker','packer','receiver','receiving_operator','putaway_operator','replenishment_operator','inventory_controller','stock_counter','dispatch_operator','returns_operator','fleet_mechanic','inventory_specialist','forklift_operator','stock_clerk','inbound_qc_inspector','returns_clerk','driver','warehouse_manager','inventory_manager','country_operations_director','country_managing_director','group_ceo')
  OR NOT public.is_site_in_my_authorized_scope(j.site_id::text,j.country_code)
  OR (e.role<>'group_ceo' AND e.site_id IS DISTINCT FROM j.site_id)
  OR coalesce(j.source_site_id,j.site_id) IS DISTINCT FROM j.site_id
  OR NOT EXISTS(SELECT 1 FROM public.sites s WHERE s.id=j.site_id AND upper(s.country)=upper(j.country_code) AND s.type IN ('Warehouse','Distribution Center'))
  OR (j.dest_site_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.sites s WHERE s.id=j.dest_site_id AND upper(s.country)=upper(j.country_code)))
 THEN RAISE EXCEPTION 'Packing requires an authorized employee at this facility' USING ERRCODE='42501'; END IF;
 SELECT p.completed_by INTO picker FROM public.wms_jobs p WHERE p.type='PICK' AND p.status='Completed' AND p.order_ref=j.order_ref
  AND p.site_id=j.site_id AND p.country_code=j.country_code AND p.dest_site_id IS NOT DISTINCT FROM j.dest_site_id
 ORDER BY p.completed_at DESC LIMIT 1;
 IF picker IS NULL OR picker=e.id::text THEN RAISE EXCEPTION 'A different employee must verify the completed pick' USING ERRCODE='42501'; END IF;
 IF p_claim AND j.status IN ('Pending','In-Progress') AND nullif(j.assigned_to,'') IS NULL THEN
  UPDATE public.wms_jobs SET assigned_to=e.id::text,assigned_by=e.id::text WHERE id=j.id RETURNING * INTO j;
  INSERT INTO public.job_assignments(job_id,employee_id,employee_name,status) VALUES(j.id,e.id,e.name,'In-Progress');
 END IF;
 IF j.assigned_to IS DISTINCT FROM e.id::text OR NOT EXISTS(SELECT 1 FROM public.job_assignments a WHERE a.job_id=j.id AND a.employee_id=e.id) THEN
  RAISE EXCEPTION 'Only the assigned packer can verify this job' USING ERRCODE='42501'; END IF;
 RETURN j;
END; $$;
REVOKE ALL ON FUNCTION private.authorized_pack(uuid,boolean) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.prepare_pack_job(p_job_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE;
BEGIN
 j:=private.authorized_pack(p_job_id,true);
 IF j.status NOT IN ('Pending','In-Progress') THEN RAISE EXCEPTION 'An active packing job is required'; END IF;
 UPDATE public.wms_jobs SET status='In-Progress',tracking_number=coalesce(nullif(tracking_number,''),'PK-'||upper(replace(id::text,'-',''))) WHERE id=j.id RETURNING * INTO j;
 RETURN to_jsonb(j);
END; $$;

CREATE FUNCTION private.record_pack_line(p_job_id uuid,p_item_index integer,p_quantity numeric,p_barcode text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE;line jsonb;p public.products%ROWTYPE;receipt private.pack_line_receipts%ROWTYPE;
BEGIN
 j:=private.authorized_pack(p_job_id);
 IF j.status NOT IN ('Pending','In-Progress') OR EXISTS(SELECT 1 FROM private.pack_discrepancies WHERE job_id=j.id AND resolved_at IS NULL) THEN RAISE EXCEPTION 'Packing is on hold or no longer active'; END IF;
 IF p_item_index IS NULL OR p_item_index<0 OR p_item_index>=jsonb_array_length(j.line_items) THEN RAISE EXCEPTION 'Invalid packing line'; END IF;
 line:=j.line_items->p_item_index;
 IF p_quantity IS NULL OR p_quantity::text IN ('NaN','Infinity','-Infinity') OR p_quantity<=0 OR p_quantity IS DISTINCT FROM (line->>'expectedQty')::numeric THEN RAISE EXCEPTION 'Record the exact physical quantity; report any difference for supervisor review'; END IF;
 SELECT * INTO p FROM public.products WHERE id::text=line->>'productId' AND site_id=j.site_id AND sku=line->>'sku';
 IF p.id IS NULL OR upper(btrim(coalesce(p_barcode,''))) NOT IN(upper(p.sku),upper(coalesce(p.barcode,p.sku))) THEN RAISE EXCEPTION 'Scan the exact product on this packing line'; END IF;
 SELECT * INTO receipt FROM private.pack_line_receipts WHERE job_id=j.id AND item_index=p_item_index;
 IF receipt.job_id IS NOT NULL THEN
  IF receipt.actor_id=public.get_my_employee_id() AND receipt.quantity=p_quantity THEN RETURN to_jsonb(j); END IF;
  RAISE EXCEPTION 'Packing line already verified by another worker';
 END IF;
 INSERT INTO private.pack_line_receipts(job_id,item_index,actor_id,quantity) VALUES(j.id,p_item_index,public.get_my_employee_id(),p_quantity);
 UPDATE public.wms_jobs SET line_items=jsonb_set(line_items,ARRAY[p_item_index::text],line||jsonb_build_object('packedQty',p_quantity,'packed',true,'status','Picked')),status='In-Progress' WHERE id=j.id RETURNING * INTO j;
 RETURN to_jsonb(j);
END; $$;

CREATE FUNCTION private.report_pack_discrepancy(p_job_id uuid,p_counts jsonb,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE;item jsonb;idx integer:=0;variance boolean:=false;actual numeric;report_id uuid;
BEGIN
 j:=private.authorized_pack(p_job_id);
 IF j.status NOT IN ('Pending','In-Progress') THEN RAISE EXCEPTION 'Completed packing cannot be changed'; END IF;
 IF jsonb_typeof(p_counts)<>'array' OR jsonb_array_length(p_counts)<>jsonb_array_length(j.line_items) OR length(btrim(p_reason)) NOT BETWEEN 3 AND 500 OR p_reason IS NULL THEN RAISE EXCEPTION 'Record every physical count and a reason (3–500 characters)'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_counts) LOOP
  actual:=(item #>> '{}')::numeric;
  IF actual IS NULL OR actual::text IN ('NaN','Infinity','-Infinity') OR actual<0 THEN RAISE EXCEPTION 'Invalid physical count'; END IF;
  variance:=variance OR actual<>(j.line_items->idx->>'expectedQty')::numeric;idx:=idx+1;
 END LOOP;
 IF NOT variance THEN RAISE EXCEPTION 'No quantity difference was recorded'; END IF;
 IF EXISTS(SELECT 1 FROM private.pack_discrepancies WHERE job_id=j.id AND resolved_at IS NULL) THEN RAISE EXCEPTION 'This packing job is already awaiting supervisor review'; END IF;
 INSERT INTO private.pack_discrepancies(job_id,reported_by,counts,reason) VALUES(j.id,public.get_my_employee_id(),p_counts,btrim(p_reason)) RETURNING id INTO report_id;
 DELETE FROM private.pack_line_receipts WHERE job_id=j.id;
 UPDATE public.wms_jobs SET line_items=(SELECT jsonb_agg(i||jsonb_build_object('packedQty',0,'packed',false,'status','Pending')) FROM jsonb_array_elements(j.line_items)i),has_discrepancy=true,discrepancy_details=jsonb_build_object('packingHold',true,'reportId',report_id,'reportedBy',public.get_my_employee_id(),'reason',btrim(p_reason),'counts',p_counts)::text WHERE id=j.id RETURNING * INTO j;
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('PACK_DISCREPANCY_REPORTED','Fulfillment',public.get_my_employee_id(),j.site_id::text,j.country_code,'wms_job',j.id::text,jsonb_build_object('reportId',report_id,'counts',p_counts,'reason',btrim(p_reason))::text);
 RETURN to_jsonb(j);
END; $$;

CREATE FUNCTION private.resolve_pack_discrepancy(p_job_id uuid,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE;e public.employees%ROWTYPE;r private.pack_discrepancies%ROWTYPE;
BEGIN
 SELECT * INTO e FROM public.employees WHERE id=public.get_my_employee_id() AND lower(status)='active';
 SELECT * INTO j FROM public.wms_jobs WHERE id=p_job_id AND type='PACK' FOR UPDATE;
 SELECT * INTO r FROM private.pack_discrepancies WHERE job_id=j.id AND resolved_at IS NULL ORDER BY created_at LIMIT 1 FOR UPDATE;
 IF auth.uid() IS NULL OR e.id IS NULL OR j.id IS NULL OR r.id IS NULL OR e.id=r.reported_by
  OR e.role NOT IN('group_ceo','country_managing_director','country_operations_director','warehouse_manager','inventory_manager','regional_operations_manager','regional_supply_chain_manager')
  OR NOT public.is_site_in_my_authorized_scope(j.site_id::text,j.country_code) THEN RAISE EXCEPTION 'A different authenticated supervisor in this facility scope must resolve the hold' USING ERRCODE='42501'; END IF;
 IF j.status NOT IN ('Pending','In-Progress') OR p_reason IS NULL OR length(btrim(p_reason)) NOT BETWEEN 3 AND 500 THEN RAISE EXCEPTION 'Record a supervisor resolution reason before recounting'; END IF;
 UPDATE private.pack_discrepancies SET resolved_by=e.id,resolution=btrim(p_reason),resolved_at=now() WHERE id=r.id;
 -- Reporting voided prior scan receipts; resolving authorizes a fresh independent recount.
 UPDATE public.wms_jobs SET discrepancy_details=jsonb_build_object('packingHold',false,'reportId',r.id,'resolvedBy',e.id,'resolution',btrim(p_reason))::text WHERE id=j.id RETURNING * INTO j;
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('PACK_DISCREPANCY_RESOLVED','Fulfillment',e.id,j.site_id::text,j.country_code,'wms_job',j.id::text,jsonb_build_object('reportId',r.id,'reason',btrim(p_reason))::text);
 RETURN to_jsonb(j);
END; $$;

CREATE FUNCTION private.complete_pack_job(p_job_id uuid,p_details jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE;d public.wms_jobs%ROWTYPE;done private.pack_completions%ROWTYPE;
 cfg public.system_config%ROWTYPE;line jsonb;p public.products%ROWTYPE;idx integer:=0;manifest jsonb:='[]';dispatch_items jsonb:='[]';
 requires_seal boolean;requires_weight boolean;tolerance numeric;seal text;actual numeric;tare numeric;expected numeric:=0;mass numeric;mass_text text;
 cold boolean:=false;fragile boolean:=false;box text;receipt private.pack_line_receipts%ROWTYPE;
BEGIN
 j:=private.authorized_pack(p_job_id);
 SELECT * INTO done FROM private.pack_completions WHERE job_id=j.id;
 IF done.job_id IS NOT NULL THEN
  SELECT * INTO d FROM public.wms_jobs WHERE id=done.dispatch_job_id;
  RETURN jsonb_build_object('job',to_jsonb(j),'dispatch',to_jsonb(d));
 END IF;
 IF j.status NOT IN ('Pending','In-Progress') OR coalesce(jsonb_array_length(j.line_items),0)=0 THEN RAISE EXCEPTION 'An active PACK with verified lines is required'; END IF;
 IF EXISTS(SELECT 1 FROM private.pack_discrepancies WHERE job_id=j.id AND resolved_at IS NULL) THEN RAISE EXCEPTION 'A supervisor must resolve the packing hold before completion'; END IF;
 SELECT * INTO cfg FROM public.system_config WHERE id='00000000-0000-0000-0000-000000000001';
 requires_seal:=coalesce((cfg.country_configs->upper(j.country_code)->>'requirePackSecuritySeal')::boolean,cfg.require_pack_security_seal,true);
 requires_weight:=coalesce((cfg.country_configs->upper(j.country_code)->>'requirePackCartonWeight')::boolean,cfg.require_pack_carton_weight,false);
 tolerance:=coalesce((cfg.country_configs->upper(j.country_code)->>'packWeightTolerancePct')::numeric,cfg.pack_weight_tolerance_pct,5);
 box:=p_details->>'boxSize';seal:=nullif(btrim(p_details->>'sealSerialNumber'),'');actual:=nullif(p_details->>'scaleWeight','')::numeric;tare:=nullif(p_details->>'tareWeightKg','')::numeric;
 IF box IS NULL OR box NOT IN('Small','Medium','Large','Extra Large','Thermal Cool Box') THEN RAISE EXCEPTION 'Select the actual carton type'; END IF;
 IF (requires_seal OR coalesce((p_details->'packingMaterials'->>'securitySeal')::boolean,false)) AND (seal IS NULL OR length(seal)>120) THEN RAISE EXCEPTION 'Record the security seal serial'; END IF;
 IF actual IS NOT NULL AND (actual::text IN('NaN','Infinity','-Infinity') OR actual<=0) THEN RAISE EXCEPTION 'Record a valid gross scale weight'; END IF;
 IF tare IS NOT NULL AND (tare::text IN('NaN','Infinity','-Infinity') OR tare<=0) THEN RAISE EXCEPTION 'Record a valid empty-carton tare weight'; END IF;
 FOR line IN SELECT value FROM jsonb_array_elements(j.line_items) LOOP
  SELECT * INTO receipt FROM private.pack_line_receipts WHERE job_id=j.id AND item_index=idx;
  IF receipt.job_id IS NULL OR receipt.quantity IS DISTINCT FROM (line->>'expectedQty')::numeric OR receipt.quantity IS DISTINCT FROM (line->>'packedQty')::numeric THEN RAISE EXCEPTION 'Scan and physically verify every packing line'; END IF;
  SELECT * INTO p FROM public.products WHERE id::text=line->>'productId' AND site_id=j.site_id AND sku=line->>'sku';
  IF p.id IS NULL THEN RAISE EXCEPTION 'Packing product is outside this facility'; END IF;
  cold:=cold OR coalesce(p.custom_attributes->'storage'->>'type','') ILIKE ANY(ARRAY['%chilled%','%frozen%']) OR p.category IN('Frozen','Dairy');
  fragile:=fragile OR coalesce((p.custom_attributes->'storage'->>'isFragile')::boolean,false);
  mass_text:=lower(btrim(p.custom_attributes->'physical'->>'grossWeight'));
  mass:=NULL;
  IF mass_text ~ '^[0-9]+([.][0-9]+)?[ ]*kg$' THEN mass:=regexp_replace(mass_text,'[ ]*kg$','')::numeric;
  ELSIF mass_text ~ '^[0-9]+([.][0-9]+)?[ ]*g$' THEN mass:=regexp_replace(mass_text,'[ ]*g$','')::numeric/1000; END IF;
  IF requires_weight AND (mass IS NULL OR mass<=0) THEN RAISE EXCEPTION 'Catalog gross weight with g/kg units is required before weight verification'; END IF;
  expected:=expected+coalesce(mass,0)*receipt.quantity;
  manifest:=manifest||jsonb_build_array(line||jsonb_build_object('status','Completed','packed',true));
  dispatch_items:=dispatch_items||jsonb_build_array(line||jsonb_build_object('dispatchedQty',receipt.quantity,'shippedQty',receipt.quantity,'expectedQty',receipt.quantity,'status','Pending'));
  idx:=idx+1;
 END LOOP;
 IF cold AND NOT coalesce((p_details->>'hasIcePack')::boolean,false) AND box<>'Thermal Cool Box' THEN RAISE EXCEPTION 'Cold-chain goods require ice packs or a thermal cool box'; END IF;
 IF fragile AND NOT coalesce((p_details->'packingMaterials'->>'fragileStickers')::boolean,false) THEN RAISE EXCEPTION 'Mark fragile goods before sealing'; END IF;
 IF requires_weight AND (actual IS NULL OR tare IS NULL) THEN RAISE EXCEPTION 'Gross and empty-carton scale weights are required'; END IF;
 IF requires_weight AND abs(actual-(expected+tare))/(expected+tare)*100>tolerance THEN RAISE EXCEPTION 'Scale variance exceeds the country tolerance; correct the carton or report a discrepancy'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('pack-order:'||j.site_id::text||':'||coalesce(j.order_ref,j.id::text),0));
 IF EXISTS(SELECT 1 FROM public.wms_jobs WHERE type IN('DISPATCH','DRIVER') AND status NOT IN('Cancelled','Deleted') AND site_id=j.site_id AND country_code=j.country_code AND order_ref=j.order_ref) THEN RAISE EXCEPTION 'An existing shipment requires supervisor reconciliation; packing was not completed'; END IF;
 IF seal IS NOT NULL THEN
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('pack-seal:'||j.country_code||':'||upper(seal),0));
  IF EXISTS(SELECT 1 FROM private.pack_completions c JOIN public.wms_jobs w ON w.id=c.job_id WHERE w.country_code=j.country_code AND upper(w.pack_security_seal_serial)=upper(seal)) THEN RAISE EXCEPTION 'This security seal was already used'; END IF;
 END IF;
 INSERT INTO public.wms_jobs(country_code,site_id,source_site_id,dest_site_id,type,status,priority,items_count,line_items,location,order_ref,job_number,transfer_status,tracking_number,pack_security_seal_serial)
 VALUES(j.country_code,j.site_id,j.source_site_id,j.dest_site_id,'DISPATCH','Pending',j.priority,jsonb_array_length(dispatch_items),dispatch_items,'Dispatch Bay',j.order_ref,j.job_number,'Packed',coalesce(nullif(j.tracking_number,''),'PK-'||upper(replace(j.id::text,'-',''))),seal) RETURNING * INTO d;
 INSERT INTO private.pack_completions(job_id,actor_id,dispatch_job_id,details) VALUES(j.id,public.get_my_employee_id(),d.id,p_details);
 UPDATE public.wms_jobs SET status='Completed',line_items=manifest,pack_security_seal_serial=seal,tracking_number=d.tracking_number,completed_by=public.get_my_employee_id()::text,completed_at=now() WHERE id=j.id RETURNING * INTO j;
 UPDATE public.job_assignments SET status='Completed',completed_at=j.completed_at WHERE job_id=j.id AND status<>'Completed';
 UPDATE public.wms_jobs SET transfer_status='Packed' WHERE type='TRANSFER' AND id::text=j.order_ref AND country_code=j.country_code AND coalesce(source_site_id,site_id)=j.site_id;
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('PACK_COMPLETED','Fulfillment',public.get_my_employee_id(),j.site_id::text,j.country_code,'wms_job',j.id::text,jsonb_build_object('dispatchJobId',d.id,'packing',p_details)::text);
 RETURN jsonb_build_object('job',to_jsonb(j),'dispatch',to_jsonb(d));
END; $$;

-- Deny REST-based scan forgery and completion outside the transaction.
CREATE FUNCTION private.guard_verified_packing() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE line jsonb;idx integer:=0;r private.pack_line_receipts%ROWTYPE;completing boolean;
BEGIN
 IF auth.jwt()->>'role'='service_role' THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.type='PACK' AND (NEW.status='Completed' OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(NEW.line_items,'[]'))i WHERE coalesce((i->>'packedQty')::numeric,0)<>0 OR coalesce((i->>'packed')::boolean,false))) THEN RAISE EXCEPTION 'New PACK jobs require independent verification'; END IF;
  RETURN NEW;
 END IF;
 IF OLD.type<>'PACK' THEN
  IF NEW.type='PACK' THEN RAISE EXCEPTION 'Create a new packing manifest instead of changing job type'; END IF;
  RETURN NEW;
 END IF;
 IF NEW.type IS DISTINCT FROM OLD.type OR NEW.site_id IS DISTINCT FROM OLD.site_id OR NEW.country_code IS DISTINCT FROM OLD.country_code OR NEW.order_ref IS DISTINCT FROM OLD.order_ref OR NEW.source_site_id IS DISTINCT FROM OLD.source_site_id OR NEW.dest_site_id IS DISTINCT FROM OLD.dest_site_id THEN RAISE EXCEPTION 'Packing route and manifest identity are immutable'; END IF;
 IF OLD.status='Completed' AND (NEW.status IS DISTINCT FROM OLD.status OR NEW.line_items IS DISTINCT FROM OLD.line_items OR NEW.tracking_number IS DISTINCT FROM OLD.tracking_number OR NEW.pack_security_seal_serial IS DISTINCT FROM OLD.pack_security_seal_serial) THEN RAISE EXCEPTION 'Completed packing is immutable'; END IF;
 completing:=NEW.status='Completed' AND OLD.status<>'Completed';
 IF completing AND NOT EXISTS(SELECT 1 FROM private.pack_completions WHERE job_id=OLD.id) THEN RAISE EXCEPTION 'Complete packing through its verified transaction'; END IF;
 IF NEW.line_items IS NOT DISTINCT FROM OLD.line_items THEN RETURN NEW; END IF;
 IF jsonb_array_length(NEW.line_items)<>jsonb_array_length(OLD.line_items) THEN RAISE EXCEPTION 'Packing manifest is immutable'; END IF;
 IF EXISTS(SELECT 1 FROM private.pack_discrepancies WHERE job_id=OLD.id AND resolved_at IS NULL AND reported_by=public.get_my_employee_id())
  AND NEW.line_items=(SELECT jsonb_agg(i||jsonb_build_object('packedQty',0,'packed',false,'status','Pending')) FROM jsonb_array_elements(OLD.line_items)i) THEN RETURN NEW; END IF;
 FOR line IN SELECT value FROM jsonb_array_elements(NEW.line_items) LOOP
  IF line IS DISTINCT FROM OLD.line_items->idx THEN
   SELECT * INTO r FROM private.pack_line_receipts WHERE job_id=OLD.id AND item_index=idx;
   IF r.job_id IS NULL OR (line-ARRAY['packed','packedQty','status']) IS DISTINCT FROM ((OLD.line_items->idx)-ARRAY['packed','packedQty','status']) OR (line->>'packedQty')::numeric IS DISTINCT FROM r.quantity OR line->>'packed' IS DISTINCT FROM 'true'
    OR line->>'status' IS DISTINCT FROM (CASE WHEN completing THEN 'Completed' ELSE 'Picked' END) THEN RAISE EXCEPTION 'Packing requires a verified product scan and physical count'; END IF;
  END IF;idx:=idx+1;
 END LOOP;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.guard_verified_packing() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_verified_packing BEFORE INSERT OR UPDATE ON public.wms_jobs FOR EACH ROW EXECUTE FUNCTION private.guard_verified_packing();

REVOKE ALL ON FUNCTION private.prepare_pack_job(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.prepare_pack_job(uuid) TO authenticated;
CREATE FUNCTION public.prepare_pack_job(p_job_id uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $wrapper$ SELECT private.prepare_pack_job(p_job_id); $wrapper$;
REVOKE ALL ON FUNCTION public.prepare_pack_job(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.prepare_pack_job(uuid) TO authenticated;

REVOKE ALL ON FUNCTION private.record_pack_line(uuid,integer,numeric,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.record_pack_line(uuid,integer,numeric,text) TO authenticated;
CREATE FUNCTION public.record_pack_line(p_job_id uuid,p_item_index integer,p_quantity numeric,p_barcode text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $wrapper$ SELECT private.record_pack_line(p_job_id,p_item_index,p_quantity,p_barcode); $wrapper$;
REVOKE ALL ON FUNCTION public.record_pack_line(uuid,integer,numeric,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_pack_line(uuid,integer,numeric,text) TO authenticated;

REVOKE ALL ON FUNCTION private.report_pack_discrepancy(uuid,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.report_pack_discrepancy(uuid,jsonb,text) TO authenticated;
CREATE FUNCTION public.report_pack_discrepancy(p_job_id uuid,p_counts jsonb,p_reason text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $wrapper$ SELECT private.report_pack_discrepancy(p_job_id,p_counts,p_reason); $wrapper$;
REVOKE ALL ON FUNCTION public.report_pack_discrepancy(uuid,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.report_pack_discrepancy(uuid,jsonb,text) TO authenticated;

REVOKE ALL ON FUNCTION private.resolve_pack_discrepancy(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.resolve_pack_discrepancy(uuid,text) TO authenticated;
CREATE FUNCTION public.resolve_pack_discrepancy(p_job_id uuid,p_reason text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $wrapper$ SELECT private.resolve_pack_discrepancy(p_job_id,p_reason); $wrapper$;
REVOKE ALL ON FUNCTION public.resolve_pack_discrepancy(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resolve_pack_discrepancy(uuid,text) TO authenticated;

REVOKE ALL ON FUNCTION private.complete_pack_job(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.complete_pack_job(uuid,jsonb) TO authenticated;
CREATE FUNCTION public.complete_pack_job(p_job_id uuid,p_details jsonb) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $wrapper$ SELECT private.complete_pack_job(p_job_id,p_details); $wrapper$;
REVOKE ALL ON FUNCTION public.complete_pack_job(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.complete_pack_job(uuid,jsonb) TO authenticated;
