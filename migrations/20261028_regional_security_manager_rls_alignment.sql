-- ============================================================================
-- Migration: 20261028_regional_security_manager_rls_alignment.sql
-- Purpose:
--   Align PostgreSQL RLS policies for regional_security_manager and
--   regional loss prevention / audit workflows:
--   1. Tighten logs_read on public.system_logs so regional_security_manager,
--      regional_it_manager, and regional_compliance_manager are scoped via
--      is_site_in_my_authorized_scope(site_id, country_code) (or site_id IS NULL
--      within their country) instead of unrestricted country-wide log access.
--   2. Update pos_overrides_read_scoped on public.pos_supervisory_overrides
--      to include area_operations_manager and regional_compliance_manager
--      alongside regional_security_manager.
--   3. Update transfers_select_sovereign on public.transfers to include
--      is_site_in_my_authorized_scope(source_site_id, country_code) and
--      is_site_in_my_authorized_scope(dest_site_id, country_code) so
--      regional_security_manager and regional_compliance_manager can inspect
--      blind receiving discrepancies in RegionalLPIncidentDeck.
-- ============================================================================

BEGIN;

-- 1. Update logs_read on public.system_logs
DROP POLICY IF EXISTS "logs_read" ON public.system_logs;
CREATE POLICY "logs_read"
  ON public.system_logs
  FOR SELECT
  USING (
    public.is_ceo()
    OR (
      upper(COALESCE(country_code, ''::text)) = upper(public.get_my_country_code())
      AND (
        public.normalize_role(public.get_my_role()) = ANY (ARRAY[
          'group_ceo'::text,
          'country_managing_director'::text,
          'country_operations_director'::text,
          'country_compliance_manager'::text,
          'country_technology_director'::text,
          'auditor'::text
        ])
        OR (
          site_id IS NULL
          AND public.normalize_role(public.get_my_role()) = ANY (ARRAY[
            'regional_operations_manager'::text,
            'area_operations_manager'::text,
            'regional_security_manager'::text,
            'regional_it_manager'::text,
            'regional_compliance_manager'::text,
            'it_support'::text,
            'store_operations_auditor'::text
          ])
        )
        OR public.is_site_in_my_authorized_scope(site_id, country_code)
      )
    )
  );

-- 2. Update pos_overrides_read_scoped on public.pos_supervisory_overrides if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'pos_supervisory_overrides') THEN
    EXECUTE 'DROP POLICY IF EXISTS "pos_overrides_read_scoped" ON public.pos_supervisory_overrides';
    EXECUTE $pol$
      CREATE POLICY "pos_overrides_read_scoped"
        ON public.pos_supervisory_overrides
        FOR SELECT
        USING (
          public.is_ceo()
          OR (
            upper((country_code)::text) = upper(public.get_my_country_code())
            AND public.normalize_role(public.get_my_role()) = ANY (ARRAY[
              'group_ceo'::text,
              'country_managing_director'::text,
              'country_operations_director'::text,
              'country_finance_director'::text,
              'country_compliance_manager'::text,
              'auditor'::text,
              'store_operations_auditor'::text,
              'store_manager'::text,
              'regional_operations_manager'::text,
              'area_operations_manager'::text,
              'regional_finance_manager'::text,
              'regional_security_manager'::text,
              'regional_compliance_manager'::text
            ])
            AND public.is_site_in_my_authorized_scope(site_id, (country_code)::text)
          )
        )
    $pol$;
  END IF;
END $$;

-- 3. Update transfers_select_sovereign on public.transfers
DROP POLICY IF EXISTS "transfers_select_sovereign" ON public.transfers;
CREATE POLICY "transfers_select_sovereign"
  ON public.transfers
  FOR SELECT
  USING (
    public.get_my_role() = 'group_ceo'::text
    OR (
      upper(COALESCE(country_code, ''::text)) = upper(public.get_my_country_code())
      AND (
        public.normalize_role(public.get_my_role()) = ANY (ARRAY[
          'country_managing_director'::text,
          'country_operations_director'::text,
          'country_supply_chain_director'::text,
          'country_finance_director'::text,
          'country_commercial_director'::text,
          'country_compliance_manager'::text,
          'auditor'::text
        ])
        OR (source_site_id = public.get_my_site_id())
        OR (dest_site_id = public.get_my_site_id())
        OR (source_region_code = public.get_my_region_code())
        OR (dest_region_code = public.get_my_region_code())
        OR public.is_site_in_my_authorized_scope((source_site_id)::text, (country_code)::text)
        OR public.is_site_in_my_authorized_scope((dest_site_id)::text, (country_code)::text)
        OR ((driver_id IS NOT NULL) AND ((driver_id)::text = (auth.uid())::text))
      )
    )
  );

COMMIT;
