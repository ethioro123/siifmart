-- A person's active workload is authoritative WMS jobs, never assignment history.
CREATE FUNCTION private.guard_assignment_capacity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF nullif(NEW.assigned_to,'') IS NULL OR NEW.status IN ('Completed','Cancelled','Deleted') THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' THEN
  IF NEW.assigned_to IS NOT DISTINCT FROM OLD.assigned_to AND NEW.site_id=OLD.site_id
   AND NEW.country_code=OLD.country_code AND OLD.status NOT IN ('Completed','Cancelled','Deleted') THEN RETURN NEW; END IF;
 END IF;
 PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('assignment-capacity:'||NEW.country_code||':'||NEW.site_id::text||':'||NEW.assigned_to,0));
 IF (SELECT count(*) FROM public.wms_jobs WHERE assigned_to=NEW.assigned_to AND site_id=NEW.site_id
  AND country_code=NEW.country_code AND status NOT IN ('Completed','Cancelled','Deleted') AND id<>NEW.id)>=100 THEN
  RAISE EXCEPTION 'This employee already has 100 active jobs. Complete or unassign a job before assigning another.' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.guard_assignment_capacity() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER zz_guard_assignment_capacity BEFORE INSERT OR UPDATE ON public.wms_jobs
FOR EACH ROW EXECUTE FUNCTION private.guard_assignment_capacity();

-- Invoker privileges preserve existing RLS and update/assignment authorization.
CREATE FUNCTION public.assign_wms_job(p_job_id uuid,p_employee_id uuid,p_source text DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE j public.wms_jobs%ROWTYPE; e public.employees%ROWTYPE; a public.job_assignments%ROWTYPE;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to assign jobs' USING ERRCODE='42501'; END IF;
 SELECT * INTO j FROM public.wms_jobs WHERE id=p_job_id FOR UPDATE;
 SELECT * INTO e FROM public.employees WHERE id=p_employee_id AND lower(status)='active';
 IF j.id IS NULL OR e.id IS NULL OR e.site_id IS DISTINCT FROM j.site_id
  OR NOT public.is_site_in_my_authorized_scope(j.site_id::text,j.country_code) THEN
  RAISE EXCEPTION 'Select an active employee at the authorized facility' USING ERRCODE='42501'; END IF;
 IF j.status IN ('Completed','Cancelled','Deleted') THEN RAISE EXCEPTION 'Only active jobs can be assigned'; END IF;
 IF nullif(j.assigned_to,'') IS NOT NULL AND j.assigned_to<>e.id::text THEN RAISE EXCEPTION 'Unassign the current employee first'; END IF;
 UPDATE public.wms_jobs SET assigned_to=e.id::text,status='In-Progress',assigned_by=coalesce(nullif(left(p_source,200),''),public.get_my_employee_id()::text)
 WHERE id=j.id RETURNING * INTO j;
 IF NOT FOUND THEN RAISE EXCEPTION 'Assignment was not saved' USING ERRCODE='42501'; END IF;
 SELECT * INTO a FROM public.job_assignments WHERE job_id=j.id AND employee_id=e.id
  AND status IN ('Assigned','Accepted','In-Progress','Paused') ORDER BY assigned_at DESC LIMIT 1;
 IF a.id IS NULL THEN
  INSERT INTO public.job_assignments(job_id,employee_id,employee_name,status)
  VALUES(j.id,e.id,e.name,'Assigned') RETURNING * INTO a;
 END IF;
 RETURN jsonb_build_object('job',to_jsonb(j),'assignment',to_jsonb(a));
END; $$;
REVOKE ALL ON FUNCTION public.assign_wms_job(uuid,uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.assign_wms_job(uuid,uuid,text) TO authenticated;

CREATE FUNCTION private.assignment_workloads(p_site_id uuid,p_country_code text,p_employee_ids uuid[]) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE tz text; day_start timestamptz; day_end timestamptz; result jsonb;
BEGIN
 IF auth.uid() IS NULL OR cardinality(p_employee_ids)>100 OR cardinality(p_employee_ids) IS NULL
  OR NOT public.is_site_in_my_authorized_scope(p_site_id::text,p_country_code)
  OR NOT EXISTS(SELECT 1 FROM public.sites WHERE id=p_site_id AND upper(country)=upper(p_country_code)) THEN
  RAISE EXCEPTION 'Workload is outside the authorized facility' USING ERRCODE='42501'; END IF;
 SELECT coalesce(nullif(country_configs->upper(p_country_code)->>'timezone',''),nullif(timezone,''),'UTC') INTO tz
 FROM public.system_config WHERE id='00000000-0000-0000-0000-000000000001';
 tz:=coalesce(tz,'UTC');
 day_start:=date_trunc('day',now() AT TIME ZONE tz) AT TIME ZONE tz;
 day_end:=(date_trunc('day',now() AT TIME ZONE tz)+interval '1 day') AT TIME ZONE tz;
 SELECT coalesce(jsonb_agg(jsonb_build_object('employeeId',e.id,
  'active', (SELECT count(*) FROM public.wms_jobs j WHERE j.site_id=p_site_id AND j.country_code=p_country_code
   AND j.assigned_to=e.id::text AND j.status NOT IN ('Completed','Cancelled','Deleted')),
  'completedToday',(SELECT count(*) FROM public.wms_jobs j WHERE j.site_id=p_site_id AND j.country_code=p_country_code
   AND coalesce(nullif(j.completed_by,''),j.assigned_to)=e.id::text AND j.status='Completed'
   AND j.completed_at>=day_start AND j.completed_at<day_end))), '[]'::jsonb) INTO result
 FROM public.employees e WHERE e.id=ANY(p_employee_ids) AND e.site_id=p_site_id;
 RETURN jsonb_build_object('workers',result,'timezone',tz,'day',to_char(now() AT TIME ZONE tz,'YYYY-MM-DD'));
END; $$;
REVOKE ALL ON FUNCTION private.assignment_workloads(uuid,text,uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.assignment_workloads(uuid,text,uuid[]) TO authenticated;
CREATE FUNCTION public.assignment_workloads(p_site_id uuid,p_country_code text,p_employee_ids uuid[]) RETURNS jsonb
LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.assignment_workloads(p_site_id,p_country_code,p_employee_ids); $$;
REVOKE ALL ON FUNCTION public.assignment_workloads(uuid,text,uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.assignment_workloads(uuid,text,uuid[]) TO authenticated;
