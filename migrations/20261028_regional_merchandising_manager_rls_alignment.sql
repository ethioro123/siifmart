-- ============================================================================
-- Migration: 20261028_regional_merchandising_manager_rls_alignment.sql
-- Purpose:
--   Align PostgreSQL RLS helper functions, RPCs, and policies for
--   regional_merchandising_manager and regional merchandising workflows:
--   1. Update private.merchandising_site_scope() to resolve
--      COALESCE(actor.region_code, home.region_code) and include merchandiser.
--   2. Update private.merchandising_finance_scope() to resolve
--      COALESCE(actor.region_code, home.region_code).
--   3. Update private.product_edit_region_scope() and public.approve_product_edit()
--      to resolve COALESCE(e.region_code, home.region_code) so regional
--      3-of-3 product/price edit approvals work seamlessly whether region_code
--      is stored on the employee row or inherited from their Regional Hub site.
--   4. Update inv_requests_merchandising_read and pricing_rules RLS policies
--      so regional_merchandising_manager and merchandising_specialist can
--      view and manage Smart Rules and merchandising proposals in their scope.
-- ============================================================================

BEGIN;

-- 1. Update private.merchandising_site_scope
CREATE OR REPLACE FUNCTION private.merchandising_site_scope(
  p_site_id text,
  p_country_code text DEFAULT NULL::text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees actor
    JOIN public.sites home ON home.id = actor.site_id
    JOIN public.sites target ON target.id::text = p_site_id OR target.code = p_site_id
    WHERE actor.id = (SELECT auth.uid())
      AND COALESCE(lower(actor.status), 'active') = 'active'
      AND lower(actor.role) IN (
        'merchandising_specialist',
        'regional_merchandising_manager',
        'merchandiser',
        'country_commercial_director'
      )
      AND upper(home.country) = upper(target.country)
      AND (p_country_code IS NULL OR upper(p_country_code) = upper(target.country))
      AND (
        -- Country-level HQ commercial/merchandising leadership
        (home.type = 'Administration'
         AND home.code = upper(home.country) || '-HQ'
         AND home.region_code IS NULL
         AND actor.region_code IS NULL
         AND lower(actor.role) <> 'regional_merchandising_manager')
        -- Regional Administration hub merchandising leadership & specialists
        OR (COALESCE(actor.region_code, home.region_code) IS NOT NULL
            AND lower(target.region_code) = lower(COALESCE(actor.region_code, home.region_code)))
        -- Store-assigned merchandiser
        OR (home.id = target.id)
      )
  );
$$;

-- 2. Update private.merchandising_finance_scope
CREATE OR REPLACE FUNCTION private.merchandising_finance_scope(
  p_site_id text,
  p_country_code text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees actor
    JOIN public.sites home ON home.id = actor.site_id
    JOIN public.sites target ON target.id::text = p_site_id OR target.code = p_site_id
    WHERE actor.id = (SELECT auth.uid())
      AND COALESCE(lower(actor.status), 'active') = 'active'
      AND lower(actor.role) IN ('country_finance_director', 'regional_finance_manager', 'group_cfo', 'group_ceo')
      AND home.type = 'Administration'
      AND upper(home.country) = upper(target.country)
      AND upper(p_country_code) = upper(target.country)
      AND (
        (home.code = upper(home.country) || '-HQ'
          AND home.region_code IS NULL
          AND actor.region_code IS NULL
          AND lower(actor.role) <> 'regional_finance_manager')
        OR (COALESCE(actor.region_code, home.region_code) IS NOT NULL
          AND lower(target.region_code) = lower(COALESCE(actor.region_code, home.region_code)))
      )
  );
$$;

