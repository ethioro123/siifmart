BEGIN;
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
 IF EXISTS(SELECT 1 FROM private.blind_receipt_corrections pending_correction WHERE pending_correction.receipt_id=r.id AND NOT EXISTS(SELECT 1 FROM private.blind_receipt_decisions review_decision WHERE review_decision.correction_id=pending_correction.id)) THEN
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
COMMIT;
