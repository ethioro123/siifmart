-- Add approval tracking columns to purchase_orders table
ALTER TABLE purchase_orders
ADD COLUMN approved_by VARCHAR(200),
ADD COLUMN approved_at TIMESTAMPTZ;

-- Add index for querying approved POs
CREATE INDEX idx_po_approved_at ON purchase_orders(approved_at);

-- Add comment for documentation
COMMENT ON COLUMN purchase_orders.approved_by IS 'Name of the person who approved the PO';
COMMENT ON COLUMN purchase_orders.approved_at IS 'Timestamp when the PO was approved';
