-- Rollback-only regression for the reported RECEIVE completion timeout.
BEGIN;
SET LOCAL statement_timeout='3s';
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000088',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000088","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF public.get_my_employee_id() IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Authenticated identity mismatch'; END IF;
 IF public.get_my_employee_code() IS NULL THEN RAISE EXCEPTION 'Authenticated employee code missing'; END IF;
END $$;
UPDATE public.wms_jobs SET status='Completed',completed_by=auth.uid()::text,completed_at=now()
WHERE id='95c91815-cada-44f3-bbf4-895ad8499e11' RETURNING id,status;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000099',true);
SELECT set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000099","role":"authenticated","email":"not-an-identity-claim@example.invalid"}',true);
DO $$ BEGIN
 IF public.get_my_employee_id() IS NOT NULL OR public.get_my_employee_code() IS NOT NULL THEN RAISE EXCEPTION 'Unknown subject resolved to an employee'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{"role":"anon"}',true);
DO $$ BEGIN
 IF public.get_my_employee_id() IS NOT NULL OR public.get_my_employee_code() IS NOT NULL THEN RAISE EXCEPTION 'Anonymous identity resolved'; END IF;
END $$;
ROLLBACK;
