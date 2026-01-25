-- Migration: Add foreign key constraint from barcode_approvals.created_by to employees.id
-- This enables joining employee data when fetching barcode approvals

-- Add the foreign key constraint (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'barcode_approvals_created_by_fkey'
        AND table_name = 'barcode_approvals'
    ) THEN
        ALTER TABLE barcode_approvals 
        ADD CONSTRAINT barcode_approvals_created_by_fkey 
        FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL;
    END IF;
END $$;
