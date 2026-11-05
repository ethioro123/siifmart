-- Supply missing receipt audit prerequisites; existing functions and historical counts are preserved.
DO $install$ BEGIN IF to_regprocedure('private.po_expected_sellable_units(public.po_items)') IS NULL THEN EXECUTE $definition$CREATE OR REPLACE FUNCTION private.po_expected_sellable_units(item public.po_items)
RETURNS numeric LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE attrs jsonb:=coalesce(item.custom_attributes,'{}'); packs numeric; cases numeric; size_value numeric;
 size_type text; sell_unit text; sell_by text; base_size numeric; base_sell numeric;
BEGIN
 packs:=coalesce(nullif(substring(attrs#>>'{packaging,packQty}' FROM '^[0-9]+'),'0')::numeric,nullif(item.pack_quantity,0),1);
 cases:=coalesce(nullif(substring(attrs#>>'{packaging,caseSize}' FROM '^[0-9]+'),'0')::numeric,nullif(item.case_size,0),0);
 IF cases>=1 THEN RETURN item.quantity*cases*greatest(packs,1); END IF;
 IF packs>1 THEN RETURN item.quantity*packs; END IF;
 -- Ambiguous bulk descriptions require review; never infer package counts from prices or names.
 IF lower(coalesce(item.package_type,attrs#>>'{packaging,packageType}','')) ~ 'bale|case|carton|bulk|crate|bundle' THEN RETURN NULL; END IF;
 size_value:=coalesce(substring(coalesce(item.size,attrs#>>'{packaging,unitSize}','') FROM '^[0-9]+(?:[.][0-9]+)?')::numeric,0);
 size_type:=lower(trim(coalesce(attrs#>>'{physical,sizeType}',attrs#>>'{physical,unit}','')));
 sell_unit:=upper(trim(coalesce(item.unit,attrs#>>'{commercial,sellUnit}','')));
 sell_by:=coalesce(attrs#>>'{commercial,sellBy}',CASE WHEN sell_unit IN ('KG','G') THEN 'Weight' WHEN sell_unit IN ('L','ML') THEN 'Volume' ELSE 'Unit' END);
 IF sell_by IN ('Weight','Volume') AND size_value>0 THEN
  base_size:=CASE WHEN size_type IN ('kg','kilogram','kilograms','kgs','l','litre','liter','litres','liters','lt') THEN 1000 WHEN size_type IN ('g','gram','grams','gr','ml','millilitre','milliliter','millilitres','milliliters') THEN 1 END;
  base_sell:=CASE WHEN sell_unit IN ('KG','L') THEN 1000 WHEN sell_unit IN ('G','ML') THEN 1 END;
  IF (sell_unit IN ('KG','G') AND size_type IN ('kg','kilogram','kilograms','kgs','g','gram','grams','gr'))
   OR (sell_unit IN ('L','ML') AND size_type IN ('l','litre','liter','litres','liters','lt','ml','millilitre','milliliter','millilitres','milliliters')) THEN
   RETURN item.quantity*size_value*base_size/base_sell;
  END IF;
 END IF;
 RETURN item.quantity;
END;
$$;
REVOKE ALL ON FUNCTION private.po_expected_sellable_units(public.po_items) FROM PUBLIC,anon,authenticated;

$definition$; END IF; END $install$;
DO $install$ BEGIN IF to_regclass('private.fulfillment_receipts') IS NULL THEN EXECUTE $definition$CREATE TABLE private.fulfillment_receipts (
 id uuid PRIMARY KEY, po_id uuid NOT NULL, item_id uuid NOT NULL, employee_id uuid NOT NULL,
 fingerprint text NOT NULL, job_ids uuid[] NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE private.fulfillment_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.fulfillment_receipts FROM PUBLIC,anon,authenticated;
$definition$; END IF; END $install$;
DO $install$ BEGIN IF to_regprocedure('public.save_receiving_split(uuid,uuid,uuid,jsonb,numeric)') IS NULL THEN EXECUTE $definition$CREATE FUNCTION private.save_receiving_split(p_request uuid,p_po uuid,p_item uuid,p_jobs jsonb,p_previous numeric) RETURNS jsonb
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

$definition$; END IF; END $install$;
DO $install$ BEGIN IF to_regprocedure('public.finalize_receiving_session(uuid)') IS NULL THEN EXECUTE $definition$-- Finalize the receipt session from server counts; PUTAWAY remains independent.
CREATE FUNCTION private.finalize_receiving_session(p_po uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; po public.purchase_orders%ROWTYPE; item public.po_items%ROWTYPE;
 job public.wms_jobs%ROWTYPE; results jsonb:='[]'; full_receipt boolean:=true; has_count boolean:=false; expected numeric; next_status text;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 SELECT * INTO po FROM public.purchase_orders WHERE id=p_po FOR UPDATE;
 IF actor.id IS NULL OR po.id IS NULL OR NOT public.is_site_in_my_authorized_scope(po.site_id::text,po.country_code)
 OR (actor.role<>'group_ceo' AND (actor.site_id IS DISTINCT FROM po.site_id OR public.get_my_country_code_strict() IS DISTINCT FROM po.country_code))
 OR actor.role NOT IN('group_ceo','warehouse_manager','store_manager','country_operations_director','country_managing_director','picker','packer','receiver','inventory_specialist','forklift_operator','stock_clerk','driver','receiving_operator','putaway_operator','inbound_qc_inspector','returns_operator','returns_clerk') THEN
 RAISE EXCEPTION 'Authorized receiving employee required' USING ERRCODE='42501'; END IF;
 IF po.status NOT IN('Approved','Ordered','Partially Received','Received') THEN RAISE EXCEPTION 'An open receipt session is required'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.po_items WHERE po_id=po.id) THEN RAISE EXCEPTION 'Saved receipt lines required'; END IF;
 FOR item IN SELECT * FROM public.po_items WHERE po_id=po.id ORDER BY id FOR UPDATE LOOP
  expected:=private.po_expected_sellable_units(item);
  IF expected IS NULL OR expected<=0 THEN RAISE EXCEPTION 'Valid ordered units required'; END IF;
  IF coalesce(item.received_qty,0)>0 THEN
   has_count:=true;
   IF NOT EXISTS(SELECT 1 FROM private.fulfillment_receipts r WHERE r.po_id=po.id AND r.item_id=item.id) THEN RAISE EXCEPTION 'Saved physical receipt evidence required'; END IF;
  END IF;
  IF coalesce(item.received_qty,0)<expected THEN full_receipt:=false; END IF;
 END LOOP;
 IF NOT has_count THEN RAISE EXCEPTION 'Submit physical counts before finalizing'; END IF;
 next_status:=CASE WHEN full_receipt THEN 'Received' ELSE 'Partially Received' END;
 FOR job IN SELECT * FROM public.wms_jobs WHERE site_id=po.site_id AND country_code=po.country_code AND type='RECEIVE'
 AND order_ref IN(po.id::text,po.po_number) AND status<>'Cancelled' ORDER BY id FOR UPDATE LOOP
  IF job.status<>'Completed' THEN
   IF actor.role NOT IN('group_ceo','warehouse_manager','store_manager','country_operations_director','country_managing_director')
   AND job.assigned_to IS DISTINCT FROM actor.id::text THEN RAISE EXCEPTION 'Assigned receiving employee required' USING ERRCODE='42501'; END IF;
   UPDATE public.wms_jobs SET status='Completed',completed_by=actor.id::text,completed_at=clock_timestamp() WHERE id=job.id RETURNING * INTO job;
  END IF;
  results:=results||jsonb_build_array(jsonb_build_object('id',job.id,'status',job.status,'completed_by',job.completed_by,'completed_at',job.completed_at));
 END LOOP;
 IF jsonb_array_length(results)=0 THEN RAISE EXCEPTION 'A matching receiving job is required'; END IF;
 IF po.status IS DISTINCT FROM next_status THEN UPDATE public.purchase_orders SET status=next_status,updated_at=clock_timestamp() WHERE id=po.id; END IF;
 INSERT INTO public.system_logs(action,module,employee_id,user_name,site_id,country_code,entity_type,entity_id,details)
 VALUES('RECEIVING_SESSION_FINALIZED','Fulfillment',actor.id::text,actor.name,po.site_id::text,po.country_code,'purchase_order',po.id::text,
 jsonb_build_object('status',next_status,'jobs',results)::text);
 RETURN jsonb_build_object('id',po.id,'status',next_status,'jobs',results,'saved',true);
END $$;
REVOKE ALL ON FUNCTION private.finalize_receiving_session(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.finalize_receiving_session(uuid) TO authenticated;
CREATE FUNCTION public.finalize_receiving_session(p_po uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=''
AS $$ SELECT private.finalize_receiving_session(p_po); $$;
REVOKE ALL ON FUNCTION public.finalize_receiving_session(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.finalize_receiving_session(uuid) TO authenticated;
$definition$; END IF; END $install$;
