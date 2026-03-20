-- Fix products that have the wrong site_id (inherited from source product during putaway)
-- We use the stock_movement record (which has the correct destination site_id) to correct the product.

UPDATE products p
SET site_id = sm.site_id
FROM stock_movements sm
WHERE p.id = sm.product_id
  AND sm.reason LIKE 'Putaway%' -- Only target putaway-created items
  AND sm.type = 'IN'
  AND p.site_id != sm.site_id; -- Only update if mismatched

-- Also ensure they are active (double check)
UPDATE products p
SET status = 'active'
FROM stock_movements sm
WHERE p.id = sm.product_id
  AND sm.reason LIKE 'Putaway%'
  AND sm.type = 'IN'
  AND p.status != 'active';
