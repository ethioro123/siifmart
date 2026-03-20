-- Create get_inventory_metrics RPC to support Inventory Dashboard
-- Returns: total products, total value (cost/retail), low stock count, out of stock count

CREATE OR REPLACE FUNCTION get_inventory_metrics(site_id_param UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_products', COUNT(*),
        'total_value_cost', COALESCE(SUM(stock * cost_price), 0),
        'total_value_retail', COALESCE(SUM(stock * sale_price), 0),
        'low_stock_count', COUNT(*) FILTER (WHERE stock <= min_stock_level AND stock > 0),
        'out_of_stock_count', COUNT(*) FILTER (WHERE stock <= 0)
    ) INTO result
    FROM products
    WHERE (site_id_param IS NULL OR site_id = site_id_param)
      AND status = 'active';

    RETURN result;
END;
$$;
