CREATE TABLE private.catalog_creation_posts(request_id uuid PRIMARY KEY REFERENCES public.inventory_requests(id),product_id uuid UNIQUE NOT NULL REFERENCES public.products(id),putaway_job_id uuid REFERENCES public.wms_jobs(id));
ALTER TABLE private.catalog_creation_posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.catalog_creation_posts FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.apply_inventory_catalog_request(p_request uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.inventory_requests%ROWTYPE; actor public.employees%ROWTYPE; product uuid:=gen_random_uuid(); job uuid; proposal jsonb; price numeric; cost numeric; qty numeric;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';SELECT * INTO r FROM public.inventory_requests WHERE id=p_request FOR UPDATE;
 IF actor.id IS NULL OR r.id IS NULL OR actor.role NOT IN('group_ceo','country_managing_director','country_operations_director','country_supply_chain_director') OR r.change_type<>'create' OR r.requested_by_employee_id IS NULL OR actor.id=r.requested_by_employee_id OR NOT public.is_site_in_my_authorized_scope(r.site_id,r.country_code) OR NOT public.is_country_in_my_authorized_scope(r.country_code) THEN RAISE EXCEPTION 'Independent scoped HQ catalog approval required' USING ERRCODE='42501'; END IF;
 SELECT product_id INTO product FROM private.catalog_creation_posts WHERE request_id=r.id;IF FOUND THEN RETURN product; END IF;product:=gen_random_uuid();
 IF r.status NOT IN('pending','approved') OR jsonb_typeof(r.proposed_changes) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Pending catalog proposal required'; END IF;
 proposal:=r.proposed_changes;price:=(proposal->>'price')::numeric;cost:=coalesce(nullif(proposal->>'costPrice','')::numeric,0);qty:=coalesce(r.adjustment_qty,0);
 IF length(btrim(coalesce(proposal->>'name','')))<2 OR length(btrim(coalesce(proposal->>'sku','')))<2 OR price IS NULL OR price<=0 OR price::text IN('NaN','Infinity','-Infinity') OR price<>round(price) OR cost<0 OR cost::text IN('NaN','Infinity','-Infinity') OR cost<>round(cost) OR qty<0 OR qty::text IN('NaN','Infinity','-Infinity') OR qty<>trunc(qty) THEN RAISE EXCEPTION 'Valid whole-number commercial details and physical quantity required'; END IF;
 PERFORM set_config('siifmart.stock_command','catalog',true);
 INSERT INTO public.products(id,site_id,name,sku,price,cost_price,stock,status,approval_status,approved_by,approved_at,unit,pack_quantity,brand,description,image,location)
 VALUES(product,r.site_id::uuid,btrim(proposal->>'name'),btrim(proposal->>'sku'),price,cost,0,'active','approved',actor.name,now(),coalesce(nullif(proposal->>'unit',''),'Units'),greatest(coalesce(nullif(proposal->>'packQuantity','')::numeric,1),1),proposal->>'brand',proposal->>'description',proposal->>'image','On Order');
 IF qty>0 THEN
 INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,items_count,order_ref,line_items,location)
 VALUES(r.site_id::uuid,r.country_code,'PUTAWAY','Pending','Normal',1,'CATALOG-'||r.id::text,jsonb_build_array(jsonb_build_object('productId',product,'sku',proposal->>'sku','name',proposal->>'name','expectedQty',qty,'pickedQty',0,'status','Pending')),'Receiving Dock') RETURNING id INTO job;
 END IF;
 INSERT INTO private.catalog_creation_posts(request_id,product_id,putaway_job_id) VALUES(r.id,product,job);
 UPDATE public.inventory_requests SET status='approved',product_id=product::text,approved_by=actor.name,approved_at=now() WHERE id=r.id;
 RETURN product;
END $$;
CREATE FUNCTION public.apply_inventory_catalog_request(p_request uuid) RETURNS uuid LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.apply_inventory_catalog_request(p_request); $$;
REVOKE ALL ON FUNCTION private.apply_inventory_catalog_request(uuid),public.apply_inventory_catalog_request(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.apply_inventory_catalog_request(uuid),public.apply_inventory_catalog_request(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION private.guard_stock_posting() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF auth.role()='service_role' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND NEW.stock IS DISTINCT FROM OLD.stock
 AND coalesce(current_setting('siifmart.stock_command',true),'') NOT IN('pick','putaway','transfer','adjustment','merge')
 AND current_setting('app.pos_sale_stock_decrement',true) IS DISTINCT FROM OLD.id::text THEN RAISE EXCEPTION 'Stock changes require a verified operation or approved adjustment' USING ERRCODE='42501'; END IF;
 IF TG_OP='INSERT' THEN
  IF current_setting('siifmart.stock_command',true)='catalog' AND NEW.stock<>0 THEN RAISE EXCEPTION 'Catalog approval cannot post physical stock'; END IF;
  IF coalesce(current_setting('siifmart.stock_command',true),'') NOT IN('putaway','transfer','adjustment','merge','catalog') THEN
   IF coalesce(NEW.stock,0)<>0 THEN RAISE EXCEPTION 'New stock requires a verified operation' USING ERRCODE='42501'; END IF;
   NEW.approval_status:='pending';NEW.approved_by:=NULL;NEW.approved_at:=NULL;NEW.price:=0;NEW.sale_price:=NULL;NEW.is_on_sale:=false;
  END IF;
 END IF;RETURN NEW;
END $$;
