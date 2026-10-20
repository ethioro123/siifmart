ALTER TABLE public.inventory_requests
  ADD COLUMN finance_approved_by_employee_id uuid REFERENCES public.employees(id),
  ADD COLUMN finance_approved_at timestamptz;

CREATE FUNCTION private.merchandising_decision_matches(p_product_id uuid, p_site_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.inventory_requests request
    WHERE request.id::text = current_setting('app.merchandising_decision_id', true)
      AND request.product_id = p_product_id::text
      AND request.site_id = p_site_id::text
      AND request.status = 'pending'
      AND (request.adjustment_reason LIKE 'PRICE_CHANGE%'
           OR request.adjustment_reason LIKE 'MERCHANDISING:%')
      AND (
        lower(public.get_my_role()) IN ('super_admin','ceo')
        OR (
          lower(public.get_my_role()) IN (
            'head_of_merchandising','merchandising_head','merchandising_manager',
            'regional_merchandising_lead'
          )
          AND private.merchandising_site_scope(request.site_id, request.country_code::text)
        )
      )
  );
$function$;
REVOKE ALL ON FUNCTION private.merchandising_decision_matches(uuid,uuid)
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.enforce_product_update_restrictions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $function$
DECLARE emp_role text;
DECLARE emp_id uuid;
DECLARE has_active_job boolean;
DECLARE decision_kind text;
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  emp_role := public.get_my_role();
  emp_id := public.get_my_employee_id();

  IF private.merchandising_decision_matches(OLD.id, OLD.site_id) THEN
    SELECT adjustment_reason INTO decision_kind
      FROM public.inventory_requests
      WHERE id::text = current_setting('app.merchandising_decision_id', true);
    IF decision_kind LIKE 'PRICE_CHANGE%'
       AND (to_jsonb(NEW) - ARRAY['price','cost_price','sale_price','is_on_sale','updated_at'])
         = (to_jsonb(OLD) - ARRAY['price','cost_price','sale_price','is_on_sale','updated_at'])
       THEN RETURN NEW;
    END IF;
    IF decision_kind LIKE 'MERCHANDISING:%'
       AND (to_jsonb(NEW) - ARRAY['name','category','brand','description','image','shelf_position','updated_at'])
         = (to_jsonb(OLD) - ARRAY['name','category','brand','description','image','shelf_position','updated_at'])
       THEN RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Merchandising decision attempted unrelated product fields';
  END IF;

  IF emp_role = 'super_admin' THEN RETURN NEW; END IF;
  IF (OLD.price IS DISTINCT FROM NEW.price OR OLD.sale_price IS DISTINCT FROM NEW.sale_price
      OR OLD.cost_price IS DISTINCT FROM NEW.cost_price OR OLD.is_on_sale IS DISTINCT FROM NEW.is_on_sale)
     AND emp_role NOT IN ('procurement_manager', 'procurement', 'CEO', 'ceo') THEN
    RAISE EXCEPTION 'Only the CEO and Procurement staff can modify product pricing or cost fields.';
  END IF;
  IF (OLD.name IS DISTINCT FROM NEW.name OR OLD.sku IS DISTINCT FROM NEW.sku
      OR OLD.category IS DISTINCT FROM NEW.category OR OLD.brand IS DISTINCT FROM NEW.brand
      OR OLD.size IS DISTINCT FROM NEW.size OR OLD.unit IS DISTINCT FROM NEW.unit
      OR OLD.description IS DISTINCT FROM NEW.description OR OLD.image IS DISTINCT FROM NEW.image
      OR OLD.custom_attributes IS DISTINCT FROM NEW.custom_attributes
      OR OLD.min_stock IS DISTINCT FROM NEW.min_stock OR OLD.max_stock IS DISTINCT FROM NEW.max_stock
      OR OLD.pack_quantity IS DISTINCT FROM NEW.pack_quantity)
     AND emp_role NOT IN ('regional_manager', 'super_admin', 'CEO', 'ceo', 'admin') THEN
    RAISE EXCEPTION 'Only the CEO and Regional Managers can edit product details.';
  END IF;
  IF OLD.stock IS DISTINCT FROM NEW.stock THEN
    IF emp_role IN ('super_admin', 'CEO', 'ceo', 'admin', 'inventory_controller', 'supply_chain_director') THEN
      NULL;
    ELSE
      SELECT EXISTS (
        SELECT 1 FROM public.job_assignments ja
        JOIN public.wms_jobs j ON j.id = ja.job_id
        WHERE ja.employee_id = emp_id
          AND (j.site_id::text = OLD.site_id::text OR j.dest_site_id::text = OLD.site_id::text)
          AND j.status IN ('Pending', 'In Progress', 'Active', 'In-Progress')
      ) INTO has_active_job;
      IF NOT has_active_job AND emp_role NOT IN ('store_manager', 'warehouse_manager', 'operations_manager') THEN
        RAISE EXCEPTION 'Direct stock modification is prohibited. Stock adjustments must be submitted via Inventory Requests for approval or processed via active WMS jobs.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_inventory_requests_zero_trust()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'pg_temp'
