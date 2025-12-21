-- Migration to add transfer-related columns to wms_jobs table
-- Required for transfer approval workflow to work

-- Add transfer_status column for tracking transfer workflow states
ALTER TABLE wms_jobs
ADD COLUMN IF NOT EXISTS transfer_status TEXT;

-- Add source and destination site columns for transfers
ALTER TABLE wms_jobs
ADD COLUMN IF NOT EXISTS source_site_id UUID REFERENCES sites(id);

ALTER TABLE wms_jobs
ADD COLUMN IF NOT EXISTS dest_site_id UUID REFERENCES sites(id);

-- Add tracking columns for transfer workflow
ALTER TABLE wms_jobs
ADD COLUMN IF NOT EXISTS requested_by TEXT;

ALTER TABLE wms_jobs
ADD COLUMN IF NOT EXISTS approved_by TEXT;

ALTER TABLE wms_jobs
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE wms_jobs
ADD COLUMN IF NOT EXISTS received_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster filtering by transfer_status
CREATE INDEX IF NOT EXISTS idx_wms_jobs_transfer_status 
ON wms_jobs(transfer_status) 
WHERE transfer_status IS NOT NULL;

-- Comment explaining the column purpose
COMMENT ON COLUMN wms_jobs.transfer_status IS 
'Tracks transfer workflow status: Requested → Approved → Picking → Picked → Packed → In-Transit → Delivered → Received';
