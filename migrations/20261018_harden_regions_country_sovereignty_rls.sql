-- ============================================================================
-- Migration: 20261018_harden_regions_country_sovereignty_rls.sql
-- Description:
--   1. Harden Row Level Security on `public.regions` for strict multi-country
--      sovereignty: authenticated read locked to user country (CEO can see all),
--      inserts and updates gated to HQ Executives within their sovereign country
--      (CEO can modify all), and deletions restricted to CEO.
--   2. Drop legacy permissive / public policies on `public.regions` and revoke
--      anon access.
--   3. Ensure `is_ceo()` and `is_hq_executive()` properly handle 'super_admin',
--      'CEO', and 'ceo' roles.
--   4. Add covering index `idx_expenses_region_code` on `public.expenses(region_code)`
--      to optimize foreign key lookups and resolve database performance advisor lint.
-- ============================================================================

-- 1. Ensure helper functions handle CEO and HQ roles consistently
CREATE OR REPLACE FUNCTION public.is_ceo()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN true;
  END IF;

  RETURN (SELECT public.get_my_role()) IN ('super_admin', 'CEO', 'ceo');
END;
$$;

REVOKE ALL ON FUNCTION public.is_ceo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_ceo() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_hq_executive()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN true;
  END IF;

  RETURN (SELECT public.get_my_role()) IN (
    'super_admin',
    'CEO',
    'ceo',
    'operations_manager',
    'finance_manager'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.is_hq_executive() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_hq_executive() TO authenticated, service_role;

-- 2. Enable RLS and clean up legacy policies on regions
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on regions" ON public.regions;
DROP POLICY IF EXISTS "Allow authenticated read on regions" ON public.regions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.regions;
DROP POLICY IF EXISTS "regions_select" ON public.regions;
DROP POLICY IF EXISTS "regions_insert" ON public.regions;
DROP POLICY IF EXISTS "regions_update" ON public.regions;
DROP POLICY IF EXISTS "regions_delete" ON public.regions;

-- 3. Revoke public/anon access, grant authenticated and service_role
REVOKE ALL ON public.regions FROM anon, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.regions TO authenticated;
GRANT ALL ON public.regions TO service_role;

-- 4. Multi-country sovereign RLS policies for regions
-- 4a. Read: CEO can view all regions; authenticated staff only view their country
CREATE POLICY "regions_select" ON public.regions
  FOR SELECT
  TO authenticated
  USING (
    public.is_ceo()
    OR country = (SELECT public.get_my_country_code())
  );

-- 4b. Insert: CEO can insert anywhere; HQ Executives only in their country
CREATE POLICY "regions_insert" ON public.regions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_ceo()
    OR (
      public.is_hq_executive()
      AND country = (SELECT public.get_my_country_code())
    )
  );

-- 4c. Update: CEO can update anywhere; HQ Executives only in their country
CREATE POLICY "regions_update" ON public.regions
  FOR UPDATE
  TO authenticated
  USING (
    public.is_ceo()
    OR (
      public.is_hq_executive()
      AND country = (SELECT public.get_my_country_code())
    )
  )
  WITH CHECK (
    public.is_ceo()
    OR (
      public.is_hq_executive()
      AND country = (SELECT public.get_my_country_code())
    )
  );

-- 4d. Delete: Restricted to CEO
CREATE POLICY "regions_delete" ON public.regions
  FOR DELETE
  TO authenticated
  USING (
    public.is_ceo()
  );

-- 5. Foreign key covering index on expenses(region_code)
CREATE INDEX IF NOT EXISTS idx_expenses_region_code ON public.expenses(region_code);
