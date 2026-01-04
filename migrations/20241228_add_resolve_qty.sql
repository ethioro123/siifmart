-- Add resolve_qty column to discrepancy_resolutions table
-- Run this in Supabase SQL Editor

ALTER TABLE discrepancy_resolutions ADD COLUMN IF NOT EXISTS resolve_qty INTEGER;
