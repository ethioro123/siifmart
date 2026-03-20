-- DROP UNIQUE CONSTRAINT ON JOB_NUMBER
-- Purpose: The wms_jobs table was originally designed with a UNIQUE constraint on job_number.
-- However, we now share job numbers across logical workflows (TRANSFER -> PICK -> PACK -> DISPATCH).
-- This means multiple jobs will legitimately have the exact same job_number.
-- We MUST drop the unique constraint to allow this to happen and fix the 409 Conflict infinite loops.

DO $$
DECLARE
    found_constraint_name text;
BEGIN
    SELECT tc.constraint_name INTO found_constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
    WHERE tc.constraint_type = 'UNIQUE' 
      AND tc.table_name = 'wms_jobs'
      AND tc.table_schema = 'public'
      AND ccu.column_name = 'job_number';

    IF found_constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.wms_jobs DROP CONSTRAINT ' || quote_ident(found_constraint_name);
        RAISE NOTICE '✅ Successfully dropped unique constraint on job_number: %', found_constraint_name;
    ELSE
        RAISE NOTICE 'ℹ️ No unique constraint found on wms_jobs.job_number. It may have already been dropped.';
    END IF;
END $$;
