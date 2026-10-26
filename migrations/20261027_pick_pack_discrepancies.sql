-- Preserve independent counts and supervisor decisions without rewriting stock or pick evidence.
CREATE TABLE private.floor_discrepancies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), job_id uuid NOT NULL REFERENCES public.wms_jobs(id),
 item_index integer NOT NULL CHECK(item_index>=0), stage text NOT NULL CHECK(stage IN ('PICK','PACK')),
 site_id uuid NOT NULL REFERENCES public.sites(id), country_code text NOT NULL, manifest jsonb NOT NULL,
 expected_qty numeric NOT NULL CHECK(expected_qty>0), first_count numeric NOT NULL CHECK(first_count>=0 AND first_count<=1000000000),
 recount numeric NOT NULL CHECK(recount>=0 AND recount<=1000000000), reason text NOT NULL CHECK(length(reason) BETWEEN 3 AND 500),
 reporter_id uuid NOT NULL REFERENCES public.employees(id), reporter_name text NOT NULL, reported_at timestamptz NOT NULL DEFAULT now(),
 resolution text CHECK(resolution IN ('count_corrected','goods_recovered','excess_segregated','short_pick')),
 resolved_qty numeric, resolution_notes text, resolver_id uuid REFERENCES public.employees(id), resolver_name text, resolved_at timestamptz,
 CHECK(recount<>expected_qty), CHECK(resolver_id IS DISTINCT FROM reporter_id)
);
CREATE UNIQUE INDEX floor_discrepancy_one_open_line ON private.floor_discrepancies(job_id,item_index) WHERE resolved_at IS NULL;
CREATE INDEX floor_discrepancy_job_history ON private.floor_discrepancies(job_id,reported_at DESC);
ALTER TABLE private.floor_discrepancies ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.floor_discrepancies FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.floor_discrepancy_job(p_job_id uuid) RETURNS public.wms_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE; e public.employees%ROWTYPE;
BEGIN
 SELECT * INTO e FROM public.employees WHERE id=public.get_my_employee_id() AND lower(status)='active';
 SELECT * INTO j FROM public.wms_jobs WHERE id=p_job_id AND type IN ('PICK','PACK');
 IF auth.uid() IS NULL OR e.id IS NULL OR j.id IS NULL
  OR NOT public.is_site_in_my_authorized_scope(j.site_id::text,j.country_code)
  OR NOT EXISTS(SELECT 1 FROM public.sites WHERE id=j.site_id AND upper(country)=upper(j.country_code))
  OR (j.assigned_to IS DISTINCT FROM e.id::text AND e.role NOT IN
   ('group_ceo','country_managing_director','country_operations_director','warehouse_manager','inventory_manager','regional_operations_manager','regional_supply_chain_manager')) THEN
  RAISE EXCEPTION 'Discrepancy is outside your assigned job or supervisory scope' USING ERRCODE='42501'; END IF;
 RETURN j;
END; $$;
REVOKE ALL ON FUNCTION private.floor_discrepancy_job(uuid) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.floor_discrepancy_history(p_job_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM private.floor_discrepancy_job(p_job_id);
 RETURN coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.reported_at DESC) FROM (
  SELECT * FROM private.floor_discrepancies WHERE job_id=p_job_id ORDER BY (resolved_at IS NULL) DESC,reported_at DESC LIMIT 100
 )d),'[]'::jsonb);
