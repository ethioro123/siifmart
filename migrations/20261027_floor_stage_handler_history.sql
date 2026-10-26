-- Preserve every prior handler without preventing correction of a legacy conflicting assignment.
CREATE TABLE private.floor_stage_handlers (
 country_code text NOT NULL, order_ref text NOT NULL, stage text NOT NULL, employee_id text NOT NULL,
 first_seen_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(country_code,order_ref,stage,employee_id)
);
ALTER TABLE private.floor_stage_handlers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.floor_stage_handlers FROM PUBLIC,anon,authenticated;
INSERT INTO private.floor_stage_handlers(country_code,order_ref,stage,employee_id)
 SELECT j.country_code,j.order_ref,j.type,actor FROM public.wms_jobs j
 CROSS JOIN LATERAL (SELECT nullif(j.assigned_to,'') actor UNION SELECT nullif(j.completed_by,'') UNION SELECT a.employee_id::text FROM public.job_assignments a WHERE a.job_id=j.id) actors
 WHERE j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') AND nullif(j.order_ref,'') IS NOT NULL AND j.country_code IS NOT NULL AND actor IS NOT NULL
 ON CONFLICT DO NOTHING;
CREATE FUNCTION private.remember_floor_stage_handlers() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') AND nullif(NEW.order_ref,'') IS NOT NULL THEN
  INSERT INTO private.floor_stage_handlers(country_code,order_ref,stage,employee_id)
   SELECT NEW.country_code,NEW.order_ref,NEW.type,id FROM (SELECT nullif(NEW.assigned_to,'') id UNION SELECT nullif(NEW.completed_by,'')) actors WHERE id IS NOT NULL ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.remember_floor_stage_handlers() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER aa_remember_floor_stage_handlers BEFORE INSERT OR UPDATE ON public.wms_jobs FOR EACH ROW EXECUTE FUNCTION private.remember_floor_stage_handlers();
CREATE OR REPLACE FUNCTION private.floor_stage_excluded(p_job_id uuid) RETURNS text[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 WITH target AS (SELECT * FROM public.wms_jobs WHERE id=p_job_id), siblings AS (
  SELECT j.* FROM public.wms_jobs j CROSS JOIN target t WHERE j.country_code=t.country_code
   AND j.order_ref=t.order_ref AND nullif(t.order_ref,'') IS NOT NULL AND j.id<>t.id AND j.type<>t.type
   AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS')
 ), actors AS (
  SELECT nullif(completed_by,'') id FROM siblings UNION SELECT nullif(assigned_to,'') FROM siblings
  UNION SELECT a.employee_id::text FROM public.job_assignments a JOIN siblings s ON s.id=a.job_id
  UNION SELECT h.employee_id FROM private.floor_stage_handlers h CROSS JOIN target t WHERE h.country_code=t.country_code AND h.order_ref=t.order_ref AND h.stage<>t.type
 ) SELECT coalesce(array_agg(DISTINCT id),'{}'::text[]) FROM actors WHERE id IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION private.floor_stage_excluded(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.guard_independent_floor_stages() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE excluded text[];actor text:=public.get_my_employee_id()::text; old_type text; operation boolean:=true;
BEGIN
 IF TG_OP='UPDATE' AND OLD.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') THEN
  IF NEW.type IS DISTINCT FROM OLD.type OR NEW.order_ref IS DISTINCT FROM OLD.order_ref OR NEW.country_code IS DISTINCT FROM OLD.country_code OR NEW.site_id IS DISTINCT FROM OLD.site_id THEN
   RAISE EXCEPTION 'Warehouse stage order identity is immutable' USING ERRCODE='42501'; END IF;
  IF OLD.status='Completed' AND NEW.completed_by IS DISTINCT FROM OLD.completed_by THEN
   RAISE EXCEPTION 'Completed stage attribution is immutable' USING ERRCODE='42501'; END IF;
 END IF;
 IF NEW.type NOT IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') OR nullif(NEW.order_ref,'') IS NULL THEN RETURN NEW; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('independent-floor:'||NEW.country_code||':'||NEW.order_ref,0));
 SELECT coalesce(array_agg(DISTINCT id),'{}'::text[]) INTO excluded FROM (
  SELECT nullif(j.completed_by,'') id FROM public.wms_jobs j WHERE j.id<>NEW.id AND j.order_ref=NEW.order_ref AND j.country_code=NEW.country_code AND j.type<>NEW.type AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS')
  UNION SELECT nullif(j.assigned_to,'') FROM public.wms_jobs j WHERE j.id<>NEW.id AND j.order_ref=NEW.order_ref AND j.country_code=NEW.country_code AND j.type<>NEW.type AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS')
  UNION SELECT a.employee_id::text FROM public.job_assignments a JOIN public.wms_jobs j ON j.id=a.job_id WHERE j.id<>NEW.id AND j.order_ref=NEW.order_ref AND j.country_code=NEW.country_code AND j.type<>NEW.type AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS')
  UNION SELECT h.employee_id FROM private.floor_stage_handlers h WHERE h.country_code=NEW.country_code AND h.order_ref=NEW.order_ref AND h.stage<>NEW.type
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

