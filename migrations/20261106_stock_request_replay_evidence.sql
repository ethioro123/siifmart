CREATE OR REPLACE FUNCTION private.apply_inventory_stock_request(p_request uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.inventory_requests%ROWTYPE; actor public.employees%ROWTYPE; p public.products%ROWTYPE; qty numeric;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';
 SELECT * INTO r FROM public.inventory_requests WHERE id=p_request FOR UPDATE;
 IF actor.id IS NULL OR r.id IS NULL OR actor.role NOT IN('group_ceo','country_managing_director','country_operations_director','country_supply_chain_director')
 OR r.change_type<>'stock_adjustment' OR r.requested_by_employee_id IS NULL OR actor.id=r.requested_by_employee_id
 OR NOT public.is_site_in_my_authorized_scope(r.site_id,r.country_code) OR NOT public.is_country_in_my_authorized_scope(r.country_code) THEN RAISE EXCEPTION 'Independent scoped HQ stock approval required' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM private.inventory_adjustment_posts WHERE request_id=r.id) THEN RETURN jsonb_build_object('saved',true,'requestId',r.id); END IF;
 IF r.status<>'pending' OR r.adjustment_type NOT IN('IN','OUT') OR r.adjustment_qty IS NULL OR r.adjustment_qty<=0 OR r.adjustment_qty::text IN('NaN','Infinity','-Infinity') OR r.adjustment_qty<>trunc(r.adjustment_qty) OR length(btrim(coalesce(r.adjustment_reason,'')))<3 THEN RAISE EXCEPTION 'Valid stock adjustment and evidence required'; END IF;
 SELECT * INTO p FROM public.products WHERE id=r.product_id::uuid AND site_id::text=r.site_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Adjustment product is unavailable'; END IF;
 IF r.status='pending' THEN UPDATE public.inventory_requests SET status='approved',approved_by=actor.name,approved_at=now() WHERE id=r.id; END IF;
 qty:=CASE WHEN r.adjustment_type='IN' THEN r.adjustment_qty ELSE -r.adjustment_qty END;
 IF p.stock+qty<0 THEN RAISE EXCEPTION 'Adjustment would make stock negative'; END IF;
 INSERT INTO private.inventory_adjustment_posts(request_id,actor_id,product_id,quantity) VALUES(r.id,actor.id,p.id,qty);
 PERFORM set_config('siifmart.inventory_adjustment',r.id::text,true);
 PERFORM set_config('siifmart.stock_command','adjustment',true);
 UPDATE public.products SET stock=stock+qty WHERE id=p.id;
 INSERT INTO public.stock_movements(site_id,product_id,product_name,type,quantity,movement_date,performed_by,reason,batch_number)
 VALUES(p.site_id,p.id,p.name,r.adjustment_type,r.adjustment_qty,now(),actor.id::text,'Approved adjustment '||r.id::text||': '||r.adjustment_reason,p.batch_number);
 RETURN jsonb_build_object('saved',true,'requestId',r.id);
END $function$;

CREATE OR REPLACE FUNCTION private.apply_inventory_catalog_request(p_request uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE r public.inventory_requests%ROWTYPE; actor public.employees%ROWTYPE; product uuid:=gen_random_uuid(); job uuid; proposal jsonb; price numeric; cost numeric; qty numeric;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';SELECT * INTO r FROM public.inventory_requests WHERE id=p_request FOR UPDATE;
 IF actor.id IS NULL OR r.id IS NULL OR actor.role NOT IN('group_ceo','country_managing_director','country_operations_director','country_supply_chain_director') OR r.change_type<>'create' OR r.requested_by_employee_id IS NULL OR actor.id=r.requested_by_employee_id OR NOT public.is_site_in_my_authorized_scope(r.site_id,r.country_code) OR NOT public.is_country_in_my_authorized_scope(r.country_code) THEN RAISE EXCEPTION 'Independent scoped HQ catalog approval required' USING ERRCODE='42501'; END IF;
 SELECT product_id INTO product FROM private.catalog_creation_posts WHERE request_id=r.id;IF FOUND THEN RETURN product; END IF;product:=gen_random_uuid();
 IF r.status<>'pending' OR jsonb_typeof(r.proposed_changes) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Pending catalog proposal required'; END IF;
 proposal:=r.proposed_changes;price:=(proposal->>'price')::numeric;cost:=coalesce(nullif(proposal->>'costPrice','')::numeric,0);qty:=coalesce(r.adjustment_qty,0);
 IF length(btrim(coalesce(proposal->>'name','')))<2 OR length(btrim(coalesce(proposal->>'sku','')))<2 OR price IS NULL OR price<=0 OR price::text IN('NaN','Infinity','-Infinity') OR price<>round(price) OR cost<0 OR cost::text IN('NaN','Infinity','-Infinity') OR cost<>round(cost) OR qty<0 OR qty::text IN('NaN','Infinity','-Infinity') OR qty<>trunc(qty) THEN RAISE EXCEPTION 'Valid whole-number commercial details and physical quantity required'; END IF;
 PERFORM set_config('siifmart.stock_command','catalog',true);
 INSERT INTO public.products(id,site_id,name,sku,price,cost_price,stock,status,approval_status,approved_by,approved_at,unit,pack_quantity,brand,description,image,location,category)
 VALUES(product,r.site_id::uuid,btrim(proposal->>'name'),btrim(proposal->>'sku'),price,cost,0,'active','approved',actor.name,now(),coalesce(nullif(proposal->>'unit',''),'Units'),greatest(coalesce(nullif(proposal->>'packQuantity','')::numeric,1),1),proposal->>'brand',proposal->>'description',proposal->>'image','On Order',coalesce(nullif(proposal->>'category',''),'General'));
 IF qty>0 THEN
 INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,items_count,order_ref,line_items,location)
 VALUES(r.site_id::uuid,r.country_code,'PUTAWAY','Pending','Normal',1,'CATALOG-'||r.id::text,jsonb_build_array(jsonb_build_object('productId',product,'sku',proposal->>'sku','name',proposal->>'name','expectedQty',qty,'pickedQty',0,'status','Pending')),'Receiving Dock') RETURNING id INTO job;
 END IF;
 INSERT INTO private.catalog_creation_posts(request_id,product_id,putaway_job_id) VALUES(r.id,product,job);
 UPDATE public.inventory_requests SET status='approved',product_id=product::text,approved_by=actor.name,approved_at=now() WHERE id=r.id;
 RETURN product;
END $function$;


