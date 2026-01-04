-- Add discrepancy columns to wms_jobs
ALTER TABLE wms_jobs ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE wms_jobs ADD COLUMN IF NOT EXISTS has_discrepancy BOOLEAN DEFAULT FALSE;
ALTER TABLE wms_jobs ADD COLUMN IF NOT EXISTS discrepancy_details TEXT;

-- Add discrepancy columns to transfers
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS has_discrepancy BOOLEAN DEFAULT FALSE;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS discrepancy_details TEXT;
ALTER TABLE transfers ADD COLUMN IF NOT EXISTS transfer_status TEXT;

-- Create indexes for discrepancy filtering
CREATE INDEX IF NOT EXISTS idx_wms_jobs_discrepancy ON wms_jobs(has_discrepancy) WHERE has_discrepancy = TRUE;
CREATE INDEX IF NOT EXISTS idx_transfers_discrepancy ON transfers(has_discrepancy) WHERE has_discrepancy = TRUE;

-- Add descriptive comments to columns
COMMENT ON COLUMN wms_jobs.has_discrepancy IS 'Flagged if received quantity mismatched expected quantity during POS receiving.';
COMMENT ON COLUMN transfers.has_discrepancy IS 'Flagged if received quantity mismatched expected quantity during POS receiving.';
