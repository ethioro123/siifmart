CREATE OR REPLACE FUNCTION private.release_sale_to_picking(p_sale uuid, p_source uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE sale public.sales%ROWTYPE; source public.sites%ROWTYPE; dest public.sites%ROWTYPE; j public.wms_jobs%ROWTYPE; lines jsonb;
BEGIN
 PERFORM set_config('siifmart.sale_workflow','release',true);
 SELECT * INTO sale FROM public.sales WHERE id=p_sale FOR UPDATE;
 SELECT * INTO source FROM public.sites WHERE id=p_source AND type IN('Warehouse','Distribution Center');
 SELECT * INTO dest FROM public.sites WHERE id=sale.site_id;
 IF auth.uid() IS NULL OR NOT EXISTS(SELECT 1 FROM public.employees WHERE id=auth.uid() AND lower(status)='active'
 AND public.normalize_role(role) IN('group_ceo','country_managing_director','country_operations_director','country_supply_chain_director','regional_operations_manager','regional_supply_chain_manager','warehouse_manager'))
 OR sale.id IS NULL OR source.id IS NULL OR dest.country IS DISTINCT FROM source.country OR sale.country_code IS DISTINCT FROM source.country
 OR NOT public.is_site_in_my_authorized_scope(source.id::text,source.country)
 OR NOT (public.is_site_in_my_authorized_scope(dest.id::text,dest.country) OR (source.region_code IS NOT NULL AND source.region_code=dest.region_code)) THEN
 RAISE EXCEPTION 'Scoped warehouse release authority required' USING ERRCODE='42501'; END IF;
 SELECT * INTO j FROM public.wms_jobs WHERE order_ref=sale.id::text AND type='PICK' AND status NOT IN('Cancelled','Deleted') ORDER BY created_at LIMIT 1;
 IF sale.release_status='RELEASED' AND j.id IS NOT NULL THEN RETURN jsonb_build_object('saved',true,'jobId',j.id,'saleId',sale.id); END IF;
 IF sale.release_status IS DISTINCT FROM 'PENDING' OR sale.fulfillment_status='Delivered' OR sale.status<>'Completed' OR j.id IS NOT NULL THEN RAISE EXCEPTION 'Unreleased pending fulfillment order required'; END IF;
 SELECT jsonb_agg(jsonb_build_object('productId',p.id,'sku',p.sku,'name',si.product_name,'expectedQty',si.quantity,'pickedQty',0,'status','Pending')) INTO lines
 FROM public.sale_items si JOIN public.products p ON p.id=si.product_id AND p.site_id=sale.site_id WHERE si.sale_id=sale.id;
 IF lines IS NULL OR jsonb_array_length(lines)<>(SELECT count(*) FROM public.sale_items WHERE sale_id=sale.id) THEN RAISE EXCEPTION 'Complete country catalog identities required'; END IF;
 -- The existing FEFO insert trigger selects and reserves source-facility lots. Packing is created by verified pick completion.
 INSERT INTO public.wms_jobs(site_id,source_site_id,dest_site_id,country_code,type,status,priority,items_count,line_items,order_ref,job_number,location)
 VALUES(source.id,source.id,dest.id,source.country,'PICK','Pending','High',jsonb_array_length(lines),lines,sale.id::text,upper(left(replace(gen_random_uuid()::text,'-',''),8)),'') RETURNING * INTO j;
 UPDATE public.sales SET release_status='RELEASED',fulfillment_status='Picking' WHERE id=sale.id;
 RETURN jsonb_build_object('saved',true,'jobId',j.id,'saleId',sale.id);
END $function$;

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
 PERFORM set_config('siifmart.sale_workflow','pick',true);
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
END; $function$;

CREATE OR REPLACE FUNCTION private.sync_shipment_workflow()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  origin uuid := COALESCE(NEW.source_site_id,NEW.site_id);
  phase text := NEW.transfer_status;
BEGIN
 PERFORM set_config('siifmart.sale_workflow','shipment',true);
  IF NEW.type NOT IN ('DISPATCH','DRIVER','TRANSFER') OR
    (NEW.transfer_status IS NOT DISTINCT FROM OLD.transfer_status AND NEW.status IS NOT DISTINCT FROM OLD.status
     AND NEW.assigned_to IS NOT DISTINCT FROM OLD.assigned_to) THEN RETURN NEW; END IF;
  IF NEW.type IN ('DISPATCH','DRIVER') THEN
    UPDATE public.wms_jobs p SET
      transfer_status = phase,
      status = CASE WHEN phase IN ('Delivered','Partially Delivered') THEN 'Pending' ELSE p.status END,
      assigned_to = NEW.assigned_to, delivery_method = NEW.delivery_method,
      external_carrier_name = NEW.external_carrier_name,
      shipped_at = COALESCE(NEW.shipped_at,p.shipped_at), delivered_at = COALESCE(NEW.delivered_at,p.delivered_at),
      has_discrepancy = COALESCE(p.has_discrepancy,false) OR COALESCE(NEW.has_discrepancy,false)
    WHERE p.type = 'TRANSFER' AND p.country_code = NEW.country_code
      AND COALESCE(p.source_site_id,p.site_id) = origin AND p.dest_site_id IS NOT DISTINCT FROM NEW.dest_site_id
      AND NULLIF(NEW.order_ref,'') IS NOT NULL AND (p.id::text = NEW.order_ref OR p.job_number = NEW.order_ref OR p.order_ref = NEW.order_ref)
      AND p.transfer_status IS DISTINCT FROM 'Received' AND p.status <> 'Cancelled';
    IF phase IN ('Shipped','In-Transit','Delivered','Partially Delivered') THEN
      UPDATE public.sales SET fulfillment_status = CASE WHEN phase IN ('Shipped','In-Transit') THEN 'Shipped' ELSE 'Delivered' END
      WHERE id::text = NEW.order_ref AND site_id = origin AND country_code = NEW.country_code;
    END IF;
    INSERT INTO public.system_logs(action,module,entity_type,entity_id,performed_by,site_id,country_code,details)
    VALUES ('SHIPMENT_HANDOFF','Fulfillment','wms_job',NEW.id::text,auth.uid()::text,origin::text,NEW.country_code,
      jsonb_build_object('phase',phase,'previousPhase',OLD.transfer_status,'driverId',NEW.assigned_to,'receivingAccepted',false)::text);
  END IF;
  UPDATE public.transfers t SET
    transfer_status = phase,
    status = CASE WHEN NEW.type = 'TRANSFER' AND phase = 'Received' THEN 'Completed'
      WHEN phase = 'Cancelled' THEN 'Rejected'
      WHEN phase IN ('Shipped','In-Transit','Delivered','Partially Delivered') THEN 'In-Transit' ELSE t.status END,
    shipped_at = COALESCE(NEW.shipped_at,t.shipped_at), delivered_at = COALESCE(NEW.delivered_at,t.delivered_at),
    received_at = CASE WHEN NEW.type = 'TRANSFER' AND phase = 'Received' THEN NEW.received_at ELSE t.received_at END,
    received_by = CASE WHEN NEW.type = 'TRANSFER' AND phase = 'Received' THEN NEW.received_by ELSE t.received_by END,
    driver_id = (SELECT e.id FROM public.employees e WHERE e.id::text = NEW.assigned_to AND lower(e.role)='driver'),
    driver_type = lower(COALESCE(NEW.delivery_method,'Internal')),
    driver_name = CASE WHEN NEW.delivery_method = 'External' THEN NEW.external_carrier_name ELSE
      (SELECT e.name FROM public.employees e WHERE e.id::text = NEW.assigned_to AND lower(e.role)='driver') END,
    has_discrepancy = COALESCE(t.has_discrepancy,false) OR COALESCE(NEW.has_discrepancy,false)
  WHERE t.country_code = NEW.country_code AND t.source_site_id = origin AND t.dest_site_id IS NOT DISTINCT FROM NEW.dest_site_id
    AND (t.id::text = NEW.id::text OR (NULLIF(NEW.order_ref,'') IS NOT NULL AND (t.id::text = NEW.order_ref OR t.order_ref = NEW.order_ref)))
    AND t.transfer_status IS DISTINCT FROM 'Received' AND t.status <> 'Cancelled';
  RETURN NEW;
END;
$function$;

DROP POLICY sales_isolation_select ON public.sales;

CREATE POLICY sales_isolation_select ON public.sales FOR SELECT TO authenticated USING(
 public.is_site_in_my_authorized_scope(site_id::text,country_code) AND public.is_country_in_my_authorized_scope(country_code));

ALTER TABLE public.sales ADD COLUMN manual_payment_verified_by uuid, ADD COLUMN manual_payment_verified_at timestamptz;

CREATE TABLE private.manual_sale_payments(
 country_code text NOT NULL,channel text NOT NULL,reference text NOT NULL,sale_id uuid UNIQUE NOT NULL REFERENCES public.sales(id),
 verified_by uuid NOT NULL,verified_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(country_code,channel,reference));

ALTER TABLE private.manual_sale_payments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON private.manual_sale_payments FROM PUBLIC,anon,authenticated;

CREATE FUNCTION private.guard_sale_entry() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE;
BEGIN
 IF auth.role()='service_role' THEN RETURN NEW; END IF;
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';
 IF actor.id IS NULL OR actor.role NOT IN('cashier','head_cashier','store_manager','assistant_store_manager','shift_supervisor','pos_supervisor','customer_service','group_ceo')
 OR NOT public.is_site_in_my_authorized_scope(NEW.site_id::text,NEW.country_code)
 OR NOT public.is_country_in_my_authorized_scope(NEW.country_code) THEN
 RAISE EXCEPTION 'Authorized sales employee required' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.shifts WHERE cashier_id=actor.id AND site_id=NEW.site_id AND country_code=NEW.country_code AND status='Open') THEN
 RAISE EXCEPTION 'Open your assigned counter before recording a sale'; END IF;
 NEW.manual_payment_verified_by:=NULL;NEW.manual_payment_verified_at:=NULL;
 IF NEW.payment_method='Mobile Money' THEN
  IF length(btrim(coalesce(NEW.mobile_transaction_ref,''))) NOT BETWEEN 4 AND 200
  OR (NEW.country_code='ET' AND NEW.mobile_payment_channel NOT IN('TELEBIRR','CBE_BIRR'))
  OR (NEW.country_code='KE' AND NEW.mobile_payment_channel NOT IN('MPESA_TILL','MPESA_PAYBILL','AIRTEL_MONEY'))
  OR NEW.mobile_payment_channel IS NULL
  OR current_setting('siifmart.manual_payment_confirmed',true) IS DISTINCT FROM 'true' THEN
  RAISE EXCEPTION 'Actual payment reference and manual receipt confirmation required'; END IF;
  NEW.mobile_transaction_ref:=upper(btrim(NEW.mobile_transaction_ref));
  NEW.manual_payment_verified_by:=actor.id;NEW.manual_payment_verified_at:=now();
 END IF;
 RETURN NEW;
END $$;

CREATE FUNCTION private.post_manual_sale_payment() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.manual_payment_verified_by IS NOT NULL THEN
 INSERT INTO private.manual_sale_payments(country_code,channel,reference,sale_id,verified_by)
 VALUES(NEW.country_code,NEW.mobile_payment_channel,NEW.mobile_transaction_ref,NEW.id,NEW.manual_payment_verified_by);
 END IF;RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION private.guard_sale_entry(),private.post_manual_sale_payment() FROM PUBLIC,anon,authenticated;

CREATE TRIGGER zz_sale_entry BEFORE INSERT ON public.sales FOR EACH ROW EXECUTE FUNCTION private.guard_sale_entry();

CREATE TRIGGER post_manual_sale_payment AFTER INSERT ON public.sales FOR EACH ROW EXECUTE FUNCTION private.post_manual_sale_payment();

