-- Finance support staff at an Administration office work across its country or region.
-- Other roles retain the existing site authorization rules.
CREATE OR REPLACE FUNCTION private.finance_site_scope(p_site_id text, p_country_code text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT public.is_site_in_my_authorized_scope(p_site_id, p_country_code)
    OR EXISTS (
      SELECT 1
      FROM public.employees actor
      JOIN public.sites home ON home.id = actor.site_id
      JOIN public.sites target ON target.id::text = p_site_id OR target.code = p_site_id
      WHERE actor.id = (SELECT auth.uid())
        AND COALESCE(lower(actor.status), 'active') = 'active'
        AND lower(actor.role) IN ('accountant', 'treasury_officer', 'cfo', 'controller')
        AND home.type = 'Administration'
        AND upper(home.country) = upper(target.country)
        AND upper(p_country_code) = upper(target.country)
        AND (
          (home.code = upper(home.country) || '-HQ'
            AND home.region_code IS NULL AND actor.region_code IS NULL)
          OR (home.region_code IS NOT NULL
            AND actor.region_code = home.region_code
            AND target.region_code = home.region_code)
        )
    );
$function$;
REVOKE ALL ON FUNCTION private.finance_site_scope(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.finance_site_scope(text, text) TO authenticated, service_role;

-- Invoices may be prepared by support staff; only finance leadership may approve.
DROP POLICY IF EXISTS vendor_invoices_scoped ON public.vendor_invoices;
CREATE POLICY vendor_invoices_read_finance ON public.vendor_invoices FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','treasury_officer','procurement_manager','vendor_relations_manager')
  AND private.finance_site_scope(site_id, country_code)
);
CREATE POLICY vendor_invoices_insert_finance ON public.vendor_invoices FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','treasury_officer','procurement_manager','vendor_relations_manager')
  AND private.finance_site_scope(site_id, country_code)
  AND (lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer')
    OR (status IN ('Draft','Pending_Approval') AND approved_by_id IS NULL AND approved_at IS NULL))
);
CREATE POLICY vendor_invoices_update_finance ON public.vendor_invoices FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','treasury_officer','procurement_manager','vendor_relations_manager')
  AND private.finance_site_scope(site_id, country_code)
  AND (lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer')
    OR status IN ('Draft','Pending_Approval'))
)
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','treasury_officer','procurement_manager','vendor_relations_manager')
  AND private.finance_site_scope(site_id, country_code)
  AND (lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer')
    OR (status IN ('Draft','Pending_Approval') AND approved_by_id IS NULL AND approved_at IS NULL))
);

DROP POLICY IF EXISTS tender_reconciliations_scoped ON public.tender_reconciliations;
CREATE POLICY tender_reconciliations_read_finance ON public.tender_reconciliations FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','treasury_officer','auditor')
  AND private.finance_site_scope(site_id, country_code)
);
CREATE POLICY tender_reconciliations_insert_finance ON public.tender_reconciliations FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','treasury_officer')
  AND private.finance_site_scope(site_id, country_code)
);
CREATE POLICY tender_reconciliations_update_finance ON public.tender_reconciliations FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','treasury_officer')
  AND private.finance_site_scope(site_id, country_code)
)
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','treasury_officer')
  AND private.finance_site_scope(site_id, country_code)
);

-- Budget amounts already carry an approver. Support staff may review them,
-- while the existing budget writer remains a leadership operation.
DROP POLICY IF EXISTS department_budgets_scoped ON public.department_budgets;
CREATE POLICY department_budgets_read_finance ON public.department_budgets FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','accountant','treasury_officer','department_manager')
  AND private.finance_site_scope(site_id, country_code)
);
CREATE POLICY department_budgets_insert_finance ON public.department_budgets FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer')
  AND private.finance_site_scope(site_id, country_code)
);
CREATE POLICY department_budgets_update_finance ON public.department_budgets FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer')
  AND private.finance_site_scope(site_id, country_code)
)
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer')
  AND private.finance_site_scope(site_id, country_code)
);

-- The fiscal calendar and chart are national data. Staff can read; leads edit.
DROP POLICY IF EXISTS fiscal_periods_scoped ON public.fiscal_periods;
CREATE POLICY fiscal_periods_read_finance ON public.fiscal_periods FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','controller','accountant','treasury_officer','auditor')
  AND public.is_country_in_my_authorized_scope(country_code)
);
CREATE POLICY fiscal_periods_write_finance ON public.fiscal_periods FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','controller')
  AND public.is_country_in_my_authorized_scope(country_code)
)
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','controller')
  AND public.is_country_in_my_authorized_scope(country_code)
);

DROP POLICY IF EXISTS chart_of_accounts_scoped ON public.chart_of_accounts;
CREATE POLICY chart_of_accounts_read_finance ON public.chart_of_accounts FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','regional_finance_officer','controller','accountant','treasury_officer','auditor')
  AND public.is_country_in_my_authorized_scope(country_code)
);
CREATE POLICY chart_of_accounts_write_finance ON public.chart_of_accounts FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','controller')
  AND public.is_country_in_my_authorized_scope(country_code)
)
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','controller')
  AND public.is_country_in_my_authorized_scope(country_code)
);

CREATE OR REPLACE FUNCTION private.finance_hq_scope(p_country_code text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.employees actor
    JOIN public.sites home ON home.id = actor.site_id
    WHERE actor.id = (SELECT auth.uid())
      AND COALESCE(lower(actor.status), 'active') = 'active'
      AND lower(actor.role) IN ('accountant','treasury_officer')
      AND home.type = 'Administration'
      AND home.code = upper(home.country) || '-HQ'
      AND home.region_code IS NULL AND actor.region_code IS NULL
      AND upper(home.country) = upper(p_country_code)
  );
$function$;
REVOKE ALL ON FUNCTION private.finance_hq_scope(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.finance_hq_scope(text) TO authenticated, service_role;

-- Payment runs are country-wide: only HQ finance support may prepare them.
DROP POLICY IF EXISTS payment_runs_select ON public.payment_runs;
CREATE POLICY payment_runs_read_finance ON public.payment_runs FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','accountant','treasury_officer','auditor')
  AND public.is_country_in_my_authorized_scope(country_code)
  AND (lower(public.get_my_role()) NOT IN ('accountant','treasury_officer')
    OR private.finance_hq_scope(country_code))
);
DROP POLICY IF EXISTS payment_runs_insert ON public.payment_runs;
CREATE POLICY payment_runs_insert_finance ON public.payment_runs FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo','accountant','treasury_officer')
  AND public.is_country_in_my_authorized_scope(country_code)
  AND (lower(public.get_my_role()) NOT IN ('accountant','treasury_officer')
    OR (private.finance_hq_scope(country_code) AND status = 'Pending_Approval'
      AND approved_by_id IS NULL AND approved_at IS NULL))
);
DROP POLICY IF EXISTS payment_runs_update ON public.payment_runs;
CREATE POLICY payment_runs_update_finance ON public.payment_runs FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo')
  AND public.is_country_in_my_authorized_scope(country_code)
)
WITH CHECK (
  lower(public.get_my_role()) IN ('super_admin','ceo','admin','finance_manager','cfo')
  AND public.is_country_in_my_authorized_scope(country_code)
);
DROP POLICY IF EXISTS payment_runs_delete ON public.payment_runs;
