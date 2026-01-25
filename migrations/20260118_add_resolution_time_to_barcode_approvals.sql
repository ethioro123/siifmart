-- Add resolution_time column to barcode_approvals
-- This tracks the duration in seconds taken to resolve an unknown barcode scan

ALTER TABLE barcode_approvals ADD COLUMN IF NOT EXISTS resolution_time INTEGER;
COMMENT ON COLUMN barcode_approvals.resolution_time IS 'Duration in seconds taken by the cashier to resolve the unknown barcode mapping.';
