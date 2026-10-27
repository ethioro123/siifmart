-- Migration: 20261028_align_wms_count_authorized_roles.sql
-- Description: Align WMS stock count RPC authorization checks with normalized role conventions in fulfillmentTabPermissions.ts.
-- Grants group_ceo, country_managing_director, country_operations_director, warehouse_operations_manager,
-- inventory_control_supervisor, inventory_controller, stock_counter, and operational leaders full authorized access to WMS count sessions.

CREATE OR REPLACE FUNCTION public.start_wms_count_session(p_site_id uuid, p_count_type text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_employee_id uuid := public.get_my_employee_id();
    v_role text := lower(trim(coalesce(public.get_my_role(), '')));
    v_country text;
    v_session_id uuid;
BEGIN
    IF auth.uid() IS NULL OR v_employee_id IS NULL THEN
        RAISE EXCEPTION 'An authenticated employee profile is required';
    END IF;
    IF v_role NOT IN (
        'group_ceo', 'ceo', 'super_admin', 'admin',
        'country_managing_director', 'country_operations_director', 'country_supply_chain_director',
        'regional_operations_manager', 'regional_supply_chain_manager', 'area_operations_manager',
        'warehouse_manager', 'warehouse_operations_manager', 'inventory_manager', 'store_manager',
        'operations_manager', 'inventory_control_supervisor', 'inventory_controller',
        'returns_waste_supervisor', 'inventory_specialist', 'stock_counter', 'stock_clerk'
    ) THEN
        RAISE EXCEPTION 'This employee role cannot start a count session';
    END IF;
    IF p_count_type IS NULL OR p_count_type NOT IN ('Cycle', 'Spot') THEN
        RAISE EXCEPTION 'Invalid count type';
    END IF;

    SELECT upper(s.country) INTO v_country
      FROM public.sites s
     WHERE s.id = p_site_id AND lower(coalesce(s.status, 'active')) = 'active';
    IF v_country IS NULL OR NOT public.is_site_in_my_authorized_scope(p_site_id::text, v_country) THEN
        RAISE EXCEPTION 'The count site is outside this employee scope';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(p_site_id::text, 0));

    SELECT id INTO v_session_id FROM public.wms_count_sessions
     WHERE site_id = p_site_id AND status = 'Active'
     ORDER BY created_at DESC LIMIT 1;
    IF v_session_id IS NOT NULL THEN RETURN v_session_id; END IF;

    INSERT INTO public.wms_count_sessions(site_id, country_code, count_type, created_by)
    VALUES (p_site_id, v_country, p_count_type, v_employee_id)
    RETURNING id INTO v_session_id;

    IF p_count_type = 'Cycle' THEN
        INSERT INTO public.wms_count_items(session_id, product_id, product_name, product_sku, location, expected_qty)
        SELECT v_session_id, p.id, p.name, p.sku, p.location, p.stock
          FROM public.products p
         WHERE p.site_id = p_site_id AND lower(coalesce(p.status, 'active')) = 'active'
           AND coalesce(p.location, '') ILIKE 'A%'
         ORDER BY p.location, p.sku LIMIT 10;
    ELSE
        INSERT INTO public.wms_count_items(session_id, product_id, product_name, product_sku, location, expected_qty)
        SELECT v_session_id, p.id, p.name, p.sku, p.location, p.stock
          FROM public.products p
         WHERE p.site_id = p_site_id AND lower(coalesce(p.status, 'active')) = 'active'
         ORDER BY random() LIMIT 5;
    END IF;

    IF NOT FOUND THEN
        DELETE FROM public.wms_count_sessions WHERE id = v_session_id;
        RAISE EXCEPTION 'No active products are available for this count';
    END IF;
    RETURN v_session_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_wms_count_session(p_session_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_employee_id uuid := public.get_my_employee_id();
    v_role text := lower(trim(coalesce(public.get_my_role(), '')));
    v_session public.wms_count_sessions%ROWTYPE;
    v_items jsonb;
BEGIN
    IF auth.uid() IS NULL OR v_employee_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;
    IF v_role NOT IN (
        'group_ceo', 'ceo', 'super_admin', 'admin',
        'country_managing_director', 'country_operations_director', 'country_supply_chain_director',
        'regional_operations_manager', 'regional_supply_chain_manager', 'area_operations_manager',
        'warehouse_manager', 'warehouse_operations_manager', 'inventory_manager', 'store_manager',
        'operations_manager', 'inventory_control_supervisor', 'inventory_controller',
        'returns_waste_supervisor', 'inventory_specialist', 'stock_counter', 'stock_clerk'
    ) THEN
        RAISE EXCEPTION 'This employee role cannot access count sessions';
    END IF;

    SELECT * INTO v_session FROM public.wms_count_sessions s
     WHERE (p_session_id IS NULL AND s.status = 'Active'
            AND public.is_site_in_my_authorized_scope(s.site_id::text, s.country_code))
        OR (p_session_id IS NOT NULL AND s.id = p_session_id
            AND public.is_site_in_my_authorized_scope(s.site_id::text, s.country_code))
     ORDER BY s.created_at DESC LIMIT 1;
    IF NOT FOUND THEN RETURN NULL; END IF;

    SELECT coalesce(jsonb_agg(jsonb_build_object(
        'productId', i.product_id,
        'name', i.product_name,
        'sku', i.product_sku,
        'location', i.location,
        'countedQty', CASE WHEN coalesce(i.recount_counter_id, i.first_counter_id) = v_employee_id
                           THEN coalesce(i.recount_qty, i.first_count_qty) ELSE NULL END,
        'status', CASE WHEN i.first_count_qty IS NULL THEN 'Pending'
                       WHEN i.recounts_done = 0 AND i.first_count_qty IS DISTINCT FROM i.expected_qty
                            AND coalesce((SELECT nullif(c.country_configs->v_session.country_code->>'requireSecondCounterOnVariance','')::boolean
                                           FROM public.system_config c WHERE c.id = '00000000-0000-0000-0000-000000000001'), true)
                            THEN 'Recount Required' ELSE 'Counted' END,
        'hasVariance', coalesce(i.recount_qty, i.first_count_qty) IS NOT NULL
                       AND coalesce(i.recount_qty, i.first_count_qty) IS DISTINCT FROM i.expected_qty,
        'recountsDone', i.recounts_done,
        'canCount', i.first_count_qty IS NULL
                    OR (i.first_count_qty IS DISTINCT FROM i.expected_qty
                        AND i.recounts_done < coalesce((SELECT nullif(c.country_configs->v_session.country_code->>'maxCycleCountRecounts','')::integer
                            FROM public.system_config c WHERE c.id = '00000000-0000-0000-0000-000000000001'), 1)
                        AND i.recount_counter_id IS DISTINCT FROM v_employee_id
                        AND (coalesce((SELECT nullif(c.country_configs->v_session.country_code->>'requireSecondCounterOnVariance','')::boolean
                            FROM public.system_config c WHERE c.id = '00000000-0000-0000-0000-000000000001'), true) = false
                             OR i.first_counter_id <> v_employee_id))
    ) ORDER BY i.location, i.product_sku), '[]'::jsonb)
      INTO v_items FROM public.wms_count_items i WHERE i.session_id = v_session.id;

    RETURN jsonb_build_object('id', v_session.id, 'siteId', v_session.site_id,
        'countryCode', v_session.country_code, 'countType', v_session.count_type,
        'status', v_session.status, 'items', v_items);
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_wms_count(p_session_id uuid, p_product_id uuid, p_count_qty numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_employee_id uuid := public.get_my_employee_id();
    v_role text := lower(trim(coalesce(public.get_my_role(), '')));
    v_session public.wms_count_sessions%ROWTYPE;
    v_item public.wms_count_items%ROWTYPE;
    v_max_recounts integer;
    v_require_second boolean;
    v_is_recount boolean;
    v_variance boolean;
BEGIN
    IF auth.uid() IS NULL OR v_employee_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
    IF v_role NOT IN (
        'group_ceo', 'ceo', 'super_admin', 'admin',
        'country_managing_director', 'country_operations_director', 'country_supply_chain_director',
        'regional_operations_manager', 'regional_supply_chain_manager', 'area_operations_manager',
        'warehouse_manager', 'warehouse_operations_manager', 'inventory_manager', 'store_manager',
        'operations_manager', 'inventory_control_supervisor', 'inventory_controller',
        'returns_waste_supervisor', 'inventory_specialist', 'stock_counter', 'stock_clerk'
    ) THEN
        RAISE EXCEPTION 'This employee role cannot record a count';
    END IF;
    IF p_count_qty IS NULL OR p_count_qty < 0 OR p_count_qty > 100000000 THEN
        RAISE EXCEPTION 'Enter a valid non-negative count';
    END IF;
    IF p_count_qty <> trunc(p_count_qty) THEN
        RAISE EXCEPTION 'Stock counts must be whole units';
    END IF;
    SELECT * INTO v_session FROM public.wms_count_sessions s WHERE s.id = p_session_id AND s.status = 'Active' FOR UPDATE;
    IF NOT FOUND OR NOT public.is_site_in_my_authorized_scope(v_session.site_id::text, v_session.country_code) THEN
        RAISE EXCEPTION 'The count session is not active in this employee scope';
    END IF;
    SELECT * INTO v_item FROM public.wms_count_items i
     WHERE i.session_id = p_session_id AND i.product_id = p_product_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Product is not part of this count session'; END IF;

    SELECT coalesce(nullif(c.country_configs->v_session.country_code->>'maxCycleCountRecounts','')::integer, 1),
           coalesce(nullif(c.country_configs->v_session.country_code->>'requireSecondCounterOnVariance','')::boolean, true)
      INTO v_max_recounts, v_require_second
      FROM public.system_config c WHERE c.id = '00000000-0000-0000-0000-000000000001';
    v_max_recounts := greatest(0, coalesce(v_max_recounts, 1));
    v_require_second := coalesce(v_require_second, true);
    v_is_recount := v_item.first_count_qty IS NOT NULL;

    IF NOT v_is_recount THEN
        UPDATE public.wms_count_items SET first_count_qty = p_count_qty, first_counter_id = v_employee_id
         WHERE id = v_item.id;
        v_variance := p_count_qty IS DISTINCT FROM v_item.expected_qty;
    ELSE
        IF v_item.first_count_qty IS NOT DISTINCT FROM v_item.expected_qty THEN
            RAISE EXCEPTION 'This count has no variance requiring a recount';
        END IF;
        IF v_item.recounts_done >= v_max_recounts THEN RAISE EXCEPTION 'The allowed recount limit has been reached'; END IF;
        IF v_require_second AND v_item.first_counter_id = v_employee_id THEN
            RAISE EXCEPTION 'A different authenticated employee must perform the recount';
        END IF;
        IF v_item.recount_counter_id = v_employee_id THEN
            RAISE EXCEPTION 'A different authenticated employee must perform each recount';
        END IF;
        UPDATE public.wms_count_items SET recount_qty = p_count_qty,
            recount_counter_id = v_employee_id, recounts_done = recounts_done + 1
         WHERE id = v_item.id;
        v_variance := p_count_qty IS DISTINCT FROM v_item.expected_qty;
    END IF;

    RETURN jsonb_build_object('productId', p_product_id, 'hasVariance', v_variance,
        'status', CASE WHEN v_variance AND v_require_second AND NOT v_is_recount THEN 'Recount Required' ELSE 'Counted' END,
        'countedQty', p_count_qty, 'recountsDone', CASE WHEN v_is_recount THEN v_item.recounts_done + 1 ELSE 0 END,
        'canCount', v_variance AND NOT v_require_second
                    AND v_item.recounts_done + CASE WHEN v_is_recount THEN 1 ELSE 0 END < v_max_recounts);
END;
$function$;

CREATE OR REPLACE FUNCTION public.finish_wms_count_session(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_employee_id uuid := public.get_my_employee_id();
    v_role text := lower(trim(coalesce(public.get_my_role(), '')));
    v_session public.wms_count_sessions%ROWTYPE;
    v_item public.wms_count_items%ROWTYPE;
    v_max_recounts integer;
    v_require_second boolean;
    v_variance_count integer := 0;
    v_request_id uuid;
BEGIN
    IF auth.uid() IS NULL OR v_employee_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
    IF v_role NOT IN (
        'group_ceo', 'ceo', 'super_admin', 'admin',
        'country_managing_director', 'country_operations_director', 'country_supply_chain_director',
        'regional_operations_manager', 'regional_supply_chain_manager', 'area_operations_manager',
        'warehouse_manager', 'warehouse_operations_manager', 'inventory_manager', 'store_manager',
        'operations_manager', 'inventory_control_supervisor', 'inventory_controller',
        'returns_waste_supervisor', 'inventory_specialist', 'stock_counter', 'stock_clerk'
    ) THEN
        RAISE EXCEPTION 'This employee role cannot complete count sessions';
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
    v_role text := lower(trim(coalesce(public.get_my_role(), '')));
    v_session public.wms_count_sessions%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL OR v_employee_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
    IF v_role NOT IN (
        'group_ceo', 'ceo', 'super_admin', 'admin',
        'country_managing_director', 'country_operations_director', 'country_supply_chain_director',
        'regional_operations_manager', 'regional_supply_chain_manager', 'area_operations_manager',
        'warehouse_manager', 'warehouse_operations_manager', 'inventory_manager', 'store_manager',
        'operations_manager', 'inventory_control_supervisor', 'inventory_controller',
        'returns_waste_supervisor', 'inventory_specialist', 'stock_counter', 'stock_clerk'
    ) THEN
        RAISE EXCEPTION 'This employee role cannot cancel count sessions';
    END IF;
    SELECT * INTO v_session FROM public.wms_count_sessions WHERE id = p_session_id AND status = 'Active' FOR UPDATE;
    IF NOT FOUND OR NOT public.is_site_in_my_authorized_scope(v_session.site_id::text, v_session.country_code) THEN
        RAISE EXCEPTION 'The count session is not active in this employee scope';
    END IF;
    UPDATE public.wms_count_sessions SET status = 'Cancelled', cancelled_at = now() WHERE id = p_session_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.start_wms_count_session(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_wms_count_session(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_wms_count(uuid, uuid, numeric) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.finish_wms_count_session(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_wms_count_session(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.start_wms_count_session(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_wms_count_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_wms_count(uuid, uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_wms_count_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_wms_count_session(uuid) TO authenticated;
