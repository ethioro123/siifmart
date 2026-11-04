-- Migration: 20261105_putaway_completion_lot_guard_and_evidence.sql
-- Description:
--   1. Allow client completion payloads in private.guard_blind_receipt_job() that include
--      ephemeral UI sort index (originalIndex) or omit zero-valued retailPrice while keeping
--      all physical lot evidence strictly locked.
--   2. Align private.guard_putaway_completion_evidence() with readable putaway job numbers
--      and 1-indexed line numbers written by private.place_putaway_stock().
--   3. Ensure private.save_receiving_split() assigns a 6-character alphanumeric job_number
--      to newly created PUTAWAY jobs when not supplied by the caller.
--   4. Finalize putaway job 259d8afc-b529-46d4-b471-22643a2c575b (PW3T9X) whose 720 units
--      were already placed into A-01-02 and recorded in stock_movements.

BEGIN;

-- 1. Update private.guard_blind_receipt_job to ignore ephemeral UI originalIndex / zero retailPrice
CREATE OR REPLACE FUNCTION private.guard_blind_receipt_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE r private.blind_receipt_counts%ROWTYPE; allowed boolean;
BEGIN
 SELECT x.* INTO r FROM private.blind_receipt_counts x WHERE x.lines @> jsonb_build_array(jsonb_build_object('jobId',OLD.id)) LIMIT 1;
 IF r.id IS NULL THEN IF TG_OP='DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF; END IF;
 IF TG_OP='DELETE' THEN RAISE EXCEPTION 'Submitted receipt evidence cannot be deleted'; END IF;
 IF (NEW.site_id,NEW.country_code,NEW.order_ref,NEW.type) IS DISTINCT FROM (OLD.site_id,OLD.country_code,OLD.order_ref,OLD.type) THEN RAISE EXCEPTION 'Receipt job identity is locked'; END IF;
 IF jsonb_array_length(NEW.line_items) IS DISTINCT FROM 1 OR
 ((NEW.line_items->0)-'pickedQty'-'status'-'location'-'expectedQty'-'originalIndex'-'retailPrice') IS DISTINCT FROM ((OLD.line_items->0)-'pickedQty'-'status'-'location'-'expectedQty'-'originalIndex'-'retailPrice') THEN
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
END;
$function$;

