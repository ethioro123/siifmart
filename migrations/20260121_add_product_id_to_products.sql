-- Add product_id column to products table to link site-specific products to global parents
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_products_product_id ON products(product_id);
