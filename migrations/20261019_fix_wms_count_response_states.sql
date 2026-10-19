CREATE OR REPLACE FUNCTION public.start_wms_count_session(p_site_id uuid, p_count_type text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_employee_id uuid := public.get_my_employee_id();
    v_role text := lower(coalesce(public.get_my_role(), ''));
    v_country text;
    v_session_id uuid;
BEGIN
    IF auth.uid() IS NULL OR v_employee_id IS NULL THEN
        RAISE EXCEPTION 'An authenticated employee profile is required';
    END IF;
    IF v_role NOT IN ('stock_clerk', 'inventory_specialist', 'warehouse_manager', 'inventory_manager', 'store_manager', 'operations_manager', 'super_admin', 'ceo') THEN
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
    v_role text := lower(coalesce(public.get_my_role(), ''));
    v_session public.wms_count_sessions%ROWTYPE;
    v_items jsonb;
BEGIN
    IF auth.uid() IS NULL OR v_employee_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
    IF v_role NOT IN ('stock_clerk', 'inventory_specialist', 'warehouse_manager', 'inventory_manager', 'store_manager', 'operations_manager', 'super_admin', 'ceo') THEN
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

REVOKE ALL ON FUNCTION public.start_wms_count_session(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_wms_count_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_wms_count_session(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_wms_count_session(uuid) TO authenticated;
