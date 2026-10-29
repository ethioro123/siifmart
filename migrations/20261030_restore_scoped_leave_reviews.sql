BEGIN;
CREATE TABLE IF NOT EXISTS public.leave_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), country_code varchar(10) NOT NULL,
 site_id text NOT NULL, employee_id uuid NOT NULL REFERENCES public.employees(id), employee_name text NOT NULL,
 leave_type text NOT NULL, start_date date NOT NULL, end_date date NOT NULL, days numeric NOT NULL CHECK(days>0),
 reason text NOT NULL, status text NOT NULL DEFAULT 'Pending' CHECK(status IN ('Pending','Approved','Rejected','Cancelled')),
 requested_by text NOT NULL, requested_at timestamptz NOT NULL DEFAULT now(),
 reviewed_by text, reviewed_by_name text, reviewed_by_role text, reviewed_at timestamptz, rejection_reason text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(end_date>=start_date)
);
CREATE INDEX IF NOT EXISTS leave_review_scope ON public.leave_requests(country_code,site_id,status,requested_at,id);
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.leave_requests FROM anon;
GRANT SELECT,INSERT,UPDATE ON public.leave_requests TO authenticated;
CREATE POLICY leave_scoped_read ON public.leave_requests FOR SELECT TO authenticated USING (
 employee_id=auth.uid() OR (public.normalize_role(public.get_my_role()) IN ('group_ceo','country_managing_director','country_hr_director','hr_generalist','regional_hr_manager','country_operations_director','regional_operations_manager','area_operations_manager','store_manager','warehouse_manager')
 AND public.is_site_in_my_authorized_scope(site_id,country_code)));
CREATE POLICY leave_own_submit ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (
 employee_id=auth.uid() AND requested_by=auth.uid()::text AND status='Pending' AND reviewed_by IS NULL AND reviewed_at IS NULL
 AND public.is_site_in_my_authorized_scope(site_id,country_code));
CREATE POLICY leave_reviewer_update ON public.leave_requests FOR UPDATE TO authenticated USING (
 public.normalize_role(public.get_my_role()) IN ('group_ceo','country_managing_director','country_hr_director','hr_generalist','regional_hr_manager','country_operations_director','regional_operations_manager','area_operations_manager','store_manager','warehouse_manager')
 AND employee_id<>auth.uid() AND requested_by<>auth.uid()::text AND public.is_site_in_my_authorized_scope(site_id,country_code)) WITH CHECK(public.is_site_in_my_authorized_scope(site_id,country_code));
CREATE OR REPLACE FUNCTION public.guard_leave_review() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=public,pg_temp AS $$
BEGIN
 IF auth.uid() IS NULL OR OLD.status<>'Pending' OR NEW.status NOT IN ('Approved','Rejected') THEN RAISE EXCEPTION 'Pending leave review required'; END IF;
 IF (NEW.id,NEW.country_code,NEW.site_id,NEW.employee_id,NEW.requested_by,NEW.start_date,NEW.end_date,NEW.days,NEW.reason,NEW.leave_type,NEW.employee_name,NEW.requested_at,NEW.created_at)
 IS DISTINCT FROM (OLD.id,OLD.country_code,OLD.site_id,OLD.employee_id,OLD.requested_by,OLD.start_date,OLD.end_date,OLD.days,OLD.reason,OLD.leave_type,OLD.employee_name,OLD.requested_at,OLD.created_at) THEN RAISE EXCEPTION 'Leave evidence is immutable during review'; END IF;
 IF OLD.employee_id=auth.uid() OR OLD.requested_by=auth.uid()::text THEN RAISE EXCEPTION 'Independent leave reviewer required'; END IF;
 IF NEW.status='Rejected' AND nullif(trim(NEW.rejection_reason),'') IS NULL THEN RAISE EXCEPTION 'Rejection reason required'; END IF;
 NEW.reviewed_by:=auth.uid()::text; NEW.reviewed_by_role:=public.get_my_role();
 SELECT name INTO NEW.reviewed_by_name FROM public.employees WHERE id=auth.uid();
 NEW.reviewed_at:=now(); NEW.updated_at:=now();
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_leave_review() FROM PUBLIC;
CREATE TRIGGER leave_review_guard BEFORE UPDATE ON public.leave_requests FOR EACH ROW EXECUTE FUNCTION public.guard_leave_review();
COMMIT;
