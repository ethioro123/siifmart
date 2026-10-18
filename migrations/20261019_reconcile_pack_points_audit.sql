-- Recover the verified single-job award whose total was saved before its audit failed.
-- This records the existing 95 points; it never changes a worker total.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended(wp.employee_id, 0))
FROM public.worker_points wp
JOIN public.wms_jobs j ON j.completed_by::text = wp.employee_id
WHERE j.job_number = 'VYUU9L' AND j.type = 'PACK' AND j.status = 'Completed';

INSERT INTO public.points_transactions (employee_id, job_id, points, type, description, created_at, timestamp)
SELECT wp.employee_id, j.id::text, 95, 'JOB_COMPLETE',
       'Completed PACK job: VYUU9L (audit recovered for previously saved points)',
       wp.last_job_completed_at, wp.last_job_completed_at
FROM public.worker_points wp
JOIN public.wms_jobs j ON j.completed_by::text = wp.employee_id
WHERE j.job_number = 'VYUU9L' AND j.type = 'PACK' AND j.status = 'Completed'
  AND j.country_code = 'ET' AND j.site_id::text = wp.site_id
  AND wp.total_points = 95 AND wp.total_jobs_completed = 1
  AND wp.last_job_completed_at BETWEEN j.completed_at AND j.completed_at + interval '1 minute'
  AND (SELECT count(*) FROM public.wms_jobs completed
       WHERE completed.status = 'Completed' AND completed.completed_by::text = wp.employee_id) = 1
  AND NOT EXISTS (SELECT 1 FROM public.points_transactions t WHERE t.employee_id = wp.employee_id);
COMMIT;
