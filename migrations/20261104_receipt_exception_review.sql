-- Routine good receipts proceed; manager decisions are needed only for exceptions and corrections.
BEGIN;
CREATE OR REPLACE FUNCTION private.guard_blind_receipt_job() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r private.blind_receipt_counts%ROWTYPE; allowed boolean;
BEGIN
 SELECT x.* INTO r FROM private.blind_receipt_counts x WHERE x.lines @> jsonb_build_array(jsonb_build_object('jobId',OLD.id)) LIMIT 1;
 IF r.id IS NULL THEN IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Submitted receipt evidence cannot be deleted'; END IF;
 IF (NEW.site_id,NEW.country_code,NEW.order_ref,NEW.type) IS DISTINCT FROM (OLD.site_id,OLD.country_code,OLD.order_ref,OLD.type) THEN RAISE EXCEPTION 'Receipt job identity is locked'; END IF;
 IF jsonb_array_length(NEW.line_items) IS DISTINCT FROM 1 OR
 (NEW.line_items->0-'pickedQty'-'status'-'location'-'expectedQty') IS DISTINCT FROM (OLD.line_items->0-'pickedQty'-'status'-'location'-'expectedQty') THEN
 RAISE EXCEPTION 'Submitted receipt lot evidence is locked'; END IF;
 IF NEW.line_items->0->>'expectedQty' IS DISTINCT FROM OLD.line_items->0->>'expectedQty' THEN
 SELECT EXISTS(SELECT 1 FROM private.blind_receipt_corrections c JOIN private.blind_receipt_decisions d ON d.correction_id=c.id
 WHERE c.receipt_id=r.id AND c.job_id=OLD.id AND c.quantity=(NEW.line_items->0->>'expectedQty')::numeric
 AND d.approve AND d.reviewer_id=auth.uid() AND d.created_at=transaction_timestamp()) INTO allowed;
 IF NOT allowed THEN RAISE EXCEPTION 'An independently approved correction is required'; END IF;
 END IF;
 IF NEW.status NOT IN('Pending','Cancelled') AND
 (((r.previous_qty+r.physical_qty>r.expected_qty OR EXISTS(SELECT 1 FROM jsonb_array_elements(r.lines) l WHERE l->>'condition'<>'Good'))
 AND NOT EXISTS(SELECT 1 FROM private.blind_receipt_decisions d WHERE d.receipt_id=r.id AND d.correction_id IS NULL))
 OR EXISTS(SELECT 1 FROM private.blind_receipt_corrections c WHERE c.receipt_id=r.id AND NOT EXISTS(SELECT 1 FROM private.blind_receipt_decisions d WHERE d.correction_id=c.id))) THEN
 RAISE EXCEPTION 'Independent receiving review is required before putaway'; END IF;
 RETURN NEW;
END; $$;
CREATE OR REPLACE FUNCTION private.blind_receipt_needs_review(p_receipt uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM private.blind_receipt_counts r WHERE r.id=p_receipt AND
 (((r.previous_qty+r.physical_qty>r.expected_qty OR EXISTS(SELECT 1 FROM jsonb_array_elements(r.lines) l WHERE l->>'condition'<>'Good'))
 AND NOT EXISTS(SELECT 1 FROM private.blind_receipt_decisions d WHERE d.receipt_id=r.id AND d.correction_id IS NULL))
 OR EXISTS(SELECT 1 FROM private.blind_receipt_corrections c WHERE c.receipt_id=r.id AND NOT EXISTS(SELECT 1 FROM private.blind_receipt_decisions d WHERE d.correction_id=c.id))));
$$;
REVOKE ALL ON FUNCTION private.blind_receipt_needs_review(uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.blind_receipt_queue_filtered(p_site uuid,p_country text,p_before timestamptz,p_before_id uuid,p_exceptions boolean) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 PERFORM private.blind_receipt_scope(p_site,p_country);
 SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]') INTO result FROM (
 SELECT r.id,r.po_number,r.product_name,r.sku,r.employee_name,r.physical_qty,r.created_at,
 EXISTS(SELECT 1 FROM private.blind_receipt_decisions d WHERE d.receipt_id=r.id AND correction_id IS NULL) AS reviewed,
 private.blind_receipt_needs_review(r.id) AS needs_review
 FROM private.blind_receipt_counts r WHERE r.site_id=p_site AND r.country_code=p_country
 AND (r.employee_id=auth.uid() OR private.blind_receipt_manager(p_site,p_country))
 AND (NOT coalesce(p_exceptions,true) OR private.blind_receipt_needs_review(r.id))
 AND (p_before IS NULL OR (r.created_at,r.id)<(p_before,p_before_id))
 ORDER BY r.created_at DESC,r.id DESC LIMIT 25)q;
 RETURN result;
END; $$;
CREATE FUNCTION public.blind_receipt_queue_filtered(p_site uuid,p_country text,p_before timestamptz DEFAULT NULL,p_before_id uuid DEFAULT NULL,p_exceptions boolean DEFAULT true) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.blind_receipt_queue_filtered(p_site,p_country,p_before,p_before_id,p_exceptions); $$;
REVOKE ALL ON FUNCTION private.blind_receipt_queue_filtered(uuid,text,timestamptz,uuid,boolean),public.blind_receipt_queue_filtered(uuid,text,timestamptz,uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.blind_receipt_queue_filtered(uuid,text,timestamptz,uuid,boolean),public.blind_receipt_queue_filtered(uuid,text,timestamptz,uuid,boolean) TO authenticated;
COMMIT;
