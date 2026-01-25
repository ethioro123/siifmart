-- Add barcodes column to products table for multi-barcode support (Aliases)
ALTER TABLE products ADD COLUMN IF NOT EXISTS barcodes TEXT[] DEFAULT '{}';

-- Index for faster searching within the array
CREATE INDEX IF NOT EXISTS idx_products_barcodes ON products USING GIN (barcodes);

-- Comment
COMMENT ON COLUMN products.barcodes IS 'Array of alternative barcodes (aliases) for this product';
