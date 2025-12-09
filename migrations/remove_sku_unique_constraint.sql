-- Remove UNIQUE constraint on SKU to allow same product at multiple sites
-- This enables multi-site inventory where the same SKU can exist at different warehouses
-- with different stock levels

ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_sku_key;

-- Add a composite unique constraint on (sku, site_id) instead
-- This ensures one SKU per site, but allows same SKU across different sites
ALTER TABLE products
ADD CONSTRAINT products_sku_site_unique UNIQUE (sku, site_id);

-- Explanation:
-- Before: SKU must be unique globally (can't have RICE-001 at multiple warehouses)
-- After: SKU must be unique per site (can have RICE-001 at Adama AND Harar, but not twice at Adama)
