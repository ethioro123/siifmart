-- UPDATE WMS JOB TYPE CONSTRAINT
-- The existing check constraint prevents creating 'TRANSFER' jobs.
-- This migration updates the constraint to include 'TRANSFER' and other missing types.

ALTER TABLE wms_jobs DROP CONSTRAINT IF EXISTS wms_jobs_type_check;

ALTER TABLE wms_jobs ADD CONSTRAINT wms_jobs_type_check 
CHECK (type IN ('PICK', 'PACK', 'PUTAWAY', 'REPLENISH', 'DISPATCH', 'TRANSFER', 'COUNT', 'WASTE', 'RETURNS'));
