-- Enhanced Debug Script
CREATE OR REPLACE FUNCTION debug_po_deep_dive()
RETURNS JSON AS $$
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
$$ LANGUAGE plpgsql;
