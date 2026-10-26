-- Separation of duties is per order, facility and country, independent of role titles.
CREATE FUNCTION private.pack_picker_ids(p_site uuid,p_country text,p_order text) RETURNS text[]
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(array_agg(DISTINCT actor),'{}'::text[]) FROM (
  SELECT nullif(p.completed_by,'') actor FROM public.wms_jobs p
  WHERE p.type='PICK' AND p.site_id=p_site AND p.country_code=p_country AND p.order_ref=p_order
  UNION
  SELECT nullif(p.assigned_to,'') FROM public.wms_jobs p
  WHERE p.type='PICK' AND p.site_id=p_site AND p.country_code=p_country AND p.order_ref=p_order
  UNION
  SELECT a.employee_id::text FROM public.job_assignments a JOIN public.wms_jobs p ON p.id=a.job_id
  WHERE p.type='PICK' AND p.site_id=p_site AND p.country_code=p_country AND p.order_ref=p_order
 ) pickers WHERE actor IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION private.pack_picker_ids(uuid,text,text) FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.pack_excluded_workers(p_pack_job_id uuid) RETURNS text[]
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE;
BEGIN
 SELECT * INTO j FROM public.wms_jobs WHERE id=p_pack_job_id AND type='PACK';
 IF auth.uid() IS NULL OR j.id IS NULL OR NOT public.is_site_in_my_authorized_scope(j.site_id::text,j.country_code) THEN
  RAISE EXCEPTION 'Packing is outside the authorized facility' USING ERRCODE='42501'; END IF;
 RETURN private.pack_picker_ids(j.site_id,j.country_code,j.order_ref);
END; $$;
REVOKE ALL ON FUNCTION private.pack_excluded_workers(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.pack_excluded_workers(uuid) TO authenticated;
CREATE FUNCTION public.pack_excluded_workers(p_pack_job_id uuid) RETURNS text[] LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.pack_excluded_workers(p_pack_job_id); $$;
REVOKE ALL ON FUNCTION public.pack_excluded_workers(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.pack_excluded_workers(uuid) TO authenticated;

CREATE FUNCTION private.guard_independent_packing() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE excluded text[];actor text:=public.get_my_employee_id()::text; changed boolean:=true;
BEGIN
 IF NEW.type NOT IN('PICK','PACK') THEN RETURN NEW; END IF;
 IF nullif(NEW.order_ref,'') IS NULL THEN
  IF NEW.type='PACK' THEN RAISE EXCEPTION 'Packing requires its source order reference'; END IF;
  RETURN NEW;
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('independent-pack:'||NEW.site_id::text||':'||NEW.country_code||':'||NEW.order_ref,0));
 IF NEW.type='PICK' THEN
  IF TG_OP='UPDATE' THEN
   IF OLD.status='Completed' AND (NEW.completed_by IS DISTINCT FROM OLD.completed_by OR NEW.order_ref IS DISTINCT FROM OLD.order_ref OR NEW.site_id IS DISTINCT FROM OLD.site_id OR NEW.country_code IS DISTINCT FROM OLD.country_code OR NEW.type IS DISTINCT FROM OLD.type) THEN
    RAISE EXCEPTION 'Completed picker attribution is immutable'; END IF;
  END IF;
  IF EXISTS(SELECT 1 FROM public.wms_jobs k WHERE k.type='PACK' AND k.site_id=NEW.site_id AND k.country_code=NEW.country_code AND k.order_ref=NEW.order_ref
   AND ((nullif(NEW.assigned_to,'') IS NOT NULL AND NEW.assigned_to IN(k.assigned_to,k.completed_by)) OR (nullif(NEW.completed_by,'') IS NOT NULL AND NEW.completed_by IN(k.assigned_to,k.completed_by)))) THEN
   RAISE EXCEPTION 'The same employee cannot pick and pack this order' USING ERRCODE='42501'; END IF;
  RETURN NEW;
 END IF;
 excluded:=private.pack_picker_ids(NEW.site_id,NEW.country_code,NEW.order_ref);
 IF nullif(NEW.assigned_to,'')=ANY(excluded) OR nullif(NEW.completed_by,'')=ANY(excluded) THEN
  RAISE EXCEPTION 'Assign a different employee: this worker handled the PICK for this order' USING ERRCODE='42501'; END IF;
 IF TG_OP='UPDATE' THEN
  changed:=NEW.line_items IS DISTINCT FROM OLD.line_items OR NEW.status IS DISTINCT FROM OLD.status OR NEW.pack_security_seal_serial IS DISTINCT FROM OLD.pack_security_seal_serial;
  IF NEW.type IS DISTINCT FROM OLD.type OR NEW.order_ref IS DISTINCT FROM OLD.order_ref OR NEW.site_id IS DISTINCT FROM OLD.site_id OR NEW.country_code IS DISTINCT FROM OLD.country_code THEN RAISE EXCEPTION 'Packing order identity is immutable'; END IF;
 END IF;
 IF changed AND actor=ANY(excluded) AND (NEW.status='Completed' OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(NEW.line_items,'[]'))i WHERE coalesce((i->>'packedQty')::numeric,0)>0 OR coalesce((i->>'packed')::boolean,false))) THEN
  RAISE EXCEPTION 'Independent verification required: the picker cannot record packing for this order' USING ERRCODE='42501'; END IF;
 IF NEW.status='Completed' AND (actor IS NULL OR NEW.completed_by IS DISTINCT FROM actor OR NEW.assigned_to IS DISTINCT FROM actor) THEN
  RAISE EXCEPTION 'Packing completion must identify the authenticated assigned verifier' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.guard_independent_packing() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_independent_packing BEFORE INSERT OR UPDATE ON public.wms_jobs FOR EACH ROW EXECUTE FUNCTION private.guard_independent_packing();

CREATE FUNCTION private.guard_independent_pack_assignment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE;
BEGIN
 IF NEW.status IN('Cancelled','Completed') THEN RETURN NEW; END IF;
 SELECT * INTO j FROM public.wms_jobs WHERE id=NEW.job_id;
 IF j.type='PACK' AND NEW.employee_id::text=ANY(private.pack_picker_ids(j.site_id,j.country_code,j.order_ref)) THEN
  RAISE EXCEPTION 'The picker cannot be assigned to verify packing for the same order' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.guard_independent_pack_assignment() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_independent_pack_assignment BEFORE INSERT OR UPDATE ON public.job_assignments FOR EACH ROW EXECUTE FUNCTION private.guard_independent_pack_assignment();
