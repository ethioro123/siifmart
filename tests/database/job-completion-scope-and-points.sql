-- Rollback-only regression for the reported staging Putaway job and assigned worker.
BEGIN;
SET LOCAL statement_timeout='5s';
SELECT set_config('test.foreign_worker',coalesce((SELECT e.id::text FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE upper(s.country)<>'ET' AND lower(e.status)='active' LIMIT 1),'00000000-0000-0000-0000-000000000099'),true);
SELECT set_config('request.jwt.claim.sub','af5081f6-d2a9-4fd4-9617-7fad9c4f91f9',true),set_config('request.jwt.claims','{"sub":"af5081f6-d2a9-4fd4-9617-7fad9c4f91f9","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE first_award jsonb; again jsonb; affected integer; denied boolean:=false;
BEGIN
 UPDATE public.job_assignments SET status='Completed',completed_at=now() WHERE id='8aa6b8d2-836a-4a76-84d1-bfcf456a0551';
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected<>1 THEN RAISE EXCEPTION 'Assigned worker could not complete assignment'; END IF;
 first_award:=public.award_completed_warehouse_job('a098fffd-bad6-442d-9e96-36309317ac35');
 IF first_award->>'employee_id'<>'af5081f6-d2a9-4fd4-9617-7fad9c4f91f9' OR (first_award->>'total_points')::integer<=0 THEN RAISE EXCEPTION 'No server-derived worker award'; END IF;
 again:=public.award_completed_warehouse_job('a098fffd-bad6-442d-9e96-36309317ac35');
 IF again->>'total_points' IS DISTINCT FROM first_award->>'total_points' THEN RAISE EXCEPTION 'Duplicate job award'; END IF;
 BEGIN
  PERFORM public.record_worker_points_award('{}',999999,'MANUAL_BONUS','unauthorized',NULL);
 EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Worker received manual award permission'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','27331fda-2fcf-4c1f-b08a-6742837c94e2',true),set_config('request.jwt.claims','{"sub":"27331fda-2fcf-4c1f-b08a-6742837c94e2","role":"authenticated"}',true);
DO $$
DECLARE denied boolean:=false; affected integer;
BEGIN
 BEGIN PERFORM public.award_completed_warehouse_job('a098fffd-bad6-442d-9e96-36309317ac35');
 EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Another worker could claim award'; END IF;
 UPDATE public.job_assignments SET status='Completed' WHERE id='8aa6b8d2-836a-4a76-84d1-bfcf456a0551';
 GET DIAGNOSTICS affected=ROW_COUNT;
 IF affected<>0 THEN RAISE EXCEPTION 'Another worker could update assignment'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub',current_setting('test.foreign_worker'),true),set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.foreign_worker'),'role','authenticated')::text,true);
DO $$
DECLARE denied boolean:=false;
BEGIN
 IF EXISTS(SELECT 1 FROM public.job_assignments WHERE id='8aa6b8d2-836a-4a76-84d1-bfcf456a0551') THEN RAISE EXCEPTION 'Foreign country assignment exposed'; END IF;
 BEGIN PERFORM public.award_completed_warehouse_job('a098fffd-bad6-442d-9e96-36309317ac35');
 EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Foreign country worker could claim award'; END IF;
END $$;
ROLLBACK;
