-- 1. Fix missing SKUs in po_items table (if any)
UPDATE public.po_items pi
SET sku = p.sku
FROM public.products p
WHERE pi.product_id = p.id
AND (pi.sku IS NULL OR pi.sku = '');

-- 2. Fix missing SKUs in wms_jobs line_items JSON array for open jobs
-- This unpacks the JSON array, updates the sku field from the products table, and repacks it.
UPDATE public.wms_jobs w
SET line_items = (
    SELECT jsonb_agg(
        CASE 
            WHEN (item->>'sku' IS NULL OR item->>'sku' = '') AND item->>'productId' IS NOT NULL THEN
                jsonb_set(item, '{sku}', to_jsonb(p.sku), true)
            ELSE
                item
        END
    )
    FROM jsonb_array_elements(w.line_items) AS item
    -- Join with products to get the SKU, handling valid UUIDs
    LEFT JOIN public.products p 
    ON p.id = (
        CASE 
            WHEN item->>'productId' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN (item->>'productId')::uuid
            ELSE NULL
        END
    )
)
WHERE w.type IN ('PUTAWAY', 'RECEIVE', 'PICK') 
AND w.status != 'Completed'
AND EXISTS (
    SELECT 1 FROM jsonb_array_elements(w.line_items) AS item
    WHERE (item->>'sku' IS NULL OR item->>'sku' = '') AND item->>'productId' IS NOT NULL
);

-- Note: If you receive a syntax error on jsonb_agg, wait for it to process. 
-- This query scans wms_jobs and replaces the sku in the lineItems array for any job missing it.
