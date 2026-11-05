-- Close alternate operational writes; preserve trusted physical commands.
CREATE FUNCTION private.guard_stock_posting() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role()='service_role' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND NEW.stock IS DISTINCT FROM OLD.stock
 AND coalesce(current_setting('siifmart.stock_command',true),'') NOT IN('pick','putaway','transfer','adjustment','merge')
 AND current_setting('app.pos_sale_stock_decrement',true) IS DISTINCT FROM OLD.id::text THEN
 RAISE EXCEPTION 'Stock changes require a verified operation or approved adjustment' USING ERRCODE='42501'; END IF;
 IF TG_OP='INSERT' AND coalesce(current_setting('siifmart.stock_command',true),'') NOT IN('putaway','transfer','adjustment','merge') THEN
  IF coalesce(NEW.stock,0)<>0 THEN RAISE EXCEPTION 'New stock requires a verified operation' USING ERRCODE='42501'; END IF;
  NEW.approval_status:='pending';NEW.approved_by:=NULL;NEW.approved_at:=NULL;
  NEW.price:=0;NEW.sale_price:=NULL;NEW.is_on_sale:=false;
 END IF;
 RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION private.guard_stock_posting() FROM PUBLIC,anon,authenticated;

CREATE TRIGGER zz_trusted_stock_posting BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION private.guard_stock_posting();

