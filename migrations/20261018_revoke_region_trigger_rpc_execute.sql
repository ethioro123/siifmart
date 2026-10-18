-- Trigger functions are invoked by PostgreSQL and must not be callable as RPCs.
REVOKE ALL ON FUNCTION public.audit_region_settings_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_region_currency_and_leadership() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_site_region_country() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_regional_po_approval_scope_and_budget() FROM PUBLIC, anon, authenticated;