-- 3. Update private.product_edit_region_scope
CREATE OR REPLACE FUNCTION private.product_edit_region_scope(target_site text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    JOIN public.sites home ON home.id = e.site_id
    JOIN public.sites target ON target.id::text = target_site OR target.code = target_site
    WHERE e.id = (SELECT auth.uid())
      AND lower(COALESCE(e.status, 'active')) = 'active'
      AND lower(e.role) IN (
        'regional_operations_manager',
        'area_operations_manager',
        'regional_supply_chain_manager',
        'regional_merchandising_manager'
      )
      AND upper(home.country) = upper(target.country)
      AND COALESCE(e.region_code, home.region_code) IS NOT NULL
      AND lower(COALESCE(e.region_code, home.region_code)) = lower(target.region_code)
  );
$$;

-- 4. Update public.approve_product_edit to use COALESCE(e.region_code, home.region_code)
CREATE OR REPLACE FUNCTION public.approve_product_edit(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  actor public.employees%ROWTYPE;
  r public.inventory_requests%ROWTYPE;
  p public.products%ROWTYPE;
  next_product public.products%ROWTYPE;
  patch jsonb;
  votes jsonb;
  vote_count integer;
  baseline jsonb;
  assignments text;
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

-- 5. Update inv_requests_merchandising_read on public.inventory_requests
DROP POLICY IF EXISTS "inv_requests_merchandising_read" ON public.inventory_requests;
CREATE POLICY "inv_requests_merchandising_read"
  ON public.inventory_requests
  FOR SELECT
  USING (
    lower(public.get_my_role()) = ANY (ARRAY[
      'merchandising_specialist'::text,
      'regional_merchandising_manager'::text,
      'merchandiser'::text,
      'country_commercial_director'::text
    ])
    AND private.merchandising_site_scope(site_id, (country_code)::text)
  );

-- 6. Update pricing_rules policies to include regional_merchandising_manager and merchandising_specialist
DROP POLICY IF EXISTS "pricing_rules_select" ON public.pricing_rules;
CREATE POLICY "pricing_rules_select"
  ON public.pricing_rules
  FOR SELECT
  USING (
    (SELECT public.is_ceo())
    OR (
      upper((country_code)::text) = upper((SELECT public.get_my_country_code()))
      AND (
        (SELECT public.is_admin())
        OR lower((SELECT public.get_my_role())) = ANY (ARRAY[
          'country_commercial_director'::text,
          'regional_merchandising_manager'::text,
          'merchandising_specialist'::text,
          'merchandiser'::text,
          'regional_operations_manager'::text,
          'area_operations_manager'::text,
          'country_finance_director'::text,
          'regional_finance_manager'::text
        ])
      )
    )
  );

DROP POLICY IF EXISTS "pricing_rules_insert" ON public.pricing_rules;
CREATE POLICY "pricing_rules_insert"
  ON public.pricing_rules
  FOR INSERT
  WITH CHECK (
    (SELECT public.is_ceo())
    OR (
      upper((country_code)::text) = upper((SELECT public.get_my_country_code()))
      AND lower((SELECT public.get_my_role())) = ANY (ARRAY[
        'country_commercial_director'::text,
        'regional_merchandising_manager'::text,
        'merchandising_specialist'::text,
        'regional_operations_manager'::text
      ])
    )
  );

DROP POLICY IF EXISTS "pricing_rules_update" ON public.pricing_rules;
CREATE POLICY "pricing_rules_update"
  ON public.pricing_rules
  FOR UPDATE
  USING (
    (SELECT public.is_ceo())
    OR (
      upper((country_code)::text) = upper((SELECT public.get_my_country_code()))
      AND lower((SELECT public.get_my_role())) = ANY (ARRAY[
        'country_commercial_director'::text,
        'regional_merchandising_manager'::text,
        'merchandising_specialist'::text,
        'regional_operations_manager'::text
      ])
    )
  )
  WITH CHECK (
    (SELECT public.is_ceo())
    OR (
      upper((country_code)::text) = upper((SELECT public.get_my_country_code()))
      AND lower((SELECT public.get_my_role())) = ANY (ARRAY[
        'country_commercial_director'::text,
        'regional_merchandising_manager'::text,
        'merchandising_specialist'::text,
        'regional_operations_manager'::text
      ])
    )
  );

COMMIT;