AS $function$
DECLARE current_user_name text;
DECLARE current_user_email text;
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    IF OLD.adjustment_reason LIKE 'PRICE_CHANGE%'
       OR OLD.adjustment_reason LIKE 'MERCHANDISING:%' THEN
      IF current_setting('app.merchandising_decision_id', true) IS DISTINCT FROM OLD.id::text
         OR NOT private.merchandising_decision_matches(OLD.product_id::uuid, OLD.site_id::uuid) THEN
        RAISE EXCEPTION 'Merchandising approval requires the decision workflow';
      END IF;
    ELSIF NOT (public.is_ceo() OR public.is_admin()) THEN
      RAISE EXCEPTION 'Zero-Trust Security Violation: Only Central HQ leadership can approve inventory adjustments.';
    END IF;
    SELECT name, email INTO current_user_name, current_user_email
      FROM public.employees
      WHERE id = (SELECT auth.uid())
         OR lower(email) = lower(COALESCE((SELECT auth.jwt() ->> 'email'), ''))
      LIMIT 1;
    IF OLD.requested_by_employee_id = (SELECT auth.uid())
       OR (OLD.requested_by IS NOT NULL AND OLD.requested_by <> ''
           AND (lower(OLD.requested_by) = lower(COALESCE(current_user_name, ''))
                OR lower(OLD.requested_by) = lower(COALESCE(current_user_email, ''))
                OR lower(OLD.requested_by) = lower(COALESCE(NEW.approved_by, '')))) THEN
      RAISE EXCEPTION 'Zero-Trust 4-Eyes Principle Violation: Requesters cannot approve their own inventory adjustments.';
    END IF;
    NEW.approved_at := now();
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_price_change_margin_floor()
RETURNS trigger LANGUAGE plpgsql SET search_path = 'public', 'pg_temp' AS $function$
DECLARE v_price numeric;
DECLARE v_sale numeric;
DECLARE v_on_sale boolean;
DECLARE v_cost numeric;
DECLARE v_effective numeric;
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved'
     AND NEW.change_type = 'edit'
     AND COALESCE(NEW.adjustment_reason, '') LIKE 'PRICE_CHANGE%'
     AND NEW.proposed_changes IS NOT NULL THEN
    v_price := NULLIF(NEW.proposed_changes->>'price', '')::numeric;
    v_sale := NULLIF(NEW.proposed_changes->>'salePrice', '')::numeric;
    v_on_sale := COALESCE((NEW.proposed_changes->>'isOnSale')::boolean, false);
    v_cost := NULLIF(NEW.proposed_changes->>'costPrice', '')::numeric;
    v_effective := CASE WHEN v_on_sale AND COALESCE(v_sale, 0) > 0 THEN v_sale ELSE v_price END;
    IF COALESCE(v_effective, 0) > 0 AND COALESCE(v_cost, 0) > 0
       AND ((v_effective - v_cost) / v_effective) * 100 < 15
       AND NEW.finance_approved_by_employee_id IS NULL
       AND lower(public.get_my_role()) NOT IN ('super_admin','ceo') THEN
      RAISE EXCEPTION 'Price changes below the 15%% margin floor require Finance co-approval.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE FUNCTION public.finance_signoff_merchandising_price(p_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE actor public.employees%ROWTYPE;
DECLARE request public.inventory_requests%ROWTYPE;
BEGIN
  SELECT * INTO actor FROM public.employees
  WHERE id = (SELECT auth.uid()) AND COALESCE(lower(status),'active') = 'active';
  SELECT * INTO request FROM public.inventory_requests WHERE id = p_request_id FOR UPDATE;
  IF actor.id IS NULL OR request.id IS NULL OR request.status <> 'pending'
     OR request.adjustment_reason NOT LIKE 'PRICE_CHANGE%'
     OR lower(actor.role) NOT IN ('finance_manager','regional_finance_officer','super_admin','ceo')
     OR (lower(actor.role) NOT IN ('super_admin','ceo')
         AND NOT private.finance_site_scope(request.site_id, request.country_code::text))
     OR actor.id = request.requested_by_employee_id THEN
    RAISE EXCEPTION 'Finance sign-off is outside the authorized request scope';
  END IF;
  UPDATE public.inventory_requests
  SET finance_approved_by_employee_id = actor.id, finance_approved_at = now()
  WHERE id = request.id;
