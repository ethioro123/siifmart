-- Staging schema snapshot, part 08 of 16.
SET search_path = public, extensions, auth;
SET check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.create_pos_sale_atomic(p_sale jsonb, p_items jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_sale_id UUID;
    v_item RECORD;
    v_inserted_sale RECORD;
    v_site_id UUID;
    v_country_code TEXT;
BEGIN
    v_site_id := (p_sale->>'site_id')::UUID;
    v_country_code := COALESCE(p_sale->>'country_code', 'ET');

    IF auth.role() = 'authenticated' AND NOT public.is_ceo() AND NOT public.is_admin() THEN
        IF v_site_id::text != (SELECT public.get_my_site_code_or_id())::text AND
           v_site_id NOT IN (
               SELECT s.id FROM public.sites s 
               WHERE s.id::text = (SELECT public.get_my_site_code_or_id())::text 
                  OR s.code::text = (SELECT public.get_my_site_code_or_id())::text
           ) THEN
            RAISE EXCEPTION 'Site Authorization Violation: Caller is not authorized to register sales for site "%".', v_site_id;
        END IF;
    END IF;

    INSERT INTO public.sales (
        site_id,
        country_code,
        total,
        subtotal,
        tax,
        payment_method,
        status,
        amount_tendered,
        change,
        cashier_name,
        receipt_number,
        customer_id
    ) VALUES (
        v_site_id,
        v_country_code,
        COALESCE((p_sale->>'total')::NUMERIC, (p_sale->>'total_amount')::NUMERIC, 0),
        COALESCE((p_sale->>'subtotal')::NUMERIC, (p_sale->>'total')::NUMERIC, 0),
        COALESCE((p_sale->>'tax')::NUMERIC, 0),
        COALESCE(p_sale->>'payment_method', p_sale->>'method', 'Cash'),
        COALESCE(p_sale->>'status', 'Completed'),
        (p_sale->>'amount_tendered')::NUMERIC,
        (p_sale->>'change')::NUMERIC,
        p_sale->>'cashier_name',
        p_sale->>'receipt_number',
        CASE WHEN p_sale->>'customer_id' IS NOT NULL AND p_sale->>'customer_id' != '' THEN (p_sale->>'customer_id')::UUID ELSE NULL END
    )
    RETURNING id INTO v_sale_id;

    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        product_id UUID,
        product_name TEXT,
        quantity NUMERIC,
        price NUMERIC,
        cost_price NUMERIC
    )
    LOOP
        INSERT INTO public.sale_items (
            sale_id,
            product_id,
            product_name,
            quantity,
            price,
            cost_price
        ) VALUES (
            v_sale_id,
            v_item.product_id,
            v_item.product_name,
            v_item.quantity,
            v_item.price,
            v_item.cost_price
        );
    END LOOP;

    SELECT * INTO v_inserted_sale FROM public.sales WHERE id = v_sale_id;

    RETURN to_jsonb(v_inserted_sale);
END;
$function$;
CREATE OR REPLACE FUNCTION public.debug_po_data()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'count_by_year', (
            SELECT json_agg(t) FROM (
                SELECT 
                    date_trunc('year', COALESCE(order_date, created_at)) as year,
                    COUNT(*) as count
                FROM purchase_orders
                GROUP BY 1
            ) t
        ),
        'count_by_status_2025', (
            SELECT json_agg(t) FROM (
                SELECT status, COUNT(*) 
                FROM purchase_orders 
                WHERE date_trunc('year', COALESCE(order_date, created_at)) = '2025-01-01'
                GROUP BY 1
            ) t
        ),
        'sample_2025_dates', (
            SELECT json_agg(t) FROM (
                SELECT id, order_date, created_at, status 
                FROM purchase_orders 
                WHERE date_trunc('year', COALESCE(order_date, created_at)) = '2025-01-01'
                LIMIT 5
            ) t
        )
    ) INTO result;
    
    RETURN result;
END;
$function$;
CREATE OR REPLACE FUNCTION public.debug_po_deep_dive()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'column_types', (
            SELECT json_agg(t) FROM (
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'purchase_orders' 
                  AND column_name IN ('order_date', 'created_at', 'status', 'total_amount', 'site_id')
            ) t
        ),
        'site_distribution_2025', (
            SELECT json_agg(t) FROM (
                SELECT site_id, COUNT(*) 
                FROM purchase_orders 
                WHERE date_trunc('year', COALESCE(order_date, created_at)) = '2025-01-01'
                GROUP BY 1
            ) t
        ),
        'sites_table', (
           SELECT json_agg(t) FROM (SELECT id, name FROM sites) t
        )
    ) INTO result;
    
    RETURN result;
