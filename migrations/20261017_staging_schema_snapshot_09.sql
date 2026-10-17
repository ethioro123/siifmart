-- Staging schema snapshot, part 09 of 16.
SET search_path = public, extensions, auth;
SET check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.enforce_wms_job_update_restrictions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    old_item JSONB;
    new_item JSONB;
    old_sku TEXT;
    new_sku TEXT;
    old_exp NUMERIC;
    new_exp NUMERIC;
    i INT;
    old_count INT;
    new_count INT;
BEGIN
    IF public.is_ceo() OR public.is_manager() THEN
        NEW.updated_at = NOW();
        RETURN NEW;
    END IF;

    IF NEW.site_id::text IS DISTINCT FROM OLD.site_id::text THEN
        RAISE EXCEPTION 'Zero-Trust Security Violation: Floor workers cannot reassign the facility site_id of a job.';
    END IF;

    IF NEW.country_code::text IS DISTINCT FROM OLD.country_code::text THEN
        RAISE EXCEPTION 'Zero-Trust Security Violation: Floor workers cannot alter the country_code of a job.';
    END IF;

    IF NEW.order_ref::text IS DISTINCT FROM OLD.order_ref::text THEN
        RAISE EXCEPTION 'Zero-Trust Security Violation: Floor workers cannot alter the order reference of a job.';
    END IF;

    IF OLD.assigned_to IS NOT NULL AND OLD.assigned_to::text <> '' THEN
        IF NEW.assigned_to::text IS DISTINCT FROM OLD.assigned_to::text THEN
            RAISE EXCEPTION 'Zero-Trust Security Violation: Only supervisors and dispatchers can reassign active jobs.';
        END IF;
    END IF;

    IF OLD.line_items IS NOT NULL AND jsonb_typeof(OLD.line_items) = 'array' THEN
        old_count := jsonb_array_length(OLD.line_items);
        new_count := COALESCE(jsonb_array_length(NEW.line_items), 0);

        IF new_count < old_count THEN
            RAISE EXCEPTION 'Zero-Trust Security Violation: Workers cannot delete line items from a job manifest.';
        END IF;

        FOR i IN 0..(old_count - 1) LOOP
            old_item := OLD.line_items->i;
            new_item := NEW.line_items->i;

            old_sku := COALESCE(old_item->>'sku', old_item->>'productId', '');
            new_sku := COALESCE(new_item->>'sku', new_item->>'productId', '');

            IF old_sku <> '' AND new_sku <> '' AND old_sku = new_sku THEN
                old_exp := COALESCE((old_item->>'expectedQty')::numeric, (old_item->>'expected_qty')::numeric, (old_item->>'orderedQty')::numeric, 0);
                new_exp := COALESCE((new_item->>'expectedQty')::numeric, (new_item->>'expected_qty')::numeric, (new_item->>'orderedQty')::numeric, 0);

                IF old_exp > 0 AND new_exp <> old_exp THEN
                    RAISE EXCEPTION 'Zero-Trust Security Violation: Workers cannot modify expected quantity (SKU: %, Expected: %, Attempted: %). Discrepancies must be recorded as Short/Discrepancy.',
                        old_sku, old_exp, new_exp;
                END IF;
            END IF;
        END LOOP;
    END IF;

    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.find_product_by_barcode(p_country text, p_barcode text)
 RETURNS SETOF product_master
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT * FROM product_master
  WHERE country_code = p_country AND barcode = p_barcode AND status <> 'MERGED'
  LIMIT 1;
$function$;
CREATE OR REPLACE FUNCTION public.generate_next_site_code(p_country text)
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_country text;
    v_max_seq integer := 0;
    v_curr_seq integer;
    r RECORD;
