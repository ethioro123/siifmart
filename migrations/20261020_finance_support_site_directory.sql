-- HQ finance support needs to discover the sites whose finance records it
-- may prepare or reconcile. Regional staff already see sites in their region.
DROP POLICY IF EXISTS sites_read ON public.sites;
CREATE POLICY sites_read ON public.sites FOR SELECT TO authenticated
USING (
  public.is_ceo()
  OR (public.is_hq_executive() AND upper(country) = public.get_my_country_code_strict())
  OR (region_code IS NOT NULL AND region_code = public.get_my_region_code())
  OR id = public.get_my_site_id()
  OR private.finance_hq_scope(country)
);
