-- An employee may handle one warehouse stage per source order, within a national boundary.
CREATE FUNCTION private.floor_stage_excluded(p_job_id uuid) RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 WITH target AS (SELECT * FROM public.wms_jobs WHERE id=p_job_id), siblings AS (
  SELECT j.* FROM public.wms_jobs j CROSS JOIN target t WHERE j.country_code=t.country_code
   AND j.order_ref=t.order_ref AND nullif(t.order_ref,'') IS NOT NULL AND j.id<>t.id AND j.type<>t.type
   AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') AND j.status NOT IN('Cancelled','Deleted')
 ), actors AS (
  SELECT nullif(completed_by,'') id FROM siblings UNION SELECT nullif(assigned_to,'') FROM siblings
  UNION SELECT a.employee_id::text FROM public.job_assignments a JOIN siblings s ON s.id=a.job_id
 ) SELECT coalesce(array_agg(DISTINCT id),'{}'::text[]) FROM actors WHERE id IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION private.floor_stage_excluded(uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.floor_stage_excluded_workers(p_job_id uuid) RETURNS text[] LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE;
BEGIN
 SELECT * INTO j FROM public.wms_jobs WHERE id=p_job_id;
 IF auth.uid() IS NULL OR j.id IS NULL OR NOT public.is_site_in_my_authorized_scope(j.site_id::text,j.country_code) THEN RAISE EXCEPTION 'Job is outside the authorized facility' USING ERRCODE='42501'; END IF;
 IF j.type NOT IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') THEN RETURN '{}'; END IF;
 RETURN private.floor_stage_excluded(j.id);
END; $$;
REVOKE ALL ON FUNCTION private.floor_stage_excluded_workers(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.floor_stage_excluded_workers(uuid) TO authenticated;
CREATE FUNCTION public.floor_stage_excluded_workers(p_job_id uuid) RETURNS text[] LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.floor_stage_excluded_workers(p_job_id); $$;
REVOKE ALL ON FUNCTION public.floor_stage_excluded_workers(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.floor_stage_excluded_workers(uuid) TO authenticated;

CREATE FUNCTION private.guard_independent_floor_stages() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE excluded text[];actor text:=public.get_my_employee_id()::text; old_type text; operation boolean:=true;
BEGIN
 IF TG_OP='UPDATE' THEN
  old_type:=OLD.type;
  IF OLD.status='Completed' AND OLD.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS')
   AND (NEW.type IS DISTINCT FROM OLD.type OR NEW.order_ref IS DISTINCT FROM OLD.order_ref OR NEW.country_code IS DISTINCT FROM OLD.country_code OR NEW.completed_by IS DISTINCT FROM OLD.completed_by) THEN RAISE EXCEPTION 'Completed stage attribution is immutable'; END IF;
 END IF;
 IF NEW.type NOT IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') OR nullif(NEW.order_ref,'') IS NULL THEN RETURN NEW; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('independent-floor:'||NEW.country_code||':'||NEW.order_ref,0));
 SELECT coalesce(array_agg(DISTINCT id),'{}'::text[]) INTO excluded FROM (
  SELECT nullif(j.completed_by,'') id FROM public.wms_jobs j WHERE j.id<>NEW.id AND j.order_ref=NEW.order_ref AND j.country_code=NEW.country_code AND j.type<>NEW.type AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') AND j.status NOT IN('Cancelled','Deleted')
  UNION SELECT nullif(j.assigned_to,'') FROM public.wms_jobs j WHERE j.id<>NEW.id AND j.order_ref=NEW.order_ref AND j.country_code=NEW.country_code AND j.type<>NEW.type AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') AND j.status NOT IN('Cancelled','Deleted')
  UNION SELECT a.employee_id::text FROM public.job_assignments a JOIN public.wms_jobs j ON j.id=a.job_id WHERE j.id<>NEW.id AND j.order_ref=NEW.order_ref AND j.country_code=NEW.country_code AND j.type<>NEW.type AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') AND j.status NOT IN('Cancelled','Deleted')
 ) actors WHERE id IS NOT NULL;
 IF nullif(NEW.assigned_to,'')=ANY(excluded) OR nullif(NEW.completed_by,'')=ANY(excluded) THEN RAISE EXCEPTION 'Independent worker required: this employee already handled another stage of this order' USING ERRCODE='42501'; END IF;
 IF TG_OP='UPDATE' THEN operation:=NEW.line_items IS DISTINCT FROM OLD.line_items OR NEW.status IS DISTINCT FROM OLD.status; END IF;
 IF operation AND actor=ANY(excluded) THEN
  -- Creating the unassigned downstream task is a handoff, not doing its work.
  IF TG_OP='INSERT' AND nullif(NEW.assigned_to,'') IS NULL AND NEW.status='Pending' THEN RETURN NEW; END IF;
  RAISE EXCEPTION 'You cannot perform two different warehouse stages for the same order' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.guard_independent_floor_stages() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_independent_floor_stages BEFORE INSERT OR UPDATE ON public.wms_jobs FOR EACH ROW EXECUTE FUNCTION private.guard_independent_floor_stages();

CREATE FUNCTION private.guard_floor_stage_assignment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE;
BEGIN
 SELECT * INTO j FROM public.wms_jobs WHERE id=NEW.job_id;
 IF j.type NOT IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') OR nullif(j.order_ref,'') IS NULL OR NEW.status='Cancelled' THEN RETURN NEW; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('independent-floor:'||j.country_code||':'||j.order_ref,0));
 IF NEW.employee_id::text=ANY(private.floor_stage_excluded(j.id)) THEN RAISE EXCEPTION 'Employee already handled another stage of this order' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.guard_floor_stage_assignment() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_floor_stage_assignment BEFORE INSERT OR UPDATE ON public.job_assignments FOR EACH ROW EXECUTE FUNCTION private.guard_floor_stage_assignment();
