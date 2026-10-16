-- Migration: 20261016_cancel_rejected_transfers.sql
-- 1. Expand wms_jobs_status_check constraint to include 'Cancelled', 'Dispatched', 'Deleted'
-- 2. Synchronize wms_jobs status to 'Cancelled' for any transfers marked as 'Rejected' or 'Cancelled'

ALTER TABLE wms_jobs DROP CONSTRAINT IF EXISTS wms_jobs_status_check;
ALTER TABLE wms_jobs ADD CONSTRAINT wms_jobs_status_check CHECK (status IN ('Pending', 'In-Progress', 'Completed', 'Cancelled', 'Dispatched', 'Deleted'));

UPDATE wms_jobs
SET status = 'Cancelled',
    updated_at = NOW()
WHERE type = 'TRANSFER'
  AND (transfer_status IN ('Rejected', 'Cancelled') OR status = 'Rejected')
  AND status != 'Cancelled';
