-- Fix old SKUs: Remove hyphens from all product SKUs
-- Example: GN-019 → GN019, BV-003 → BV003

-- Preview first (see what will change)
SELECT id, sku, REPLACE(sku, '-', '') AS new_sku
FROM products
WHERE sku LIKE '%-%'
ORDER BY sku;

-- Apply the fix
UPDATE products
SET sku = REPLACE(sku, '-', '')
WHERE sku LIKE '%-%';
