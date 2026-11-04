-- POS review is observational; business decisions remain in their existing guarded RPCs.
CREATE TABLE private.pos_manager_review_notes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),site_id uuid NOT NULL REFERENCES public.sites(id),
 country_code text NOT NULL,source text NOT NULL,target_id uuid NOT NULL,fingerprint text NOT NULL,
 reviewer_id uuid NOT NULL,reviewer_name text NOT NULL,reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 5 AND 1200),
 created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(site_id,country_code,source,target_id,fingerprint,reviewer_id)
);
ALTER TABLE private.pos_manager_review_notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.pos_manager_review_notes FROM PUBLIC,anon,authenticated;
CREATE INDEX pos_manager_review_notes_target ON private.pos_manager_review_notes(site_id,country_code,source,target_id,created_at DESC);
CREATE FUNCTION private.require_pos_manager_review(p_site uuid,p_country text) RETURNS void
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.employees e JOIN public.sites h ON h.id=e.site_id JOIN public.sites s ON s.id=p_site
 WHERE e.id=auth.uid() AND lower(e.status)='active' AND upper(s.country)=p_country
 AND (e.role='group_ceo' OR upper(h.country)=p_country)
 AND e.role IN('group_ceo','country_managing_director','country_operations_director','regional_operations_manager','area_operations_manager',
 'store_manager','assistant_store_manager','head_cashier','shift_supervisor','inventory_manager')
 AND public.is_site_in_my_authorized_scope(s.id::text,p_country)) THEN
 RAISE EXCEPTION 'Authorized POS manager at this facility required' USING ERRCODE='42501'; END IF;
END $$;
CREATE FUNCTION private.pos_manager_review_rows(p_site uuid,p_country text)
RETURNS TABLE(source text,id uuid,reference text,status text,actor_id text,actor_name text,occurred_at timestamptz,exception boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT 'sale',s.id,coalesce(s.receipt_number,right(s.id::text,8)),s.status::text,s.cashier_id::text,s.cashier_name::text,s.sale_date,
 (lower(coalesce(s.status,'')) NOT IN('completed','paid') OR coalesce(s.discount_amount,0)>0)
 FROM public.sales s WHERE s.site_id=p_site AND s.country_code=p_country
 UNION ALL
 SELECT 'shift',s.id,coalesce(s.shift_number,s.counter_number,right(s.id::text,8)),s.status::text,s.cashier_id::text,s.cashier_name::text,s.start_time,
 (s.count_submitted_at IS NOT NULL AND (coalesce(s.variance,0)<>0 OR s.supervisor_id IS NULL OR s.finance_sign_off_at IS NULL))
 FROM public.shifts s WHERE s.site_id=p_site AND s.country_code=p_country
 UNION ALL
 SELECT 'drop',d.id,coalesce(d.drop_number,right(d.id::text,8)),d.status,d.cashier_id,d.cashier_name,d.created_at,d.status='pending_supervisor'
 FROM public.pos_cash_drops d WHERE d.site_id=p_site::text AND d.country_code=p_country
 UNION ALL
 SELECT 'return',r.id,coalesce(s.receipt_number,right(r.id::text,8)),r.status,r.requested_by::text,
 (SELECT name FROM public.employees WHERE id=r.requested_by),r.requested_at,r.status='pending'
 FROM public.fulfillment_return_requests r LEFT JOIN public.sales s ON s.id=r.sale_id AND s.site_id=r.site_id AND s.country_code=r.country_code
 WHERE r.site_id=p_site AND r.country_code=p_country
 UNION ALL
 SELECT 'receiving',t.id,coalesce(t.order_ref,right(t.id::text,8)),coalesce(t.transfer_status,t.status)::text,t.received_by,t.received_by,
 coalesce(t.received_at,t.created_at),coalesce(t.has_discrepancy,false) OR lower(t.status) NOT IN('received','completed','cancelled','rejected')
 FROM public.transfers t JOIN public.sites origin ON origin.id=t.source_site_id
 WHERE t.dest_site_id=p_site AND t.country_code=p_country AND upper(origin.country)=p_country
 UNION ALL
 SELECT 'event',e.id,e.action,e.action,e.actor_id::text,(SELECT name FROM public.employees WHERE id=e.actor_id),e.created_at,
 e.action ~* '(VOID|DISCOUNT|REFUND|OVERRIDE|DRAWER|KICK|CANCEL)'
 FROM public.pos_shift_events e WHERE e.site_id=p_site AND e.country_code=p_country
$$;
CREATE FUNCTION public.pos_manager_review_queue(p_site uuid,p_country text,p_source text DEFAULT 'all',p_history boolean DEFAULT false,p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 PERFORM private.require_pos_manager_review(p_site,p_country);
 IF p_offset IS NULL OR p_offset<0 OR p_offset>100000 OR p_source NOT IN('all','sale','shift','drop','return','receiving','event','payment') THEN RAISE EXCEPTION 'Invalid review filter'; END IF;
 RETURN coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM (SELECT * FROM private.pos_manager_review_rows(p_site,p_country)
 WHERE (p_source='all' OR source=p_source OR (p_source='payment' AND source='sale' AND lower(status) NOT IN('completed','paid','refunded','partially refunded','cancelled')))
 AND (p_history OR exception) ORDER BY occurred_at DESC,id,source LIMIT 25 OFFSET p_offset)r),'[]');
