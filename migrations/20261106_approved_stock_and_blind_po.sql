CREATE TABLE private.inventory_adjustment_posts(request_id uuid PRIMARY KEY REFERENCES public.inventory_requests(id),actor_id uuid NOT NULL,product_id uuid NOT NULL,quantity numeric NOT NULL,posted_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE private.inventory_adjustment_posts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.inventory_adjustment_posts FROM PUBLIC,anon,authenticated;
CREATE FUNCTION private.apply_inventory_stock_request(p_request uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.inventory_requests%ROWTYPE; actor public.employees%ROWTYPE; p public.products%ROWTYPE; qty numeric;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';
 SELECT * INTO r FROM public.inventory_requests WHERE id=p_request FOR UPDATE;
 IF actor.id IS NULL OR r.id IS NULL OR actor.role NOT IN('group_ceo','country_managing_director','country_operations_director','country_supply_chain_director')
 OR r.change_type<>'stock_adjustment' OR r.requested_by_employee_id IS NULL OR actor.id=r.requested_by_employee_id
 OR NOT public.is_site_in_my_authorized_scope(r.site_id,r.country_code) OR NOT public.is_country_in_my_authorized_scope(r.country_code) THEN RAISE EXCEPTION 'Independent scoped HQ stock approval required' USING ERRCODE='42501'; END IF;
 IF EXISTS(SELECT 1 FROM private.inventory_adjustment_posts WHERE request_id=r.id) THEN RETURN jsonb_build_object('saved',true,'requestId',r.id); END IF;
 IF r.status NOT IN('pending','approved') OR r.adjustment_type NOT IN('IN','OUT') OR r.adjustment_qty IS NULL OR r.adjustment_qty<=0 OR r.adjustment_qty::text IN('NaN','Infinity','-Infinity') OR r.adjustment_qty<>trunc(r.adjustment_qty) OR length(btrim(coalesce(r.adjustment_reason,'')))<3 THEN RAISE EXCEPTION 'Valid stock adjustment and evidence required'; END IF;
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
END $$;
CREATE FUNCTION public.apply_inventory_stock_request(p_request uuid) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.apply_inventory_stock_request(p_request); $$;
REVOKE ALL ON FUNCTION private.apply_inventory_stock_request(uuid),public.apply_inventory_stock_request(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.apply_inventory_stock_request(uuid),public.apply_inventory_stock_request(uuid) TO authenticated;
CREATE FUNCTION private.can_view_po_expected() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(public.get_my_role() IN('group_ceo','group_coo','group_cfo','group_csco','country_managing_director','country_operations_director','country_finance_director','country_supply_chain_director','country_commercial_director','regional_operations_manager','regional_supply_chain_manager','regional_procurement_manager','regional_finance_manager','warehouse_manager','store_manager','buyer','demand_planner','replenishment_planner','accountant','auditor'),false);
$$;
CREATE POLICY blind_po_expected_guard ON public.po_items AS RESTRICTIVE FOR SELECT TO authenticated USING(private.can_view_po_expected());
GRANT EXECUTE ON FUNCTION private.can_view_po_expected() TO authenticated;
REVOKE ALL ON FUNCTION private.can_view_po_expected() FROM PUBLIC,anon;
CREATE FUNCTION private.purchase_order_items_safe(p_ids uuid[]) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE result jsonb;
BEGIN
 IF NOT private.has_active_operational_employee() OR cardinality(p_ids) NOT BETWEEN 1 AND 25 THEN RAISE EXCEPTION 'Bounded authenticated purchase-order scope required' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(CASE WHEN private.can_view_po_expected() THEN to_jsonb(i) ELSE to_jsonb(i)||jsonb_build_object('quantity',NULL,'unit_cost',NULL,'total_cost',NULL,'quantity_hidden',true) END ORDER BY i.id),'[]') INTO result
 FROM public.po_items i JOIN public.purchase_orders po ON po.id=i.po_id
 WHERE po.id=ANY(p_ids) AND public.is_site_in_my_authorized_scope(po.site_id::text,po.country_code) AND public.is_country_in_my_authorized_scope(po.country_code);
 RETURN result;
END $$;
CREATE FUNCTION public.purchase_order_items_safe(p_ids uuid[]) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.purchase_order_items_safe(p_ids); $$;
REVOKE ALL ON FUNCTION private.purchase_order_items_safe(uuid[]),public.purchase_order_items_safe(uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.purchase_order_items_safe(uuid[]),public.purchase_order_items_safe(uuid[]) TO authenticated;
CREATE FUNCTION private.guard_saved_payment_attestation() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF (NEW.manual_payment_verified_by,NEW.manual_payment_verified_at) IS DISTINCT FROM (OLD.manual_payment_verified_by,OLD.manual_payment_verified_at) THEN RAISE EXCEPTION 'Saved payment attestation is immutable'; END IF;RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.guard_saved_payment_attestation() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER saved_payment_attestation BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION private.guard_saved_payment_attestation();
