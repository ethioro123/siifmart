-- COMPREHENSIVE PO SYSTEM FIX
-- Run this entire script in Supabase Dashboard SQL Editor

-- ============================================================
-- 1. FIX PO_NUMBER COLUMN TYPE
-- ============================================================

-- Drop the existing column if it exists with wrong type
ALTER TABLE purchase_orders 
DROP COLUMN IF EXISTS po_number CASCADE;

-- Add it back as TEXT (unlimited length)
ALTER TABLE purchase_orders 
ADD COLUMN po_number TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);

-- Update existing records to have a po_number
UPDATE purchase_orders 
SET po_number = 'PO-' || substring(id::text from 1 for 8)
WHERE po_number IS NULL;

-- ============================================================
-- 2. ADD APPROVAL COLUMNS (OPTIONAL - for better data structure)
-- ============================================================

-- Add approval tracking columns
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(200),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Add index for querying approved POs
CREATE INDEX IF NOT EXISTS idx_po_approved_at ON purchase_orders(approved_at);

-- Add comments for documentation
COMMENT ON COLUMN purchase_orders.approved_by IS 'Name of the person who approved the PO';
COMMENT ON COLUMN purchase_orders.approved_at IS 'Timestamp when the PO was approved';

-- ============================================================
-- 3. ENSURE ALL REQUIRED COLUMNS EXIST
-- ============================================================

-- Add any missing columns that might be needed
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS created_by VARCHAR(200),
ADD COLUMN IF NOT EXISTS destination TEXT,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS incoterms VARCHAR(50),
ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;

-- ============================================================
-- 4. UPDATE EXISTING POS WITH PROPER STATUS
-- ============================================================

-- Ensure all POs have valid status
UPDATE purchase_orders
SET status = 'Pending'
WHERE status IS NULL OR status NOT IN ('Pending', 'Received', 'Cancelled');

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check column types
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'purchase_orders'
ORDER BY ordinal_position;

-- Count POs by status
SELECT status, COUNT(*) as count
FROM purchase_orders
GROUP BY status;

-- Show sample POs
SELECT 
    po_number,
    status,
    supplier_name,
    destination,
    total_amount,
    created_at
FROM purchase_orders
ORDER BY created_at DESC
LIMIT 5;
