BEGIN;
CREATE TABLE public.record_lifecycle_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 kind text NOT NULL CHECK(kind IN ('employee','site','purchase_order','transfer')),
 target_id uuid NOT NULL, target_label text NOT NULL, site_id uuid NOT NULL REFERENCES public.sites(id),
 country_code text NOT NULL, region_code text,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 10 AND 1200),
 evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
 original_state jsonb NOT NULL,
 status text NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Operations cleared','Finance cleared','Applied','Rejected')),
 requested_by uuid NOT NULL REFERENCES public.employees(id), requester_name text NOT NULL, requester_role text NOT NULL,
 requested_at timestamptz NOT NULL DEFAULT now(),
 operations_reviewer uuid REFERENCES public.employees(id), finance_reviewer uuid REFERENCES public.employees(id),
 reviewed_by uuid REFERENCES public.employees(id), reviewed_at timestamptz,
 decision_reason text, applied_at timestamptz
);
CREATE UNIQUE INDEX lifecycle_one_open_request ON public.record_lifecycle_requests(kind,target_id)
 WHERE status IN ('Pending','Operations cleared','Finance cleared');
CREATE INDEX lifecycle_country_queue ON public.record_lifecycle_requests(country_code,status,requested_at DESC,id);
CREATE TABLE public.record_lifecycle_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 request_id uuid NOT NULL REFERENCES public.record_lifecycle_requests(id),
 actor_id uuid NOT NULL, actor_name text NOT NULL, actor_role text NOT NULL,
 action text NOT NULL, reason text NOT NULL, before_state jsonb, after_state jsonb,
 occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lifecycle_event_request ON public.record_lifecycle_events(request_id,id);
ALTER TABLE public.record_lifecycle_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.record_lifecycle_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.record_lifecycle_requests,public.record_lifecycle_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.record_lifecycle_requests,public.record_lifecycle_events TO authenticated;

CREATE FUNCTION private.lifecycle_rank(role_name text) RETURNS integer
LANGUAGE sql IMMUTABLE SET search_path='' AS $$
 SELECT CASE WHEN role_name LIKE 'group_%' THEN 5 WHEN role_name LIKE 'country_%' THEN 4
 WHEN role_name LIKE 'regional_%' THEN 3 WHEN role_name='area_operations_manager' THEN 2
 WHEN role_name IN ('store_manager','warehouse_manager','warehouse_operations_manager') THEN 1 ELSE 0 END;
$$;
CREATE FUNCTION private.lifecycle_visible(target_site uuid,target_country text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.employees e JOIN public.sites home ON home.id=e.site_id
 WHERE e.id=auth.uid() AND lower(coalesce(e.status,''))='active'
 AND (e.role='group_ceo' OR upper(home.country)=upper(target_country))
 AND public.is_site_in_my_authorized_scope(target_site::text,target_country));
$$;
REVOKE ALL ON FUNCTION private.lifecycle_rank(text),private.lifecycle_visible(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.lifecycle_rank(text),private.lifecycle_visible(uuid,text) TO authenticated;
CREATE POLICY lifecycle_requests_read ON public.record_lifecycle_requests FOR SELECT TO authenticated
 USING(private.lifecycle_visible(site_id,country_code) AND (requested_by=auth.uid() OR private.lifecycle_rank(public.get_my_role())>0));
CREATE POLICY lifecycle_events_read ON public.record_lifecycle_events FOR SELECT TO authenticated
 USING(EXISTS(SELECT 1 FROM public.record_lifecycle_requests r WHERE r.id=request_id));

CREATE FUNCTION private.lifecycle_immutable_event() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN RAISE EXCEPTION 'Lifecycle evidence cannot be changed or deleted' USING ERRCODE='42501'; END;
$$;
CREATE TRIGGER immutable_lifecycle_events BEFORE UPDATE OR DELETE ON public.record_lifecycle_events
 FOR EACH ROW EXECUTE FUNCTION private.lifecycle_immutable_event();
CREATE TRIGGER preserve_lifecycle_requests BEFORE DELETE ON public.record_lifecycle_requests
 FOR EACH ROW EXECUTE FUNCTION private.lifecycle_immutable_event();
REVOKE ALL ON FUNCTION private.lifecycle_immutable_event() FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.require_active_operational_actor() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL AND session_user IN ('postgres','supabase_admin') THEN
   IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
 END IF;
 IF (auth.jwt()->>'role')='service_role' THEN
   IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,''))='active') THEN
   RAISE EXCEPTION 'An active employee session is required' USING ERRCODE='42501';
 END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF; RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.require_active_operational_actor() FROM PUBLIC,anon,authenticated;
DO $$ DECLARE target text; BEGIN
 FOREACH target IN ARRAY ARRAY['employees','sites','purchase_orders','transfers','sales','expenses','products','wms_jobs','shifts'] LOOP
 EXECUTE format('CREATE TRIGGER require_active_operational_actor BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.require_active_operational_actor()',target);
 END LOOP;
END; $$;
COMMIT;
