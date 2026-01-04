-- ============================================================================
-- FIX RLS AND SECURITY DEFINER ISSUES
-- ============================================================================

-- 1. Enable RLS on tables where it was missing
ALTER TABLE IF EXISTS "warehouse_zones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "worker_points" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "points_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "inventory_requests" ENABLE ROW LEVEL SECURITY;

-- 2. Create Policies for Warehouse Zones
-- Allow all authenticated users to read/write (matches Site/Product pattern)
-- Ideally this should be more granular, but for now we secure it from public access
DROP POLICY IF EXISTS "warehouse_zones_select" ON "warehouse_zones";
CREATE POLICY "warehouse_zones_select" ON "warehouse_zones"
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "warehouse_zones_insert" ON "warehouse_zones";
CREATE POLICY "warehouse_zones_insert" ON "warehouse_zones"
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "warehouse_zones_update" ON "warehouse_zones";
CREATE POLICY "warehouse_zones_update" ON "warehouse_zones"
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "warehouse_zones_delete" ON "warehouse_zones";
CREATE POLICY "warehouse_zones_delete" ON "warehouse_zones"
    FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Create Policies for Worker Points
-- Re-applying/Ensuring policies exist
DROP POLICY IF EXISTS "worker_points_select" ON "worker_points";
CREATE POLICY "worker_points_select" ON "worker_points"
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "worker_points_insert" ON "worker_points";
CREATE POLICY "worker_points_insert" ON "worker_points"
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "worker_points_update" ON "worker_points";
CREATE POLICY "worker_points_update" ON "worker_points"
    FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Create Policies for Points Transactions
DROP POLICY IF EXISTS "points_transactions_select" ON "points_transactions";
CREATE POLICY "points_transactions_select" ON "points_transactions"
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "points_transactions_insert" ON "points_transactions";
CREATE POLICY "points_transactions_insert" ON "points_transactions"
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. Create Policies for Inventory Requests
DROP POLICY IF EXISTS "inventory_requests_select" ON "inventory_requests";
CREATE POLICY "inventory_requests_select" ON "inventory_requests"
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "inventory_requests_insert" ON "inventory_requests";
CREATE POLICY "inventory_requests_insert" ON "inventory_requests"
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "inventory_requests_update" ON "inventory_requests";
CREATE POLICY "inventory_requests_update" ON "inventory_requests"
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "inventory_requests_delete" ON "inventory_requests";
CREATE POLICY "inventory_requests_delete" ON "inventory_requests"
    FOR DELETE USING (auth.role() = 'authenticated');

-- 5. Fix View Security (Remove SECURITY DEFINER / Set SECURITY INVOKER)
-- Note: In Postgres, views are SECURITY DEFINER by default if created that way, 
-- or SECURITY INVOKER by default.
-- To force them to enforce RLS of the querying user, we set security_invoker = true.

ALTER VIEW IF EXISTS "employee_performance_metrics" SET (security_invoker = true);
ALTER VIEW IF EXISTS "active_job_assignments" SET (security_invoker = true);

-- Verification
DO $$
BEGIN
    RAISE NOTICE '✅ RLS enabled and policies applied for warehouse_zones, worker_points, points_transactions, inventory_requests';
    RAISE NOTICE '✅ Views updated to use security_invoker = true';
END $$;
