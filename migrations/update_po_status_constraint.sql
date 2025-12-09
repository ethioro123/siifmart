-- Update purchase_orders status constraint to include Draft and Approved
ALTER TABLE purchase_orders 
DROP CONSTRAINT IF EXISTS purchase_orders_status_check;

ALTER TABLE purchase_orders 
ADD CONSTRAINT purchase_orders_status_check 
CHECK (status IN ('Draft', 'Pending', 'Approved', 'Received', 'Cancelled'));
