CREATE POLICY inv_requests_merchandising_finance_read
ON public.inventory_requests FOR SELECT TO authenticated
USING (
  adjustment_reason LIKE 'PRICE_CHANGE%'
  AND private.merchandising_finance_scope(site_id, country_code::text)
);
