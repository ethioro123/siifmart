-- Update purchase_orders status constraint to include all valid statuses
-- Matches types.ts: 'Draft' | 'Pending' | 'Approved' | 'Received' | 'Partially Received' | 'Ordered' | 'Cancelled' | 'Rejected'

ALTER TABLE purchase_orders 
DROP CONSTRAINT IF EXISTS purchase_orders_status_check;

ALTER TABLE purchase_orders 
ADD CONSTRAINT purchase_orders_status_check 
CHECK (status IN ('Draft', 'Pending', 'Approved', 'Received', 'Partially Received', 'Ordered', 'Cancelled', 'Rejected'));
