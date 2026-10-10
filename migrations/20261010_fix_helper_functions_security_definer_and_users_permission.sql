-- ============================================================================
-- Migration: 20261010_fix_helper_functions_security_definer_and_users_permission.sql
-- Description:
-- 1. Sets core session helper functions (get_my_role, get_my_country_code, etc.)
--    to SECURITY INVOKER with immutable search_path = public, pg_temp.
-- 2. Completely removes references to auth.users (which blocked 'authenticated' role with 42501).
--    Uses (auth.jwt() ->> 'email') directly from the JWT session.
-- 3. Revokes execution from anon/PUBLIC and grants strictly to authenticated and service_role.
-- ============================================================================

-- 1. get_my_role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role TEXT;
  v_uid UUID;
  v_email TEXT;
BEGIN
  -- Fast path 0: Custom role claim in JWT if populated
  v_role := (select auth.jwt() ->> 'role');
  IF v_role IS NOT NULL AND v_role <> '' AND v_role NOT IN ('authenticated', 'anon', 'service_role') THEN
    RETURN v_role;
  END IF;

  v_uid := (select auth.uid());
  v_email := (select auth.jwt() ->> 'email');

  IF v_uid IS NULL AND v_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Fast path 1: Primary Key / UUID index seek (< 0.05ms)
  IF v_uid IS NOT NULL THEN
    SELECT role INTO v_role 
    FROM public.employees 
    WHERE id = v_uid
    LIMIT 1;

    IF v_role IS NOT NULL THEN
      RETURN v_role;
    END IF;
  END IF;

  -- Fast path 2: Direct JWT session email lookup (0ms DB overhead)
  IF v_email IS NOT NULL AND v_email <> '' THEN
    SELECT role INTO v_role 
    FROM public.employees 
    WHERE LOWER(email) = LOWER(v_email)
    LIMIT 1;

    IF v_role IS NOT NULL THEN
      RETURN v_role;
    END IF;
  END IF;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, service_role;


-- 2. get_my_country_code
CREATE OR REPLACE FUNCTION public.get_my_country_code()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid text;
  v_email text;
  v_country text;
BEGIN
  v_uid := (select auth.uid())::text;
  v_email := (select auth.jwt() ->> 'email');
  
  IF v_uid IS NULL AND v_email IS NULL THEN
    RETURN 'ET';
  END IF;

  SELECT COALESCE(s.country, 'ET') INTO v_country
  FROM public.employees e
  LEFT JOIN public.sites s ON (s.id::text = e.site_id::text OR s.code::text = e.site_id::text)
  WHERE (v_uid IS NOT NULL AND e.id::text = v_uid)
     OR (v_email IS NOT NULL AND LOWER(e.email) = LOWER(v_email))
  LIMIT 1;

  RETURN COALESCE(v_country, 'ET');
EXCEPTION WHEN OTHERS THEN
  RETURN 'ET';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_country_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_country_code() TO authenticated, service_role;


-- 3. get_my_site_id
CREATE OR REPLACE FUNCTION public.get_my_site_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_site_id UUID;
  v_uid UUID;
  v_email TEXT;
BEGIN
  v_uid := (select auth.uid());
  v_email := (select auth.jwt() ->> 'email');

  IF v_uid IS NULL AND v_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Fast path 1: Primary Key / ID seek
  IF v_uid IS NOT NULL THEN
    SELECT site_id::UUID INTO v_site_id 
    FROM public.employees 
    WHERE id::TEXT = v_uid::TEXT
    LIMIT 1;

    IF v_site_id IS NOT NULL THEN
      RETURN v_site_id;
    END IF;
  END IF;

  -- Fast path 2: Direct JWT session email lookup
  IF v_email IS NOT NULL AND v_email <> '' THEN
    SELECT site_id::UUID INTO v_site_id 
    FROM public.employees 
    WHERE LOWER(email) = LOWER(v_email)
    LIMIT 1;

    IF v_site_id IS NOT NULL THEN
      RETURN v_site_id;
    END IF;
  END IF;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_site_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_site_id() TO authenticated, service_role;


-- 4. get_my_country
CREATE OR REPLACE FUNCTION public.get_my_country()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_country TEXT;
  v_site_id UUID;
BEGIN
  v_site_id := public.get_my_site_id();
  IF v_site_id IS NOT NULL THEN
    SELECT country INTO v_country FROM public.sites WHERE id = v_site_id LIMIT 1;
    IF v_country IS NOT NULL AND v_country <> '' THEN
      RETURN v_country;
    END IF;
  END IF;
  RETURN 'ET';
