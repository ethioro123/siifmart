-- Ensure POS offline sync stock decrements are idempotent and authorized for store cashiers
BEGIN;

CREATE OR REPLACE FUNCTION public.enforce_product_update_restrictions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  emp_role text;
  emp_id uuid;
  has_active_job boolean;
  decision_kind text;
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  IF private.product_edit_decision_matches(OLD.id, OLD.site_id) THEN RETURN NEW; END IF;

  -- Allow stock-only decrements executed through the trusted pos_decrement_stock RPC
  IF current_setting('app.pos_sale_stock_decrement', true) = OLD.id::text
     AND (to_jsonb(NEW) - ARRAY['stock', 'status', 'stock_updated_at', 'updated_at'])
       = (to_jsonb(OLD) - ARRAY['stock', 'status', 'stock_updated_at', 'updated_at']) THEN
    RETURN NEW;
  END IF;

  IF OLD.name IS DISTINCT FROM NEW.name OR OLD.sku IS DISTINCT FROM NEW.sku OR OLD.category IS DISTINCT FROM NEW.category OR OLD.brand IS DISTINCT FROM NEW.brand OR OLD.description IS DISTINCT FROM NEW.description OR OLD.image IS DISTINCT FROM NEW.image OR OLD.size IS DISTINCT FROM NEW.size OR OLD.unit IS DISTINCT FROM NEW.unit OR OLD.barcode IS DISTINCT FROM NEW.barcode OR OLD.barcodes IS DISTINCT FROM NEW.barcodes OR OLD.barcode_type IS DISTINCT FROM NEW.barcode_type OR OLD.price IS DISTINCT FROM NEW.price OR OLD.cost_price IS DISTINCT FROM NEW.cost_price OR OLD.sale_price IS DISTINCT FROM NEW.sale_price OR OLD.is_on_sale IS DISTINCT FROM NEW.is_on_sale OR OLD.min_stock IS DISTINCT FROM NEW.min_stock OR OLD.max_stock IS DISTINCT FROM NEW.max_stock OR OLD.pack_quantity IS DISTINCT FROM NEW.pack_quantity OR OLD.custom_attributes IS DISTINCT FROM NEW.custom_attributes OR OLD.shelf_position IS DISTINCT FROM NEW.shelf_position THEN
    RAISE EXCEPTION 'Product edits require Operations, Supply Chain and Merchandising approval';
  END IF;

  emp_role := public.get_my_role();
  emp_id := public.get_my_employee_id();

  IF private.merchandising_decision_matches(OLD.id, OLD.site_id) THEN
    SELECT adjustment_reason INTO decision_kind
      FROM public.inventory_requests
      WHERE id::text = current_setting('app.merchandising_decision_id', true);
    IF decision_kind LIKE 'PRICE_CHANGE%'
       AND (to_jsonb(NEW) - ARRAY['price', 'cost_price', 'sale_price', 'is_on_sale', 'updated_at'])
         = (to_jsonb(OLD) - ARRAY['price', 'cost_price', 'sale_price', 'is_on_sale', 'updated_at'])
       THEN RETURN NEW;
    END IF;
    IF decision_kind LIKE 'MERCHANDISING:%'
       AND (to_jsonb(NEW) - ARRAY['name', 'category', 'brand', 'description', 'image', 'shelf_position', 'updated_at'])
         = (to_jsonb(OLD) - ARRAY['name', 'category', 'brand', 'description', 'image', 'shelf_position', 'updated_at'])
       THEN RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Merchandising decision attempted unrelated product fields';
  END IF;

  IF emp_role = 'group_ceo' THEN RETURN NEW; END IF;
  IF (OLD.price IS DISTINCT FROM NEW.price OR OLD.sale_price IS DISTINCT FROM NEW.sale_price
      OR OLD.cost_price IS DISTINCT FROM NEW.cost_price OR OLD.is_on_sale IS DISTINCT FROM NEW.is_on_sale)
     AND emp_role NOT IN ('country_commercial_director', 'procurement', 'group_ceo') THEN
    RAISE EXCEPTION 'Only the CEO and Procurement staff can modify product pricing or cost fields.';
  END IF;
  IF (OLD.name IS DISTINCT FROM NEW.name OR OLD.sku IS DISTINCT FROM NEW.sku
      OR OLD.category IS DISTINCT FROM NEW.category OR OLD.brand IS DISTINCT FROM NEW.brand
      OR OLD.size IS DISTINCT FROM NEW.size OR OLD.unit IS DISTINCT FROM NEW.unit
      OR OLD.description IS DISTINCT FROM NEW.description OR OLD.image IS DISTINCT FROM NEW.image
      OR OLD.custom_attributes IS DISTINCT FROM NEW.custom_attributes
      OR OLD.min_stock IS DISTINCT FROM NEW.min_stock OR OLD.max_stock IS DISTINCT FROM NEW.max_stock
      OR OLD.pack_quantity IS DISTINCT FROM NEW.pack_quantity)
     AND emp_role NOT IN ('regional_operations_manager', 'group_ceo', 'country_managing_director') THEN
    RAISE EXCEPTION 'Only the CEO and Regional Managers can edit product details.';
  END IF;
  IF OLD.stock IS DISTINCT FROM NEW.stock THEN
    IF emp_role IN ('group_ceo', 'country_managing_director', 'inventory_controller', 'supply_chain_director') THEN
      NULL;
    ELSE
      SELECT EXISTS (
        SELECT 1 FROM public.job_assignments ja
        JOIN public.wms_jobs j ON j.id = ja.job_id
        WHERE ja.employee_id = emp_id
          AND (j.site_id::text = OLD.site_id::text OR j.dest_site_id::text = OLD.site_id::text)
          AND j.status IN ('Pending', 'In Progress', 'Active', 'In-Progress')
      ) INTO has_active_job;
      IF NOT has_active_job AND emp_role NOT IN ('store_manager', 'warehouse_manager', 'country_operations_director') THEN
        RAISE EXCEPTION 'Direct stock modification is prohibited. Stock adjustments must be submitted via Inventory Requests for approval or processed via active WMS jobs.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.pos_decrement_stock(
  p_product_id uuid,
  p_quantity numeric,
  p_site_id text DEFAULT NULL::text,
  p_product_name text DEFAULT ''::text,
  p_reason text DEFAULT 'POS Sale (Offline Sync)'::text,
  p_performed_by text DEFAULT 'System'::text,
  p_sale_date timestamp with time zone DEFAULT now()
)
RETURNS TABLE(new_stock numeric, product_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_new_stock numeric;
  v_name text;
  v_site_uuid uuid;
  v_product_site_id uuid;
  v_site_country text;
BEGIN
  IF auth.role() NOT IN ('authenticated', 'service_role') THEN
    RAISE EXCEPTION 'Authenticated session required' USING ERRCODE = '42501';
  END IF;

  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Decrement quantity must be positive' USING ERRCODE = '22023';
  END IF;

  SELECT p.site_id, p.name, p.stock, upper(coalesce(s.country, 'ET'))
    INTO v_product_site_id, v_name, v_new_stock, v_site_country
  FROM public.products p
  LEFT JOIN public.sites s ON s.id = p.site_id
  WHERE p.id = p_product_id
  FOR UPDATE OF p;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product % not found', p_product_id;
  END IF;

  IF p_site_id IS NOT NULL AND p_site_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    v_site_uuid := p_site_id::uuid;
  ELSE
    v_site_uuid := v_product_site_id;
  END IF;

  IF auth.role() = 'authenticated' AND v_product_site_id IS NOT NULL THEN
    IF NOT public.is_site_in_my_authorized_scope(v_product_site_id::text, v_site_country) THEN
      RAISE EXCEPTION 'Product site is outside the authenticated employee scope' USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Idempotency guard: if this exact receipt/reason already decremented stock for this product, do not duplicate
  IF p_reason IS NOT NULL AND p_reason <> 'POS Sale (Offline Sync)' AND EXISTS (
    SELECT 1
    FROM public.stock_movements sm
    WHERE sm.product_id = p_product_id
      AND (v_site_uuid IS NULL OR sm.site_id = v_site_uuid)
      AND sm.type = 'OUT'
      AND sm.reason = p_reason
  ) THEN
    RETURN QUERY SELECT v_new_stock, v_name;
    RETURN;
  END IF;

  PERFORM set_config('app.pos_sale_stock_decrement', p_product_id::text, true);

  UPDATE public.products
  SET stock = GREATEST(0, stock - p_quantity),
      status = CASE
        WHEN status = 'archived' THEN 'archived'
        WHEN GREATEST(0, stock - p_quantity) <= 0 THEN 'out_of_stock'
        WHEN GREATEST(0, stock - p_quantity) < COALESCE(NULLIF(min_stock, 0), 10) THEN 'low_stock'
        ELSE 'active'
      END
  WHERE id = p_product_id
  RETURNING stock, name INTO v_new_stock, v_name;

  PERFORM set_config('app.pos_sale_stock_decrement', '', true);

  INSERT INTO public.stock_movements (
    site_id,
    product_id,
    product_name,
    type,
    quantity,
    movement_date,
    performed_by,
    reason
  ) VALUES (
    v_site_uuid,
    p_product_id,
    COALESCE(v_name, p_product_name),
    'OUT',
    p_quantity,
    p_sale_date,
    p_performed_by,
    p_reason
  );

  RETURN QUERY SELECT v_new_stock, v_name;
END;
$function$;

REVOKE ALL ON FUNCTION public.pos_decrement_stock(uuid, numeric, text, text, text, text, timestamp with time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pos_decrement_stock(uuid, numeric, text, text, text, text, timestamp with time zone) TO authenticated, service_role;

COMMIT;
