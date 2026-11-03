BEGIN;
CREATE FUNCTION private.has_active_operational_employee() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT EXISTS(SELECT 1 FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,''))='active');
$$;
REVOKE ALL ON FUNCTION private.has_active_operational_employee() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.has_active_operational_employee() TO authenticated;
DO $$ DECLARE target text; BEGIN
 FOREACH target IN ARRAY ARRAY['sites','purchase_orders','transfers','sales','expenses','products','wms_jobs','shifts','vendor_invoices','ar_invoices'] LOOP
 EXECUTE format('CREATE POLICY active_employee_read_guard ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING ((SELECT private.has_active_operational_employee()))',target);
 END LOOP;
END; $$;
CREATE POLICY active_employee_profile_read_guard ON public.employees AS RESTRICTIVE FOR SELECT TO authenticated
 USING((SELECT private.has_active_operational_employee()) OR id=(SELECT auth.uid()));
-- Retain operational evidence. Clearing browser caches and unsaved local drafts
-- is unaffected; persisted jobs and financial entries are business records.
DO $$ DECLARE target text; BEGIN
 FOREACH target IN ARRAY ARRAY['wms_jobs','sales','expenses','shifts','vendor_invoices','ar_invoices'] LOOP
 EXECUTE format('REVOKE DELETE,TRUNCATE ON public.%I FROM anon,authenticated',target);
 EXECUTE format('CREATE TRIGGER preserve_lifecycle_evidence BEFORE DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION private.reject_operational_record_delete()',target);
 END LOOP;
END; $$;
COMMIT;
