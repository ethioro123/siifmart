-- Enable RLS on the table
ALTER TABLE barcode_approvals ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow all authenticated users (employees) to view the audit log
-- This fixes the issue where the log appears empty
CREATE POLICY "Authenticated users can view barcode approvals"
ON barcode_approvals FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Allow authenticated users to insert new mappings (POS scanners)
CREATE POLICY "Authenticated users can insert barcode approvals"
ON barcode_approvals FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy 3: Allow authenticated users to update (approve/reject)
CREATE POLICY "Authenticated users can update barcode approvals"
ON barcode_approvals FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy 4: Allow authenticated users to delete (cleanup)
CREATE POLICY "Authenticated users can delete barcode approvals"
ON barcode_approvals FOR DELETE
TO authenticated
USING (true);
