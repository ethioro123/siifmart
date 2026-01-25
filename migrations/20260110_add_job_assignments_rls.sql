-- ============================================================================
-- FIX JOB ASSIGNMENTS RLS POLICIES
-- This migration adds Row Level Security policies for job_assignments table
-- ============================================================================

-- Enable RLS on job_assignments table
ALTER TABLE IF EXISTS job_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "job_assignments_select" ON job_assignments;
DROP POLICY IF EXISTS "job_assignments_insert" ON job_assignments;
DROP POLICY IF EXISTS "job_assignments_update" ON job_assignments;
DROP POLICY IF EXISTS "job_assignments_delete" ON job_assignments;

-- Create policies for job_assignments
-- All authenticated users can read job assignments
CREATE POLICY "job_assignments_select" ON job_assignments
    FOR SELECT USING (auth.role() = 'authenticated');

-- All authenticated users can create job assignments
CREATE POLICY "job_assignments_insert" ON job_assignments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- All authenticated users can update job assignments
CREATE POLICY "job_assignments_update" ON job_assignments
    FOR UPDATE USING (auth.role() = 'authenticated');

-- All authenticated users can delete job assignments
CREATE POLICY "job_assignments_delete" ON job_assignments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Verification
DO $$
BEGIN
    RAISE NOTICE '✅ RLS enabled and policies applied for job_assignments table';
    RAISE NOTICE '✅ All authenticated users can now access job_assignments';
END $$;
