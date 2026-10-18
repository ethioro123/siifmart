CREATE OR REPLACE FUNCTION public.create_pack_job_after_completed_pick(p_pick_job_id uuid)
RETURNS SETOF public.wms_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
    v_employee_id uuid;
    v_role text;
    v_pick public.wms_jobs%ROWTYPE;
    v_pack public.wms_jobs%ROWTYPE;
    v_pack_items jsonb;
    v_items_count integer;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    v_employee_id := public.get_my_employee_id();
    IF v_employee_id IS NULL THEN
        RAISE EXCEPTION 'An active employee profile is required';
    END IF;

    SELECT lower(e.role) INTO v_role
      FROM public.employees e
     WHERE e.id = v_employee_id
       AND lower(coalesce(e.status, 'active')) = 'active';

    IF v_role IS NULL OR v_role NOT IN (
        'picker', 'packer', 'receiver', 'driver', 'forklift_operator',
        'stock_clerk', 'inventory_specialist', 'warehouse_manager',
        'inventory_manager', 'logistics_manager', 'operations_manager',
        'admin', 'super_admin', 'ceo'
    ) THEN
        RAISE EXCEPTION 'This employee role cannot create a PACK job';
    END IF;

    PERFORM pg_advisory_xact_lock(hashtextextended(p_pick_job_id::text, 0));

    SELECT j.* INTO v_pick
      FROM public.wms_jobs j
     WHERE j.id = p_pick_job_id
     FOR SHARE;

    IF NOT FOUND
       OR lower(coalesce(v_pick.type, '')) <> 'pick'
       OR lower(coalesce(v_pick.status, '')) <> 'completed' THEN
        RAISE EXCEPTION 'A completed PICK job is required';
    END IF;

    IF v_pick.completed_by IS DISTINCT FROM v_employee_id::text
       OR upper(v_pick.country_code) <> upper(public.get_my_country_code())
       OR NOT public.is_site_in_my_authorized_scope(v_pick.site_id::text, v_pick.country_code) THEN
        RAISE EXCEPTION 'The completed PICK is outside this employee scope';
    END IF;

    SELECT j.* INTO v_pack
      FROM public.wms_jobs j
     WHERE j.type = 'PACK'
       AND j.order_ref = v_pick.order_ref
       AND j.country_code = v_pick.country_code
       AND j.site_id = v_pick.site_id
       AND j.status <> 'Cancelled'
     ORDER BY j.created_at DESC
     LIMIT 1;

    IF FOUND THEN
        IF v_pack.assigned_to IS DISTINCT FROM v_employee_id::text THEN
            RAISE EXCEPTION 'A PACK job already exists for this order';
        END IF;
        RETURN NEXT v_pack;
        RETURN;
    END IF;

    SELECT count(*)::integer,
           coalesce(jsonb_agg(item || jsonb_build_object(
               'orderedQty', coalesce(item->'orderedQty', item->'expectedQty', item->'pickedQty', '0'::jsonb),
               'expectedQty', coalesce(item->'pickedQty', item->'picked_qty', '0'::jsonb),
               'pickedQty', coalesce(item->'pickedQty', item->'picked_qty', '0'::jsonb),
               'packedQty', 0,
               'packed', false,
               'status', 'Pending'
           )), '[]'::jsonb)
      INTO v_items_count, v_pack_items
      FROM jsonb_array_elements(coalesce(v_pick.line_items, '[]'::jsonb)) AS items(item)
     WHERE coalesce(nullif(item->>'pickedQty', '')::numeric,
                    nullif(item->>'picked_qty', '')::numeric, 0) > 0;

    IF v_items_count = 0 THEN
        RAISE EXCEPTION 'The completed PICK contains no picked items';
    END IF;

    INSERT INTO public.wms_jobs (
        country_code, site_id, type, priority, status, items_count, assigned_to,
        location, order_ref, line_items, source_site_id, dest_site_id,
        job_number, notes, assigned_by
    ) VALUES (
        v_pick.country_code, v_pick.site_id, 'PACK', v_pick.priority, 'Pending',
        v_items_count, v_employee_id::text, 'Packing Station 1', v_pick.order_ref,
        v_pack_items, v_pick.source_site_id, v_pick.dest_site_id,
        v_pick.job_number,
        CASE WHEN position('[STRICT_SCAN]' in coalesce(v_pick.notes, '')) > 0 THEN '[STRICT_SCAN]' ELSE NULL END,
        v_employee_id::text
    )
    RETURNING * INTO v_pack;

    RETURN NEXT v_pack;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_pack_job_after_completed_pick(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_pack_job_after_completed_pick(uuid) TO authenticated;
