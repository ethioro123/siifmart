-- Restrictive SELECT applies in addition to every permissive policy, including site-wide reads.
CREATE POLICY wms_history_own_completion ON public.wms_jobs AS RESTRICTIVE FOR SELECT TO authenticated
USING (
 status NOT IN ('Completed','Cancelled','Deleted')
 OR public.is_ceo() OR public.is_manager()
 OR (status='Completed' AND completed_by IN(public.get_my_employee_id()::text,auth.uid()::text))
);
