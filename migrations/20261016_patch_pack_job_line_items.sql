-- Data patch: Synchronize line_items for completed PACK jobs so pickedQty and packedQty are fully aligned
UPDATE wms_jobs
SET line_items = (
    SELECT jsonb_agg(
        CASE 
            WHEN (elem->>'packedQty') IS NOT NULL AND (elem->>'packedQty')::numeric > 0 AND ((elem->>'pickedQty') IS NULL OR (elem->>'pickedQty')::numeric = 0)
            THEN jsonb_set(elem, '{pickedQty}', elem->'packedQty')
            WHEN (elem->>'expectedQty') IS NOT NULL AND (elem->>'expectedQty')::numeric > 0 AND ((elem->>'packedQty') IS NULL OR (elem->>'packedQty')::numeric = 0) AND status = 'Completed'
            THEN jsonb_set(jsonb_set(elem, '{packedQty}', elem->'expectedQty'), '{packed}', 'true'::jsonb)
            ELSE elem
        END
    )
    FROM jsonb_array_elements(line_items) AS elem
)
WHERE type = 'PACK' 
  AND status = 'Completed' 
  AND line_items IS NOT NULL;
