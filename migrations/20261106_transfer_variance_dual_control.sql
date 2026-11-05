CREATE TABLE private.transfer_variance_approvals(
 job_id uuid PRIMARY KEY REFERENCES public.wms_jobs(id),fingerprint text NOT NULL,
 driver_id uuid REFERENCES public.employees(id),driver_at timestamptz,
 supervisor_id uuid REFERENCES public.employees(id),supervisor_at timestamptz,reason text
);
ALTER TABLE private.transfer_variance_approvals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.transfer_variance_approvals FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.transfer_variance_fingerprint(p_job uuid) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT md5(jsonb_build_array(j.source_site_id,j.dest_site_id,j.country_code,m.items,v.final_counts)::text)
 FROM public.wms_jobs j JOIN private.transfer_receipt_manifests m ON m.job_id=j.id JOIN public.transfer_receipt_verifications v ON v.job_id=j.id WHERE j.id=p_job;
$$;
REVOKE ALL ON FUNCTION private.transfer_variance_fingerprint(uuid) FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.transfer_variance_state(p_job uuid,p_action text DEFAULT NULL,p_fingerprint text DEFAULT NULL,p_reason text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE; v public.transfer_receipt_verifications%ROWTYPE; a private.transfer_variance_approvals%ROWTYPE;
 actor public.employees%ROWTYPE; fingerprint text; driver boolean; supervisor boolean;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(status)='active';
 SELECT * INTO j FROM public.wms_jobs WHERE type='TRANSFER' AND (id=p_job OR order_ref=p_job::text OR id::text=(SELECT order_ref FROM public.wms_jobs WHERE id=p_job AND type='DISPATCH')) ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
 IF actor.id IS NULL OR j.id IS NULL OR NOT (
 public.is_site_in_my_authorized_scope(j.dest_site_id::text,j.country_code)
 OR public.is_site_in_my_authorized_scope(j.site_id::text,j.country_code)
 OR (actor.role='driver' AND j.assigned_to=actor.id::text AND j.country_code=public.get_my_country_code_strict())) THEN
 RAISE EXCEPTION 'Scoped transfer authority required' USING ERRCODE='42501'; END IF;
 SELECT * INTO v FROM public.transfer_receipt_verifications WHERE job_id=j.id FOR UPDATE;
 IF v.status IS DISTINCT FROM 'verified' OR NOT coalesce(v.has_discrepancy,false) THEN RETURN jsonb_build_object('needed',false); END IF;
 fingerprint:=private.transfer_variance_fingerprint(j.id);
 driver:=actor.role='driver' AND j.assigned_to=actor.id::text AND actor.id IS DISTINCT FROM v.first_counter_id AND actor.id IS DISTINCT FROM v.second_counter_id;
 supervisor:=public.normalize_role(actor.role) IN('group_ceo','country_managing_director','country_operations_director','country_supply_chain_director','regional_operations_manager','regional_supply_chain_manager','regional_logistics_manager','store_manager','warehouse_manager','inventory_manager')
 AND public.is_site_in_my_authorized_scope(j.dest_site_id::text,j.country_code)
 AND actor.id IS DISTINCT FROM v.first_counter_id AND actor.id IS DISTINCT FROM v.second_counter_id AND actor.id::text IS DISTINCT FROM j.assigned_to;
 SELECT * INTO a FROM private.transfer_variance_approvals WHERE job_id=j.id;
 IF p_action IS NOT NULL THEN
  IF j.transfer_status NOT IN('Delivered','Partially Delivered') OR fingerprint IS DISTINCT FROM p_fingerprint OR fingerprint IS NULL THEN RAISE EXCEPTION 'Receipt evidence changed; refresh before signing'; END IF;
  IF p_action NOT IN('driver','supervisor') OR (p_action='driver' AND NOT driver) OR (p_action='supervisor' AND NOT supervisor) THEN RAISE EXCEPTION 'Independent transfer signature authority required' USING ERRCODE='42501'; END IF;
  IF length(btrim(coalesce(p_reason,''))) NOT BETWEEN 10 AND 1200 THEN RAISE EXCEPTION 'Variance reason must contain 10 to 1200 characters'; END IF;
  INSERT INTO private.transfer_variance_approvals(job_id,fingerprint) VALUES(j.id,fingerprint)
   ON CONFLICT(job_id) DO UPDATE SET fingerprint=excluded.fingerprint,
    driver_id=CASE WHEN transfer_variance_approvals.fingerprint=excluded.fingerprint THEN transfer_variance_approvals.driver_id END,
    driver_at=CASE WHEN transfer_variance_approvals.fingerprint=excluded.fingerprint THEN transfer_variance_approvals.driver_at END,
    supervisor_id=CASE WHEN transfer_variance_approvals.fingerprint=excluded.fingerprint THEN transfer_variance_approvals.supervisor_id END,
    supervisor_at=CASE WHEN transfer_variance_approvals.fingerprint=excluded.fingerprint THEN transfer_variance_approvals.supervisor_at END;
  IF p_action='driver' THEN UPDATE private.transfer_variance_approvals SET driver_id=actor.id,driver_at=now() WHERE job_id=j.id;
  ELSE UPDATE private.transfer_variance_approvals SET supervisor_id=actor.id,supervisor_at=now(),reason=btrim(p_reason) WHERE job_id=j.id; END IF;
  SELECT * INTO a FROM private.transfer_variance_approvals WHERE job_id=j.id;
  INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
  VALUES('TRANSFER_VARIANCE_'||upper(p_action),'Fulfillment',actor.name,actor.id::text,j.dest_site_id::text,j.country_code,'wms_job',j.id::text,btrim(p_reason));
 END IF;
 RETURN jsonb_build_object('needed',true,'jobId',j.id,'fingerprint',fingerprint,'canDriver',driver,'canApprove',supervisor,
 'driverSigned',a.fingerprint=fingerprint AND a.driver_id IS NOT NULL,'approved',a.fingerprint=fingerprint AND a.supervisor_id IS NOT NULL,
 'items',(SELECT jsonb_agg(jsonb_build_object('sku',j.line_items->(x.ordinality::integer-1)->>'sku','quantity',x.value->>'receivedQty','condition',x.value->>'condition')) FROM jsonb_array_elements(v.final_counts) WITH ORDINALITY x));
END $$;
REVOKE ALL ON FUNCTION private.transfer_variance_state(uuid,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.transfer_variance_state(uuid,text,text,text) TO authenticated;
CREATE FUNCTION public.get_transfer_variance(p_job uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.transfer_variance_state(p_job); $$;
CREATE FUNCTION public.sign_transfer_variance(p_job uuid,p_action text,p_fingerprint text,p_reason text) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.transfer_variance_state(p_job,p_action,p_fingerprint,p_reason); $$;
REVOKE ALL ON FUNCTION public.get_transfer_variance(uuid),public.sign_transfer_variance(uuid,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_transfer_variance(uuid),public.sign_transfer_variance(uuid,text,text,text) TO authenticated;
CREATE FUNCTION private.flag_transfer_variance() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.status='verified' AND NEW.has_discrepancy THEN UPDATE public.wms_jobs SET has_discrepancy=true,discrepancy_details='Saved physical receipt variance awaiting independent resolution' WHERE id=NEW.job_id; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.flag_transfer_variance() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER flag_transfer_variance AFTER INSERT OR UPDATE ON public.transfer_receipt_verifications FOR EACH ROW EXECUTE FUNCTION private.flag_transfer_variance();

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
 result jsonb; batch text; expiry date; role_name text; posted jsonb:='[]';
BEGIN
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
   posted:=posted||jsonb_build_array(jsonb_build_object('productId',dest.id,'quantity',qty));
   UPDATE private.transfer_intake_posts SET items=posted WHERE job_id=job.id;
   UPDATE public.products SET stock=coalesce(stock,0)+qty,status='active',pos_received_at=stamp,pos_received_by=actor.name
   WHERE id=dest.id;
   INSERT INTO public.stock_movements(site_id,product_id,product_name,type,quantity,movement_date,performed_by,reason,batch_number)
   VALUES(job.dest_site_id,dest.id,dest.name,'IN',qty,stamp,actor.name,
    'Transfer receipt '||coalesce(job.job_number,job.id::text)||' line '||(idx+1),batch);
  END IF;
  idx:=idx+1;
 END LOOP;
 -- Existing workflow triggers enforce arrival, saved count, receiver identity and linked transfer scope.
 UPDATE public.wms_jobs SET transfer_status='Received',status='Completed',received_at=stamp,received_by=actor.name,
 line_items=received_lines,has_discrepancy=coalesce(check_row.has_discrepancy,false),
 discrepancy_details=CASE WHEN check_row.has_discrepancy THEN 'Saved physical receipt variance' ELSE NULL END WHERE id=job.id;
 result:=jsonb_build_object('saved',true,'jobId',job.id,'siteId',job.dest_site_id,'countryCode',job.country_code,
 'receivedAt',stamp,'hasDiscrepancy',coalesce(check_row.has_discrepancy,false));
 UPDATE private.transfer_intake_posts SET confirmation=result WHERE job_id=job.id;
 INSERT INTO public.system_logs(action,module,user_name,employee_id,site_id,country_code,entity_type,entity_id,details)
 VALUES('VERIFIED_TRANSFER_INTAKE','Fulfillment',actor.name,actor.id::text,job.dest_site_id::text,job.country_code,'wms_job',job.id::text,result::text);
 PERFORM set_config('siifmart.transfer_intake_job','',true);
 RETURN result;
END $function$
;
