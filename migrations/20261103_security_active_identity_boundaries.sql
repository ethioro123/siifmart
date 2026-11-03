BEGIN;
-- Identity comes from the signed-in employee UUID, not stale role/email claims.
CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT role::text FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,''))='active';
$$;
CREATE OR REPLACE FUNCTION public.get_auth_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT public.get_my_role(); $$;
CREATE OR REPLACE FUNCTION public.get_my_site_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT site_id FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,''))='active';
$$;
CREATE OR REPLACE FUNCTION public.get_my_region_code() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(e.region_code,s.region_code) FROM public.employees e LEFT JOIN public.sites s ON s.id=e.site_id
 WHERE e.id=auth.uid() AND lower(coalesce(e.status,''))='active';
$$;
CREATE OR REPLACE FUNCTION public.get_my_site_code_or_id() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT public.get_my_site_id()::text; $$;
CREATE OR REPLACE FUNCTION public.is_hq_executive() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(public.get_my_role() IN ('group_ceo','group_coo','group_cfo','group_cco','group_cmo','group_csco',
 'group_chro','group_cto','group_cio','group_clco','group_cae','country_managing_director','country_operations_director',
 'country_finance_director','country_commercial_director','country_supply_chain_director','country_hr_director',
 'country_technology_director','country_compliance_manager','auditor'),false);
$$;
-- Also cover legacy policies which read role claims directly, and definer writes.
DO $$ DECLARE target text; BEGIN
 FOREACH target IN ARRAY ARRAY['employee_documents','job_assignments','inventory_requests','system_logs','po_items',
 'staff_schedules','pricing_rules','discount_codes','logistics_zones','zones','category_zones','employee_tasks','stock_movements','sale_items','barcode_approvals'] LOOP
   IF to_regclass('public.'||target) IS NOT NULL THEN
     EXECUTE format('DROP POLICY IF EXISTS inactive_employee_read_guard ON public.%I',target);
     EXECUTE format('CREATE POLICY inactive_employee_read_guard ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING ((SELECT private.has_active_operational_employee()))',target);
     EXECUTE format('CREATE OR REPLACE TRIGGER require_active_operational_actor BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.require_active_operational_actor()',target);
   END IF;
 END LOOP;
END; $$;
-- Ordinary API identities never need whole-table clearing privileges.
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM PUBLIC,anon,authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE TRUNCATE ON TABLES FROM PUBLIC,anon,authenticated;
COMMIT;
