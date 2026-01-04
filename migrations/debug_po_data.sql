-- Debug Script: Check PO data distribution
CREATE OR REPLACE FUNCTION debug_po_data()
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql;
