-- Every active PICK entry point allocates physical lots at the trusted database boundary.
CREATE OR REPLACE FUNCTION private.allocate_fefo_pick() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE request record; lot public.products%ROWTYPE; left_qty numeric; available numeric; take_qty numeric;
 result jsonb:='[]'; demand jsonb; web public.storefront_orders%ROWTYPE; held numeric; used_here numeric;
BEGIN
 IF NEW.type<>'PICK' OR NEW.status NOT IN('Pending','In-Progress') THEN RETURN NEW; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.sites WHERE id=NEW.site_id AND upper(country)=upper(NEW.country_code) AND type IN('Warehouse','Distribution Center')) THEN RAISE EXCEPTION 'PICK source facility and country must match'; END IF;
 IF coalesce(jsonb_array_length(NEW.line_items),0)=0 THEN RAISE EXCEPTION 'Picking requires requested SKU quantities'; END IF;
 -- Serialize allocations at this facility; product locks also coordinate with stock writers.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('fefo-pick:'||NEW.site_id::text,0));
 SELECT * INTO web FROM public.storefront_orders WHERE id::text=NEW.order_ref AND site_id=NEW.site_id AND country_code=NEW.country_code FOR UPDATE;
 IF web.id IS NOT NULL THEN
  IF web.status NOT IN('awaiting_confirmation','submitted','accepted','pending') OR web.pick_job_id IS NOT NULL THEN RAISE EXCEPTION 'Online order already has picking work or is not ready'; END IF;
  -- Replace only this order's reservations, atomically with its new manifest.
  DELETE FROM public.storefront_stock_reservations WHERE order_id=web.id;
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.line_items) x WHERE nullif(trim(x->>'sku'),'') IS NULL OR (x->>'expectedQty') IS NULL OR (x->>'expectedQty')::numeric<=0 OR (x->>'expectedQty')::numeric::text IN('NaN','Infinity','-Infinity') OR coalesce((x->>'pickedQty')::numeric,0)<>0) THEN RAISE EXCEPTION 'Positive finite SKU demand and unverified quantities required'; END IF;
 FOR request IN SELECT x->>'sku' sku,sum((x->>'expectedQty')::numeric) qty,(jsonb_agg(x)->0) template FROM jsonb_array_elements(NEW.line_items)x GROUP BY x->>'sku' ORDER BY x->>'sku' LOOP
  left_qty:=request.qty;
  FOR lot IN SELECT p.* FROM public.products p WHERE p.site_id=NEW.site_id AND p.sku=request.sku AND p.stock>0 AND lower(p.status)='active'
   AND (p.expiry_date IS NULL OR p.expiry_date>=current_date) AND p.location ~ '^[A-Z]-[0-9]{2}-[0-9]{2}$'
   AND NOT EXISTS(SELECT 1 FROM public.warehouse_zones z WHERE z.id=p.zone_id AND (z.site_id<>NEW.site_id OR coalesce(z.is_locked,false) OR z.allow_picking=false OR lower(z.type) IN('damaged','staging')))
   ORDER BY p.expiry_date ASC NULLS LAST,p.received_on ASC NULLS LAST,p.created_at,p.id FOR UPDATE LOOP
   SELECT coalesce(sum(r.quantity),0) INTO held FROM public.storefront_stock_reservations r WHERE r.product_id=lot.id AND r.released_at IS NULL;
   -- Web reservations already cover their jobs; do not count them twice.
   SELECT coalesce(sum((x->>'expectedQty')::numeric),0) INTO used_here FROM public.wms_jobs j CROSS JOIN LATERAL jsonb_array_elements(j.line_items)x
    WHERE j.id<>NEW.id AND j.type='PICK' AND j.status IN('Pending','In-Progress') AND j.site_id=NEW.site_id AND j.country_code=NEW.country_code AND x->>'productId'=lot.id::text
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
 NEW.line_items:=result;NEW.items_count:=jsonb_array_length(result);RETURN NEW;
END; $$;

-- Reserve units for ordinary active picks as well as online orders. Only a trusted
-- completion receipt releases its own hold before its atomic stock deduction.
CREATE FUNCTION private.preserve_fefo_pick_stock() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE held numeric;
BEGIN
 IF NEW.stock>=OLD.stock THEN RETURN NEW; END IF;
 SELECT coalesce(sum((x->>'expectedQty')::numeric),0) INTO held FROM public.wms_jobs j CROSS JOIN LATERAL jsonb_array_elements(j.line_items)x
 WHERE j.type='PICK' AND j.status IN('Pending','In-Progress') AND j.site_id=OLD.site_id AND x->>'productId'=OLD.id::text
 AND NOT EXISTS(SELECT 1 FROM private.pick_completions c WHERE c.job_id=j.id)
 AND NOT EXISTS(SELECT 1 FROM public.storefront_orders o WHERE o.id::text=j.order_ref AND o.site_id=j.site_id AND o.country_code=j.country_code);
 SELECT held+coalesce(sum(quantity),0) INTO held FROM public.storefront_stock_reservations WHERE product_id=OLD.id AND released_at IS NULL;
 IF NEW.stock<held THEN RAISE EXCEPTION 'Stock is reserved by active picking work' USING ERRCODE='P0001',DETAIL='FEFO_STOCK_RESERVED'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.preserve_fefo_pick_stock() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER preserve_fefo_pick_stock BEFORE UPDATE OF stock ON public.products FOR EACH ROW EXECUTE FUNCTION private.preserve_fefo_pick_stock();
