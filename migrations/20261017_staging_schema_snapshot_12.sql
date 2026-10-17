-- Staging schema snapshot, part 12 of 16.
SET search_path = public, extensions, auth;
SET check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.increment_discount_usage(code_id text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    UPDATE public.discount_codes
    SET usage_count = usage_count + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = code_id;
END;
$function$;
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN (SELECT public.get_my_role()) IN (
    'super_admin',
    'regional_manager', 'operations_manager', 'finance_manager',
    'hr_manager', 'procurement_manager', 'supply_chain_manager'
  );
END;
$function$;
CREATE OR REPLACE FUNCTION public.is_ceo()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN (SELECT public.get_my_role()) = 'super_admin';
END;
$function$;
CREATE OR REPLACE FUNCTION public.is_hq_executive()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- If running directly in Supabase SQL editor / service role where auth is null
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN true;
  END IF;

  RETURN (SELECT public.get_my_role()) IN (
    'super_admin',
    'CEO',
    'ceo',
    'operations_manager',
    'finance_manager'
  );
END;
$function$;
CREATE OR REPLACE FUNCTION public.is_manager()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN (SELECT public.get_my_role()) IN (
    'super_admin', 'admin', 'CEO',
    'regional_manager', 'operations_manager', 'finance_manager',
    'hr_manager', 'procurement_manager', 'supply_chain_manager',
    'store_manager', 'warehouse_manager', 'dispatch_manager',
    'assistant_manager', 'shift_lead', 'store_supervisor',
    'fleet_maintenance_supervisor', 'corporate_merchandising_manager',
    'inventory_manager', 'logistics_manager'
  );
END;
$function$;
CREATE OR REPLACE FUNCTION public.log_sensitive_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF OLD.salary <> NEW.salary THEN
    INSERT INTO system_logs (user_id, action, details, module, timestamp)
    VALUES (auth.uid(), 'SALARY_UPDATE', 'Salary changed for employee ' || NEW.id, 'HR', NOW());
  END IF;
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.merge_duplicate_product_sku(p_country text, p_surviving_sku text, p_deprecated_sku text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_surviving_master_id uuid;
  v_deprecated_master_id uuid;
  v_dep_rec RECORD;
  v_surv_rec RECORD;
  v_merged_stock numeric := 0;
  v_sites_affected integer := 0;
BEGIN
  -- 1. Security & Sovereignty checks
  IF NOT public.is_hq_executive() THEN
    RAISE EXCEPTION 'Unauthorized: Only HQ Executives can merge product SKUs';
  END IF;

  IF p_surviving_sku = p_deprecated_sku THEN
    RAISE EXCEPTION 'Surviving SKU and Deprecated SKU cannot be the same';
  END IF;

  -- 2. Fetch master catalog records if available
  BEGIN
    SELECT id INTO v_surviving_master_id
    FROM product_master
    WHERE country_code = p_country AND sku = p_surviving_sku;

    SELECT id INTO v_deprecated_master_id
    FROM product_master
    WHERE country_code = p_country AND sku = p_deprecated_sku;
  EXCEPTION WHEN OTHERS THEN
    v_surviving_master_id := NULL;
    v_deprecated_master_id := NULL;
  END;

  -- 3. Iterate over every site having the deprecated SKU in this country
  FOR v_dep_rec IN
    SELECT p.*
    FROM products p
    JOIN sites s ON s.id = p.site_id
    WHERE s.country = p_country AND p.sku = p_deprecated_sku
  LOOP
    -- Check if this site already has a row for the surviving SKU
    SELECT * INTO v_surv_rec
    FROM products
    WHERE site_id = v_dep_rec.site_id AND sku = p_surviving_sku
    LIMIT 1;

    IF FOUND THEN
      -- CASE A: Site has BOTH rows -> Consolidate into the surviving row
      UPDATE po_items SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;
      UPDATE sale_items SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;
      UPDATE stock_movements SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;
      UPDATE barcode_approvals SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;
      UPDATE discrepancy_resolutions SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;
      UPDATE products SET product_id = v_surv_rec.id WHERE product_id = v_dep_rec.id;

      -- Consolidate physical stock and merge barcode aliases
      UPDATE products
      SET
        stock = COALESCE(stock, 0) + COALESCE(v_dep_rec.stock, 0),
        barcodes = (
          SELECT array_agg(DISTINCT b)
          FROM unnest(
            COALESCE(v_surv_rec.barcodes, ARRAY[]::text[]) ||
            COALESCE(v_dep_rec.barcodes, ARRAY[]::text[]) ||
            CASE WHEN v_dep_rec.barcode IS NOT NULL AND v_dep_rec.barcode <> '' THEN ARRAY[v_dep_rec.barcode] ELSE ARRAY[]::text[] END
          ) AS b
          WHERE b IS NOT NULL AND b <> ''
        ),
        barcode = COALESCE(barcode, v_dep_rec.barcode),
        updated_at = now()
      WHERE id = v_surv_rec.id;

      v_merged_stock := v_merged_stock + COALESCE(v_dep_rec.stock, 0);

      -- Safely delete the deprecated product row
      DELETE FROM products WHERE id = v_dep_rec.id;

    ELSE
      -- CASE B: Site only has the deprecated row -> Simply rename to surviving SKU
      UPDATE products
      SET
        sku = p_surviving_sku,
        updated_at = now()
      WHERE id = v_dep_rec.id;
    END IF;

    v_sites_affected := v_sites_affected + 1;
  END LOOP;

  -- 4. Update po_items that still reference the old SKU by text
  UPDATE po_items
  SET sku = p_surviving_sku
  WHERE sku = p_deprecated_sku;

  -- 5. Mark deprecated master as MERGED in product_master if table exists
  IF v_deprecated_master_id IS NOT NULL AND v_surviving_master_id IS NOT NULL THEN
    UPDATE product_master
    SET
      status = 'MERGED',
      merged_into_id = v_surviving_master_id,
      updated_at = now()
    WHERE id = v_deprecated_master_id;
  END IF;

  RETURN jsonb_build_object(
    'country', p_country,
    'surviving_sku', p_surviving_sku,
    'deprecated_sku', p_deprecated_sku,
    'sites_affected', v_sites_affected,
    'consolidated_stock', v_merged_stock,
    'status', 'success'
  );
END;
$function$;
CREATE OR REPLACE FUNCTION public.next_sku(p_country text, p_category_prefix text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_next integer;
BEGIN
  IF p_country !~ '^[A-Z]{2}$' OR p_category_prefix !~ '^[A-Z]{2,4}$' THEN
    RAISE EXCEPTION 'Invalid country or category prefix';
  END IF;
  IF p_country <> public.get_my_country_code() AND NOT public.is_ceo() THEN
    RAISE EXCEPTION 'Cannot issue SKUs for another country';
  END IF;

  INSERT INTO sku_counters (country_code, category_prefix, last_value)
  VALUES (p_country, p_category_prefix, 1)
  ON CONFLICT (country_code, category_prefix)
  DO UPDATE SET last_value = sku_counters.last_value + 1
  RETURNING last_value INTO v_next;

  RETURN p_country || p_category_prefix || lpad(v_next::text, 3, '0');
END $function$;
CREATE OR REPLACE FUNCTION public.pos_decrement_stock(p_product_id uuid, p_quantity numeric, p_site_id text DEFAULT NULL::text, p_product_name text DEFAULT ''::text, p_reason text DEFAULT 'POS Sale (Offline Sync)'::text, p_performed_by text DEFAULT 'System'::text, p_sale_date timestamp with time zone DEFAULT now())
 RETURNS TABLE(new_stock numeric, product_name text)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_new_stock NUMERIC;
    v_name      TEXT;
    v_site_uuid UUID;
BEGIN
    -- Safely parse site_id UUID from TEXT
    IF p_site_id IS NOT NULL AND p_site_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_site_uuid := p_site_id::UUID;
    ELSE
        v_site_uuid := NULL;
    END IF;

    -- Atomic read-modify-write in a single statement
    UPDATE public.products
    SET stock = GREATEST(0, stock - p_quantity)
    WHERE id = p_product_id
    RETURNING stock, name INTO v_new_stock, v_name;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product % not found', p_product_id;
    END IF;

    -- Record stock movement for audit trail
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
CREATE OR REPLACE FUNCTION public.protect_country_admin_site()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF OLD.type IN ('Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations') THEN
        IF (SELECT COUNT(*) FROM sites 
            WHERE UPPER(country) = UPPER(OLD.country) 
              AND type IN ('Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations')
              AND id != OLD.id) = 0 THEN
            RAISE EXCEPTION 'Cannot delete the primary Administration HQ for country %. Every country must retain an Administration central site.', OLD.country;
        END IF;
    END IF;
    RETURN OLD;
END;
$function$;
CREATE OR REPLACE FUNCTION public.receive_transfer_atomic(p_transfer_id uuid, p_receiver_id text, p_receiver_name text, p_receiver_role text, p_has_discrepancy boolean DEFAULT false, p_discrepancy_details text DEFAULT NULL::text, p_notes text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_transfer RECORD;
BEGIN
    SELECT * INTO v_transfer FROM public.transfers WHERE id = p_transfer_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transfer % not found', p_transfer_id;
    END IF;

    IF v_transfer.status NOT IN ('In-Transit', 'Shipped', 'Delivered') 
       AND COALESCE(v_transfer.transfer_status, '') NOT IN ('In-Transit', 'Shipped', 'Delivered') THEN
        RAISE EXCEPTION 'Transfer cannot be received from current status "%" (transfer_status: "%"). Must be in-transit or delivered.',
            v_transfer.status, v_transfer.transfer_status;
    END IF;

    UPDATE public.transfers
    SET status = 'Completed',
        transfer_status = 'Received',
        received_by = p_receiver_name,
        received_at = NOW(),
        has_discrepancy = p_has_discrepancy,
        discrepancy_details = p_discrepancy_details,
        updated_at = NOW()
    WHERE id = p_transfer_id;

    UPDATE public.wms_jobs
    SET status = 'Completed',
        transfer_status = 'Received',
        received_at = NOW(),
        received_by = p_receiver_name,
        updated_at = NOW()
    WHERE (order_ref = p_transfer_id::text OR id::text = p_transfer_id::text OR order_ref = v_transfer.order_ref)
      AND type = 'TRANSFER';

    INSERT INTO public.system_logs (
        user_name,
        action,
        module,
        details,
        site_id,
        country_code,
        entity_type,
        entity_id,
        performed_by
    ) VALUES (
        p_receiver_name,
        'TRANSFER_RECEIVED',
        'Inventory',
        json_build_object(
            'transfer_id', p_transfer_id,
            'order_ref', v_transfer.order_ref,
            'dest_site_id', v_transfer.dest_site_id,
            'receiver_role', p_receiver_role,
            'has_discrepancy', p_has_discrepancy,
            'discrepancy_details', p_discrepancy_details,
            'notes', p_notes
        )::text,
        v_transfer.dest_site_id,
        v_transfer.country_code,
        'transfers',
        p_transfer_id::text,
        p_receiver_id
    );

    RETURN json_build_object(
        'success', true,
        'transfer_id', p_transfer_id,
        'status', 'Completed',
        'transfer_status', 'Received',
        'received_by', p_receiver_name,
        'received_at', NOW()
    );
END;
$function$;
SET check_function_bodies = on;
RESET search_path;