EXCEPTION WHEN OTHERS THEN
  RETURN 'ET';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_country() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_country() TO authenticated, service_role;


-- 5. get_my_employee_id
CREATE OR REPLACE FUNCTION public.get_my_employee_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid uuid;
  v_email text;
  v_id uuid;
BEGIN
  v_uid := (select auth.uid());
  v_email := (select auth.jwt() ->> 'email');

  IF v_uid IS NULL AND v_email IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT e.id INTO v_id
  FROM public.employees e
  WHERE (v_uid IS NOT NULL AND e.id = v_uid)
     OR (v_email IS NOT NULL AND LOWER(e.email) = LOWER(v_email))
  LIMIT 1;

  RETURN v_id;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_employee_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_employee_id() TO authenticated, service_role;


-- 6. get_my_employee_code
CREATE OR REPLACE FUNCTION public.get_my_employee_code()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid text;
  v_email text;
  v_code text;
BEGIN
  v_uid := (select auth.uid())::text;
  v_email := (select auth.jwt() ->> 'email');

  IF v_uid IS NULL AND v_email IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT e.code INTO v_code
  FROM public.employees e
  WHERE (v_uid IS NOT NULL AND e.id::text = v_uid)
     OR (v_email IS NOT NULL AND LOWER(e.email) = LOWER(v_email))
  LIMIT 1;

  RETURN v_code;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_employee_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_employee_code() TO authenticated, service_role;


-- 7. get_my_site_code_or_id
CREATE OR REPLACE FUNCTION public.get_my_site_code_or_id()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid text;
  v_email text;
  v_site text;
BEGIN
  v_uid := (select auth.uid())::text;
  v_email := (select auth.jwt() ->> 'email');

  IF v_uid IS NULL AND v_email IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT e.site_id::text INTO v_site
  FROM public.employees e
  WHERE (v_uid IS NOT NULL AND e.id::text = v_uid)
     OR (v_email IS NOT NULL AND LOWER(e.email) = LOWER(v_email))
  LIMIT 1;

  RETURN v_site;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_site_code_or_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_site_code_or_id() TO authenticated, service_role;


-- 8. is_admin, is_ceo, is_manager, get_auth_role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (SELECT public.get_my_role()) IN (
    'super_admin',
    'regional_manager', 'operations_manager', 'finance_manager',
    'hr_manager', 'procurement_manager', 'supply_chain_manager'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;


CREATE OR REPLACE FUNCTION public.is_ceo()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (SELECT public.get_my_role()) = 'super_admin';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_ceo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_ceo() TO authenticated, service_role;


CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (SELECT public.get_my_role()) IN (
    'super_admin', 'admin', 'CEO',
    'regional_manager', 'operations_manager', 'finance_manager',
    'hr_manager', 'procurement_manager', 'supply_chain_manager',
    'store_manager', 'warehouse_manager', 'dispatch_manager',
    'assistant_manager', 'shift_lead', 'store_supervisor',
    'fleet_maintenance_supervisor', 'corporate_merchandising_manager',
    'inventory_manager', 'logistics_manager'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_manager() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated, service_role;


CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public.get_my_role();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_auth_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated, service_role;


-- 9. enforce_inventory_requests_zero_trust (Remove auth.users dependency)
CREATE OR REPLACE FUNCTION public.enforce_inventory_requests_zero_trust()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    current_user_name TEXT;
    current_user_email TEXT;
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
        IF NOT (public.is_ceo() OR public.is_admin()) THEN
            RAISE EXCEPTION 'Zero-Trust Security Violation: Only Central HQ leadership can approve inventory adjustments.';
        END IF;

        SELECT name, email INTO current_user_name, current_user_email
        FROM public.employees
        WHERE id::text = (SELECT auth.uid())::text 
           OR LOWER(email) = LOWER(COALESCE((SELECT auth.jwt() ->> 'email'), ''))
        LIMIT 1;

        IF (OLD.requested_by IS NOT NULL AND OLD.requested_by <> '') THEN
            IF LOWER(OLD.requested_by) = LOWER(COALESCE(current_user_name, ''))
               OR LOWER(OLD.requested_by) = LOWER(COALESCE(current_user_email, ''))
               OR LOWER(OLD.requested_by) = LOWER(COALESCE(NEW.approved_by, '')) THEN
                RAISE EXCEPTION 'Zero-Trust 4-Eyes Principle Violation: Requesters cannot approve their own inventory adjustments.';
            END IF;
        END IF;

        NEW.approved_at = NOW();
    END IF;

    RETURN NEW;
END;
$$;
