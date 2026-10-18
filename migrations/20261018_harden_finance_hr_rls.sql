-- Country/site and role scoping for finance and HR tables.

CREATE OR REPLACE FUNCTION public.is_country_in_my_authorized_scope(p_country_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.employees e
    LEFT JOIN public.sites s ON s.id = e.site_id
    WHERE e.id = auth.uid()
      AND COALESCE(lower(e.status), 'active') = 'active'
      AND (
        lower(e.role) IN ('super_admin','ceo')
        OR upper(s.country) = upper(p_country_code)
      )
  );
$function$;
REVOKE ALL ON FUNCTION public.is_country_in_my_authorized_scope(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_country_in_my_authorized_scope(text) TO authenticated, service_role;

-- Finance records with tenant keys.
DROP POLICY IF EXISTS ar_invoices_all ON public.ar_invoices;
CREATE POLICY ar_invoices_scoped ON public.ar_invoices FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','accountant','accounts_payable','auditor','procurement_manager'])
  AND public.is_site_in_my_authorized_scope(ar_invoices.site_id, ar_invoices.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','accountant','accounts_payable','auditor','procurement_manager'])
  AND public.is_site_in_my_authorized_scope(ar_invoices.site_id, ar_invoices.country_code)
);

DROP POLICY IF EXISTS credit_limits_all ON public.customer_credit_limits;
CREATE POLICY credit_limits_scoped ON public.customer_credit_limits FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','credit_controller','accountant'])
  AND public.is_country_in_my_authorized_scope(customer_credit_limits.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','credit_controller','accountant'])
  AND public.is_country_in_my_authorized_scope(customer_credit_limits.country_code)
);

DROP POLICY IF EXISTS department_budgets_all ON public.department_budgets;
CREATE POLICY department_budgets_scoped ON public.department_budgets FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','department_manager'])
  AND public.is_site_in_my_authorized_scope(department_budgets.site_id, department_budgets.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','department_manager'])
  AND public.is_site_in_my_authorized_scope(department_budgets.site_id, department_budgets.country_code)
);

DROP POLICY IF EXISTS fiscal_periods_all ON public.fiscal_periods;
CREATE POLICY fiscal_periods_scoped ON public.fiscal_periods FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','controller','accountant','auditor'])
  AND public.is_country_in_my_authorized_scope(fiscal_periods.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','controller','accountant','auditor'])
  AND public.is_country_in_my_authorized_scope(fiscal_periods.country_code)
);

DROP POLICY IF EXISTS journal_entries_read ON public.journal_entries;
CREATE POLICY journal_entries_read_scoped ON public.journal_entries FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','controller','accountant','auditor'])
  AND public.is_site_in_my_authorized_scope(journal_entries.site_id, journal_entries.country_code)
);
DROP POLICY IF EXISTS journal_entries_insert ON public.journal_entries;
CREATE POLICY journal_entries_insert_scoped ON public.journal_entries FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','finance_manager','cfo','controller','accountant'])
  AND public.is_site_in_my_authorized_scope(journal_entries.site_id, journal_entries.country_code)
);
DROP POLICY IF EXISTS journal_entries_update ON public.journal_entries;
CREATE POLICY journal_entries_update_scoped ON public.journal_entries FOR UPDATE TO authenticated
USING (
  NOT journal_entries.is_posted
  AND lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','finance_manager','cfo','controller','accountant'])
  AND public.is_site_in_my_authorized_scope(journal_entries.site_id, journal_entries.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','finance_manager','cfo','controller','accountant'])
  AND public.is_site_in_my_authorized_scope(journal_entries.site_id, journal_entries.country_code)
);
DROP POLICY IF EXISTS journal_entries_delete ON public.journal_entries;

DROP POLICY IF EXISTS petty_cash_accounts_all ON public.petty_cash_accounts;
CREATE POLICY petty_cash_accounts_scoped ON public.petty_cash_accounts FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','accountant','store_manager','operations_manager'])
  AND public.is_site_in_my_authorized_scope(petty_cash_accounts.site_id, petty_cash_accounts.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','accountant','store_manager','operations_manager'])
  AND public.is_site_in_my_authorized_scope(petty_cash_accounts.site_id, petty_cash_accounts.country_code)
);
DROP POLICY IF EXISTS petty_cash_replenishments_all ON public.petty_cash_replenishments;
CREATE POLICY petty_cash_replenishments_scoped ON public.petty_cash_replenishments FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','accountant','store_manager','operations_manager'])
  AND public.is_site_in_my_authorized_scope(petty_cash_replenishments.site_id, petty_cash_replenishments.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','accountant','store_manager','operations_manager'])
  AND public.is_site_in_my_authorized_scope(petty_cash_replenishments.site_id, petty_cash_replenishments.country_code)
);
DROP POLICY IF EXISTS petty_cash_vouchers_all ON public.petty_cash_vouchers;
CREATE POLICY petty_cash_vouchers_scoped ON public.petty_cash_vouchers FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','accountant','store_manager','operations_manager'])
  AND public.is_site_in_my_authorized_scope(petty_cash_vouchers.site_id, petty_cash_vouchers.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','accountant','store_manager','operations_manager'])
  AND public.is_site_in_my_authorized_scope(petty_cash_vouchers.site_id, petty_cash_vouchers.country_code)
);

DROP POLICY IF EXISTS tender_reconciliations_all ON public.tender_reconciliations;
CREATE POLICY tender_reconciliations_scoped ON public.tender_reconciliations FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','accountant','auditor'])
  AND public.is_site_in_my_authorized_scope(tender_reconciliations.site_id, tender_reconciliations.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','accountant','auditor'])
  AND public.is_site_in_my_authorized_scope(tender_reconciliations.site_id, tender_reconciliations.country_code)
);

DROP POLICY IF EXISTS payroll_runs_read ON public.payroll_runs;
CREATE POLICY payroll_runs_read_scoped ON public.payroll_runs FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','finance_manager','cfo','accountant','auditor'])
  AND public.is_site_in_my_authorized_scope(payroll_runs.site_id, payroll_runs.country_code)
);

