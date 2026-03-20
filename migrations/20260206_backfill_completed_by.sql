-- Backfill completed_by and completed_at for older wms_jobs from system_logs
-- This migration uses the system_logs audit trail to populate completion information
-- for jobs that were completed before the completed_by/completed_at columns were added.

-- Step 1: Backfill completed_at from system_logs where action='Job Completed'
-- This gives us the ACTUAL completion time, not just the last update time
UPDATE wms_jobs j
SET completed_at = (
    SELECT sl.created_at
    FROM system_logs sl
    WHERE sl.action = 'Job Completed'
      AND (sl.details LIKE '%' || j.job_number || '%' OR sl.details LIKE '%' || j.id || '%')
    ORDER BY sl.created_at DESC
    LIMIT 1
)
WHERE j.status = 'Completed'
  AND j.completed_at IS NULL
  AND j.job_number IS NOT NULL;

-- Step 2: Attempt to backfill completed_by from system_logs
-- The system logs have action='Job Completed' and details like 'Job {jobNumber} completed'
-- We match by job_number in the details string and set completed_by to the user_name

-- First, let's try matching by job_number
UPDATE wms_jobs j
SET completed_by = (
    SELECT e.id 
    FROM system_logs sl
    JOIN employees e ON e.name = sl.user_name
    WHERE sl.action = 'Job Completed'
      AND (sl.details LIKE '%' || j.job_number || '%' OR sl.details LIKE '%' || j.id || '%')
    ORDER BY sl.created_at DESC
    LIMIT 1
)
WHERE j.status = 'Completed'
  AND j.completed_by IS NULL
  AND j.job_number IS NOT NULL;

-- Fallback: If no employee ID found but we have a user_name, use the name directly
UPDATE wms_jobs j
SET completed_by = (
    SELECT sl.user_name
    FROM system_logs sl
    WHERE sl.action = 'Job Completed'
      AND (sl.details LIKE '%' || j.job_number || '%' OR sl.details LIKE '%' || j.id || '%')
    ORDER BY sl.created_at DESC
    LIMIT 1
)
WHERE j.status = 'Completed'
  AND j.completed_by IS NULL
  AND j.job_number IS NOT NULL;

-- Step 3: For jobs that still don't have completed_by, fall back to assigned_to
-- Note: This is a last resort as assigned_to isn't necessarily who completed it
-- But it's better than showing nothing for historical data
UPDATE wms_jobs
SET completed_by = assigned_to
WHERE status = 'Completed'
  AND completed_by IS NULL
  AND assigned_to IS NOT NULL;

-- Log the result
DO $$
DECLARE
  jobs_with_completed_by INTEGER;
  jobs_without_completed_by INTEGER;
BEGIN
  SELECT COUNT(*) INTO jobs_with_completed_by 
  FROM wms_jobs 
  WHERE status = 'Completed' AND completed_by IS NOT NULL;
  
  SELECT COUNT(*) INTO jobs_without_completed_by 
  FROM wms_jobs 
  WHERE status = 'Completed' AND completed_by IS NULL;
  
  RAISE NOTICE 'Backfill complete: % jobs have completed_by, % jobs still missing', 
    jobs_with_completed_by, jobs_without_completed_by;
END $$;