BEGIN
    v_country := UPPER(TRIM(p_country));
    IF v_country IS NULL OR v_country = '' THEN
        v_country := 'ET';
    END IF;

    -- Scan existing sites for this specific country
    FOR r IN (
        SELECT code 
        FROM sites 
        WHERE UPPER(COALESCE(country, 'ET')) = v_country
          AND code IS NOT NULL
    ) LOOP
        -- Match direct pattern: KE-01, ET-02
        IF r.code ~* ('^' || v_country || '-(\d+)$') THEN
            v_curr_seq := (regexp_match(r.code, '^' || v_country || '-(\d+)$', 'i'))[1]::integer;
            IF v_curr_seq > v_max_seq THEN
                v_max_seq := v_curr_seq;
            END IF;
        -- Match legacy pattern: SITE-KE-0001
        ELSIF r.code ~* ('^SITE-' || v_country || '-(\d+)$') THEN
            v_curr_seq := (regexp_match(r.code, '^SITE-' || v_country || '-(\d+)$', 'i'))[1]::integer;
            IF v_curr_seq > v_max_seq THEN
                v_max_seq := v_curr_seq;
            END IF;
        -- Match historic Ethiopian pattern: SITE-0001, ST-001, WH-001
        ELSIF v_country = 'ET' AND r.code ~* '^(?:SITE|ST|WH)-?(\d+)$' THEN
            v_curr_seq := (regexp_match(r.code, '^(?:SITE|ST|WH)-?(\d+)$', 'i'))[1]::integer;
            IF v_curr_seq > v_max_seq THEN
                v_max_seq := v_curr_seq;
            END IF;
        END IF;
    END LOOP;

    RETURN v_country || '-' || LPAD((v_max_seq + 1)::text, 2, '0');
