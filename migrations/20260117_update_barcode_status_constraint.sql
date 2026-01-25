-- Migration: Update barcode_approvals status constraint to allow 'logged'
-- This enables the new workflow where barcode mappings are instant (no approval needed)
-- and are stored as reference audit logs.

-- Drop the existing CHECK constraint
ALTER TABLE barcode_approvals DROP CONSTRAINT IF EXISTS barcode_approvals_status_check;

-- Add new CHECK constraint that includes 'logged' status
ALTER TABLE barcode_approvals ADD CONSTRAINT barcode_approvals_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'logged'));

-- Update any existing 'pending' records to 'logged' if desired (optional)
-- UPDATE barcode_approvals SET status = 'logged' WHERE status = 'pending';
