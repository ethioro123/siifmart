-- Migration: Add login tracking columns to employees table
-- Copy this SQL and run it in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/sql/new

ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS last_login_gps TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS last_login_device TEXT;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS login_history JSONB DEFAULT '[]'::jsonb;

-- Recreate employees_update_admin policy to prevent "permission denied for table users" error.
-- auth.jwt() ->> 'email' is used instead of querying the restricted auth.users table.
DROP POLICY IF EXISTS "employees_update_admin" ON public.employees;

CREATE POLICY "employees_update_admin" ON public.employees
    FOR UPDATE TO authenticated
    USING (
      -- Admin/HR can update any employee
      (select public.is_admin())
      OR
      -- Managers can update employees at their site
      (select public.is_manager()) AND site_id = (select public.get_my_site_id())
      OR
      -- Employees can update their own record (photo, preferences)
      id = (select auth.uid())
      OR
      email = (select auth.jwt() ->> 'email')
    );
