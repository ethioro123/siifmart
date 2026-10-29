-- Direct receipt/return RPCs participate in the existing independent-stage ledger.
CREATE FUNCTION private.claim_fulfillment_stage(p_country text,p_order text,p_stage text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE worker text:=auth.uid()::text;
BEGIN
 IF worker IS NULL THEN RAISE EXCEPTION 'Authenticated employee required' USING ERRCODE='42501'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('independent-floor:'||p_country||':'||p_order,0));
 IF EXISTS(SELECT 1 FROM private.floor_stage_handlers h WHERE h.country_code=p_country AND h.order_ref=p_order AND h.employee_id=worker AND h.stage<>p_stage)
 OR EXISTS(SELECT 1 FROM public.wms_jobs j WHERE j.country_code=p_country AND j.order_ref=p_order AND j.type<>p_stage AND j.type IN('RECEIVE','PUTAWAY','PICK','PACK','COUNT','REPLENISH','WASTE','RETURNS') AND (j.assigned_to=worker OR j.completed_by=worker OR EXISTS(SELECT 1 FROM public.job_assignments a WHERE a.job_id=j.id AND a.employee_id::text=worker))) THEN
 RAISE EXCEPTION 'Independent worker required: this employee already handled another stage of this order' USING ERRCODE='42501'; END IF;
 INSERT INTO private.floor_stage_handlers(country_code,order_ref,stage,employee_id) VALUES(p_country,p_order,p_stage,worker) ON CONFLICT DO NOTHING;
END; $$;
REVOKE ALL ON FUNCTION private.claim_fulfillment_stage(text,text,text) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION private.save_receiving_split(p_request uuid,p_po uuid,p_item uuid,p_jobs jsonb,p_previous numeric) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; po public.purchase_orders%ROWTYPE; item public.po_items%ROWTYPE;
 saved private.fulfillment_receipts%ROWTYPE; draft jsonb; line jsonb; product public.products%ROWTYPE;
 quantity numeric; total numeric:=0; expected numeric; tolerance numeric:=0; ids uuid[]:='{}'; job uuid; fingerprint text:=md5(p_jobs::text);
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
  INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,items_count,order_ref,location,line_items)
  VALUES(po.site_id,po.country_code,'PUTAWAY','Pending','Normal',1,po.id::text,'Receiving Dock',jsonb_build_array(line)) RETURNING id INTO job;
  ids:=array_append(ids,job);
 END LOOP;
 UPDATE public.po_items SET received_qty=coalesce(received_qty,0)+total WHERE id=item.id;
 -- RECEIVE completion remains a supervised manifest decision; do not infer completion from a local job list.
 INSERT INTO private.fulfillment_receipts(id,po_id,item_id,employee_id,fingerprint,job_ids) VALUES(p_request,po.id,item.id,actor.id,fingerprint,ids);
 INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('PO_SPLIT_RECEIVE_CONFIRMED','Fulfillment',actor.name,actor.id,po.site_id,po.country_code,'purchase_order',po.id::text,jsonb_build_object('receiptId',p_request,'itemId',item.id,'jobs',ids,'physicalQty',total));
 RETURN jsonb_build_object('saved',true,'jobIds',ids);
END; $$;

