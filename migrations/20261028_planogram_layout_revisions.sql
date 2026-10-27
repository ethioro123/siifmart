-- Migration: 20261028_planogram_layout_revisions.sql
-- Enables atomic multi-product planogram layout revisions, joint approvals, and all shelf position fixtures

DO $migration$
BEGIN
  -- 1. Add layout_revision_id column to inventory_requests
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'inventory_requests' 
      AND column_name = 'layout_revision_id'
  ) THEN
    ALTER TABLE public.inventory_requests ADD COLUMN layout_revision_id uuid;
  END IF;

  CREATE INDEX IF NOT EXISTS idx_inventory_requests_layout_revision 
    ON public.inventory_requests(layout_revision_id) 
    WHERE layout_revision_id IS NOT NULL;
END;
$migration$;

-- 2. Atomic submission RPC for planogram layout revisions
CREATE OR REPLACE FUNCTION public.submit_planogram_layout_revision(
  p_site_id text,
  p_country_code text,
  p_changes jsonb,
  p_reason text DEFAULT 'MERCHANDISING: planogram layout revision'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_revision_id uuid := gen_random_uuid();
  v_item jsonb;
  v_prod public.products%ROWTYPE;
  v_count integer := 0;
  v_allowed_positions text[] := ARRAY['Eye Level', 'Top Shelf', 'Bottom Shelf', 'End Cap', 'Checkout', 'Back Aisle', 'Secure'];
  v_target_pos text;
  v_inserted_ids uuid[] := ARRAY[]::uuid[];
  v_new_id uuid;
BEGIN
  IF p_changes IS NULL OR jsonb_typeof(p_changes) <> 'array' OR jsonb_array_length(p_changes) = 0 THEN
    RAISE EXCEPTION 'A layout revision must include at least one product change';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_changes)
  LOOP
    v_target_pos := trim(v_item->>'shelfPosition');
    IF v_target_pos IS NULL OR NOT (v_target_pos = ANY(v_allowed_positions)) THEN
      RAISE EXCEPTION 'Invalid shelf position "%" in layout revision. Supported positions: %', v_target_pos, array_to_string(v_allowed_positions, ', ');
    END IF;

    SELECT * INTO v_prod FROM public.products 
    WHERE id::text = (v_item->>'productId') 
      AND site_id::text = p_site_id;

    IF v_prod.id IS NULL THEN
      RAISE EXCEPTION 'Product % not found at site %', (v_item->>'productId'), p_site_id;
    END IF;

    INSERT INTO public.inventory_requests (
      site_id,
      product_id,
      product_name,
      product_sku,
      change_type,
      status,
      proposed_changes,
      adjustment_reason,
      layout_revision_id
    ) VALUES (
      p_site_id,
      v_prod.id::text,
      v_prod.name,
      v_prod.sku,
      'edit',
      'pending',
      jsonb_build_object('shelfPosition', v_target_pos),
      coalesce(p_reason, 'MERCHANDISING: planogram layout revision'),
      v_revision_id
    ) RETURNING id INTO v_new_id;

    v_inserted_ids := array_append(v_inserted_ids, v_new_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'revisionId', v_revision_id,
    'count', v_count,
    'requestIds', to_jsonb(v_inserted_ids)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.submit_planogram_layout_revision(text, text, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_planogram_layout_revision(text, text, jsonb, text) TO authenticated;

-- 3. Update public.approve_product_edit to handle atomic layout revision approvals
CREATE OR REPLACE FUNCTION public.approve_product_edit(p_request_id uuid)
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

  IF actor.id IS NULL OR r.id IS NULL OR r.change_type <> 'edit' OR r.status <> 'pending'
     OR NOT private.product_edit_region_scope(r.site_id) THEN
    RAISE EXCEPTION 'Product edit approval is outside your regional role or territory';
  END IF;

  IF actor.id = r.requested_by_employee_id OR lower(actor.name) = lower(r.requested_by) OR lower(actor.email) = lower(r.requested_by) THEN
    RAISE EXCEPTION 'Requesters cannot approve their own product edits';
  END IF;

  rev_id := r.layout_revision_id;

  -- If this edit is part of an atomic layout revision, vote for all sibling items together
  IF rev_id IS NOT NULL THEN
    FOR sibling IN 
      SELECT * FROM public.inventory_requests 
      WHERE layout_revision_id = rev_id AND status = 'pending' 
      FOR UPDATE
    LOOP
      INSERT INTO private.product_edit_votes(request_id, employee_id, role, employee_name)
      VALUES (sibling.id, actor.id, actor.role, actor.name) 
      ON CONFLICT (request_id, role) DO NOTHING;

      SELECT count(*), jsonb_agg(jsonb_build_object('employeeId', v.employee_id, 'name', v.employee_name, 'role', v.role, 'approvedAt', v.approved_at) ORDER BY v.role)
      INTO vote_count, votes FROM private.product_edit_votes v WHERE v.request_id = sibling.id;

      UPDATE public.inventory_requests SET product_edit_approvals = votes WHERE id = sibling.id;
    END LOOP;

    -- If 3 votes reached, apply all changes in the revision atomically
    IF vote_count >= 3 THEN
      FOR sibling IN 
        SELECT * FROM public.inventory_requests 
        WHERE layout_revision_id = rev_id AND status = 'pending'
      LOOP
        SELECT * INTO p FROM public.products WHERE id::text = sibling.product_id AND site_id::text = sibling.site_id FOR UPDATE;
        IF p.id IS NOT NULL THEN
          patch := private.product_edit_patch(sibling.proposed_changes);
          next_product := jsonb_populate_record(p, patch);
          PERFORM set_config('app.product_edit_decision_id', sibling.id::text, true);
          SELECT string_agg(format('%I = ($1).%I', k, k), ',') INTO assignments FROM jsonb_object_keys(patch) k;
          EXECUTE format('UPDATE public.products SET %s WHERE id=$2', assignments) USING next_product, p.id;
          UPDATE public.inventory_requests SET status = 'approved', approved_by = actor.name, approved_at = now() WHERE id = sibling.id;
          PERFORM set_config('app.product_edit_decision_id', '', true);
        END IF;
      END LOOP;
      RETURN jsonb_build_object('applied', true, 'approvalCount', 3, 'revisionId', rev_id);
    END IF;

    RETURN jsonb_build_object('applied', false, 'approvalCount', vote_count, 'revisionId', rev_id);
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

-- 4. Update public.reject_product_edit to handle atomic layout revision rejections
CREATE OR REPLACE FUNCTION public.reject_product_edit(p_request_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor public.employees%ROWTYPE;
  r public.inventory_requests%ROWTYPE;
BEGIN
  SELECT * INTO actor FROM public.employees WHERE id = auth.uid() AND lower(coalesce(status, 'active')) = 'active';
  SELECT * INTO r FROM public.inventory_requests WHERE id = p_request_id FOR UPDATE;

  IF r.id IS NULL OR r.change_type <> 'edit' OR r.status <> 'pending'
     OR NOT private.product_edit_region_scope(r.site_id) OR length(trim(coalesce(p_reason, ''))) = 0 THEN
    RAISE EXCEPTION 'Regional manager and a reason required to reject pending product edits';
  END IF;

  IF r.layout_revision_id IS NOT NULL THEN
    UPDATE public.inventory_requests
    SET status = 'rejected',
        rejection_reason = trim(p_reason),
        rejected_by = coalesce(actor.name, (SELECT name FROM public.employees WHERE id = auth.uid())),
        rejected_at = now()
    WHERE layout_revision_id = r.layout_revision_id
      AND status = 'pending';
  ELSE
    UPDATE public.inventory_requests
    SET status = 'rejected',
        rejection_reason = trim(p_reason),
        rejected_by = coalesce(actor.name, (SELECT name FROM public.employees WHERE id = auth.uid())),
        rejected_at = now()
    WHERE id = r.id;
  END IF;
END;
$$;
