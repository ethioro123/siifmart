CREATE INDEX IF NOT EXISTS product_price_history_retention_scan ON public.product_price_history(country_code,changed_at,id);
CREATE INDEX IF NOT EXISTS price_proposal_retention_scan ON public.inventory_requests(country_code,status,requested_at,id) WHERE change_type='edit' AND private.is_price_change(proposed_changes);
