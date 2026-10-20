-- Complete the finance support boundary for site records and decision records.

DROP POLICY IF EXISTS ar_invoices_scoped ON public.ar_invoices;
CREATE POLICY ar_invoices_read_finance ON public.ar_invoices FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','treasury_officer','accounts_payable','auditor','procurement_manager')
  AND private.finance_site_scope(site_id, country_code)
);
CREATE POLICY ar_invoices_insert_finance ON public.ar_invoices FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','accounts_payable')
  AND private.finance_site_scope(site_id, country_code)
);
CREATE POLICY ar_invoices_update_finance ON public.ar_invoices FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','accounts_payable')
  AND private.finance_site_scope(site_id, country_code)
)
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','accounts_payable')
  AND private.finance_site_scope(site_id, country_code)
);

DROP POLICY IF EXISTS payroll_runs_read_scoped ON public.payroll_runs;
CREATE POLICY payroll_runs_read_finance ON public.payroll_runs FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','hr_manager','finance_manager','cfo','regional_finance_officer','accountant','auditor')
  AND private.finance_site_scope(site_id, country_code)
);

-- A credit limit covers a country rather than a site. Regional staff have no
-- suitable row key for regional access; HQ accountants can review only.
DROP POLICY IF EXISTS credit_limits_scoped ON public.customer_credit_limits;
CREATE POLICY credit_limits_read_finance ON public.customer_credit_limits FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','credit_controller','accountant')
  AND public.is_country_in_my_authorized_scope(country_code)
  AND (lower(public.get_my_role()) <> 'accountant' OR private.finance_hq_scope(country_code))
);
CREATE POLICY credit_limits_write_finance ON public.customer_credit_limits FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','credit_controller')
  AND public.is_country_in_my_authorized_scope(country_code)
)
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','credit_controller')
  AND public.is_country_in_my_authorized_scope(country_code)
);

-- Expense lists previously relied on is_manager() alone and could cross
-- national boundaries. Draft creation is open to working staff in scope.
DROP POLICY IF EXISTS expenses_read ON public.expenses;
CREATE POLICY expenses_read_finance ON public.expenses FOR SELECT TO authenticated
USING (
  (public.is_manager() OR lower(public.get_my_role()) IN ('cfo','regional_finance_officer','accountant','treasury_officer','auditor'))
  AND private.finance_site_scope(site_id::text, country_code)
);
DROP POLICY IF EXISTS expenses_insert ON public.expenses;
CREATE POLICY expenses_insert_finance ON public.expenses FOR INSERT TO authenticated
WITH CHECK (
  (public.is_manager() OR lower(public.get_my_role()) IN ('cfo','regional_finance_officer','accountant','treasury_officer'))
  AND private.finance_site_scope(site_id::text, country_code)
  AND status = 'Pending'
  AND created_by_id = (SELECT auth.uid())
  AND approved_by_id IS NULL AND approved_at IS NULL
);
DROP POLICY IF EXISTS expenses_update ON public.expenses;
CREATE POLICY expenses_update_lead ON public.expenses FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','regional_manager')
  AND private.finance_site_scope(site_id::text, country_code)
)
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','regional_manager')
  AND private.finance_site_scope(site_id::text, country_code)
);
CREATE POLICY expenses_update_own_draft ON public.expenses FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) IN ('accountant','treasury_officer')
  AND status = 'Pending' AND created_by_id = (SELECT auth.uid())
  AND private.finance_site_scope(site_id::text, country_code)
)
WITH CHECK (
  lower(public.get_my_role()) IN ('accountant','treasury_officer')
  AND status = 'Pending' AND created_by_id = (SELECT auth.uid())
  AND approved_by_id IS NULL AND approved_at IS NULL
  AND private.finance_site_scope(site_id::text, country_code)
);

-- Existing petty cash services issue Approved vouchers on creation. Keep
-- that decision with managers; finance support receives cross-site read only.
DROP POLICY IF EXISTS petty_cash_accounts_scoped ON public.petty_cash_accounts;
CREATE POLICY petty_cash_accounts_read_finance ON public.petty_cash_accounts FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','treasury_officer','store_manager','operations_manager')
  AND private.finance_site_scope(site_id, country_code)
);
CREATE POLICY petty_cash_accounts_write_finance ON public.petty_cash_accounts FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','store_manager','operations_manager')
  AND private.finance_site_scope(site_id, country_code)
)
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','store_manager','operations_manager')
  AND private.finance_site_scope(site_id, country_code)
);
DROP POLICY IF EXISTS petty_cash_replenishments_scoped ON public.petty_cash_replenishments;
CREATE POLICY petty_cash_replenishments_read_finance ON public.petty_cash_replenishments FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','treasury_officer','store_manager','operations_manager')
  AND private.finance_site_scope(site_id, country_code)
);
CREATE POLICY petty_cash_replenishments_write_finance ON public.petty_cash_replenishments FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','store_manager','operations_manager')
  AND private.finance_site_scope(site_id, country_code)
)
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','store_manager','operations_manager')
  AND private.finance_site_scope(site_id, country_code)
);
DROP POLICY IF EXISTS petty_cash_vouchers_scoped ON public.petty_cash_vouchers;
CREATE POLICY petty_cash_vouchers_read_finance ON public.petty_cash_vouchers FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','treasury_officer','store_manager','operations_manager')
  AND private.finance_site_scope(site_id, country_code)
);
CREATE POLICY petty_cash_vouchers_write_finance ON public.petty_cash_vouchers FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','store_manager','operations_manager')
  AND private.finance_site_scope(site_id, country_code)
)
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','store_manager','operations_manager')
  AND private.finance_site_scope(site_id, country_code)
);