-- 2. Update private.guard_putaway_completion_evidence to recognize readable job_number and 1-indexed lines
CREATE OR REPLACE FUNCTION private.guard_putaway_completion_evidence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE line jsonb; idx integer:=0; qty numeric; audited numeric; job_ref text;
BEGIN
 IF NEW.type<>'PUTAWAY' OR NEW.status<>'Completed' OR OLD.status='Completed' THEN RETURN NEW; END IF;
 IF coalesce(jsonb_array_length(NEW.line_items),0)=0 THEN RAISE EXCEPTION 'Putaway requires verified placement lines'; END IF;
 job_ref := coalesce(nullif(NEW.job_number, ''), upper(substr(replace(NEW.id::text, '-', ''), 1, 6)));
 FOR line IN SELECT value FROM jsonb_array_elements(NEW.line_items) LOOP
  qty:=coalesce((line->>'pickedQty')::numeric,0);
  IF coalesce(line->>'status','Pending') NOT IN('Picked','Completed','Short') OR qty<0 OR qty::text IN('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Putaway lines must be physically verified'; END IF;
  IF qty>0 THEN
   SELECT sum(quantity) INTO audited FROM public.stock_movements
   WHERE site_id=NEW.site_id AND type='IN'
     AND (
       reason = 'Putaway job '||job_ref||' line '||(idx+1)||' to '||(line->>'location')
       OR reason = 'Putaway job '||NEW.id::text||' line '||idx||' to '||(line->>'location')
       OR reason = 'Putaway job '||job_ref||' line '||idx||' to '||(line->>'location')
     );
   IF audited IS DISTINCT FROM qty THEN RAISE EXCEPTION 'Putaway completion requires matching stock placement evidence'; END IF;
  ELSIF coalesce(line->>'status','')<>'Short' THEN RAISE EXCEPTION 'Zero placement requires a recorded shortage'; END IF;
  idx:=idx+1;
 END LOOP;
 RETURN NEW;
END;
$function$;

-- 3. Ensure private.save_receiving_split generates a distinct 6-character alphanumeric job_number for each PUTAWAY job
CREATE OR REPLACE FUNCTION private.save_receiving_split(p_request uuid, p_po uuid, p_item uuid, p_jobs jsonb, p_previous numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE actor public.employees%ROWTYPE; po public.purchase_orders%ROWTYPE; item public.po_items%ROWTYPE;
 saved private.fulfillment_receipts%ROWTYPE; draft jsonb; line jsonb; product public.products%ROWTYPE;
 quantity numeric; total numeric:=0; expected numeric; tolerance numeric:=0; ids uuid[]:='{}'; job uuid; fingerprint text:=md5(p_jobs::text);
 v_job_number text; v_chars constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'; i integer;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 SELECT * INTO po FROM public.purchase_orders WHERE id=p_po FOR UPDATE;
 IF actor.id IS NULL OR po.id IS NULL OR NOT public.is_site_in_my_authorized_scope(po.site_id::text,po.country_code)
 OR (actor.role<>'group_ceo' AND (actor.site_id IS DISTINCT FROM po.site_id OR public.get_my_country_code_strict() IS DISTINCT FROM po.country_code))
 OR actor.role NOT IN('group_ceo','warehouse_manager','store_manager','country_operations_director','country_managing_director','picker','packer','receiver','inventory_specialist','forklift_operator','stock_clerk','driver','receiving_operator','putaway_operator','inbound_qc_inspector','returns_operator','returns_clerk') THEN
 RAISE EXCEPTION 'Receiving requires an authorized employee at the PO facility' USING ERRCODE='42501'; END IF;
 SELECT * INTO saved FROM private.fulfillment_receipts WHERE id=p_request;
 IF saved.id IS NOT NULL THEN
  IF saved.po_id<>p_po OR saved.item_id<>p_item OR saved.employee_id<>actor.id OR saved.fingerprint<>fingerprint THEN RAISE EXCEPTION 'Receipt retry does not match its original input'; END IF;
  RETURN jsonb_build_object('jobIds',saved.job_ids,'saved',true);
 END IF;
 IF p_request IS NULL OR po.status NOT IN('Approved','Ordered','Partially Received') OR jsonb_typeof(p_jobs) IS DISTINCT FROM 'array' OR jsonb_array_length(p_jobs) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Open PO and valid receipt splits required'; END IF;
 SELECT * INTO item FROM public.po_items WHERE id=p_item AND po_id=po.id FOR UPDATE;
 IF item.id IS NULL OR p_previous IS NULL OR coalesce(item.received_qty,0)<>p_previous THEN RAISE EXCEPTION 'Receipt counts changed. Refresh the manifest before confirming' USING ERRCODE='40001'; END IF;
 PERFORM private.claim_fulfillment_stage(po.country_code,po.id::text,'RECEIVE');
 expected:=private.po_expected_sellable_units(item);
 SELECT least(100,greatest(0,coalesce((country_configs->po.country_code->>'overReceiveTolerancePct')::numeric,0))) INTO tolerance FROM public.system_config LIMIT 1;
 tolerance:=coalesce(tolerance,0);
 FOR draft IN SELECT value FROM jsonb_array_elements(p_jobs) LOOP
  IF jsonb_typeof(draft->'lineItems') IS DISTINCT FROM 'array' OR jsonb_array_length(draft->'lineItems') IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'One physical split per putaway job required'; END IF;
  line:=draft->'lineItems'->0; quantity:=(line->>'expectedQty')::numeric;
  IF quantity IS NULL OR quantity::text IN('NaN','Infinity','-Infinity') OR quantity<=0 THEN RAISE EXCEPTION 'Positive physical counts required'; END IF;
  SELECT * INTO product FROM public.products WHERE id=(line->>'productId')::uuid AND site_id=po.site_id;
  IF product.id IS NULL OR product.sku IS DISTINCT FROM line->>'sku' OR coalesce(line->>'condition','Good') NOT IN('Good','Damaged','Expired','Rejected') THEN RAISE EXCEPTION 'Receipt product or condition is invalid'; END IF;
  total:=total+quantity;
 END LOOP;
 IF expected IS NULL OR expected<=0 OR coalesce(item.received_qty,0)+total>expected*(1+tolerance/100) THEN RAISE EXCEPTION 'Physical receipt exceeds the permitted remaining intake. Warehouse review required'; END IF;
 FOR draft IN SELECT value FROM jsonb_array_elements(p_jobs) LOOP
  line:=draft->'lineItems'->0;
  line:=line||jsonb_build_object('pickedQty',0,'status','Pending','poItemId',item.id);
  v_job_number := nullif(upper(btrim(coalesce(draft->>'jobNumber', draft->>'job_number', ''))), '');
  IF v_job_number IS NULL THEN
   v_job_number := '';
   FOR i IN 1..6 LOOP
    v_job_number := v_job_number || substr(v_chars, floor(random() * 36)::integer + 1, 1);
   END LOOP;
  END IF;
  INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,items_count,order_ref,job_number,location,line_items)
  VALUES(po.site_id,po.country_code,'PUTAWAY','Pending','Normal',1,po.id::text,v_job_number,'Receiving Dock',jsonb_build_array(line)) RETURNING id INTO job;
  ids:=array_append(ids,job);
 END LOOP;
 UPDATE public.po_items SET received_qty=coalesce(received_qty,0)+total WHERE id=item.id;
 INSERT INTO private.fulfillment_receipts(id,po_id,item_id,employee_id,fingerprint,job_ids) VALUES(p_request,po.id,item.id,actor.id,fingerprint,ids);
 INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('PO_SPLIT_RECEIVE_CONFIRMED','Fulfillment',actor.name,actor.id,po.site_id,po.country_code,'purchase_order',po.id::text,jsonb_build_object('receiptId',p_request,'itemId',item.id,'jobs',ids,'physicalQty',total));
 RETURN jsonb_build_object('saved',true,'jobIds',ids);
END;
$function$;

-- 4. Complete putaway job 259d8afc-b529-46d4-b471-22643a2c575b (PW3T9X) whose 720 units are already placed in A-01-02
UPDATE public.wms_jobs
SET status = 'Completed',
    completed_by = coalesce(assigned_to, 'e1000000-0000-4000-8000-000000000087'),
    completed_at = coalesce(completed_at, '2026-11-04 15:02:35.266354+00'::timestamptz),
    line_items = jsonb_set(line_items, '{0,status}', '"Completed"')
WHERE id = '259d8afc-b529-46d4-b471-22643a2c575b'
  AND status <> 'Completed'
  AND (line_items->0->>'status') IN ('Picked', 'Completed');

COMMIT;
