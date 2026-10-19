CREATE OR REPLACE FUNCTION public.finish_wms_count_session(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_employee_id uuid := public.get_my_employee_id();
    v_role text := lower(coalesce(public.get_my_role(), ''));
    v_session public.wms_count_sessions%ROWTYPE;
    v_item public.wms_count_items%ROWTYPE;
    v_max_recounts integer;
    v_require_second boolean;
    v_variance_count integer := 0;
    v_request_id uuid;
BEGIN
    IF auth.uid() IS NULL OR v_employee_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
    IF v_role NOT IN ('stock_clerk', 'inventory_specialist', 'warehouse_manager', 'inventory_manager', 'store_manager', 'operations_manager', 'super_admin', 'ceo') THEN
        RAISE EXCEPTION 'This employee role cannot complete a count session';
    END IF;
    SELECT * INTO v_session FROM public.wms_count_sessions s WHERE s.id = p_session_id AND s.status = 'Active' FOR UPDATE;
    IF NOT FOUND OR NOT public.is_site_in_my_authorized_scope(v_session.site_id::text, v_session.country_code) THEN
        RAISE EXCEPTION 'The count session is not active in this employee scope';
    END IF;
    IF EXISTS (SELECT 1 FROM public.wms_count_items i WHERE i.session_id = p_session_id AND i.first_count_qty IS NULL) THEN
        RAISE EXCEPTION 'Count every item before completing the session';
    END IF;
    SELECT coalesce(nullif(c.country_configs->v_session.country_code->>'maxCycleCountRecounts','')::integer, 1),
           coalesce(nullif(c.country_configs->v_session.country_code->>'requireSecondCounterOnVariance','')::boolean, true)
      INTO v_max_recounts, v_require_second
      FROM public.system_config c WHERE c.id = '00000000-0000-0000-0000-000000000001';
    v_max_recounts := greatest(0, coalesce(v_max_recounts, 1));
    v_require_second := coalesce(v_require_second, true);

    FOR v_item IN SELECT * FROM public.wms_count_items i WHERE i.session_id = p_session_id LOOP
        IF coalesce(v_item.recount_qty, v_item.first_count_qty) IS DISTINCT FROM v_item.expected_qty THEN
            IF v_require_second AND v_max_recounts > 0 AND v_item.recounts_done = 0 THEN
                RAISE EXCEPTION 'A second authenticated counter must recount all variances before submission';
            END IF;
            INSERT INTO public.inventory_requests(
                site_id, product_id, product_name, product_sku, change_type,
                requested_by, requested_at, status, adjustment_type, adjustment_qty,
                adjustment_reason, country_code
            ) VALUES (
                v_session.site_id::text, v_item.product_id::text, v_item.product_name,
                v_item.product_sku, 'stock_adjustment',
                coalesce((SELECT e.name FROM public.employees e WHERE e.id = v_employee_id), 'Count operator'),
                now(), 'pending',
                CASE WHEN coalesce(v_item.recount_qty, v_item.first_count_qty) > v_item.expected_qty THEN 'IN' ELSE 'OUT' END,
                abs(round(coalesce(v_item.recount_qty, v_item.first_count_qty) - v_item.expected_qty))::integer,
                'Blind cycle count variance; session ' || p_session_id::text,
                v_session.country_code
            ) RETURNING id INTO v_request_id;
            UPDATE public.wms_count_items SET inventory_request_id = v_request_id WHERE id = v_item.id;
            v_variance_count := v_variance_count + 1;
        END IF;
    END LOOP;
    UPDATE public.wms_count_sessions SET status = 'Completed', completed_at = now() WHERE id = p_session_id;
    RETURN jsonb_build_object('status', 'Completed', 'varianceCount', v_variance_count);
END;
$function$;

CREATE OR REPLACE FUNCTION public.cancel_wms_count_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_employee_id uuid := public.get_my_employee_id();
    v_role text := lower(coalesce(public.get_my_role(), ''));
    v_session public.wms_count_sessions%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL OR v_employee_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
    IF v_role NOT IN ('stock_clerk', 'inventory_specialist', 'warehouse_manager', 'inventory_manager', 'store_manager', 'operations_manager', 'super_admin', 'ceo') THEN
        RAISE EXCEPTION 'This employee role cannot cancel a count session';
    END IF;
    SELECT * INTO v_session FROM public.wms_count_sessions WHERE id = p_session_id AND status = 'Active' FOR UPDATE;
    IF NOT FOUND OR NOT public.is_site_in_my_authorized_scope(v_session.site_id::text, v_session.country_code) THEN
        RAISE EXCEPTION 'The count session is not active in this employee scope';
    END IF;
    IF v_session.created_by <> v_employee_id AND v_role NOT IN ('warehouse_manager', 'inventory_manager', 'store_manager', 'operations_manager', 'super_admin', 'ceo') THEN
        RAISE EXCEPTION 'Only the session creator or an authorized manager can cancel this count';
    END IF;
    UPDATE public.wms_count_sessions SET status = 'Cancelled', cancelled_at = now() WHERE id = p_session_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.finish_wms_count_session(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_wms_count_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finish_wms_count_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_wms_count_session(uuid) TO authenticated;
