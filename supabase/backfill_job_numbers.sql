-- JOB NUMBER BACKFILL SCRIPT
-- Purpose: Sync job numbers for existing PICK, PACK, and DISPATCH jobs to match their parent TRANSFER.
-- Run this in the Supabase SQL Editor if you want to fix all historical data at once.

BEGIN;

-- 1. Sync Job Numbers for all child jobs linked to a parent TRANSFER
WITH parent_mapping AS (
    SELECT 
        id, 
        job_number 
    FROM public.wms_jobs 
    WHERE type = 'TRANSFER' 
    AND job_number IS NOT NULL
)
UPDATE public.wms_jobs AS child
SET job_number = pm.job_number
FROM parent_mapping pm
WHERE (child.order_ref = pm.id::text OR child.order_ref = pm.job_number)
AND child.type IN ('PICK', 'PACK', 'DISPATCH')
AND (child.job_number IS NULL OR child.job_number <> pm.job_number);

-- 2. Optional: Fix any PUTAWAY jobs that might have missed their PO number
WITH po_mapping AS (
    SELECT 
        id, 
        po_number 
    FROM public.purchase_orders 
    WHERE po_number IS NOT NULL
)
UPDATE public.wms_jobs AS job
SET job_number = pom.po_number
FROM po_mapping pom
WHERE job.order_ref = pom.id::text
AND job.type = 'PUTAWAY'
AND (job.job_number IS NULL OR job.job_number <> pom.po_number);

COMMIT;

-- Verification
SELECT type, count(*) as synced_count
FROM public.wms_jobs
WHERE job_number IS NOT NULL
GROUP BY type;
