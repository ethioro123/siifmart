BEGIN;
ALTER TABLE private.blind_receipt_decisions ADD COLUMN previous_quantity numeric;
CREATE INDEX blind_receipt_counts_lines ON private.blind_receipt_counts USING gin(lines jsonb_path_ops);
CREATE OR REPLACE FUNCTION private.decide_blind_receipt(p_receipt uuid,p_correction uuid,p_approve boolean,p_reason text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r private.blind_receipt_counts%ROWTYPE; c private.blind_receipt_corrections%ROWTYPE; d private.blind_receipt_decisions%ROWTYPE;
 j public.wms_jobs%ROWTYPE; item public.po_items%ROWTYPE; actor public.employees%ROWTYPE; delta numeric; tolerance numeric;
BEGIN
 SELECT * INTO STRICT r FROM private.blind_receipt_counts WHERE id=p_receipt;
 PERFORM private.blind_receipt_scope(r.site_id,r.country_code);
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid();
 IF NOT private.blind_receipt_manager(r.site_id,r.country_code) OR actor.id=r.employee_id THEN
 RAISE EXCEPTION 'Independent manager required' USING ERRCODE='42501'; END IF;
 IF p_approve IS NULL OR length(btrim(coalesce(p_reason,''))) NOT BETWEEN 3 AND 1200 THEN RAISE EXCEPTION 'A decision reason is required'; END IF;
 PERFORM 1 FROM public.purchase_orders WHERE id=r.po_id FOR UPDATE;
 SELECT * INTO item FROM public.po_items WHERE id=r.item_id FOR UPDATE;
 SELECT * INTO d FROM private.blind_receipt_decisions WHERE receipt_id=r.id AND correction_id IS NOT DISTINCT FROM p_correction;
 IF d.id IS NOT NULL THEN
 IF (d.approve,d.reason,d.reviewer_id) IS DISTINCT FROM (p_approve,btrim(p_reason),actor.id) THEN RAISE EXCEPTION 'Review cannot be overwritten'; END IF;
 RETURN jsonb_build_object('id',d.id,'saved',true); END IF;
 IF p_correction IS NOT NULL THEN
 SELECT * INTO c FROM private.blind_receipt_corrections WHERE id=p_correction AND receipt_id=r.id;
 IF c.id IS NULL OR c.requested_by=actor.id THEN RAISE EXCEPTION 'Independent correction review required'; END IF;
 IF p_approve THEN
 SELECT * INTO j FROM public.wms_jobs WHERE id=c.job_id FOR UPDATE;
 IF j.status<>'Pending' OR j.assigned_to IS NOT NULL OR EXISTS(SELECT 1 FROM public.job_assignments WHERE job_id=j.id) THEN
 RAISE EXCEPTION 'Putaway has started; use the inventory adjustment approval workflow'; END IF;
 delta:=c.quantity-(j.line_items->0->>'expectedQty')::numeric;
 SELECT coalesce((country_configs->r.country_code->>'overReceiveTolerancePct')::numeric,0) INTO tolerance FROM public.system_config LIMIT 1;
 IF item.received_qty+delta<0 OR item.received_qty+delta>private.po_expected_sellable_units(item)*(1+least(100,greatest(0,coalesce(tolerance,0)))/100) THEN
 RAISE EXCEPTION 'Correction exceeds the permitted intake'; END IF;
 END IF;
 ELSE
 IF NOT p_approve THEN RAISE EXCEPTION 'Record review or decide a specific correction'; END IF;
 IF EXISTS(SELECT 1 FROM private.blind_receipt_corrections c WHERE receipt_id=r.id AND NOT EXISTS(SELECT 1 FROM private.blind_receipt_decisions d WHERE d.correction_id=c.id)) THEN
 RAISE EXCEPTION 'Decide the pending correction before completing review'; END IF;
 END IF;
 INSERT INTO private.blind_receipt_decisions(receipt_id,correction_id,approve,reason,reviewer_id,reviewer_name,previous_quantity)
 VALUES(r.id,p_correction,p_approve,btrim(p_reason),actor.id,actor.name,CASE WHEN p_correction IS NOT NULL AND p_approve THEN (j.line_items->0->>'expectedQty')::numeric END) RETURNING * INTO d;
 IF p_correction IS NOT NULL AND p_approve THEN
 UPDATE public.wms_jobs SET line_items=jsonb_set(line_items,'{0,expectedQty}',to_jsonb(c.quantity)),updated_at=now() WHERE id=c.job_id;
 UPDATE public.po_items SET received_qty=received_qty+delta WHERE id=item.id;
 END IF;
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('BLIND_RECEIPT_REVIEWED','Fulfillment',actor.id,r.site_id,r.country_code,'purchase_order',r.po_id::text,
 jsonb_build_object('receiptId',r.id,'correctionId',p_correction,'approved',p_approve,'reason',btrim(p_reason))::text);
 RETURN jsonb_build_object('id',d.id,'saved',true);
END; $$;
CREATE OR REPLACE FUNCTION private.guard_po_item_delete_evidence() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='DELETE' THEN
   IF coalesce(OLD.received_qty,0)<>0 THEN RAISE EXCEPTION 'Receiving evidence cannot be deleted' USING ERRCODE='42501'; END IF;
   RETURN OLD;
 END IF;
 -- A decrease is allowed only for the exact independently approved, unstarted correction.
 IF NEW.received_qty<OLD.received_qty AND NEW.received_qty>0
 AND (to_jsonb(NEW)-'received_qty')=(to_jsonb(OLD)-'received_qty')
 AND EXISTS(SELECT 1 FROM private.blind_receipt_counts r
 JOIN private.blind_receipt_corrections c ON c.receipt_id=r.id
 JOIN private.blind_receipt_decisions d ON d.correction_id=c.id
 JOIN public.wms_jobs j ON j.id=c.job_id
 WHERE r.item_id=OLD.id AND r.po_id=OLD.po_id AND d.approve
 AND d.reviewer_id=auth.uid() AND d.reviewer_id<>r.employee_id
 AND d.created_at=transaction_timestamp() AND d.previous_quantity IS NOT NULL
 AND NEW.received_qty=OLD.received_qty+c.quantity-d.previous_quantity
 AND j.status='Pending' AND j.assigned_to IS NULL
 AND NOT EXISTS(SELECT 1 FROM public.job_assignments a WHERE a.job_id=j.id)) THEN RETURN NEW; END IF;
 IF coalesce(OLD.received_qty,0)<>0 AND
   (coalesce(NEW.received_qty,0)<OLD.received_qty OR coalesce(NEW.received_qty,0)=0
     OR NEW.product_id IS DISTINCT FROM OLD.product_id OR NEW.po_id IS DISTINCT FROM OLD.po_id) THEN
   RAISE EXCEPTION 'Receiving evidence requires a reviewed reversal; it cannot be erased or reassigned' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END;
$$;
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
 (NOT EXISTS(SELECT 1 FROM private.blind_receipt_decisions d WHERE d.receipt_id=r.id AND d.correction_id IS NULL)
 OR EXISTS(SELECT 1 FROM private.blind_receipt_corrections c WHERE c.receipt_id=r.id AND NOT EXISTS(SELECT 1 FROM private.blind_receipt_decisions d WHERE d.correction_id=c.id))) THEN
 RAISE EXCEPTION 'Independent receiving review is required before putaway'; END IF;
 RETURN NEW;
END; $$;
COMMIT;
