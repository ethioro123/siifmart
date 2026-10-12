-- ============================================================================
-- Migration: 20261012_regions_rls_policies.sql
-- Description: Adds administrative write/update/delete RLS policies to regions table
-- ============================================================================

-- Drop if previously attempted
DROP POLICY IF EXISTS "regions_insert" ON regions;
DROP POLICY IF EXISTS "regions_update" ON regions;
DROP POLICY IF EXISTS "regions_delete" ON regions;

-- Ensure authenticated admin can insert new regions
CREATE POLICY "regions_insert" ON regions
  FOR INSERT
  WITH CHECK (is_admin());

-- Ensure authenticated admin can update existing regions (budgets, hubs, managers)
CREATE POLICY "regions_update" ON regions
  FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Only CEO can delete/archive a region
CREATE POLICY "regions_delete" ON regions
  FOR DELETE
  USING (is_ceo());
