-- Scope source locks before obtaining evidence, including transfer origin country.
CREATE OR REPLACE FUNCTION public.record_pos_manager_review(p_site uuid,p_country text,p_source text,p_id uuid,p_fingerprint text,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE evidence jsonb; actor public.employees%ROWTYPE; saved private.pos_manager_review_notes%ROWTYPE;
BEGIN
 PERFORM private.require_pos_manager_review(p_site,p_country);
 IF length(btrim(coalesce(p_reason,''))) NOT BETWEEN 5 AND 1200 THEN RAISE EXCEPTION 'Review reason required'; END IF;
 CASE p_source
 WHEN 'sale' THEN PERFORM 1 FROM public.sales WHERE id=p_id AND site_id=p_site AND country_code=p_country FOR UPDATE;
 WHEN 'shift' THEN PERFORM 1 FROM public.shifts WHERE id=p_id AND site_id=p_site AND country_code=p_country FOR UPDATE;
 WHEN 'drop' THEN PERFORM 1 FROM public.pos_cash_drops WHERE id=p_id AND site_id=p_site::text AND country_code=p_country FOR UPDATE;
 WHEN 'return' THEN PERFORM 1 FROM public.fulfillment_return_requests WHERE id=p_id AND site_id=p_site AND country_code=p_country FOR UPDATE;
 WHEN 'receiving' THEN PERFORM 1 FROM public.transfers WHERE id=p_id AND dest_site_id=p_site AND country_code=p_country AND EXISTS(SELECT 1 FROM public.sites origin WHERE origin.id=source_site_id AND upper(origin.country)=p_country) FOR UPDATE;
 WHEN 'event' THEN PERFORM 1 FROM public.pos_shift_events WHERE id=p_id AND site_id=p_site AND country_code=p_country FOR UPDATE;
 ELSE RAISE EXCEPTION 'Unsupported source'; END CASE;
 evidence:=public.pos_manager_review_detail(p_site,p_country,p_source,p_id,0);
 IF NOT coalesce((evidence->>'can_note')::boolean,false) THEN RAISE EXCEPTION 'Independent manager required' USING ERRCODE='42501'; END IF;
 IF evidence->>'fingerprint' IS DISTINCT FROM p_fingerprint THEN RAISE EXCEPTION 'Evidence changed; refresh the record' USING ERRCODE='40001'; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid();
 SELECT * INTO saved FROM private.pos_manager_review_notes WHERE site_id=p_site AND country_code=p_country AND source=p_source AND target_id=p_id AND fingerprint=p_fingerprint AND reviewer_id=actor.id;
 IF saved.id IS NOT NULL THEN
  IF saved.reason<>btrim(p_reason) THEN RAISE EXCEPTION 'Recorded notes cannot be overwritten'; END IF;
  RETURN jsonb_build_object('id',saved.id,'saved',true);
 END IF;
 INSERT INTO private.pos_manager_review_notes(site_id,country_code,source,target_id,fingerprint,reviewer_id,reviewer_name,reason)
 VALUES(p_site,p_country,p_source,p_id,p_fingerprint,actor.id,actor.name,btrim(p_reason)) RETURNING * INTO saved;
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('POS_MANAGER_REVIEW','POS',actor.id::text,p_site::text,p_country,p_source,p_id::text,jsonb_build_object('reviewId',saved.id,'observationOnly',true)::text);
 RETURN jsonb_build_object('id',saved.id,'saved',true);
END $$;
