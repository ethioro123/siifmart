CREATE FUNCTION public.assign_warehouse_job_atomic(p_job uuid,p_employee uuid,p_minutes integer DEFAULT 15) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE; e public.employees%ROWTYPE; a public.job_assignments%ROWTYPE;
BEGIN
 SELECT * INTO j FROM public.wms_jobs WHERE id=p_job FOR UPDATE;
 SELECT * INTO e FROM public.employees WHERE id=p_employee AND lower(status)='active';
 IF auth.uid() IS NULL OR j.id IS NULL OR e.id IS NULL OR NOT public.is_manager()
 OR j.status NOT IN('Pending','In-Progress') OR NOT public.is_site_in_my_authorized_scope(j.site_id::text,j.country_code)
 OR e.site_id IS DISTINCT FROM j.site_id OR (nullif(j.assigned_to,'') IS NOT NULL AND j.assigned_to<>e.id::text) THEN
 RAISE EXCEPTION 'Scoped manager and available facility worker required' USING ERRCODE='42501'; END IF;
 IF (j.type IN('DRIVER','DELIVERY','DISPATCH') AND e.role<>'driver') OR
 (j.type NOT IN('DRIVER','DELIVERY','DISPATCH') AND e.role NOT IN('picker','packer','receiver','receiving_operator','putaway_operator','replenishment_operator','inventory_controller','stock_counter','dispatch_operator','returns_operator','fleet_mechanic','inventory_specialist','forklift_operator','stock_clerk','inbound_qc_inspector','returns_clerk','driver')) THEN RAISE EXCEPTION 'Worker is not eligible for this job'; END IF;
 SELECT * INTO a FROM public.job_assignments WHERE job_id=j.id AND employee_id=e.id AND status<>'Cancelled' ORDER BY created_at DESC LIMIT 1;
 UPDATE public.wms_jobs SET assigned_to=e.id::text,status='In-Progress',assigned_by=(SELECT name FROM public.employees WHERE id=auth.uid()) WHERE id=j.id RETURNING * INTO j;
 IF a.id IS NULL THEN
 INSERT INTO public.job_assignments(job_id,employee_id,employee_name,status,estimated_duration)
 VALUES(j.id,e.id,e.name,'Assigned',greatest(1,least(coalesce(p_minutes,15),10080))) RETURNING * INTO a;
 END IF;
 RETURN jsonb_build_object('job',to_jsonb(j),'assignment',to_jsonb(a));
END $$;
REVOKE ALL ON FUNCTION public.assign_warehouse_job_atomic(uuid,uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.assign_warehouse_job_atomic(uuid,uuid,integer) TO authenticated;

CREATE FUNCTION private.release_sale_to_picking(p_sale uuid,p_source uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE sale public.sales%ROWTYPE; source public.sites%ROWTYPE; dest public.sites%ROWTYPE; j public.wms_jobs%ROWTYPE; lines jsonb;
BEGIN
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
END $$;
REVOKE ALL ON FUNCTION private.release_sale_to_picking(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.release_sale_to_picking(uuid,uuid) TO authenticated;
CREATE FUNCTION public.release_sale_to_picking(p_sale uuid,p_source uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.release_sale_to_picking(p_sale,p_source); $$;
REVOKE ALL ON FUNCTION public.release_sale_to_picking(uuid,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.release_sale_to_picking(uuid,uuid) TO authenticated;
