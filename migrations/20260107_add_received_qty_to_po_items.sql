-- Add received_qty column to po_items table
ALTER TABLE po_items 
ADD COLUMN IF NOT EXISTS received_qty numeric DEFAULT 0;

-- Optional: Add rejected_qty for full audit
ALTER TABLE po_items
ADD COLUMN IF NOT EXISTS rejected_qty numeric DEFAULT 0;
