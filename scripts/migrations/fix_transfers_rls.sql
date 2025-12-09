-- ============================================================================
-- RLS Policies for Transfers Table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql
-- ============================================================================

-- First, ensure RLS is enabled on the transfers table
ALTER TABLE transfers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to view transfers" ON transfers;
DROP POLICY IF EXISTS "Allow authenticated users to create transfers" ON transfers;
DROP POLICY IF EXISTS "Allow authenticated users to update transfers" ON transfers;
DROP POLICY IF EXISTS "Allow authenticated users to delete transfers" ON transfers;

-- ============================================================================
-- SELECT Policy: Allow authenticated users to view all transfers
-- This allows users to see transfers where they are at the source or destination site
-- ============================================================================
CREATE POLICY "Allow authenticated users to view transfers"
ON transfers
FOR SELECT
TO authenticated
USING (true);  -- Allow viewing all transfers (can be restricted by site_id if needed)

-- ============================================================================
-- INSERT Policy: Allow authenticated users to create transfers
-- This allows any authenticated user to create new transfer requests
-- ============================================================================
CREATE POLICY "Allow authenticated users to create transfers"
ON transfers
FOR INSERT
TO authenticated
WITH CHECK (true);  -- Allow creating any transfer

-- ============================================================================
-- UPDATE Policy: Allow authenticated users to update transfers
-- This allows updating transfer status (approve, ship, receive, etc.)
-- ============================================================================
CREATE POLICY "Allow authenticated users to update transfers"
ON transfers
FOR UPDATE
TO authenticated
USING (true)  -- Can update any transfer
WITH CHECK (true);

-- ============================================================================
-- DELETE Policy: Allow authenticated users to delete transfers (optional)
-- Only enable if you want users to be able to delete transfers
-- ============================================================================
CREATE POLICY "Allow authenticated users to delete transfers"
ON transfers
FOR DELETE
TO authenticated
USING (true);

-- ============================================================================
-- VERIFY: Check the policies were created
-- ============================================================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'transfers';