-- HR records and employee change workflows.
DROP POLICY IF EXISTS disciplinary_read ON public.disciplinary_records;
CREATE POLICY disciplinary_read_scoped ON public.disciplinary_records FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
  AND public.is_site_in_my_authorized_scope(disciplinary_records.site_id, disciplinary_records.country_code)
);
DROP POLICY IF EXISTS disciplinary_insert ON public.disciplinary_records;
CREATE POLICY disciplinary_insert_scoped ON public.disciplinary_records FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
  AND public.is_site_in_my_authorized_scope(disciplinary_records.site_id, disciplinary_records.country_code)
);
DROP POLICY IF EXISTS disciplinary_update ON public.disciplinary_records;
CREATE POLICY disciplinary_update_scoped ON public.disciplinary_records FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
  AND public.is_site_in_my_authorized_scope(disciplinary_records.site_id, disciplinary_records.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
  AND public.is_site_in_my_authorized_scope(disciplinary_records.site_id, disciplinary_records.country_code)
);
DROP POLICY IF EXISTS disciplinary_delete ON public.disciplinary_records;

DROP POLICY IF EXISTS employee_change_requests_read ON public.employee_change_requests;
CREATE POLICY employee_change_requests_read_scoped ON public.employee_change_requests FOR SELECT TO authenticated
USING (
  (employee_change_requests.employee_id = auth.uid()
   OR lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer']))
  AND public.is_site_in_my_authorized_scope(employee_change_requests.site_id, employee_change_requests.country_code)
);
DROP POLICY IF EXISTS employee_change_requests_insert ON public.employee_change_requests;
CREATE POLICY employee_change_requests_insert_scoped ON public.employee_change_requests FOR INSERT TO authenticated
WITH CHECK (
  employee_change_requests.employee_id = auth.uid()
  AND public.is_site_in_my_authorized_scope(employee_change_requests.site_id, employee_change_requests.country_code)
);
DROP POLICY IF EXISTS employee_change_requests_update ON public.employee_change_requests;
CREATE POLICY employee_change_requests_update_scoped ON public.employee_change_requests FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
  AND public.is_site_in_my_authorized_scope(employee_change_requests.site_id, employee_change_requests.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
  AND public.is_site_in_my_authorized_scope(employee_change_requests.site_id, employee_change_requests.country_code)
);

DROP POLICY IF EXISTS "Allow authenticated read facility_headcount_quotas" ON public.facility_headcount_quotas;
CREATE POLICY facility_headcount_quotas_read_scoped ON public.facility_headcount_quotas FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer','operations_manager'])
  AND public.is_site_in_my_authorized_scope(facility_headcount_quotas.site_id, facility_headcount_quotas.country_code)
);

