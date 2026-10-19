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
    v_strategy text;
    v_session_id uuid;
BEGIN
    IF auth.uid() IS NULL OR v_employee_id IS NULL THEN RAISE EXCEPTION 'An authenticated employee profile is required'; END IF;
    IF v_role NOT IN ('stock_clerk', 'inventory_specialist', 'warehouse_manager', 'inventory_manager', 'store_manager', 'operations_manager', 'super_admin', 'ceo') THEN
        RAISE EXCEPTION 'This employee role cannot start a count session';
    END IF;
    IF p_count_type IS NULL OR p_count_type NOT IN ('Cycle', 'Spot') THEN RAISE EXCEPTION 'Invalid count type'; END IF;

    SELECT upper(s.country) INTO v_country FROM public.sites s
     WHERE s.id = p_site_id AND lower(coalesce(s.status, 'active')) = 'active';
    IF v_country IS NULL OR NOT public.is_site_in_my_authorized_scope(p_site_id::text, v_country) THEN
        RAISE EXCEPTION 'The count site is outside this employee scope';
    END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended(p_site_id::text, 0));

    SELECT id INTO v_session_id FROM public.wms_count_sessions
     WHERE site_id = p_site_id AND status = 'Active' ORDER BY created_at DESC LIMIT 1;
    IF v_session_id IS NOT NULL THEN RETURN v_session_id; END IF;

    INSERT INTO public.wms_count_sessions(site_id, country_code, count_type, created_by)
    VALUES (p_site_id, v_country, p_count_type, v_employee_id)
    RETURNING id INTO v_session_id;

    IF p_count_type = 'Cycle' THEN
        SELECT coalesce(nullif(c.country_configs->v_country->>'cycleCountStrategy', ''), 'abc')
          INTO v_strategy FROM public.system_config c
         WHERE c.id = '00000000-0000-0000-0000-000000000001';
        IF v_strategy = 'random' THEN
            INSERT INTO public.wms_count_items(session_id, product_id, product_name, product_sku, location, expected_qty)
            SELECT v_session_id, p.id, p.name, p.sku, p.location, p.stock
              FROM public.products p
             WHERE p.site_id = p_site_id AND lower(coalesce(p.status, 'active')) = 'active'
             ORDER BY random() LIMIT 10;
        ELSE
            INSERT INTO public.wms_count_items(session_id, product_id, product_name, product_sku, location, expected_qty)
            SELECT v_session_id, p.id, p.name, p.sku, p.location, p.stock
              FROM public.products p
              LEFT JOIN (
                  SELECT i.product_id, max(s.completed_at) AS last_counted_at
                    FROM public.wms_count_items i
                    JOIN public.wms_count_sessions s ON s.id = i.session_id
                   WHERE s.site_id = p_site_id AND s.status = 'Completed'
                   GROUP BY i.product_id
              ) history ON history.product_id = p.id
             WHERE p.site_id = p_site_id AND lower(coalesce(p.status, 'active')) = 'active'
             ORDER BY history.last_counted_at NULLS FIRST, history.last_counted_at, p.location, p.sku
             LIMIT 10;
        END IF;
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

REVOKE ALL ON FUNCTION public.start_wms_count_session(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_wms_count_session(uuid, text) TO authenticated;
