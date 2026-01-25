-- ============================================================================
-- Fix: Add missing received_qty column to po_items
-- ============================================================================

BEGIN;

-- Add received_qty column if it doesn't exist
ALTER TABLE po_items ADD COLUMN IF NOT EXISTS "received_qty" NUMERIC DEFAULT 0;

-- Optional: Add identity_type if missing (saw it in code but verifying)
ALTER TABLE po_items ADD COLUMN IF NOT EXISTS "identity_type" TEXT DEFAULT 'known';

-- Fix: Add missing created_at column to points_transactions
ALTER TABLE points_transactions ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMPTZ DEFAULT NOW();

COMMIT;
