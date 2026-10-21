-- Migration: Align PO Creation Supplier Scope & Role Normalization
-- Date: 2026-10-22
-- Description:
--   1. Ensures public.normalize_role(text) is present and normalizes employee roles in
--      private.procurement_supplier_scope, private.guard_procurement_supplier_write, and
--      private.procurement_site_scope so aliased titles (head_of_procurement,
--      country_managing_director, head_of_operations, head_of_supply_chain,
--      regional_procurement_manager, regional_operations_director) match PO & supplier policies.
--   2. Aligns supplier insert scope (p_write = true) with PO creation roles (supply_chain_manager,
--      operations_manager, regional_manager) so authorized PO creators can register pending one-off
--      suppliers within their national or regional scope while preserving procurement-lead verification.
--   3. Allows cross-country executive roles (super_admin, ceo) to read and register suppliers in the
--      active country when switching countries via the executive country switch.

BEGIN;

CREATE OR REPLACE FUNCTION public.normalize_role(p_role text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path TO ''
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

CREATE OR REPLACE FUNCTION private.procurement_supplier_scope(
  p_country text,
  p_region text,
  p_write boolean DEFAULT false
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees actor
    LEFT JOIN public.sites home ON home.id = actor.site_id
    WHERE actor.id = (SELECT auth.uid())
      AND COALESCE(lower(actor.status), 'active') = 'active'
      AND upper(COALESCE(p_country, '')) IN ('ET', 'KE')
      AND (
        public.normalize_role(actor.role::text) IN ('super_admin', 'ceo')
        OR (
          home.id IS NOT NULL
          AND upper(home.country) = upper(p_country)
          AND public.normalize_role(actor.role::text) IN (
            'admin',
            'procurement_manager',
            'regional_procurement_lead',
            'buyer',
            'vendor_relations_manager',
            'supply_chain_manager',
            'operations_manager',
            'regional_manager',
            'finance_manager',
            'regional_finance_officer',
            'auditor',
            'store_manager',
            'warehouse_manager',
            'receiver',
            'inventory_specialist',
            'inventory_manager',
            'logistics_manager',
            'regional_logistics_lead',
            'demand_planner',
            'replenishment_planner',
            'customs_import_specialist'
          )
          AND (
            NOT p_write
            OR public.normalize_role(actor.role::text) IN (
              'admin',
              'procurement_manager',
              'regional_procurement_lead',
              'buyer',
              'vendor_relations_manager',
              'supply_chain_manager',
              'operations_manager',
              'regional_manager'
            )
          )
          AND (
            (
              home.type = 'Administration'
              AND home.code = upper(home.country) || '-HQ'
              AND home.region_code IS NULL
              AND actor.region_code IS NULL
            )
            OR (
              home.type = 'Administration'
              AND home.region_code IS NOT NULL
              AND actor.region_code = home.region_code
              AND (
                (NOT p_write AND (p_region IS NULL OR p_region = home.region_code))
                OR (p_write AND p_region = home.region_code)
              )
            )
            OR (
              NOT p_write
              AND home.type <> 'Administration'
              AND (p_region IS NULL OR p_region = home.region_code)
            )
          )
        )
      )
  );
$function$;

CREATE OR REPLACE FUNCTION private.guard_procurement_supplier_write()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  actor public.employees%ROWTYPE;
  home public.sites%ROWTYPE;
  region_country text;
  lead_role boolean;
  actor_norm_role text;
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO actor
  FROM public.employees
  WHERE id = (SELECT auth.uid())
    AND COALESCE(lower(status), 'active') = 'active';

  IF actor.id IS NULL THEN
    RAISE EXCEPTION 'Active employee required';
  END IF;

  actor_norm_role := public.normalize_role(actor.role::text);
  SELECT * INTO home FROM public.sites WHERE id = actor.site_id;

  IF actor_norm_role IN ('super_admin', 'ceo') THEN
    IF upper(COALESCE(NEW.country_code, '')) NOT IN ('ET', 'KE') THEN
      RAISE EXCEPTION 'Supplier country is outside the authorized scope';
    END IF;
  ELSE
    IF home.id IS NULL OR upper(NEW.country_code) <> upper(home.country) THEN
      RAISE EXCEPTION 'Supplier country is outside the employee scope';
    END IF;
  END IF;

  lead_role := actor_norm_role IN (
    'super_admin',
    'ceo',
    'admin',
    'procurement_manager',
    'regional_procurement_lead'
  );

  IF actor_norm_role NOT IN ('super_admin', 'ceo')
     AND home.type = 'Administration'
     AND home.region_code IS NOT NULL THEN
    IF actor.region_code IS DISTINCT FROM home.region_code THEN
      RAISE EXCEPTION 'Employee regional assignment is inconsistent';
    END IF;
    IF TG_OP = 'INSERT' AND NEW.region_code IS NULL THEN
      NEW.region_code := home.region_code;
    END IF;
    IF NEW.region_code IS DISTINCT FROM home.region_code THEN
      RAISE EXCEPTION 'Regional supplier edits require the assigned region';
    END IF;
  END IF;

  IF NEW.region_code IS NOT NULL THEN
    SELECT upper(country) INTO region_country
    FROM public.regions
    WHERE code = NEW.region_code;
    IF region_country IS DISTINCT FROM upper(NEW.country_code) THEN
      RAISE EXCEPTION 'Supplier region must belong to its country';
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.created_by := actor.id;
    IF NEW.verification_status IS DISTINCT FROM 'pending'
       OR NEW.verified_by IS NOT NULL
       OR NEW.verified_at IS NOT NULL THEN
      RAISE EXCEPTION 'New suppliers require independent verification';
    END IF;
  ELSE
    IF (NEW.country_code, NEW.region_code, NEW.created_by) IS DISTINCT FROM
       (OLD.country_code, OLD.region_code, OLD.created_by) THEN
      RAISE EXCEPTION 'Supplier assignment and creator cannot be changed';
    END IF;
    IF NOT lead_role AND OLD.verification_status = 'verified' THEN
      RAISE EXCEPTION 'Verified supplier edits require a procurement lead';
    END IF;
    IF (NEW.verification_status, NEW.verified_by, NEW.verified_at) IS DISTINCT FROM
       (OLD.verification_status, OLD.verified_by, OLD.verified_at) THEN
      IF NOT lead_role
         OR actor.id = OLD.created_by
         OR NEW.verification_status <> 'verified'
         OR NEW.verified_by IS DISTINCT FROM actor.id::text
         OR NEW.verified_at IS NULL THEN
        RAISE EXCEPTION 'Supplier verification requires a separate procurement lead';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION private.procurement_site_scope(
  p_site_id text,
  p_country_code text DEFAULT NULL::text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
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
        AND public.normalize_role(actor.role::text) IN (
          'buyer',
          'vendor_relations_manager',
          'demand_planner',
          'replenishment_planner',
          'customs_import_specialist'
        )
        AND home.type = 'Administration'
        AND upper(home.country) = upper(target.country)
        AND (p_country_code IS NULL OR upper(p_country_code) = upper(target.country))
        AND (
          (
            home.code = upper(home.country) || '-HQ'
            AND home.region_code IS NULL
            AND actor.region_code IS NULL
          )
          OR (
            home.region_code IS NOT NULL
            AND actor.region_code = home.region_code
            AND target.region_code = home.region_code
          )
        )
    );
$function$;

COMMIT;
