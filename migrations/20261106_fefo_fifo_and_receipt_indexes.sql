-- Undated lots use the oldest known receipt day, falling back to creation day.
CREATE INDEX pick_receipts_actor_idx ON private.pick_line_receipts(actor_id);
CREATE INDEX pick_receipts_product_idx ON private.pick_line_receipts(product_id);
CREATE INDEX pick_completions_actor_idx ON private.pick_completions(actor_id);
CREATE INDEX pick_completions_pack_idx ON private.pick_completions(pack_job_id);
CREATE OR REPLACE FUNCTION private.plan_fefo_pick(p_job public.wms_jobs) RETURNS public.wms_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE request record; lot public.products%ROWTYPE; left_qty numeric; available numeric; take_qty numeric;
 result jsonb:='[]'; demand jsonb; web public.storefront_orders%ROWTYPE; held numeric; used_here numeric;
BEGIN
 IF p_job.type<>'PICK' OR p_job.status NOT IN('Pending','In-Progress') THEN RETURN p_job; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.sites WHERE id=p_job.site_id AND upper(country)=upper(p_job.country_code) AND type IN('Warehouse','Distribution Center')) THEN RAISE EXCEPTION 'PICK source facility and country must match'; END IF;
 IF coalesce(jsonb_array_length(p_job.line_items),0)=0 THEN RAISE EXCEPTION 'Picking requires requested SKU quantities'; END IF;
 -- Serialize allocations at this facility; product locks also coordinate with stock writers.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('fefo-pick:'||p_job.site_id::text,0));
 SELECT * INTO web FROM public.storefront_orders WHERE id::text=p_job.order_ref AND site_id=p_job.site_id AND country_code=p_job.country_code FOR UPDATE;
 IF web.id IS NOT NULL THEN
  IF web.status NOT IN('awaiting_confirmation','submitted','accepted','pending') OR (web.pick_job_id IS NOT NULL AND web.pick_job_id<>p_job.id) THEN RAISE EXCEPTION 'Online order already has picking work or is not ready'; END IF;
  -- Replace only this order's reservations, atomically with its new manifest.
  DELETE FROM public.storefront_stock_reservations WHERE order_id=web.id;
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_job.line_items) x WHERE nullif(trim(x->>'sku'),'') IS NULL OR (x->>'expectedQty') IS NULL OR (x->>'expectedQty')::numeric<=0 OR (x->>'expectedQty')::numeric::text IN('NaN','Infinity','-Infinity') OR coalesce((x->>'pickedQty')::numeric,0)<>0) THEN RAISE EXCEPTION 'Positive finite SKU demand and unverified quantities required'; END IF;
 PERFORM 1 FROM public.products p WHERE p.site_id=p_job.site_id AND p.sku IN(SELECT x->>'sku' FROM jsonb_array_elements(p_job.line_items)x) ORDER BY p.id FOR UPDATE;
 FOR request IN SELECT x->>'sku' sku,sum((x->>'expectedQty')::numeric) qty,(jsonb_agg(x)->0) template FROM jsonb_array_elements(p_job.line_items)x GROUP BY x->>'sku' ORDER BY x->>'sku' LOOP
  left_qty:=request.qty;
  FOR lot IN SELECT p.* FROM public.products p WHERE p.site_id=p_job.site_id AND p.sku=request.sku AND p.stock>0 AND lower(p.status)='active'
   AND (p.expiry_date IS NULL OR p.expiry_date>=private.fefo_today(p_job.site_id)) AND p.location ~ '^[A-Z]-[0-9]{2}-[0-9]{2}$'
   AND NOT EXISTS(SELECT 1 FROM public.warehouse_zones z WHERE z.id=p.zone_id AND (z.site_id<>p_job.site_id OR coalesce(z.is_locked,false) OR z.allow_picking=false OR lower(z.type) IN('damaged','staging')))
   ORDER BY p.expiry_date ASC NULLS LAST,coalesce(p.received_on,p.created_at::date),p.created_at,p.id LOOP
   SELECT coalesce(sum(r.quantity),0) INTO held FROM public.storefront_stock_reservations r WHERE r.product_id=lot.id AND r.released_at IS NULL;
   -- Web reservations already cover their jobs; do not count them twice.
   SELECT coalesce(sum((x->>'expectedQty')::numeric),0) INTO used_here FROM public.wms_jobs j CROSS JOIN LATERAL jsonb_array_elements(j.line_items)x
    WHERE j.id<>p_job.id AND j.type='PICK' AND j.status IN('Pending','In-Progress') AND j.site_id=p_job.site_id AND j.country_code=p_job.country_code AND x->>'productId'=lot.id::text
    AND NOT EXISTS(SELECT 1 FROM public.storefront_orders o WHERE o.id::text=j.order_ref AND o.site_id=j.site_id AND o.country_code=j.country_code);
   SELECT used_here+coalesce(sum((x->>'expectedQty')::numeric),0) INTO used_here FROM jsonb_array_elements(result)x WHERE x->>'productId'=lot.id::text;
   available:=greatest(0,lot.stock-held-used_here);take_qty:=least(left_qty,available);
   IF take_qty>0 THEN
    demand:=request.template||jsonb_build_object('productId',lot.id,'sku',lot.sku,'name',lot.name,'location',lot.location,'batchNumber',lot.batch_number,'expiryDate',lot.expiry_date,'expectedQty',take_qty,'pickedQty',0,'status','Pending','fefoAllocated',true);
    result:=result||jsonb_build_array(demand);left_qty:=left_qty-take_qty;
    IF web.id IS NOT NULL THEN
     IF take_qty<>trunc(take_qty) THEN RAISE EXCEPTION 'Online reservation quantities must be whole units'; END IF;
     INSERT INTO public.storefront_stock_reservations(order_id,product_id,quantity) VALUES(web.id,lot.id,take_qty::integer);
    END IF;
   END IF;
   EXIT WHEN left_qty<=0;
  END LOOP;
  IF left_qty>0 THEN RAISE EXCEPTION 'Insufficient available unexpired stock for SKU %',request.sku USING ERRCODE='P0001',DETAIL='FEFO_STOCK_UNAVAILABLE'; END IF;
 END LOOP;
 p_job.line_items:=result;p_job.items_count:=jsonb_array_length(result);RETURN p_job;
END; $$;
