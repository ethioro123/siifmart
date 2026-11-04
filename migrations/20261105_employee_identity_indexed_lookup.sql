-- Resolve only the authenticated active employee using its primary key.
-- Keep SECURITY INVOKER and existing RLS; do not scan other employees by email.
BEGIN;
CREATE OR REPLACE FUNCTION public.get_my_employee_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT e.id FROM public.employees e
 WHERE e.id=(SELECT auth.uid()) AND lower(coalesce(e.status,''))='active';
$$;
COMMIT;
