-- Keep points totals and their audit entry in one authorized transaction.
BEGIN;

DROP POLICY IF EXISTS points_tx_insert_supervised ON public.points_transactions;
CREATE POLICY points_tx_insert_supervised ON public.points_transactions
FOR INSERT TO authenticated
WITH CHECK (
  (public.is_manager() OR public.is_ceo())
  AND EXISTS (
    SELECT 1 FROM public.worker_points wp
    JOIN public.employees e ON e.id::text = wp.employee_id
    WHERE wp.employee_id = points_transactions.employee_id
      AND e.site_id::text = wp.site_id
      AND public.is_site_in_my_authorized_scope(wp.site_id, NULL)
      AND (points_transactions.type <> 'JOB_COMPLETE' OR EXISTS (
        SELECT 1 FROM public.wms_jobs j
        WHERE j.id::text = points_transactions.job_id
          AND j.site_id::text = wp.site_id AND j.status = 'Completed'
          AND wp.employee_id IN (j.completed_by::text, j.assigned_to::text)
      ))
  )
);

DROP POLICY IF EXISTS points_tx_read_scoped ON public.points_transactions;
CREATE POLICY points_tx_read_scoped ON public.points_transactions
FOR SELECT TO authenticated
USING (
  employee_id IN ((SELECT auth.uid())::text, public.get_my_employee_id()::text)
  OR public.is_ceo()
  OR (public.is_manager() AND EXISTS (
    SELECT 1 FROM public.worker_points wp
    WHERE wp.employee_id = points_transactions.employee_id
      AND public.is_site_in_my_authorized_scope(wp.site_id, NULL)
  ))
);

CREATE OR REPLACE FUNCTION public.record_worker_points_award(
  p_worker jsonb, p_points integer, p_type text, p_description text,
  p_job_id text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
DECLARE
  v_employee text := p_worker->>'employee_id';
  v_site text := p_worker->>'site_id';
  v_previous public.worker_points%ROWTYPE;
  v_saved public.worker_points%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR NOT (public.is_manager() OR public.is_ceo())
     OR NOT public.is_site_in_my_authorized_scope(v_site, NULL)
     OR NOT EXISTS (SELECT 1 FROM public.employees e
                    WHERE e.id::text = v_employee AND e.site_id::text = v_site) THEN
    RAISE EXCEPTION 'Points awards require a supervisor in the employee site scope'
      USING ERRCODE = '42501';
  END IF;
  IF p_points IS NULL OR p_type IS NULL THEN
    RAISE EXCEPTION 'Points and award type are required' USING ERRCODE = '22023';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(v_employee, 0));
  SELECT * INTO v_previous FROM public.worker_points
    WHERE employee_id = v_employee FOR UPDATE;
  IF p_type = 'JOB_COMPLETE' AND EXISTS (
    SELECT 1 FROM public.points_transactions
    WHERE employee_id = v_employee AND job_id = p_job_id AND type = p_type
  ) THEN
    RETURN to_jsonb(v_previous);
  END IF;
  IF COALESCE(v_previous.total_points, 0) IS DISTINCT FROM
     (p_worker->>'total_points')::integer - p_points THEN
    RAISE EXCEPTION 'Worker points changed; refresh before retrying'
      USING ERRCODE = '40001';
  END IF;

  INSERT INTO public.worker_points (
    employee_id, site_id, employee_name, employee_avatar,
    total_points, weekly_points, monthly_points, today_points,
    total_jobs_completed, total_items_picked, average_accuracy, average_time_per_job,
    current_streak, longest_streak, last_job_completed_at, last_updated, achievements,
    rank, level, level_title, current_bonus_tier, estimated_bonus, bonus_period_points
  ) VALUES (
    v_employee, v_site, p_worker->>'employee_name', p_worker->>'employee_avatar',
    (p_worker->>'total_points')::integer, (p_worker->>'weekly_points')::integer,
    (p_worker->>'monthly_points')::integer, (p_worker->>'today_points')::integer,
    (p_worker->>'total_jobs_completed')::integer, (p_worker->>'total_items_picked')::integer,
    (p_worker->>'average_accuracy')::numeric, (p_worker->>'average_time_per_job')::numeric,
    (p_worker->>'current_streak')::integer, (p_worker->>'longest_streak')::integer,
    (p_worker->>'last_job_completed_at')::timestamptz, now(), p_worker->'achievements',
    (p_worker->>'rank')::integer, (p_worker->>'level')::integer, p_worker->>'level_title',
    p_worker->>'current_bonus_tier', (p_worker->>'estimated_bonus')::numeric,
    (p_worker->>'bonus_period_points')::integer
  ) ON CONFLICT (employee_id) DO UPDATE SET
    employee_name = EXCLUDED.employee_name, employee_avatar = EXCLUDED.employee_avatar,
    total_points = EXCLUDED.total_points, weekly_points = EXCLUDED.weekly_points,
    monthly_points = EXCLUDED.monthly_points, today_points = EXCLUDED.today_points,
    total_jobs_completed = EXCLUDED.total_jobs_completed,
    total_items_picked = EXCLUDED.total_items_picked, average_accuracy = EXCLUDED.average_accuracy,
    current_streak = EXCLUDED.current_streak, longest_streak = EXCLUDED.longest_streak,
    last_job_completed_at = EXCLUDED.last_job_completed_at, last_updated = EXCLUDED.last_updated,
    achievements = EXCLUDED.achievements, level = EXCLUDED.level, level_title = EXCLUDED.level_title,
    current_bonus_tier = EXCLUDED.current_bonus_tier, estimated_bonus = EXCLUDED.estimated_bonus,
    bonus_period_points = EXCLUDED.bonus_period_points
  RETURNING * INTO v_saved;

  INSERT INTO public.points_transactions (employee_id, job_id, points, type, description)
    VALUES (v_employee, p_job_id, p_points, p_type, p_description);
  RETURN to_jsonb(v_saved);
END;
$$;
REVOKE ALL ON FUNCTION public.record_worker_points_award(jsonb, integer, text, text, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_worker_points_award(jsonb, integer, text, text, text)
  TO authenticated;

COMMIT;
