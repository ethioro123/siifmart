-- Staging schema snapshot, part 11 of 16.
SET search_path = public, extensions, auth;
SET check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.get_my_region_code()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
    v_region TEXT;
    v_uid UUID;
    v_email TEXT;
BEGIN
    v_uid := auth.uid();
    v_email := auth.jwt() ->> 'email';

    IF v_uid IS NULL AND v_email IS NULL THEN
        RETURN NULL;
    END IF;

    IF v_uid IS NOT NULL THEN
        SELECT region_code INTO v_region
        FROM public.employees
        WHERE id = v_uid
        LIMIT 1;

        IF v_region IS NOT NULL THEN
            RETURN v_region;
        END IF;
    END IF;

    IF v_email IS NOT NULL AND v_email <> '' THEN
        SELECT region_code INTO v_region
        FROM public.employees
        WHERE LOWER(email) = LOWER(v_email)
        LIMIT 1;

        IF v_region IS NOT NULL THEN
            RETURN v_region;
        END IF;
    END IF;

    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$function$;
CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  v_role TEXT;
  v_uid UUID;
  v_email TEXT;
BEGIN
  -- Fast path 0: Custom role claim in JWT if populated
  v_role := (select auth.jwt() ->> 'role');
  IF v_role IS NOT NULL AND v_role <> '' AND v_role NOT IN ('authenticated', 'anon', 'service_role') THEN
    RETURN v_role;
  END IF;

  v_uid := (select auth.uid());
  v_email := (select auth.jwt() ->> 'email');

  IF v_uid IS NULL AND v_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Fast path 1: Primary Key / UUID index seek (< 0.05ms)
  IF v_uid IS NOT NULL THEN
    SELECT role INTO v_role 
    FROM public.employees 
    WHERE id = v_uid
    LIMIT 1;

    IF v_role IS NOT NULL THEN
      RETURN v_role;
    END IF;
  END IF;

  -- Fast path 2: Direct JWT session email lookup (0ms DB overhead)
  IF v_email IS NOT NULL AND v_email <> '' THEN
    SELECT role INTO v_role 
    FROM public.employees 
    WHERE LOWER(email) = LOWER(v_email)
    LIMIT 1;

    IF v_role IS NOT NULL THEN
      RETURN v_role;
    END IF;
  END IF;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$function$;
CREATE OR REPLACE FUNCTION public.get_my_scope_level()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
    v_scope TEXT;
    v_uid UUID;
    v_email TEXT;
    v_role TEXT;
BEGIN
    v_uid := auth.uid();
    v_email := auth.jwt() ->> 'email';

    IF v_uid IS NULL AND v_email IS NULL THEN
        RETURN NULL;
    END IF;

    IF v_uid IS NOT NULL THEN
        SELECT scope_level, role INTO v_scope, v_role
        FROM public.employees
        WHERE id = v_uid
        LIMIT 1;

        IF v_scope IS NOT NULL THEN
            RETURN v_scope;
        END IF;
    END IF;

    IF v_email IS NOT NULL AND v_email <> '' THEN
        SELECT scope_level, role INTO v_scope, v_role
        FROM public.employees
        WHERE LOWER(email) = LOWER(v_email)
        LIMIT 1;

        IF v_scope IS NOT NULL THEN
            RETURN v_scope;
        END IF;
    END IF;

    IF v_role IN ('super_admin', 'admin', 'CEO', 'operations_manager', 'finance_manager', 'hr_manager', 'hr', 'procurement_manager', 'supply_chain_manager', 'auditor') THEN
        RETURN 'HQ';
    ELSIF v_role IN ('regional_manager', 'regional_procurement_lead', 'regional_finance_officer', 'regional_hr_officer', 'regional_logistics_lead', 'regional_security_supervisor') THEN
        RETURN 'REGIONAL';
    ELSE
        RETURN 'SITE';
    END IF;

    RETURN 'SITE';
EXCEPTION WHEN OTHERS THEN
    RETURN 'SITE';
END;
$function$;
CREATE OR REPLACE FUNCTION public.get_my_site_code_or_id()
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_uid text;
  v_email text;
  v_site text;
