-- ============================================================================
-- Migration: 20261013_fix_region_governance_security.sql
-- Description: Zero-Trust Governance Fix: Restricts region budget, limit,
--              status, hub, and manager updates strictly to HQ Executives.
--              Regional managers cannot modify their own region's limits or budgets.
-- ============================================================================

-- 1. Helper function: check if caller is an HQ Executive with governance authority
CREATE OR REPLACE FUNCTION public.is_hq_executive()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT public.get_my_role()) IN (
    'super_admin',
    'CEO',
    'ceo',
    'operations_manager',
    'finance_manager'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_hq_executive() TO authenticated;

-- 2. Restrict region updates to HQ Executives only
DROP POLICY IF EXISTS "regions_update" ON regions;
CREATE POLICY "regions_update" ON regions
  FOR UPDATE
  TO authenticated
  USING (public.is_hq_executive())
  WITH CHECK (public.is_hq_executive());

-- 3. Ensure region inserts are also restricted to HQ Executives
DROP POLICY IF EXISTS "regions_insert" ON regions;
CREATE POLICY "regions_insert" ON regions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_hq_executive());
