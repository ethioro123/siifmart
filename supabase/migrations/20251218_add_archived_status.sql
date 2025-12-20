-- Update products status check constraint to include 'archived'
-- This allows for soft deletion of products while maintaining data integrity
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE products ADD CONSTRAINT products_status_check CHECK (status IN ('active', 'low_stock', 'out_of_stock', 'archived'));
