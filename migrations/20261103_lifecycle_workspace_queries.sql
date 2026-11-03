BEGIN;
CREATE FUNCTION public.list_lifecycle_targets(p_kind text,p_country text,p_search text DEFAULT '',p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid,label text,state text) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.uid() IS NULL OR p_country NOT IN ('ET','KE') OR length(coalesce(p_search,''))>100 OR p_offset<0 OR p_offset>10000 THEN
   RAISE EXCEPTION 'A valid authenticated country scope is required'; END IF;
 RETURN QUERY SELECT candidate.id,candidate.label,candidate.state FROM (
   SELECT e.id,e.name AS label,e.status::text AS state,e.site_id,s.country::text AS country
   FROM public.employees e JOIN public.sites s ON s.id=e.site_id
   WHERE p_kind='employee' AND e.status<>'Terminated'
   UNION ALL
   SELECT s.id,s.name,s.status::text,s.id,s.country::text FROM public.sites s
   WHERE p_kind='site' AND s.status<>'Closed' AND s.type IN ('Store','Warehouse','Distribution Center')
   UNION ALL
   SELECT p.id,coalesce(p.po_number,p.id::text),p.status,p.site_id,p.country_code::text
   FROM public.purchase_orders p WHERE p_kind='purchase_order' AND p.status IN ('Draft','Pending')
   UNION ALL
   SELECT t.id,coalesce(t.order_ref,t.id::text),t.status::text,t.source_site_id,t.country_code
   FROM public.transfers t WHERE p_kind='transfer' AND t.status IN ('Requested','Rejected')
     AND t.dispatched_at IS NULL AND t.shipped_at IS NULL AND t.received_at IS NULL AND t.approved_at IS NULL
     AND private.lifecycle_visible(t.dest_site_id,t.country_code)
 ) candidate WHERE upper(candidate.country)=p_country AND private.lifecycle_visible(candidate.site_id,candidate.country)
   AND candidate.label ILIKE '%'||coalesce(p_search,'')||'%'
 ORDER BY candidate.label,candidate.id LIMIT 25 OFFSET p_offset;
END;
$$;
REVOKE ALL ON FUNCTION public.list_lifecycle_targets(text,text,text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.list_lifecycle_targets(text,text,text,integer) TO authenticated;
CREATE FUNCTION public.withdraw_record_lifecycle(p_request_id uuid,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.record_lifecycle_requests%ROWTYPE; actor public.employees%ROWTYPE;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,''))='active' FOR SHARE;
 SELECT * INTO r FROM public.record_lifecycle_requests WHERE id=p_request_id FOR UPDATE;
 IF actor.id IS NULL OR r.requested_by IS DISTINCT FROM actor.id OR r.status NOT IN ('Pending','Operations cleared','Finance cleared')
   OR NOT private.lifecycle_visible(r.site_id,r.country_code) OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 10 AND 1200 THEN
   RAISE EXCEPTION 'Only the active requester may withdraw an open request with a reason'; END IF;
 UPDATE public.record_lifecycle_requests SET status='Withdrawn',reviewed_by=actor.id,reviewed_at=now(),decision_reason=btrim(p_reason) WHERE id=r.id;
 INSERT INTO public.record_lifecycle_events(request_id,actor_id,actor_name,actor_role,action,reason,before_state,after_state)
 VALUES(r.id,actor.id,actor.name,actor.role,'Withdrawn',btrim(p_reason),r.original_state,r.original_state);
 RETURN jsonb_build_object('request_id',r.id,'status','Withdrawn');
END;
$$;
REVOKE ALL ON FUNCTION public.withdraw_record_lifecycle(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.withdraw_record_lifecycle(uuid,text) TO authenticated;

CREATE FUNCTION private.guard_closed_operational_facility() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE payload jsonb:=to_jsonb(NEW); target uuid; assigned public.employees%ROWTYPE;
BEGIN
 FOR target IN SELECT DISTINCT value::uuid FROM jsonb_each_text(payload)
   WHERE key IN ('site_id','source_site_id','dest_site_id') AND value IS NOT NULL LOOP
   PERFORM 1 FROM public.sites WHERE id=target AND status='Closed' FOR SHARE;
   IF FOUND THEN RAISE EXCEPTION 'This facility is closed to new operational changes'; END IF;
 END LOOP;
 IF TG_TABLE_NAME='wms_jobs' AND nullif(payload->>'assigned_to','') IS NOT NULL THEN
   SELECT * INTO assigned FROM public.employees WHERE id::text=payload->>'assigned_to' OR name=payload->>'assigned_to' LIMIT 1 FOR SHARE;
   IF FOUND AND assigned.status<>'Active' THEN RAISE EXCEPTION 'Warehouse jobs require an active assigned employee'; END IF;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.guard_closed_operational_facility() FROM PUBLIC,anon,authenticated;
DO $$ DECLARE target text; BEGIN
 FOREACH target IN ARRAY ARRAY['employees','purchase_orders','transfers','sales','expenses','products','wms_jobs','shifts'] LOOP
 EXECUTE format('CREATE TRIGGER guard_closed_operational_facility BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.guard_closed_operational_facility()',target);
 END LOOP;
END; $$;
COMMIT;
