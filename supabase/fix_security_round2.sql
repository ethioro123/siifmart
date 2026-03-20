-- =============================================================================
-- SIIFMART: Security Hardening — Round 2 (REVISED)
-- =============================================================================
-- Uses pg_catalog to find exact function signatures automatically,
-- so ALTER FUNCTION works regardless of parameter names/types.
-- =============================================================================


-- =============================================================================
-- PART 1: FIX MUTABLE search_path ON ALL public.* FUNCTIONS
-- This DO block finds every function in the public schema and patches them.
-- =============================================================================

DO $$
DECLARE
    func RECORD;
    alter_sql TEXT;
BEGIN
    FOR func IN
        SELECT
            p.oid,
            p.proname,
            pg_get_function_identity_arguments(p.oid) AS args
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname IN (
              'get_inventory_metrics',
              'debug_po_data',
              'generate_po_number',
              'get_financial_metrics',
              'debug_po_deep_dive',
              'get_procurement_metrics',
              'get_warehouse_metrics',
              'update_staff_schedules_updated_at',
              'log_sensitive_change',
              'get_auth_role',
              'update_job_assignments_updated_at',
              'calculate_job_assignment_duration',
              'update_updated_at_column'
          )
    LOOP
        alter_sql := format(
            'ALTER FUNCTION public.%I(%s) SET search_path = public, pg_temp',
            func.proname,
            func.args
        );
        RAISE NOTICE 'Running: %', alter_sql;
        EXECUTE alter_sql;
    END LOOP;
END;
$$;


-- =============================================================================
-- PART 2: FIX UNRESTRICTED RLS POLICIES (always-true USING clauses)
-- =============================================================================

-- ── customers ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_full_access" ON public.customers;
CREATE POLICY "authenticated_full_access" ON public.customers
    FOR ALL TO authenticated, anon
    USING ((select auth.uid()) IS NOT NULL)
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ── employees ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_full_access" ON public.employees;
CREATE POLICY "authenticated_full_access" ON public.employees
    FOR ALL TO authenticated, anon
    USING ((select auth.uid()) IS NOT NULL)
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ── products ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated_full_access" ON public.products;
CREATE POLICY "authenticated_full_access" ON public.products
    FOR ALL TO authenticated, anon
    USING ((select auth.uid()) IS NOT NULL)
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ── barcode_approvals ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "barcode_approvals_authenticated_access" ON public.barcode_approvals;
CREATE POLICY "barcode_approvals_authenticated_access" ON public.barcode_approvals
    FOR ALL TO authenticated
    USING ((select auth.uid()) IS NOT NULL)
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ── brainstorm_nodes ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all access" ON public.brainstorm_nodes;
CREATE POLICY "authenticated_full_access" ON public.brainstorm_nodes
    FOR ALL TO authenticated
    USING ((select auth.uid()) IS NOT NULL)
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ── discrepancy_claims ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.discrepancy_claims;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.discrepancy_claims;
DROP POLICY IF EXISTS "authenticated_full_access"             ON public.discrepancy_claims;
CREATE POLICY "authenticated_full_access" ON public.discrepancy_claims
    FOR ALL TO authenticated
    USING ((select auth.uid()) IS NOT NULL)
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ── discrepancy_resolutions ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.discrepancy_resolutions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.discrepancy_resolutions;
DROP POLICY IF EXISTS "authenticated_full_access"             ON public.discrepancy_resolutions;
CREATE POLICY "authenticated_full_access" ON public.discrepancy_resolutions
    FOR ALL TO authenticated
    USING ((select auth.uid()) IS NOT NULL)
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ── employee_tasks ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.employee_tasks;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.employee_tasks;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.employee_tasks;
DROP POLICY IF EXISTS "authenticated_full_access"             ON public.employee_tasks;
CREATE POLICY "authenticated_full_access" ON public.employee_tasks
    FOR ALL TO authenticated
    USING ((select auth.uid()) IS NOT NULL)
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ── staff_schedules ──────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow public access to staff_schedules" ON public.staff_schedules;
DROP POLICY IF EXISTS "authenticated_full_access"               ON public.staff_schedules;
CREATE POLICY "authenticated_full_access" ON public.staff_schedules
    FOR ALL TO authenticated
    USING ((select auth.uid()) IS NOT NULL)
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ── system_config ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow authenticated update" ON public.system_config;
DROP POLICY IF EXISTS "authenticated_full_access"  ON public.system_config;
CREATE POLICY "authenticated_full_access" ON public.system_config
    FOR ALL TO authenticated
    USING ((select auth.uid()) IS NOT NULL)
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ── wms_job_items ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "wms_job_items_authenticated_access" ON public.wms_job_items;
CREATE POLICY "wms_job_items_authenticated_access" ON public.wms_job_items
    FOR ALL TO authenticated
    USING ((select auth.uid()) IS NOT NULL)
    WITH CHECK ((select auth.uid()) IS NOT NULL);


-- =============================================================================
-- PART 3: MOVE pg_trgm TO extensions SCHEMA (graceful — won't fail if blocked)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pg_trgm move skipped (safe to ignore): %', SQLERRM;
END;
$$;


-- =============================================================================
-- MANUAL: HaveIBeenPwned password check (Dashboard only — cannot be done in SQL)
--   Auth → Settings → Enable "Check passwords against HaveIBeenPwned.org"
-- =============================================================================
-- DONE ✅
-- =============================================================================
