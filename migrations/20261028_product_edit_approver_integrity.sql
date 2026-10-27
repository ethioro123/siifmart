-- A prior vote remains usable only while its employee still holds that regional role.
DO $migration$
DECLARE definition text; previous text; replacement text;
BEGIN
 definition:=pg_get_functiondef('public.approve_product_edit(uuid)'::regprocedure);
 previous:=$previous$IF EXISTS(SELECT 1 FROM private.product_edit_votes v JOIN public.employees e ON e.id=v.employee_id
 JOIN public.sites home ON home.id=e.site_id JOIN public.sites target ON target.id=p.site_id
 WHERE v.request_id=r.id AND (lower(coalesce(e.status,'active'))<>'active' OR e.role<>v.role
 OR e.region_code IS DISTINCT FROM target.region_code OR home.region_code IS DISTINCT FROM target.region_code
 OR upper(home.country) IS DISTINCT FROM upper(target.country)))$previous$;
 replacement:=$replacement$IF EXISTS(SELECT 1 FROM private.product_edit_votes v
 WHERE v.request_id=r.id AND NOT EXISTS(
 SELECT 1 FROM public.employees e JOIN public.sites home ON home.id=e.site_id
 JOIN public.sites target ON target.id=p.site_id WHERE e.id=v.employee_id
 AND lower(coalesce(e.status,'active'))='active' AND e.role=v.role
 AND e.region_code=target.region_code AND home.region_code=target.region_code
 AND upper(home.country)=upper(target.country)))$replacement$;
 IF position(previous IN definition)=0 THEN RAISE EXCEPTION 'Unexpected approval function definition'; END IF;
 EXECUTE replace(definition,previous,replacement);
END;
$migration$;
