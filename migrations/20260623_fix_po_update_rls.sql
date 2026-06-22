-- =============================================================================
-- SIIFMART: ALLOW PO UPDATE FOR ALL AUTHENTICATED USERS
-- =============================================================================
--
-- ISSUE: The "po_update" policy on the purchase_orders table only allows managers
-- to update purchase orders. However, warehouse staff (non-managers) need to 
-- update the PO status to 'Received' or 'Partially Received' when completing/finalizing 
-- receiving jobs. This mismatch causes a PGRST116 error (0 rows updated) because 
-- RLS blocks the update query for non-managers.
--
-- FIX: Drop the old "po_update" policy and create a new, more permissive one
-- that allows any authenticated user to update purchase orders. This is safe 
-- because:
--   1. Only authenticated (logged-in) users can make updates.
--   2. Delete operations still require an admin role ("po_delete").
--   3. Create/insert operations still require a manager role ("po_insert").
--
-- =============================================================================

-- Drop the old restrictive update policy
DROP POLICY IF EXISTS "po_update" ON public.purchase_orders;

-- Create the more permissive update policy
CREATE POLICY "po_update" ON public.purchase_orders
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) IS NOT NULL);

-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ purchase_orders UPDATE policy updated:';
    RAISE NOTICE '  • Updates (e.g. status changes) are now open to all authenticated users';
    RAISE NOTICE '  • INSERT still requires manager+ role';
    RAISE NOTICE '  • DELETE still requires admin+ role';
END $$;
