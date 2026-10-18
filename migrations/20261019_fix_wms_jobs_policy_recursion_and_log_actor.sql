-- Break the mutual RLS dependency between WMS jobs and job assignments.
-- The private helper checks only the current actor's assignment and is not
-- exposed through the Supabase Data API.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_current_user_assigned_to_wms_job(p_job_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.job_assignments AS ja
    WHERE ja.job_id = p_job_id
      AND ja.employee_id IN ((SELECT auth.uid()), (SELECT public.get_my_employee_id()))
  );
$function$;

REVOKE ALL ON FUNCTION private.is_current_user_assigned_to_wms_job(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_current_user_assigned_to_wms_job(uuid)
  TO authenticated;

DROP POLICY IF EXISTS wms_jobs_zero_trust_select ON public.wms_jobs;
CREATE POLICY wms_jobs_zero_trust_select ON public.wms_jobs
FOR SELECT TO authenticated
USING (
  public.is_ceo()
  OR (
    upper(wms_jobs.country_code) = upper(public.get_my_country_code())
    AND (
      public.is_site_in_my_authorized_scope(wms_jobs.site_id::text, wms_jobs.country_code)
      OR public.is_site_in_my_authorized_scope(wms_jobs.dest_site_id::text, wms_jobs.country_code)
    )
    AND (
      public.is_manager()
      OR public.is_admin()
      OR wms_jobs.assigned_to IN (
        auth.uid()::text,
        public.get_my_employee_id()::text,
        public.get_my_employee_code()
      )
      OR private.is_current_user_assigned_to_wms_job(wms_jobs.id)
    )
  )
);

DROP POLICY IF EXISTS wms_jobs_zero_trust_update ON public.wms_jobs;
CREATE POLICY wms_jobs_zero_trust_update ON public.wms_jobs
FOR UPDATE TO authenticated
USING (
  public.is_ceo()
  OR (
    upper(wms_jobs.country_code) = upper(public.get_my_country_code())
    AND (
      public.is_site_in_my_authorized_scope(wms_jobs.site_id::text, wms_jobs.country_code)
      OR public.is_site_in_my_authorized_scope(wms_jobs.dest_site_id::text, wms_jobs.country_code)
    )
    AND (
      public.is_manager()
      OR public.is_admin()
      OR wms_jobs.assigned_to IN (
        auth.uid()::text,
        public.get_my_employee_id()::text,
        public.get_my_employee_code()
      )
      OR private.is_current_user_assigned_to_wms_job(wms_jobs.id)
    )
  )
)
WITH CHECK (
  public.is_ceo()
  OR (
    upper(wms_jobs.country_code) = upper(public.get_my_country_code())
    AND (
      public.is_site_in_my_authorized_scope(wms_jobs.site_id::text, wms_jobs.country_code)
      OR public.is_site_in_my_authorized_scope(wms_jobs.dest_site_id::text, wms_jobs.country_code)
    )
    AND (
      public.is_manager()
      OR public.is_admin()
      OR wms_jobs.assigned_to IN (
        auth.uid()::text,
        public.get_my_employee_id()::text,
        public.get_my_employee_code()
      )
      OR private.is_current_user_assigned_to_wms_job(wms_jobs.id)
    )
  )
);

-- Bind client-created audit rows to the verified actor, never a display name
-- supplied by the browser. Preserve explicit service-side actors when there
-- is no authenticated end-user context.
CREATE OR REPLACE FUNCTION public.bind_system_log_actor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
DECLARE
  v_uid text;
  v_email text;
  v_emp_id text;
  v_emp_name text;
BEGIN
  v_uid := (SELECT auth.uid())::text;
  v_email := (SELECT auth.jwt() ->> 'email');

  SELECT e.id::text, e.name
    INTO v_emp_id, v_emp_name
  FROM public.employees AS e
  WHERE (v_uid IS NOT NULL AND e.id::text = v_uid)
     OR (v_email IS NOT NULL AND lower(e.email) = lower(v_email))
  LIMIT 1;

  IF v_uid IS NOT NULL THEN
    NEW.performed_by := COALESCE(v_emp_id, v_uid);
  END IF;

  IF v_emp_name IS NOT NULL AND (NEW.user_name IS NULL OR NEW.user_name = '') THEN
    NEW.user_name := v_emp_name;
  END IF;

  IF NEW.created_at IS NULL THEN
    NEW.created_at := now();
  END IF;

  RETURN NEW;
END;
$function$;
