-- Finalize receipt metrics from audited physical placements without exposing the PO to floor staff.
CREATE INDEX IF NOT EXISTS idx_wms_putaway_order_site ON public.wms_jobs(order_ref,site_id,country_code) WHERE type='PUTAWAY';
CREATE INDEX IF NOT EXISTS idx_stock_putaway_audit ON public.stock_movements(site_id,reason) INCLUDE(quantity,product_id) WHERE type='IN';

CREATE OR REPLACE FUNCTION private.po_expected_sellable_units(item public.po_items)
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

CREATE OR REPLACE FUNCTION private.finalize_po_from_putaway(p_job_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; job public.wms_jobs%ROWTYPE; po public.purchase_orders%ROWTYPE;
 item public.po_items%ROWTYPE; placement record; matched uuid; matches integer; qty numeric; audited numeric;
 counts jsonb:='{}'; expected numeric; full_receipt boolean:=true; next_status text; changed boolean:=false;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='42501'; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 SELECT * INTO job FROM public.wms_jobs WHERE id=p_job_id AND type='PUTAWAY';
 IF actor.id IS NULL OR job.id IS NULL OR job.status<>'Completed'
  OR NOT public.is_site_in_my_authorized_scope(job.site_id::text,job.country_code)
  OR NOT (public.is_manager() OR public.is_ceo() OR (actor.site_id=job.site_id AND job.assigned_to=actor.id::text
    AND job.completed_by=actor.id::text AND EXISTS(SELECT 1 FROM public.job_assignments a WHERE a.job_id=job.id AND a.employee_id=actor.id))) THEN
  RAISE EXCEPTION 'Completed Putaway job requires its assigned worker or scoped supervisor' USING ERRCODE='42501'; END IF;
 SELECT * INTO po FROM public.purchase_orders p WHERE p.id::text=job.order_ref OR p.po_number=job.order_ref FOR UPDATE;
 IF po.id IS NULL THEN RETURN jsonb_build_object('state','not_found'); END IF;
 IF po.site_id IS DISTINCT FROM job.site_id OR upper(po.country_code) IS DISTINCT FROM upper(job.country_code)
  OR NOT public.is_site_in_my_authorized_scope(po.site_id::text,po.country_code) THEN
  RAISE EXCEPTION 'PO and Putaway facility/country must match' USING ERRCODE='42501'; END IF;
 IF po.status NOT IN ('Approved','Partially Received','Received') THEN RETURN jsonb_build_object('state','needs_review','po_id',po.id); END IF;
 PERFORM 1 FROM public.wms_jobs j WHERE j.type='PUTAWAY' AND j.order_ref IN (po.id::text,po.po_number) ORDER BY j.id FOR SHARE;
 IF EXISTS(SELECT 1 FROM public.wms_jobs j WHERE j.type='PUTAWAY' AND j.order_ref IN (po.id::text,po.po_number)
   AND (j.site_id IS DISTINCT FROM po.site_id OR upper(j.country_code) IS DISTINCT FROM upper(po.country_code))) THEN
  RAISE EXCEPTION 'Related Putaway jobs have inconsistent facility scope' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM public.wms_jobs j WHERE j.type='PUTAWAY' AND j.order_ref IN (po.id::text,po.po_number) AND j.status NOT IN ('Completed','Cancelled')) THEN
  RETURN jsonb_build_object('state','awaiting_putaway','po_id',po.id); END IF;
 IF NOT EXISTS(SELECT 1 FROM public.wms_jobs r WHERE r.type='RECEIVE' AND r.status='Completed'
  AND r.site_id=po.site_id AND upper(r.country_code)=upper(po.country_code) AND r.order_ref IN (po.id::text,po.po_number)) THEN
  RETURN jsonb_build_object('state','needs_review','po_id',po.id); END IF;
 IF NOT EXISTS(SELECT 1 FROM public.po_items WHERE po_id=po.id) THEN RETURN jsonb_build_object('state','needs_review','po_id',po.id); END IF;
 FOR placement IN SELECT j.id,j.site_id,line.value AS line,line.ordinality-1 AS item_index
  FROM public.wms_jobs j CROSS JOIN LATERAL jsonb_array_elements(j.line_items) WITH ORDINALITY line
  WHERE j.type='PUTAWAY' AND j.status='Completed' AND j.order_ref IN (po.id::text,po.po_number) LOOP
  IF coalesce(placement.line->>'condition','Good')<>'Good' OR coalesce(placement.line->>'status','Pending') NOT IN ('Picked','Completed','Short') THEN
   RETURN jsonb_build_object('state','needs_review','po_id',po.id); END IF;
  SELECT count(*),(array_agg(i.id))[1] INTO matches,matched FROM public.po_items i WHERE i.po_id=po.id AND i.sku=placement.line->>'sku';
  IF matches<>1 THEN RETURN jsonb_build_object('state','needs_review','po_id',po.id); END IF;
  qty:=coalesce((placement.line->>'pickedQty')::numeric,0);
  IF qty::text IN ('NaN','Infinity','-Infinity') OR qty<0 THEN RAISE EXCEPTION 'Invalid physical placement quantity'; END IF;
  IF qty>0 THEN
   SELECT sum(m.quantity) INTO audited FROM public.stock_movements m JOIN public.products p ON p.id=m.product_id
    WHERE m.site_id=po.site_id AND m.type='IN' AND p.site_id=po.site_id AND p.sku=placement.line->>'sku'
     AND m.reason='Putaway job '||placement.id::text||' line '||placement.item_index||' to '||(placement.line->>'location');
   IF audited IS DISTINCT FROM qty THEN RETURN jsonb_build_object('state','needs_review','po_id',po.id); END IF;
  END IF;
  counts:=jsonb_set(counts,ARRAY[matched::text],to_jsonb(coalesce((counts->>matched::text)::numeric,0)+qty),true);
 END LOOP;
 FOR item IN SELECT * FROM public.po_items WHERE po_id=po.id ORDER BY id FOR UPDATE LOOP
  expected:=private.po_expected_sellable_units(item);
  IF expected IS NULL OR expected<=0 THEN RETURN jsonb_build_object('state','needs_review','po_id',po.id); END IF;
  IF coalesce((counts->>item.id::text)::numeric,0)<expected THEN full_receipt:=false; END IF;
 END LOOP;
 UPDATE public.po_items i SET received_qty=greatest(coalesce(i.received_qty,0),coalesce((counts->>i.id::text)::numeric,0))
  WHERE i.po_id=po.id AND coalesce(i.received_qty,0)<coalesce((counts->>i.id::text)::numeric,0);
 changed:=FOUND;
 next_status:=CASE WHEN full_receipt THEN 'Received' ELSE 'Partially Received' END;
 IF po.status IS DISTINCT FROM next_status THEN
  UPDATE public.purchase_orders SET status=next_status,updated_at=now() WHERE id=po.id; changed:=true;
 END IF;
 IF changed THEN
  INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
   VALUES('PO_RECEIPT_RECONCILED','Fulfillment',actor.name,actor.id,po.site_id,po.country_code,'purchase_order',po.id::text,
    jsonb_build_object('jobId',job.id,'status',next_status));
 END IF;
 -- No commercial data, expected quantities or line details are returned to blind receiving workers.
 RETURN jsonb_build_object('state','synced','po_id',po.id,'po_number',po.po_number,'status',next_status,'changed',changed);
END;
$$;
REVOKE ALL ON FUNCTION private.finalize_po_from_putaway(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.finalize_po_from_putaway(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.finalize_po_from_putaway(p_job_id uuid) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.finalize_po_from_putaway(p_job_id); $$;
REVOKE ALL ON FUNCTION public.finalize_po_from_putaway(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.finalize_po_from_putaway(uuid) TO authenticated;