DROP POLICY IF EXISTS "Allow authenticated insert on headcount_quota_requests" ON public.headcount_quota_requests;
DROP POLICY IF EXISTS "Allow authenticated read on headcount_quota_requests" ON public.headcount_quota_requests;
DROP POLICY IF EXISTS "Allow authenticated update on headcount_quota_requests" ON public.headcount_quota_requests;
CREATE POLICY headcount_quota_requests_scoped ON public.headcount_quota_requests FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer','operations_manager','regional_manager'])
  AND public.is_site_in_my_authorized_scope(headcount_quota_requests.site_id, headcount_quota_requests.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer','operations_manager','regional_manager'])
  AND public.is_site_in_my_authorized_scope(headcount_quota_requests.site_id, headcount_quota_requests.country_code)
);

DROP POLICY IF EXISTS hr_policies_read ON public.hr_country_policies;
CREATE POLICY hr_policies_read_scoped ON public.hr_country_policies FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
  AND public.is_country_in_my_authorized_scope(hr_country_policies.country_code)
);
DROP POLICY IF EXISTS hr_policies_insert ON public.hr_country_policies;
CREATE POLICY hr_policies_insert_scoped ON public.hr_country_policies FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager'])
  AND public.is_country_in_my_authorized_scope(hr_country_policies.country_code)
);
DROP POLICY IF EXISTS hr_policies_update ON public.hr_country_policies;
CREATE POLICY hr_policies_update_scoped ON public.hr_country_policies FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager'])
  AND public.is_country_in_my_authorized_scope(hr_country_policies.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager'])
  AND public.is_country_in_my_authorized_scope(hr_country_policies.country_code)
);
DROP POLICY IF EXISTS hr_policies_delete ON public.hr_country_policies;

DROP POLICY IF EXISTS salary_requests_read ON public.salary_requests;
CREATE POLICY salary_requests_read_scoped ON public.salary_requests FOR SELECT TO authenticated
USING (
  salary_requests.employee_id = auth.uid()
  OR (
    lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','finance_manager','cfo','regional_hr_officer','regional_finance_officer'])
    AND public.is_site_in_my_authorized_scope(salary_requests.site_id, salary_requests.country_code)
  )
);
DROP POLICY IF EXISTS salary_requests_insert ON public.salary_requests;
CREATE POLICY salary_requests_insert_scoped ON public.salary_requests FOR INSERT TO authenticated
WITH CHECK (
  salary_requests.employee_id = auth.uid()
  AND salary_requests.status IN ('Pending','Draft')
  AND public.is_site_in_my_authorized_scope(salary_requests.site_id, salary_requests.country_code)
);
DROP POLICY IF EXISTS salary_requests_update ON public.salary_requests;
CREATE POLICY salary_requests_update_scoped ON public.salary_requests FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','finance_manager','cfo','regional_hr_officer','regional_finance_officer'])
  AND public.is_site_in_my_authorized_scope(salary_requests.site_id, salary_requests.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','finance_manager','cfo','regional_hr_officer','regional_finance_officer'])
  AND public.is_site_in_my_authorized_scope(salary_requests.site_id, salary_requests.country_code)
);
