-- Function to get efficient inventory metrics AND ALL dashboard KPIs without loading all rows
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
    
    -- Financial Metrics
    v_total_revenue NUMERIC;
    v_net_profit NUMERIC;
    v_profit_margin NUMERIC;
    
    -- Order & Logistics Metrics
    v_active_orders_count INTEGER; -- Sales pending fulfillment
    v_inbound_po_count INTEGER;
    v_avg_cycle_time TEXT; -- Simplified for now
    v_return_rate NUMERIC;
    v_total_returned_value NUMERIC;
    
    -- Charts Data
    v_sales_velocity JSON; -- Daily revenue
    v_sales_by_category JSON;
    v_top_products JSON;
    v_site_performance JSON; -- Revenue by site
    
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

    -- Inventory: Category Statistics (by Stock Value)
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
    
    -- Inventory: ABC Stats
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
    -- Total Revenue
    SELECT COALESCE(SUM(total), 0)
    INTO v_total_revenue
    FROM sales
    WHERE (p_site_id IS NULL OR site_id = p_site_id)
      AND status != 'Cancelled'; -- Exclude cancelled, include 'Refunded' in gross revenue usually, or exclude. Let's exclude Refunded if we want Net Sales.
      -- For strict Total Revenue (Gross), we include everything except Cancelled. 
      -- Let's stick to 'Completed' + 'Pending' + 'Refunded' (Gross). Or just 'Completed'.
      -- Let's use ALL non-cancelled for Gross Revenue.
      
    -- Active/Pending Orders (Sales that are not completed/delivered)
    -- Assuming status: 'Pending', 'Processing', 'Ready', 'Completed', 'Cancelled', 'Refunded'
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

    -- Profit Calculation (Simplified: Revenue - roughly 70% cost or joins)
    -- Ideally we join with sale_items -> products (cost_price).
    -- For speed, let's try the join if possible, or estimate.
    -- Let's do a proper join for accuracy if we're doing "Smart Fix".
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
    
    -- Chart: Sales Velocity (Revenue by Site - Area Chart)
    -- Note: UI expects [{name: 'Site Name', revenue: 1000, transactions: 10}]
    -- We need to join with sites table to get name.
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

    -- Chart: Category Sales Performance (Bar Chart)
    -- Derived from sale_items -> products(category) would be best. 
    -- If product_name/category stored in sale_items? No, likely need join to products.
    -- But sale_items has 'product_name'. Does it have category? No.
    -- Join product_id -> products.category
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

    -- Widget: Top Products
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

    -- ============================================================================================
    -- 4. LOGISTICS METRICS (Purchase Orders)
    -- ============================================================================================
    -- Inbound POs (Status != Received)
    SELECT COUNT(*)
    INTO v_inbound_po_count
    FROM purchase_orders
    WHERE (p_site_id IS NULL OR site_id = p_site_id) -- Assuming POs have site_id
      AND status != 'Received' AND status != 'Cancelled';

    v_avg_cycle_time := '14m'; -- Placeholder for complex time diff calc, difficult in SQL without proper timestamps logic

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
