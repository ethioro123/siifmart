-- Rollback-only authenticated regression for the approval inbox identity fast path.
BEGIN;
DO $test$
DECLARE actor record; actual text; response jsonb; checked integer := 0;
BEGIN
 IF (SELECT prosecdef FROM pg_proc WHERE oid='public.get_my_site_code_or_id()'::regprocedure) THEN
   RAISE EXCEPTION 'Identity helper must retain caller RLS';
 END IF;
 FOR actor IN SELECT DISTINCT ON (e.role) e.id,e.email,e.site_id,s.country
 FROM public.employees e JOIN public.sites s ON s.id=e.site_id
 WHERE lower(e.status)='active' AND e.role IN
 ('regional_merchandising_manager','regional_operations_manager','regional_procurement_manager',
 'country_commercial_director','country_finance_director','country_managing_director')
 ORDER BY e.role,e.id LOOP
   PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor.id,'email',actor.email,'role','authenticated')::text,true);
   EXECUTE 'SET LOCAL ROLE authenticated';
   actual:=public.get_my_site_code_or_id();
   IF actual IS DISTINCT FROM actor.site_id::text THEN RAISE EXCEPTION 'Own site lookup failed'; END IF;
   response:=public.get_my_approval_inbox(actor.country);
   IF jsonb_typeof(response->'queues') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Inbox failed'; END IF;
   BEGIN
     PERFORM public.get_my_approval_inbox(CASE WHEN actor.country='ET' THEN 'KE' ELSE 'ET' END);
     RAISE EXCEPTION 'Cross-country inbox unexpectedly allowed';
   EXCEPTION WHEN insufficient_privilege THEN NULL;
   END;
   EXECUTE 'RESET ROLE';
   checked:=checked+1;
 END LOOP;
 IF checked=0 THEN RAISE EXCEPTION 'Missing approval actor fixtures'; END IF;
 PERFORM set_config('request.jwt.claims','{}',true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 IF public.get_my_site_code_or_id() IS NOT NULL THEN RAISE EXCEPTION 'Anonymous site must be absent'; END IF;
 EXECUTE 'RESET ROLE';
END;
$test$;
ROLLBACK;
