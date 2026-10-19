-- Limit consequential transfer discrepancy actions to authorized site
-- leadership; basic accept, investigation, and recount reports remain scoped
-- to authenticated employees at the destination site.

DROP POLICY IF EXISTS discrepancy_resolutions_insert ON public.discrepancy_resolutions;
CREATE POLICY discrepancy_resolutions_insert ON public.discrepancy_resolutions
FOR INSERT TO authenticated
WITH CHECK (
    site_id IS NOT NULL
    AND public.is_site_in_my_authorized_scope(site_id::text, NULL)
    AND (
        resolution_type IN ('accept', 'investigate', 'recount')
        OR lower(coalesce(public.get_my_role(), '')) IN (
            'store_manager', 'warehouse_manager', 'inventory_manager',
            'super_admin', 'ceo', 'admin', 'regional_manager', 'operations_manager'
        )
    )
);

DROP POLICY IF EXISTS discrepancy_resolutions_update ON public.discrepancy_resolutions;
CREATE POLICY discrepancy_resolutions_update ON public.discrepancy_resolutions
FOR UPDATE TO authenticated
USING (
    site_id IS NOT NULL
    AND public.is_site_in_my_authorized_scope(site_id::text, NULL)
    AND lower(coalesce(public.get_my_role(), '')) IN (
        'store_manager', 'warehouse_manager', 'inventory_manager',
        'super_admin', 'ceo', 'admin', 'regional_manager', 'operations_manager'
    )
)
WITH CHECK (
    site_id IS NOT NULL
    AND public.is_site_in_my_authorized_scope(site_id::text, NULL)
    AND lower(coalesce(public.get_my_role(), '')) IN (
        'store_manager', 'warehouse_manager', 'inventory_manager',
        'super_admin', 'ceo', 'admin', 'regional_manager', 'operations_manager'
    )
);

DROP POLICY IF EXISTS discrepancy_claims_insert ON public.discrepancy_claims;
CREATE POLICY discrepancy_claims_insert ON public.discrepancy_claims
FOR INSERT TO authenticated
WITH CHECK (
    lower(coalesce(public.get_my_role(), '')) IN (
        'store_manager', 'warehouse_manager', 'inventory_manager',
        'super_admin', 'ceo', 'admin', 'regional_manager', 'operations_manager'
    )
    AND EXISTS (
        SELECT 1 FROM public.discrepancy_resolutions r
        WHERE r.id = resolution_id AND r.site_id IS NOT NULL
          AND public.is_site_in_my_authorized_scope(r.site_id::text, NULL)
    )
);

DROP POLICY IF EXISTS discrepancy_claims_update ON public.discrepancy_claims;
CREATE POLICY discrepancy_claims_update ON public.discrepancy_claims
FOR UPDATE TO authenticated
USING (
    lower(coalesce(public.get_my_role(), '')) IN (
        'store_manager', 'warehouse_manager', 'inventory_manager',
        'super_admin', 'ceo', 'admin', 'regional_manager', 'operations_manager'
    )
    AND EXISTS (
        SELECT 1 FROM public.discrepancy_resolutions r
        WHERE r.id = resolution_id AND r.site_id IS NOT NULL
          AND public.is_site_in_my_authorized_scope(r.site_id::text, NULL)
    )
)
WITH CHECK (
    lower(coalesce(public.get_my_role(), '')) IN (
        'store_manager', 'warehouse_manager', 'inventory_manager',
        'super_admin', 'ceo', 'admin', 'regional_manager', 'operations_manager'
    )
    AND EXISTS (
        SELECT 1 FROM public.discrepancy_resolutions r
        WHERE r.id = resolution_id AND r.site_id IS NOT NULL
          AND public.is_site_in_my_authorized_scope(r.site_id::text, NULL)
    )
);
