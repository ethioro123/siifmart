-- Migration: Fix Zero-Priced Products at Kileleshwa Store
-- Date: 2026-10-16
-- Description:
-- Repairs zero retail prices, zero cost prices, and 'Uncategorized' categories
-- for products at Kileleshwa store (Juma Ugali Flour, Amazon Kindle, Wanchi Tuna)
-- inherited from internal transfer jobs originated at Eastleigh 01 warehouse.

UPDATE products p
SET
    price = src.price,
    cost_price = src.cost_price,
    category = src.category,
    brand = COALESCE(NULLIF(p.brand, ''), src.brand, pm.brand),
    size = COALESCE(NULLIF(p.size, ''), src.size, pm.size),
    barcode = COALESCE(NULLIF(p.barcode, ''), src.barcode, pm.barcode),
    price_updated_at = NOW(),
    updated_at = NOW()
FROM products src
LEFT JOIN product_master pm ON pm.sku = src.sku AND pm.country_code = 'KE'
WHERE p.site_id = '4b8e7cd9-5af3-4bdd-b561-11d8fa7730af'
  AND p.sku IN ('KEGR001', 'KEEL001', 'TS001')
  AND (p.price = 0 OR p.price IS NULL OR p.category = 'Uncategorized')
  AND src.site_id = 'b74b26ff-da36-4381-912c-63c2b45b5d16'
  AND src.sku = p.sku;
