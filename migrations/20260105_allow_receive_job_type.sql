-- Migration: Allow RECEIVE and DRIVER job types
-- Date: 2026-01-05
-- Description: Updates the check constraint on wms_jobs(type) to include 'RECEIVE' and 'DRIVER'.

-- 1. Drop existing constraint
ALTER TABLE wms_jobs DROP CONSTRAINT IF EXISTS wms_jobs_type_check;

-- 2. Add updated constraint with all valid types
ALTER TABLE wms_jobs ADD CONSTRAINT wms_jobs_type_check 
CHECK (type IN ('PICK', 'PACK', 'PUTAWAY', 'TRANSFER', 'DISPATCH', 'REPLENISH', 'COUNT', 'WASTE', 'RETURNS', 'DRIVER', 'RECEIVE'));
