-- Break recursive RLS evaluation in session profile lookups.
-- These helpers only look up the caller identified by auth.uid()/auth.jwt().
-- SECURITY DEFINER lets their read bypass employees RLS while the policies
-- invoking them continue to enforce row access. Keep a fixed search_path and
-- restrict direct execution to authenticated callers and service_role.

BEGIN;

ALTER FUNCTION public.get_my_role()
  SECURITY DEFINER
  SET search_path = pg_catalog, public, auth;
REVOKE ALL ON FUNCTION public.get_my_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, service_role;

ALTER FUNCTION public.get_my_site_id()
  SECURITY DEFINER
  SET search_path = pg_catalog, public, auth;
REVOKE ALL ON FUNCTION public.get_my_site_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_site_id() TO authenticated, service_role;

ALTER FUNCTION public.get_my_country_code()
  SECURITY DEFINER
  SET search_path = pg_catalog, public, auth;
REVOKE ALL ON FUNCTION public.get_my_country_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_country_code() TO authenticated, service_role;

COMMIT;
