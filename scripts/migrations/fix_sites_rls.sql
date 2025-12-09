-- ============================================================================
-- FIX SITES TABLE RLS POLICIES
-- ============================================================================
-- This script ensures authenticated users can create, read, update, and delete
-- sites (locations like Warehouses, Stores, etc.)

-- First, check if RLS is enabled
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them properly)
DROP POLICY IF EXISTS "Allow authenticated users to view sites" ON sites;
DROP POLICY IF EXISTS "Allow authenticated users to create sites" ON sites;
DROP POLICY IF EXISTS "Allow authenticated users to update sites" ON sites;
DROP POLICY IF EXISTS "Allow authenticated users to delete sites" ON sites;

-- Create policies for authenticated users
-- SELECT: All authenticated users can view all sites
CREATE POLICY "Allow authenticated users to view sites"
ON sites FOR SELECT
TO authenticated
USING (true);

-- INSERT: All authenticated users can create sites
CREATE POLICY "Allow authenticated users to create sites"
ON sites FOR INSERT
TO authenticated
WITH CHECK (true);

-- UPDATE: All authenticated users can update sites  
CREATE POLICY "Allow authenticated users to update sites"
ON sites FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- DELETE: All authenticated users can delete sites
CREATE POLICY "Allow authenticated users to delete sites"
ON sites FOR DELETE
TO authenticated
USING (true);

-- Grant usage on any sequences if needed
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Verify policies
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'sites';
