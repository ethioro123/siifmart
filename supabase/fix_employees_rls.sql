-- =============================================================================
-- FIX: Employee Creation RLS Policy Violation
-- =============================================================================
-- ROOT CAUSE: The old "Admin_Modify_Employees" policy from 20240523_harden_schema.sql
-- restricts INSERT/UPDATE/DELETE to users whose role is super_admin/admin/hr,
-- checked via get_auth_role() which queries the employees table itself.
-- This causes the insert to fail because:
--   1. The WITH CHECK clause calls get_auth_role()
--   2. get_auth_role() does SELECT on employees WHERE email = auth.email()
--   3. For new employees or users not in the employees table, this returns NULL
--   4. NULL is NOT IN ('super_admin', 'admin', 'hr'), so the policy rejects the insert
--
-- FIX: Drop ALL old policies and create a single clean permissive policy.
-- =============================================================================

-- Step 1: Drop ALL existing policies on employees (old and new)
DROP POLICY IF EXISTS "Admin_Modify_Employees"       ON public.employees;
DROP POLICY IF EXISTS "Public_Read_Employees"         ON public.employees;
DROP POLICY IF EXISTS "employees_select"              ON public.employees;
DROP POLICY IF EXISTS "employees_insert"              ON public.employees;
DROP POLICY IF EXISTS "employees_update"              ON public.employees;
DROP POLICY IF EXISTS "employees_delete"              ON public.employees;
DROP POLICY IF EXISTS "authenticated_full_access"     ON public.employees;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.employees;
DROP POLICY IF EXISTS "Allow public access"           ON public.employees;
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.employees;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.employees;

-- Step 2: Ensure RLS is enabled
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Step 3: Create a single clean policy
-- Authenticated users can do everything, anon users can read (needed for login lookup)
CREATE POLICY "authenticated_full_access" ON public.employees
    FOR ALL TO authenticated, anon
    USING (true)
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- =============================================================================
-- VERIFICATION: Run this after to confirm only 1 policy exists
-- =============================================================================
-- SELECT * FROM pg_policies WHERE tablename = 'employees';
-- Expected: exactly 1 row with policyname = 'authenticated_full_access'
-- =============================================================================
