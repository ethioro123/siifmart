-- Preserve exact lot identity between scan and completion.
ALTER TABLE private.pick_line_receipts ADD COLUMN batch_number text, ADD COLUMN expiry_date date;

CREATE OR REPLACE FUNCTION private.record_pick_line(p_job_id uuid,p_item_index integer,p_quantity numeric,p_location_barcode text,p_item_barcode text,p_shortage_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE; p public.products%ROWTYPE; line jsonb; expected numeric; receipt private.pick_line_receipts%ROWTYPE; site_code text; reason text:=nullif(btrim(p_shortage_reason),'');
BEGIN
 j:=private.authorized_pick(p_job_id);
 IF j.status NOT IN ('Pending','In-Progress') THEN RAISE EXCEPTION 'An active PICK job is required'; END IF;
 IF p_item_index IS NULL OR p_item_index<0 OR p_item_index>=jsonb_array_length(j.line_items) THEN RAISE EXCEPTION 'Invalid picking line'; END IF;
 line:=j.line_items->p_item_index; expected:=(line->>'expectedQty')::numeric;
 IF p_quantity IS NULL OR p_quantity::text IN ('NaN','Infinity','-Infinity') OR expected IS NULL OR expected<=0 OR p_quantity<0 OR p_quantity>expected THEN RAISE EXCEPTION 'Physical quantity must be between zero and the requested quantity'; END IF;
 IF p_quantity<expected AND (reason IS NULL OR length(reason)<3 OR length(reason)>500) THEN RAISE EXCEPTION 'Explain the picking shortage (3–500 characters)'; END IF;
 SELECT * INTO p FROM public.products WHERE id::text=line->>'productId' AND site_id=j.site_id AND sku=line->>'sku' FOR SHARE;
 IF p.id IS NULL OR p.location IS NULL OR p.location !~ '^[A-Z]-[0-9]{2}-[0-9]{2}$'
  OR (nullif(line->>'location','') IS NOT NULL AND line->>'location'<>p.location)
  OR (nullif(line->>'batchNumber','') IS NOT NULL AND line->>'batchNumber' IS DISTINCT FROM p.batch_number)
 THEN RAISE EXCEPTION 'Manifest product or source bin changed; request a supervised correction'; END IF;
 SELECT code INTO site_code FROM public.sites WHERE id=j.site_id;
 IF p_location_barcode IS DISTINCT FROM private.pick_location_barcode(site_code,p.location) THEN RAISE EXCEPTION 'Scan the source bin label for this facility'; END IF;
 IF p_quantity>0 AND (p.expiry_date<current_date OR lower(p.status) IN ('quarantined','damaged','expired','inactive')) THEN RAISE EXCEPTION 'Hold expired or unavailable stock for supervisor review'; END IF;
 IF p_quantity>0 AND upper(btrim(coalesce(p_item_barcode,''))) NOT IN (upper(p.sku),upper(coalesce(p.barcode,p.sku))) THEN RAISE EXCEPTION 'Scan the product on this picking line'; END IF;
 IF EXISTS(SELECT 1 FROM public.storefront_orders WHERE pick_job_id=j.id) AND p_quantity<>expected THEN RAISE EXCEPTION 'Online orders require full reserved quantities; ask a supervisor to resolve the order shortage'; END IF;
 SELECT * INTO receipt FROM private.pick_line_receipts WHERE job_id=j.id AND item_index=p_item_index;
 IF receipt.job_id IS NOT NULL THEN
  IF receipt.actor_id=public.get_my_employee_id() AND receipt.quantity=p_quantity AND receipt.product_id=p.id AND receipt.shortage_reason IS NOT DISTINCT FROM reason THEN RETURN to_jsonb(j); END IF;
  RAISE EXCEPTION 'This picking line was already verified; refresh the job';
 END IF;
 INSERT INTO private.pick_line_receipts(job_id,item_index,actor_id,product_id,quantity,source_location,shortage_reason,batch_number,expiry_date)
 VALUES(j.id,p_item_index,public.get_my_employee_id(),p.id,p_quantity,p.location,reason,p.batch_number,p.expiry_date);
 UPDATE public.wms_jobs SET line_items=jsonb_set(line_items,ARRAY[p_item_index::text],line||jsonb_build_object(
  'pickedQty',p_quantity,'status',CASE WHEN p_quantity<expected THEN 'Short' ELSE 'Picked' END,'location',p.location,'shortageReason',reason)),status='In-Progress'
 WHERE id=j.id RETURNING * INTO j;
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('PICK_LINE_VERIFIED','Fulfillment',public.get_my_employee_id(),j.site_id::text,j.country_code,'wms_job',j.id::text,
  jsonb_build_object('line',p_item_index,'productId',p.id,'quantity',p_quantity,'sourceBin',p.location,'shortageReason',reason)::text);
 RETURN to_jsonb(j);
END; $$;

CREATE OR REPLACE FUNCTION private.complete_pick_job(p_job_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE; pack public.wms_jobs%ROWTYPE; done private.pick_completions%ROWTYPE;
 r private.pick_line_receipts%ROWTYPE; p public.products%ROWTYPE; online_order public.storefront_orders%ROWTYPE;
 line jsonb; manifest jsonb:='[]'; pack_items jsonb:='[]'; idx integer:=0; parent public.wms_jobs%ROWTYPE;
BEGIN
 j:=private.authorized_pick(p_job_id);
 SELECT * INTO done FROM private.pick_completions WHERE job_id=j.id;
 IF done.job_id IS NOT NULL THEN
  SELECT * INTO pack FROM public.wms_jobs WHERE id=done.pack_job_id;
  RETURN jsonb_build_object('job',to_jsonb(j),'pack',CASE WHEN pack.id IS NOT NULL THEN to_jsonb(pack) ELSE NULL END);
 END IF;
 IF j.status NOT IN ('Pending','In-Progress') THEN RAISE EXCEPTION 'This PICK needs supervised reconciliation before it can be completed'; END IF;
 IF coalesce(jsonb_array_length(j.line_items),0)=0 THEN RAISE EXCEPTION 'Picking manifest is empty'; END IF;
 SELECT * INTO online_order FROM public.storefront_orders WHERE pick_job_id=j.id FOR UPDATE;
 IF online_order.id IS NOT NULL AND (online_order.status<>'accepted' OR online_order.site_id<>j.site_id OR online_order.country_code<>j.country_code OR online_order.id::text<>j.order_ref) THEN RAISE EXCEPTION 'Online order is not ready for picking'; END IF;
 IF online_order.id IS NOT NULL AND jsonb_array_length(j.line_items)<>(SELECT count(*) FROM public.storefront_stock_reservations WHERE order_id=online_order.id) THEN RAISE EXCEPTION 'Online reservation manifest is incomplete'; END IF;
 -- One order handoff at a time, even when different jobs reference it.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('pick-order:'||j.site_id::text||':'||coalesce(j.order_ref,j.id::text),0));
 IF EXISTS(SELECT 1 FROM public.wms_jobs WHERE type='PACK' AND status<>'Cancelled' AND site_id=j.site_id AND country_code=j.country_code AND order_ref=j.order_ref) THEN RAISE EXCEPTION 'An existing PACK requires supervised reconciliation; stock was not deducted'; END IF;
 -- Stable lock order protects the exact manifest lots across concurrent picks.
 PERFORM 1 FROM public.products WHERE id IN(SELECT product_id FROM private.pick_line_receipts WHERE job_id=j.id) ORDER BY id FOR UPDATE;
 FOR line IN SELECT value FROM jsonb_array_elements(j.line_items) LOOP
  SELECT * INTO r FROM private.pick_line_receipts WHERE job_id=j.id AND item_index=idx;
  IF r.job_id IS NULL OR r.quantity IS DISTINCT FROM (line->>'pickedQty')::numeric OR line->>'status' NOT IN ('Picked','Short') THEN RAISE EXCEPTION 'Scan and verify every picking line before completion'; END IF;
  SELECT * INTO p FROM public.products WHERE id=r.product_id AND site_id=j.site_id AND sku=line->>'sku';
  IF p.id IS NULL OR p.location IS DISTINCT FROM r.source_location OR p.id::text IS DISTINCT FROM line->>'productId' OR p.batch_number IS DISTINCT FROM r.batch_number OR p.expiry_date IS DISTINCT FROM r.expiry_date THEN RAISE EXCEPTION 'Verified source lot or bin changed; no stock was deducted'; END IF;
  IF online_order.id IS NOT NULL THEN
   IF r.quantity<>(line->>'expectedQty')::numeric THEN RAISE EXCEPTION 'Resolve online order shortages before completion'; END IF;
   UPDATE public.storefront_stock_reservations SET released_at=now() WHERE order_id=online_order.id AND product_id=p.id AND released_at IS NULL AND quantity=r.quantity;
   IF NOT FOUND THEN RAISE EXCEPTION 'Online stock reservation changed'; END IF;
  END IF;
  IF r.quantity>0 THEN
   IF p.expiry_date<current_date OR lower(p.status) IN ('quarantined','damaged','expired','inactive') THEN RAISE EXCEPTION 'Verified stock is no longer available for picking'; END IF;
   UPDATE public.products SET stock=stock-r.quantity WHERE id=p.id AND stock>=r.quantity;
   IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient stock in the verified source bin; no picking changes were saved'; END IF;
   INSERT INTO public.stock_movements(site_id,product_id,product_name,type,quantity,movement_date,performed_by,reason,batch_number)
   VALUES(j.site_id,p.id,p.name,'OUT',r.quantity,now(),public.get_my_employee_id()::text,'Pick job '||j.id::text||' line '||idx,p.batch_number);
   pack_items:=pack_items||jsonb_build_array(line||jsonb_build_object('orderedQty',line->'expectedQty','expectedQty',r.quantity,'pickedQty',r.quantity,'packedQty',0,'packed',false,'status','Pending'));
  END IF;
  manifest:=manifest||jsonb_build_array(line||jsonb_build_object('status',CASE WHEN r.quantity<(line->>'expectedQty')::numeric THEN 'Short' ELSE 'Completed' END));
  idx:=idx+1;
 END LOOP;
 IF jsonb_array_length(pack_items)>0 THEN
  INSERT INTO public.wms_jobs(country_code,site_id,type,priority,status,items_count,location,order_ref,line_items,source_site_id,dest_site_id,job_number,notes)
  VALUES(j.country_code,j.site_id,'PACK',j.priority,'Pending',jsonb_array_length(pack_items),'Packing Station 1',j.order_ref,pack_items,j.source_site_id,j.dest_site_id,j.job_number,
   CASE WHEN position('[STRICT_SCAN]' IN coalesce(j.notes,''))>0 THEN '[STRICT_SCAN]' ELSE NULL END) RETURNING * INTO pack;
 END IF;
 INSERT INTO private.pick_completions(job_id,actor_id,pack_job_id) VALUES(j.id,public.get_my_employee_id(),pack.id);
 UPDATE public.wms_jobs SET status='Completed',line_items=manifest,completed_by=public.get_my_employee_id()::text,completed_at=now() WHERE id=j.id RETURNING * INTO j;
 UPDATE public.job_assignments SET status='Completed',completed_at=j.completed_at WHERE job_id=j.id AND status<>'Completed';
 SELECT * INTO parent FROM public.wms_jobs WHERE type='TRANSFER' AND id::text=j.order_ref AND country_code=j.country_code AND coalesce(source_site_id,site_id)=j.site_id FOR UPDATE;
 IF parent.id IS NOT NULL THEN
  UPDATE public.wms_jobs SET transfer_status=CASE WHEN pack.id IS NULL THEN 'Cancelled' ELSE 'Picked' END,
   status=CASE WHEN pack.id IS NULL THEN 'Cancelled' ELSE status END,
   has_discrepancy=EXISTS(SELECT 1 FROM private.pick_line_receipts WHERE job_id=j.id AND shortage_reason IS NOT NULL)
   WHERE id=parent.id;
 END IF;
 IF online_order.id IS NULL THEN UPDATE public.sales SET fulfillment_status=CASE WHEN pack.id IS NULL THEN 'Pending' ELSE 'Packing' END WHERE id::text=j.order_ref AND site_id=j.site_id AND country_code=j.country_code; END IF;
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('PICK_COMPLETED','Fulfillment',public.get_my_employee_id(),j.site_id::text,j.country_code,'wms_job',j.id::text,jsonb_build_object('packJobId',pack.id,'noStockPicked',pack.id IS NULL)::text);
 RETURN jsonb_build_object('job',to_jsonb(j),'pack',CASE WHEN pack.id IS NOT NULL THEN to_jsonb(pack) ELSE NULL END);
END; $$;

CREATE OR REPLACE FUNCTION private.guard_verified_picking() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE idx integer:=0; line jsonb; receipt private.pick_line_receipts%ROWTYPE; completing boolean;
BEGIN
 IF auth.jwt()->>'role'='service_role' THEN RETURN NEW; END IF;
 IF TG_OP='INSERT' THEN
  IF NEW.type='PICK' AND (NEW.status='Completed' OR EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(NEW.line_items,'[]'))i WHERE coalesce((i->>'pickedQty')::numeric,0)<>0)) THEN RAISE EXCEPTION 'New PICK jobs require unverified quantities'; END IF;
  RETURN NEW;
 END IF;
 IF OLD.type<>'PICK' THEN
  IF NEW.type='PICK' THEN RAISE EXCEPTION 'Create a new picking manifest instead of changing job type'; END IF;
  RETURN NEW;
 END IF;
 IF NEW.type IS DISTINCT FROM OLD.type OR NEW.site_id IS DISTINCT FROM OLD.site_id OR NEW.country_code IS DISTINCT FROM OLD.country_code OR NEW.order_ref IS DISTINCT FROM OLD.order_ref THEN RAISE EXCEPTION 'PICK identity is immutable'; END IF;
 IF OLD.status='Completed' AND (NEW.line_items IS DISTINCT FROM OLD.line_items OR NEW.status IS DISTINCT FROM OLD.status) THEN RAISE EXCEPTION 'Completed picking is immutable'; END IF;
 completing:=NEW.status='Completed' AND OLD.status<>'Completed';
 IF completing AND NOT EXISTS(SELECT 1 FROM private.pick_completions WHERE job_id=OLD.id) THEN RAISE EXCEPTION 'Complete picking through its verified transaction'; END IF;
 IF NEW.line_items IS NOT DISTINCT FROM OLD.line_items THEN RETURN NEW; END IF;
 IF jsonb_array_length(NEW.line_items)<>jsonb_array_length(OLD.line_items) THEN RAISE EXCEPTION 'Picking manifest is immutable'; END IF;
 FOR line IN SELECT value FROM jsonb_array_elements(NEW.line_items) LOOP
  IF line IS DISTINCT FROM OLD.line_items->idx THEN
   SELECT * INTO receipt FROM private.pick_line_receipts WHERE job_id=OLD.id AND item_index=idx;
   IF receipt.job_id IS NULL OR (line-ARRAY['status','pickedQty','location','shortageReason']) IS DISTINCT FROM ((OLD.line_items->idx)-ARRAY['status','pickedQty','location','shortageReason'])
    OR (line->>'pickedQty')::numeric IS DISTINCT FROM receipt.quantity OR line->>'location' IS DISTINCT FROM receipt.source_location
    OR line->>'shortageReason' IS DISTINCT FROM receipt.shortage_reason
    OR line->>'status' IS DISTINCT FROM (CASE WHEN receipt.quantity<(line->>'expectedQty')::numeric THEN 'Short' WHEN completing THEN 'Completed' ELSE 'Picked' END)
   THEN RAISE EXCEPTION 'Picking updates require verified source-bin and product scans'; END IF;
  END IF;
  idx:=idx+1;
 END LOOP;
 RETURN NEW;
END; $$;
