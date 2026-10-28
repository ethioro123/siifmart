CREATE OR REPLACE FUNCTION private.guard_product_price_retention() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE product uuid; country text; expires timestamptz; held boolean;
BEGIN
 IF TG_TABLE_NAME='product_price_history' THEN
  IF TG_OP='UPDATE' THEN RAISE EXCEPTION 'Applied price history is immutable'; END IF;
  product:=OLD.product_id; country:=OLD.country_code; expires:=OLD.changed_at+interval '10 years';
 ELSE
  IF NOT private.is_price_change(OLD.proposed_changes) OR OLD.change_type<>'edit' THEN RETURN OLD; END IF;
  product:=OLD.product_id::uuid;country:=OLD.country_code;
  IF OLD.status='approved' THEN expires:=CASE WHEN OLD.approved_at IS NOT NULL THEN greatest(OLD.approved_at,OLD.requested_at)+interval '10 years' END;
  ELSIF OLD.status='rejected' THEN expires:=CASE WHEN OLD.rejected_at IS NOT NULL THEN greatest(OLD.rejected_at,OLD.requested_at)+interval '2 years' END;
  ELSE RAISE EXCEPTION 'Pending price proposals cannot be removed by retention'; END IF;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('price-retention:'||upper(country)||':'||product::text,0));
 SELECT EXISTS(SELECT 1 FROM public.product_price_retention_holds h WHERE h.product_id=product AND h.country_code=upper(country) AND h.released_at IS NULL) INTO held;
 IF held OR expires IS NULL OR expires>=statement_timestamp() THEN RAISE EXCEPTION 'Price record is within retention or protected by an audit/dispute hold'; END IF;
 IF TG_TABLE_NAME='inventory_requests' AND EXISTS(SELECT 1 FROM public.product_price_history h WHERE h.request_id=OLD.id) THEN RAISE EXCEPTION 'Retained price history still requires its approval evidence'; END IF;
 RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION private.prune_product_price_history(p_country_code text,p_limit integer DEFAULT 250) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE history_count integer:=0; request_count integer:=0; target record;
BEGIN
 IF p_country_code IS NULL OR p_country_code!~'^[A-Z]{2}$' THEN RAISE EXCEPTION 'A specific country is required for retention'; END IF;
 -- SKIP LOCKED keeps maintenance from blocking live approvals; per-row guards recheck age/holds.
 FOR target IN SELECT h.id FROM public.product_price_history h WHERE h.country_code=p_country_code AND h.changed_at<statement_timestamp()-interval '10 years'
 AND NOT EXISTS(SELECT 1 FROM public.product_price_retention_holds hold WHERE hold.product_id=h.product_id AND hold.country_code=h.country_code AND hold.released_at IS NULL)
 ORDER BY h.changed_at,h.id LIMIT greatest(1,least(coalesce(p_limit,250),1000)) FOR UPDATE OF h SKIP LOCKED LOOP
  BEGIN DELETE FROM public.product_price_history WHERE id=target.id; history_count:=history_count+1; EXCEPTION WHEN raise_exception THEN NULL; END;
 END LOOP;
 FOR target IN SELECT r.id FROM public.inventory_requests r WHERE upper(r.country_code)=p_country_code AND r.change_type='edit' AND private.is_price_change(r.proposed_changes)
 AND ((r.status='approved' AND r.approved_at IS NOT NULL AND greatest(r.approved_at,r.requested_at)<statement_timestamp()-interval '10 years') OR (r.status='rejected' AND r.rejected_at IS NOT NULL AND greatest(r.rejected_at,r.requested_at)<statement_timestamp()-interval '2 years'))
 AND NOT EXISTS(SELECT 1 FROM public.product_price_retention_holds hold WHERE hold.product_id::text=r.product_id AND hold.country_code=p_country_code AND hold.released_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM public.product_price_history h WHERE h.request_id=r.id)
 ORDER BY r.requested_at,r.id LIMIT greatest(1,least(coalesce(p_limit,250),1000)) FOR UPDATE OF r SKIP LOCKED LOOP
  BEGIN DELETE FROM public.inventory_requests WHERE id=target.id; request_count:=request_count+1; EXCEPTION WHEN raise_exception THEN NULL; END;
 END LOOP;
 INSERT INTO private.price_retention_runs(country_code,history_deleted,requests_deleted) VALUES(p_country_code,history_count,request_count);
 RETURN jsonb_build_object('country',p_country_code,'historyDeleted',history_count,'requestsDeleted',request_count);
END;
$$;
