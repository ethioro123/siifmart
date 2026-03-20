-- Add assigned_by column to wms_jobs table
-- This tracks the dispatcher who assigned a driver to the job

ALTER TABLE wms_jobs 
ADD COLUMN IF NOT EXISTS assigned_by TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN wms_jobs.assigned_by IS 'User ID or name of the dispatcher who assigned a driver to this job';