CREATE OR REPLACE FUNCTION private.complete_pick_job(p_job_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE j public.wms_jobs%ROWTYPE; pack public.wms_jobs%ROWTYPE; done private.pick_completions%ROWTYPE;
 r private.pick_line_receipts%ROWTYPE; p public.products%ROWTYPE; online_order public.storefront_orders%ROWTYPE;
 line jsonb; manifest jsonb:='[]'; pack_items jsonb:='[]'; idx integer:=0; parent public.wms_jobs%ROWTYPE;
BEGIN
 PERFORM set_config('siifmart.stock_command','pick',true);
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
 INSERT INTO private.pick_completions(job_id,actor_id) VALUES(j.id,public.get_my_employee_id());
 -- Stable lock order protects the exact manifest lots across concurrent picks.
 PERFORM 1 FROM public.products WHERE id IN(SELECT product_id FROM private.pick_line_receipts WHERE job_id=j.id) ORDER BY id FOR UPDATE;
 FOR line IN SELECT value FROM jsonb_array_elements(j.line_items) LOOP
  SELECT * INTO r FROM private.pick_line_receipts WHERE job_id=j.id AND item_index=idx;
  IF r.job_id IS NULL OR r.quantity IS DISTINCT FROM (line->>'pickedQty')::numeric OR line->>'status' NOT IN ('Picked','Short') THEN RAISE EXCEPTION 'Scan and verify every picking line before completion'; END IF;
  SELECT * INTO p FROM public.products WHERE id=r.product_id AND site_id=j.site_id AND sku=line->>'sku';
  IF p.id IS NULL OR p.location IS DISTINCT FROM r.source_location OR p.id::text IS DISTINCT FROM line->>'productId' OR p.batch_number IS DISTINCT FROM r.batch_number OR p.expiry_date IS DISTINCT FROM r.expiry_date THEN RAISE EXCEPTION 'Verified source lot or bin changed; no stock was deducted'; END IF;
  IF r.quantity>0 AND coalesce(line->>'fefoAllocated','false')<>'true' THEN RAISE EXCEPTION 'Legacy picking evidence needs supervisor reconciliation before deduction' USING ERRCODE='P0001',DETAIL='PICK_LEGACY_RECONCILIATION_REQUIRED'; END IF;
  IF r.quantity>0 AND (p.expiry_date<private.fefo_today(j.site_id) OR lower(p.status) IS DISTINCT FROM 'active' OR EXISTS(SELECT 1 FROM public.warehouse_zones z WHERE z.id=p.zone_id AND (coalesce(z.is_locked,false) OR z.allow_picking=false))) THEN RAISE EXCEPTION 'The verified lot is expired or unavailable; no stock was deducted' USING ERRCODE='P0001',DETAIL='PICK_LOT_UNAVAILABLE'; END IF;
  IF r.quantity>0 AND p.expiry_date IS NULL AND nullif(line->>'expiryDate','') IS NOT NULL THEN RAISE EXCEPTION 'Lot expiry evidence changed'; END IF;
  IF online_order.id IS NOT NULL THEN
   IF r.quantity<>(line->>'expectedQty')::numeric THEN RAISE EXCEPTION 'Resolve online order shortages before completion'; END IF;
   UPDATE public.storefront_stock_reservations SET released_at=now() WHERE order_id=online_order.id AND product_id=p.id AND released_at IS NULL AND quantity=r.quantity;
   IF NOT FOUND THEN RAISE EXCEPTION 'Online stock reservation changed'; END IF;
  END IF;
  IF r.quantity>0 THEN
   IF p.expiry_date<private.fefo_today(j.site_id) OR lower(p.status) IN ('quarantined','damaged','expired','inactive') THEN RAISE EXCEPTION 'Verified stock is no longer available for picking'; END IF;
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
 UPDATE private.pick_completions SET pack_job_id=pack.id WHERE job_id=j.id;
 UPDATE public.wms_jobs SET status='Completed',line_items=manifest,completed_by=public.get_my_employee_id()::text,completed_at=now() WHERE id=j.id RETURNING * INTO j;
 UPDATE public.job_assignments SET status='Completed',completed_at=j.completed_at WHERE job_id=j.id AND status IN('Assigned','Accepted','In-Progress','Paused');
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
END; $function$

CREATE OR REPLACE FUNCTION private.place_putaway_stock(p_job_id uuid, p_item_index integer, p_quantity numeric, p_location text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE actor public.employees%ROWTYPE; job public.wms_jobs%ROWTYPE;
 source public.products%ROWTYPE; destination public.products%ROWTYPE;
 line jsonb; expected numeric; item_sku text; bin_code text := upper(btrim(p_location)); country text;
 next_line jsonb; manager boolean; job_ref text; receiving_day date;
 target_zone public.warehouse_zones%ROWTYPE; zone_count integer; used numeric; required_storage text; actual_storage text;
BEGIN
 PERFORM set_config('siifmart.stock_command','putaway',true);
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authenticated warehouse employee required' USING ERRCODE='42501'; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 IF actor.id IS NULL THEN RAISE EXCEPTION 'Active warehouse employee required' USING ERRCODE='42501'; END IF;
 SELECT * INTO job FROM public.wms_jobs WHERE id=p_job_id FOR UPDATE;
 IF job.id IS NULL OR job.type<>'PUTAWAY' OR job.status NOT IN ('Pending','In-Progress') THEN
  RAISE EXCEPTION 'Active PUTAWAY job required'; END IF;
 SELECT upper(s.country) INTO country FROM public.sites s WHERE s.id=job.site_id AND s.type IN ('Warehouse','Distribution Center');
 manager := actor.role IN ('group_ceo','warehouse_manager','country_operations_director','country_managing_director');
 IF NOT manager AND actor.role NOT IN ('picker','packer','receiver','receiving_operator','putaway_operator','replenishment_operator','inventory_controller','stock_counter','dispatch_operator','returns_operator','fleet_mechanic','inventory_specialist','forklift_operator','stock_clerk','inbound_qc_inspector','returns_clerk','driver') THEN
  RAISE EXCEPTION 'Warehouse floor role required' USING ERRCODE='42501'; END IF;
 IF country IS NULL OR country IS DISTINCT FROM upper(job.country_code)
  OR NOT public.is_site_in_my_authorized_scope(job.site_id::text,country)
  OR (actor.role<>'group_ceo' AND (actor.site_id IS DISTINCT FROM job.site_id OR country IS DISTINCT FROM public.get_my_country_code_strict()))
  OR (NOT manager AND (job.assigned_to IS DISTINCT FROM actor.id::text OR NOT EXISTS
    (SELECT 1 FROM public.job_assignments a WHERE a.job_id=job.id AND a.employee_id=actor.id))) THEN
  RAISE EXCEPTION 'Putaway requires the assigned worker at this facility' USING ERRCODE='42501'; END IF;
 IF p_item_index IS NULL OR p_item_index<0 OR p_item_index>=jsonb_array_length(job.line_items) THEN RAISE EXCEPTION 'Invalid job line'; END IF;
 line:=job.line_items->p_item_index;
 IF coalesce(line->>'status','Pending') IN ('Picked','Completed','Short') THEN RAISE EXCEPTION 'Placement already recorded; refresh the job'; END IF;
 expected:=coalesce((line->>'expectedQty')::numeric,0); item_sku:=nullif(btrim(line->>'sku'),'');
 IF item_sku IS NULL OR p_quantity IS NULL OR p_quantity::text IN ('NaN','Infinity','-Infinity') OR p_quantity<=0 OR p_quantity>expected THEN RAISE EXCEPTION 'Invalid physical placement quantity'; END IF;
 IF bin_code IS NULL OR bin_code !~ '^[A-Z]-[0-9]{2}-[0-9]{2}$' OR bin_code ~ '-00' THEN RAISE EXCEPTION 'Scan a valid storage bin'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(job.site_id::text||':'||item_sku||':'||bin_code,0));
 IF coalesce(line->>'condition','Good') <> 'Good' THEN RAISE EXCEPTION 'Hold damaged or rejected goods for supervised resolution before putaway'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('putaway-capacity:'||job.site_id::text,0));
 SELECT p.* INTO source FROM public.products p WHERE p.site_id=job.site_id AND p.sku=item_sku
 ORDER BY (p.id::text=coalesce(line->>'productId','')) DESC,(coalesce(p.stock,0)=0 AND p.location='On Order') DESC,p.id LIMIT 1 FOR UPDATE;
 IF source.id IS NULL THEN RAISE EXCEPTION 'Receiving product is missing at this facility'; END IF;

 required_storage:=lower(coalesce(nullif(source.custom_attributes#>>'{storage,type}',''),source.category,''));
 required_storage:=CASE WHEN required_storage ~ 'froz|freez' THEN 'frozen' WHEN required_storage ~ 'chill|cold|refriger' THEN 'chilled' ELSE 'ambient' END;
 IF coalesce(nullif(line->>'expiryDate','')::date,source.expiry_date)<current_date OR lower(source.status) IN ('quarantined','damaged','expired') THEN
  RAISE EXCEPTION 'Hold expired or unavailable goods for supervised resolution'; END IF;
 SELECT count(*) INTO zone_count FROM public.warehouse_zones z WHERE z.site_id=job.site_id
 AND (upper(btrim(z.name)) ~ ('^(ZONE[[:space:]]+)?'||left(bin_code,1)||'($|[[:space:]-])')
 OR EXISTS(SELECT 1 FROM public.products p WHERE p.site_id=job.site_id AND p.zone_id=z.id AND upper(p.location) LIKE left(bin_code,1)||'-%'));
 IF zone_count>1 THEN RAISE EXCEPTION 'Storage zone mapping is ambiguous'; END IF;
 SELECT z.* INTO target_zone FROM public.warehouse_zones z WHERE z.site_id=job.site_id
 AND (upper(btrim(z.name)) ~ ('^(ZONE[[:space:]]+)?'||left(bin_code,1)||'($|[[:space:]-])')
 OR EXISTS(SELECT 1 FROM public.products p WHERE p.site_id=job.site_id AND p.zone_id=z.id AND upper(p.location) LIKE left(bin_code,1)||'-%')) FOR UPDATE;
 IF target_zone.id IS NULL THEN
  IF required_storage<>'ambient' OR EXISTS(SELECT 1 FROM public.warehouse_zones z WHERE z.site_id=job.site_id) THEN
   RAISE EXCEPTION 'Configure a compatible storage zone for this bin'; END IF;
 ELSE
  IF coalesce(target_zone.is_locked,false) OR target_zone.allow_putaway=false OR lower(target_zone.type) IN ('staging','damaged','secure') THEN
   RAISE EXCEPTION 'This zone is locked or unavailable for putaway'; END IF;
  actual_storage:=lower(coalesce(nullif(target_zone.temperature,''),target_zone.type,''));
  actual_storage:=CASE WHEN actual_storage ~ 'froz|freez' THEN 'frozen' WHEN actual_storage ~ 'chill|cold|refriger' THEN 'chilled' ELSE 'ambient' END;
  IF actual_storage<>required_storage THEN RAISE EXCEPTION 'Product storage requirement does not match the zone'; END IF;
  SELECT greatest(coalesce(target_zone.occupied,0),coalesce(sum(greatest(p.stock,0)),0)) INTO used FROM public.products p
   WHERE p.site_id=job.site_id AND (p.zone_id=target_zone.id OR upper(p.location) LIKE left(bin_code,1)||'-%');
  IF target_zone.capacity>0 AND used+p_quantity>target_zone.capacity THEN RAISE EXCEPTION 'Storage zone capacity would be exceeded'; END IF;
 END IF;

 receiving_day:=private.putaway_receiving_day(job.id);
 PERFORM set_config('siifmart.putaway_job',job.id::text,true);
 IF EXISTS(SELECT 1 FROM public.products p WHERE p.site_id=job.site_id AND p.location=bin_code AND p.stock>0 AND
 (p.sku IS DISTINCT FROM item_sku OR lower(p.status) IN('quarantined','damaged','expired','inactive') OR p.expiry_date<current_date OR NOT (
 (p.batch_number IS NOT DISTINCT FROM coalesce(nullif(line->>'batchNumber',''),source.batch_number)
 AND p.expiry_date IS NOT DISTINCT FROM coalesce(nullif(line->>'expiryDate','')::date,source.expiry_date))
 OR (receiving_day IS NOT NULL AND p.received_on=receiving_day)))) THEN
  RAISE EXCEPTION 'The bin has stock from an incompatible lot or receiving day. Scan another bin.' USING ERRCODE='P0001',DETAIL='PUTAWAY_BIN_LOT_CONFLICT'; END IF;
 SELECT p.* INTO destination FROM public.products p WHERE p.site_id=job.site_id AND p.sku=item_sku AND p.location=bin_code
 AND ((p.batch_number IS NOT DISTINCT FROM coalesce(nullif(line->>'batchNumber',''),source.batch_number)
 AND p.expiry_date IS NOT DISTINCT FROM coalesce(nullif(line->>'expiryDate','')::date,source.expiry_date)
 AND p.received_on IS NOT DISTINCT FROM receiving_day) OR coalesce(p.stock,0)=0)
 ORDER BY (p.batch_number IS NOT DISTINCT FROM coalesce(nullif(line->>'batchNumber',''),source.batch_number)
 AND p.expiry_date IS NOT DISTINCT FROM coalesce(nullif(line->>'expiryDate','')::date,source.expiry_date)
 AND p.received_on IS NOT DISTINCT FROM receiving_day) DESC,p.id LIMIT 1 FOR UPDATE;
 IF destination.id IS NOT NULL THEN
  UPDATE public.products SET stock=coalesce(stock,0)+p_quantity,status='active',received_on=receiving_day,
    batch_number=coalesce(nullif(line->>'batchNumber',''),source.batch_number),
    expiry_date=coalesce(nullif(line->>'expiryDate','')::date,source.expiry_date)
  WHERE id=destination.id RETURNING * INTO destination;
 ELSIF coalesce(source.stock,0)=0 AND source.location IN ('On Order','Receiving Dock','Pending Putaway') THEN
  UPDATE public.products SET location=bin_code,stock=p_quantity,status='active',received_on=receiving_day,
    batch_number=coalesce(nullif(line->>'batchNumber',''),source.batch_number),
    expiry_date=coalesce(nullif(line->>'expiryDate','')::date,source.expiry_date)
  WHERE id=source.id RETURNING * INTO destination;
 ELSE
  INSERT INTO public.products SELECT (jsonb_populate_record(NULL::public.products,to_jsonb(source)||jsonb_build_object(
    'id',gen_random_uuid(),'received_on',receiving_day,'location',bin_code,'stock',p_quantity,'status','active','created_at',now(),'updated_at',now(),
    'batch_number',coalesce(nullif(line->>'batchNumber',''),source.batch_number),
    'expiry_date',coalesce(nullif(line->>'expiryDate','')::date,source.expiry_date)))).* RETURNING * INTO destination;
 END IF;
 IF destination.site_id IS DISTINCT FROM job.site_id OR destination.location IS DISTINCT FROM bin_code THEN
  RAISE EXCEPTION 'Placement location was changed before confirmation';
 END IF;
 IF target_zone.id IS NOT NULL THEN UPDATE public.products SET zone_id=target_zone.id WHERE id=destination.id; END IF;
 next_line:=line||jsonb_build_object('status',CASE WHEN p_quantity<expected THEN 'Short' ELSE 'Picked' END,
   'pickedQty',p_quantity,'location',bin_code);
 UPDATE public.wms_jobs SET line_items=jsonb_set(line_items,ARRAY[p_item_index::text],next_line),status='In-Progress' WHERE id=job.id;

 -- Use job's own readable job_number (separate from PO, similar to pick/pack)
 job_ref := coalesce(
   nullif(job.job_number, ''),
   upper(substr(replace(job.id::text, '-', ''), 1, 6))
 );

 INSERT INTO public.stock_movements(site_id,product_id,product_name,type,quantity,movement_date,performed_by,reason,batch_number)
 VALUES(job.site_id,destination.id,destination.name,'IN',p_quantity,now(),actor.name,'Putaway job '||job_ref||' line '||(p_item_index+1)||' to '||bin_code,destination.batch_number);
 PERFORM set_config('siifmart.putaway_job','',true);
 RETURN jsonb_build_object('product_id',destination.id,'job_id',job.id,'item_index',p_item_index,'quantity',p_quantity,'location',bin_code);
END;
$function$;

CREATE OR REPLACE FUNCTION private.accept_verified_transfer(p_job uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE actor public.employees%ROWTYPE; job public.wms_jobs%ROWTYPE;
 check_row public.transfer_receipt_verifications%ROWTYPE; prior private.transfer_intake_posts%ROWTYPE;
 source public.products%ROWTYPE; dest public.products%ROWTYPE; original jsonb; counted jsonb; line jsonb;
 manifest jsonb; received_lines jsonb:='[]'; idx integer:=0; qty numeric; stamp timestamptz:=clock_timestamp();
 result jsonb; batch text; expiry date; role_name text; posted jsonb:='[]'; putaway_lines jsonb:='[]'; warehouse_destination boolean; putaway_id uuid;
BEGIN
 PERFORM set_config('siifmart.stock_command','transfer',true);
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 SELECT * INTO job FROM public.wms_jobs WHERE id=p_job AND type='TRANSFER' FOR UPDATE;
 role_name:=public.normalize_role(actor.role);
 IF actor.id IS NULL OR job.id IS NULL OR job.dest_site_id IS NULL
 OR NOT public.is_site_in_my_authorized_scope(job.dest_site_id::text,job.country_code)
 OR role_name NOT IN ('group_ceo','country_managing_director','country_operations_director','country_supply_chain_director',
 'regional_operations_manager','regional_supply_chain_manager','regional_logistics_manager','warehouse_manager',
 'store_manager','receiver','inventory_manager','inventory_specialist','dispatch_supervisor','replenishment_planner') THEN
 RAISE EXCEPTION 'Authenticated destination receiving authority required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.sites d JOIN public.sites s ON s.id=coalesce(job.source_site_id,job.site_id)
 WHERE d.id=job.dest_site_id AND d.country=job.country_code AND s.country=d.country) THEN
 RAISE EXCEPTION 'Transfer route must remain within its country' USING ERRCODE='42501'; END IF;
 SELECT * INTO prior FROM private.transfer_intake_posts WHERE job_id=job.id;
 IF prior.job_id IS NOT NULL THEN RETURN prior.confirmation; END IF;
 IF job.transfer_status NOT IN('Delivered','Partially Delivered') OR job.status IN('Cancelled','Deleted') THEN
 RAISE EXCEPTION 'Recorded arrival required; completed legacy receipts require reconciliation'; END IF;
 SELECT * INTO check_row FROM public.transfer_receipt_verifications WHERE job_id=job.id FOR UPDATE;
 IF check_row.status IS DISTINCT FROM 'verified' OR coalesce(check_row.second_counter_id,check_row.first_counter_id) IS DISTINCT FROM actor.id
 OR check_row.site_id IS DISTINCT FROM job.dest_site_id OR check_row.country_code IS DISTINCT FROM job.country_code THEN
 RAISE EXCEPTION 'Accept the saved count as its authenticated receiving custodian' USING ERRCODE='42501'; END IF;
 SELECT items INTO manifest FROM private.transfer_receipt_manifests WHERE job_id=job.id;
 IF jsonb_typeof(manifest) IS DISTINCT FROM 'array' OR jsonb_array_length(manifest)=0
 OR jsonb_array_length(manifest) IS DISTINCT FROM jsonb_array_length(check_row.final_counts) THEN
 RAISE EXCEPTION 'Complete saved arrival and physical count required'; END IF;
 IF check_row.has_discrepancy AND NOT EXISTS(SELECT 1 FROM private.transfer_variance_approvals a
 WHERE a.job_id=job.id AND a.fingerprint=private.transfer_variance_fingerprint(job.id)
 AND a.driver_id IS NOT NULL AND a.supervisor_id IS NOT NULL AND a.driver_id<>a.supervisor_id
 AND a.supervisor_id IS DISTINCT FROM check_row.first_counter_id AND a.supervisor_id IS DISTINCT FROM check_row.second_counter_id
 AND a.driver_id::text=job.assigned_to) THEN
 RAISE EXCEPTION 'Transfer variance requires independent supervisor approval and driver co-sign' USING ERRCODE='42501',DETAIL='TRANSFER_VARIANCE_REVIEW_REQUIRED'; END IF;
 SELECT type IN('Warehouse','Distribution Center') INTO warehouse_destination FROM public.sites WHERE id=job.dest_site_id;
 -- One destination lock serializes different shipments of the same SKU/lot as well as first product creation.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('transfer-intake:'||job.dest_site_id::text||':'||job.country_code,0));
 INSERT INTO private.transfer_intake_posts(job_id,site_id,country_code,employee_id) VALUES(job.id,job.dest_site_id,job.country_code,actor.id);
 PERFORM set_config('siifmart.transfer_intake_job',job.id::text,true);
 FOR original IN SELECT value FROM jsonb_array_elements(manifest) LOOP
  counted:=check_row.final_counts->idx;
  IF coalesce(job.line_items->idx->>'productId',job.line_items->idx->>'product_id',job.line_items->idx->>'id','')
   IS DISTINCT FROM coalesce(original->>'productId',original->>'product_id',original->>'id','')
   OR job.line_items->idx->>'sku' IS DISTINCT FROM original->>'sku' THEN
   RAISE EXCEPTION 'Transfer identity changed after recorded arrival'; END IF;
  IF coalesce(counted->>'productId','') IS DISTINCT FROM coalesce(original->>'productId',original->>'product_id',original->>'id','') THEN
  RAISE EXCEPTION 'Saved count identity does not match arrival'; END IF;
  qty:=(counted->>'receivedQty')::numeric;
  IF qty IS NULL OR qty::text IN('NaN','Infinity','-Infinity') OR qty<0 OR qty>100000000
  OR coalesce(counted->>'condition','Good') NOT IN('Good','Damaged','Short') THEN RAISE EXCEPTION 'Invalid saved physical count'; END IF;
  line:=coalesce(job.line_items->idx,'{}')||jsonb_build_object('receivedQty',qty,'received_qty',qty,
   'condition',coalesce(counted->>'condition','Good'),'status',CASE WHEN check_row.has_discrepancy THEN 'Discrepancy' ELSE 'Completed' END);
  received_lines:=received_lines||jsonb_build_array(line);
  IF qty>0 AND coalesce(counted->>'condition','Good')<>'Damaged' THEN
   SELECT p.* INTO source FROM public.products p WHERE p.id=coalesce(original->>'productId',original->>'product_id',original->>'id')::uuid
   AND p.site_id=coalesce(job.source_site_id,job.site_id) AND p.sku=original->>'sku' FOR SHARE;
   IF source.id IS NULL THEN RAISE EXCEPTION 'Trusted source product is missing'; END IF;
   batch:=coalesce(nullif(original->>'batchNumber',''),source.batch_number);
   expiry:=coalesce(nullif(original->>'expiryDate','')::date,source.expiry_date);
   IF expiry<current_date THEN RAISE EXCEPTION 'Expired arrivals require a supervised hold before stock intake'; END IF;
   SELECT p.* INTO dest FROM public.products p WHERE p.site_id=job.dest_site_id AND p.sku=source.sku
   AND p.batch_number IS NOT DISTINCT FROM batch AND p.expiry_date IS NOT DISTINCT FROM expiry
   AND p.status<>'archived' ORDER BY p.id LIMIT 1 FOR UPDATE;
   IF dest.id IS NULL THEN
    INSERT INTO public.products(site_id,name,sku,category,price,cost_price,stock,status,location,barcode,barcodes,brand,size,unit,
     image,description,custom_attributes,min_stock,max_stock,pack_quantity,product_id,master_id,approval_status,batch_number,expiry_date,created_by)
    VALUES(job.dest_site_id,source.name,source.sku,source.category,source.price,source.cost_price,0,'active','Receiving Dock',source.barcode,
     source.barcodes,source.brand,source.size,source.unit,source.image,source.description,source.custom_attributes,source.min_stock,
     source.max_stock,source.pack_quantity,source.product_id,source.master_id,source.approval_status,batch,expiry,actor.name) RETURNING * INTO dest;
   END IF;
   IF warehouse_destination THEN
    putaway_lines:=putaway_lines||jsonb_build_array(jsonb_build_object('productId',dest.id,'sku',source.sku,'name',source.name,'expectedQty',qty,'pickedQty',0,'status','Pending','condition','Good','batchNumber',batch,'expiryDate',expiry));
   ELSE
   posted:=posted||jsonb_build_array(jsonb_build_object('productId',dest.id,'quantity',qty));
   UPDATE private.transfer_intake_posts SET items=posted WHERE job_id=job.id;
   UPDATE public.products SET stock=coalesce(stock,0)+qty,status='active',pos_received_at=stamp,pos_received_by=actor.name
   WHERE id=dest.id;
   INSERT INTO public.stock_movements(site_id,product_id,product_name,type,quantity,movement_date,performed_by,reason,batch_number)
   VALUES(job.dest_site_id,dest.id,dest.name,'IN',qty,stamp,actor.name,
    'Transfer receipt '||coalesce(job.job_number,job.id::text)||' line '||(idx+1),batch);
   END IF;
  END IF;
  idx:=idx+1;
 END LOOP;
 IF jsonb_array_length(putaway_lines)>0 THEN
  INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,items_count,line_items,order_ref,job_number,location)
  VALUES(job.dest_site_id,job.country_code,'PUTAWAY','Pending',job.priority,jsonb_array_length(putaway_lines),putaway_lines,job.id::text,
   upper(left(replace(gen_random_uuid()::text,'-',''),8)),'Receiving Dock') RETURNING id INTO putaway_id;
 END IF;
 -- Existing workflow triggers enforce arrival, saved count, receiver identity and linked transfer scope.
 UPDATE public.wms_jobs SET transfer_status='Received',status='Completed',received_at=stamp,received_by=actor.name,
 line_items=received_lines,has_discrepancy=coalesce(check_row.has_discrepancy,false),
 discrepancy_details=CASE WHEN check_row.has_discrepancy THEN 'Saved physical receipt variance' ELSE NULL END WHERE id=job.id;
 result:=jsonb_build_object('saved',true,'jobId',job.id,'siteId',job.dest_site_id,'countryCode',job.country_code,
 'putawayJobId',putaway_id,'receivedAt',stamp,'hasDiscrepancy',coalesce(check_row.has_discrepancy,false));
 UPDATE private.transfer_intake_posts SET confirmation=result WHERE job_id=job.id;
 INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('VERIFIED_TRANSFER_INTAKE','Fulfillment',actor.name,actor.id::text,job.dest_site_id::text,job.country_code,'wms_job',job.id::text,result::text);
 PERFORM set_config('siifmart.transfer_intake_job','',true);
 RETURN result;
END $function$

CREATE OR REPLACE FUNCTION public.merge_duplicate_product_sku(p_country text, p_surviving_sku text, p_deprecated_sku text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_surviving_master_id uuid;
  v_deprecated_master_id uuid;
  v_dep_rec RECORD;
  v_surv_rec RECORD;
  v_merged_stock numeric := 0;
  v_sites_affected integer := 0;
BEGIN
 PERFORM set_config('siifmart.stock_command','merge',true);
  -- 1. Security & Sovereignty checks
  IF NOT public.is_hq_executive() THEN
    RAISE EXCEPTION 'Unauthorized: Only HQ Executives can merge product SKUs';
  END IF;

  IF p_surviving_sku = p_deprecated_sku THEN
    RAISE EXCEPTION 'Surviving SKU and Deprecated SKU cannot be the same';
  END IF;

  -- 2. Fetch master catalog records if available
  BEGIN
    SELECT id INTO v_surviving_master_id
    FROM product_master
    WHERE country_code = p_country AND sku = p_surviving_sku;

    SELECT id INTO v_deprecated_master_id
    FROM product_master
    WHERE country_code = p_country AND sku = p_deprecated_sku;
  EXCEPTION WHEN OTHERS THEN
    v_surviving_master_id := NULL;
    v_deprecated_master_id := NULL;
  END;

  -- 3. Iterate over every site having the deprecated SKU in this country
  FOR v_dep_rec IN
    SELECT p.*
    FROM products p
    JOIN sites s ON s.id = p.site_id
    WHERE s.country = p_country AND p.sku = p_deprecated_sku
  LOOP
    -- Check if this site already has a row for the surviving SKU
    SELECT * INTO v_surv_rec
    FROM products
    WHERE site_id = v_dep_rec.site_id AND sku = p_surviving_sku
    LIMIT 1;

    IF FOUND THEN
      -- CASE A: Site has BOTH rows -> Consolidate into the surviving row
      UPDATE po_items SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;
      UPDATE sale_items SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;
      UPDATE stock_movements SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;
      UPDATE barcode_approvals SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;
      UPDATE discrepancy_resolutions SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;
      UPDATE products SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;

      -- Consolidate physical stock and merge barcode aliases
      UPDATE products
      SET
        stock = COALESCE(stock, 0) + COALESCE(v_dep_rec.stock, 0),
        barcodes = (
          SELECT array_agg(DISTINCT b)
          FROM unnest(
            COALESCE(v_surv_rec.barcodes, ARRAY[]::text[]) ||
            COALESCE(v_dep_rec.barcodes, ARRAY[]::text[]) ||
            CASE WHEN v_dep_rec.barcode IS NOT NULL AND v_dep_rec.barcode <> '' THEN ARRAY[v_dep_rec.barcode] ELSE ARRAY[]::text[] END
          ) AS b
          WHERE b IS NOT NULL AND b <> ''
        ),
        barcode = COALESCE(barcode, v_dep_rec.barcode),
        updated_at = now()
      WHERE id = v_surv_rec.id;

      v_merged_stock := v_merged_stock + COALESCE(v_dep_rec.stock, 0);

      -- Safely delete the deprecated product row
      DELETE FROM products WHERE id = v_dep_rec.id;

    ELSE
      -- CASE B: Site only has the deprecated row -> Simply rename to surviving SKU
      UPDATE products
      SET
        sku = p_surviving_sku,
        updated_at = now()
      WHERE id = v_dep_rec.id;
    END IF;

    v_sites_affected := v_sites_affected + 1;
  END LOOP;

  -- 4. Update po_items that still reference the old SKU by text
  UPDATE po_items
  SET sku = p_surviving_sku
  WHERE sku = p_deprecated_sku;

  -- 5. Mark deprecated master as MERGED in product_master if table exists
  IF v_deprecated_master_id IS NOT NULL AND v_surviving_master_id IS NOT NULL THEN
    UPDATE product_master
    SET
      status = 'MERGED',
      merged_into_id = v_surviving_master_id,
      updated_at = now()
    WHERE id = v_deprecated_master_id;
  END IF;

  RETURN jsonb_build_object(
    'country', p_country,
    'surviving_sku', p_surviving_sku,
    'deprecated_sku', p_deprecated_sku,
    'sites_affected', v_sites_affected,
    'consolidated_stock', v_merged_stock,
    'status', 'success'
  );
END;
$function$;

CREATE FUNCTION private.guard_sale_workflow_write() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role()='service_role' THEN RETURN NEW; END IF;
 IF (NEW.fulfillment_status,NEW.release_status) IS DISTINCT FROM (OLD.fulfillment_status,OLD.release_status)
 AND coalesce(current_setting('siifmart.sale_workflow',true),'') NOT IN('release','pick','shipment') THEN
 RAISE EXCEPTION 'Sale fulfillment requires verified warehouse work' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION private.guard_sale_workflow_write() FROM PUBLIC,anon,authenticated;

CREATE TRIGGER zz_sale_workflow_write BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION private.guard_sale_workflow_write();

