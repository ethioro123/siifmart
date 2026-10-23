-- Floor workers must be able to read back the internal jobs they create (INSERT ... RETURNING
-- requires SELECT access) and see the open job queue at their own site.
-- Scope: own site + own country, internal job types only (never DRIVER/DELIVERY/DISPATCH).

DROP POLICY IF EXISTS wms_jobs_floor_site_read ON public.wms_jobs;

CREATE POLICY wms_jobs_floor_site_read
ON public.wms_jobs
FOR SELECT
TO authenticated
USING (
    normalize_role(get_my_role()) = ANY (ARRAY[
        'receiver', 'picker', 'packer', 'forklift_operator', 'stock_clerk',
        'inventory_specialist', 'returns_clerk', 'returns_operator',
        'receiving_operator', 'putaway_operator', 'replenishment_operator'
    ])
    AND site_id = get_my_site_id()
    AND upper(country_code::text) = upper(get_my_country_code())
    AND upper(type::text) <> ALL (ARRAY['DRIVER', 'DELIVERY', 'DISPATCH'])
);
