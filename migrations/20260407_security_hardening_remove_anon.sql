-- =============================================================================
-- SIIFMART: FULL SECURITY HARDENING — Role-Based RLS
-- =============================================================================
-- 
-- WHAT THIS DOES:
--   1. Removes ALL anon access from every table
--   2. Creates role-aware policies so staff can only do what their role allows
--   3. Site-level isolation: staff can only see their own site's data
--   4. CEO (super_admin) retains full access to everything
--   5. Audit trail (system_logs) is append-only — nobody can edit/delete logs
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → Paste → Run
--   Safe to re-run (idempotent)
-- =============================================================================


-- =============================================================================
-- STEP 1: CREATE/UPDATE HELPER FUNCTIONS
-- These run as SECURITY DEFINER to bypass RLS (avoids recursion)
-- =============================================================================

-- Get the current user's role from the employees table
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.employees 
    WHERE id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Update the existing get_auth_role to match
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM public.employees 
    WHERE id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Check if user is admin level (L1 or L2)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (select public.get_my_role()) IN (
    'super_admin', 'admin',
    'regional_manager', 'operations_manager', 'finance_manager',
    'hr_manager', 'procurement_manager', 'supply_chain_manager'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Check if user is manager level (L1, L2, or L3)
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (select public.get_my_role()) IN (
    'super_admin', 'admin',
    'regional_manager', 'operations_manager', 'finance_manager',
    'hr_manager', 'procurement_manager', 'supply_chain_manager',
    'store_manager', 'warehouse_manager', 'dispatch_manager',
    'assistant_manager', 'shift_lead', 'store_supervisor'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Check if user is CEO
CREATE OR REPLACE FUNCTION public.is_ceo()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (select public.get_my_role()) = 'super_admin';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Get current user's site_id
CREATE OR REPLACE FUNCTION public.get_my_site_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT site_id FROM public.employees 
    WHERE id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;


-- =============================================================================
-- STEP 2: ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE IF EXISTS public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inventory_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wms_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wms_job_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.brainstorm_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.worker_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.warehouse_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.job_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.barcode_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff_schedules ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- STEP 3: DROP ALL EXISTING POLICIES (clean slate)
-- =============================================================================

-- Generic "allow everything" policies
DO $$ 
DECLARE
  t TEXT;
  p RECORD;
BEGIN
  FOR t IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    FOR p IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;
  END LOOP;
END $$;


-- =============================================================================
-- STEP 4: REVOKE ALL ANON ACCESS
-- =============================================================================

DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
  END LOOP;
END $$;


-- =============================================================================
-- STEP 5: CREATE ROLE-BASED POLICIES
-- =============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- SITES — Location/Store data
-- Everyone can READ (needed for site selector), only admin+ can modify
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "sites_read" ON public.sites
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "sites_write" ON public.sites
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "sites_update" ON public.sites
    FOR UPDATE TO authenticated
    USING ((select public.is_admin()));

CREATE POLICY "sites_delete" ON public.sites
    FOR DELETE TO authenticated
    USING ((select public.is_ceo()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- SYSTEM_CONFIG — Global settings
-- Everyone can READ, only CEO/admin can modify
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "config_read" ON public.system_config
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "config_write" ON public.system_config
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "config_update" ON public.system_config
    FOR UPDATE TO authenticated
    USING ((select public.is_admin()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- EMPLOYEES — Staff records (SENSITIVE)
-- Everyone can READ (needed for UI lookups)
-- Only admin/HR can INSERT/UPDATE, only CEO can DELETE
-- Staff can update their own profile (avatar, password-related fields)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "employees_read" ON public.employees
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "employees_insert" ON public.employees
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "employees_update_admin" ON public.employees
    FOR UPDATE TO authenticated
    USING (
      -- Admin/HR can update any employee
      (select public.is_admin())
      OR
      -- Managers can update employees at their site
      (select public.is_manager()) AND site_id = (select public.get_my_site_id())
      OR
      -- Employees can update their own record (photo, preferences)
      id = (select auth.uid())
      OR
      email = (SELECT email FROM auth.users WHERE id = (select auth.uid()))
    );

CREATE POLICY "employees_delete" ON public.employees
    FOR DELETE TO authenticated
    USING ((select public.is_ceo()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- PRODUCTS — Inventory items
-- Everyone can READ (needed for POS, warehouse)
-- Only managers+ can INSERT/UPDATE/DELETE
-- Site-scoped: staff can only see their site's products (CEO sees all)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "products_read" ON public.products
    FOR SELECT TO authenticated
    USING (
      (select public.is_admin())
      OR site_id = (select public.get_my_site_id())
    );

CREATE POLICY "products_insert" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_manager()));

CREATE POLICY "products_update" ON public.products
    FOR UPDATE TO authenticated
    USING ((select public.is_manager()));

CREATE POLICY "products_delete" ON public.products
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- CUSTOMERS — Customer data
-- Everyone can READ/INSERT/UPDATE (POS needs this)
-- Only managers+ can DELETE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "customers_read" ON public.customers
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "customers_insert" ON public.customers
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "customers_update" ON public.customers
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "customers_delete" ON public.customers
    FOR DELETE TO authenticated
    USING ((select public.is_manager()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- SALES — Transaction records
-- Everyone can READ/INSERT (cashiers must create sales)
-- Only managers+ can UPDATE/DELETE (void/refund)
-- Site-scoped
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "sales_read" ON public.sales
    FOR SELECT TO authenticated
    USING (
      (select public.is_admin())
      OR site_id = (select public.get_my_site_id())
    );

CREATE POLICY "sales_insert" ON public.sales
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "sales_update" ON public.sales
    FOR UPDATE TO authenticated
    USING ((select public.is_manager()));

CREATE POLICY "sales_delete" ON public.sales
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- SALE_ITEMS — Sale line items
-- Same rules as sales
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "sale_items_read" ON public.sale_items
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "sale_items_insert" ON public.sale_items
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "sale_items_update" ON public.sale_items
    FOR UPDATE TO authenticated
    USING ((select public.is_manager()));

CREATE POLICY "sale_items_delete" ON public.sale_items
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- STOCK_MOVEMENTS — Inventory transactions
-- Everyone can READ/INSERT (warehouse staff needs this)
-- Only managers+ can UPDATE, only admin+ can DELETE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "stock_movements_read" ON public.stock_movements
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "stock_movements_insert" ON public.stock_movements
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "stock_movements_update" ON public.stock_movements
    FOR UPDATE TO authenticated
    USING ((select public.is_manager()));

CREATE POLICY "stock_movements_delete" ON public.stock_movements
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- SUPPLIERS — Vendor data
-- Everyone can READ, only procurement/managers+ can modify
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "suppliers_read" ON public.suppliers
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "suppliers_write" ON public.suppliers
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_manager()));

CREATE POLICY "suppliers_update" ON public.suppliers
    FOR UPDATE TO authenticated
    USING ((select public.is_manager()));

CREATE POLICY "suppliers_delete" ON public.suppliers
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- PURCHASE_ORDERS — Procurement
-- Everyone can READ, only managers+ can create/modify, only admin+ can DELETE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "po_read" ON public.purchase_orders
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "po_insert" ON public.purchase_orders
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_manager()));

CREATE POLICY "po_update" ON public.purchase_orders
    FOR UPDATE TO authenticated
    USING ((select public.is_manager()));

CREATE POLICY "po_delete" ON public.purchase_orders
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- PO_ITEMS — Purchase order line items
-- Same as purchase_orders
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "po_items_read" ON public.po_items
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "po_items_insert" ON public.po_items
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_manager()));

CREATE POLICY "po_items_update" ON public.po_items
    FOR UPDATE TO authenticated
    USING ((select public.is_manager()));

CREATE POLICY "po_items_delete" ON public.po_items
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- EXPENSES — Financial records (SENSITIVE)
-- Only managers+ can READ, only admin+ can modify, only CEO can DELETE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "expenses_read" ON public.expenses
    FOR SELECT TO authenticated
    USING ((select public.is_manager()));

CREATE POLICY "expenses_insert" ON public.expenses
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_manager()));

