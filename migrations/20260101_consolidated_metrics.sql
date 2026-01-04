-- ============================================================================
-- CONSOLIDATED MIGRATION: DASHBOARD, FINANCIAL, PROCUREMENT & WAREHOUSE METRICS
-- ============================================================================
-- Copy everything below and run in Supabase SQL Editor.
-- This defines FOUR powerful analytics functions with TEXT siteId support.

-- ----------------------------------------------------------------------------
-- 1. INVENTORY & OPERATIONS METRICS
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS get_inventory_metrics(UUID);
DROP FUNCTION IF EXISTS get_inventory_metrics(TEXT);

CREATE OR REPLACE FUNCTION get_inventory_metrics(p_site_id TEXT DEFAULT NULL)
RETURNS JSON AS $func$
DECLARE
    v_site_uuid UUID;
    v_total_count INTEGER;
    v_total_value_cost NUMERIC;
    v_total_value_retail NUMERIC;
    v_low_stock_count INTEGER;
    v_out_of_stock_count INTEGER;
    v_active_alerts INTEGER;
    v_category_stats JSON;
    v_abc_stats JSON;
    v_total_revenue NUMERIC;
    v_net_profit NUMERIC;
    v_profit_margin NUMERIC;
    v_active_orders_count INTEGER;
    v_inbound_po_count INTEGER;
    v_avg_cycle_time TEXT;
    v_return_rate NUMERIC;
    v_total_returned_value NUMERIC;
    v_site_performance JSON;
    v_sales_by_category JSON;
    v_top_products JSON;
BEGIN
    -- Resolve UUID
    IF p_site_id IS NOT NULL AND p_site_id != 'All' AND p_site_id != '' THEN
        v_site_uuid := p_site_id::UUID;
    ELSE
        v_site_uuid := NULL;
    END IF;

    -- Inventory Counts & Value
    SELECT 
        COUNT(*),
        COALESCE(SUM(stock * COALESCE(cost_price, price * 0.7)), 0),
        COALESCE(SUM(stock * price), 0),
        COUNT(*) FILTER (WHERE status = 'low_stock' OR (stock < 10 AND stock > 0)),
        COUNT(*) FILTER (WHERE status = 'out_of_stock' OR stock = 0)
    INTO 
        v_total_count, v_total_value_cost, v_total_value_retail, v_low_stock_count, v_out_of_stock_count
    FROM products
    WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND status != 'archived';

    v_active_alerts := v_low_stock_count + v_out_of_stock_count;

    -- Financials (Global)
    SELECT COALESCE(SUM(total), 0) INTO v_total_revenue
    FROM sales WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND UPPER(status) != 'CANCELLED';
    
    SELECT COALESCE(SUM(si.quantity * (si.price - si.cost_price)), 0) INTO v_net_profit
    FROM sale_items si JOIN sales s ON s.id = si.sale_id
    WHERE (v_site_uuid IS NULL OR s.site_id = v_site_uuid) AND UPPER(s.status) NOT IN ('CANCELLED', 'REFUNDED');
    
    IF v_total_revenue > 0 THEN v_profit_margin := ROUND((v_net_profit / v_total_revenue) * 100, 1); ELSE v_profit_margin := 0; END IF;

    -- Logistics
    SELECT COUNT(*) INTO v_active_orders_count FROM sales
    WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND UPPER(status) NOT IN ('COMPLETED', 'CANCELLED', 'REFUNDED');
    
    SELECT COUNT(*) INTO v_inbound_po_count FROM purchase_orders
    WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND UPPER(status) NOT IN ('RECEIVED', 'CANCELLED');

    -- Average Cycle Time (Site Specific)
    SELECT COALESCE((AVG(EXTRACT(EPOCH FROM (ja.completed_at - ja.assigned_at))) / 60)::INTEGER || 'm', '0m') INTO v_avg_cycle_time
    FROM job_assignments ja
    JOIN wms_jobs j ON ja.job_id = j.id
    WHERE UPPER(ja.status) = 'COMPLETED' 
      AND (v_site_uuid IS NULL OR j.site_id = v_site_uuid OR j.dest_site_id = v_site_uuid)
      AND ja.assigned_at IS NOT NULL AND ja.completed_at IS NOT NULL;

    -- Charts & Stats
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_category_stats FROM (
        SELECT category as name, SUM(stock * price) as value FROM products
        WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND UPPER(status) != 'ARCHIVED'
        GROUP BY category ORDER BY value DESC LIMIT 6
    ) t;

    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_site_performance FROM (
        SELECT st.name, SUM(s.total) as revenue FROM sales s JOIN sites st ON s.site_id = st.id
        WHERE (v_site_uuid IS NULL OR s.site_id = v_site_uuid) AND UPPER(s.status) != 'CANCELLED'
        GROUP BY st.name ORDER BY revenue DESC LIMIT 10
    ) t;

    RETURN json_build_object(
        'total_count', v_total_count, 'total_value_cost', v_total_value_cost, 'total_value_retail', v_total_value_retail,
        'active_alerts', v_active_alerts, 'total_revenue', v_total_revenue, 'net_profit', v_net_profit,
        'profit_margin', v_profit_margin, 'active_orders', v_active_orders_count, 'inbound_pos', v_inbound_po_count,
        'avg_cycle_time', v_avg_cycle_time, 'category_stats', v_category_stats, 'site_performance', v_site_performance
    );
