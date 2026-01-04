-- Migration: Create employee_tasks table for task management
-- Created: 2024-12-29

-- Drop table if exists (for fresh start)
DROP TABLE IF EXISTS employee_tasks CASCADE;

-- Create employee_tasks table
CREATE TABLE employee_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In-Progress', 'Completed')),
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
    due_date DATE NOT NULL,
    site_id TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON employee_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON employee_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON employee_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_site_id ON employee_tasks(site_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON employee_tasks(due_date);

-- Enable Row Level Security
ALTER TABLE employee_tasks ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (read all, write own or if manager)
CREATE POLICY "Enable read access for all users"
    ON employee_tasks FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON employee_tasks FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON employee_tasks FOR UPDATE
    USING (true);

CREATE POLICY "Enable delete for authenticated users"
    ON employee_tasks FOR DELETE
    USING (true);

-- Insert some sample tasks to start with
INSERT INTO employee_tasks (title, description, assigned_to, status, priority, due_date, created_by) VALUES
    ('Inventory Count - Electronics', 'Perform full inventory count of electronics section', 'unassigned', 'Pending', 'High', CURRENT_DATE + INTERVAL '2 days', 'system'),
    ('Staff Training - New POS System', 'Complete training on new POS features', 'unassigned', 'Pending', 'Medium', CURRENT_DATE + INTERVAL '7 days', 'system'),
    ('Review Safety Protocols', 'Annual safety protocol review and update', 'unassigned', 'Pending', 'Low', CURRENT_DATE + INTERVAL '14 days', 'system'),
    ('Supplier Invoice Reconciliation', 'Reconcile pending supplier invoices', 'unassigned', 'In-Progress', 'High', CURRENT_DATE + INTERVAL '1 day', 'system'),
    ('Update Product Labels', 'Update price labels for seasonal sale items', 'unassigned', 'Pending', 'Medium', CURRENT_DATE + INTERVAL '3 days', 'system');

-- Add comment for documentation
COMMENT ON TABLE employee_tasks IS 'Stores employee task assignments and progress tracking';
