-- One MVCC snapshot; aggregate demand/commitments instead of downloading receipt lines.
CREATE OR REPLACE FUNCTION public.merchandising_forecast_snapshot(p_site uuid,p_country text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb; actor_role text;
BEGIN
 SELECT role INTO actor_role FROM public.employees WHERE id=(SELECT auth.uid()) AND lower(coalesce(status,'active'))='active';
 IF actor_role IS NULL OR actor_role NOT IN ('group_ceo','group_cfo','country_managing_director',
 'country_operations_director','country_supply_chain_director','country_commercial_director',
 'regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager',
 'regional_procurement_manager','merchandising_specialist','merchandiser','store_manager','inventory_manager','warehouse_manager')
 OR NOT (public.is_site_in_my_authorized_scope(p_site::text,p_country) OR private.merchandising_site_scope(p_site::text,p_country))
 OR NOT EXISTS(SELECT 1 FROM public.sites WHERE id=p_site AND upper(country)=upper(p_country))
 THEN RAISE EXCEPTION 'Forecast location is not authorized' USING ERRCODE='42501'; END IF;
 WITH catalog AS MATERIALIZED (
 SELECT p.id,p.site_id,p.name,p.sku,p.category,round(p.price) price,
 CASE WHEN actor_role NOT IN ('merchandising_specialist','merchandiser') THEN round(p.cost_price) END cost_price,
 round(p.stock) stock,p.status,p.expiry_date,p.min_stock,p.max_stock,p.pack_quantity,p.unit,p.size,p.brand,p.custom_attributes
 FROM public.products p WHERE p.site_id=p_site AND p.status<>'archived'
 ), demand AS (
 SELECT upper(trim(p.sku)) sku, floor(extract(epoch FROM (statement_timestamp()-s.sale_date))/86400)::integer age_days,
 round(sum(CASE WHEN s.status='Completed' THEN greatest(0,i.quantity) ELSE 0 END)) units,
 bool_or(s.status IN ('Refunded','Partially Refunded')) refund_uncertain
 FROM public.sales s JOIN public.sale_items i ON i.sale_id=s.id JOIN public.products p ON p.id=i.product_id AND p.site_id=p_site
 WHERE s.site_id=p_site AND upper(s.country_code)=upper(p_country)
 AND s.status IN ('Completed','Refunded','Partially Refunded')
 AND s.sale_date>statement_timestamp()-interval '30 days' AND s.sale_date<=statement_timestamp()
 GROUP BY upper(trim(p.sku)),floor(extract(epoch FROM (statement_timestamp()-s.sale_date))/86400)
 ), incoming AS (
 SELECT upper(trim(coalesce(nullif(i.sku,''),p.sku))) sku,o.expected_delivery,
 i.pack_quantity,i.case_size,i.unit,i.size,i.custom_attributes,
 sum(greatest(0,i.quantity)) order_quantity,sum(greatest(0,coalesce(i.received_qty,0))) received_units
 FROM public.purchase_orders o JOIN public.po_items i ON i.po_id=o.id LEFT JOIN public.products p ON p.id=i.product_id
 WHERE o.site_id=p_site AND upper(o.country_code)=upper(p_country)
 AND (o.status IN ('Approved','Ordered','Partially Received') OR (o.status='Pending' AND o.approved_by IS NOT NULL))
 GROUP BY upper(trim(coalesce(nullif(i.sku,''),p.sku))),o.expected_delivery,i.pack_quantity,i.case_size,i.unit,i.size,i.custom_attributes
 ), awaiting AS (
 SELECT DISTINCT upper(trim(coalesce(item->>'sku',p.sku))) sku
 FROM public.transfers t CROSS JOIN LATERAL jsonb_array_elements(coalesce(t.items,'[]')) item
 LEFT JOIN public.products p ON p.id::text=coalesce(item->>'productId',item->>'product_id')
 WHERE t.dest_site_id=p_site AND upper(t.country_code)=upper(p_country)
 AND coalesce(t.transfer_status,t.status) NOT IN ('Completed','Received','Cancelled','Rejected')
 )
 SELECT jsonb_build_object('asOf',statement_timestamp(),'start',statement_timestamp()-interval '30 days',
 'products',coalesce((SELECT jsonb_agg(to_jsonb(c)) FROM catalog c),'[]'::jsonb),
 'demand',coalesce((SELECT jsonb_agg(to_jsonb(d)) FROM demand d),'[]'::jsonb),
 'incoming',coalesce((SELECT jsonb_agg(to_jsonb(i)) FROM incoming i),'[]'::jsonb),
 'awaitingSkus',coalesce((SELECT jsonb_agg(sku) FROM awaiting),'[]'::jsonb)) INTO result;
 IF jsonb_array_length(result->'products')>5000 THEN RAISE EXCEPTION 'Location exceeds forecast capacity'; END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.merchandising_forecast_snapshot(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.merchandising_forecast_snapshot(uuid,text) TO authenticated;

-- Requests remain unapproved; existing transfer approval/dual handover continues unchanged.
CREATE OR REPLACE FUNCTION public.request_forecast_replenishment(p_product uuid,p_quantity integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; product public.products%ROWTYPE;
 destination public.sites%ROWTYPE; source public.sites%ROWTYPE; existing_id uuid; new_id uuid;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=(SELECT auth.uid()) AND lower(coalesce(status,'active'))='active';
 SELECT * INTO product FROM public.products WHERE id=p_product;
 SELECT * INTO destination FROM public.sites WHERE id=product.site_id;
 IF actor.id IS NULL OR actor.role NOT IN ('group_ceo','country_managing_director','country_operations_director',
 'country_supply_chain_director','country_commercial_director','regional_operations_manager','regional_supply_chain_manager',
 'regional_merchandising_manager','merchandising_specialist','merchandiser','store_manager','inventory_manager')
 OR NOT (public.is_site_in_my_authorized_scope(destination.id::text,destination.country) OR private.merchandising_site_scope(destination.id::text,destination.country))
 OR destination.type IN ('Warehouse','Distribution Center','Administration') OR p_quantity IS NULL OR p_quantity<1 OR p_quantity>100000
 THEN RAISE EXCEPTION 'Replenishment request is not authorized or invalid' USING ERRCODE='42501'; END IF;
 SELECT s.* INTO source FROM public.sites s WHERE s.id IN (
 SELECT source_site_id FROM public.site_replenishment_sources WHERE site_id=destination.id
 UNION SELECT destination.replenishment_source_id)
 AND s.id<>destination.id AND s.country=destination.country AND s.type IN ('Warehouse','Distribution Center')
 ORDER BY s.id LIMIT 1;
 IF source.id IS NULL THEN RAISE EXCEPTION 'No authorized replenishment source is configured for this location'; END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(destination.id::text||':'||product.sku,0));
 SELECT t.id INTO existing_id FROM public.transfers t
 WHERE t.dest_site_id=destination.id AND t.country_code=destination.country
 AND coalesce(t.transfer_status,t.status) NOT IN ('Completed','Received','Cancelled','Rejected')
 AND EXISTS(SELECT 1 FROM jsonb_array_elements(coalesce(t.items,'[]')) item WHERE upper(item->>'sku')=upper(product.sku)) LIMIT 1;
 IF existing_id IS NOT NULL THEN RETURN jsonb_build_object('id',existing_id,'existing',true); END IF;
 INSERT INTO public.transfers(source_site_id,dest_site_id,status,transfer_status,transfer_date,country_code,
 source_region_code,dest_region_code,is_inter_region,requested_by,items,notes)
 VALUES(source.id,destination.id,'Requested','Requested',current_date,destination.country,
 source.region_code,destination.region_code,source.region_code IS DISTINCT FROM destination.region_code,actor.id::text,
 jsonb_build_array(jsonb_build_object('productId',product.id,'sku',product.sku,'name',product.name,'quantity',p_quantity,'unit',product.unit)),
 'Demand forecast replenishment request; requires source approval and normal transfer handover.') RETURNING id INTO new_id;
 RETURN jsonb_build_object('id',new_id,'existing',false);
END $$;
REVOKE ALL ON FUNCTION public.request_forecast_replenishment(uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.request_forecast_replenishment(uuid,integer) TO authenticated;
