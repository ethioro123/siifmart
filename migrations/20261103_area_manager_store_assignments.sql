-- Assign each retail store to at most one Area Manager. Unassigned stores are
-- invisible to Area Managers until operations leadership assigns them.
BEGIN;

ALTER TABLE public.sites
  ADD COLUMN IF NOT EXISTS area_manager_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sites_area_manager_id
  ON public.sites (area_manager_id) WHERE area_manager_id IS NOT NULL;

CREATE OR REPLACE FUNCTION private.area_store_scope(p_site_id text, p_country_code text DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO '' AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees actor
    JOIN public.sites home ON home.id = actor.site_id
    JOIN public.sites target ON target.id::text = p_site_id OR target.code = p_site_id
    WHERE actor.id = auth.uid()
      AND public.normalize_role(actor.role) = 'area_operations_manager'
      AND lower(coalesce(actor.status, 'active')) = 'active'
      AND target.type = 'Store'
      AND target.area_manager_id = actor.id
      AND upper(target.country) = upper(home.country)
      AND target.region_code = coalesce(actor.region_code, home.region_code)
      AND (p_country_code IS NULL OR upper(target.country) = upper(p_country_code))
  );
$function$;
REVOKE ALL ON FUNCTION private.area_store_scope(text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.area_store_scope(text,text) TO authenticated;

CREATE OR REPLACE FUNCTION private.guard_area_store_assignment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $function$
DECLARE
  assigned public.employees%ROWTYPE;
  manager_home public.sites%ROWTYPE;
  actor public.employees%ROWTYPE;
  actor_home public.sites%ROWTYPE;
  assignment_changed boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    assignment_changed := NEW.area_manager_id IS NOT NULL;
  ELSE
    assignment_changed := NEW.area_manager_id IS DISTINCT FROM OLD.area_manager_id;
  END IF;

  IF NEW.area_manager_id IS NOT NULL THEN
    IF NEW.type <> 'Store' OR NEW.region_code IS NULL THEN
      RAISE EXCEPTION 'Area Managers may only be assigned to regional retail stores';
    END IF;
    SELECT * INTO assigned FROM public.employees WHERE id = NEW.area_manager_id;
    SELECT * INTO manager_home FROM public.sites WHERE id = assigned.site_id;
    IF assigned.id IS NULL
       OR public.normalize_role(assigned.role) <> 'area_operations_manager'
       OR lower(coalesce(assigned.status, 'active')) <> 'active'
       OR upper(manager_home.country) IS DISTINCT FROM upper(NEW.country)
       OR coalesce(assigned.region_code, manager_home.region_code) IS DISTINCT FROM NEW.region_code THEN
      RAISE EXCEPTION 'Assigned Area Manager must be active in the store country and region';
    END IF;
  END IF;

  IF assignment_changed AND auth.uid() IS NOT NULL THEN
    SELECT * INTO actor FROM public.employees WHERE id = auth.uid();
    SELECT * INTO actor_home FROM public.sites WHERE id = actor.site_id;
    IF actor.id IS NULL OR lower(coalesce(actor.status, 'active')) <> 'active'
       OR public.normalize_role(actor.role) NOT IN
          ('group_ceo', 'country_managing_director', 'country_operations_director', 'regional_operations_manager')
       OR (public.normalize_role(actor.role) <> 'group_ceo'
           AND upper(actor_home.country) IS DISTINCT FROM upper(NEW.country))
       OR (public.normalize_role(actor.role) = 'regional_operations_manager'
           AND coalesce(actor.region_code, actor_home.region_code) IS DISTINCT FROM NEW.region_code) THEN
      RAISE EXCEPTION 'Operations leadership authority required to assign an Area Manager';
    END IF;
  ELSIF assignment_changed AND auth.role() IS DISTINCT FROM 'service_role'
        AND session_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'Authenticated operations leadership required for Area Manager assignment';
  END IF;

  IF assignment_changed AND auth.uid() IS NOT NULL THEN
    INSERT INTO public.system_logs
      (user_name, action, module, details, site_id, country_code, entity_type, entity_id, performed_by)
    VALUES
      (actor.name, 'AREA_STORE_ASSIGNMENT_CHANGED', 'Operations',
       jsonb_build_object('site_id', NEW.id, 'area_manager_id', NEW.area_manager_id)::text,
       NEW.id, NEW.country, 'sites', NEW.id::text, actor.id::text);
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION private.guard_area_store_assignment() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS guard_area_store_assignment ON public.sites;
CREATE TRIGGER guard_area_store_assignment
BEFORE INSERT OR UPDATE OF area_manager_id, type, country, region_code ON public.sites
FOR EACH ROW EXECUTE FUNCTION private.guard_area_store_assignment();

-- Existing staging fixtures have exactly one active Area Manager per region.
-- This only fills unassigned stores in regions with a unique manager.
WITH unique_manager AS (
  SELECT upper(s.country) AS country, coalesce(e.region_code, s.region_code) AS region_code,
         min(e.id::text)::uuid AS manager_id
  FROM public.employees e JOIN public.sites s ON s.id = e.site_id
  WHERE e.role = 'area_operations_manager' AND lower(coalesce(e.status, 'active')) = 'active'
  GROUP BY upper(s.country), coalesce(e.region_code, s.region_code)
  HAVING count(*) = 1
)
UPDATE public.sites store SET area_manager_id = unique_manager.manager_id
FROM unique_manager
WHERE store.type = 'Store' AND store.area_manager_id IS NULL
  AND upper(store.country) = unique_manager.country
  AND store.region_code = unique_manager.region_code;

CREATE OR REPLACE FUNCTION public.is_site_in_my_authorized_scope(p_site_id text, p_country_code text DEFAULT NULL)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'auth', 'pg_temp' AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees actor
    LEFT JOIN public.sites actor_site ON actor_site.id = actor.site_id
    JOIN public.sites target_site
      ON target_site.id::text = p_site_id OR target_site.code = p_site_id
    WHERE actor.id = auth.uid()
      AND coalesce(lower(actor.status), 'active') = 'active'
      AND (p_country_code IS NULL OR upper(p_country_code) = upper(target_site.country))
      AND (
        (public.normalize_role(actor.role) = 'area_operations_manager'
          AND target_site.type = 'Store'
          AND target_site.area_manager_id = actor.id
          AND upper(actor_site.country) = upper(target_site.country)
          AND coalesce(actor.region_code, actor_site.region_code) = target_site.region_code)
        OR (public.normalize_role(actor.role) <> 'area_operations_manager' AND (
          public.normalize_role(actor.role) IN
            ('group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo',
             'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco', 'group_cae')
          OR (upper(coalesce(actor_site.country, target_site.country)) = upper(target_site.country)
            AND (
              public.normalize_role(actor.role) IN
                ('country_managing_director', 'country_operations_director',
                 'country_finance_director', 'country_commercial_director',
                 'country_supply_chain_director', 'country_hr_director',
                 'country_technology_director', 'country_compliance_manager', 'auditor')
              OR (public.normalize_role(actor.role) IN
                    ('regional_operations_manager', 'regional_supply_chain_manager',
                     'regional_procurement_manager', 'regional_finance_manager',
                     'regional_merchandising_manager', 'regional_hr_manager',
                     'regional_logistics_manager', 'regional_security_manager',
                     'regional_it_manager', 'regional_compliance_manager',
                     'inventory_manager', 'vendor_relations_manager', 'cs_manager')
                  AND coalesce(actor.region_code, actor_site.region_code) IS NOT NULL
                  AND lower(coalesce(actor.region_code, actor_site.region_code)) = lower(target_site.region_code))
              OR (public.normalize_role(actor.role) IN
                    ('inventory_manager', 'vendor_relations_manager', 'cs_manager')
                  AND actor.region_code IS NULL AND actor_site.region_code IS NULL
                  AND coalesce(actor.scope_level, 'HQ') = 'HQ')
              OR actor.site_id = target_site.id
            ))
        ))
      )
  );
$function$;

DROP POLICY IF EXISTS sites_area_manager_read_guard ON public.sites;
CREATE POLICY sites_area_manager_read_guard ON public.sites AS RESTRICTIVE
FOR SELECT TO authenticated USING (
  public.normalize_role(public.get_my_role()) <> 'area_operations_manager'
  OR id = public.get_my_site_id()
  OR private.area_store_scope(id::text, country::text)
);

DROP POLICY IF EXISTS sites_area_manager_update_guard ON public.sites;
CREATE POLICY sites_area_manager_update_guard ON public.sites AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (public.normalize_role(public.get_my_role()) <> 'area_operations_manager')
WITH CHECK (public.normalize_role(public.get_my_role()) <> 'area_operations_manager');

COMMIT;