END; $$;
REVOKE ALL ON FUNCTION private.floor_discrepancy_history(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.floor_discrepancy_history(uuid) TO authenticated;
CREATE FUNCTION public.floor_discrepancy_history(p_job_id uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.floor_discrepancy_history(p_job_id); $$;
REVOKE ALL ON FUNCTION public.floor_discrepancy_history(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.floor_discrepancy_history(uuid) TO authenticated;

CREATE FUNCTION private.report_floor_discrepancy(p_job_id uuid,p_item_index integer,p_first_count numeric,p_recount numeric,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE; actor public.employees%ROWTYPE; expected numeric; d private.floor_discrepancies%ROWTYPE;
BEGIN
 PERFORM 1 FROM public.wms_jobs WHERE id=p_job_id FOR UPDATE;
 j:=private.floor_discrepancy_job(p_job_id);
 SELECT * INTO actor FROM public.employees WHERE id=public.get_my_employee_id();
 IF j.assigned_to IS DISTINCT FROM actor.id::text OR j.status NOT IN ('Pending','In-Progress') THEN
  RAISE EXCEPTION 'Only the assigned worker can report an active job discrepancy' USING ERRCODE='42501'; END IF;
 IF p_item_index IS NULL OR p_item_index<0 OR p_item_index>=jsonb_array_length(j.line_items) THEN RAISE EXCEPTION 'Invalid manifest line'; END IF;
 expected:=(j.line_items->p_item_index->>'expectedQty')::numeric;
 IF expected IS NULL OR expected<=0 OR p_first_count IS NULL OR p_recount IS NULL
  OR p_first_count<0 OR p_first_count>1000000000 OR p_recount<0 OR p_recount>1000000000
  OR p_recount=expected OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 3 AND 500 THEN
  RAISE EXCEPTION 'Enter both physical counts and a reason; recount must still differ from the manifest'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('floor-discrepancy:'||j.country_code||':'||j.site_id::text||':'||coalesce(j.order_ref,j.id::text),0));
 SELECT * INTO d FROM private.floor_discrepancies WHERE job_id=j.id AND item_index=p_item_index AND resolved_at IS NULL;
 IF d.id IS NOT NULL THEN
  IF d.reporter_id=actor.id AND d.first_count=p_first_count AND d.recount=p_recount AND d.reason=btrim(p_reason) THEN RETURN to_jsonb(d); END IF;
  RAISE EXCEPTION 'This line already has an open discrepancy; review it before reporting again'; END IF;
 INSERT INTO private.floor_discrepancies(job_id,item_index,stage,site_id,country_code,manifest,expected_qty,first_count,recount,reason,reporter_id,reporter_name)
 VALUES(j.id,p_item_index,j.type,j.site_id,j.country_code,j.line_items->p_item_index,expected,p_first_count,p_recount,btrim(p_reason),actor.id,actor.name) RETURNING * INTO d;
 UPDATE public.wms_jobs SET has_discrepancy=true WHERE id=j.id;
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('FLOOR_DISCREPANCY_REPORTED','Fulfillment',actor.id,j.site_id::text,j.country_code,'wms_job',j.id::text,
  jsonb_build_object('discrepancyId',d.id,'stage',j.type,'line',p_item_index,'expected',expected,'firstCount',p_first_count,'recount',p_recount,'reason',btrim(p_reason))::text);
 RETURN to_jsonb(d);
END; $$;
REVOKE ALL ON FUNCTION private.report_floor_discrepancy(uuid,integer,numeric,numeric,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.report_floor_discrepancy(uuid,integer,numeric,numeric,text) TO authenticated;
CREATE FUNCTION public.report_floor_discrepancy(p_job_id uuid,p_item_index integer,p_first_count numeric,p_recount numeric,p_reason text) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.report_floor_discrepancy(p_job_id,p_item_index,p_first_count,p_recount,p_reason); $$;
REVOKE ALL ON FUNCTION public.report_floor_discrepancy(uuid,integer,numeric,numeric,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.report_floor_discrepancy(uuid,integer,numeric,numeric,text) TO authenticated;

CREATE FUNCTION private.resolve_floor_discrepancy(p_job_id uuid,p_discrepancy_id uuid,p_resolution text,p_quantity numeric,p_notes text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE; actor public.employees%ROWTYPE; d private.floor_discrepancies%ROWTYPE;
BEGIN
 PERFORM 1 FROM public.wms_jobs WHERE id=p_job_id FOR UPDATE;
 j:=private.floor_discrepancy_job(p_job_id);
 SELECT * INTO actor FROM public.employees WHERE id=public.get_my_employee_id();
 SELECT * INTO d FROM private.floor_discrepancies WHERE id=p_discrepancy_id AND job_id=j.id FOR UPDATE;
 IF d.id IS NULL OR actor.role NOT IN ('group_ceo','country_managing_director','country_operations_director','warehouse_manager','inventory_manager','regional_operations_manager','regional_supply_chain_manager')
  OR actor.id=d.reporter_id OR j.assigned_to=actor.id::text
  OR EXISTS(SELECT 1 FROM public.wms_jobs s WHERE s.country_code=j.country_code AND s.site_id=j.site_id AND s.type IN ('PICK','PACK')
    AND (s.id=j.id OR (s.order_ref=j.order_ref AND nullif(j.order_ref,'') IS NOT NULL)) AND
    (s.completed_by=actor.id::text OR s.assigned_to=actor.id::text OR EXISTS(SELECT 1 FROM public.job_assignments a WHERE a.job_id=s.id AND a.employee_id=actor.id))) THEN
  RAISE EXCEPTION 'A separate authenticated supervisor must reconcile this discrepancy' USING ERRCODE='42501'; END IF;
 IF length(btrim(coalesce(p_notes,''))) NOT BETWEEN 3 AND 500 OR p_quantity IS NULL OR p_quantity<0 OR p_quantity>1000000000
  OR p_resolution NOT IN ('count_corrected','goods_recovered','excess_segregated','short_pick') OR p_resolution IS NULL THEN RAISE EXCEPTION 'Enter a valid reconciled count, resolution and observed corrective action'; END IF;
 IF d.resolved_at IS NOT NULL THEN
  IF d.resolver_id=actor.id AND d.resolution=p_resolution AND d.resolved_qty=p_quantity AND d.resolution_notes=btrim(p_notes) THEN RETURN to_jsonb(d); END IF;
  RAISE EXCEPTION 'Discrepancy already resolved; refresh its audit history'; END IF;
 IF j.status NOT IN ('Pending','In-Progress') OR (j.line_items->d.item_index->>'expectedQty')::numeric IS DISTINCT FROM d.expected_qty
  OR j.line_items->d.item_index->>'productId' IS DISTINCT FROM d.manifest->>'productId' THEN RAISE EXCEPTION 'Manifest changed; supervised investigation is required'; END IF;
 IF p_resolution='short_pick' THEN
  IF j.type<>'PICK' OR p_quantity<>d.recount OR p_quantity>=d.expected_qty OR EXISTS(SELECT 1 FROM public.storefront_orders WHERE pick_job_id=j.id) THEN
   RAISE EXCEPTION 'Only a recounted PICK shortage on an eligible order can be approved'; END IF;
 ELSE
  IF p_quantity<>d.expected_qty THEN RAISE EXCEPTION 'Reconcile goods to the original manifest before releasing this job'; END IF;
 END IF;
 UPDATE private.floor_discrepancies SET resolution=p_resolution,resolved_qty=p_quantity,resolution_notes=btrim(p_notes),resolver_id=actor.id,resolver_name=actor.name,resolved_at=now()
 WHERE id=d.id RETURNING * INTO d;
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('FLOOR_DISCREPANCY_RESOLVED','Fulfillment',actor.id,j.site_id::text,j.country_code,'wms_job',j.id::text,
  jsonb_build_object('discrepancyId',d.id,'resolution',p_resolution,'quantity',p_quantity,'notes',btrim(p_notes),'reporterId',d.reporter_id)::text);
 RETURN to_jsonb(d);
END; $$;
REVOKE ALL ON FUNCTION private.resolve_floor_discrepancy(uuid,uuid,text,numeric,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.resolve_floor_discrepancy(uuid,uuid,text,numeric,text) TO authenticated;
CREATE FUNCTION public.resolve_floor_discrepancy(p_job_id uuid,p_discrepancy_id uuid,p_resolution text,p_quantity numeric,p_notes text) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.resolve_floor_discrepancy(p_job_id,p_discrepancy_id,p_resolution,p_quantity,p_notes); $$;
REVOKE ALL ON FUNCTION public.resolve_floor_discrepancy(uuid,uuid,text,numeric,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.resolve_floor_discrepancy(uuid,uuid,text,numeric,text) TO authenticated;

CREATE FUNCTION private.guard_floor_discrepancy() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
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
 IF OLD.type='PACK' AND NEW.line_items IS DISTINCT FROM OLD.line_items THEN
  IF jsonb_array_length(NEW.line_items) IS DISTINCT FROM jsonb_array_length(OLD.line_items) THEN RAISE EXCEPTION 'Packing cannot replace the picked manifest'; END IF;
  FOR line IN SELECT value FROM jsonb_array_elements(NEW.line_items) LOOP
   IF line->'expectedQty' IS DISTINCT FROM OLD.line_items->idx->'expectedQty' OR line->'pickedQty' IS DISTINCT FROM OLD.line_items->idx->'pickedQty'
    OR line->'productId' IS DISTINCT FROM OLD.line_items->idx->'productId' OR line->'sku' IS DISTINCT FROM OLD.line_items->idx->'sku' THEN
    RAISE EXCEPTION 'Packing preserves the original picked quantity and product identity'; END IF;
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
REVOKE ALL ON FUNCTION private.guard_floor_discrepancy() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zzz_guard_floor_discrepancy BEFORE INSERT OR UPDATE OR DELETE ON public.wms_jobs
FOR EACH ROW EXECUTE FUNCTION private.guard_floor_discrepancy();
