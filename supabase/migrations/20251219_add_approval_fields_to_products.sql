-- Migration: Add approval workflow fields to products table
-- This supports the new super_admin approval requirement for inventory changes

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'archived')),
ADD COLUMN IF NOT EXISTS created_by TEXT,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS rejected_by TEXT,
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Update existing products to 'approved' status
UPDATE products SET approval_status = 'approved' WHERE approval_status IS NULL;

-- Index for faster filtering by approval status
CREATE INDEX IF NOT EXISTS idx_products_approval_status ON products(approval_status);
