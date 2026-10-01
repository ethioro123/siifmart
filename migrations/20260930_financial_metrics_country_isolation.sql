-- ============================================================================
-- Migration: 20260930_financial_metrics_country_isolation.sql
-- Description: Country-Isolated Financial Metrics RPC for Zero-Trust & Multi-Country Sovereignty
-- ============================================================================

-- Drop all previous signatures of get_financial_metrics
DROP FUNCTION IF EXISTS get_financial_metrics(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_financial_metrics(UUID, TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS get_financial_metrics(TEXT, TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS get_financial_metrics(TEXT, TIMESTAMP, TIMESTAMP, TEXT);

CREATE OR REPLACE FUNCTION get_financial_metrics(
    p_site_id TEXT DEFAULT NULL,
    p_start_date TIMESTAMP DEFAULT NULL,
    p_end_date TIMESTAMP DEFAULT NULL,
    p_country_code TEXT DEFAULT 'ET'
)
RETURNS JSON AS $func$
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
    -- Normalize country code
    v_country := UPPER(COALESCE(NULLIF(TRIM(p_country_code), ''), 'ET'));

    -- Check if site ID is provided and valid UUID
    IF p_site_id IS NOT NULL AND p_site_id != 'All' AND p_site_id != '' THEN
        BEGIN
            v_site_uuid := p_site_id::UUID;
            -- Check if the target site is an Administration HQ
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

    -- If the site is Administration HQ, treat it as country-wide rollup for that country
    IF v_is_admin IS TRUE THEN
        v_site_uuid := NULL;
    END IF;

    -- 1. REVENUE (Country-Isolated)
    SELECT COALESCE(SUM(total), 0) INTO v_total_revenue 
    FROM sales
    WHERE country_code = v_country
      AND (v_site_uuid IS NULL OR site_id = v_site_uuid)
      AND (p_start_date IS NULL OR sale_date >= p_start_date)
      AND (p_end_date IS NULL OR sale_date <= p_end_date)
      AND status != 'Cancelled';

    -- 2. REFUNDS (Country-Isolated)
    SELECT COALESCE(SUM(total), 0) INTO v_total_refunds 
    FROM sales
    WHERE country_code = v_country
      AND (v_site_uuid IS NULL OR site_id = v_site_uuid)
      AND (p_start_date IS NULL OR sale_date >= p_start_date)
      AND (p_end_date IS NULL OR sale_date <= p_end_date)
      AND status = 'Refunded';

    -- 3. EXPENSES (Country-Isolated via sites country)
    SELECT COALESCE(SUM(e.amount), 0) INTO v_total_expenses 
    FROM expenses e
    JOIN sites s ON e.site_id = s.id
    WHERE s.country = v_country
      AND (v_site_uuid IS NULL OR e.site_id = v_site_uuid)
      AND (p_start_date IS NULL OR e.expense_date >= p_start_date::date)
      AND (p_end_date IS NULL OR e.expense_date <= p_end_date::date);

    -- 4. NET PROFIT & MARGIN
    v_net_profit := v_total_revenue - v_total_refunds - v_total_expenses;
    IF v_total_revenue > 0 THEN 
        v_profit_margin := ROUND((v_net_profit / v_total_revenue) * 100, 1); 
    ELSE 
        v_profit_margin := 0; 
    END IF;

    -- 5. EXPENSE BREAKDOWN
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

    -- 6. CASHFLOW TREND (Weekly series, aligned to country)
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
$func$ LANGUAGE plpgsql SECURITY DEFINER;