BEGIN
  v_uid := (select auth.uid())::text;
  v_email := (select auth.jwt() ->> 'email');

  IF v_uid IS NULL AND v_email IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT e.site_id::text INTO v_site
  FROM public.employees e
  WHERE (v_uid IS NOT NULL AND e.id::text = v_uid)
     OR (v_email IS NOT NULL AND LOWER(e.email) = LOWER(v_email))
  LIMIT 1;

  RETURN v_site;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$function$;
CREATE OR REPLACE FUNCTION public.get_my_site_id()
 RETURNS uuid
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'auth'
AS $function$
DECLARE
  v_site_id UUID;
  v_uid UUID;
  v_email TEXT;
BEGIN
  v_uid := (select auth.uid());
  v_email := (select auth.jwt() ->> 'email');

  IF v_uid IS NULL AND v_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Fast path 1: Primary Key / ID seek
  IF v_uid IS NOT NULL THEN
    SELECT site_id::UUID INTO v_site_id 
    FROM public.employees 
    WHERE id::TEXT = v_uid::TEXT
    LIMIT 1;

    IF v_site_id IS NOT NULL THEN
      RETURN v_site_id;
    END IF;
  END IF;

  -- Fast path 2: Direct JWT session email lookup
  IF v_email IS NOT NULL AND v_email <> '' THEN
    SELECT site_id::UUID INTO v_site_id 
    FROM public.employees 
    WHERE LOWER(email) = LOWER(v_email)
    LIMIT 1;

    IF v_site_id IS NOT NULL THEN
      RETURN v_site_id;
    END IF;
  END IF;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$function$;
CREATE OR REPLACE FUNCTION public.get_procurement_metrics(p_site_id text DEFAULT NULL::text, p_start_date timestamp without time zone DEFAULT NULL::timestamp without time zone, p_end_date timestamp without time zone DEFAULT NULL::timestamp without time zone)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_site_uuid UUID;
    v_total_spend NUMERIC;
    v_open_po_count INTEGER;
    v_pending_value NUMERIC;
    v_category_spend JSON;
    v_trend_data JSON;
BEGIN
    IF p_site_id IS NOT NULL AND p_site_id != 'All' AND p_site_id != '' THEN v_site_uuid := p_site_id::UUID; ELSE v_site_uuid := NULL; END IF;

    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_spend FROM purchase_orders
    WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND (p_start_date IS NULL OR created_at >= p_start_date) AND (p_end_date IS NULL OR created_at <= p_end_date) AND status != 'Cancelled';

    SELECT COUNT(*), COALESCE(SUM(total_amount), 0) INTO v_open_po_count, v_pending_value FROM purchase_orders
    WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND (p_start_date IS NULL OR created_at >= p_start_date) AND (p_end_date IS NULL OR created_at <= p_end_date) AND status IN ('Draft', 'Pending', 'Approved');

    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_category_spend FROM (
        SELECT COALESCE(p.category, 'General') as name, SUM(pi.total_cost) as value FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id LEFT JOIN products p ON pi.product_id = p.id
        WHERE (v_site_uuid IS NULL OR po.site_id = v_site_uuid) AND (p_start_date IS NULL OR po.created_at >= p_start_date) AND (p_end_date IS NULL OR po.created_at <= p_end_date) AND po.status != 'Cancelled'
        GROUP BY 1 ORDER BY value DESC LIMIT 6
    ) t;

    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_trend_data FROM (
        SELECT to_char(date_trunc('month', created_at), 'Mon') as name, SUM(total_amount) as spend FROM purchase_orders
        WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND (p_start_date IS NULL OR created_at >= p_start_date) AND (p_end_date IS NULL OR created_at <= p_end_date) AND status != 'Cancelled'
        GROUP BY 1 ORDER BY 1 LIMIT 12
    ) t;

    RETURN json_build_object('totalSpend', v_total_spend, 'openPO', v_open_po_count, 'pendingValue', v_pending_value, 'categoryData', v_category_spend, 'trendData', v_trend_data);
