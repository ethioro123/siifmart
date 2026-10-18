-- Restrict staging leave request rows to the employee and authorized local HR.

DROP POLICY IF EXISTS leave_requests_read ON public.leave_requests;
CREATE POLICY leave_requests_read_scoped ON public.leave_requests FOR SELECT TO authenticated
USING (
  leave_requests.employee_id = auth.uid()
  OR (
    lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
    AND public.is_site_in_my_authorized_scope(leave_requests.site_id, leave_requests.country_code)
  )
);

DROP POLICY IF EXISTS leave_requests_insert ON public.leave_requests;
CREATE POLICY leave_requests_insert_scoped ON public.leave_requests FOR INSERT TO authenticated
WITH CHECK (
  leave_requests.employee_id = auth.uid()
  AND lower(COALESCE(leave_requests.status,'')) IN ('pending','draft')
  AND public.is_site_in_my_authorized_scope(leave_requests.site_id, leave_requests.country_code)
);

DROP POLICY IF EXISTS leave_requests_update ON public.leave_requests;
CREATE POLICY leave_requests_update_scoped ON public.leave_requests FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
  AND public.is_site_in_my_authorized_scope(leave_requests.site_id, leave_requests.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
  AND public.is_site_in_my_authorized_scope(leave_requests.site_id, leave_requests.country_code)
);