END $$;
CREATE FUNCTION public.pos_manager_review_detail(p_site uuid,p_country text,p_source text,p_id uuid,p_page integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE summary record;fields jsonb;state jsonb;actor public.employees%ROWTYPE;
BEGIN
 PERFORM private.require_pos_manager_review(p_site,p_country);
 IF p_page IS NULL OR p_page<0 OR p_page>4000 THEN RAISE EXCEPTION 'Invalid evidence page'; END IF;
 SELECT * INTO summary FROM private.pos_manager_review_rows(p_site,p_country) WHERE source=p_source AND id=p_id;
 IF summary.id IS NULL THEN RAISE EXCEPTION 'Record unavailable in this facility' USING ERRCODE='42501'; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid();
 CASE p_source
 WHEN 'sale' THEN
  SELECT to_jsonb(s),jsonb_build_object('total',s.total,'currency',s.currency,'payment',s.payment_method,'discount',s.discount_amount,'reference',s.mobile_transaction_ref)
  INTO state,fields FROM public.sales s WHERE s.id=p_id;
 WHEN 'shift' THEN
  SELECT to_jsonb(s),jsonb_build_object('counter',s.counter_number,'submitted',s.count_submitted_at,'supervisor',s.supervisor_name,'finance',s.finance_sign_off_name,
   'variance',CASE WHEN s.count_submitted_at IS NOT NULL AND s.cashier_id<>actor.id THEN s.variance END)
  INTO state,fields FROM public.shifts s WHERE s.id=p_id;
 WHEN 'drop' THEN
  SELECT to_jsonb(d),jsonb_build_object('amount',d.amount,'currency',d.currency,'bag',d.safe_bag_number,'supervisor',d.supervisor_name)
  INTO state,fields FROM public.pos_cash_drops d WHERE d.id=p_id;
 WHEN 'return' THEN
  SELECT to_jsonb(r),jsonb_build_object('amount',r.refund_amount,'currency',r.currency,'decision',r.decision_reason)
  INTO state,fields FROM public.fulfillment_return_requests r WHERE r.id=p_id;
 WHEN 'receiving' THEN
  -- No manifest, expected quantities or unapproved receiver counts leave this endpoint.
  SELECT to_jsonb(t),jsonb_build_object('reference',t.order_ref,'received',t.received_at,'discrepancy',t.has_discrepancy,'decision',t.discrepancy_resolution_type)
  INTO state,fields FROM public.transfers t WHERE t.id=p_id;
 WHEN 'event' THEN
  SELECT to_jsonb(e),jsonb_build_object('action',e.action) INTO state,fields FROM public.pos_shift_events e WHERE e.id=p_id;
 ELSE RAISE EXCEPTION 'Unsupported review source'; END CASE;
 RETURN jsonb_build_object('summary',to_jsonb(summary),'fields',fields,'fingerprint',md5(state::text),
 'can_note',coalesce(summary.actor_id,'') NOT IN(actor.id::text,actor.name),
 'notes',coalesce((SELECT jsonb_agg(to_jsonb(n)) FROM(SELECT reviewer_name,reason,created_at FROM private.pos_manager_review_notes
 WHERE site_id=p_site AND country_code=p_country AND source=p_source AND target_id=p_id ORDER BY created_at DESC,id LIMIT 25 OFFSET p_page*25)n),'[]'));
END $$;
CREATE FUNCTION public.record_pos_manager_review(p_site uuid,p_country text,p_source text,p_id uuid,p_fingerprint text,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE evidence jsonb; actor public.employees%ROWTYPE; saved private.pos_manager_review_notes%ROWTYPE;
BEGIN
 PERFORM private.require_pos_manager_review(p_site,p_country);
 IF length(btrim(coalesce(p_reason,''))) NOT BETWEEN 5 AND 1200 THEN RAISE EXCEPTION 'Review reason required'; END IF;
 CASE p_source
 WHEN 'sale' THEN PERFORM 1 FROM public.sales WHERE id=p_id FOR UPDATE;
 WHEN 'shift' THEN PERFORM 1 FROM public.shifts WHERE id=p_id FOR UPDATE;
 WHEN 'drop' THEN PERFORM 1 FROM public.pos_cash_drops WHERE id=p_id FOR UPDATE;
 WHEN 'return' THEN PERFORM 1 FROM public.fulfillment_return_requests WHERE id=p_id FOR UPDATE;
 WHEN 'receiving' THEN PERFORM 1 FROM public.transfers WHERE id=p_id FOR UPDATE;
 WHEN 'event' THEN PERFORM 1 FROM public.pos_shift_events WHERE id=p_id FOR UPDATE;
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
REVOKE ALL ON FUNCTION private.require_pos_manager_review(uuid,text),private.pos_manager_review_rows(uuid,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.pos_manager_review_queue(uuid,text,text,boolean,integer),public.pos_manager_review_detail(uuid,text,text,uuid,integer),public.record_pos_manager_review(uuid,text,text,uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.pos_manager_review_queue(uuid,text,text,boolean,integer),public.pos_manager_review_detail(uuid,text,text,uuid,integer),public.record_pos_manager_review(uuid,text,text,uuid,text,text) TO authenticated;