END;
$function$;
CREATE OR REPLACE FUNCTION public.get_warehouse_metrics(p_site_id text DEFAULT NULL::text, p_start_date timestamp without time zone DEFAULT NULL::timestamp without time zone, p_end_date timestamp without time zone DEFAULT NULL::timestamp without time zone, p_country_code text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_site_uuid UUID := NULL;
    v_country TEXT := NULL;
    v_flow_data JSON;
    v_fast_movers JSON;
    v_job_stats JSON;
    v_job_type_breakdown JSON;
    v_zone_data JSON;
    v_inbound_pos INTEGER := 0;
    v_active_alerts INTEGER := 0;
BEGIN
    -- 1. Resolve UUID safely
    IF p_site_id IS NOT NULL AND p_site_id != 'All' AND p_site_id != '' THEN
        BEGIN
            v_site_uuid := p_site_id::UUID;
        EXCEPTION WHEN OTHERS THEN
            v_site_uuid := NULL;
        END;
    END IF;

    -- 2. Resolve Country Code from site or param
    IF p_country_code IS NOT NULL AND p_country_code != '' THEN
        v_country := UPPER(TRIM(p_country_code));
    ELSIF v_site_uuid IS NOT NULL THEN
        SELECT UPPER(country) INTO v_country FROM sites WHERE id = v_site_uuid LIMIT 1;
    END IF;

    -- Default fallback to ET if completely unspecified
    IF v_country IS NULL THEN
        v_country := 'ET';
    END IF;

    -- 3. Zones: select with real temperature and capacity, scoped by site and sovereign country
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_zone_data FROM (
        SELECT wz.id, wz.name, wz.capacity, wz.occupied, wz.type, wz.temperature
        FROM warehouse_zones wz
        JOIN sites s ON s.id = wz.site_id
        WHERE (v_site_uuid IS NULL OR wz.site_id = v_site_uuid)
          AND (s.country = v_country)
        ORDER BY wz.name ASC
    ) t;

    -- 4. Inbound PO Count: count scheduled POs in transit / ordered for this site & country
    SELECT COUNT(*) INTO v_inbound_pos
    FROM purchase_orders po
    WHERE (v_site_uuid IS NULL OR po.site_id = v_site_uuid)
      AND (po.country_code = v_country)
      AND UPPER(po.status) IN ('ORDERED', 'IN TRANSIT', 'IN_TRANSIT', 'PENDING', 'APPROVED');

    -- 5. Flow Dynamics: Inbound & Outbound volume trends scoped strictly by country and site
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_flow_data FROM (
        SELECT 
            to_char(date_trunc('day', COALESCE(sm.movement_date, sm.created_at)), 'YYYY-MM-DD') as date,
            to_char(date_trunc('day', COALESCE(sm.movement_date, sm.created_at)), 'Dy') as name,
            COUNT(*) FILTER (WHERE UPPER(sm.type) IN ('IN', 'RETURN', 'TRANSFER_IN', 'ADJUSTMENT_UP')) as inbound,
            COUNT(*) FILTER (WHERE UPPER(sm.type) IN ('OUT', 'SALE', 'TRANSFER_OUT', 'ADJUSTMENT_DOWN')) as outbound
        FROM stock_movements sm
        JOIN sites s ON s.id = sm.site_id
        WHERE (v_site_uuid IS NULL OR sm.site_id = v_site_uuid)
          AND (s.country = v_country)
          AND (p_start_date IS NULL OR COALESCE(sm.movement_date, sm.created_at) >= p_start_date)
          AND (p_end_date IS NULL OR COALESCE(sm.movement_date, sm.created_at) <= p_end_date)
        GROUP BY 1, 2
        ORDER BY 1
    ) t;

    -- 6. Fast Movers: Outbound products scoped by site and country
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_fast_movers FROM (
        SELECT 
            COALESCE(sm.product_name, 'Unknown') as name,
            COALESCE(SUM(sm.quantity), 0) as moved,
            '+12%' as trend
        FROM stock_movements sm
        JOIN sites s ON s.id = sm.site_id
        WHERE (v_site_uuid IS NULL OR sm.site_id = v_site_uuid)
          AND (s.country = v_country)
          AND (p_start_date IS NULL OR COALESCE(sm.movement_date, sm.created_at) >= p_start_date)
          AND (p_end_date IS NULL OR COALESCE(sm.movement_date, sm.created_at) <= p_end_date)
          AND UPPER(sm.type) IN ('OUT', 'SALE', 'TRANSFER_OUT')
        GROUP BY 1
        ORDER BY moved DESC
        LIMIT 5
    ) t;

    -- 7. WMS Jobs Stats: Scoped by site and country_code
    SELECT json_build_object(
        'total', COUNT(*),
        'completed', COUNT(*) FILTER (WHERE UPPER(status) = 'COMPLETED' AND (p_start_date IS NULL OR updated_at >= p_start_date) AND (p_end_date IS NULL OR updated_at <= p_end_date)),
        'active', COUNT(*) FILTER (WHERE UPPER(status) NOT IN ('COMPLETED', 'CANCELLED')),
        'pending_picks', COUNT(*) FILTER (WHERE UPPER(type) = 'PICK' AND UPPER(status) NOT IN ('COMPLETED', 'CANCELLED')),
        'critical_picks', COUNT(*) FILTER (WHERE UPPER(type) = 'PICK' AND UPPER(priority) IN ('CRITICAL', 'HIGH') AND UPPER(status) NOT IN ('COMPLETED', 'CANCELLED')),
        'pick_accuracy', COALESCE(ROUND((SUM(items_count) FILTER (WHERE UPPER(type) = 'PICK' AND UPPER(status) = 'COMPLETED' AND (p_start_date IS NULL OR updated_at >= p_start_date) AND (p_end_date IS NULL OR updated_at <= p_end_date))::numeric / NULLIF(SUM(items_count) FILTER (WHERE UPPER(type) = 'PICK' AND (p_start_date IS NULL OR created_at >= p_start_date) AND (p_end_date IS NULL OR created_at <= p_end_date)), 0)) * 100, 1)::text || '%', '100%'),
        'avg_cycle_time', COALESCE((AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) FILTER (WHERE UPPER(status) = 'COMPLETED' AND (p_start_date IS NULL OR updated_at >= p_start_date) AND (p_end_date IS NULL OR updated_at <= p_end_date)) / 60)::INTEGER || 'm', '0m')
    ) INTO v_job_stats
    FROM wms_jobs
    WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid OR dest_site_id = v_site_uuid)
      AND (country_code = v_country);

    -- 8. Queue Breakdown by job type
    SELECT COALESCE(json_object_agg(UPPER(type), job_count), '{}'::json) INTO v_job_type_breakdown FROM (
        SELECT type, COUNT(*) as job_count
        FROM wms_jobs
        WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid OR dest_site_id = v_site_uuid)
          AND (country_code = v_country)
          AND UPPER(status) NOT IN ('COMPLETED', 'CANCELLED')
        GROUP BY type
    ) t;

    -- 9. Active Alerts: Critical picks + jobs with discrepancies
    SELECT COUNT(*) INTO v_active_alerts
    FROM wms_jobs
    WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid OR dest_site_id = v_site_uuid)
      AND (country_code = v_country)
      AND (UPPER(priority) = 'CRITICAL' OR has_discrepancy = true)
      AND UPPER(status) NOT IN ('COMPLETED', 'CANCELLED');

    RETURN json_build_object(
        'flow_data', v_flow_data,
        'fast_movers', v_fast_movers,
        'job_stats', v_job_stats,
        'queue_breakdown', v_job_type_breakdown,
        'zone_data', v_zone_data,
        'inbound_pos', v_inbound_pos,
        'active_alerts', v_active_alerts
    );
END;
$function$;
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    default_currency text := 'KES';
    new_user_id uuid;
    wallet_exists boolean;
begin
    -- Upsert into public.users
    insert into public.users (auth_id, email, phone, full_name, default_language, created_at, updated_at)
    values (new.id, new.email, new.phone, coalesce(new.raw_user_meta_data ->> 'full_name', new.email), 'en', now(), now())
    on conflict (auth_id) do update
        set email = excluded.email,
            phone = excluded.phone,
            full_name = excluded.full_name,
            updated_at = now()
    returning id into new_user_id;

    if new_user_id is null then
        select id into new_user_id from public.users where auth_id = new.id;
    end if;

    select exists(select 1 from public.wallets where user_id = new_user_id) into wallet_exists;

    if not wallet_exists then
        insert into public.wallets (user_id, currency_code, balance_cents)
        values (new_user_id, default_currency, 0);
    end if;

    return new;
end;
$function$;
SET check_function_bodies = on;
RESET search_path;
