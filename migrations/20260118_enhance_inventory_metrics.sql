-- Enhance inventory metrics with dynamic KPI calculations
CREATE OR REPLACE FUNCTION get_inventory_metrics(p_site_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    -- Basic Inventory Metrics
    v_total_count INTEGER;
    v_total_value_cost NUMERIC;
    v_total_value_retail NUMERIC;
    v_low_stock_count INTEGER;
    v_out_of_stock_count INTEGER;
    v_active_alerts INTEGER;
    v_category_stats JSON;
    v_abc_stats JSON;
    
    -- Dynamic KPIs [NEW]
    v_dead_stock_value NUMERIC;
    v_30d_cogs NUMERIC;
    v_stock_turnover_rate NUMERIC;
    
    -- Financial Metrics
    v_total_revenue NUMERIC;
    v_net_profit NUMERIC;
    v_profit_margin NUMERIC;
    
    -- Order & Logistics Metrics
    v_active_orders_count INTEGER;
    v_inbound_po_count INTEGER;
    v_avg_cycle_time TEXT;
    v_return_rate NUMERIC;
    v_total_returned_value NUMERIC;
    
    -- Charts Data
    v_sales_velocity JSON;
    v_sales_by_category JSON;
    v_top_products JSON;
    v_site_performance JSON;
    
BEGIN
    -- ============================================================================================
    -- 1. INVENTORY METRICS (Products Table)
    -- ============================================================================================
    SELECT 
        COUNT(*),
        COALESCE(SUM(stock * COALESCE(cost_price, price * 0.7)), 0),
        COALESCE(SUM(stock * price), 0),
        COUNT(*) FILTER (WHERE status = 'low_stock' OR (stock < 10 AND stock > 0)),
        COUNT(*) FILTER (WHERE status = 'out_of_stock' OR stock = 0)
    INTO 
        v_total_count,
        v_total_value_cost,
        v_total_value_retail,
        v_low_stock_count,
        v_out_of_stock_count
    FROM products
    WHERE (p_site_id IS NULL OR site_id = p_site_id)
      AND status != 'archived';

    v_active_alerts := v_low_stock_count + v_out_of_stock_count;

    -- [NEW] Dead Stock Calculation (> 90 days no movement)
    SELECT COALESCE(SUM(stock * COALESCE(cost_price, price * 0.7)), 0)
    INTO v_dead_stock_value
    FROM products p
    WHERE (p_site_id IS NULL OR p.site_id = p_site_id)
      AND p.status != 'archived'
      AND p.stock > 0
      AND NOT EXISTS (
          SELECT 1 FROM stock_movements sm 
          WHERE sm.product_id = p.id 
          AND sm.created_at > (NOW() - INTERVAL '90 days')
      );

    -- Category Statistics
    SELECT COALESCE(json_agg(t), '[]'::json)
    INTO v_category_stats
    FROM (
        SELECT 
            category as name,
            SUM(stock * price) as value
        FROM products
        WHERE (p_site_id IS NULL OR site_id = p_site_id)
          AND status != 'archived'
        GROUP BY category
        ORDER BY value DESC
        LIMIT 6
    ) t;
    
    -- ABC Stats
     WITH ranked_products AS (
        SELECT 
            stock * price as val,
            SUM(stock * price) OVER () as total_val
        FROM products
        WHERE (p_site_id IS NULL OR site_id = p_site_id)
          AND status != 'archived'
    ),
    stats AS (
        SELECT
            COUNT(*) FILTER (WHERE val / NULLIF(total_val, 0) > 0.05) as count_a,
            COUNT(*) FILTER (WHERE val / NULLIF(total_val, 0) <= 0.05 AND val / NULLIF(total_val, 0) > 0.02) as count_b,
            COUNT(*) FILTER (WHERE val / NULLIF(total_val, 0) <= 0.02) as count_c
        FROM ranked_products
    )
    SELECT json_build_array(
        json_build_object('name', 'Class A (Vital)', 'value', count_a),
        json_build_object('name', 'Class B (Important)', 'value', count_b),
        json_build_object('name', 'Class C (Standard)', 'value', count_c)
    )
    INTO v_abc_stats
    FROM stats;

    -- ============================================================================================
    -- 2. SALES & FINANCIAL METRICS (Sales Table)
    -- ============================================================================================
    SELECT COALESCE(SUM(total), 0)
    INTO v_total_revenue
    FROM sales
    WHERE (p_site_id IS NULL OR site_id = p_site_id)
      AND status != 'Cancelled';

    -- [NEW] Stock Turnover Rate Calculation (Annualized COGS / Avg Inventory)
    SELECT COALESCE(SUM(si.quantity * si.cost_price), 0)
    INTO v_30d_cogs
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE (p_site_id IS NULL OR s.site_id = p_site_id)
      AND s.status != 'Cancelled'
      AND s.sale_date > (NOW() - INTERVAL '30 days');

    IF v_total_value_cost > 0 THEN
        -- Annualized COGS / Current Stock Value
        v_stock_turnover_rate := ROUND(((v_30d_cogs * 12) / v_total_value_cost)::numeric, 1);
    ELSE
        v_stock_turnover_rate := 0;
    END IF;

    -- Active Orders
    SELECT COUNT(*)
    INTO v_active_orders_count
    FROM sales
    WHERE (p_site_id IS NULL OR site_id = p_site_id)
      AND status NOT IN ('Completed', 'Cancelled', 'Refunded');

    -- Return Rate & Value
    WITH returns_agg AS (
        SELECT 
            COUNT(*) as total_sales,
            COUNT(*) FILTER (WHERE status = 'Refunded') as returned_sales,
            SUM(total) FILTER (WHERE status = 'Refunded') as returned_val
        FROM sales
        WHERE (p_site_id IS NULL OR site_id = p_site_id)
    )
    SELECT 
        CASE WHEN total_sales > 0 THEN ROUND((returned_sales::numeric / total_sales) * 100, 1) ELSE 0 END,
        COALESCE(returned_val, 0)
    INTO v_return_rate, v_total_returned_value
    FROM returns_agg;

    -- Net Profit
    SELECT 
        COALESCE(SUM(si.quantity * (si.price - si.cost_price)), 0)
    INTO v_net_profit
    FROM sale_items si
    JOIN sales s ON s.id = si.sale_id
    WHERE (p_site_id IS NULL OR s.site_id = p_site_id)
      AND s.status != 'Cancelled' AND s.status != 'Refunded';
      
    IF v_total_revenue > 0 THEN
        v_profit_margin := ROUND((v_net_profit / v_total_revenue) * 100, 1);
    ELSE
        v_profit_margin := 0;
    END IF;

    -- ============================================================================================
    -- 3. CHARTS DATA (Aggregations)
    -- ============================================================================================
    -- Site Performance
    SELECT COALESCE(json_agg(t), '[]'::json)
    INTO v_site_performance
    FROM (
        SELECT 
            st.name,
            SUM(s.total) as revenue,
            COUNT(*) as transactions
        FROM sales s
        JOIN sites st ON s.site_id = st.id
        WHERE (p_site_id IS NULL OR s.site_id = p_site_id)
          AND s.status != 'Cancelled'
          AND st.type NOT IN ('Administration', 'HQ', 'Administrative')
        GROUP BY st.name
        ORDER BY revenue DESC
        LIMIT 10
    ) t;

    -- Category Performance
    SELECT COALESCE(json_agg(t), '[]'::json)
    INTO v_sales_by_category
    FROM (
        SELECT 
            p.category as name,
            SUM(si.price * si.quantity) as value
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE (p_site_id IS NULL OR s.site_id = p_site_id)
          AND s.status != 'Cancelled'
        GROUP BY p.category
        ORDER BY value DESC
        LIMIT 6
    ) t;

    -- Top Products
    SELECT COALESCE(json_agg(t), '[]'::json)
    INTO v_top_products
    FROM (
        SELECT 
            si.product_name as name,
            SUM(si.price * si.quantity) as sales,
            SUM(si.quantity) as count
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        WHERE (p_site_id IS NULL OR s.site_id = p_site_id)
          AND s.status != 'Cancelled'
        GROUP BY si.product_name
        ORDER BY sales DESC
        LIMIT 5
    ) t;

    -- Logistics
    SELECT COUNT(*)
    INTO v_inbound_po_count
    FROM purchase_orders
    WHERE (p_site_id IS NULL OR site_id = p_site_id)
      AND status != 'Received' AND status != 'Cancelled';

    v_avg_cycle_time := '14m';

    -- Return JSON Object
    RETURN json_build_object(
        'total_count', v_total_count,
        'total_value_cost', v_total_value_cost,
        'total_value_retail', v_total_value_retail,
        'active_alerts', v_active_alerts,
        'low_stock_count', v_low_stock_count,
        'out_of_stock_count', v_out_of_stock_count,
        'category_stats', v_category_stats,
        'abc_stats', v_abc_stats,
        
        -- New Dynamic KPIs
        'dead_stock_value', v_dead_stock_value,
        'stock_turnover_rate', v_stock_turnover_rate,
        
        'total_revenue', v_total_revenue,
        'net_profit', v_net_profit,
        'profit_margin', v_profit_margin,
        
        'active_orders', v_active_orders_count,
        'return_rate', v_return_rate,
        'total_returned_value', v_total_returned_value,
        'inbound_pos', v_inbound_po_count,
        'avg_cycle_time', v_avg_cycle_time,
        
        'site_performance', v_site_performance,
        'sales_by_category', v_sales_by_category,
        'top_products', v_top_products
    );
END;
$$ LANGUAGE plpgsql;
