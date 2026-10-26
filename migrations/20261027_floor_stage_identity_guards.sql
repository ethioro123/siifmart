-- Keep order identity and stage attribution stable for independent worker enforcement.
CREATE OR REPLACE FUNCTION private.floor_stage_excluded(p_job_id uuid) RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 WITH target AS (SELECT * FROM public.wms_jobs WHERE id=p_job_id), siblings AS (
  SELECT j.* FROM public.wms_jobs j CROSS JOIN target t WHERE j.country_code=t.country_code
   AND j.order_ref=t.order_ref AND nullif(t.order_ref,'') IS NOT NULL AND j.id<>t.id AND j.type<>t.type
   AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS')
 ), actors AS (
  SELECT nullif(completed_by,'') id FROM siblings UNION SELECT nullif(assigned_to,'') FROM siblings
  UNION SELECT a.employee_id::text FROM public.job_assignments a JOIN siblings s ON s.id=a.job_id
 ) SELECT coalesce(array_agg(DISTINCT id),'{}'::text[]) FROM actors WHERE id IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION private.floor_stage_excluded(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.guard_independent_floor_stages() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE excluded text[];actor text:=public.get_my_employee_id()::text; old_type text; operation boolean:=true;
BEGIN
 IF TG_OP='UPDATE' AND OLD.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') THEN
  IF NEW.type IS DISTINCT FROM OLD.type OR NEW.order_ref IS DISTINCT FROM OLD.order_ref OR NEW.country_code IS DISTINCT FROM OLD.country_code OR NEW.site_id IS DISTINCT FROM OLD.site_id THEN
   RAISE EXCEPTION 'Warehouse stage order identity is immutable' USING ERRCODE='42501'; END IF;
  IF nullif(OLD.assigned_to,'') IS NOT NULL AND NEW.assigned_to IS DISTINCT FROM OLD.assigned_to
   AND NOT EXISTS(SELECT 1 FROM public.job_assignments WHERE job_id=OLD.id AND employee_id::text=OLD.assigned_to) THEN
   RAISE EXCEPTION 'Record existing assignment history before reassigning this order' USING ERRCODE='42501'; END IF;
  IF OLD.status='Completed' AND NEW.completed_by IS DISTINCT FROM OLD.completed_by THEN
   RAISE EXCEPTION 'Completed stage attribution is immutable' USING ERRCODE='42501'; END IF;
 END IF;
 IF NEW.type NOT IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') OR nullif(NEW.order_ref,'') IS NULL THEN RETURN NEW; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('independent-floor:'||NEW.country_code||':'||NEW.order_ref,0));
 SELECT coalesce(array_agg(DISTINCT id),'{}'::text[]) INTO excluded FROM (
  SELECT nullif(j.completed_by,'') id FROM public.wms_jobs j WHERE j.id<>NEW.id AND j.order_ref=NEW.order_ref AND j.country_code=NEW.country_code AND j.type<>NEW.type AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS')
  UNION SELECT nullif(j.assigned_to,'') FROM public.wms_jobs j WHERE j.id<>NEW.id AND j.order_ref=NEW.order_ref AND j.country_code=NEW.country_code AND j.type<>NEW.type AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS')
  UNION SELECT a.employee_id::text FROM public.job_assignments a JOIN public.wms_jobs j ON j.id=a.job_id WHERE j.id<>NEW.id AND j.order_ref=NEW.order_ref AND j.country_code=NEW.country_code AND j.type<>NEW.type AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS')
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

-- Preserve attribution even after cancellation or reassignment; never erase the evidence used by separation checks.
CREATE FUNCTION private.retain_floor_stage_history() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE;
BEGIN
 IF TG_TABLE_NAME='wms_jobs' THEN
  IF OLD.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') AND nullif(OLD.order_ref,'') IS NOT NULL
   AND (nullif(OLD.assigned_to,'') IS NOT NULL OR nullif(OLD.completed_by,'') IS NOT NULL OR EXISTS(SELECT 1 FROM public.job_assignments WHERE job_id=OLD.id)) THEN
   RAISE EXCEPTION 'Retain warehouse stage history; cancel the job instead' USING ERRCODE='42501'; END IF;
 ELSE
  SELECT * INTO j FROM public.wms_jobs WHERE id=OLD.job_id;
  IF j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') AND nullif(j.order_ref,'') IS NOT NULL THEN
   IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Warehouse assignment history cannot be deleted' USING ERRCODE='42501'; END IF;
   IF NEW.job_id IS DISTINCT FROM OLD.job_id OR NEW.employee_id IS DISTINCT FROM OLD.employee_id THEN
    RAISE EXCEPTION 'Warehouse assignment attribution is immutable' USING ERRCODE='42501'; END IF;
  END IF;
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.retain_floor_stage_history() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER retain_floor_stage_history BEFORE DELETE ON public.wms_jobs FOR EACH ROW EXECUTE FUNCTION private.retain_floor_stage_history();
CREATE TRIGGER retain_floor_assignment_history BEFORE DELETE OR UPDATE ON public.job_assignments FOR EACH ROW EXECUTE FUNCTION private.retain_floor_stage_history();
CREATE INDEX IF NOT EXISTS idx_wms_floor_order_country ON public.wms_jobs(country_code,order_ref,type)
 WHERE type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS');
