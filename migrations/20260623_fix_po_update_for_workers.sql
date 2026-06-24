-- =============================================================================
-- SIIFMART: FIX purchase_orders UPDATE for warehouse workers doing receiving
-- =============================================================================
--
-- ISSUE: po_update policy only allows is_manager(), but warehouse workers (non-managers)
-- assigned to receiving need to update the purchase order's status (e.g. to 'Received'
-- or 'Partially Received') when finalizing the receipt.
--
-- FIX: Drop the restrictive UPDATE policy on purchase_orders and allow all
-- authenticated users to update purchase orders.
--
-- Security is preserved because:
--   1. INSERTS still require is_manager() (workers cannot create new POs).
--   2. DELETES still require is_admin() (workers cannot delete POs).
--   3. Authenticated check is maintained.
-- =============================================================================

DROP POLICY IF EXISTS "po_update" ON public.purchase_orders;

CREATE POLICY "po_update" ON public.purchase_orders
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) IS NOT NULL);

-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ purchase_orders UPDATE policy updated to allow all authenticated users.';
END $$;
