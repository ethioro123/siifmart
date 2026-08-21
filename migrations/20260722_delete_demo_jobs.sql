-- Migration: Purge & Delete leftover test/demo jobs from WMS
-- Run this in Supabase SQL Editor to permanently hard-delete all leftover demo jobs

-- 1. Remove assignments referencing demo jobs
DELETE FROM public.job_assignments
WHERE job_id IN (
    SELECT id FROM public.wms_jobs
    WHERE job_number ~* '(961C|34E2|896D|61C0|6D31|0558|E653|9124|61FC)'
       OR line_items::text ~* '(b0be|e1dc|PAN-RIC-001|SNK-ALM-001|PAN-PAS-001|FRT-BAN-001|SNK-CHO-001|DAI-EGG-001)'
);

-- 2. Remove line items if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wms_job_items') THEN
        DELETE FROM public.wms_job_items
        WHERE job_id IN (
            SELECT id FROM public.wms_jobs
            WHERE job_number ~* '(961C|34E2|896D|61C0|6D31|0558|E653|9124|61FC)'
               OR line_items::text ~* '(b0be|e1dc|PAN-RIC-001|SNK-ALM-001|PAN-PAS-001|FRT-BAN-001|SNK-CHO-001|DAI-EGG-001)'
        );
    END IF;
END $$;

-- 3. Delete demo jobs from wms_jobs permanently
DELETE FROM public.wms_jobs
WHERE job_number ~* '(961C|34E2|896D|61C0|6D31|0558|E653|9124|61FC)'
   OR line_items::text ~* '(b0be|e1dc|PAN-RIC-001|SNK-ALM-001|PAN-PAS-001|FRT-BAN-001|SNK-CHO-001|DAI-EGG-001)';
