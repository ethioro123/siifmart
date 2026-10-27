-- ============================================================================
-- Migration: 20261028_cs_manager_rls_alignment.sql
-- Purpose: 7-Layer Audit & RLS Alignment for Customer Service Manager (cs_manager)
-- ============================================================================

BEGIN;

-- 1. Align private.hr_site_scope so cs_manager at HQ or Regional Administration
--    can read employee rosters within their authorized scope
CREATE OR REPLACE FUNCTION private.hr_site_scope(p_site_id text, p_country_code text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT public.is_site_in_my_authorized_scope(p_site_id, p_country_code)
    OR EXISTS (
      SELECT 1
      FROM public.employees actor
      JOIN public.sites home ON home.id = actor.site_id
      JOIN public.sites target ON target.id::text = p_site_id OR target.code = p_site_id
      WHERE actor.id = (SELECT auth.uid())
        AND COALESCE(lower(actor.status), 'active') = 'active'
        AND lower(actor.role) IN (
          'talent_recruiter',
          'training_coordinator',
          'payroll_specialist',
          'hr_generalist',
          'it_support',
          'auditor',
          'store_operations_auditor',
          'country_compliance_manager',
          'vendor_relations_manager',
          'cs_manager'
        )
        AND home.type = 'Administration'
        AND upper(home.country) = upper(target.country)
        AND (p_country_code IS NULL OR upper(p_country_code) = upper(target.country))
        AND (
          (home.code = upper(home.country) || '-HQ'
            AND home.region_code IS NULL AND actor.region_code IS NULL)
          OR (COALESCE(actor.region_code, home.region_code) IS NOT NULL
            AND lower(target.region_code) = lower(COALESCE(actor.region_code, home.region_code)))
        )
    );
$function$;

-- 2. Align public.employees INSERT & UPDATE policies to include cs_manager
DROP POLICY IF EXISTS employees_insert ON public.employees;
CREATE POLICY employees_insert ON public.employees
FOR INSERT
TO authenticated
WITH CHECK (
  (public.get_my_role() = ANY (ARRAY[
    'group_ceo'::text,
    'country_managing_director'::text,
    'country_hr_director'::text,
    'hr_generalist'::text
  ]))
  OR (
    (public.get_my_role() = ANY (ARRAY[
      'regional_operations_manager'::text,
      'area_operations_manager'::text,
      'regional_hr_manager'::text,
      'regional_supply_chain_manager'::text,
      'regional_procurement_manager'::text,
      'regional_logistics_manager'::text,
      'regional_finance_manager'::text,
      'regional_security_manager'::text,
      'regional_merchandising_manager'::text,
      'regional_it_manager'::text,
      'regional_compliance_manager'::text,
      'vendor_relations_manager'::text,
      'cs_manager'::text
    ]))
    AND (
      (site_id IN (SELECT sites.id FROM public.sites WHERE sites.region_code = public.get_my_region_code()))
      OR (region_code = public.get_my_region_code())
    )
    AND ((role)::text <> ALL (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'regional_operations_manager'::text,
      'country_operations_director'::text,
      'country_finance_director'::text,
      'country_hr_director'::text
    ]))
  )
  OR (
    public.is_manager()
    AND ((site_id = public.get_my_site_id()) OR (public.get_my_site_id() IS NULL))
    AND ((role)::text <> ALL (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text,
      'regional_hr_manager'::text,
      'country_operations_director'::text,
      'country_finance_director'::text,
      'country_hr_director'::text
    ]))
  )
);

DROP POLICY IF EXISTS employees_update ON public.employees;
CREATE POLICY employees_update ON public.employees
FOR UPDATE
TO authenticated
USING (
  (
    (public.normalize_role(public.get_my_role()) = ANY (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'country_hr_director'::text,
      'hr_generalist'::text,
      'country_finance_director'::text,
      'country_technology_director'::text,
      'country_compliance_manager'::text,
      'vendor_relations_manager'::text,
      'cs_manager'::text
    ]))
    AND public.is_site_in_my_authorized_scope((site_id)::text)
  )
  OR (
    (public.normalize_role(public.get_my_role()) = ANY (ARRAY[
      'regional_operations_manager'::text,
      'area_operations_manager'::text,
      'regional_hr_manager'::text,
      'regional_finance_manager'::text,
      'regional_supply_chain_manager'::text,
      'regional_procurement_manager'::text,
      'regional_logistics_manager'::text,
      'regional_security_manager'::text,
      'regional_merchandising_manager'::text,
      'regional_it_manager'::text,
      'regional_compliance_manager'::text,
      'vendor_relations_manager'::text,
      'cs_manager'::text
    ]))
    AND (
      (region_code = public.get_my_region_code())
      OR (site_id IN (SELECT s.id FROM public.sites s WHERE s.region_code = public.get_my_region_code()))
    )
    AND (public.normalize_role((role)::text) <> ALL (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'regional_operations_manager'::text,
      'country_operations_director'::text,
      'country_finance_director'::text,
      'country_hr_director'::text
    ]))
  )
  OR (id = auth.uid())
  OR (lower((email)::text) = lower((auth.jwt() ->> 'email'::text)))
)
WITH CHECK (
  (
    (public.normalize_role(public.get_my_role()) = ANY (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'country_hr_director'::text,
      'hr_generalist'::text,
      'country_finance_director'::text,
      'country_technology_director'::text,
      'country_compliance_manager'::text,
      'vendor_relations_manager'::text,
      'cs_manager'::text
    ]))
    AND public.is_site_in_my_authorized_scope((site_id)::text)
  )
  OR (
    (public.normalize_role(public.get_my_role()) = ANY (ARRAY[
      'regional_operations_manager'::text,
      'area_operations_manager'::text,
      'regional_hr_manager'::text,
      'regional_finance_manager'::text,
      'regional_supply_chain_manager'::text,
      'regional_procurement_manager'::text,
      'regional_logistics_manager'::text,
      'regional_security_manager'::text,
      'regional_merchandising_manager'::text,
      'regional_it_manager'::text,
      'regional_compliance_manager'::text,
      'vendor_relations_manager'::text,
      'cs_manager'::text
    ]))
    AND (
      (region_code = public.get_my_region_code())
      OR (site_id IN (SELECT s.id FROM public.sites s WHERE s.region_code = public.get_my_region_code()))
    )
    AND (public.normalize_role((role)::text) <> ALL (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'regional_operations_manager'::text,
      'country_operations_director'::text,
      'country_finance_director'::text,
      'country_hr_director'::text
    ]))
  )
  OR (id = auth.uid())
  OR (lower((email)::text) = lower((auth.jwt() ->> 'email'::text)))
);

COMMIT;
