-- ============================================================================
-- SIIFMART REGIONAL SUPPLY CHAIN SITE SCOPE & RLS ALIGNMENT
-- Migration: 20261028_regional_supply_chain_site_scope_rls.sql
-- Purpose:
--   1. Scopes regional_supply_chain_manager and area_operations_manager
--      strictly to their assigned region_code in public.is_site_in_my_authorized_scope
--      (preventing cross-region leakage while allowing full access to all
--      Distribution Centers, Warehouses, Stores, and Regional Admin in their region).
--   2. Updates private.procurement_site_scope and purchase_orders RLS policies
--      (po_zero_trust_select, po_zero_trust_update) to include
--      regional_supply_chain_manager, regional_logistics_manager,
--      area_operations_manager, and inbound_qc_inspector within their region.
--   3. Tightens public.products UPDATE policy so regional managers can only
--      update product stock/records within their assigned region_code.
-- ============================================================================

BEGIN;

-- 1. Enforce strict regional boundary for regional_supply_chain_manager & area_operations_manager
CREATE OR REPLACE FUNCTION public.is_site_in_my_authorized_scope(
  p_site_id text,
  p_country_code text DEFAULT NULL::text
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp'
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
         -- Group executives have enterprise-wide site scope.
         public.normalize_role(actor.role) IN (
           'group_ceo', 'group_coo', 'group_cfo', 'group_cco',
           'group_cmo', 'group_csco', 'group_chro', 'group_cto', 'group_cio',
           'group_clco', 'group_cae'
         )
         OR (
           upper(COALESCE(actor_site.country, target_site.country)) = upper(target_site.country)
           AND (
             -- Country leadership and national directors operate throughout their country.
             public.normalize_role(actor.role) IN (
               'country_managing_director', 'country_operations_director', 'country_finance_director',
               'country_commercial_director', 'country_supply_chain_director',
               'country_hr_director', 'country_technology_director',
               'country_compliance_manager', 'auditor'
             )
             -- Regional leadership & regional department managers operate across all sites in their region_code.
             OR (
               public.normalize_role(actor.role) IN (
                 'regional_operations_manager', 'area_operations_manager',
                 'regional_supply_chain_manager', 'regional_procurement_manager',
                 'regional_finance_manager', 'regional_merchandising_manager',
                 'regional_hr_manager', 'regional_logistics_manager',
                 'regional_security_manager', 'regional_it_manager',
                 'regional_compliance_manager', 'inventory_manager',
                 'vendor_relations_manager', 'cs_manager'
               )
               AND COALESCE(actor.region_code, actor_site.region_code) IS NOT NULL
               AND lower(COALESCE(actor.region_code, actor_site.region_code)) = lower(target_site.region_code)
             )
             -- HQ-scoped inventory/vendor/cs managers without a regional lock operate country-wide.
             OR (
               public.normalize_role(actor.role) IN ('inventory_manager', 'vendor_relations_manager', 'cs_manager')
               AND actor.region_code IS NULL
               AND actor_site.region_code IS NULL
               AND COALESCE(actor.scope_level, 'HQ') = 'HQ'
             )
             OR actor.site_id = target_site.id
           )
         )
       )
  );
$function$;