END;
$function$;
REVOKE ALL ON FUNCTION public.finance_signoff_merchandising_price(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finance_signoff_merchandising_price(uuid) TO authenticated;

CREATE FUNCTION public.approve_merchandising_request(p_request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE actor public.employees%ROWTYPE;
DECLARE request public.inventory_requests%ROWTYPE;
DECLARE product public.products%ROWTYPE;
DECLARE is_price boolean;
DECLARE effective_price numeric;
DECLARE cost numeric;
BEGIN
  SELECT * INTO actor FROM public.employees
    WHERE id = (SELECT auth.uid()) AND COALESCE(lower(status),'active') = 'active';
  SELECT * INTO request FROM public.inventory_requests WHERE id = p_request_id FOR UPDATE;
  IF actor.id IS NULL OR request.id IS NULL OR request.status <> 'pending'
     OR request.change_type <> 'edit'
     OR (request.adjustment_reason NOT LIKE 'PRICE_CHANGE%'
         AND request.adjustment_reason NOT LIKE 'MERCHANDISING:%')
     OR lower(actor.role) NOT IN (
       'super_admin','ceo','head_of_merchandising','merchandising_head',
       'merchandising_manager','regional_merchandising_lead')
     OR (lower(actor.role) NOT IN ('super_admin','ceo')
         AND NOT private.merchandising_site_scope(request.site_id, request.country_code::text))
     OR actor.id = request.requested_by_employee_id
     OR lower(actor.name) = lower(request.requested_by) THEN
    RAISE EXCEPTION 'Merchandising approval is outside the authorized scope';
  END IF;
  SELECT * INTO product FROM public.products
    WHERE id::text = request.product_id AND site_id::text = request.site_id FOR UPDATE;
  IF product.id IS NULL THEN RAISE EXCEPTION 'Proposal product no longer exists at its site'; END IF;
  is_price := request.adjustment_reason LIKE 'PRICE_CHANGE%';
  IF is_price THEN
    IF NOT (request.proposed_changes ?| ARRAY['price','costPrice','salePrice','isOnSale'])
       OR EXISTS (
         SELECT 1 FROM jsonb_object_keys(request.proposed_changes) AS field
         WHERE NOT field = ANY(ARRAY['price','costPrice','salePrice','isOnSale'])
       ) THEN RAISE EXCEPTION 'Invalid price proposal fields'; END IF;
    effective_price := CASE
      WHEN COALESCE((request.proposed_changes->>'isOnSale')::boolean,product.is_on_sale)
        AND COALESCE((request.proposed_changes->>'salePrice')::numeric,product.sale_price) > 0
      THEN COALESCE((request.proposed_changes->>'salePrice')::numeric,product.sale_price)
      ELSE COALESCE((request.proposed_changes->>'price')::numeric,product.price)
    END;
    cost := COALESCE((request.proposed_changes->>'costPrice')::numeric,product.cost_price);
    IF effective_price <= 0 OR cost < 0 THEN RAISE EXCEPTION 'Invalid price proposal'; END IF;
    IF cost > 0 AND (effective_price - cost) / effective_price * 100 < 15
       AND request.finance_approved_by_employee_id IS NULL
       AND lower(actor.role) NOT IN ('super_admin','ceo') THEN
      RAISE EXCEPTION 'Finance co-approval is required below the margin floor';
    END IF;
  ELSE
    IF EXISTS (
      SELECT 1 FROM jsonb_object_keys(request.proposed_changes) AS field
      WHERE NOT field = ANY(ARRAY['name','category','brand','description','image','shelfPosition'])
    ) THEN RAISE EXCEPTION 'Invalid merchandising proposal fields'; END IF;
  END IF;

  PERFORM set_config('app.merchandising_decision_id', request.id::text, true);
  IF is_price THEN
    UPDATE public.products SET
      price = COALESCE((request.proposed_changes->>'price')::numeric, product.price),
      cost_price = COALESCE((request.proposed_changes->>'costPrice')::numeric, product.cost_price),
      sale_price = COALESCE((request.proposed_changes->>'salePrice')::numeric, product.sale_price),
      is_on_sale = COALESCE((request.proposed_changes->>'isOnSale')::boolean, product.is_on_sale)
    WHERE id = product.id;
  ELSE
    UPDATE public.products SET
      name = COALESCE(request.proposed_changes->>'name', product.name),
      category = COALESCE(request.proposed_changes->>'category', product.category),
      brand = COALESCE(request.proposed_changes->>'brand', product.brand),
      description = COALESCE(request.proposed_changes->>'description', product.description),
      image = COALESCE(request.proposed_changes->>'image', product.image),
      shelf_position = COALESCE(request.proposed_changes->>'shelfPosition', product.shelf_position)
    WHERE id = product.id;
  END IF;
  UPDATE public.inventory_requests
  SET status = 'approved', approved_by = actor.name, approved_at = now()
  WHERE id = request.id;
  PERFORM set_config('app.merchandising_decision_id', '', true);
END;
$function$;
REVOKE ALL ON FUNCTION public.approve_merchandising_request(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_merchandising_request(uuid) TO authenticated;
