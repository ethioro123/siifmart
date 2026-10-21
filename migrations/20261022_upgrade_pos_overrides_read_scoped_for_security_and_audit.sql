-- Migration: Upgrade pos_supervisory_overrides read policy for Regional Security and Internal Audit
-- Applied to supabase-staging per Rule 9

DROP POLICY IF EXISTS pos_overrides_read_scoped ON public.pos_supervisory_overrides;
CREATE POLICY pos_overrides_read_scoped ON public.pos_supervisory_overrides
FOR SELECT TO authenticated
USING (
  is_ceo()
  OR (
    upper(country_code::text) = upper(get_my_country_code())
    AND normalize_role(get_my_role()) = ANY (ARRAY[
      'super_admin', 'ceo', 'admin', 'operations_manager', 'finance_manager',
      'auditor', 'head_of_audit', 'audit_head', 'store_operations_auditor',
      'store_manager', 'regional_manager', 'regional_finance_officer',
      'regional_security_supervisor', 'security_manager'
    ])
    AND is_site_in_my_authorized_scope(site_id, country_code::text)
  )
);
