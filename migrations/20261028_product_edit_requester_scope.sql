-- A CEO may propose edits in an authorized country, but still cannot supply regional votes.
DO $migration$
DECLARE definition text; previous text; replacement text;
BEGIN
 definition:=pg_get_functiondef('private.guard_product_edit_request()'::regprocedure);
 previous:=$previous$SELECT 1 FROM public.sites target JOIN public.sites home ON home.id=actor.site_id
 WHERE target.id=p.site_id AND upper(target.country)=upper(home.country)$previous$;
 replacement:=$replacement$SELECT 1 FROM public.sites target LEFT JOIN public.sites home ON home.id=actor.site_id
 WHERE target.id=p.site_id AND (upper(target.country)=upper(home.country)
 OR (actor.role='group_ceo' AND public.is_country_in_my_authorized_scope(target.country)))$replacement$;
 IF position(previous IN definition)=0 THEN RAISE EXCEPTION 'Unexpected product request scope guard'; END IF;
 EXECUTE replace(definition,previous,replacement);
END;
$migration$;
