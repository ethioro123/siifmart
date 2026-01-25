-- Migration: Add identity_type to po_items table
-- This field declares the product identity status for receiving workflow

ALTER TABLE po_items
ADD COLUMN IF NOT EXISTS identity_type TEXT DEFAULT 'known' 
CHECK (identity_type IN ('known', 'variant', 'new'));

-- Add comment for documentation
COMMENT ON COLUMN po_items.identity_type IS 'Product identity declaration: known (existing, barcode may differ), variant (existing, details may vary), new (create at receiving)';
