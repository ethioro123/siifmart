-- Run against staging. All test awards and audit rows are rolled back.
BEGIN;
-- Isolate the replay fixture, restoring any existing audit on rollback.
DELETE FROM public.points_transactions
WHERE employee_id = 'e1000000-0000-4000-8000-000000000037'
  AND job_id = '00b4d02e-7056-4c82-b6c4-a156ce6ab843';
SELECT set_config('test.foreign_target', (
  SELECT jsonb_build_object('employee_id', e.id, 'site_id', e.site_id)::text
  FROM public.employees e JOIN public.sites s ON s.id = e.site_id
  WHERE s.country <> 'ET' LIMIT 1
), true);
SELECT set_config('test.other_site_target', (
  SELECT jsonb_build_object('employee_id', e.id, 'site_id', e.site_id)::text
  FROM public.employees e JOIN public.sites s ON s.id = e.site_id
  WHERE s.country = 'ET' AND e.site_id <> 'a1111111-1111-4000-8000-000000000005' LIMIT 1
), true);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims',
  '{"sub":"e1000000-0000-4000-8000-000000000037","role":"authenticated"}', true);
DO $$
DECLARE
  v_before public.worker_points%ROWTYPE;
  v_payload jsonb;
  v_saved jsonb;
  v_target jsonb := current_setting('test.foreign_target')::jsonb;
  v_job text := '00b4d02e-7056-4c82-b6c4-a156ce6ab843';
BEGIN
  SELECT * INTO STRICT v_before FROM public.worker_points
    WHERE employee_id = (SELECT auth.uid())::text;
  v_payload := to_jsonb(v_before) || jsonb_build_object('total_points', v_before.total_points + 1);
  v_saved := public.record_worker_points_award(v_payload, 1, 'JOB_COMPLETE', 'Rollback test', v_job);
  IF (v_saved->>'total_points')::integer <> v_before.total_points + 1 THEN
    RAISE EXCEPTION 'Manager award failed';
  END IF;
  v_saved := public.record_worker_points_award(v_payload, 1, 'JOB_COMPLETE', 'Replay test', v_job);
  IF (v_saved->>'total_points')::integer <> v_before.total_points + 1 OR
     (SELECT count(*) FROM public.points_transactions WHERE job_id = v_job
      AND employee_id = v_before.employee_id AND type = 'JOB_COMPLETE') <> 1 THEN
    RAISE EXCEPTION 'Repeated job awarded twice';
  END IF;

  BEGIN
    PERFORM public.record_worker_points_award(
      v_payload || jsonb_build_object('total_points', v_before.total_points + 2),
      1, 'JOB_COMPLETE', 'Invalid job rollback', 'not-a-job');
    RAISE EXCEPTION 'Invalid job award was allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.record_worker_points_award(
      v_payload || current_setting('test.other_site_target')::jsonb, 1, 'BONUS', 'Other-site denial');
    RAISE EXCEPTION 'Unauthorized site award was allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  IF (SELECT total_points FROM public.worker_points WHERE id = v_before.id)
     <> v_before.total_points + 1 THEN
    RAISE EXCEPTION 'Failed audit changed worker totals';
  END IF;

  BEGIN
    PERFORM public.record_worker_points_award(v_payload || v_target, 1, 'BONUS', 'Cross-country denial');
    RAISE EXCEPTION 'Cross-country award was allowed';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  IF has_function_privilege('anon', 'public.record_worker_points_award(jsonb,integer,text,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Anonymous award execution was allowed';
  END IF;
END;
$$;
ROLLBACK;
SELECT 'supervised points: award, replay, rollback, site/country scope, anonymous denial passed' AS result;
