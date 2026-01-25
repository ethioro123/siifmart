-- Add old_price column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price DECIMAL(10, 2);

-- Update the column comment
COMMENT ON COLUMN products.old_price IS 'Stores the previous price before the last update for price history tracking';
