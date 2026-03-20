-- DATA REPAIR SCRIPT
-- Purpose: Fix inventory corruption caused by "Double Negative" bug in Putaway logic.
-- Issue: Some 'OUT' movements had negative quantities (e.g., -100).
--        Logic: stock - (-100) = stock + 100.
--        Result: Stock INCREASED by 100 instead of decreasing (or staying same).
-- Fix:   1. Revert the stock increase (Subtract 100).
--        2. Delete the erroneous movement log.

BEGIN;

-- 1. Revert Stock Levels
-- We find the bad movements (OUT & Negative Qty)
-- We ADD the negative quantity to the stock (Stock + (-100) = Stock - 100)
WITH bad_movements AS (
    SELECT product_id, SUM(quantity) as total_correction
    FROM public.stock_movements 
    WHERE type = 'OUT' 
    AND quantity < 0 
    AND (reason ILIKE 'Putaway Transfer to%' OR reason ILIKE 'Moved to%' OR reason ILIKE 'Stock moved to%')
    GROUP BY product_id
)
UPDATE public.products p
SET stock = p.stock + bm.total_correction
FROM bad_movements bm
WHERE p.id = bm.product_id;

-- 2. Delete the Bad Movement Records
DELETE FROM public.stock_movements
WHERE type = 'OUT' 
AND quantity < 0 
AND (reason ILIKE 'Putaway Transfer to%' OR reason ILIKE 'Moved to%' OR reason ILIKE 'Stock moved to%');

COMMIT;

-- Verification
SELECT count(*) as remaining_bad_records 
FROM public.stock_movements 
WHERE type = 'OUT' AND quantity < 0;
