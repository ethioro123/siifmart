-- Migration: Fix Discrepancy Resolution Schema Sync
-- Run this in Supabase SQL Editor to fix 400 errors

-- 1. Add missing columns if they don't exist
ALTER TABLE discrepancy_resolutions ADD COLUMN IF NOT EXISTS resolve_qty INTEGER;
ALTER TABLE discrepancy_resolutions ADD COLUMN IF NOT EXISTS replacement_job_id TEXT;

-- 2. Update resolution_type check constraint
-- First drop the old one (if it has a name, otherwise we name-match or drop and recreate)
-- Note: Check constraints don't have predictable names unless specified.
-- We can drop all check constraints on this column and add the new one.
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'discrepancy_resolutions'::regclass 
        AND contype = 'c' 
        AND pg_get_constraintdef(oid) LIKE '%resolution_type%'
    ) LOOP
        EXECUTE 'ALTER TABLE discrepancy_resolutions DROP CONSTRAINT ' || r.conname;
    END LOOP;
END $$;

ALTER TABLE discrepancy_resolutions 
ADD CONSTRAINT discrepancy_resolutions_resolution_type_check 
CHECK (resolution_type IN ('accept', 'investigate', 'claim', 'adjust', 'reject', 'recount', 'dispose', 'replace'));

-- 3. Ensure discrepancy_type check is also up to date
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'discrepancy_resolutions'::regclass 
        AND contype = 'c' 
        AND pg_get_constraintdef(oid) LIKE '%discrepancy_type%'
    ) LOOP
        EXECUTE 'ALTER TABLE discrepancy_resolutions DROP CONSTRAINT ' || r.conname;
    END LOOP;
END $$;

ALTER TABLE discrepancy_resolutions 
ADD CONSTRAINT discrepancy_resolutions_discrepancy_type_check 
CHECK (discrepancy_type IN ('shortage', 'overage', 'damaged', 'wrong_item', 'missing'));
