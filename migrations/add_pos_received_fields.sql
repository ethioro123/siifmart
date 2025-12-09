-- Add pos_received_at field to products table
-- This tracks when a product was scanned and confirmed received at a store's POS
-- Products won't appear in POS for sale until this is set

ALTER TABLE products
ADD COLUMN IF NOT EXISTS pos_received_at TIMESTAMP WITH TIME ZONE;

-- Add pos_received_by field to track who received it
ALTER TABLE products
ADD COLUMN IF NOT EXISTS pos_received_by TEXT;

-- Add index for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_pos_received_at 
ON products(pos_received_at) 
WHERE pos_received_at IS NOT NULL;

-- Explanation:
-- For Stores: Products must be scanned at POS receiving before they can be sold
-- For Warehouses: Products can skip this step (they use PUTAWAY instead)
-- This ensures stores verify physical receipt before items appear in POS
