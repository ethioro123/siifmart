-- =============================================================================
-- Fix: Add RLS policies for tables missing them
-- =============================================================================

-- ── employee_tasks ───────────────────────────────────────────────────────────
CREATE POLICY "employee_tasks_read" ON public.employee_tasks
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "employee_tasks_insert" ON public.employee_tasks
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "employee_tasks_update" ON public.employee_tasks
    FOR UPDATE TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "employee_tasks_delete" ON public.employee_tasks
    FOR DELETE TO authenticated
    USING ((select public.is_manager()));

-- ── discrepancy_claims ───────────────────────────────────────────────────────
CREATE POLICY "discrepancy_claims_read" ON public.discrepancy_claims
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "discrepancy_claims_insert" ON public.discrepancy_claims
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "discrepancy_claims_update" ON public.discrepancy_claims
    FOR UPDATE TO authenticated
    USING ((select public.is_manager()));

CREATE POLICY "discrepancy_claims_delete" ON public.discrepancy_claims
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));

-- ── discrepancy_resolutions ──────────────────────────────────────────────────
CREATE POLICY "discrepancy_resolutions_read" ON public.discrepancy_resolutions
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "discrepancy_resolutions_insert" ON public.discrepancy_resolutions
    FOR INSERT TO authenticated
    WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "discrepancy_resolutions_update" ON public.discrepancy_resolutions
    FOR UPDATE TO authenticated
    USING ((select public.is_manager()));

CREATE POLICY "discrepancy_resolutions_delete" ON public.discrepancy_resolutions
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));

DO $$
BEGIN
    RAISE NOTICE '✅ Policies added for employee_tasks, discrepancy_claims, discrepancy_resolutions';
END $$;
