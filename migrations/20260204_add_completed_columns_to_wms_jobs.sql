-- Add completed_at and completed_by columns to wms_jobs table
-- These track when a job was completed and by whom

ALTER TABLE wms_jobs 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE wms_jobs 
ADD COLUMN IF NOT EXISTS completed_by TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN wms_jobs.completed_at IS 'Timestamp when the job was marked as Completed';
COMMENT ON COLUMN wms_jobs.completed_by IS 'User ID or name of the worker who completed the job';
