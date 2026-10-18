-- Migration: 20261018_align_is_admin_ceo_and_executive_roles.sql
-- Description: Align public.is_admin() to include CEO and Admin roles.
-- Rationale:
-- Previously, public.is_admin() only checked super_admin and departmental managers,
-- omitting 'CEO', 'ceo', and 'admin'. Consequently, CEO and admin users were locked out
-- from modifying system_config (which enforces is_admin() in config_write and config_update RLS)
-- and from viewing system_logs (which enforces is_admin() in logs_read RLS).

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, auth
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN false;
  END IF;

  RETURN lower(coalesce((SELECT public.get_my_role()), '')) IN (
    'super_admin', 'ceo', 'admin',
    'regional_manager', 'operations_manager', 'finance_manager',
    'hr_manager', 'procurement_manager', 'supply_chain_manager'
  );
END;
$$;

-- Secure execution permissions: allow authenticated users and service_role
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
