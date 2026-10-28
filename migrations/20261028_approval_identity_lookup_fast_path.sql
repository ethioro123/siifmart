-- Keep caller RLS intact; use the employee UUID index before legacy email lookup.
CREATE OR REPLACE FUNCTION public.get_my_site_code_or_id()
RETURNS text LANGUAGE plpgsql STABLE SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_email text;
  v_site text;
BEGIN
  IF v_uid IS NOT NULL THEN
    SELECT e.site_id::text INTO v_site FROM public.employees e WHERE e.id = v_uid;
    IF FOUND THEN RETURN v_site; END IF;
  END IF;
  v_email := (SELECT auth.jwt() ->> 'email');
  IF v_email IS NOT NULL THEN
    SELECT e.site_id::text INTO v_site FROM public.employees e
    WHERE lower(e.email) = lower(v_email) LIMIT 1;
  END IF;
  RETURN v_site;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$function$;
