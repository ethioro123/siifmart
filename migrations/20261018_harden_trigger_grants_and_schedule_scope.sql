-- Follow-up for trigger ACL and schedule row scoping.

DROP POLICY IF EXISTS staff_schedules_insert ON public.staff_schedules;
DROP POLICY IF EXISTS staff_schedules_insert_scoped ON public.staff_schedules;
CREATE POLICY staff_schedules_insert_scoped ON public.staff_schedules
FOR INSERT TO authenticated
WITH CHECK (
  public.is_manager()
  AND upper(staff_schedules.country_code) = upper(public.get_my_country_code())
  AND public.is_site_in_my_authorized_scope(staff_schedules.site_id::text, staff_schedules.country_code)
);

DROP POLICY IF EXISTS staff_schedules_update ON public.staff_schedules;
DROP POLICY IF EXISTS staff_schedules_update_scoped ON public.staff_schedules;
CREATE POLICY staff_schedules_update_scoped ON public.staff_schedules
FOR UPDATE TO authenticated
USING (
  public.is_manager()
  AND upper(staff_schedules.country_code) = upper(public.get_my_country_code())
  AND public.is_site_in_my_authorized_scope(staff_schedules.site_id::text, staff_schedules.country_code)
)
WITH CHECK (
  public.is_manager()
  AND upper(staff_schedules.country_code) = upper(public.get_my_country_code())
  AND public.is_site_in_my_authorized_scope(staff_schedules.site_id::text, staff_schedules.country_code)
);

DROP POLICY IF EXISTS staff_schedules_delete ON public.staff_schedules;
DROP POLICY IF EXISTS staff_schedules_delete_scoped ON public.staff_schedules;
CREATE POLICY staff_schedules_delete_scoped ON public.staff_schedules
FOR DELETE TO authenticated
USING (
  public.is_manager()
  AND upper(staff_schedules.country_code) = upper(public.get_my_country_code())
  AND public.is_site_in_my_authorized_scope(staff_schedules.site_id::text, staff_schedules.country_code)
);

-- Trigger functions run as part of table writes and need no direct RPC grants.
DO $block$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.signature);
  END LOOP;
END;
$block$;
