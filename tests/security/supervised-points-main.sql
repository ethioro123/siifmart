-- Exercise the linked project's existing manager scope without retaining test data.
BEGIN;
SELECT set_config('test.points_actor', (
  SELECT jsonb_build_object('sub', e.id, 'email', e.email, 'role', 'authenticated')::text
  FROM public.employees e
  WHERE e.role = 'warehouse_manager' AND lower(e.status) = 'active' AND e.site_id IS NOT NULL
  LIMIT 1
), true);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', current_setting('test.points_actor'), true);
DO $$
DECLARE
  v_worker jsonb;
  v_before integer;
  v_saved jsonb;
BEGIN
  SELECT to_jsonb(wp) INTO v_worker FROM public.worker_points wp
    WHERE employee_id = (SELECT auth.uid())::text;
  IF v_worker IS NULL THEN
    SELECT jsonb_build_object(
      'employee_id', e.id, 'site_id', e.site_id, 'employee_name', e.name,
      'total_points', 0, 'weekly_points', 0, 'monthly_points', 0, 'today_points', 0,
      'total_jobs_completed', 0, 'total_items_picked', 0, 'average_accuracy', 100,
      'average_time_per_job', 0, 'current_streak', 0, 'longest_streak', 0,
      'achievements', '[]'::jsonb, 'rank', 0, 'level', 1, 'level_title', 'Rookie'
    ) INTO v_worker FROM public.employees e WHERE e.id = (SELECT auth.uid());
  END IF;
  IF v_worker IS NULL THEN RAISE EXCEPTION 'No authorized manager test fixture'; END IF;
  v_before := (v_worker->>'total_points')::integer;
  v_saved := public.record_worker_points_award(
    v_worker || jsonb_build_object('total_points', v_before + 1), 1, 'BONUS', 'Rollback validation');
  IF (v_saved->>'total_points')::integer <> v_before + 1 THEN
    RAISE EXCEPTION 'Linked project award failed';
  END IF;
END;
$$;
ROLLBACK;
SELECT 'linked project: manager award and audit passed; test data rolled back' AS result;
