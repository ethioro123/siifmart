-- Transactional checks; no facility, links, stock, or zones persist after this file.
BEGIN;
DO $test$
DECLARE actor_id uuid; reg text; src uuid; other_src uuid; zone uuid; saved jsonb; created uuid;
BEGIN
 SELECT id INTO actor_id FROM public.employees WHERE role='group_ceo' AND lower(status)='active' LIMIT 1;
 SELECT code INTO reg FROM public.regions WHERE country='ET' AND status='active' LIMIT 1;
 SELECT id INTO src FROM public.sites WHERE country='ET' AND type='Warehouse' AND status='Active' LIMIT 1;
 SELECT id INTO other_src FROM public.sites WHERE country='KE' AND type='Warehouse' AND status='Active' LIMIT 1;
 IF actor_id IS NULL OR reg IS NULL OR src IS NULL OR other_src IS NULL THEN RAISE EXCEPTION 'Required country fixtures unavailable'; END IF;
 SELECT id INTO zone FROM public.logistics_zones WHERE country='ET' LIMIT 1;
 IF zone IS NULL THEN INSERT INTO public.logistics_zones(name,country) VALUES('Transactional verification','ET') RETURNING id INTO zone; END IF;
 PERFORM set_config('request.jwt.claims',json_build_object('sub',actor_id,'role','authenticated')::text,true);
 SET LOCAL ROLE authenticated;
 saved:=public.save_site_configuration(null,jsonb_build_object('name','Location verification','code','TEST-WH-'||txid_current(),'type','Warehouse','status','Active','country','ET','currency','ETB','region_code',reg,'logistics_zone_id',zone),array[src]);
 created:=(saved->>'id')::uuid;
 IF saved->>'barcode_prefix' !~ '^[0-9]{4}$' THEN RAISE EXCEPTION 'Bad barcode prefix'; END IF;
 IF saved->>'logistics_zone_id' IS DISTINCT FROM zone::text THEN RAISE EXCEPTION 'Zone assignment failed'; END IF;
 saved:=public.save_site_configuration(created,'{"logistics_zone_id":null}'::jsonb,null);
 IF saved->>'logistics_zone_id' IS NOT NULL THEN RAISE EXCEPTION 'Zone did not clear'; END IF;
 BEGIN
  PERFORM public.save_site_configuration(created,'{"name":"Should roll back"}'::jsonb,array[other_src]);
  RAISE EXCEPTION 'Expected cross-country rejection' USING ERRCODE='XX000';
 EXCEPTION WHEN raise_exception THEN NULL;
 END;
 IF (SELECT name FROM public.sites WHERE id=created)<>'Location verification' THEN RAISE EXCEPTION 'Atomic rollback failed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.site_replenishment_sources WHERE site_id=created AND source_site_id=src) THEN RAISE EXCEPTION 'Source links lost'; END IF;
 RESET ROLE;
END;
$test$;
SELECT 'Creation, numeric prefix, assignment clearing, cross-country rejection and atomic rollback passed' AS verification;
ROLLBACK;
