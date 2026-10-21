-- Migration: Upgrade Regional Security Supervisor scope, shift audit access, and system logs visibility
-- Applied to supabase-staging per Rule 9

-- 1. Upgrade is_site_in_my_authorized_scope() to include regional_security_supervisor and regional_merchandising_lead
CREATE OR REPLACE FUNCTION public.is_site_in_my_authorized_scope(p_site_id text, p_country_code text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees actor
    LEFT JOIN public.sites actor_site ON actor_site.id = actor.site_id
    JOIN public.sites target_site
      ON target_site.id::text = p_site_id OR target_site.code = p_site_id
    WHERE actor.id = auth.uid()
      AND COALESCE(lower(actor.status), 'active') = 'active'
      AND (p_country_code IS NULL OR upper(p_country_code) = upper(target_site.country))
      AND (
        lower(actor.role) IN ('super_admin','ceo')
        OR (
          upper(actor_site.country) = upper(target_site.country)
          AND (
            (public.normalize_role(actor.role) IN (
              'admin','operations_manager','finance_manager','procurement_manager',
              'hr_manager','supply_chain_manager','inventory_manager','logistics_manager',
              'auditor','regional_manager','regional_procurement_lead',
              'regional_finance_officer','regional_hr_officer','regional_logistics_lead',
              'regional_security_supervisor','regional_merchandising_lead')
             AND (lower(actor.role) NOT LIKE 'regional_%' OR actor.region_code = target_site.region_code))
            OR actor.site_id = target_site.id
          )
        )
      )
  );
$function$;

-- 2. Upgrade shifts select and update policies to grant Regional Security Supervisors auditing authority
DROP POLICY IF EXISTS shifts_select_policy ON public.shifts;
CREATE POLICY shifts_select_policy ON public.shifts
FOR SELECT TO authenticated
USING (
  is_ceo()
  OR (
    upper(country_code::text) = upper(get_my_country_code())
    AND (
      is_admin()
      OR normalize_role(get_my_role()) = ANY (ARRAY[
        'super_admin', 'ceo', 'admin', 'finance_manager', 'auditor', 'operations_manager',
        'regional_manager', 'regional_finance_officer', 'regional_security_supervisor',
        'store_manager', 'head_of_audit', 'audit_head', 'store_operations_auditor'
      ])
      OR is_site_in_my_authorized_scope(site_id::text, country_code::text)
      OR cashier_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS shifts_update_policy ON public.shifts;
CREATE POLICY shifts_update_policy ON public.shifts
FOR UPDATE TO authenticated
USING (
  is_ceo()
  OR (
    upper(country_code::text) = upper(get_my_country_code())
    AND (
      is_admin()
      OR normalize_role(get_my_role()) = ANY (ARRAY[
        'super_admin', 'ceo', 'admin', 'finance_manager', 'auditor', 'operations_manager',
        'regional_manager', 'regional_finance_officer', 'regional_security_supervisor',
        'store_manager'
      ])
      OR is_site_in_my_authorized_scope(site_id::text, country_code::text)
      OR cashier_id = auth.uid()
    )
  )
);

-- 3. Upgrade system_logs read policy for Regional Security and Internal Audit
DROP POLICY IF EXISTS logs_read ON public.system_logs;
CREATE POLICY logs_read ON public.system_logs
FOR SELECT TO authenticated
USING (
  is_ceo()
  OR (
    upper(COALESCE(country_code, '')) = upper(get_my_country_code())
    AND (
      is_admin()
      OR normalize_role(get_my_role()) = ANY (ARRAY[
        'auditor', 'head_of_audit', 'audit_head',
        'regional_security_supervisor', 'security_manager',
        'head_of_it', 'it_head', 'it_support'
      ])
      OR is_site_in_my_authorized_scope(site_id, country_code)
    )
  )
);
