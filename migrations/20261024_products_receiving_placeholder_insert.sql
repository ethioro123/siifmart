-- Allow receiving staff and managers to create zero-stock "On Order" placeholder
-- products at their own site (needed by split receiving of POs with new SKUs).
-- Narrow by design: stock must be 0, location 'On Order', no approval fields,
-- own site and own country only. Full catalog inserts stay admin-only.

DROP POLICY IF EXISTS products_insert_receiving_placeholder ON public.products;

CREATE POLICY products_insert_receiving_placeholder
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
    COALESCE(stock, 0) = 0
    AND location = 'On Order'
    AND approved_by IS NULL
    AND rejected_by IS NULL
    AND site_id IS NOT NULL
    AND (
        is_manager()
        OR lower(coalesce((SELECT get_my_role()), '')) IN (
            'receiver', 'inventory_specialist', 'stock_clerk', 'forklift_operator',
            'picker', 'packer', 'driver'
        )
    )
    AND EXISTS (
        SELECT 1
        FROM public.sites s
        WHERE s.id = products.site_id
          AND upper(s.country::text) = upper(get_my_country_code())
          AND (s.id = get_my_site_id() OR is_ceo())
    )
);
