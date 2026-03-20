-- Backfill Stock Movements for Historical Putaway Jobs
-- This migration creates stock movement records for completed putaway jobs
-- that don't have corresponding movements in stock_movements table

-- Insert stock movements for each line item in completed putaway jobs
-- that don't already have movement records
INSERT INTO stock_movements (
    site_id,
    product_id,
    product_name,
    type,
    quantity,
    movement_date,
    performed_by,
    reason,
    created_at
)
SELECT DISTINCT
    j.site_id,
    (item->>'productId')::uuid,
    item->>'name',
    'IN'::text,
    COALESCE((item->>'pickedQty')::int, (item->>'expectedQty')::int, 0),
    COALESCE(j.completed_at, j.updated_at, j.created_at),
    COALESCE(j.completed_by, 'System'),
    'Putaway to ' || COALESCE(item->>'location', j.location, 'Unknown') || ' (Backfilled)',
    COALESCE(j.completed_at, j.updated_at, j.created_at)
FROM 
    wms_jobs j,
    jsonb_array_elements(j.line_items) AS item
WHERE 
    j.type = 'PUTAWAY'
    AND j.status = 'Completed'
    AND j.completed_at IS NOT NULL
    -- Only backfill if no movement already exists for this product and time
    AND NOT EXISTS (
        SELECT 1 FROM stock_movements sm
        WHERE sm.product_id = (item->>'productId')::uuid
        AND sm.movement_date::date = j.completed_at::date
        AND sm.type = 'IN'
        AND sm.quantity = COALESCE((item->>'pickedQty')::int, (item->>'expectedQty')::int)
    );