END;
$function$;
CREATE OR REPLACE FUNCTION public.enforce_employee_update_privileges()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
    v_calling_uid UUID;
    v_calling_role TEXT;
    v_is_self BOOLEAN;
    v_is_admin BOOLEAN;
    v_is_hr_leadership BOOLEAN;
    v_my_region TEXT;
    v_my_site UUID;
BEGIN
    v_calling_uid := auth.uid();

    IF v_calling_uid IS NULL THEN
        RETURN NEW;
    END IF;

    v_calling_role := public.get_my_role();
    v_is_admin := (v_calling_role IN ('super_admin', 'admin', 'CEO'));
    v_is_hr_leadership := (v_calling_role IN ('hr_manager'));
    v_my_region := public.get_my_region_code();
    v_my_site := public.get_my_site_id();

    v_is_self := (v_calling_uid = OLD.id OR LOWER(auth.jwt() ->> 'email') = LOWER(OLD.email));

    IF v_is_self AND NOT v_is_admin THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff are strictly prohibited from modifying their own access role.';
        END IF;

        IF NEW.salary IS DISTINCT FROM OLD.salary THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff are strictly prohibited from modifying their own compensation.';
        END IF;

        IF NEW.status IS DISTINCT FROM OLD.status THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff are strictly prohibited from altering their own employment status.';
        END IF;

        IF NEW.site_id IS DISTINCT FROM OLD.site_id THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff cannot change their own workplace assignment.';
        END IF;

        IF NEW.region_code IS DISTINCT FROM OLD.region_code THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff cannot alter their own regional territory.';
        END IF;

        IF NEW.scope_level IS DISTINCT FROM OLD.scope_level THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff cannot alter their own governance scope.';
        END IF;

        IF NEW.department IS DISTINCT FROM OLD.department THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff cannot modify their department assignment.';
        END IF;

        IF NEW.code IS DISTINCT FROM OLD.code THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff cannot modify their employee identification code.';
        END IF;

        IF NEW.quota_status IS DISTINCT FROM OLD.quota_status OR NEW.quota_approved_by IS DISTINCT FROM OLD.quota_approved_by THEN
            RAISE EXCEPTION 'Security Policy Violation: Staff cannot modify headcount quota records.';
        END IF;
    END IF;

    IF NOT v_is_admin AND NOT v_is_hr_leadership THEN
        IF NEW.role IN ('super_admin', 'admin', 'CEO', 'operations_manager', 'finance_manager', 'hr_manager', 'auditor') 
           AND (OLD.role IS DISTINCT FROM NEW.role) THEN
            RAISE EXCEPTION 'Security Policy Violation: Only Executive Administration or HR Leadership can assign corporate HQ roles.';
        END IF;

        IF v_calling_role IN ('regional_manager', 'regional_hr_officer') THEN
            IF NEW.region_code IS DISTINCT FROM OLD.region_code AND NEW.region_code IS DISTINCT FROM v_my_region THEN
                RAISE EXCEPTION 'Security Policy Violation: Regional managers cannot reassign staff to a foreign region.';
            END IF;

            IF NEW.site_id IS DISTINCT FROM OLD.site_id AND NEW.site_id IS NOT NULL THEN
                IF NOT EXISTS (
                    SELECT 1 FROM public.sites 
                    WHERE id = NEW.site_id AND (region_code = v_my_region OR v_my_region IS NULL)
                ) THEN
                    RAISE EXCEPTION 'Security Policy Violation: Assigned workplace must reside within your regional boundary.';
                END IF;
            END IF;
        END IF;

        IF public.is_manager() AND v_calling_role NOT IN ('regional_manager', 'regional_hr_officer') THEN
            IF NEW.site_id IS DISTINCT FROM OLD.site_id AND NEW.site_id IS DISTINCT FROM v_my_site THEN
                RAISE EXCEPTION 'Security Policy Violation: Site managers cannot transfer staff to external facilities.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.enforce_inventory_requests_zero_trust()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    current_user_name TEXT;
    current_user_email TEXT;
