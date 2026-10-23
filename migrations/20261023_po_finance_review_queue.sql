-- Bounded, live-limit finance queue. Invoker rights preserve existing country/site RLS.
CREATE OR REPLACE FUNCTION public.get_po_finance_review_queue(
  p_country text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0
) RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH eligible AS MATERIALIZED (
    SELECT po.id, po.po_number, po.supplier_name, po.total_amount, po.currency,
           po.status, po.created_by, po.requested_by, po.created_at,
           r.code AS region_code, r.autonomous_po_limit AS regional_limit
    FROM public.purchase_orders po
    JOIN public.sites s ON s.id = po.site_id
    JOIN public.regions r ON r.code = coalesce(po.region_code, s.region_code)
      AND upper(r.country) = upper(po.country_code)
    WHERE po.country_code = upper(p_country)
      AND po.status IN ('Draft','Pending')
      AND lower(r.status) = 'active' AND r.autonomous_po_limit >= 0
      AND po.total_amount > r.autonomous_po_limit
      AND NOT (po.finance_cleared_at IS NOT NULL
        AND po.finance_cleared_amount IS NOT DISTINCT FROM po.total_amount
        AND po.finance_cleared_supplier_id IS NOT DISTINCT FROM po.supplier_id
        AND po.finance_cleared_currency IS NOT DISTINCT FROM po.currency
        AND po.finance_cleared_payment_terms IS NOT DISTINCT FROM po.payment_terms)
      AND upper(p_country) = public.get_my_country_code_strict()
      AND EXISTS (SELECT 1 FROM public.employees e WHERE e.id = (SELECT auth.uid())
        AND e.role = 'country_finance_director' AND lower(coalesce(e.status,'active')) = 'active')
  ), page AS (
    SELECT * FROM eligible ORDER BY created_at, id
    LIMIT least(greatest(coalesce(p_limit,20),1),50)
    OFFSET greatest(coalesce(p_offset,0),0)
  )
  SELECT jsonb_build_object('data', coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY created_at,id) FROM page),'[]'::jsonb),
    'count', (SELECT count(*) FROM eligible));
$$;
REVOKE ALL ON FUNCTION public.get_po_finance_review_queue(text,integer,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_po_finance_review_queue(text,integer,integer) TO authenticated;
