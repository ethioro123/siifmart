-- =============================================================================
-- SIIFMART: FIX products INSERT for warehouse workers doing receiving
-- =============================================================================
--
-- ISSUE: products_insert policy only allows is_manager(), but warehouse
-- workers (non-managers) assigned to a RECEIVE job need to create placeholder
-- products when receiving POs with items not yet in the products table.
--
-- FIX: Drop the existing restrictive insert policy and replace it with one
-- that also allows any authenticated user who is assigned to an active
-- RECEIVE-type wms_job.
--
-- Safe to re-run (idempotent).
-- =============================================================================

-- Drop the old restrictive insert policy
DROP POLICY IF EXISTS "products_insert" ON public.products;

-- New policy: managers can always insert; warehouse workers can insert
-- when they have an active RECEIVE job assignment.
CREATE POLICY "products_insert" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Managers and above can always create products
        (SELECT public.is_manager())
        OR
        -- Warehouse workers assigned to a RECEIVE job can create placeholder products
        EXISTS (
            SELECT 1
            FROM public.job_assignments ja
            JOIN public.wms_jobs j ON j.id = ja.job_id
            WHERE ja.employee_id = (SELECT auth.uid())
              AND j.type = 'RECEIVE'
              AND j.status IN ('Pending', 'In Progress', 'Active')
        )
    );

-- Also ensure UPDATE is allowed for workers doing receiving (barcode/attribute sync)
DROP POLICY IF EXISTS "products_update" ON public.products;

CREATE POLICY "products_update" ON public.products
    FOR UPDATE TO authenticated
    USING (
        -- Managers and above can always update products
        (SELECT public.is_manager())
        OR
        -- Warehouse workers assigned to a RECEIVE job can update product details
        EXISTS (
            SELECT 1
            FROM public.job_assignments ja
            JOIN public.wms_jobs j ON j.id = ja.job_id
            WHERE ja.employee_id = (SELECT auth.uid())
              AND j.type = 'RECEIVE'
              AND j.status IN ('Pending', 'In Progress', 'Active')
        )
    );

-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ products_insert & products_update policies updated:';
    RAISE NOTICE '  • Managers/above: full insert/update access (unchanged)';
    RAISE NOTICE '  • Workers with active RECEIVE job assignment: can now insert/update products';
END $$;
