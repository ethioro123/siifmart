-- Fix po_number column type from VARCHAR(20) to TEXT
-- This allows longer PO numbers like PO-TEST-1732524906000

-- Drop the existing column if it exists with wrong type
ALTER TABLE purchase_orders 
DROP COLUMN IF EXISTS po_number CASCADE;

-- Add it back as TEXT (unlimited length)
ALTER TABLE purchase_orders 
ADD COLUMN po_number TEXT;

-- Recreate the index
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);

-- Update existing records to have a po_number
UPDATE purchase_orders 
SET po_number = 'PO-' || substring(id::text from 1 for 8)
WHERE po_number IS NULL;
