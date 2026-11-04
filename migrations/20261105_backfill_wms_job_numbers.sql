-- Migration: 20261105_backfill_wms_job_numbers.sql
-- Description: Backfill null job_numbers in public.wms_jobs with clean 6-character uppercase references
--              to prevent raw UUID leakage into operations logs and job summaries.

UPDATE public.wms_jobs
SET job_number = upper(substr(replace(id::text, '-', ''), 1, 6))
WHERE job_number IS NULL OR btrim(job_number) = '';
