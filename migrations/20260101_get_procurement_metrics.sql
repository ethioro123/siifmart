-- RPC for Procurement Metrics (Robust version for historical data)
CREATE OR REPLACE FUNCTION get_procurement_metrics(
    p_site_id UUID DEFAULT NULL,
    p_start_date TIMESTAMP DEFAULT NULL,
    p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    v_total_spend DECIMAL(15,2);
    v_open_po_count INTEGER;
    v_pending_value DECIMAL(15,2);
    v_potential_revenue DECIMAL(15,2);
    v_category_data JSON;
    v_trend_data JSON;
    v_actual_start TIMESTAMP;
BEGIN
    -- Use provided start date or a long time ago for "All Time"
    v_actual_start := COALESCE(p_start_date, '1970-01-01'::TIMESTAMP);

    -- 1. Total Spend (Completed/Received POs)
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total_spend
    FROM purchase_orders
    WHERE status = 'Received'
      AND (p_site_id IS NULL OR site_id = p_site_id)
      AND (COALESCE(order_date, created_at::date) >= v_actual_start::date)
      AND (p_end_date IS NULL OR COALESCE(order_date, created_at::date) <= p_end_date::date);

    -- 2. Open PO Count (Anything not Received or Cancelled)
    SELECT COUNT(*)
    INTO v_open_po_count
    FROM purchase_orders
    WHERE status NOT IN ('Received', 'Cancelled')
      AND (p_site_id IS NULL OR site_id = p_site_id)
      AND (COALESCE(order_date, created_at::date) >= v_actual_start::date)
      AND (p_end_date IS NULL OR COALESCE(order_date, created_at::date) <= p_end_date::date);

    -- 3. Pending Value
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_pending_value
    FROM purchase_orders
    WHERE status NOT IN ('Received', 'Cancelled')
      AND (p_site_id IS NULL OR site_id = p_site_id)
      AND (COALESCE(order_date, created_at::date) >= v_actual_start::date)
      AND (p_end_date IS NULL OR COALESCE(order_date, created_at::date) <= p_end_date::date);

    -- 4. Potential Revenue (Est. Retail Value of items in Open POs)
    SELECT COALESCE(SUM(pi.retail_price * pi.quantity), 0)
    INTO v_potential_revenue
    FROM po_items pi
    JOIN purchase_orders po ON pi.purchase_order_id = po.id
    WHERE po.status NOT IN ('Received', 'Cancelled')
      AND (p_site_id IS NULL OR po.site_id = p_site_id)
      AND (COALESCE(po.order_date, po.created_at::date) >= v_actual_start::date)
      AND (p_end_date IS NULL OR COALESCE(po.order_date, po.created_at::date) <= p_end_date::date);

    -- 5. Category Data (Spend by Category)
    SELECT json_agg(t)
    INTO v_category_data
    FROM (
        SELECT 
            COALESCE(category, 'Uncategorized') as name,
            SUM(total_cost) as value
        FROM po_items pi
        JOIN purchase_orders po ON pi.purchase_order_id = po.id
        WHERE po.status = 'Received'
          AND (p_site_id IS NULL OR po.site_id = p_site_id)
          AND (COALESCE(po.order_date, po.created_at::date) >= v_actual_start::date)
          AND (p_end_date IS NULL OR COALESCE(po.order_date, po.created_at::date) <= p_end_date::date)
        GROUP BY category
    ) t;

    -- 6. Trend Data (Monthly Spend)
    SELECT json_agg(t)
    INTO v_trend_data
    FROM (
        SELECT 
            CASE 
                WHEN p_start_date IS NOT NULL AND (p_end_date - p_start_date) > INTERVAL '12 months' 
                THEN to_char(COALESCE(order_date, created_at), 'Mon YY')
                ELSE to_char(COALESCE(order_date, created_at), 'Mon')
            END as name,
            SUM(total_amount) as spend,
            date_trunc('month', COALESCE(order_date, created_at)) as month_date
        FROM purchase_orders
        WHERE status = 'Received'
          AND (p_site_id IS NULL OR site_id = p_site_id)
          AND (
            (p_start_date IS NOT NULL AND COALESCE(order_date, created_at::date) >= p_start_date::date AND COALESCE(order_date, created_at::date) <= p_end_date::date)
            OR 
            (p_start_date IS NULL AND order_date >= (CURRENT_DATE - INTERVAL '12 months'))
          )
        GROUP BY name, month_date
        ORDER BY month_date
    ) t;

    -- Combine into final JSON
    SELECT json_build_object(
        'totalSpend', v_total_spend,
        'openPO', v_open_po_count,
        'pendingValue', v_pending_value,
        'potentialRevenue', v_potential_revenue,
        'categoryData', COALESCE(v_category_data, '[]'::json),
        'trendData', COALESCE(v_trend_data, '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
