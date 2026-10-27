BEGIN;
CREATE OR REPLACE FUNCTION private.approve_planogram_product_edit(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor public.employees%ROWTYPE;
  r public.inventory_requests%ROWTYPE;
  sibling public.inventory_requests%ROWTYPE;
  p public.products%ROWTYPE;
  next_product public.products%ROWTYPE;
  patch jsonb;
  votes jsonb;
  vote_count integer;
  baseline jsonb;
  assignments text;
  rev_id uuid;
BEGIN
  SELECT * INTO actor FROM public.employees WHERE id = auth.uid() AND lower(coalesce(status, 'active')) = 'active';
  SELECT * INTO r FROM public.inventory_requests WHERE id = p_request_id FOR UPDATE;

  IF actor.role NOT IN ('regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager') OR actor.id IS NULL OR r.id IS NULL OR r.change_type <> 'edit' OR r.status <> 'pending'
     OR NOT private.product_edit_region_scope(r.site_id) THEN
    RAISE EXCEPTION 'Product edit approval is outside your regional role or territory';
  END IF;

  IF actor.id = r.requested_by_employee_id OR lower(actor.name) = lower(r.requested_by) OR lower(actor.email) = lower(r.requested_by) THEN
    RAISE EXCEPTION 'Requesters cannot approve their own product edits';
  END IF;

  -- Single product edit approval path
  SELECT * INTO p FROM public.products WHERE id::text = r.product_id AND site_id::text = r.site_id FOR UPDATE;
  IF p.id IS NULL THEN RAISE EXCEPTION 'Product no longer exists at this site'; END IF;

  patch := private.product_edit_patch(r.proposed_changes);
  SELECT jsonb_object_agg(k, to_jsonb(p)->k) INTO baseline FROM jsonb_object_keys(patch) k;
  IF r.product_edit_baseline IS NULL OR baseline IS DISTINCT FROM r.product_edit_baseline THEN
    RAISE EXCEPTION 'Product changed since this proposal; submit a fresh edit';
  END IF;

  next_product := jsonb_populate_record(p, patch);
  IF next_product.price < 0 OR next_product.cost_price < 0 OR next_product.sale_price < 0
     OR next_product.min_stock < 0 OR next_product.max_stock < 0 OR next_product.max_stock < next_product.min_stock
     OR length(trim(next_product.name)) = 0 OR length(trim(next_product.sku)) = 0 THEN
    RAISE EXCEPTION 'Invalid product values or stock thresholds';
  END IF;

  IF patch ?| ARRAY['price', 'cost_price', 'sale_price', 'is_on_sale'] THEN
    IF (CASE WHEN next_product.is_on_sale AND next_product.sale_price > 0 THEN next_product.sale_price ELSE next_product.price END) <= 0 THEN
      RAISE EXCEPTION 'Selling price must be positive';
    END IF;
    IF next_product.cost_price > 0 AND (1 - next_product.cost_price / (CASE WHEN next_product.is_on_sale AND next_product.sale_price > 0 THEN next_product.sale_price ELSE next_product.price END)) * 100 < 15
       AND r.finance_approved_by_employee_id IS NULL THEN
      RAISE EXCEPTION 'Finance co-approval is required below the margin floor';
    END IF;
  END IF;

  INSERT INTO private.product_edit_votes(request_id, employee_id, role, employee_name)
  VALUES (r.id, actor.id, actor.role, actor.name) ON CONFLICT (request_id, role) DO NOTHING;

  SELECT count(*), jsonb_agg(jsonb_build_object('employeeId', v.employee_id, 'name', v.employee_name, 'role', v.role, 'approvedAt', v.approved_at) ORDER BY v.role)
    INTO vote_count, votes FROM private.product_edit_votes v WHERE v.request_id = r.id;

  UPDATE public.inventory_requests SET product_edit_approvals = votes WHERE id = r.id;

  IF vote_count < 3 THEN
    RETURN jsonb_build_object('applied', false, 'approvalCount', vote_count);
  END IF;

  IF EXISTS (
    SELECT 1 FROM private.product_edit_votes v
    WHERE v.request_id = r.id AND NOT EXISTS (
      SELECT 1 FROM public.employees e
      JOIN public.sites home ON home.id = e.site_id
      JOIN public.sites target ON target.id = p.site_id
      WHERE e.id = v.employee_id
        AND lower(coalesce(e.status, 'active')) = 'active'
        AND e.role = v.role
        AND lower(COALESCE(e.region_code, home.region_code)) = lower(target.region_code)
        AND upper(home.country) = upper(target.country)
    )
  ) THEN
    RAISE EXCEPTION 'An approver no longer holds the authorized regional role; submit a fresh edit';
  END IF;

  PERFORM set_config('app.product_edit_decision_id', r.id::text, true);
  SELECT string_agg(format('%I = ($1).%I', k, k), ',') INTO assignments FROM jsonb_object_keys(patch) k;
  EXECUTE format('UPDATE public.products SET %s WHERE id=$2', assignments) USING next_product, p.id;
  UPDATE public.inventory_requests SET status = 'approved', approved_by = actor.name, approved_at = now() WHERE id = r.id;
  PERFORM set_config('app.product_edit_decision_id', '', true);

  RETURN jsonb_build_object('applied', true, 'approvalCount', 3);
END;
$$;


REVOKE ALL ON FUNCTION private.approve_planogram_product_edit(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.approve_product_edit(p_request_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.inventory_requests%ROWTYPE; sibling public.inventory_requests%ROWTYPE;
 result jsonb; first_result jsonb;
BEGIN
 SELECT * INTO r FROM public.inventory_requests WHERE id=p_request_id;
 IF r.id IS NULL THEN RAISE EXCEPTION 'Proposal not found'; END IF;
 IF r.layout_revision_id IS NULL THEN RETURN private.approve_planogram_product_edit(p_request_id); END IF;
 -- All decisions lock the revision before any member to avoid opposing row lock order.
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(r.layout_revision_id::text,0));
 PERFORM id FROM public.inventory_requests WHERE layout_revision_id=r.layout_revision_id ORDER BY id FOR UPDATE;
 IF EXISTS(SELECT 1 FROM public.inventory_requests WHERE layout_revision_id=r.layout_revision_id
   AND (status<>'pending' OR site_id IS DISTINCT FROM r.site_id OR country_code IS DISTINCT FROM r.country_code
     OR requested_by_employee_id IS DISTINCT FROM r.requested_by_employee_id OR change_type<>'edit'
     OR (SELECT count(*) FROM jsonb_object_keys(proposed_changes))<>1 OR NOT proposed_changes ? 'shelfPosition')) THEN
   RAISE EXCEPTION 'The complete layout revision must be pending and contain only same-store shelf moves';
 END IF;
 IF EXISTS(SELECT product_id FROM public.inventory_requests WHERE layout_revision_id=r.layout_revision_id GROUP BY product_id HAVING count(*)>1) THEN
   RAISE EXCEPTION 'Layout revision contains duplicate products';
 END IF;
 -- Each member passes the same baseline, requester, scope, active-voter and value checks.
 FOR sibling IN SELECT * FROM public.inventory_requests WHERE layout_revision_id=r.layout_revision_id ORDER BY product_id,id LOOP
   result:=private.approve_planogram_product_edit(sibling.id);
   IF first_result IS NULL THEN first_result:=result;
   ELSIF result IS DISTINCT FROM first_result THEN
     RAISE EXCEPTION 'Layout approval records are inconsistent; submit a fresh revision';
   END IF;
 END LOOP;
 RETURN first_result || jsonb_build_object('revisionId',r.layout_revision_id);
END;
$$;
REVOKE ALL ON FUNCTION public.approve_product_edit(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.approve_product_edit(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.submit_planogram_layout_revision(p_site_id text,p_country_code text,p_changes jsonb,p_reason text DEFAULT 'MERCHANDISING: planogram layout revision')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; target public.sites%ROWTYPE; product public.products%ROWTYPE;
 item jsonb; revision uuid:=gen_random_uuid(); ids uuid[]:='{}'; request_id uuid;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active';
 SELECT * INTO target FROM public.sites WHERE id::text=p_site_id;
 IF actor.id IS NULL OR target.id IS NULL OR target.type<>'Store'
 OR upper(target.country) IS DISTINCT FROM upper(p_country_code)
 OR actor.role NOT IN ('group_ceo','country_managing_director','country_commercial_director','country_operations_director','country_supply_chain_director','regional_operations_manager','area_operations_manager','regional_supply_chain_manager','regional_merchandising_manager','merchandising_specialist','merchandiser','store_manager')
 OR NOT public.is_site_in_my_authorized_scope(p_site_id,p_country_code) AND NOT private.merchandising_site_scope(p_site_id,p_country_code) THEN
   RAISE EXCEPTION 'Planogram preparation is outside your authorized store or role' USING ERRCODE='42501';
 END IF;
 IF p_changes IS NULL OR jsonb_typeof(p_changes)<>'array' THEN RAISE EXCEPTION 'Supply a list of shelf moves'; END IF;
 IF jsonb_array_length(p_changes) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Supply between 1 and 100 shelf moves'; END IF;
 IF (SELECT count(DISTINCT value->>'productId') FROM jsonb_array_elements(p_changes))<>jsonb_array_length(p_changes) THEN
   RAISE EXCEPTION 'A product may appear only once in a layout revision';
 END IF;
 -- Sorted product locks serialize overlapping submissions without locking the whole store.
 FOR item IN SELECT value FROM jsonb_array_elements(p_changes) ORDER BY value->>'productId' LOOP
   IF item->>'shelfPosition' IS NULL OR item->>'shelfPosition' NOT IN ('Eye Level','Top Shelf','Bottom Shelf','End Cap','Checkout','Back Aisle','Secure') THEN
     RAISE EXCEPTION 'Unsupported shelf position';
   END IF;
   SELECT * INTO product FROM public.products WHERE id::text=item->>'productId' AND site_id=target.id FOR UPDATE;
   IF product.id IS NULL OR product.status='archived' THEN RAISE EXCEPTION 'Product is unavailable at this store'; END IF;
   IF product.shelf_position IS NOT DISTINCT FROM item->>'shelfPosition' THEN RAISE EXCEPTION 'Shelf move does not change the placement'; END IF;
   IF EXISTS(SELECT 1 FROM public.inventory_requests WHERE product_id=product.id::text AND site_id=p_site_id AND status='pending' AND proposed_changes ? 'shelfPosition') THEN
     RAISE EXCEPTION 'This product already has a pending shelf proposal';
   END IF;
   INSERT INTO public.inventory_requests(site_id,product_id,product_name,product_sku,country_code,region_code,change_type,status,requested_by,requested_by_employee_id,requested_at,proposed_changes,adjustment_reason,layout_revision_id)
   VALUES(p_site_id,product.id::text,product.name,product.sku,upper(target.country),target.region_code,'edit','pending',actor.name,actor.id,now(),jsonb_build_object('shelfPosition',item->>'shelfPosition'),left(coalesce(nullif(trim(p_reason),''),'MERCHANDISING: shelf moves'),1200),revision)
   RETURNING id INTO request_id;
   ids:=array_append(ids,request_id);
 END LOOP;
 RETURN jsonb_build_object('revisionId',revision,'count',cardinality(ids),'requestIds',to_jsonb(ids));
END;
$$;
REVOKE ALL ON FUNCTION public.submit_planogram_layout_revision(text,text,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.submit_planogram_layout_revision(text,text,jsonb,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_product_edit(p_request_id uuid,p_reason text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r public.inventory_requests%ROWTYPE; actor public.employees%ROWTYPE;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND lower(coalesce(status,'active'))='active';
 SELECT * INTO r FROM public.inventory_requests WHERE id=p_request_id;
 IF actor.id IS NULL OR r.id IS NULL OR NOT private.product_edit_region_scope(r.site_id)
 OR actor.role NOT IN ('regional_operations_manager','regional_supply_chain_manager','regional_merchandising_manager')
 OR length(trim(coalesce(p_reason,''))) NOT BETWEEN 1 AND 1200 THEN RAISE EXCEPTION 'Regional approver and a reason required'; END IF;
 IF r.layout_revision_id IS NOT NULL THEN
   PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(r.layout_revision_id::text,0));
   PERFORM id FROM public.inventory_requests WHERE layout_revision_id=r.layout_revision_id ORDER BY id FOR UPDATE;
 ELSE
   PERFORM id FROM public.inventory_requests WHERE id=r.id FOR UPDATE;
 END IF;
 IF EXISTS(SELECT 1 FROM public.inventory_requests WHERE (id=r.id OR (r.layout_revision_id IS NOT NULL AND layout_revision_id=r.layout_revision_id))
    AND (status<>'pending' OR change_type<>'edit' OR site_id IS DISTINCT FROM r.site_id)) THEN RAISE EXCEPTION 'Proposal is no longer pending'; END IF;
 UPDATE public.inventory_requests SET status='rejected',rejection_reason=trim(p_reason),rejected_by=actor.name,rejected_at=now()
 WHERE id=r.id OR (r.layout_revision_id IS NOT NULL AND layout_revision_id=r.layout_revision_id);
END;
$$;
REVOKE ALL ON FUNCTION public.reject_product_edit(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.reject_product_edit(uuid,text) TO authenticated;
COMMIT;
