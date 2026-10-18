-- Derive POS sale amounts from trusted catalog, configuration, and discount records.

ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS discount_code_id text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rounding_adjustment numeric NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.create_pos_sale_atomic(p_sale jsonb, p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
  v_actor public.employees%ROWTYPE;
  v_site public.sites%ROWTYPE;
  v_product record;
  v_discount public.discount_codes%ROWTYPE;
  v_sale public.sales%ROWTYPE;
  v_sale_id uuid;
  v_country text;
  v_currency text;
  v_currency_decimals integer := 2;
  v_subtotal numeric := 0;
  v_discount_amount numeric := 0;
  v_tax numeric := 0;
  v_tax_base numeric := 0;
  v_line_tax numeric := 0;
  v_raw_total numeric := 0;
  v_total numeric := 0;
  v_rounding numeric := 0;
  v_amount_tendered numeric := 0;
  v_change numeric := 0;
  v_payment_method text;
  v_receipt text;
  v_customer_id uuid;
  v_customer_discount_uses integer := 0;
  v_discount_id text;
  v_config jsonb;
  v_country_config jsonb;
  v_tax_rules jsonb;
  v_rule jsonb;
  v_tax_enabled boolean := false;
  v_tax_rate numeric := 0;
  v_effective_price numeric;
  v_quantity numeric;
  v_clean_items jsonb := '[]'::jsonb;
  v_item jsonb;
BEGIN
  IF auth.role() NOT IN ('authenticated','service_role') THEN
    RAISE EXCEPTION 'Authenticated session required';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'A sale must contain at least one item';
  END IF;

  SELECT * INTO v_site
  FROM public.sites
  WHERE id = NULLIF(p_sale->>'site_id','')::uuid
  LIMIT 1;
  IF NOT FOUND OR lower(COALESCE(v_site.status,'')) NOT IN ('active','open') THEN
    RAISE EXCEPTION 'Active sale site not found';
  END IF;
  v_country := upper(COALESCE(NULLIF(v_site.country,''),'ET'));
  v_currency := COALESCE(NULLIF(v_site.currency,''),'ETB');

  IF auth.role() = 'authenticated' THEN
    SELECT e.* INTO v_actor
    FROM public.employees e
    WHERE e.id = auth.uid()
      AND COALESCE(lower(e.status),'active') = 'active'
    LIMIT 1;
    IF NOT FOUND OR NOT public.is_site_in_my_authorized_scope(v_site.id::text, v_country) THEN
      RAISE EXCEPTION 'Sale site is outside the authenticated employee scope';
    END IF;
  END IF;

  SELECT COALESCE(c.decimals,2) INTO v_currency_decimals
  FROM public.currencies c WHERE c.code = v_currency LIMIT 1;
  IF NOT FOUND THEN v_currency_decimals := 2; END IF;

  v_sale_id := COALESCE(NULLIF(p_sale->>'id','')::uuid,gen_random_uuid());
  SELECT * INTO v_sale FROM public.sales WHERE id = v_sale_id FOR UPDATE;
  IF FOUND THEN
    IF v_sale.site_id <> v_site.id THEN
      RAISE EXCEPTION 'Sale request identifier is already used';
    END IF;
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'product_id',si.product_id,'product_name',si.product_name,'quantity',si.quantity,
      'price',si.price,'cost_price',si.cost_price
    )), '[]'::jsonb) INTO v_clean_items
    FROM public.sale_items si WHERE si.sale_id = v_sale_id;
    RETURN to_jsonb(v_sale) || jsonb_build_object('items',v_clean_items);
  END IF;

  -- Rebuild every line from the current catalog. Browser names, prices, costs,
  -- stock, and country values are ignored.
  FOR v_item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    v_quantity := NULLIF(v_item->>'quantity','')::numeric;
    IF v_quantity IS NULL OR v_quantity <= 0 OR v_quantity > 100000 THEN
      RAISE EXCEPTION 'Sale quantity must be positive and within the allowed range';
    END IF;
    SELECT p.id, p.name, p.price, p.sale_price, p.is_on_sale, p.cost_price, p.status, p.approval_status
      INTO v_product
    FROM public.products p
    WHERE p.id = COALESCE(NULLIF(v_item->>'product_id',''),NULLIF(v_item->>'id',''))::uuid
      AND p.site_id = v_site.id
      AND lower(COALESCE(p.status,'')) <> 'archived'
      AND lower(COALESCE(p.approval_status,'approved')) NOT IN ('rejected','pending','draft')
    FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product is unavailable at the selected site';
    END IF;
    v_effective_price := CASE
      WHEN COALESCE(v_product.is_on_sale,false) AND COALESCE(v_product.sale_price,0) > 0
        THEN v_product.sale_price
      ELSE v_product.price
    END;
    IF v_effective_price IS NULL OR v_effective_price < 0 THEN
      RAISE EXCEPTION 'Product has an invalid selling price';
    END IF;
    v_subtotal := v_subtotal + (v_effective_price * v_quantity);
    v_clean_items := v_clean_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'quantity', v_quantity,
      'price', v_effective_price,
      'cost_price', v_product.cost_price
    ));
  END LOOP;

  -- Load tenant tax settings and matching site jurisdiction from the trusted DB.
  SELECT to_jsonb(c) INTO v_config
  FROM public.system_config c
  ORDER BY c.created_at DESC NULLS LAST
  LIMIT 1;
  v_country_config := COALESCE(v_config->'country_configs'->v_country, '{}'::jsonb);
  v_tax_enabled := COALESCE(
    NULLIF(v_country_config->>'taxOnSelling','')::boolean,
    NULLIF(v_country_config->>'tax_on_selling','')::boolean,
    NULLIF(v_config->>'tax_on_selling','')::boolean,
    false
  );
  v_tax_rate := COALESCE(
    NULLIF(v_country_config->>'taxRate','')::numeric,
    NULLIF(v_country_config->>'tax_rate','')::numeric,
    NULLIF(v_config->>'tax_rate','')::numeric,
    NULLIF(v_config->>'default_vat_rate','')::numeric,
    0
  );
  v_tax_rules := COALESCE(
    v_country_config->'taxJurisdictions',
    v_country_config->'tax_jurisdictions',
    v_config->'tax_jurisdictions',
    '[]'::jsonb
  );
  IF v_tax_enabled THEN
    IF v_site.tax_jurisdiction_id IS NOT NULL AND jsonb_typeof(v_tax_rules) = 'array' THEN
      SELECT j->'rules' INTO v_tax_rules
      FROM jsonb_array_elements(v_tax_rules) j
      WHERE j->>'id' = v_site.tax_jurisdiction_id
      LIMIT 1;
    END IF;
    IF jsonb_typeof(v_tax_rules) = 'array' AND jsonb_array_length(v_tax_rules) > 0 THEN
      v_tax_base := v_subtotal;
      FOR v_rule IN SELECT value FROM jsonb_array_elements(v_tax_rules)
      LOOP
        v_tax_rate := COALESCE(NULLIF(v_rule->>'rate','')::numeric,0);
        IF v_tax_rate < 0 OR v_tax_rate > 100 THEN
          RAISE EXCEPTION 'Configured tax rate is invalid';
        END IF;
        v_line_tax := v_tax_base * v_tax_rate / 100;
        v_tax := v_tax + v_line_tax;
        IF COALESCE(NULLIF(v_rule->>'compound','')::boolean,false) THEN
          v_tax_base := v_tax_base + v_line_tax;
        END IF;
      END LOOP;
    ELSE
      v_tax := v_subtotal * v_tax_rate / 100;
    END IF;
  END IF;

  v_discount_id := NULLIF(p_sale->>'discount_code_id','');
  IF v_discount_id IS NOT NULL THEN
    SELECT * INTO v_discount
    FROM public.discount_codes d
    WHERE d.id = v_discount_id
    FOR UPDATE;
    IF NOT FOUND
       OR lower(COALESCE(v_discount.status,'')) <> 'active'
       OR upper(COALESCE(v_discount.country_code,'')) <> v_country
       OR v_discount.valid_from > now()
       OR v_discount.valid_until < now()
       OR (v_discount.usage_limit IS NOT NULL AND v_discount.usage_count >= v_discount.usage_limit)
       OR (v_discount.min_purchase_amount IS NOT NULL AND v_subtotal < v_discount.min_purchase_amount)
       OR (cardinality(v_discount.applicable_sites) > 0
           AND v_site.id::text <> ALL(v_discount.applicable_sites)
           AND v_site.code <> ALL(v_discount.applicable_sites)) THEN
      RAISE EXCEPTION 'Discount code is invalid for this sale';
    END IF;
    IF v_discount.per_customer_limit IS NOT NULL AND NULLIF(p_sale->>'customer_id','') IS NOT NULL THEN
      SELECT count(*) INTO v_customer_discount_uses
      FROM public.sales s
      WHERE s.discount_code_id = v_discount_id
        AND s.customer_id = (p_sale->>'customer_id')::uuid;
      IF v_customer_discount_uses >= v_discount.per_customer_limit THEN
        RAISE EXCEPTION 'Discount code usage limit reached for this customer';
      END IF;
    END IF;
    IF upper(v_discount.type) = 'FIXED' THEN
      v_discount_amount := v_discount.value;
    ELSIF upper(v_discount.type) IN ('PERCENT','PERCENTAGE') THEN
      IF v_discount.value < 0 OR v_discount.value > 100 THEN
        RAISE EXCEPTION 'Discount percentage is invalid';
      END IF;
      v_discount_amount := v_subtotal * v_discount.value / 100;
    ELSE
      RAISE EXCEPTION 'Discount type is invalid';
    END IF;
    IF v_discount.max_discount_amount IS NOT NULL THEN
      v_discount_amount := LEAST(v_discount_amount, v_discount.max_discount_amount);
    END IF;
    v_discount_amount := LEAST(GREATEST(v_discount_amount,0),v_subtotal);
    UPDATE public.discount_codes
    SET usage_count = COALESCE(usage_count,0) + 1, updated_at = now()
    WHERE id = v_discount_id;
  END IF;

  v_payment_method := COALESCE(NULLIF(p_sale->>'payment_method',''),NULLIF(p_sale->>'method',''));
  IF v_payment_method IS NULL OR length(v_payment_method) > 40 THEN
    RAISE EXCEPTION 'Payment method is required';
  END IF;
  v_raw_total := round(v_subtotal + v_tax - v_discount_amount, v_currency_decimals);
  v_total := COALESCE(NULLIF(p_sale->>'total','')::numeric,v_raw_total);
  IF v_total <> v_raw_total THEN
    IF lower(v_payment_method) <> 'cash'
       OR v_total <> (ceil(v_raw_total / 5) * 5) THEN
      RAISE EXCEPTION 'Sale total does not match trusted catalog prices, tax, and discount';
    END IF;
  END IF;
  v_rounding := v_total - v_raw_total;

  IF lower(v_payment_method) = 'cash' THEN
    v_amount_tendered := COALESCE(NULLIF(p_sale->>'amount_tendered','')::numeric,0);
    IF v_amount_tendered < v_total THEN
      RAISE EXCEPTION 'Cash tendered is less than the verified sale total';
    END IF;
    v_change := v_amount_tendered - v_total;
  ELSE
    v_amount_tendered := v_total;
    v_change := 0;
  END IF;

  v_customer_id := NULLIF(p_sale->>'customer_id','')::uuid;
  IF v_customer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.customers c WHERE c.id = v_customer_id) THEN
    RAISE EXCEPTION 'Customer is unavailable';
  END IF;
  v_receipt := COALESCE(NULLIF(p_sale->>'receipt_number',''),'SALE-' || replace(v_sale_id::text,'-',''));

  INSERT INTO public.sales (
    id,site_id,country_code,currency,customer_id,sale_date,subtotal,tax,total,
    payment_method,status,amount_tendered,change,cashier_name,receipt_number,
    fulfillment_status,discount_code_id,discount_amount,rounding_adjustment
  ) VALUES (
    v_sale_id,v_site.id,v_country,v_currency,v_customer_id,now(),
    round(v_subtotal,v_currency_decimals),round(v_tax,v_currency_decimals),v_total,
    v_payment_method,'Completed',v_amount_tendered,v_change,
    CASE WHEN auth.role() = 'authenticated' THEN v_actor.name ELSE COALESCE(p_sale->>'cashier_name','System') END,
    v_receipt,
    CASE WHEN COALESCE(p_sale->>'type','In-Store') = 'In-Store' THEN 'Delivered' ELSE 'Picking' END,
    v_discount_id,round(v_discount_amount,v_currency_decimals),v_rounding
  ) RETURNING * INTO v_sale;

  INSERT INTO public.sale_items (sale_id,product_id,product_name,quantity,price,cost_price)
  SELECT v_sale_id,
         (item->>'product_id')::uuid,
         item->>'product_name',
         (item->>'quantity')::numeric,
         (item->>'price')::numeric,
         (item->>'cost_price')::numeric
  FROM jsonb_array_elements(v_clean_items) item;

  RETURN to_jsonb(v_sale) || jsonb_build_object('items',v_clean_items);
