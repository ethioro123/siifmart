-- products_update RLS referenced auth.users directly (regional-manager branch).
-- The `authenticated` role has no SELECT on auth.users, and Postgres checks table
-- privileges for every relation in a policy at execution start, so EVERY non-CEO
-- product UPDATE (including a branch manager adding received transfer stock) failed with
-- "42501 permission denied for table users", even though that branch never applied.
--
-- Fix: same access rules, but resolve the caller's region through the existing
-- SECURITY DEFINER helper public.get_my_region_code() instead of auth.users.

DROP POLICY IF EXISTS "products_update" ON public.products;
CREATE POLICY "products_update" ON public.products
FOR UPDATE TO authenticated
USING (
    public.is_ceo()
    OR (
        public.is_admin()
        AND site_id IN (SELECT s.id FROM public.sites s WHERE s.country = public.get_my_country_code())
    )
    OR (
        (SELECT public.get_my_role()) = 'regional_manager'
        AND site_id IN (
            SELECT s.id FROM public.sites s
            WHERE s.region_code = (SELECT public.get_my_region_code())
        )
    )
    OR (
        public.is_manager()
        AND (
            site_id::text = (SELECT public.get_my_site_code_or_id())::text
            OR site_id IN (
                SELECT s.id FROM public.sites s
                WHERE s.id::text = (SELECT public.get_my_site_code_or_id())::text
                   OR s.code::text = (SELECT public.get_my_site_code_or_id())::text
            )
        )
    )
);
