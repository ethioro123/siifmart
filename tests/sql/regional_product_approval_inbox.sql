-- Staging-only behavioral regression; proposals, votes and all changes roll back.
BEGIN;
DO $$
DECLARE target public.sites%ROWTYPE; requester uuid; managers uuid[]; base_totals integer[]:='{}';
 base_layouts integer[]:='{}'; ids uuid[]; changes jsonb; request_id uuid; revision uuid;
 response jsonb; i integer; other_manager uuid; other_base integer; wrong_country text;
BEGIN
 SELECT s.* INTO target FROM public.sites s WHERE s.type='Store' AND s.country='ET'
 AND (SELECT count(*) FROM public.products p WHERE p.site_id=s.id AND p.status<>'archived'
  AND NOT EXISTS(SELECT 1 FROM public.inventory_requests r WHERE r.product_id=p.id::text AND r.status='pending' AND r.proposed_changes ? 'shelfPosition'))>=2
 AND (SELECT count(DISTINCT e.role) FROM public.employees e JOIN public.sites home ON home.id=e.site_id
  WHERE coalesce(e.region_code,home.region_code)=s.region_code AND home.country=s.country AND lower(coalesce(e.status,'active'))='active'
  AND e.role IN ('regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager'))=3
 ORDER BY s.id LIMIT 1;
 IF target.id IS NULL THEN RAISE EXCEPTION 'Missing staging region with all three approvers'; END IF;
 SELECT e.id INTO requester FROM public.employees e JOIN public.sites home ON home.id=e.site_id
 WHERE e.role='merchandising_specialist' AND e.region_code=target.region_code AND home.country=target.country
 AND lower(coalesce(e.status,'active'))='active' LIMIT 1;
 SELECT array_agg(id ORDER BY position) INTO managers FROM (
  SELECT DISTINCT ON (e.role) e.id,array_position(ARRAY['regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager'],e.role::text) AS position
  FROM public.employees e JOIN public.sites home ON home.id=e.site_id
  WHERE coalesce(e.region_code,home.region_code)=target.region_code AND home.country=target.country
  AND lower(coalesce(e.status,'active'))='active'
  AND e.role IN ('regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager') ORDER BY e.role,e.id
 ) members;
 SELECT e.id INTO other_manager FROM public.employees e JOIN public.sites home ON home.id=e.site_id
 WHERE e.role='regional_operations_manager' AND coalesce(e.region_code,home.region_code)<>target.region_code AND home.country=target.country
 AND lower(coalesce(e.status,'active'))='active' LIMIT 1;
 IF requester IS NULL OR other_manager IS NULL THEN RAISE EXCEPTION 'Missing requester or second-region fixtures'; END IF;
 SELECT array_agg(p.id),jsonb_agg(jsonb_build_object('productId',p.id,'shelfPosition',CASE WHEN p.shelf_position='Eye Level' THEN 'Bottom Shelf' ELSE 'Eye Level' END))
 INTO ids,changes FROM (SELECT p.* FROM public.products p WHERE p.site_id=target.id AND p.status<>'archived'
 AND NOT EXISTS(SELECT 1 FROM public.inventory_requests r WHERE r.product_id=p.id::text AND r.status='pending' AND r.proposed_changes ? 'shelfPosition') ORDER BY p.id LIMIT 2) p;
 -- Exercise the endpoint with real authenticated database permissions and RLS.
 EXECUTE 'SET LOCAL ROLE authenticated';
 FOR i IN 1..3 LOOP
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',managers[i],'role','authenticated')::text,true);
  response:=public.get_my_product_approval_inbox(target.country,1);
  base_totals:=array_append(base_totals,(response->>'total')::integer);
  base_layouts:=array_append(base_layouts,(response->>'planogramCount')::integer);
 END LOOP;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',other_manager,'role','authenticated')::text,true);
 response:=public.get_my_product_approval_inbox(target.country,25); other_base:=(response->>'total')::integer;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',requester,'role','authenticated')::text,true);
 BEGIN
  PERFORM public.get_my_product_approval_inbox(target.country,5); RAISE EXCEPTION 'Non-approver obtained inbox';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 response:=public.submit_planogram_layout_revision(target.id::text,target.country,changes,'MERCHANDISING: inbox rollback test');
 revision:=(response->>'revisionId')::uuid; request_id:=(response->'requestIds'->>0)::uuid;
 FOR i IN 1..3 LOOP
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',managers[i],'role','authenticated')::text,true);
  response:=public.get_my_product_approval_inbox(target.country,1);
  IF (response->>'total')::integer<>base_totals[i]+1 OR (response->>'planogramCount')::integer<>base_layouts[i]+1 THEN
   RAISE EXCEPTION 'Two-product revision must count as one request for each department'; END IF;
  IF jsonb_array_length(response->'items')>1 THEN RAISE EXCEPTION 'Inbox limit was ignored'; END IF;
 END LOOP;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',other_manager,'role','authenticated')::text,true);
 response:=public.get_my_product_approval_inbox(target.country,25);
 IF (response->>'total')::integer<>other_base THEN RAISE EXCEPTION 'Inbox crossed regional boundary'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',managers[1],'role','authenticated')::text,true);
 wrong_country:=CASE target.country WHEN 'ET' THEN 'KE' ELSE 'ET' END;
 BEGIN
  PERFORM public.get_my_product_approval_inbox(wrong_country,5); RAISE EXCEPTION 'Inbox crossed country boundary';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM public.approve_product_edit(request_id);
 response:=public.get_my_product_approval_inbox(target.country,25);
 IF (response->>'total')::integer<>base_totals[1] THEN RAISE EXCEPTION 'Already-voted revision remains in inbox'; END IF;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',managers[2],'role','authenticated')::text,true);
 response:=public.get_my_product_approval_inbox(target.country,25);
 IF (response->>'total')::integer<>base_totals[2]+1 THEN RAISE EXCEPTION 'Another departments vote incorrectly removed the request'; END IF;
 PERFORM public.reject_product_edit(request_id,'Inbox regression cleanup');
 response:=public.get_my_product_approval_inbox(target.country,25);
 IF (response->>'total')::integer<>base_totals[2] THEN RAISE EXCEPTION 'Rejected revision remains in inbox'; END IF;
 -- A manager cannot get their own proposal in their departmental queue.
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',managers[1],'role','authenticated')::text,true);
 response:=public.submit_planogram_layout_revision(target.id::text,target.country,changes,'MERCHANDISING: requester exclusion rollback test');
 response:=public.get_my_product_approval_inbox(target.country,25);
 IF (response->>'total')::integer<>base_totals[1] THEN RAISE EXCEPTION 'Requester was invited to approve own revision'; END IF;
 EXECUTE 'RESET ROLE';
END;
$$;
ROLLBACK;
