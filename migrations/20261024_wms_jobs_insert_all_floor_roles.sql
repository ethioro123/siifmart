-- All floor workers can create internal WMS jobs (RECEIVE, PUTAWAY, PICK, PACK, COUNT,
-- TRANSFER, REPLENISH, WASTE, RETURNS, LABELS). DRIVER / DELIVERY / DISPATCH jobs stay
-- locked to non-floor creators (managers, dispatchers, drivers).
-- Changes vs previous policy: adds returns_clerk, returns_operator, receiving_operator,
-- putaway_operator, replenishment_operator; removes the inventory_specialist
-- "transfer drafts only" restriction in favour of the shared floor-role rule.

DROP POLICY IF EXISTS wms_jobs_zero_trust_insert ON public.wms_jobs;

CREATE POLICY wms_jobs_zero_trust_insert
ON public.wms_jobs
FOR INSERT
TO authenticated
WITH CHECK (
    normalize_role(get_my_role()) = ANY (ARRAY[
        'group_ceo', 'country_managing_director', 'country_operations_director',
        'regional_supply_chain_manager', 'warehouse_manager', 'store_manager',
        'inventory_manager', 'regional_operations_manager', 'regional_logistics_manager',
        'regional_procurement_manager', 'country_commercial_director',
        'country_supply_chain_director', 'dispatcher', 'cashier', 'driver',
        'receiver', 'picker', 'packer', 'forklift_operator', 'stock_clerk',
        'inventory_specialist', 'returns_clerk', 'returns_operator',
        'receiving_operator', 'putaway_operator', 'replenishment_operator'
    ])
    AND upper(country_code::text) = upper(get_my_country_code())
    AND (
        is_site_in_my_authorized_scope(site_id::text, country_code::text)
        OR (dest_site_id IS NOT NULL AND is_site_in_my_authorized_scope(dest_site_id::text, country_code::text))
    )
    AND (
        normalize_role(get_my_role()) <> ALL (ARRAY[
            'receiver', 'picker', 'packer', 'forklift_operator', 'stock_clerk',
            'inventory_specialist', 'returns_clerk', 'returns_operator',
            'receiving_operator', 'putaway_operator', 'replenishment_operator'
        ])
        OR upper(type::text) <> ALL (ARRAY['DRIVER', 'DELIVERY', 'DISPATCH'])
    )
);
