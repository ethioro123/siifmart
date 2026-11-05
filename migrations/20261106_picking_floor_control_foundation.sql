-- Restore missing independent-floor controls without replacing existing upgraded functions.
CREATE TABLE IF NOT EXISTS private.floor_stage_handlers(country_code text NOT NULL,order_ref text NOT NULL,stage text NOT NULL,employee_id text NOT NULL,first_seen_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(country_code,order_ref,stage,employee_id));
ALTER TABLE private.floor_stage_handlers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.floor_stage_handlers FROM PUBLIC,anon,authenticated;
DO $install$ BEGIN IF to_regprocedure('private.claim_fulfillment_stage(text, text, text)') IS NULL THEN EXECUTE $definition$CREATE OR REPLACE FUNCTION private.claim_fulfillment_stage(p_country text, p_order text, p_stage text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE worker text:=auth.uid()::text;
BEGIN
 IF worker IS NULL THEN RAISE EXCEPTION 'Authenticated employee required' USING ERRCODE='42501'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('independent-floor:'||p_country||':'||p_order,0));
 IF EXISTS(SELECT 1 FROM private.floor_stage_handlers h WHERE h.country_code=p_country AND h.order_ref=p_order AND h.employee_id=worker AND h.stage<>p_stage)
 OR EXISTS(SELECT 1 FROM public.wms_jobs j WHERE j.country_code=p_country AND j.order_ref=p_order AND j.type<>p_stage AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') AND (j.assigned_to=worker OR j.completed_by=worker OR EXISTS(SELECT 1 FROM public.job_assignments a WHERE a.job_id=j.id AND a.employee_id::text=worker))) THEN
 RAISE EXCEPTION 'Independent worker required: this employee already handled another stage of this order' USING ERRCODE='42501'; END IF;
 INSERT INTO private.floor_stage_handlers(country_code,order_ref,stage,employee_id) VALUES(p_country,p_order,p_stage,worker) ON CONFLICT DO NOTHING;
END; $function$
;$definition$; END IF; END $install$;
REVOKE ALL ON FUNCTION private.claim_fulfillment_stage(text, text, text) FROM PUBLIC,anon,authenticated;
DO $install$ BEGIN IF to_regprocedure('private.floor_stage_excluded(uuid)') IS NULL THEN EXECUTE $definition$CREATE OR REPLACE FUNCTION private.floor_stage_excluded(p_job_id uuid)
 RETURNS text[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 WITH target AS (SELECT * FROM public.wms_jobs WHERE id=p_job_id), siblings AS (
  SELECT j.* FROM public.wms_jobs j CROSS JOIN target t WHERE j.country_code=t.country_code
   AND j.order_ref=t.order_ref AND nullif(t.order_ref,'') IS NOT NULL AND j.id<>t.id AND j.type<>t.type
   AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS')
 ), actors AS (
  SELECT nullif(completed_by,'') id FROM siblings UNION SELECT nullif(assigned_to,'') FROM siblings
  UNION SELECT a.employee_id::text FROM public.job_assignments a JOIN siblings s ON s.id=a.job_id
  UNION SELECT h.employee_id FROM private.floor_stage_handlers h CROSS JOIN target t WHERE h.country_code=t.country_code AND h.order_ref=t.order_ref AND h.stage<>t.type
 ) SELECT coalesce(array_agg(DISTINCT id),'{}'::text[]) FROM actors WHERE id IS NOT NULL;
$function$
;$definition$; END IF; END $install$;
REVOKE ALL ON FUNCTION private.floor_stage_excluded(uuid) FROM PUBLIC,anon,authenticated;
DO $install$ BEGIN IF to_regprocedure('private.floor_stage_excluded_workers(uuid)') IS NULL THEN EXECUTE $definition$CREATE OR REPLACE FUNCTION private.floor_stage_excluded_workers(p_job_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE j public.wms_jobs%ROWTYPE;
BEGIN
 SELECT * INTO j FROM public.wms_jobs WHERE id=p_job_id;
 IF auth.uid() IS NULL OR j.id IS NULL OR NOT public.is_site_in_my_authorized_scope(j.site_id::text,j.country_code) THEN RAISE EXCEPTION 'Job is outside the authorized facility' USING ERRCODE='42501'; END IF;
 IF j.type NOT IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') THEN RETURN '{}'; END IF;
 RETURN private.floor_stage_excluded(j.id);
END; $function$
;$definition$; END IF; END $install$;
REVOKE ALL ON FUNCTION private.floor_stage_excluded_workers(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.floor_stage_excluded_workers(uuid) TO authenticated;
DO $install$ BEGIN IF to_regprocedure('public.floor_stage_excluded_workers(uuid)') IS NULL THEN EXECUTE $definition$CREATE OR REPLACE FUNCTION public.floor_stage_excluded_workers(p_job_id uuid)
 RETURNS text[]
 LANGUAGE sql
 SET search_path TO ''
AS $function$ SELECT private.floor_stage_excluded_workers(p_job_id); $function$
;$definition$; END IF; END $install$;
REVOKE ALL ON FUNCTION public.floor_stage_excluded_workers(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.floor_stage_excluded_workers(uuid) TO authenticated;
DO $install$ BEGIN IF to_regprocedure('private.guard_floor_stage_assignment()') IS NULL THEN EXECUTE $definition$CREATE OR REPLACE FUNCTION private.guard_floor_stage_assignment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE j public.wms_jobs%ROWTYPE;
BEGIN
 SELECT * INTO j FROM public.wms_jobs WHERE id=NEW.job_id;
 IF j.type NOT IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') OR nullif(j.order_ref,'') IS NULL OR NEW.status='Cancelled' THEN RETURN NEW; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('independent-floor:'||j.country_code||':'||j.order_ref,0));
 IF NEW.employee_id::text=ANY(private.floor_stage_excluded(j.id)) THEN RAISE EXCEPTION 'Employee already handled another stage of this order' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END; $function$
;$definition$; END IF; END $install$;
REVOKE ALL ON FUNCTION private.guard_floor_stage_assignment() FROM PUBLIC,anon,authenticated;
DO $install$ BEGIN IF to_regprocedure('private.retain_floor_stage_history()') IS NULL THEN EXECUTE $definition$CREATE OR REPLACE FUNCTION private.retain_floor_stage_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE job public.wms_jobs%ROWTYPE; protected boolean;
BEGIN
 IF TG_TABLE_NAME='wms_jobs' THEN
   RAISE EXCEPTION 'Warehouse job history must be retained; use cancellation review' USING ERRCODE='42501';
 END IF;
 SELECT * INTO job FROM public.wms_jobs WHERE id=OLD.job_id;
 protected:=OLD.started_at IS NOT NULL OR OLD.completed_at IS NOT NULL OR nullif(job.order_ref,'') IS NOT NULL;
 IF TG_OP='DELETE' THEN
   IF protected THEN RAISE EXCEPTION 'Warehouse assignment history cannot be deleted' USING ERRCODE='42501'; END IF;
   RETURN OLD;
 END IF;
 IF protected AND (NEW.job_id IS DISTINCT FROM OLD.job_id OR NEW.employee_id IS DISTINCT FROM OLD.employee_id
   OR NEW.started_at IS DISTINCT FROM OLD.started_at) THEN
   RAISE EXCEPTION 'Warehouse assignment attribution and start evidence are immutable' USING ERRCODE='42501'; END IF;
 IF OLD.completed_at IS NOT NULL AND (to_jsonb(NEW)-'updated_at') IS DISTINCT FROM (to_jsonb(OLD)-'updated_at') THEN
   RAISE EXCEPTION 'Completed warehouse assignment evidence is immutable' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END;
$function$
;$definition$; END IF; END $install$;
REVOKE ALL ON FUNCTION private.retain_floor_stage_history() FROM PUBLIC,anon,authenticated;
DO $install$ BEGIN IF to_regprocedure('private.remember_floor_stage_handlers()') IS NULL THEN EXECUTE $definition$CREATE OR REPLACE FUNCTION private.remember_floor_stage_handlers()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
 IF NEW.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') AND nullif(NEW.order_ref,'') IS NOT NULL THEN
  INSERT INTO private.floor_stage_handlers(country_code,order_ref,stage,employee_id)
   SELECT NEW.country_code,NEW.order_ref,NEW.type,id FROM (SELECT nullif(NEW.assigned_to,'') id UNION SELECT nullif(NEW.completed_by,'')) actors WHERE id IS NOT NULL ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END; $function$
;$definition$; END IF; END $install$;
REVOKE ALL ON FUNCTION private.remember_floor_stage_handlers() FROM PUBLIC,anon,authenticated;
DO $install$ BEGIN IF to_regprocedure('private.guard_independent_floor_stages()') IS NULL THEN EXECUTE $definition$CREATE OR REPLACE FUNCTION private.guard_independent_floor_stages()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
END; $function$
;$definition$; END IF; END $install$;
REVOKE ALL ON FUNCTION private.guard_independent_floor_stages() FROM PUBLIC,anon,authenticated;
DO $install$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='guard_independent_floor_stages' AND tgrelid='public.wms_jobs'::regclass) THEN EXECUTE $definition$CREATE TRIGGER guard_independent_floor_stages BEFORE INSERT OR UPDATE ON public.wms_jobs FOR EACH ROW EXECUTE FUNCTION private.guard_independent_floor_stages()$definition$; END IF; END $install$;
DO $install$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='guard_floor_stage_assignment' AND tgrelid='public.job_assignments'::regclass) THEN EXECUTE $definition$CREATE TRIGGER guard_floor_stage_assignment BEFORE INSERT OR UPDATE ON public.job_assignments FOR EACH ROW EXECUTE FUNCTION private.guard_floor_stage_assignment()$definition$; END IF; END $install$;
DO $install$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='aa_remember_floor_stage_handlers' AND tgrelid='public.wms_jobs'::regclass) THEN EXECUTE $definition$CREATE TRIGGER aa_remember_floor_stage_handlers BEFORE INSERT OR UPDATE ON public.wms_jobs FOR EACH ROW EXECUTE FUNCTION private.remember_floor_stage_handlers()$definition$; END IF; END $install$;
DO $install$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='retain_floor_assignment_history' AND tgrelid='public.job_assignments'::regclass) THEN EXECUTE $definition$CREATE TRIGGER retain_floor_assignment_history BEFORE DELETE OR UPDATE ON public.job_assignments FOR EACH ROW EXECUTE FUNCTION private.retain_floor_stage_history()$definition$; END IF; END $install$;
DO $install$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='retain_floor_stage_history' AND tgrelid='public.wms_jobs'::regclass) THEN EXECUTE $definition$CREATE TRIGGER retain_floor_stage_history BEFORE DELETE ON public.wms_jobs FOR EACH ROW EXECUTE FUNCTION private.retain_floor_stage_history()$definition$; END IF; END $install$;
INSERT INTO private.floor_stage_handlers(country_code,order_ref,stage,employee_id) SELECT j.country_code,j.order_ref,j.type,actor FROM public.wms_jobs j CROSS JOIN LATERAL(SELECT nullif(j.assigned_to,'') actor UNION SELECT nullif(j.completed_by,'') UNION SELECT a.employee_id::text FROM public.job_assignments a WHERE a.job_id=j.id) actors WHERE j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') AND nullif(j.order_ref,'') IS NOT NULL AND j.country_code IS NOT NULL AND actor IS NOT NULL ON CONFLICT DO NOTHING;
CREATE FUNCTION private.retain_receipt_floor_handler() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ DECLARE country text; BEGIN SELECT country_code INTO country FROM public.purchase_orders WHERE id=NEW.po_id; PERFORM private.claim_fulfillment_stage(country,NEW.po_id::text,'RECEIVE'); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION private.retain_receipt_floor_handler() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER retain_receipt_floor_handler BEFORE INSERT ON private.fulfillment_receipts FOR EACH ROW EXECUTE FUNCTION private.retain_receipt_floor_handler();

