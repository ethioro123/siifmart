-- The completion policy also resolves the current employee code.
-- Match the authenticated primary key before evaluating employee RLS.
BEGIN;
CREATE OR REPLACE FUNCTION public.get_my_employee_code() RETURNS text
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT e.code FROM public.employees e
 WHERE e.id=(SELECT auth.uid()) AND lower(coalesce(e.status,''))='active';
$$;
COMMIT;
