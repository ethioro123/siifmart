-- Staging regression: all changes are rolled back, including votes and product placements.
BEGIN;
DO $$
DECLARE target public.sites%ROWTYPE; requester uuid; approver uuid; ids uuid[];
 changes jsonb; response jsonb; revision uuid; request_id uuid; initial_positions jsonb;
 required_role text; row_count integer;
BEGIN
 SELECT s.* INTO target FROM public.sites s WHERE s.type='Store' AND s.country='ET'
 AND (SELECT count(*) FROM public.products p WHERE p.site_id=s.id AND p.status<>'archived'
  AND NOT EXISTS(SELECT 1 FROM public.inventory_requests r WHERE r.product_id=p.id::text AND r.status='pending' AND r.proposed_changes ? 'shelfPosition'))>=2
 AND EXISTS(SELECT 1 FROM public.employees e JOIN public.sites home ON home.id=e.site_id WHERE e.role='merchandising_specialist' AND e.region_code=s.region_code AND home.country=s.country)
 ORDER BY s.id LIMIT 1;
 IF target.id IS NULL THEN RAISE EXCEPTION 'Staging fixtures need two available products and a merchandising requester'; END IF;
 SELECT e.id INTO requester FROM public.employees e JOIN public.sites home ON home.id=e.site_id
 WHERE e.role='merchandising_specialist' AND e.region_code=target.region_code AND home.country=target.country AND lower(coalesce(e.status,'active'))='active' LIMIT 1;
 SELECT array_agg(p.id),jsonb_agg(jsonb_build_object('productId',p.id,'shelfPosition',CASE WHEN p.shelf_position='Eye Level' THEN 'Bottom Shelf' ELSE 'Eye Level' END)),jsonb_object_agg(p.id::text,to_jsonb(p)->'shelf_position')
 INTO ids,changes,initial_positions FROM (SELECT p.* FROM public.products p WHERE p.site_id=target.id AND p.status<>'archived'
 AND NOT EXISTS(SELECT 1 FROM public.inventory_requests r WHERE r.product_id=p.id::text AND r.status='pending' AND r.proposed_changes ? 'shelfPosition') ORDER BY p.id LIMIT 2) p;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',requester,'role','authenticated')::text,true);
 -- Supplied country cannot override the target site's country.
 BEGIN
  PERFORM public.submit_planogram_layout_revision(target.id::text,'KE',changes,'staging rollback test');
  RAISE EXCEPTION 'Expected country scope rejection';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 response:=public.submit_planogram_layout_revision(target.id::text,target.country,changes,'staging rollback test');
 revision:=(response->>'revisionId')::uuid;
 IF (response->>'count')::integer<>2 THEN RAISE EXCEPTION 'Expected two submitted moves'; END IF;
 SELECT id INTO request_id FROM public.inventory_requests WHERE layout_revision_id=revision ORDER BY id LIMIT 1;
 BEGIN
  PERFORM public.submit_planogram_layout_revision(target.id::text,target.country,changes,'duplicate rollback test');
  RAISE EXCEPTION 'Duplicate submission was accepted';
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM<>'This product already has a pending shelf proposal' THEN RAISE; END IF;
 END;
 FOREACH required_role IN ARRAY ARRAY['regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager'] LOOP
  SELECT e.id INTO approver FROM public.employees e JOIN public.sites home ON home.id=e.site_id
  WHERE e.role=required_role AND e.region_code=target.region_code AND home.country=target.country AND lower(coalesce(e.status,'active'))='active' LIMIT 1;
  IF approver IS NULL THEN RAISE EXCEPTION 'Missing staging approver for %',required_role; END IF;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',approver,'role','authenticated')::text,true);
  response:=public.approve_product_edit(request_id);
  IF required_role<>'regional_merchandising_manager' THEN
   IF (response->>'applied')::boolean THEN RAISE EXCEPTION 'Layout applied before three votes'; END IF;
   IF (SELECT jsonb_object_agg(p.id::text,to_jsonb(p)->'shelf_position') FROM public.products p WHERE p.id=ANY(ids)) IS DISTINCT FROM initial_positions THEN RAISE EXCEPTION 'Early vote changed placements'; END IF;
  END IF;
 END LOOP;
 SELECT count(*) INTO row_count FROM public.inventory_requests WHERE layout_revision_id=revision AND status='approved';
 IF row_count<>2 OR NOT (response->>'applied')::boolean THEN RAISE EXCEPTION 'Complete layout was not applied'; END IF;
END;
$$;
ROLLBACK;
