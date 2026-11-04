BEGIN;
CREATE OR REPLACE FUNCTION private.record_operations_review(p_site uuid,p_country text,p_source text,p_id uuid,p_fingerprint text,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE evidence jsonb; actor public.employees%ROWTYPE; saved uuid;
BEGIN
 PERFORM private.require_operations_review_scope(p_site,p_country);
 IF length(btrim(coalesce(p_reason,''))) NOT BETWEEN 3 AND 1200 OR p_source='receipt' THEN RAISE EXCEPTION 'A review reason and supported operation are required'; END IF;
 -- Serialize against the source state used for this observation.
 CASE p_source WHEN 'job' THEN PERFORM 1 FROM public.wms_jobs WHERE id=p_id FOR UPDATE;
 WHEN 'inventory' THEN PERFORM 1 FROM public.inventory_requests WHERE id=p_id FOR UPDATE;
 WHEN 'return' THEN PERFORM 1 FROM public.fulfillment_return_requests WHERE id=p_id FOR UPDATE;
 WHEN 'count' THEN PERFORM 1 FROM public.wms_count_sessions WHERE id=p_id FOR UPDATE;
 WHEN 'transfer' THEN PERFORM 1 FROM public.transfers WHERE id=p_id FOR UPDATE;
 ELSE RAISE EXCEPTION 'Unsupported operational source'; END CASE;
 evidence:=private.operations_review_detail(p_site,p_country,p_source,p_id,0);
 IF NOT coalesce((evidence->>'can_note')::boolean,false) THEN RAISE EXCEPTION 'Independent manager required' USING ERRCODE='42501'; END IF;
 IF evidence->>'fingerprint' IS DISTINCT FROM p_fingerprint THEN RAISE EXCEPTION 'Operational evidence changed; refresh before reviewing' USING ERRCODE='40001'; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid();
 SELECT id INTO saved FROM private.operations_review_notes WHERE source=p_source AND target_id=p_id AND fingerprint=p_fingerprint AND reviewer_id=actor.id;
 IF saved IS NOT NULL THEN
 IF NOT EXISTS(SELECT 1 FROM private.operations_review_notes WHERE id=saved AND reason=btrim(p_reason)) THEN
 RAISE EXCEPTION 'Existing review note cannot be overwritten'; END IF;
 RETURN jsonb_build_object('id',saved,'saved',true); END IF;
 INSERT INTO private.operations_review_notes(source,target_id,site_id,country_code,fingerprint,reviewer_id,reviewer_name,reason)
 VALUES(p_source,p_id,p_site,p_country,p_fingerprint,actor.id,actor.name,btrim(p_reason)) RETURNING id INTO saved;
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('OPERATIONS_REVIEW_RECORDED','Fulfillment',actor.id,p_site,p_country,p_source,p_id::text,
 jsonb_build_object('reviewId',saved,'reason',btrim(p_reason),'clearsHold',false)::text);
 RETURN jsonb_build_object('id',saved,'saved',true);
END; $$;
COMMIT;
