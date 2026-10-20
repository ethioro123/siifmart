-- ==============================================================================
-- Migration: 20261021_regional_roles_is_manager_and_products_scope.sql
-- Description: Upgrade public.is_manager() and products RLS policies so regional
--              administration leads (regional_procurement_lead, regional_manager,
--              regional_logistics_lead, etc.) have full catalog visibility
--              across their assigned territorial facilities.
-- Environment: supabase-staging (and production)
-- ==============================================================================

-- 1. Upgrade public.is_manager()
CREATE OR REPLACE FUNCTION public.is_manager()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN (SELECT public.get_my_role()) IN (
    'super_admin', 'admin', 'CEO',
    'regional_manager', 'operations_manager', 'finance_manager',
    'hr_manager', 'procurement_manager', 'supply_chain_manager',
    'regional_procurement_lead', 'regional_finance_officer', 'regional_hr_officer',
    'regional_logistics_lead', 'regional_security_supervisor', 'regional_merchandising_lead',
    'buyer', 'store_manager', 'warehouse_manager', 'dispatch_manager',
    'assistant_manager', 'shift_lead', 'store_supervisor',
    'fleet_maintenance_supervisor', 'corporate_merchandising_manager',
    'merchandising_manager', 'inventory_manager', 'logistics_manager'
  );
END;
$function$;

-- 2. Upgrade public.normalize_role() to include regional title aliases
CREATE OR REPLACE FUNCTION public.normalize_role(p_role text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
  SELECT CASE lower(trim(coalesce(p_role, '')))
    WHEN 'country_managing_director' THEN 'admin'
    WHEN 'head_of_operations' THEN 'operations_manager'
    WHEN 'operations_head' THEN 'operations_manager'
    WHEN 'head_of_finance' THEN 'finance_manager'
    WHEN 'finance_head' THEN 'finance_manager'
    WHEN 'head_of_procurement' THEN 'procurement_manager'
    WHEN 'procurement_head' THEN 'procurement_manager'
    WHEN 'head_of_hr' THEN 'hr_manager'
    WHEN 'hr_head' THEN 'hr_manager'
    WHEN 'head_of_supply_chain' THEN 'supply_chain_manager'
    WHEN 'supply_chain_head' THEN 'supply_chain_manager'
    WHEN 'head_of_merchandising' THEN 'merchandising_manager'
    WHEN 'merchandising_head' THEN 'merchandising_manager'
    WHEN 'head_of_it' THEN 'it_manager'
    WHEN 'it_head' THEN 'it_manager'
    WHEN 'head_of_audit' THEN 'auditor'
    WHEN 'audit_head' THEN 'auditor'
    -- Regional title aliases
    WHEN 'regional_operations_director' THEN 'regional_manager'
    WHEN 'regional_director' THEN 'regional_manager'
    WHEN 'regional_procurement_manager' THEN 'regional_procurement_lead'
    WHEN 'regional_finance_manager' THEN 'regional_finance_officer'
    WHEN 'regional_hr_manager' THEN 'regional_hr_officer'
    WHEN 'regional_logistics_manager' THEN 'regional_logistics_lead'
    WHEN 'regional_security_manager' THEN 'regional_security_supervisor'
    ELSE lower(trim(coalesce(p_role, '')))
  END;
$function$;

-- 3. Upgrade products_read_scoped policy
DROP POLICY IF EXISTS products_read_scoped ON public.products;

CREATE POLICY products_read_scoped ON public.products
  FOR SELECT TO authenticated
  USING (
    site_id IS NOT NULL AND (
      is_ceo()
      OR is_admin()
      OR is_site_in_my_authorized_scope(site_id::text, NULL)
      OR EXISTS (
        SELECT 1 FROM public.sites s
        WHERE s.id = products.site_id
          AND upper(s.country) = upper(get_my_country_code())
          AND (is_manager() OR s.id = get_my_site_id())
      )
    )
  );
