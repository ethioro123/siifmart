-- Drop the existing check constraint
ALTER TABLE barcode_approvals DROP CONSTRAINT IF EXISTS barcode_approvals_status_check;

-- Add the new check constraint including 'logged'
ALTER TABLE barcode_approvals ADD CONSTRAINT barcode_approvals_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'logged'));

-- Update any existing 'pending' records to 'logged' if they are meant to be audit only
-- (Optional/Safe to omit if we want to preserve history, but for clarity let's just allow the status)
