-- Bound procurement reads and writes to the employee's assigned office region or operating site.
-- Existing role permission checks remain in force; missing scope never grants country access.
BEGIN;
CREATE OR REPLACE FUNCTION private.procurement_site_scope(p_site_id text, p_country_code text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT (public.is_site_in_my_authorized_scope(p_site_id, p_country_code)
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
    ))
 AND EXISTS (
    SELECT 1 FROM public.employees scoped_actor
    LEFT JOIN public.sites scoped_home ON scoped_home.id = scoped_actor.site_id
    JOIN public.sites scoped_target ON scoped_target.id::text = p_site_id OR scoped_target.code = p_site_id
    WHERE scoped_actor.id = (SELECT auth.uid())
      AND lower(scoped_actor.status) = 'active'
      AND (
        public.normalize_role(scoped_actor.role) LIKE 'group_%'
        OR (
          upper(scoped_home.country) = upper(scoped_target.country)
          AND (
            (scoped_home.type = 'Administration'
              AND scoped_home.code = upper(scoped_home.country) || '-HQ'
              AND scoped_home.region_code IS NULL AND scoped_actor.region_code IS NULL
              AND scoped_actor.scope_level = 'HQ'
              AND scoped_actor.role NOT LIKE 'regional_%')
            OR (scoped_home.type = 'Administration'
              AND scoped_actor.region_code IS NOT NULL
              AND scoped_actor.region_code = scoped_home.region_code
              AND scoped_target.region_code = scoped_actor.region_code)
            OR (scoped_home.type <> 'Administration' AND scoped_target.id = scoped_home.id)
          )
        )
      )
  );
$function$;

CREATE OR REPLACE FUNCTION private.procurement_supplier_scope(p_country text, p_region text, p_write boolean DEFAULT false)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 SELECT (EXISTS (
    SELECT 1
    FROM public.employees actor
    LEFT JOIN public.sites home ON home.id = actor.site_id
    WHERE actor.id = (SELECT auth.uid())
      AND COALESCE(lower(actor.status), 'active') = 'active'
      AND upper(COALESCE(p_country, '')) IN ('ET', 'KE')
      AND (
        public.normalize_role(actor.role) IN ('group_ceo', 'group_ceo')
        OR (
          home.id IS NOT NULL
          AND upper(home.country) = upper(p_country)
          AND public.normalize_role(actor.role) IN (
            'country_managing_director',
            'country_commercial_director',
            'regional_procurement_manager',
            'buyer',
            'vendor_relations_manager',
            'country_supply_chain_director',
            'country_operations_director',
            'regional_operations_manager',
            'country_finance_director',
            'regional_finance_manager',
            'auditor', 'country_compliance_manager',
            'store_manager',
            'warehouse_manager',
            'receiver',
            'inventory_specialist',
            'inventory_manager',
            'regional_supply_chain_manager',
            'regional_logistics_manager',
            'demand_planner',
            'replenishment_planner',
            'customs_import_specialist'
          )
          AND (
            NOT p_write
            OR public.normalize_role(actor.role) IN (
              'country_managing_director',
              'country_commercial_director',
              'regional_procurement_manager',
              'buyer',
              'vendor_relations_manager',
              'country_supply_chain_director',
              'country_operations_director',
              'regional_operations_manager'
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
  ))
 AND EXISTS (
    SELECT 1 FROM public.employees scoped_actor
    LEFT JOIN public.sites scoped_home ON scoped_home.id = scoped_actor.site_id
    WHERE scoped_actor.id = (SELECT auth.uid())
      AND (
        public.normalize_role(scoped_actor.role) LIKE 'group_%'
        OR (scoped_home.code = upper(scoped_home.country) || '-HQ'
          AND scoped_actor.scope_level = 'HQ' AND scoped_actor.region_code IS NULL
          AND scoped_home.region_code IS NULL AND scoped_actor.role NOT LIKE 'regional_%')
        OR (scoped_actor.region_code IS NOT NULL
          AND scoped_actor.region_code = scoped_home.region_code
          AND p_region = scoped_actor.region_code)
      )
  );
$function$;

COMMIT;

