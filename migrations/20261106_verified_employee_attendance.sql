CREATE TABLE public.employee_attendance(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),country_code text NOT NULL,site_id uuid NOT NULL REFERENCES public.sites(id),employee_id uuid NOT NULL REFERENCES public.employees(id),employee_name text NOT NULL,
 date date NOT NULL,clock_in timestamptz NOT NULL DEFAULT now(),clock_out timestamptz,status text NOT NULL CHECK(status IN('Present','Late','Absent','On-Leave')),
 hours_worked numeric NOT NULL DEFAULT 0 CHECK(hours_worked>=0),device_info text,gps_coordinates text,verified_by uuid REFERENCES public.employees(id),notes text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),
 CHECK(clock_out IS NULL OR clock_out>=clock_in),UNIQUE(employee_id,date)
);
CREATE INDEX employee_attendance_site_date ON public.employee_attendance(country_code,site_id,date DESC);
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.employee_attendance FROM anon,authenticated;
GRANT SELECT ON public.employee_attendance TO authenticated;
CREATE POLICY attendance_read ON public.employee_attendance FOR SELECT TO authenticated USING(private.has_active_operational_employee() AND
 (employee_id=auth.uid() OR (public.get_my_role() IN('group_ceo','country_hr_director','regional_hr_manager','hr_generalist','payroll_specialist','store_manager','warehouse_manager') AND private.hr_site_scope(site_id::text,country_code))));
CREATE FUNCTION private.record_employee_attendance(p_employee uuid,p_site uuid,p_country text,p_record uuid DEFAULT NULL) RETURNS public.employee_attendance
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor public.employees%ROWTYPE; e public.employees%ROWTYPE; site public.sites%ROWTYPE; row public.employee_attendance%ROWTYPE; today date; stamp timestamptz:=clock_timestamp();
BEGIN
 SELECT * INTO actor FROM public.employees WHERE id=auth.uid() AND status='Active';
 SELECT * INTO e FROM public.employees WHERE id=p_employee AND status='Active' FOR SHARE;
 SELECT * INTO site FROM public.sites WHERE id=p_site;
 IF actor.id IS NULL OR e.id IS NULL OR e.site_id IS DISTINCT FROM p_site OR site.country IS DISTINCT FROM p_country OR NOT public.is_site_in_my_authorized_scope(p_site::text,p_country)
 OR (actor.id<>e.id AND (actor.role NOT IN('group_ceo','country_hr_director','regional_hr_manager','store_manager','warehouse_manager') OR private.employee_role_rank(actor.role)<=private.employee_role_rank(e.role))) THEN RAISE EXCEPTION 'Authenticated employee or scoped attendance supervisor required' USING ERRCODE='42501'; END IF;
 today:=(stamp AT TIME ZONE CASE p_country WHEN 'ET' THEN 'Africa/Addis_Ababa' WHEN 'KE' THEN 'Africa/Nairobi' ELSE 'UTC' END)::date;
 PERFORM pg_advisory_xact_lock(hashtextextended('attendance:'||p_employee::text,0));
 IF p_record IS NULL THEN
  SELECT * INTO row FROM public.employee_attendance WHERE employee_id=e.id AND date=today FOR UPDATE;
  IF row.id IS NOT NULL THEN RETURN row; END IF;
  INSERT INTO public.employee_attendance(country_code,site_id,employee_id,employee_name,date,clock_in,status,verified_by)
  VALUES(p_country,p_site,e.id,e.name,today,stamp,'Present',actor.id) RETURNING * INTO row;
 ELSE
  SELECT * INTO row FROM public.employee_attendance WHERE id=p_record AND employee_id=e.id AND site_id=p_site AND country_code=p_country FOR UPDATE;
  IF row.id IS NULL THEN RAISE EXCEPTION 'Attendance session unavailable'; END IF;
  IF row.clock_out IS NOT NULL THEN RETURN row; END IF;
  UPDATE public.employee_attendance SET clock_out=stamp,hours_worked=round((extract(epoch FROM stamp-clock_in)/3600)::numeric,2),updated_at=stamp WHERE id=row.id RETURNING * INTO row;
 END IF;
 INSERT INTO public.system_logs(action,module,employee_id,site_id,country_code,entity_id,details) VALUES(CASE WHEN p_record IS NULL THEN 'EMPLOYEE_CLOCK_IN' ELSE 'EMPLOYEE_CLOCK_OUT' END,'HR',actor.id::text,p_site::text,p_country,row.id::text,'Server attendance session recorded');
 RETURN row;
END $$;
REVOKE ALL ON FUNCTION private.record_employee_attendance(uuid,uuid,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION private.record_employee_attendance(uuid,uuid,text,uuid) TO authenticated;
CREATE FUNCTION public.record_employee_attendance(p_employee uuid,p_site uuid,p_country text,p_record uuid DEFAULT NULL) RETURNS public.employee_attendance LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$ SELECT private.record_employee_attendance(p_employee,p_site,p_country,p_record); $$;
REVOKE ALL ON FUNCTION public.record_employee_attendance(uuid,uuid,text,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.record_employee_attendance(uuid,uuid,text,uuid) TO authenticated;
CREATE POLICY employee_change_authorized_preparation ON public.employee_change_requests FOR INSERT TO authenticated WITH CHECK(public.get_my_role() IN('group_ceo','country_managing_director','country_hr_director','regional_hr_manager') AND private.hr_site_scope(site_id,country_code) AND status='pending' AND approved_by IS NULL);
CREATE POLICY employee_change_department_review_read ON public.employee_change_requests FOR SELECT TO authenticated USING(private.has_active_operational_employee() AND private.hr_site_scope(site_id,country_code) AND public.get_my_role() IN('group_ceo','group_cfo','country_managing_director','country_hr_director','regional_hr_manager','country_finance_director','regional_finance_manager','country_operations_director','regional_operations_manager','country_compliance_manager','warehouse_manager','store_manager'));
