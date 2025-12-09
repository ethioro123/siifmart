-- Run this in Supabase SQL Editor to see your assignments

-- 1. View all job assignments
SELECT 
  ja.id,
  ja.employee_name,
  ja.status,
  ja.assigned_at,
  wj.type as job_type,
  wj.status as job_status
FROM job_assignments ja
JOIN wms_jobs wj ON ja.job_id = wj.id
ORDER BY ja.assigned_at DESC
LIMIT 10;

-- 2. View active assignments
SELECT * FROM active_job_assignments;

-- 3. Count assignments by employee
SELECT 
  employee_name,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE status IN ('Assigned', 'In-Progress')) as active_jobs
FROM job_assignments
GROUP BY employee_name
ORDER BY active_jobs DESC;