BEGIN
    IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
        IF NOT (public.is_ceo() OR public.is_admin()) THEN
            RAISE EXCEPTION 'Zero-Trust Security Violation: Only Central HQ leadership can approve inventory adjustments.';
        END IF;

        SELECT name, email INTO current_user_name, current_user_email
        FROM public.employees
        WHERE id::text = (SELECT auth.uid())::text 
           OR LOWER(email) = LOWER(COALESCE((SELECT auth.jwt() ->> 'email'), ''))
        LIMIT 1;

        IF (OLD.requested_by IS NOT NULL AND OLD.requested_by <> '') THEN
            IF LOWER(OLD.requested_by) = LOWER(COALESCE(current_user_name, ''))
               OR LOWER(OLD.requested_by) = LOWER(COALESCE(current_user_email, ''))
               OR LOWER(OLD.requested_by) = LOWER(COALESCE(NEW.approved_by, '')) THEN
                RAISE EXCEPTION 'Zero-Trust 4-Eyes Principle Violation: Requesters cannot approve their own inventory adjustments.';
            END IF;
        END IF;

        NEW.approved_at = NOW();
    END IF;

    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.enforce_price_change_margin_floor()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_price NUMERIC;
    v_sale NUMERIC;
    v_on_sale BOOLEAN;
    v_cost NUMERIC;
    v_effective NUMERIC;
BEGIN
    IF NEW.status = 'approved'
       AND OLD.status IS DISTINCT FROM 'approved'
       AND NEW.change_type = 'edit'
       AND COALESCE(NEW.adjustment_reason, '') LIKE 'PRICE_CHANGE%'
       AND NEW.proposed_changes IS NOT NULL THEN

        v_price   := NULLIF(NEW.proposed_changes->>'price', '')::NUMERIC;
        v_sale    := NULLIF(NEW.proposed_changes->>'salePrice', '')::NUMERIC;
        v_on_sale := COALESCE((NEW.proposed_changes->>'isOnSale')::BOOLEAN, FALSE);
        v_cost    := NULLIF(NEW.proposed_changes->>'costPrice', '')::NUMERIC;
        v_effective := CASE WHEN v_on_sale AND COALESCE(v_sale, 0) > 0 THEN v_sale ELSE v_price END;

        IF COALESCE(v_effective, 0) > 0 AND COALESCE(v_cost, 0) > 0
           AND ((v_effective - v_cost) / v_effective) * 100 < 15
           AND (SELECT public.get_my_role()) NOT IN ('finance_manager', 'super_admin') THEN
            RAISE EXCEPTION 'Zero-Trust Violation: price changes below the 15%% margin floor require Finance Manager or CEO approval.';
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.enforce_product_update_restrictions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  emp_role TEXT;
  emp_id UUID;
  has_active_job BOOLEAN;
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  emp_role := public.get_my_role();
  emp_id := public.get_my_employee_id();

  IF emp_role = 'super_admin' THEN
    RETURN NEW;
  END IF;

  IF (OLD.price IS DISTINCT FROM NEW.price OR
      OLD.sale_price IS DISTINCT FROM NEW.sale_price OR
      OLD.cost_price IS DISTINCT FROM NEW.cost_price OR
      OLD.is_on_sale IS DISTINCT FROM NEW.is_on_sale) THEN
      IF emp_role NOT IN ('procurement_manager', 'procurement', 'CEO', 'ceo') THEN
          RAISE EXCEPTION 'Only the CEO and Procurement staff can modify product pricing or cost fields.';
      END IF;
  END IF;

  IF (OLD.name IS DISTINCT FROM NEW.name OR
      OLD.sku IS DISTINCT FROM NEW.sku OR
      OLD.category IS DISTINCT FROM NEW.category OR
      OLD.brand IS DISTINCT FROM NEW.brand OR
      OLD.size IS DISTINCT FROM NEW.size OR
      OLD.unit IS DISTINCT FROM NEW.unit OR
      OLD.description IS DISTINCT FROM NEW.description OR
      OLD.image IS DISTINCT FROM NEW.image OR
      OLD.custom_attributes IS DISTINCT FROM NEW.custom_attributes OR
      OLD.min_stock IS DISTINCT FROM NEW.min_stock OR
      OLD.max_stock IS DISTINCT FROM NEW.max_stock OR
      OLD.pack_quantity IS DISTINCT FROM NEW.pack_quantity) THEN
      IF emp_role NOT IN ('regional_manager', 'super_admin', 'CEO', 'ceo', 'admin') THEN
          RAISE EXCEPTION 'Only the CEO and Regional Managers can edit product details.';
      END IF;
  END IF;

  IF (OLD.stock IS DISTINCT FROM NEW.stock) THEN
      IF emp_role IN ('super_admin', 'CEO', 'ceo', 'admin', 'inventory_controller', 'supply_chain_director') THEN
          NULL;
      ELSE
          SELECT EXISTS (
              SELECT 1
              FROM public.job_assignments ja
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
SET check_function_bodies = on;
RESET search_path;
