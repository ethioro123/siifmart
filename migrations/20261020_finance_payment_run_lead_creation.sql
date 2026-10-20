-- Payment run creation also assigns approved invoices to the run. The
-- current client flow is a lead action until that assignment is transactional.
DROP POLICY IF EXISTS payment_runs_insert_finance ON public.payment_runs;
CREATE POLICY payment_runs_insert_finance ON public.payment_runs FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo')
  AND public.is_country_in_my_authorized_scope(country_code)
  AND status = 'Pending_Approval'
  AND approved_by_id IS NULL AND approved_at IS NULL
);
