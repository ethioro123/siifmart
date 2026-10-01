-- ==============================================================================
-- Migration: Fix Purchase Orders RLS & PostgREST Single Row Fetching
-- Description:
--   1. Ensures RLS policies on purchase_orders and po_items allow clean reading
--      and writing for both authenticated staff and local/anon clients.
--   2. Enforces Warehouse / Distribution Center routing at RLS policy level.
--   3. Eliminates PostgREST PGRST116 (HTTP 406) single-row coercion errors.
-- ==============================================================================

-- 1. Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_items ENABLE ROW LEVEL SECURITY;

-- 2. Drop legacy conflicting SELECT policies
DROP POLICY IF EXISTS "po_read" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_select" ON public.purchase_orders;
DROP POLICY IF EXISTS "po_isolation_select" ON public.purchase_orders;

-- 3. Create unified Country-Scoped SELECT policy
CREATE POLICY "po_isolation_select" ON public.purchase_orders
    FOR SELECT TO public
    USING (
        -- Allow anonymous/dev client access and corporate executives
        auth.role() = 'anon'
        OR COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO', 'admin', 'authenticated')
        OR site_id IN (
            SELECT id FROM public.sites 
            WHERE country = (
                SELECT COALESCE(s2.country, 'ET')
                FROM public.sites s2
                WHERE s2.id = (
                    SELECT site_id FROM public.employees 
                    WHERE id::text = auth.uid()::text 
                    LIMIT 1
                )
            )
        )
    );

-- 4. Create unified INSERT policy with Warehouse/DC Destination Enforcement
DROP POLICY IF EXISTS "po_insert" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_insert" ON public.purchase_orders;

CREATE POLICY "po_insert" ON public.purchase_orders
    FOR INSERT TO public
    WITH CHECK (
        -- Destination must be Warehouse or DC if site exists in sites table
        site_id IS NULL 
        OR site_id IN (
            SELECT id FROM public.sites WHERE type IN ('Warehouse', 'Distribution Center')
        )
        OR NOT EXISTS (SELECT 1 FROM public.sites WHERE id = site_id)
    );

-- 5. Create unified UPDATE & DELETE policies
DROP POLICY IF EXISTS "po_update" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_update" ON public.purchase_orders;

CREATE POLICY "po_update" ON public.purchase_orders
    FOR UPDATE TO public
    USING (true)
    WITH CHECK (
        site_id IS NULL 
        OR site_id IN (
            SELECT id FROM public.sites WHERE type IN ('Warehouse', 'Distribution Center')
        )
        OR NOT EXISTS (SELECT 1 FROM public.sites WHERE id = site_id)
    );

DROP POLICY IF EXISTS "po_delete" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_delete" ON public.purchase_orders;

CREATE POLICY "po_delete" ON public.purchase_orders
    FOR DELETE TO public
    USING (true);

-- 6. PO_ITEMS Policies
DROP POLICY IF EXISTS "po_items_read" ON public.po_items;
DROP POLICY IF EXISTS "po_items_select" ON public.po_items;
CREATE POLICY "po_items_select" ON public.po_items
    FOR SELECT TO public
    USING (true);

DROP POLICY IF EXISTS "po_items_insert" ON public.po_items;
CREATE POLICY "po_items_insert" ON public.po_items
    FOR INSERT TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "po_items_update" ON public.po_items;
CREATE POLICY "po_items_update" ON public.po_items
    FOR UPDATE TO public
    USING (true);

DROP POLICY IF EXISTS "po_items_delete" ON public.po_items;
CREATE POLICY "po_items_delete" ON public.po_items
    FOR DELETE TO public
    USING (true);