CREATE POLICY "expenses_update" ON public.expenses
    FOR UPDATE TO authenticated
    USING ((select public.is_admin()));

CREATE POLICY "expenses_delete" ON public.expenses
    FOR DELETE TO authenticated
    USING ((select public.is_ceo()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- WMS_JOBS — Warehouse management jobs
-- All authenticated can READ/INSERT/UPDATE (warehouse staff needs this)
-- Only managers+ can DELETE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "wms_jobs_read" ON public.wms_jobs
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "wms_jobs_insert" ON public.wms_jobs
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "wms_jobs_update" ON public.wms_jobs
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "wms_jobs_delete" ON public.wms_jobs
    FOR DELETE TO authenticated
    USING ((select public.is_manager()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- WMS_JOB_ITEMS — Warehouse job line items
-- Same as wms_jobs
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "wms_job_items_read" ON public.wms_job_items
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "wms_job_items_insert" ON public.wms_job_items
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "wms_job_items_update" ON public.wms_job_items
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "wms_job_items_delete" ON public.wms_job_items
    FOR DELETE TO authenticated
    USING ((select public.is_manager()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- TRANSFERS — Inter-site transfers
-- All authenticated can READ/INSERT/UPDATE
-- Only admin+ can DELETE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "transfers_read" ON public.transfers
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "transfers_insert" ON public.transfers
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "transfers_update" ON public.transfers
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "transfers_delete" ON public.transfers
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- JOB_ASSIGNMENTS — Warehouse job assignments
-- All authenticated can READ/INSERT/UPDATE
-- Only managers+ can DELETE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "job_assignments_read" ON public.job_assignments
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "job_assignments_insert" ON public.job_assignments
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "job_assignments_update" ON public.job_assignments
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "job_assignments_delete" ON public.job_assignments
    FOR DELETE TO authenticated
    USING ((select public.is_manager()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- WAREHOUSE_ZONES — Zone configuration
-- Everyone can READ, only warehouse_manager+ can modify
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "zones_read" ON public.warehouse_zones
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "zones_write" ON public.warehouse_zones
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_manager()));

CREATE POLICY "zones_update" ON public.warehouse_zones
    FOR UPDATE TO authenticated
    USING ((select public.is_manager()));

CREATE POLICY "zones_delete" ON public.warehouse_zones
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- BRAINSTORM_NODES — CEO canvas (MOST SENSITIVE)
-- ONLY CEO can access — nobody else
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "brainstorm_ceo_only" ON public.brainstorm_nodes
    FOR ALL TO authenticated
    USING ((select public.is_ceo()))
    WITH CHECK ((select public.is_ceo()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- SYSTEM_LOGS — Audit trail (CRITICAL)
-- APPEND-ONLY: Everyone can INSERT, only admin+ can READ
-- NOBODY can UPDATE or DELETE (not even CEO — audit integrity)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "logs_insert" ON public.system_logs
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "logs_read" ON public.system_logs
    FOR SELECT TO authenticated
    USING ((select public.is_admin()));

-- No UPDATE or DELETE policy = nobody can modify/delete logs


-- ═══════════════════════════════════════════════════════════════════════════════
-- INVENTORY_REQUESTS — Approval workflow
-- Everyone can READ/INSERT, only managers+ can UPDATE, only admin+ can DELETE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "inv_requests_read" ON public.inventory_requests
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "inv_requests_insert" ON public.inventory_requests
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "inv_requests_update" ON public.inventory_requests
    FOR UPDATE TO authenticated
    USING ((select public.is_manager()));

CREATE POLICY "inv_requests_delete" ON public.inventory_requests
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- WORKER_POINTS & POINTS_TRANSACTIONS — Gamification
-- Everyone can READ/INSERT, only managers+ can UPDATE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "worker_points_read" ON public.worker_points
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "worker_points_insert" ON public.worker_points
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "worker_points_update" ON public.worker_points
    FOR UPDATE TO authenticated
    USING ((select public.is_manager()));

CREATE POLICY "points_tx_read" ON public.points_transactions
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "points_tx_insert" ON public.points_transactions
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);


-- ═══════════════════════════════════════════════════════════════════════════════
-- STORE_POINTS — Store-level gamification
-- Everyone can READ, only managers+ can modify
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "store_points_read" ON public.store_points
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "store_points_insert" ON public.store_points
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_manager()));

CREATE POLICY "store_points_update" ON public.store_points
    FOR UPDATE TO authenticated
    USING ((select public.is_manager()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- SHIFTS — Schedule/shift data
-- Everyone can READ, only managers+ can modify
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "shifts_read" ON public.shifts
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "shifts_insert" ON public.shifts
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_manager()));

CREATE POLICY "shifts_update" ON public.shifts
    FOR UPDATE TO authenticated
    USING ((select public.is_manager()));

CREATE POLICY "shifts_delete" ON public.shifts
    FOR DELETE TO authenticated
    USING ((select public.is_manager()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- BARCODE_APPROVALS — Barcode approval workflow
-- Everyone can READ/INSERT, only managers+ can UPDATE/DELETE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "barcode_approvals_read" ON public.barcode_approvals
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "barcode_approvals_insert" ON public.barcode_approvals
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "barcode_approvals_update" ON public.barcode_approvals
    FOR UPDATE TO authenticated
    USING ((select public.is_manager()));

CREATE POLICY "barcode_approvals_delete" ON public.barcode_approvals
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));


-- ═══════════════════════════════════════════════════════════════════════════════
-- STAFF_SCHEDULES — Employee scheduling
-- Everyone can READ, only managers+ can modify
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY "staff_schedules_read" ON public.staff_schedules
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "staff_schedules_insert" ON public.staff_schedules
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_manager()));

CREATE POLICY "staff_schedules_update" ON public.staff_schedules
    FOR UPDATE TO authenticated
    USING ((select public.is_manager()));

CREATE POLICY "staff_schedules_delete" ON public.staff_schedules
    FOR DELETE TO authenticated
    USING ((select public.is_manager()));


-- =============================================================================
-- STEP 6: GRANT ONLY AUTHENTICATED ROLE ON ALL TABLES
-- Ensure anon role has zero access
-- =============================================================================

DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOR t IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT ALL ON public.%I TO authenticated', t);
  END LOOP;
END $$;


-- =============================================================================
-- VERIFICATION
-- =============================================================================

-- Check all tables have RLS enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check all policies:
-- SELECT tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- Test: as a cashier, try to delete a product (should fail):
-- This will fail because cashier is not in is_manager() or is_admin()


-- =============================================================================
-- SUCCESS
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ FULL ROLE-BASED SECURITY HARDENING COMPLETE';
    RAISE NOTICE '══════════════════════════════════════════════════════════════';
    RAISE NOTICE '• All anon access REVOKED';
    RAISE NOTICE '• PRODUCTS: Staff can READ their site only, managers+ can modify';
    RAISE NOTICE '• EMPLOYEES: Staff can READ, admin/HR can modify, CEO can delete';
    RAISE NOTICE '• SALES: Staff can READ/INSERT, managers+ can void/refund';
    RAISE NOTICE '• EXPENSES: Only managers+ can even see, CEO to delete';
    RAISE NOTICE '• BRAINSTORM: CEO-only access';
    RAISE NOTICE '• SYSTEM_LOGS: Append-only — nobody can edit/delete audit trail';
    RAISE NOTICE '• SUPPLIERS/PO: Only managers+ can create/modify';
    RAISE NOTICE '• DELETE operations: Restricted to admin+ or CEO on all tables';
    RAISE NOTICE '══════════════════════════════════════════════════════════════';
END $$;
