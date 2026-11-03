-- Exact, country-local operating totals; pending counts exclude saved drafts. The caller cannot choose sites:
-- every returned facility must pass the signed-in employee's server scope.
BEGIN;

CREATE OR REPLACE FUNCTION public.get_regional_operating_summary(
  p_region_code text, p_country_code text
) RETURNS TABLE (
  site_id uuid,
  today_sales_total numeric, today_sales_count bigint, monthly_sales_total numeric,
  monthly_po_spend numeric, open_register_count bigint, staff_count bigint,
  pending_po_count bigint, escalated_po_count bigint, variance_shift_count bigint,
  pending_picks bigint, in_progress_packs bigint, pending_receives bigint,
  overrides_24h bigint, sales_24h bigint,
  inventory_value numeric, low_stock_count bigint, out_of_stock_count bigint,
  optimal_stock_count bigint, total_skus bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE actor public.employees%ROWTYPE; home public.sites%ROWTYPE;
  business_timezone text; day_start timestamptz; day_end timestamptz;
  month_start timestamptz; month_date date;
BEGIN
  IF auth.uid() IS NULL OR nullif(btrim(p_region_code),'') IS NULL
     OR upper(coalesce(p_country_code,'')) !~ '^[A-Z]{2}$' THEN
    RAISE EXCEPTION 'Authenticated regional scope required' USING ERRCODE='42501';
  END IF;
  SELECT * INTO actor FROM public.employees WHERE id=auth.uid()
    AND lower(coalesce(status,'active'))='active';
  SELECT * INTO home FROM public.sites WHERE id=actor.site_id;
  IF actor.id IS NULL OR home.id IS NULL THEN
    RAISE EXCEPTION 'Active employee facility required' USING ERRCODE='42501';
  END IF;
  IF public.normalize_role(actor.role) <> 'group_ceo'
     AND upper(home.country) IS DISTINCT FROM upper(p_country_code) THEN
    RAISE EXCEPTION 'Regional summary is outside employee country' USING ERRCODE='42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.regions r WHERE r.code=p_region_code
    AND upper(r.country)=upper(p_country_code)) THEN
    RAISE EXCEPTION 'Region is unavailable in this country' USING ERRCODE='22023';
  END IF;

  business_timezone := CASE upper(p_country_code)
    WHEN 'ET' THEN 'Africa/Addis_Ababa' WHEN 'KE' THEN 'Africa/Nairobi'
    WHEN 'UG' THEN 'Africa/Kampala' WHEN 'RW' THEN 'Africa/Kigali'
    WHEN 'TZ' THEN 'Africa/Dar_es_Salaam' ELSE 'UTC' END;
  day_start := date_trunc('day', now() AT TIME ZONE business_timezone) AT TIME ZONE business_timezone;
  day_end := (date_trunc('day', now() AT TIME ZONE business_timezone) + interval '1 day') AT TIME ZONE business_timezone;
  month_start := date_trunc('month', now() AT TIME ZONE business_timezone) AT TIME ZONE business_timezone;
  month_date := (month_start AT TIME ZONE business_timezone)::date;

  RETURN QUERY
  SELECT site.id,
    coalesce(sales.today_total,0), coalesce(sales.today_count,0),
    coalesce(sales.month_total,0), coalesce(orders.month_spend,0),
    coalesce(registers.open_count,0), coalesce(workforce.staff_count,0),
    coalesce(orders.pending_count,0), coalesce(orders.escalated_count,0),
    coalesce(registers.variance_count,0), coalesce(jobs.pending_picks,0),
    coalesce(jobs.in_progress_packs,0), coalesce(jobs.pending_receives,0),
    coalesce(overrides.override_count,0), coalesce(sales.rolling_count,0),
    coalesce(inventory.inventory_value,0), coalesce(inventory.low_count,0),
    coalesce(inventory.out_count,0), coalesce(inventory.optimal_count,0),
    coalesce(inventory.sku_count,0)
  FROM public.sites site
  JOIN public.regions region ON region.code=site.region_code
    AND upper(region.country)=upper(site.country)
  LEFT JOIN LATERAL (
    SELECT coalesce(sum(s.total) FILTER (WHERE s.created_at>=day_start AND s.created_at<day_end),0) today_total,
      count(*) FILTER (WHERE s.created_at>=day_start AND s.created_at<day_end) today_count,
      coalesce(sum(s.total) FILTER (WHERE s.created_at>=month_start),0) month_total,
      count(*) FILTER (WHERE s.created_at>=now()-interval '24 hours') rolling_count
    FROM public.sales s WHERE s.site_id=site.id AND upper(s.country_code)=upper(site.country)
      AND s.status='Completed' AND s.created_at>=least(month_start,now()-interval '24 hours')
  ) sales ON true
  LEFT JOIN LATERAL (
    SELECT coalesce(sum(po.total_amount) FILTER (
        WHERE po.order_date>=month_date AND po.status IN ('Approved','Ordered','Partially Received','Received','Completed')),0) month_spend,
      count(*) FILTER (WHERE po.status='Pending'
        AND po.total_amount<=region.autonomous_po_limit) pending_count,
      count(*) FILTER (WHERE po.status='Pending'
        AND po.total_amount>region.autonomous_po_limit) escalated_count
    FROM public.purchase_orders po WHERE po.site_id=site.id
      AND upper(po.country_code)=upper(site.country)
      AND (po.order_date>=month_date OR po.status='Pending')
  ) orders ON true
  LEFT JOIN LATERAL (
    SELECT count(*) FILTER (WHERE shift.status='Open') open_count,
      count(*) FILTER (WHERE shift.status='Flagged'
        OR shift.reconciliation_status='Discrepancy_Flagged'
        OR coalesce(shift.variance,0)<>0) variance_count
    FROM public.shifts shift WHERE shift.site_id=site.id AND upper(shift.country_code)=upper(site.country)
  ) registers ON true
  LEFT JOIN LATERAL (
    SELECT count(*) staff_count FROM public.employees e WHERE e.site_id=site.id
      AND lower(coalesce(e.status,'active'))='active'
  ) workforce ON true
  LEFT JOIN LATERAL (
    SELECT count(*) FILTER (WHERE job.type='PICK' AND job.status IN ('Pending','Assigned')) pending_picks,
      count(*) FILTER (WHERE job.type='PACK' AND job.status='In-Progress') in_progress_packs,
      count(*) FILTER (WHERE job.type='RECEIVE' AND job.status IN ('Pending','Assigned','In-Progress')) pending_receives
    FROM public.wms_jobs job WHERE job.site_id=site.id AND upper(job.country_code)=upper(site.country)
      AND job.status NOT IN ('Completed','Cancelled')
  ) jobs ON true
  LEFT JOIN LATERAL (
    SELECT count(*) override_count FROM public.pos_supervisory_overrides ov
    WHERE ov.site_id=site.id::text AND upper(ov.country_code)=upper(site.country)
      AND ov.created_at>=now()-interval '24 hours'
  ) overrides ON true
  LEFT JOIN LATERAL (
    SELECT round(coalesce(sum(p.price*p.stock),0)) inventory_value,
      count(*) FILTER (WHERE (p.stock<10 AND p.stock>0) OR p.status='low_stock') low_count,
      count(*) FILTER (WHERE p.stock=0 OR p.status='out_of_stock') out_count,
      count(*) FILTER (WHERE p.stock>=10 AND p.status<>'out_of_stock') optimal_count,
      count(*) sku_count
    FROM public.products p WHERE p.site_id=site.id
  ) inventory ON true
  WHERE site.region_code=p_region_code AND upper(site.country)=upper(p_country_code)
    AND public.is_site_in_my_authorized_scope(site.id::text,site.country::text);
END;
$function$;

REVOKE ALL ON FUNCTION public.get_regional_operating_summary(text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_regional_operating_summary(text,text) TO authenticated;
COMMIT;
