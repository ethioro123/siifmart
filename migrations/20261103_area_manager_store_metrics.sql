-- Exact operating totals for an Area Manager's assigned retail stores.
-- The caller supplies no site IDs, country, or role; all scope is resolved from
-- the authenticated active employee and the server-owned store assignment.
BEGIN;

CREATE OR REPLACE FUNCTION public.get_area_store_metrics()
RETURNS TABLE (
  site_id uuid,
  today_sales_total numeric,
  today_sales_count bigint,
  monthly_sales_total numeric,
  monthly_po_spend numeric,
  open_register_count bigint,
  staff_count bigint,
  pending_po_count bigint,
  escalated_po_count bigint,
  overrides_24h bigint,
  sales_24h bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE
  actor public.employees%ROWTYPE;
  home public.sites%ROWTYPE;
  local_timezone text;
  day_start timestamptz;
  day_end timestamptz;
  month_start timestamptz;
BEGIN
  SELECT * INTO actor FROM public.employees WHERE id = auth.uid();
  SELECT * INTO home FROM public.sites WHERE id = actor.site_id;
  IF actor.id IS NULL OR public.normalize_role(actor.role) <> 'area_operations_manager'
     OR lower(coalesce(actor.status, 'active')) <> 'active' OR home.id IS NULL THEN
    RAISE EXCEPTION 'Active Area Manager required' USING ERRCODE = '42501';
  END IF;

  local_timezone := CASE upper(home.country)
    WHEN 'ET' THEN 'Africa/Addis_Ababa'
    WHEN 'KE' THEN 'Africa/Nairobi'
    WHEN 'UG' THEN 'Africa/Kampala'
    WHEN 'RW' THEN 'Africa/Kigali'
    WHEN 'TZ' THEN 'Africa/Dar_es_Salaam'
    ELSE 'UTC'
  END;
  day_start := date_trunc('day', now() AT TIME ZONE local_timezone) AT TIME ZONE local_timezone;
  day_end := day_start + interval '1 day';
  month_start := date_trunc('month', now() AT TIME ZONE local_timezone) AT TIME ZONE local_timezone;

  RETURN QUERY
  SELECT store.id,
         coalesce(sales.today_total, 0), coalesce(sales.today_count, 0),
         coalesce(sales.month_total, 0), coalesce(orders.month_spend, 0),
         coalesce(registers.open_count, 0), coalesce(workforce.staff_count, 0),
         coalesce(orders.pending_count, 0), coalesce(orders.escalated_count, 0),
         coalesce(overrides.override_count, 0), coalesce(sales.rolling_count, 0)
  FROM public.sites store
  LEFT JOIN public.regions region ON region.code = store.region_code
    AND upper(region.country) = upper(store.country)
  LEFT JOIN LATERAL (
    SELECT coalesce(sum(s.total) FILTER
             (WHERE s.created_at >= day_start AND s.created_at < day_end), 0) AS today_total,
           count(*) FILTER
             (WHERE s.created_at >= day_start AND s.created_at < day_end) AS today_count,
           coalesce(sum(s.total), 0) AS month_total,
           count(*) FILTER (WHERE s.created_at >= now() - interval '24 hours') AS rolling_count
    FROM public.sales s
    WHERE s.site_id = store.id AND upper(s.country_code) = upper(store.country)
      AND s.status = 'Completed' AND s.created_at >= least(month_start, now() - interval '24 hours')
  ) sales ON true
  LEFT JOIN LATERAL (
    SELECT coalesce(sum(po.total_amount) FILTER
             (WHERE po.created_at >= month_start
               AND po.status IN ('Approved', 'Partially Received', 'Received', 'Completed')), 0) AS month_spend,
           count(*) FILTER
             (WHERE po.status IN ('Draft', 'Pending')
               AND po.total_amount <= coalesce(region.autonomous_po_limit, 0)) AS pending_count,
           count(*) FILTER
             (WHERE po.status IN ('Draft', 'Pending')
               AND po.total_amount > coalesce(region.autonomous_po_limit, 0)) AS escalated_count
    FROM public.purchase_orders po
    WHERE po.site_id = store.id AND upper(po.country_code) = upper(store.country)
      AND (po.created_at >= month_start OR po.status IN ('Draft', 'Pending'))
  ) orders ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS open_count FROM public.shifts shift
    WHERE shift.site_id = store.id AND upper(shift.country_code) = upper(store.country)
      AND shift.status = 'Open'
  ) registers ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS staff_count FROM public.employees employee
    WHERE employee.site_id = store.id AND lower(coalesce(employee.status, 'active')) = 'active'
  ) workforce ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS override_count FROM public.pos_supervisory_overrides override_event
    WHERE override_event.site_id = store.id
      AND upper(override_event.country_code) = upper(store.country)
      AND override_event.created_at >= now() - interval '24 hours'
  ) overrides ON true
  WHERE store.area_manager_id = actor.id AND store.type = 'Store'
    AND upper(store.country) = upper(home.country)
    AND store.region_code = coalesce(actor.region_code, home.region_code);
END;
$function$;

REVOKE ALL ON FUNCTION public.get_area_store_metrics() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_area_store_metrics() TO authenticated;

COMMIT;