END;
$function$;
CREATE OR REPLACE FUNCTION public.generate_po_number()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.po_number IS NULL THEN
    NEW.po_number := 'PO-' || LPAD(nextval('po_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.get_auth_role()
 RETURNS text
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN public.get_my_role();
END;
$function$;
CREATE OR REPLACE FUNCTION public.get_financial_metrics(p_site_id text DEFAULT NULL::text, p_start_date timestamp without time zone DEFAULT NULL::timestamp without time zone, p_end_date timestamp without time zone DEFAULT NULL::timestamp without time zone, p_country_code text DEFAULT 'ET'::text)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_site_uuid UUID;
    v_country TEXT;
    v_is_admin BOOLEAN := FALSE;
    v_total_revenue NUMERIC := 0;
    v_total_expenses NUMERIC := 0;
    v_total_refunds NUMERIC := 0;
    v_net_profit NUMERIC := 0;
    v_profit_margin NUMERIC := 0;
    v_expense_breakdown JSON;
    v_cashflow_data JSON;
BEGIN
    -- 1. Normalize country code
    v_country := UPPER(COALESCE(NULLIF(TRIM(p_country_code), ''), 'ET'));

    -- 2. Validate and inspect target site
    IF p_site_id IS NOT NULL AND p_site_id != 'All' AND p_site_id != '' THEN
        BEGIN
            v_site_uuid := p_site_id::UUID;
            SELECT 
                (type IN ('Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations', 'Head Office')),
                UPPER(COALESCE(country, v_country))
            INTO v_is_admin, v_country
            FROM sites
            WHERE id = v_site_uuid;
        EXCEPTION WHEN OTHERS THEN
            v_site_uuid := NULL;
        END;
    ELSE
        v_site_uuid := NULL;
    END IF;

    -- 3. If target is Administration Central HQ, treat as country-wide rollup
    IF v_is_admin IS TRUE THEN
        v_site_uuid := NULL;
    END IF;

    -- 4. REVENUE (Country-Isolated)
    SELECT COALESCE(SUM(total), 0) INTO v_total_revenue 
    FROM sales
    WHERE country_code = v_country
      AND (v_site_uuid IS NULL OR site_id = v_site_uuid)
      AND (p_start_date IS NULL OR sale_date >= p_start_date)
      AND (p_end_date IS NULL OR sale_date <= p_end_date)
      AND status != 'Cancelled';

    -- 5. REFUNDS (Country-Isolated)
    SELECT COALESCE(SUM(total), 0) INTO v_total_refunds 
    FROM sales
    WHERE country_code = v_country
      AND (v_site_uuid IS NULL OR site_id = v_site_uuid)
      AND (p_start_date IS NULL OR sale_date >= p_start_date)
      AND (p_end_date IS NULL OR sale_date <= p_end_date)
      AND status = 'Refunded';

    -- 6. EXPENSES (Country-Isolated via sites country partition)
    SELECT COALESCE(SUM(e.amount), 0) INTO v_total_expenses 
    FROM expenses e
    JOIN sites s ON e.site_id = s.id
    WHERE s.country = v_country
      AND (v_site_uuid IS NULL OR e.site_id = v_site_uuid)
      AND (p_start_date IS NULL OR e.expense_date >= p_start_date::date)
      AND (p_end_date IS NULL OR e.expense_date <= p_end_date::date);

    -- 7. NET PROFIT & MARGIN
    v_net_profit := v_total_revenue - v_total_refunds - v_total_expenses;
    IF v_total_revenue > 0 THEN 
        v_profit_margin := ROUND((v_net_profit / v_total_revenue) * 100, 1); 
    ELSE 
        v_profit_margin := 0; 
    END IF;

    -- 8. EXPENSE BREAKDOWN (Country-Isolated)
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_expense_breakdown FROM (
        SELECT e.category as name, SUM(e.amount) as value 
        FROM expenses e
        JOIN sites s ON e.site_id = s.id
        WHERE s.country = v_country
          AND (v_site_uuid IS NULL OR e.site_id = v_site_uuid)
          AND (p_start_date IS NULL OR e.expense_date >= p_start_date::date)
          AND (p_end_date IS NULL OR e.expense_date <= p_end_date::date)
        GROUP BY e.category 
        ORDER BY value DESC
    ) t;

    -- 9. CASHFLOW TREND (Weekly series, Country-Isolated)
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_cashflow_data FROM (
        WITH date_series AS (
            SELECT generate_series(
                COALESCE(p_start_date, (SELECT MIN(sale_date) FROM sales WHERE country_code = v_country), NOW() - interval '90 days'),
                COALESCE(p_end_date, NOW()),
                '1 week'::interval
            ) as week_start
        ),
        sales_agg AS (
            SELECT date_trunc('week', sale_date) as week, SUM(total) as income 
            FROM sales
            WHERE country_code = v_country
              AND (v_site_uuid IS NULL OR site_id = v_site_uuid)
              AND (p_start_date IS NULL OR sale_date >= p_start_date)
              AND (p_end_date IS NULL OR sale_date <= p_end_date)
              AND status != 'Cancelled' 
            GROUP BY 1
        ),
        expenses_agg AS (
            SELECT date_trunc('week', e.expense_date::timestamp) as week, SUM(e.amount) as expense 
            FROM expenses e
            JOIN sites s ON e.site_id = s.id
            WHERE s.country = v_country
              AND (v_site_uuid IS NULL OR e.site_id = v_site_uuid)
              AND (p_start_date IS NULL OR e.expense_date >= p_start_date::date)
              AND (p_end_date IS NULL OR e.expense_date <= p_end_date::date) 
            GROUP BY 1
        )
        SELECT 
            to_char(ds.week_start, 'YYYY-MM-DD') as name, 
            COALESCE(s.income, 0) as income, 
            COALESCE(e.expense, 0) as expense 
        FROM date_series ds 
        LEFT JOIN sales_agg s ON s.week = ds.week_start 
        LEFT JOIN expenses_agg e ON e.week = ds.week_start 
        ORDER BY ds.week_start
    ) t;

    RETURN json_build_object(
        'total_revenue', v_total_revenue, 
        'total_expenses', v_total_expenses, 
        'total_refunds', v_total_refunds, 
        'net_profit', v_net_profit, 
        'profit_margin', v_profit_margin, 
        'expense_breakdown', v_expense_breakdown, 
        'cashflow_data', v_cashflow_data
    );
END;
$function$;
SET check_function_bodies = on;
RESET search_path;
