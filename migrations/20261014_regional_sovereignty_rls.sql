-- ============================================================================
-- Migration: 20261014_regional_sovereignty_rls.sql
-- Description: Enforce regional partition integrity, composite indexes, and territorial RLS isolation
-- Author: SIIFMART Architecture Team
-- Rule 9 compliant: Saved to migrations and provided runnable in-chat
-- ============================================================================

-- Step 1: Composite Performance Indexes for High-Velocity Territorial Queries
CREATE INDEX IF NOT EXISTS idx_employees_scope_region 
  ON public.employees (scope_level, region_code);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_region_status 
  ON public.purchase_orders (region_code, status);

CREATE INDEX IF NOT EXISTS idx_transfers_source_dest_region 
  ON public.transfers (source_region_code, dest_region_code);

CREATE INDEX IF NOT EXISTS idx_inventory_requests_region_status 
  ON public.inventory_requests (region_code, status);

-- Step 2: Territorial RLS Isolation for Workforce Records
-- HQ executives, corporate HR, and nationwide staff (scope_level = 'HQ') can access all country personnel.
-- Regional managers & regional leads (scope_level = 'REGIONAL') are strictly constrained to their territory.
DROP POLICY IF EXISTS "employees_read" ON public.employees;

CREATE POLICY "employees_read" ON public.employees
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND (
    COALESCE(auth.jwt() ->> 'scope_level', 'HQ') = 'HQ'
    OR region_code = (auth.jwt() ->> 'region_code')
    OR region_code IS NULL
  )
);
