-- =============================================================================
-- SIIFMART: Enforce Assignment-Scoped Updates on wms_jobs
-- =============================================================================
--
-- PROBLEM:
--   The existing wms_jobs_update policy only checks auth.uid() IS NOT NULL,
--   meaning any authenticated user can update any job row — even jobs they
--   were never assigned to.
--
-- FIX:
--   Replace the permissive UPDATE policy with one that enforces:
--     • Managers (is_manager()) can update any job (create, reassign, cancel)
--     • Workers can only UPDATE a job row if they have an entry in
--       job_assignments for that specific job.
--
-- NOTE: INSERT and DELETE are unchanged:
--   • INSERT: any authenticated user can create jobs (dispatcher/manager creates them)
--   • DELETE: only managers can delete jobs (existing policy, preserved)
--
-- Safe to re-run (idempotent via DROP POLICY IF EXISTS).
-- =============================================================================

-- Drop the old permissive update policy
DROP POLICY IF EXISTS "wms_jobs_update" ON public.wms_jobs;

-- New assignment-scoped update policy
CREATE POLICY "wms_jobs_update" ON public.wms_jobs
    FOR UPDATE TO authenticated
    USING (
        -- Managers (warehouse_manager, dispatcher, regional_manager, CEO, etc.) can update any job
        (SELECT public.is_manager())
        OR
        -- Workers can only update jobs they are assigned to
        EXISTS (
            SELECT 1
            FROM public.job_assignments ja
            WHERE ja.job_id = public.wms_jobs.id
              AND ja.employee_id = public.get_my_employee_id()
        )
    );

-- Verification
DO $$
BEGIN
    RAISE NOTICE '✅ wms_jobs UPDATE policy tightened:';
    RAISE NOTICE '   • Managers: can update any job row';
    RAISE NOTICE '   • Workers: can only update jobs they are assigned to via job_assignments';
END $$;
