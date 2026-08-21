-- =============================================================================
-- WORKER_POINTS RLS POLICY UPDATE
-- =============================================================================
--
-- ISSUE: The worker_points update policy only allowed managers to update rows.
-- When a worker completes a job, the frontend attempts to upsert/update their 
-- points row. Since the worker is authenticated but not a manager, Supabase 
-- blocks the update with a 42501 (Forbidden / USING expression violation).
--
-- FIX: Update the worker_points_update policy to allow:
--   1. Managers and above (existing behavior)
--   2. The worker themselves (where employee_id matches their employee ID)
--
-- Safe to re-run (idempotent).
-- =============================================================================

DROP POLICY IF EXISTS "worker_points_update" ON public.worker_points;

CREATE POLICY "worker_points_update" ON public.worker_points
    FOR UPDATE TO authenticated
    USING (
        (SELECT public.is_manager())
        OR
        employee_id = public.get_my_employee_id()::text
    );

DO $$
BEGIN
    RAISE NOTICE '✅ worker_points_update policy updated: workers can now update their own points.';
END $$;