END;
$function$;

REVOKE ALL ON FUNCTION public.create_pos_sale_atomic(jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_pos_sale_atomic(jsonb,jsonb) TO authenticated, service_role;

-- Authenticated clients must create sales only through the atomic trusted RPC.
DROP POLICY IF EXISTS sales_insert ON public.sales;
CREATE POLICY sales_insert_rpc_only ON public.sales FOR INSERT TO authenticated WITH CHECK (false);
DROP POLICY IF EXISTS sale_items_insert ON public.sale_items;
CREATE POLICY sale_items_insert_rpc_only ON public.sale_items FOR INSERT TO authenticated WITH CHECK (false);
DROP POLICY IF EXISTS sale_items_update ON public.sale_items;
CREATE POLICY sale_items_update_prohibited ON public.sale_items FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS sale_items_delete ON public.sale_items;
CREATE POLICY sale_items_delete_prohibited ON public.sale_items FOR DELETE TO authenticated USING (false);
DROP POLICY IF EXISTS sales_delete ON public.sales;
CREATE POLICY sales_delete_prohibited ON public.sales FOR DELETE TO authenticated USING (false);

CREATE OR REPLACE FUNCTION public.guard_sale_financial_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF ROW(NEW.site_id,NEW.customer_id,NEW.sale_date,NEW.subtotal,NEW.tax,NEW.total,
         NEW.payment_method,NEW.amount_tendered,NEW.change,NEW.cashier_name,
         NEW.receipt_number,NEW.country_code,NEW.currency,NEW.discount_code_id,
         NEW.discount_amount,NEW.rounding_adjustment)
     IS DISTINCT FROM
     ROW(OLD.site_id,OLD.customer_id,OLD.sale_date,OLD.subtotal,OLD.tax,OLD.total,
         OLD.payment_method,OLD.amount_tendered,OLD.change,OLD.cashier_name,
         OLD.receipt_number,OLD.country_code,OLD.currency,OLD.discount_code_id,
         OLD.discount_amount,OLD.rounding_adjustment) THEN
    RAISE EXCEPTION 'Sale financial fields are immutable';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     AND lower(COALESCE(public.get_my_role(),'')) NOT IN
         ('super_admin','ceo','admin','finance_manager','regional_finance_officer','store_manager') THEN
    RAISE EXCEPTION 'Sale status change requires an authorized supervisor';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.guard_sale_financial_mutation() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS guard_sale_financial_mutation ON public.sales;
CREATE TRIGGER guard_sale_financial_mutation BEFORE UPDATE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.guard_sale_financial_mutation();
