-- Fix corrupted wms_jobs line_items

-- Scenario A: line_items became an array containing null e.g. '[null]'
UPDATE public.wms_jobs
SET line_items = (
    SELECT COALESCE(
        jsonb_agg(
            CASE 
                WHEN jsonb_typeof(item) = 'null' THEN 
                    '{"sku": "NO SKU", "name": "Item Missing Details", "status": "Pending", "expectedQty": 1, "pickedQty": 0}'::jsonb
                ELSE item
            END
        ),
        '[]'::jsonb
    )
    FROM jsonb_array_elements(line_items) AS item
)
WHERE type IN ('PUTAWAY', 'RECEIVE', 'PICK')
AND line_items @> '[null]';

-- Scenario B: line_items became SQL NULL entirely
UPDATE public.wms_jobs
SET line_items = '[]'::jsonb
WHERE line_items IS NULL;
