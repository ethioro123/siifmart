-- Receipt counts and downstream work commit together; retries return the original jobs.
CREATE TABLE private.fulfillment_receipts (
 id uuid PRIMARY KEY, po_id uuid NOT NULL, item_id uuid NOT NULL, employee_id uuid NOT NULL,
 fingerprint text NOT NULL, job_ids uuid[] NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.fulfillment_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.fulfillment_receipts FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.save_receiving_split(p_request uuid,p_po uuid,p_item uuid,p_jobs jsonb,p_previous numeric) RETURNS jsonb
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
REVOKE ALL ON FUNCTION private.save_receiving_split(uuid,uuid,uuid,jsonb,numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.save_receiving_split(uuid,uuid,uuid,jsonb,numeric) TO authenticated;
CREATE FUNCTION public.save_receiving_split(p_request uuid,p_po uuid,p_item uuid,p_jobs jsonb,p_previous numeric) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.save_receiving_split(p_request,p_po,p_item,p_jobs,p_previous); $$;
REVOKE ALL ON FUNCTION public.save_receiving_split(uuid,uuid,uuid,jsonb,numeric) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_receiving_split(uuid,uuid,uuid,jsonb,numeric) TO authenticated;

-- A completed job cannot leave active assignment workload behind if any write fails.
CREATE FUNCTION private.close_completed_job_assignments() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.status='Completed' AND OLD.status IS DISTINCT FROM 'Completed' THEN
 UPDATE public.job_assignments SET status='Completed',completed_at=coalesce(NEW.completed_at,now()) WHERE job_id=NEW.id AND status IN('Assigned','Accepted','In-Progress');
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.close_completed_job_assignments() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER close_completed_job_assignments AFTER UPDATE OF status ON public.wms_jobs FOR EACH ROW EXECUTE FUNCTION private.close_completed_job_assignments();

CREATE FUNCTION private.guard_putaway_completion_evidence() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE line jsonb; idx integer:=0; qty numeric; audited numeric;
BEGIN
 IF NEW.type<>'PUTAWAY' OR NEW.status<>'Completed' OR OLD.status='Completed' THEN RETURN NEW; END IF;
 IF coalesce(jsonb_array_length(NEW.line_items),0)=0 THEN RAISE EXCEPTION 'Putaway requires verified placement lines'; END IF;
 FOR line IN SELECT value FROM jsonb_array_elements(NEW.line_items) LOOP
  qty:=coalesce((line->>'pickedQty')::numeric,0);
  IF coalesce(line->>'status','Pending') NOT IN('Picked','Completed','Short') OR qty<0 OR qty::text IN('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Putaway lines must be physically verified'; END IF;
  IF qty>0 THEN
   SELECT sum(quantity) INTO audited FROM public.stock_movements WHERE site_id=NEW.site_id AND type='IN' AND reason='Putaway job '||NEW.id::text||' line '||idx||' to '||(line->>'location');
   IF audited IS DISTINCT FROM qty THEN RAISE EXCEPTION 'Putaway completion requires matching stock placement evidence'; END IF;
  ELSIF coalesce(line->>'status','')<>'Short' THEN RAISE EXCEPTION 'Zero placement requires a recorded shortage'; END IF;
  idx:=idx+1;
 END LOOP;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.guard_putaway_completion_evidence() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_putaway_completion_evidence BEFORE UPDATE OF status ON public.wms_jobs FOR EACH ROW EXECUTE FUNCTION private.guard_putaway_completion_evidence();
