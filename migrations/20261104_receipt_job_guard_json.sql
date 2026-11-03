BEGIN;
CREATE OR REPLACE FUNCTION private.guard_blind_receipt_job() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r private.blind_receipt_counts%ROWTYPE; allowed boolean;
BEGIN
 SELECT x.* INTO r FROM private.blind_receipt_counts x WHERE x.lines @> jsonb_build_array(jsonb_build_object('jobId',OLD.id)) LIMIT 1;
 IF r.id IS NULL THEN IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Submitted receipt evidence cannot be deleted'; END IF;
 IF (NEW.site_id,NEW.country_code,NEW.order_ref,NEW.type) IS DISTINCT FROM (OLD.site_id,OLD.country_code,OLD.order_ref,OLD.type) THEN RAISE EXCEPTION 'Receipt job identity is locked'; END IF;
 IF jsonb_array_length(NEW.line_items) IS DISTINCT FROM 1 OR
 ((NEW.line_items->0)-'pickedQty'-'status'-'location'-'expectedQty') IS DISTINCT FROM ((OLD.line_items->0)-'pickedQty'-'status'-'location'-'expectedQty') THEN
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
COMMIT;
