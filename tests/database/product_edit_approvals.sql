-- Run against staging with execute_sql. All test writes roll back.
BEGIN;
DO $$
DECLARE fixture record; requester uuid; actor record;
BEGIN
 SELECT p.id,p.site_id,p.name,p.stock,s.region_code,s.country INTO fixture
 FROM public.products p JOIN public.sites s ON s.id=p.site_id
 WHERE EXISTS(SELECT 1 FROM public.employees e WHERE e.site_id=s.id AND e.role='warehouse_manager')
 AND (SELECT count(DISTINCT e.role) FROM public.employees e JOIN public.sites h ON h.id=e.site_id
 WHERE e.region_code=s.region_code AND h.region_code=s.region_code AND h.country=s.country
 AND lower(coalesce(e.status,'active'))='active'
 AND e.role IN ('regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager'))=3
 LIMIT 1;
 IF fixture.id IS NULL THEN RAISE EXCEPTION 'No complete staging regional fixture'; END IF;
 SELECT id INTO requester FROM public.employees WHERE site_id=fixture.site_id AND role='warehouse_manager' LIMIT 1;
 PERFORM set_config('test.product',fixture.id::text,true);
 PERFORM set_config('test.site',fixture.site_id::text,true);
 PERFORM set_config('test.name',fixture.name,true);
 PERFORM set_config('test.stock',fixture.stock::text,true);
 PERFORM set_config('test.country',fixture.country,true);
 PERFORM set_config('test.requester',requester::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',requester,'role','authenticated')::text,true);
 FOR actor IN SELECT DISTINCT ON(e.role) e.id,e.role FROM public.employees e JOIN public.sites h ON h.id=e.site_id
 WHERE e.region_code=fixture.region_code AND h.region_code=fixture.region_code AND h.country=fixture.country
 AND lower(coalesce(e.status,'active'))='active'
 AND e.role IN ('regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager')
 ORDER BY e.role,e.id LOOP
  PERFORM set_config('test.'||actor.role,actor.id::text,true);
 END LOOP;
 PERFORM set_config('test.ceo',(SELECT id::text FROM public.employees WHERE role='group_ceo' LIMIT 1),true);
 PERFORM set_config('test.other_region',(SELECT e.id::text FROM public.employees e JOIN public.sites h ON h.id=e.site_id
 WHERE e.role='regional_operations_manager' AND e.region_code<>fixture.region_code AND h.country=fixture.country LIMIT 1),true);
 PERFORM set_config('test.other_country',(SELECT e.id::text FROM public.employees e JOIN public.sites h ON h.id=e.site_id
 WHERE e.role='regional_operations_manager' AND h.country<>fixture.country LIMIT 1),true);
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE request_id uuid; stale_id uuid; self_id uuid; ceo_proposal_id uuid; result jsonb; role_name text; actor_id text; attempted boolean;
BEGIN
 INSERT INTO public.inventory_requests(product_id,site_id,product_name,product_sku,change_type,status,country_code,proposed_changes)
 VALUES(current_setting('test.product'),current_setting('test.site'),current_setting('test.name'),'REGRESSION','edit','pending',
 current_setting('test.country'),jsonb_build_object('name',current_setting('test.name')||' [approval regression]')) RETURNING id INTO request_id;
 INSERT INTO public.inventory_requests(product_id,site_id,product_name,product_sku,change_type,status,country_code,proposed_changes)
 VALUES(current_setting('test.product'),current_setting('test.site'),current_setting('test.name'),'REGRESSION','edit','pending',
 current_setting('test.country'),jsonb_build_object('name',current_setting('test.name')||' stale')) RETURNING id INTO stale_id;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.regional_operations_manager'),'role','authenticated')::text,true);
 INSERT INTO public.inventory_requests(product_id,site_id,product_name,product_sku,change_type,status,country_code,proposed_changes)
 VALUES(current_setting('test.product'),current_setting('test.site'),current_setting('test.name'),'REGRESSION','edit','pending',
 current_setting('test.country'),jsonb_build_object('name',current_setting('test.name')||' self')) RETURNING id INTO self_id;
 attempted:=false;
 BEGIN PERFORM public.approve_product_edit(self_id); attempted:=true;
 EXCEPTION WHEN raise_exception THEN NULL; END;
 IF attempted THEN RAISE EXCEPTION 'Requester self-approved a product edit'; END IF;
 -- No CEO, foreign country, or foreign region may supply any of the three votes.
 FOREACH role_name IN ARRAY ARRAY['ceo','other_region','other_country'] LOOP
  actor_id:=current_setting('test.'||role_name,true);
  IF nullif(actor_id,'') IS NULL THEN RAISE EXCEPTION 'Missing negative fixture %',role_name; END IF;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor_id,'role','authenticated')::text,true);
  attempted:=false;
  BEGIN PERFORM public.approve_product_edit(request_id); attempted:=true;
  EXCEPTION WHEN raise_exception THEN NULL; END;
  IF attempted THEN RAISE EXCEPTION 'Unauthorized approver passed: %',role_name; END IF;
 END LOOP;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.ceo'),'role','authenticated')::text,true);
 INSERT INTO public.inventory_requests(product_id,site_id,product_name,product_sku,change_type,status,country_code,proposed_changes)
 VALUES(current_setting('test.product'),current_setting('test.site'),current_setting('test.name'),'REGRESSION','edit','pending',
 current_setting('test.country'),jsonb_build_object('name',current_setting('test.name')||' CEO proposal')) RETURNING id INTO ceo_proposal_id;
 -- Approval JSON cannot be forged through direct PATCH.
 attempted:=false;
 BEGIN UPDATE public.inventory_requests SET product_edit_approvals='[{"role":"regional_operations_manager"}]' WHERE id=request_id; attempted:=FOUND;
 EXCEPTION WHEN raise_exception THEN NULL; END;
 IF attempted THEN RAISE EXCEPTION 'Approval ledger was forged'; END IF;
 -- CEO direct catalog PATCH must also fail.
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.ceo'),'role','authenticated')::text,true);
 attempted:=false;
 BEGIN UPDATE public.products SET name=name||' bypass' WHERE id::text=current_setting('test.product'); attempted:=FOUND;
 EXCEPTION WHEN raise_exception THEN NULL; END;
 IF attempted THEN RAISE EXCEPTION 'CEO bypassed product edit approvals'; END IF;
 FOREACH role_name IN ARRAY ARRAY['regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager'] LOOP
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.'||role_name),'role','authenticated')::text,true);
  result:=public.approve_product_edit(request_id);
  IF role_name<>'regional_merchandising_manager' THEN
   IF (result->>'applied')::boolean OR (SELECT name FROM public.products WHERE id::text=current_setting('test.product'))<>current_setting('test.name') THEN
    RAISE EXCEPTION 'Product changed before all three approvals'; END IF;
   IF public.approve_product_edit(request_id)<>result THEN RAISE EXCEPTION 'Duplicate role vote was counted twice'; END IF;
  END IF;
 END LOOP;
 attempted:=false;
 BEGIN PERFORM public.approve_product_edit(stale_id); attempted:=true;
 EXCEPTION WHEN raise_exception THEN NULL; END;
 IF attempted THEN RAISE EXCEPTION 'Stale proposal approval was accepted'; END IF;
 PERFORM public.reject_product_edit(ceo_proposal_id,'Regression rejection');
 IF (SELECT status FROM public.inventory_requests WHERE id=ceo_proposal_id)<>'rejected' THEN RAISE EXCEPTION 'Regional rejection not saved'; END IF;
 IF result<>jsonb_build_object('applied',true,'approvalCount',3) THEN RAISE EXCEPTION 'Third approval did not apply'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.products WHERE id::text=current_setting('test.product')
 AND name=current_setting('test.name')||' [approval regression]' AND stock::text=current_setting('test.stock')) THEN
  RAISE EXCEPTION 'Final product result or stock preservation failed'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.inventory_requests WHERE id=request_id AND status='approved' AND jsonb_array_length(product_edit_approvals)=3) THEN
  RAISE EXCEPTION 'Approval audit trail missing'; END IF;
END $$;
ROLLBACK;