CREATE OR REPLACE FUNCTION private.submit_fulfillment_return(p_request uuid,p_sale uuid,p_site uuid,p_country text,p_lines jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE s public.sales%ROWTYPE; si public.sale_items%ROWTYPE; actor public.employees%ROWTYPE; existing public.fulfillment_return_requests%ROWTYPE;
 line jsonb; normalized jsonb:='[]'; qty numeric; already numeric; total numeric:=0; extended numeric; refund numeric; duplicate_ids text[]:='{}';
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 SELECT * INTO s FROM public.sales WHERE id=p_sale FOR UPDATE;
 IF actor.id IS NULL OR s.id IS NULL OR p_site IS DISTINCT FROM s.site_id OR p_country IS DISTINCT FROM s.country_code
 OR NOT public.is_site_in_my_authorized_scope(s.site_id::text,s.country_code) OR NOT public.is_country_in_my_authorized_scope(s.country_code)
 OR (actor.role<>'group_ceo' AND actor.site_id IS DISTINCT FROM s.site_id) THEN RAISE EXCEPTION 'Return intake is outside the authorized facility' USING ERRCODE='42501'; END IF;
 SELECT * INTO existing FROM public.fulfillment_return_requests WHERE id=p_request;
 IF existing.id IS NOT NULL THEN
  IF existing.sale_id<>s.id OR existing.requested_by<>actor.id OR existing.request_fingerprint IS DISTINCT FROM md5(p_lines::text) THEN RAISE EXCEPTION 'Return retry does not match original request'; END IF;
  RETURN jsonb_build_object('id',existing.id,'status',existing.status,'refundAmount',existing.refund_amount);
 END IF;
 IF p_request IS NULL OR s.status NOT IN('Completed','Partially Refunded') OR jsonb_typeof(p_lines) IS DISTINCT FROM 'array' OR jsonb_array_length(p_lines) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'An eligible receipt and return lines are required'; END IF;
 SELECT sum(quantity*price) INTO extended FROM public.sale_items WHERE sale_id=s.id;
 IF extended IS NULL OR extended<=0 OR s.total<0 THEN RAISE EXCEPTION 'Original paid amounts require supervisor review'; END IF;
 FOR line IN SELECT value FROM jsonb_array_elements(p_lines) LOOP
  SELECT * INTO si FROM public.sale_items WHERE id=(line->>'saleItemId')::uuid AND sale_id=s.id;
  qty:=(line->>'quantity')::numeric;
  IF si.id IS NULL OR si.product_id IS NULL OR si.id::text=ANY(duplicate_ids) OR qty IS NULL OR qty::text IN('NaN','Infinity','-Infinity') OR qty<=0 OR qty<>trunc(qty)
   OR length(trim(coalesce(line->>'reason','')))<3 OR coalesce(line->>'action','') NOT IN('Restock','Discard','Repair')
   OR coalesce(line->>'condition','') NOT IN('New / Sealed','Open Box','Damaged') THEN RAISE EXCEPTION 'Return lines require valid counts, reason, condition and disposition'; END IF;
  IF line->>'action'='Restock' AND line->>'condition'<>'New / Sealed' THEN RAISE EXCEPTION 'Only sealed goods can be proposed for restock; hold other returns for review'; END IF;
  SELECT coalesce(sum((l->>'quantity')::numeric),0) INTO already FROM public.fulfillment_return_requests r CROSS JOIN LATERAL jsonb_array_elements(r.lines) l
   WHERE r.sale_id=s.id AND r.status IN('pending','approved') AND l->>'saleItemId'=si.id::text;
  IF qty+already>si.quantity THEN RAISE EXCEPTION 'Returned quantity exceeds the unreturned original sale line'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.products WHERE id=si.product_id AND site_id=s.site_id) THEN RAISE EXCEPTION 'Original product requires site-specific stock review'; END IF;
  refund:=round(si.price*qty*s.total/extended,2);total:=total+refund;
  normalized:=normalized||jsonb_build_array(jsonb_build_object('saleItemId',si.id,'productId',si.product_id,'name',si.product_name,'quantity',qty,'reason',line->>'reason','condition',line->>'condition','action',line->>'action','refundAmount',refund));
  duplicate_ids:=array_append(duplicate_ids,si.id::text);
 END LOOP;
 -- Rounding and previous returns can never produce a credit above the original paid total.
 SELECT least(total,greatest(0,s.total-coalesce(sum(refund_amount),0))) INTO total FROM public.fulfillment_return_requests WHERE sale_id=s.id AND status IN('pending','approved');
 PERFORM private.claim_fulfillment_stage(s.country_code,s.id::text,'RETURNS');
 INSERT INTO public.fulfillment_return_requests(id,sale_id,site_id,country_code,currency,lines,refund_amount,requested_by,request_fingerprint)
 VALUES(p_request,s.id,s.site_id,s.country_code,s.currency,normalized,total,actor.id,md5(p_lines::text));
 RETURN jsonb_build_object('id',p_request,'status','pending','refundAmount',total);
END; $$;

