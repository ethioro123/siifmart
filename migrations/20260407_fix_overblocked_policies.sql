-- =============================================================================
-- SIIFMART: FIX OVER-BLOCKED POLICIES
-- =============================================================================
-- 
-- ISSUE: The role-lookup function (get_my_role) couldn't find some employees,
-- causing legitimate reads to be blocked. 
--
-- FIX: All authenticated staff can READ operational data (products, sales, etc.)
-- but WRITE/DELETE restrictions remain role-based.
--
-- System config is readable by all (store name, slogan — not sensitive).
-- =============================================================================


-- =============================================================================
-- STEP 1: FIX get_my_role() — Make it more robust
-- Match on id, email, or case-insensitive email
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
  found_role TEXT;
  user_email TEXT;
BEGIN
  -- Try matching by auth UID first (fastest)
  SELECT role INTO found_role FROM public.employees WHERE id = auth.uid();
  IF found_role IS NOT NULL THEN RETURN found_role; END IF;

  -- Get user's email from auth
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  IF user_email IS NULL THEN RETURN NULL; END IF;

  -- Try exact email match
  SELECT role INTO found_role FROM public.employees WHERE email = user_email LIMIT 1;
  IF found_role IS NOT NULL THEN RETURN found_role; END IF;

  -- Try case-insensitive email match
  SELECT role INTO found_role FROM public.employees WHERE LOWER(email) = LOWER(user_email) LIMIT 1;
  RETURN found_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Same fix for get_auth_role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
BEGIN
  RETURN public.get_my_role();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Fix get_my_site_id too
CREATE OR REPLACE FUNCTION public.get_my_site_id()
RETURNS UUID AS $$
DECLARE
  found_site UUID;
  user_email TEXT;
BEGIN
  SELECT site_id INTO found_site FROM public.employees WHERE id = auth.uid();
  IF found_site IS NOT NULL THEN RETURN found_site; END IF;

  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  IF user_email IS NULL THEN RETURN NULL; END IF;

  SELECT site_id INTO found_site FROM public.employees WHERE email = user_email LIMIT 1;
  IF found_site IS NOT NULL THEN RETURN found_site; END IF;

  SELECT site_id INTO found_site FROM public.employees WHERE LOWER(email) = LOWER(user_email) LIMIT 1;
  RETURN found_site;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;


-- =============================================================================
-- STEP 2: FIX OVER-BLOCKED READ POLICIES
-- All authenticated users need to READ operational data for the app to work.
-- Security is enforced on WRITES and DELETES.
-- =============================================================================

-- ── Products: All staff must read (POS scanning, warehouse picking) ──────────
DROP POLICY IF EXISTS "products_read" ON public.products;
CREATE POLICY "products_read" ON public.products
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

-- ── Sales: All staff must read (receipt lookup, returns) ─────────────────────
DROP POLICY IF EXISTS "sales_read" ON public.sales;
CREATE POLICY "sales_read" ON public.sales
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

-- ── System Config: All staff must read (store name, settings for UI) ─────────
-- This contains non-sensitive display settings, not secrets
DROP POLICY IF EXISTS "config_read" ON public.system_config;
CREATE POLICY "config_read" ON public.system_config
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);


-- =============================================================================
-- DONE
-- =============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Over-blocked policies fixed:';
    RAISE NOTICE '  • get_my_role() now handles ID + email + case-insensitive lookup';
    RAISE NOTICE '  • Products: All staff can READ (writes still restricted)';
    RAISE NOTICE '  • Sales: All staff can READ (deletes still restricted)';
    RAISE NOTICE '  • System Config: All staff can READ (writes still admin-only)';
END $$;
