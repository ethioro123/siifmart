-- Global employees have no home site. Keep RLS and all country/role checks intact.
BEGIN;
DO $migration$
DECLARE
  definition text := pg_get_functiondef('public.get_my_approval_inbox(text)'::regprocedure);
  old_join constant text := 'FROM public.employees e JOIN public.sites s ON s.id=e.site_id';
  new_join constant text := 'FROM public.employees e LEFT JOIN public.sites s ON s.id=e.site_id';
BEGIN
  IF position(old_join IN definition) > 0 THEN
    EXECUTE replace(definition, old_join, new_join);
  ELSIF position(new_join IN definition) = 0 THEN
    RAISE EXCEPTION 'Unexpected approval inbox actor lookup; review before applying';
  END IF;
END;
$migration$;
COMMIT;
