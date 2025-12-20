-- UPDATED: Create brainstorm_nodes table for Super Admin canvas
-- Run this in your Supabase SQL Editor

-- Drop table if exists (for clean reinstall)
-- DROP TABLE IF EXISTS brainstorm_nodes;

CREATE TABLE IF NOT EXISTS brainstorm_nodes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    department TEXT DEFAULT 'general',
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'idea',
    x NUMERIC DEFAULT 100,
    y NUMERIC DEFAULT 100,
    connections TEXT[] DEFAULT '{}',
    created_by TEXT DEFAULT 'System',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Advanced fields
    due_date TIMESTAMPTZ DEFAULT NULL,
    progress INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    is_starred BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ DEFAULT NULL,
    notes TEXT DEFAULT '',
    color TEXT DEFAULT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_brainstorm_nodes_created_at ON brainstorm_nodes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brainstorm_nodes_is_starred ON brainstorm_nodes(is_starred);
CREATE INDEX IF NOT EXISTS idx_brainstorm_nodes_status ON brainstorm_nodes(status);
CREATE INDEX IF NOT EXISTS idx_brainstorm_nodes_department ON brainstorm_nodes(department);

-- Enable RLS
ALTER TABLE brainstorm_nodes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all access (adjust for your security needs)
CREATE POLICY "Allow all access to brainstorm_nodes" ON brainstorm_nodes
    FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE brainstorm_nodes IS 'Brainstorming canvas nodes for super admin strategic planning with advanced features';
