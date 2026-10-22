-- Persist primary and functional employee reporting links and enforce safe hierarchy edges.
BEGIN;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS reports_to_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS functional_manager_employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_employees_reports_to_employee_id
  ON public.employees (reports_to_employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_functional_manager_employee_id
  ON public.employees (functional_manager_employee_id);

CREATE OR REPLACE FUNCTION public.validate_employee_reporting_relationships()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_employee_country text;
  v_manager_country text;
  v_employee_region text;
  v_manager_region text;
  v_manager_role text;
  v_manager_scope text;
  v_cycle boolean;
BEGIN
  IF NEW.reports_to_employee_id = NEW.id OR NEW.functional_manager_employee_id = NEW.id THEN
    RAISE EXCEPTION 'An employee cannot report to themselves';
  END IF;

  SELECT upper(s.country)
    INTO v_employee_country
    FROM public.sites s
   WHERE s.id::text = NEW.site_id::text;
  v_employee_region := NEW.region_code;

  IF NEW.reports_to_employee_id IS NOT NULL THEN
    WITH RECURSIVE reporting_chain(id, reports_to_employee_id, path) AS (
      SELECT e.id, e.reports_to_employee_id, ARRAY[e.id]
        FROM public.employees e
       WHERE e.id = NEW.reports_to_employee_id
      UNION ALL
      SELECT e.id, e.reports_to_employee_id, chain.path || e.id
        FROM public.employees e
        JOIN reporting_chain chain ON e.id = chain.reports_to_employee_id
       WHERE chain.reports_to_employee_id IS NOT NULL
         AND NOT e.id = ANY(chain.path)
    )
    SELECT EXISTS (SELECT 1 FROM reporting_chain WHERE id = NEW.id) INTO v_cycle;

    IF v_cycle THEN
      RAISE EXCEPTION 'Primary reporting relationships cannot contain a cycle';
    END IF;
  END IF;

  FOR v_manager_role, v_manager_country, v_manager_region, v_manager_scope IN
    SELECT m.role, upper(s.country), m.region_code, m.scope_level
      FROM public.employees m
      LEFT JOIN public.sites s ON s.id::text = m.site_id::text
     WHERE m.id IN (NEW.reports_to_employee_id, NEW.functional_manager_employee_id)
  LOOP
    IF v_employee_country IS NOT NULL AND v_manager_country IS NOT NULL
       AND v_employee_country <> v_manager_country THEN
      RAISE EXCEPTION 'Reporting relationships cannot cross country boundaries';
    END IF;
    IF v_employee_country IS NULL AND v_manager_country IS NOT NULL
       AND NEW.role NOT IN ('group_ceo','group_coo','group_cfo','group_cco','group_cmo','group_csco','group_chro','group_cto','group_cio','group_clco','group_cae','super_admin','ceo') THEN
      RAISE EXCEPTION 'Global employees cannot report into a country hierarchy';
    END IF;
    IF v_employee_country IS NOT NULL AND v_manager_country IS NULL
       AND v_manager_role NOT IN ('group_ceo','group_coo','group_cfo','group_cco','group_cmo','group_csco','group_chro','group_cto','group_cio','group_clco','group_cae','super_admin','ceo') THEN
      RAISE EXCEPTION 'Country employees may report globally only to group executives';
    END IF;
    IF coalesce(upper(NEW.scope_level), '') = 'REGIONAL'
       AND coalesce(upper(v_manager_scope), '') = 'REGIONAL'
       AND v_employee_region IS NOT NULL AND v_manager_region IS NOT NULL
       AND lower(v_employee_region) <> lower(v_manager_region) THEN
      RAISE EXCEPTION 'Regional reporting relationships cannot cross region boundaries';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_employee_reporting_relationships() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_validate_employee_reporting_relationships ON public.employees;
CREATE TRIGGER trg_validate_employee_reporting_relationships
  BEFORE INSERT OR UPDATE OF site_id, region_code, scope_level, reports_to_employee_id, functional_manager_employee_id
  ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.validate_employee_reporting_relationships();

-- Make role-based scope fallback recognize the multinational executive roles.
CREATE OR REPLACE FUNCTION public.get_my_scope_level()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
  v_scope text;
  v_role text;
  v_normalized_role text;
  v_uid uuid := auth.uid();
  v_email text := auth.jwt() ->> 'email';
BEGIN
  IF v_uid IS NULL AND coalesce(v_email, '') = '' THEN
    RETURN NULL;
  END IF;

  SELECT employee.scope_level, employee.role
    INTO v_scope, v_role
    FROM public.employees employee
   WHERE (v_uid IS NOT NULL AND employee.id = v_uid)
      OR (v_email IS NOT NULL AND lower(employee.email) = lower(v_email))
   ORDER BY (employee.id = v_uid) DESC NULLS LAST
   LIMIT 1;

  v_normalized_role := public.normalize_role(v_role);
  IF v_normalized_role IN (
    'super_admin', 'ceo', 'group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo',
    'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco',
    'group_cae', 'admin', 'country_operations_director',
    'country_finance_director', 'country_commercial_director',
    'country_supply_chain_director', 'country_hr_director',
    'country_technology_director', 'country_compliance_manager',
    'head_of_operations', 'head_of_finance', 'head_of_procurement',
    'head_of_supply_chain', 'head_of_hr', 'hr', 'head_of_merchandising',
    'head_of_it', 'head_of_audit', 'auditor'
  ) THEN
    RETURN 'HQ';
  ELSIF v_normalized_role IN (
    'regional_operations_manager', 'regional_procurement_manager',
    'regional_finance_manager', 'regional_merchandising_manager',
    'regional_hr_manager', 'regional_logistics_manager',
    'regional_security_manager', 'regional_supply_chain_manager',
    'regional_it_manager', 'regional_compliance_manager'
  ) THEN
    RETURN 'REGIONAL';
  END IF;

  RETURN coalesce(v_scope, 'SITE');
EXCEPTION WHEN OTHERS THEN
  RETURN 'SITE';
END;
$function$;

-- Align site authorization with the group / country / region / site model.
CREATE OR REPLACE FUNCTION public.is_site_in_my_authorized_scope(
  p_site_id text,
  p_country_code text DEFAULT NULL::text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO pg_catalog, public, auth, pg_temp
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
           'super_admin', 'ceo', 'group_ceo', 'group_coo', 'group_cfo', 'group_cco',
           'group_cmo', 'group_csco', 'group_chro', 'group_cto', 'group_cio',
           'group_clco', 'group_cae'
         )
         OR (
           upper(actor_site.country) = upper(target_site.country)
           AND (
             -- Country leadership and functional directors operate throughout their country.
             public.normalize_role(actor.role) IN (
               'admin', 'country_operations_director', 'country_finance_director',
               'country_commercial_director', 'country_supply_chain_director',
               'country_hr_director', 'country_technology_director',
               'country_compliance_manager', 'head_of_operations', 'head_of_finance',
               'head_of_procurement', 'head_of_hr', 'head_of_supply_chain',
               'head_of_merchandising', 'head_of_it', 'head_of_audit', 'auditor',
               'inventory_manager', 'logistics_manager'
             )
             OR (
               public.normalize_role(actor.role) IN (
                 'regional_operations_manager', 'regional_procurement_manager',
                 'regional_finance_manager', 'regional_merchandising_manager',
                 'regional_hr_manager', 'regional_logistics_manager',
                 'regional_security_manager', 'regional_supply_chain_manager',
                 'regional_it_manager', 'regional_compliance_manager'
               )
               AND actor.region_code IS NOT NULL
               AND lower(actor.region_code) = lower(target_site.region_code)
             )
             OR actor.site_id = target_site.id
           )
         )
       )
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_hq_executive()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO pg_catalog, public, auth
AS $function$
  SELECT auth.uid() IS NOT NULL
     AND (
       public.normalize_role(public.get_my_role()) IN (
         'super_admin', 'ceo', 'group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_cmo',
         'group_csco', 'group_chro', 'group_cto', 'group_cio', 'group_clco',
         'group_cae', 'admin', 'country_operations_director',
         'country_finance_director', 'country_commercial_director',
         'country_supply_chain_director', 'country_hr_director',
         'country_technology_director', 'country_compliance_manager',
         'head_of_operations', 'head_of_finance', 'head_of_procurement',
         'head_of_supply_chain', 'head_of_hr', 'head_of_merchandising',
         'head_of_it', 'head_of_audit', 'auditor'
       )
       OR EXISTS (
         SELECT 1
           FROM public.employees e
           JOIN public.sites site ON site.id = e.site_id
          WHERE e.id = auth.uid()
            AND site.type = 'Administration'
            AND (site.code LIKE '%-HQ' OR site.name ILIKE '%Central Operations%'
                 OR site.name ILIKE '%National HQ%')
       )
     );
$function$;

COMMIT;
