-- HR support follows its assigned Administration office. No client-supplied
-- role or region is trusted for authorization.
CREATE OR REPLACE FUNCTION private.hr_site_scope(p_site_id text, p_country_code text DEFAULT NULL)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT public.is_site_in_my_authorized_scope(p_site_id, p_country_code)
    OR EXISTS (
      SELECT 1 FROM public.employees actor
      JOIN public.sites home ON home.id = actor.site_id
      JOIN public.sites target ON target.id::text = p_site_id OR target.code = p_site_id
      WHERE actor.id = (SELECT auth.uid())
        AND COALESCE(lower(actor.status), 'active') = 'active'
        AND lower(actor.role) IN ('talent_recruiter','training_coordinator','payroll_specialist')
        AND home.type = 'Administration'
        AND upper(home.country) = upper(target.country)
        AND (p_country_code IS NULL OR upper(p_country_code) = upper(target.country))
        AND (
          (home.code = upper(home.country) || '-HQ'
            AND home.region_code IS NULL AND actor.region_code IS NULL)
          OR (home.region_code IS NOT NULL
            AND actor.region_code = home.region_code
            AND target.region_code = home.region_code)
        )
    );
$function$;
REVOKE ALL ON FUNCTION private.hr_site_scope(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.hr_site_scope(text, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.hr_hq_scope(p_country_code text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.employees actor
    JOIN public.sites home ON home.id = actor.site_id
    WHERE actor.id = (SELECT auth.uid())
      AND COALESCE(lower(actor.status), 'active') = 'active'
      AND lower(actor.role) IN ('talent_recruiter','training_coordinator','payroll_specialist')
      AND home.type = 'Administration'
      AND home.code = upper(home.country) || '-HQ'
      AND home.region_code IS NULL AND actor.region_code IS NULL
      AND upper(home.country) = upper(p_country_code)
  );
$function$;
REVOKE ALL ON FUNCTION private.hr_hq_scope(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.hr_hq_scope(text) TO authenticated, service_role;

-- A scope_level label alone previously exposed all national employee rows,
-- including those in another country. Resolve every row through its site.
DROP POLICY IF EXISTS employees_read ON public.employees;
CREATE POLICY employees_read ON public.employees FOR SELECT TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (site_id IS NOT NULL AND private.hr_site_scope(site_id::text, NULL))
);

-- Keep the finance site-directory rule while adding HQ HR support.
DROP POLICY IF EXISTS sites_read ON public.sites;
CREATE POLICY sites_read ON public.sites FOR SELECT TO authenticated
USING (
  public.is_ceo()
  OR (public.is_hq_executive() AND upper(country) = public.get_my_country_code_strict())
  OR (region_code IS NOT NULL AND region_code = public.get_my_region_code())
  OR id = public.get_my_site_id()
  OR private.finance_hq_scope(country)
  OR private.hr_hq_scope(country)
);
