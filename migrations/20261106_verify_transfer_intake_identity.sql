BEGIN;
CREATE OR REPLACE FUNCTION private.accept_verified_transfer(p_job uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
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
END $$;
CREATE OR REPLACE FUNCTION public.enforce_product_update_restrictions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  emp_role text;
  emp_id uuid;
  has_active_job boolean;
  decision_kind text;
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  IF private.product_edit_decision_matches(OLD.id, OLD.site_id) THEN RETURN NEW; END IF;

  -- Allow stock-only decrements executed through the trusted pos_decrement_stock RPC
  IF current_setting('app.pos_sale_stock_decrement', true) = OLD.id::text
     AND (to_jsonb(NEW) - ARRAY['stock', 'status', 'stock_updated_at', 'updated_at'])
       = (to_jsonb(OLD) - ARRAY['stock', 'status', 'stock_updated_at', 'updated_at']) THEN
    RETURN NEW;
  END IF;

  IF OLD.name IS DISTINCT FROM NEW.name OR OLD.sku IS DISTINCT FROM NEW.sku OR OLD.category IS DISTINCT FROM NEW.category OR OLD.brand IS DISTINCT FROM NEW.brand OR OLD.description IS DISTINCT FROM NEW.description OR OLD.image IS DISTINCT FROM NEW.image OR OLD.size IS DISTINCT FROM NEW.size OR OLD.unit IS DISTINCT FROM NEW.unit OR OLD.barcode IS DISTINCT FROM NEW.barcode OR OLD.barcodes IS DISTINCT FROM NEW.barcodes OR OLD.barcode_type IS DISTINCT FROM NEW.barcode_type OR OLD.price IS DISTINCT FROM NEW.price OR OLD.cost_price IS DISTINCT FROM NEW.cost_price OR OLD.sale_price IS DISTINCT FROM NEW.sale_price OR OLD.is_on_sale IS DISTINCT FROM NEW.is_on_sale OR OLD.min_stock IS DISTINCT FROM NEW.min_stock OR OLD.max_stock IS DISTINCT FROM NEW.max_stock OR OLD.pack_quantity IS DISTINCT FROM NEW.pack_quantity OR OLD.custom_attributes IS DISTINCT FROM NEW.custom_attributes OR OLD.shelf_position IS DISTINCT FROM NEW.shelf_position THEN
    RAISE EXCEPTION 'Product edits require Operations, Supply Chain and Merchandising approval';
  END IF;

  -- Allow only this transaction's verified intake to change receipt stock fields.
  IF (to_jsonb(NEW)-ARRAY['stock','status','pos_received_at','pos_received_by','updated_at'])
     = (to_jsonb(OLD)-ARRAY['stock','status','pos_received_at','pos_received_by','updated_at'])
     AND EXISTS(SELECT 1 FROM private.transfer_intake_posts r
       WHERE r.job_id=nullif(current_setting('siifmart.transfer_intake_job',true),'')::uuid
       AND r.site_id=OLD.site_id AND r.employee_id=auth.uid() AND r.posted_at=transaction_timestamp()
       AND r.items @> jsonb_build_array(jsonb_build_object('productId',OLD.id))) THEN RETURN NEW; END IF;
  emp_role := public.get_my_role();
  emp_id := public.get_my_employee_id();

  IF private.merchandising_decision_matches(OLD.id, OLD.site_id) THEN
    SELECT adjustment_reason INTO decision_kind
      FROM public.inventory_requests
      WHERE id::text = current_setting('app.merchandising_decision_id', true);
    IF decision_kind LIKE 'PRICE_CHANGE%'
       AND (to_jsonb(NEW) - ARRAY['price', 'cost_price', 'sale_price', 'is_on_sale', 'updated_at'])
         = (to_jsonb(OLD) - ARRAY['price', 'cost_price', 'sale_price', 'is_on_sale', 'updated_at'])
       THEN RETURN NEW;
    END IF;
    IF decision_kind LIKE 'MERCHANDISING:%'
       AND (to_jsonb(NEW) - ARRAY['name', 'category', 'brand', 'description', 'image', 'shelf_position', 'updated_at'])
         = (to_jsonb(OLD) - ARRAY['name', 'category', 'brand', 'description', 'image', 'shelf_position', 'updated_at'])
       THEN RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Merchandising decision attempted unrelated product fields';
  END IF;

  IF emp_role = 'group_ceo' THEN RETURN NEW; END IF;
  IF (OLD.price IS DISTINCT FROM NEW.price OR OLD.sale_price IS DISTINCT FROM NEW.sale_price
      OR OLD.cost_price IS DISTINCT FROM NEW.cost_price OR OLD.is_on_sale IS DISTINCT FROM NEW.is_on_sale)
     AND emp_role NOT IN ('country_commercial_director', 'procurement', 'group_ceo') THEN
    RAISE EXCEPTION 'Only the CEO and Procurement staff can modify product pricing or cost fields.';
  END IF;
  IF (OLD.name IS DISTINCT FROM NEW.name OR OLD.sku IS DISTINCT FROM NEW.sku
      OR OLD.category IS DISTINCT FROM NEW.category OR OLD.brand IS DISTINCT FROM NEW.brand
      OR OLD.size IS DISTINCT FROM NEW.size OR OLD.unit IS DISTINCT FROM NEW.unit
      OR OLD.description IS DISTINCT FROM NEW.description OR OLD.image IS DISTINCT FROM NEW.image
      OR OLD.custom_attributes IS DISTINCT FROM NEW.custom_attributes
      OR OLD.min_stock IS DISTINCT FROM NEW.min_stock OR OLD.max_stock IS DISTINCT FROM NEW.max_stock
      OR OLD.pack_quantity IS DISTINCT FROM NEW.pack_quantity)
     AND emp_role NOT IN ('regional_operations_manager', 'group_ceo', 'country_managing_director') THEN
    RAISE EXCEPTION 'Only the CEO and Regional Managers can edit product details.';
  END IF;
  IF OLD.stock IS DISTINCT FROM NEW.stock THEN
    IF emp_role IN ('group_ceo', 'country_managing_director', 'inventory_controller', 'supply_chain_director') THEN
      NULL;
    ELSE
      SELECT EXISTS (
        SELECT 1 FROM public.job_assignments ja
        JOIN public.wms_jobs j ON j.id = ja.job_id
        WHERE ja.employee_id = emp_id
          AND (j.site_id::text = OLD.site_id::text OR j.dest_site_id::text = OLD.site_id::text)
          AND j.status IN ('Pending', 'In Progress', 'Active', 'In-Progress')
      ) INTO has_active_job;
      IF NOT has_active_job AND emp_role NOT IN ('store_manager', 'warehouse_manager', 'country_operations_director') THEN
        RAISE EXCEPTION 'Direct stock modification is prohibited. Stock adjustments must be submitted via Inventory Requests for approval or processed via active WMS jobs.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

COMMIT;
