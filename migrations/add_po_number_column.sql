-- Add po_number column to purchase_orders table
ALTER TABLE purchase_orders 
ADD COLUMN IF NOT EXISTS po_number TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);

-- Update existing records to have a po_number (using id if it looks like text, or generating one)
-- Note: If IDs are already UUIDs, we can't easily convert them to PO-xxxx without logic.
-- But if IDs were Text (which caused error), they failed to insert.
-- So existing records likely have UUIDs.
-- We can set po_number = 'PO-' || substring(id::text from 1 for 8) for existing ones.

UPDATE purchase_orders 
SET po_number = 'PO-' || substring(id::text from 1 for 8)
WHERE po_number IS NULL;
