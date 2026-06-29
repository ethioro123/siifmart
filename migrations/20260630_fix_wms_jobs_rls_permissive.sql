-- Migration: Relax RLS policies for updating wms_jobs
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/sql/new

-- PROBLEM:
--   The wms_jobs_update policy restricts updates to users explicitly assigned
--   in the job_assignments table. This fails (PGRST116 / 406 Not Acceptable)
--   if the worker completes a job that was self-assigned, or if the email
--   mapping function get_my_employee_id() returns null, or during session/impersonation.
--
-- SOLUTION:
--   Allow any authenticated user to update wms_jobs (same pattern as products,
--   sales, and stock_movements). Security is preserved as:
--     1. Only authenticated (logged-in) users can make updates.
--     2. Delete operation is still strictly restricted to managers (is_manager()).
--     3. Only site-scoped jobs are visible/accessible to workers.

DROP POLICY IF EXISTS "wms_jobs_update" ON public.wms_jobs;

CREATE POLICY "wms_jobs_update" ON public.wms_jobs
    FOR UPDATE TO authenticated
    USING (true);

-- Verification
DO $$
BEGIN
    RAISE NOTICE '✅ wms_jobs UPDATE policy relaxed to all authenticated users';
END $$;
