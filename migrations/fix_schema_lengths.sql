-- Safe Schema Length Fix (v2 - Robust)
-- Handles missing columns by adding them first, then ensuring TEXT type

-- 1. Ensure columns exist (Add if missing)
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS po_number TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS supplier_name TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS incoterms TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS priority TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requested_by TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 2. Ensure all are TEXT (Expand length)
ALTER TABLE purchase_orders ALTER COLUMN po_number TYPE TEXT;
ALTER TABLE purchase_orders ALTER COLUMN supplier_name TYPE TEXT;
ALTER TABLE purchase_orders ALTER COLUMN payment_terms TYPE TEXT;
ALTER TABLE purchase_orders ALTER COLUMN incoterms TYPE TEXT;
ALTER TABLE purchase_orders ALTER COLUMN status TYPE TEXT;
ALTER TABLE purchase_orders ALTER COLUMN priority TYPE TEXT;
ALTER TABLE purchase_orders ALTER COLUMN requested_by TYPE TEXT;
ALTER TABLE purchase_orders ALTER COLUMN created_by TYPE TEXT;

-- 3. Safety Net for PO Numbers
UPDATE purchase_orders 
SET po_number = 'PO-' || substring(id::text from 1 for 8)
WHERE po_number IS NULL;

-- 4. Rebuild Index
DROP INDEX IF EXISTS idx_purchase_orders_po_number;
CREATE INDEX idx_purchase_orders_po_number ON purchase_orders(po_number);
