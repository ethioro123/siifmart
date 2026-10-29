BEGIN;
-- Remove legacy permissive policies when restoring the workflow on an existing installation.
DROP POLICY IF EXISTS leave_requests_read ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_insert ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_update ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_read_scoped ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_insert_scoped ON public.leave_requests;
DROP POLICY IF EXISTS leave_requests_update_scoped ON public.leave_requests;
DROP POLICY IF EXISTS leave_own_submit ON public.leave_requests;
CREATE POLICY leave_own_submit ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (
 employee_id=auth.uid() AND requested_by=auth.uid()::text AND status='Pending'
 AND reviewed_by IS NULL AND reviewed_at IS NULL AND reviewed_by_name IS NULL AND reviewed_by_role IS NULL AND rejection_reason IS NULL
 AND public.is_site_in_my_authorized_scope(site_id,country_code));
COMMIT;
