CREATE OR REPLACE FUNCTION private.purchase_order_items_safe(p_ids uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE result jsonb;
BEGIN
 IF NOT private.has_active_operational_employee() OR cardinality(p_ids) NOT BETWEEN 1 AND 25 THEN RAISE EXCEPTION 'Bounded authenticated purchase-order scope required' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(CASE WHEN private.can_view_po_expected() THEN to_jsonb(i) ELSE to_jsonb(i)||jsonb_build_object('quantity',NULL,'unit_cost',NULL,'total_cost',NULL,'quantity_hidden',true,'receipt_complete',coalesce(i.received_qty,0)>=private.po_expected_sellable_units(i)) END ORDER BY i.id),'[]') INTO result
 FROM public.po_items i JOIN public.purchase_orders po ON po.id=i.po_id
 WHERE po.id=ANY(p_ids) AND public.is_site_in_my_authorized_scope(po.site_id::text,po.country_code) AND public.is_country_in_my_authorized_scope(po.country_code);
 RETURN result;
END $function$;