-- 2. Allow regional supply chain & logistics managers to access POs across all facilities in their region
CREATE OR REPLACE FUNCTION private.procurement_site_scope(
  p_site_id text,
  p_country_code text DEFAULT NULL::text
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT (
    public.is_site_in_my_authorized_scope(p_site_id, p_country_code)
    OR EXISTS (
      SELECT 1
      FROM public.employees actor
      JOIN public.sites home ON home.id = actor.site_id
      JOIN public.sites target ON target.id::text = p_site_id OR target.code = p_site_id
      WHERE actor.id = (SELECT auth.uid())
        AND COALESCE(lower(actor.status), 'active') = 'active'
        AND public.normalize_role(actor.role) IN (
          'buyer',
          'vendor_relations_manager',
          'demand_planner',
          'replenishment_planner',
          'customs_import_specialist',
          'inbound_qc_inspector'
        )
        AND upper(home.country) = upper(target.country)
        AND (p_country_code IS NULL OR upper(p_country_code) = upper(target.country))
        AND (
          (
            home.type = 'Administration'
            AND home.code = upper(home.country) || '-HQ'
            AND home.region_code IS NULL
            AND actor.region_code IS NULL
          )
          OR (
            COALESCE(actor.region_code, home.region_code) IS NOT NULL
            AND lower(target.region_code) = lower(COALESCE(actor.region_code, home.region_code))
          )
        )
    )
  )
  AND EXISTS (
    SELECT 1 FROM public.employees scoped_actor
    LEFT JOIN public.sites scoped_home ON scoped_home.id = scoped_actor.site_id
    JOIN public.sites scoped_target ON scoped_target.id::text = p_site_id OR scoped_target.code = p_site_id
    WHERE scoped_actor.id = (SELECT auth.uid())
      AND lower(scoped_actor.status) = 'active'
      AND (
        public.normalize_role(scoped_actor.role) LIKE 'group_%'
        OR (
          upper(COALESCE(scoped_home.country, scoped_target.country)) = upper(scoped_target.country)
          AND (
            -- National HQ staff
            (scoped_home.type = 'Administration'
              AND scoped_home.code = upper(scoped_home.country) || '-HQ'
              AND scoped_home.region_code IS NULL
              AND scoped_actor.region_code IS NULL
              AND COALESCE(scoped_actor.scope_level, 'HQ') = 'HQ'
              AND scoped_actor.role NOT LIKE 'regional_%')
            -- Regional leadership & regional supply chain/procurement/logistics/finance/ops staff across their region
            OR (COALESCE(scoped_actor.region_code, scoped_home.region_code) IS NOT NULL
              AND lower(scoped_target.region_code) = lower(COALESCE(scoped_actor.region_code, scoped_home.region_code))
              AND (
                scoped_home.type = 'Administration'
                OR public.normalize_role(scoped_actor.role) IN (
                  'regional_operations_manager', 'area_operations_manager',
                  'regional_supply_chain_manager', 'regional_procurement_manager',
                  'regional_logistics_manager', 'regional_finance_manager'
                )
              ))
            -- Facility-bound warehouse/store staff on their own site
            OR (scoped_target.id = scoped_home.id)
          )
        )
      )
  );
$function$;

-- 3. Update purchase_orders SELECT & UPDATE policies to include regional_supply_chain_manager, regional_logistics_manager, area_operations_manager, inbound_qc_inspector
DROP POLICY IF EXISTS po_zero_trust_select ON public.purchase_orders;
CREATE POLICY po_zero_trust_select
  ON public.purchase_orders
  FOR SELECT
  USING (
    lower(public.get_my_role()) = ANY (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'country_commercial_director'::text,
      'country_supply_chain_director'::text,
      'country_operations_director'::text,
      'country_finance_director'::text,
      'country_compliance_manager'::text,
      'auditor'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text,
      'regional_supply_chain_manager'::text,
      'regional_procurement_manager'::text,
      'regional_logistics_manager'::text,
      'regional_finance_manager'::text,
      'buyer'::text,
      'vendor_relations_manager'::text,
      'demand_planner'::text,
      'customs_import_specialist'::text,
      'inbound_qc_inspector'::text,
      'replenishment_planner'::text,
      'warehouse_manager'::text,
      'receiver'::text,
      'inventory_specialist'::text
    ])
    AND private.procurement_site_scope((site_id)::text, (country_code)::text)
  );

DROP POLICY IF EXISTS po_zero_trust_update ON public.purchase_orders;
CREATE POLICY po_zero_trust_update
  ON public.purchase_orders
  FOR UPDATE
  USING (
    lower(public.get_my_role()) = ANY (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'country_commercial_director'::text,
      'country_supply_chain_director'::text,
      'country_operations_director'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text,
      'regional_supply_chain_manager'::text,
      'regional_procurement_manager'::text,
      'regional_logistics_manager'::text,
      'buyer'::text,
      'demand_planner'::text,
      'inbound_qc_inspector'::text,
      'replenishment_planner'::text,
      'warehouse_manager'::text,
      'receiver'::text,
      'inventory_specialist'::text
    ])
    AND private.procurement_site_scope((site_id)::text, (country_code)::text)
  )
  WITH CHECK (
    lower(public.get_my_role()) = ANY (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'country_commercial_director'::text,
      'country_supply_chain_director'::text,
      'country_operations_director'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text,
      'regional_supply_chain_manager'::text,
      'regional_procurement_manager'::text,
      'regional_logistics_manager'::text,
      'buyer'::text,
      'demand_planner'::text,
      'inbound_qc_inspector'::text,
      'replenishment_planner'::text,
      'warehouse_manager'::text,
      'receiver'::text,
      'inventory_specialist'::text
    ])
    AND private.procurement_site_scope((site_id)::text, (country_code)::text)
  );

-- 4. Update products_update policy so regional managers update products only within their region_code
DROP POLICY IF EXISTS products_update ON public.products;
CREATE POLICY products_update
  ON public.products
  FOR UPDATE
  USING (
    public.is_ceo()
    OR (
      public.is_admin()
      AND (SELECT public.get_my_role()) NOT IN ('regional_operations_manager', 'area_operations_manager', 'regional_supply_chain_manager')
      AND site_id IN (
        SELECT s.id FROM public.sites s WHERE (s.country)::text = public.get_my_country_code()
      )
    )
    OR (
      (SELECT public.get_my_role()) IN (
        'regional_operations_manager', 'area_operations_manager',
        'regional_supply_chain_manager', 'regional_logistics_manager',
        'regional_procurement_manager'
      )
      AND site_id IN (
        SELECT s.id FROM public.sites s WHERE s.region_code = (SELECT public.get_my_region_code())
      )
    )
    OR (
      public.is_manager()
      AND (
        (site_id)::text = (SELECT public.get_my_site_code_or_id())
        OR site_id IN (
          SELECT s.id FROM public.sites s
          WHERE (s.id)::text = (SELECT public.get_my_site_code_or_id())
             OR s.code = (SELECT public.get_my_site_code_or_id())
        )
      )
    )
  );

COMMIT;
