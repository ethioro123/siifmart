-- Migration to add tracking_number and received_by columns to wms_jobs table
-- Required for package tracking and audit logging

ALTER TABLE wms_jobs
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS received_by TEXT,
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

-- Add index for lightning-fast tracking number lookups
CREATE INDEX IF NOT EXISTS idx_wms_jobs_tracking_number 
ON wms_jobs(tracking_number) 
WHERE tracking_number IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN wms_jobs.tracking_number IS 'Carrier tracking number or internal SF-style shipment identifier';
COMMENT ON COLUMN wms_jobs.received_by IS 'Employee name who verified and received the stock at destination';