END;
$func$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 2. FINANCIAL METRICS
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS get_financial_metrics(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_financial_metrics(UUID, TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS get_financial_metrics(TEXT, TIMESTAMP, TIMESTAMP);

CREATE OR REPLACE FUNCTION get_financial_metrics(
    p_site_id TEXT DEFAULT NULL,
    p_start_date TIMESTAMP DEFAULT NULL,
    p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS JSON AS $func$
DECLARE
    v_site_uuid UUID;
    v_total_revenue NUMERIC;
    v_total_expenses NUMERIC;
    v_total_refunds NUMERIC;
    v_net_profit NUMERIC;
    v_profit_margin NUMERIC;
    v_expense_breakdown JSON;
    v_cashflow_data JSON;
BEGIN
    IF p_site_id IS NOT NULL AND p_site_id != 'All' AND p_site_id != '' THEN v_site_uuid := p_site_id::UUID; ELSE v_site_uuid := NULL; END IF;

    -- Revenue & Refunds
    SELECT COALESCE(SUM(total), 0) INTO v_total_revenue FROM sales
    WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND (p_start_date IS NULL OR sale_date >= p_start_date) AND (p_end_date IS NULL OR sale_date <= p_end_date) AND status != 'Cancelled';

    SELECT COALESCE(SUM(total), 0) INTO v_total_refunds FROM sales
    WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND (p_start_date IS NULL OR sale_date >= p_start_date) AND (p_end_date IS NULL OR sale_date <= p_end_date) AND status = 'Refunded';

    -- Expenses (Fixed column name from 'date' to 'expense_date')
    SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses FROM expenses
    WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND (p_start_date IS NULL OR expense_date >= p_start_date::date) AND (p_end_date IS NULL OR expense_date <= p_end_date::date);

    v_net_profit := v_total_revenue - v_total_refunds - v_total_expenses;
    IF v_total_revenue > 0 THEN v_profit_margin := ROUND((v_net_profit / v_total_revenue) * 100, 1); ELSE v_profit_margin := 0; END IF;

    -- Stats
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_expense_breakdown FROM (
        SELECT category as name, SUM(amount) as value FROM expenses
        WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND (p_start_date IS NULL OR expense_date >= p_start_date::date) AND (p_end_date IS NULL OR expense_date <= p_end_date::date)
        GROUP BY category ORDER BY value DESC
    ) t;

    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_cashflow_data FROM (
        WITH date_series AS (
            SELECT generate_series(COALESCE(p_start_date, (SELECT MIN(sale_date) FROM sales)), COALESCE(p_end_date, NOW()), '1 week'::interval) as week_start
        ),
        sales_agg AS (
            SELECT date_trunc('week', sale_date) as week, SUM(total) as income FROM sales
            WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND (p_start_date IS NULL OR sale_date >= p_start_date) AND (p_end_date IS NULL OR sale_date <= p_end_date) AND status != 'Cancelled' GROUP BY 1
        ),
        expenses_agg AS (
            SELECT date_trunc('week', expense_date) as week, SUM(amount) as expense FROM expenses
            WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND (p_start_date IS NULL OR expense_date >= p_start_date::date) AND (p_end_date IS NULL OR expense_date <= p_end_date::date) GROUP BY 1
        )
        SELECT to_char(ds.week_start, 'YYYY-MM-DD') as name, COALESCE(s.income, 0) as income, COALESCE(e.expense, 0) as expense FROM date_series ds LEFT JOIN sales_agg s ON s.week = ds.week_start LEFT JOIN expenses_agg e ON e.week = ds.week_start ORDER BY ds.week_start
    ) t;

    RETURN json_build_object('total_revenue', v_total_revenue, 'total_expenses', v_total_expenses, 'total_refunds', v_total_refunds, 'net_profit', v_net_profit, 'profit_margin', v_profit_margin, 'expense_breakdown', v_expense_breakdown, 'cashflow_data', v_cashflow_data);
END;
$func$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 3. PROCUREMENT METRICS
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS get_procurement_metrics(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS get_procurement_metrics(UUID, TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS get_procurement_metrics(TEXT, TIMESTAMP, TIMESTAMP);

CREATE OR REPLACE FUNCTION get_procurement_metrics(
    p_site_id TEXT DEFAULT NULL,
    p_start_date TIMESTAMP DEFAULT NULL,
    p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS JSON AS $func$
DECLARE
    v_site_uuid UUID;
    v_total_spend NUMERIC;
    v_open_po_count INTEGER;
    v_pending_value NUMERIC;
    v_category_spend JSON;
    v_trend_data JSON;
BEGIN
    IF p_site_id IS NOT NULL AND p_site_id != 'All' AND p_site_id != '' THEN v_site_uuid := p_site_id::UUID; ELSE v_site_uuid := NULL; END IF;

    SELECT COALESCE(SUM(total_amount), 0) INTO v_total_spend FROM purchase_orders
    WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND (p_start_date IS NULL OR created_at >= p_start_date) AND (p_end_date IS NULL OR created_at <= p_end_date) AND status != 'Cancelled';

    SELECT COUNT(*), COALESCE(SUM(total_amount), 0) INTO v_open_po_count, v_pending_value FROM purchase_orders
    WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND (p_start_date IS NULL OR created_at >= p_start_date) AND (p_end_date IS NULL OR created_at <= p_end_date) AND status IN ('Draft', 'Pending', 'Approved');

    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_category_spend FROM (
        SELECT COALESCE(p.category, 'General') as name, SUM(pi.total_cost) as value FROM po_items pi JOIN purchase_orders po ON pi.po_id = po.id LEFT JOIN products p ON pi.product_id = p.id
        WHERE (v_site_uuid IS NULL OR po.site_id = v_site_uuid) AND (p_start_date IS NULL OR po.created_at >= p_start_date) AND (p_end_date IS NULL OR po.created_at <= p_end_date) AND po.status != 'Cancelled'
        GROUP BY 1 ORDER BY value DESC LIMIT 6
    ) t;

    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_trend_data FROM (
        SELECT to_char(date_trunc('month', created_at), 'Mon') as name, SUM(total_amount) as spend FROM purchase_orders
        WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND (p_start_date IS NULL OR created_at >= p_start_date) AND (p_end_date IS NULL OR created_at <= p_end_date) AND status != 'Cancelled'
        GROUP BY 1 ORDER BY 1 LIMIT 12
    ) t;

    RETURN json_build_object('totalSpend', v_total_spend, 'openPO', v_open_po_count, 'pendingValue', v_pending_value, 'categoryData', v_category_spend, 'trendData', v_trend_data);
END;
$func$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 4. WAREHOUSE METRICS
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS get_warehouse_metrics(UUID, TEXT);
DROP FUNCTION IF EXISTS get_warehouse_metrics(UUID, TIMESTAMP);
DROP FUNCTION IF EXISTS get_warehouse_metrics(UUID, TIMESTAMP, TIMESTAMP);
DROP FUNCTION IF EXISTS get_warehouse_metrics(TEXT, TIMESTAMP, TIMESTAMP);

CREATE OR REPLACE FUNCTION get_warehouse_metrics(
    p_site_id TEXT DEFAULT NULL,
    p_start_date TIMESTAMP DEFAULT NULL,
    p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS JSON AS $func$
DECLARE
    v_site_uuid UUID;
    v_flow_data JSON;
    v_fast_movers JSON;
    v_job_stats JSON;
    v_job_type_breakdown JSON;
    v_zone_data JSON;
BEGIN
    IF p_site_id IS NOT NULL AND p_site_id != 'All' AND p_site_id != '' THEN v_site_uuid := p_site_id::UUID; ELSE v_site_uuid := NULL; END IF;

    -- Zones
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_zone_data FROM (
        SELECT id, name, capacity, occupied, type FROM warehouse_zones
        WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid)
        ORDER BY name ASC
    ) t;

    -- Flow
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_flow_data FROM (
        SELECT to_char(date_trunc('day', movement_date), 'YYYY-MM-DD') as date, to_char(date_trunc('day', movement_date), 'Dy') as name, COUNT(*) FILTER (WHERE UPPER(type) IN ('IN', 'RETURN', 'TRANSFER_IN', 'ADJUSTMENT_UP')) as inbound, COUNT(*) FILTER (WHERE UPPER(type) IN ('OUT', 'SALE', 'TRANSFER_OUT', 'ADJUSTMENT_DOWN')) as outbound FROM stock_movements
        WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND (p_start_date IS NULL OR movement_date >= p_start_date) AND (p_end_date IS NULL OR movement_date <= p_end_date)
        GROUP BY 1, 2 ORDER BY 1
    ) t;

    -- Movers
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_fast_movers FROM (
        SELECT COALESCE(product_name, 'Unknown') as name, COALESCE(SUM(quantity), 0) as moved, '+12%' as trend FROM stock_movements
        WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid) AND (p_start_date IS NULL OR movement_date >= p_start_date) AND (p_end_date IS NULL OR movement_date <= p_end_date) AND UPPER(type) IN ('OUT', 'SALE', 'TRANSFER_OUT')
        GROUP BY 1 ORDER BY moved DESC LIMIT 5
    ) t;

    -- Jobs
    SELECT json_build_object(
        'total', COUNT(*),
        'completed', COUNT(*) FILTER (WHERE UPPER(status) = 'COMPLETED' AND (p_start_date IS NULL OR updated_at >= p_start_date) AND (p_end_date IS NULL OR updated_at <= p_end_date)),
        'active', COUNT(*) FILTER (WHERE UPPER(status) NOT IN ('COMPLETED', 'CANCELLED')),
        'pending_picks', COUNT(*) FILTER (WHERE UPPER(type) = 'PICK' AND UPPER(status) NOT IN ('COMPLETED', 'CANCELLED')),
        'critical_picks', COUNT(*) FILTER (WHERE UPPER(type) = 'PICK' AND UPPER(priority) IN ('CRITICAL', 'HIGH') AND UPPER(status) NOT IN ('COMPLETED', 'CANCELLED')),
        'pick_accuracy', COALESCE(ROUND((SUM(items_count) FILTER (WHERE UPPER(type) = 'PICK' AND UPPER(status) = 'COMPLETED' AND (p_start_date IS NULL OR updated_at >= p_start_date) AND (p_end_date IS NULL OR updated_at <= p_end_date))::numeric / NULLIF(SUM(items_count) FILTER (WHERE UPPER(type) = 'PICK' AND (p_start_date IS NULL OR created_at >= p_start_date) AND (p_end_date IS NULL OR created_at <= p_end_date)), 0)) * 100, 1)::text || '%', '100%'),
        'avg_cycle_time', COALESCE((AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) FILTER (WHERE UPPER(status) = 'COMPLETED' AND (p_start_date IS NULL OR updated_at >= p_start_date) AND (p_end_date IS NULL OR updated_at <= p_end_date)) / 60)::INTEGER || 'm', '0m')
    ) INTO v_job_stats FROM wms_jobs WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid OR dest_site_id = v_site_uuid);

    -- Queue
    SELECT COALESCE(json_object_agg(UPPER(type), job_count), '{}'::json) INTO v_job_type_breakdown FROM (
        SELECT type, COUNT(*) as job_count FROM wms_jobs
        WHERE (v_site_uuid IS NULL OR site_id = v_site_uuid OR dest_site_id = v_site_uuid) AND UPPER(status) NOT IN ('COMPLETED', 'CANCELLED')
        GROUP BY type
    ) t;

    RETURN json_build_object('flow_data', v_flow_data, 'fast_movers', v_fast_movers, 'job_stats', v_job_stats, 'queue_breakdown', v_job_type_breakdown, 'zone_data', v_zone_data);
END;
$func$ LANGUAGE plpgsql;
