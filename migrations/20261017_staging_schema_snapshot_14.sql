-- Staging security and access snapshot, part 14 of 16.
SET search_path = public, extensions, auth;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated, service_role;
ALTER TABLE public."agent_deposits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."agents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ar_invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."barcode_approvals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."brainstorm_nodes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."category_zones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."chart_of_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."currencies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."customer_credit_limits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."customs_declarations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."deliveries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."department_budgets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."disciplinary_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."discount_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."discrepancy_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."discrepancy_resolutions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."drivers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."employee_change_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."employee_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."employee_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."facility_headcount_quotas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."farmer_programs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."fiscal_periods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."headcount_quota_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."hr_country_policies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."inbound_qc_inspections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."inventory_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."invoice_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."job_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."job_candidates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."job_requisitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."journal_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."journal_lines" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."logistics_zones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."margin_approval_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."mobile_money_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."payment_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."payroll_runs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."performance_reviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."petty_cash_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."petty_cash_replenishments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."petty_cash_vouchers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."po_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."points_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pos_cash_drops" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pos_supervisory_overrides" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pricing_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."product_master" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ratings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."regional_delegation_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."regions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."salary_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."sale_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."sales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."shifts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."site_replenishment_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."sites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."sku_counters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."staff_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."stock_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."store_operations_audits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."store_points" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."supported_languages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."system_config" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."system_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."tender_reconciliations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."training_records" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."trips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_contracts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_scorecards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."wallet_ledger_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."wallets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."warehouse_zones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."wms_job_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."wms_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."worker_points" ENABLE ROW LEVEL SECURITY;
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated, service_role;
CREATE POLICY "agent_deposits_select" ON public."agent_deposits" AS permissive FOR SELECT TO authenticated
  USING ((((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text) OR (user_id = ( SELECT users.id
   FROM users
  WHERE (users.auth_id = ( SELECT auth.uid() AS uid)))) OR (EXISTS ( SELECT 1
   FROM (agents a
     JOIN users u ON ((u.id = agent_deposits.user_id)))
  WHERE ((a.id = agent_deposits.agent_id) AND (u.auth_id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "Service role manages agents" ON public."agents" AS permissive FOR ALL TO authenticated
  USING (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text))
  WITH CHECK (((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text));
CREATE POLICY "ar_invoices_all" ON public."ar_invoices" AS permissive FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "barcode_approvals_country_isolation_select" ON public."barcode_approvals" AS permissive FOR SELECT TO authenticated
  USING (((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text])) OR ((site_id)::text IN ( SELECT (sites.id)::text AS id
   FROM sites
  WHERE (((sites.country)::text = (( SELECT auth.jwt() AS jwt) ->> 'country_code'::text)) OR ((( SELECT auth.jwt() AS jwt) ->> 'country_code'::text) IS NULL))))));
CREATE POLICY "barcode_approvals_delete" ON public."barcode_approvals" AS permissive FOR DELETE TO authenticated
  USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "barcode_approvals_insert" ON public."barcode_approvals" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "barcode_approvals_update" ON public."barcode_approvals" AS permissive FOR UPDATE TO authenticated
  USING (( SELECT is_manager() AS is_manager));
CREATE POLICY "brainstorm_ceo_only" ON public."brainstorm_nodes" AS permissive FOR ALL TO authenticated
  USING (( SELECT is_ceo() AS is_ceo))
  WITH CHECK (( SELECT is_ceo() AS is_ceo));
CREATE POLICY "Enable delete for authenticated users" ON public."category_zones" AS permissive FOR DELETE TO authenticated
  USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public."category_zones" AS permissive FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Enable read access for all authenticated users" ON public."category_zones" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Enable update for authenticated users" ON public."category_zones" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "coa_delete" ON public."chart_of_accounts" AS permissive FOR DELETE TO authenticated
  USING (true);
CREATE POLICY "coa_insert" ON public."chart_of_accounts" AS permissive FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "coa_read" ON public."chart_of_accounts" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "coa_update" ON public."chart_of_accounts" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Allow public read on currencies" ON public."currencies" AS permissive FOR SELECT TO PUBLIC
  USING (true);
CREATE POLICY "credit_limits_all" ON public."customer_credit_limits" AS permissive FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "customers_delete" ON public."customers" AS permissive FOR DELETE TO authenticated
  USING (( SELECT is_manager() AS is_manager));
CREATE POLICY "customers_insert" ON public."customers" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "customers_read" ON public."customers" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "customers_update" ON public."customers" AS permissive FOR UPDATE TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "customs_declarations_update" ON public."customs_declarations" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "customs_insert" ON public."customs_declarations" AS permissive FOR INSERT TO authenticated
  WITH CHECK (((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'customs_import_specialist'::text, 'procurement_manager'::text, 'supply_chain_manager'::text])) OR (EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = ( SELECT auth.uid() AS uid)) AND ((e.role)::text = ANY (ARRAY['super_admin'::text, 'customs_import_specialist'::text, 'procurement_manager'::text, 'supply_chain_manager'::text])))))));
CREATE POLICY "customs_select" ON public."customs_declarations" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "customs_update" ON public."customs_declarations" AS permissive FOR UPDATE TO authenticated
  USING ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'customs_import_specialist'::text, 'procurement_manager'::text, 'supply_chain_manager'::text])));
CREATE POLICY "Users can read own deliveries" ON public."deliveries" AS permissive FOR SELECT TO authenticated
  USING ((trip_id IN ( SELECT t.id
   FROM (trips t
     JOIN users u ON ((u.id = t.rider_id)))
  WHERE (u.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "department_budgets_all" ON public."department_budgets" AS permissive FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "disciplinary_delete" ON public."disciplinary_records" AS permissive FOR DELETE TO authenticated
  USING (true);
CREATE POLICY "disciplinary_insert" ON public."disciplinary_records" AS permissive FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "disciplinary_read" ON public."disciplinary_records" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "disciplinary_update" ON public."disciplinary_records" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "discount_codes_delete_policy" ON public."discount_codes" AS permissive FOR DELETE TO authenticated
  USING ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'CEO'::text])));
CREATE POLICY "discount_codes_insert_policy" ON public."discount_codes" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'CEO'::text, 'finance_manager'::text, 'operations_manager'::text])));
CREATE POLICY "discount_codes_select_policy" ON public."discount_codes" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "discount_codes_update_policy" ON public."discount_codes" AS permissive FOR UPDATE TO authenticated
  USING ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'CEO'::text, 'finance_manager'::text, 'operations_manager'::text])))
  WITH CHECK ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'admin'::text, 'CEO'::text, 'finance_manager'::text, 'operations_manager'::text])));
CREATE POLICY "discrepancy_claims_delete" ON public."discrepancy_claims" AS permissive FOR DELETE TO authenticated
  USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "discrepancy_claims_insert" ON public."discrepancy_claims" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "discrepancy_claims_read" ON public."discrepancy_claims" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "discrepancy_claims_update" ON public."discrepancy_claims" AS permissive FOR UPDATE TO authenticated
  USING (( SELECT is_manager() AS is_manager));
CREATE POLICY "discrepancy_resolutions_delete" ON public."discrepancy_resolutions" AS permissive FOR DELETE TO authenticated
  USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "discrepancy_resolutions_insert" ON public."discrepancy_resolutions" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "discrepancy_resolutions_read" ON public."discrepancy_resolutions" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "discrepancy_resolutions_update" ON public."discrepancy_resolutions" AS permissive FOR UPDATE TO authenticated
  USING (( SELECT is_manager() AS is_manager));
CREATE POLICY "Drivers read self" ON public."drivers" AS permissive FOR SELECT TO authenticated
  USING ((user_id = ( SELECT users.id
   FROM users
  WHERE (users.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "Drivers update self" ON public."drivers" AS permissive FOR UPDATE TO authenticated
  USING ((user_id = ( SELECT users.id
   FROM users
  WHERE (users.auth_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((user_id = ( SELECT users.id
   FROM users
  WHERE (users.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "employee_change_requests_insert" ON public."employee_change_requests" AS permissive FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "employee_change_requests_read" ON public."employee_change_requests" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "employee_change_requests_update" ON public."employee_change_requests" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "employee_docs_delete" ON public."employee_documents" AS permissive FOR DELETE TO authenticated
  USING ((get_my_role() = ANY (ARRAY['super_admin'::text, 'admin'::text, 'CEO'::text, 'hr_manager'::text])));
CREATE POLICY "employee_docs_insert" ON public."employee_documents" AS permissive FOR INSERT TO authenticated
  WITH CHECK (((get_my_role() = ANY (ARRAY['super_admin'::text, 'admin'::text, 'CEO'::text, 'hr_manager'::text, 'hr'::text])) OR ((get_my_role() = ANY (ARRAY['regional_manager'::text, 'regional_hr_officer'::text])) AND (EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = employee_documents.employee_id) AND ((e.region_code = get_my_region_code()) OR (e.site_id IN ( SELECT sites.id
           FROM sites
          WHERE (sites.region_code = get_my_region_code())))))))) OR (is_manager() AND (EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = employee_documents.employee_id) AND (e.site_id = get_my_site_id()))))) OR (employee_id = auth.uid())));
CREATE POLICY "employee_docs_read" ON public."employee_documents" AS permissive FOR SELECT TO authenticated
  USING (((get_my_role() = ANY (ARRAY['super_admin'::text, 'admin'::text, 'CEO'::text, 'hr_manager'::text, 'hr'::text, 'operations_manager'::text, 'auditor'::text])) OR ((get_my_role() = ANY (ARRAY['regional_manager'::text, 'regional_hr_officer'::text])) AND (EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = employee_documents.employee_id) AND ((e.region_code = get_my_region_code()) OR (e.site_id IN ( SELECT sites.id
           FROM sites
          WHERE (sites.region_code = get_my_region_code())))))))) OR (is_manager() AND (EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = employee_documents.employee_id) AND (e.site_id = get_my_site_id()))))) OR (employee_id = auth.uid())));
CREATE POLICY "employee_docs_update" ON public."employee_documents" AS permissive FOR UPDATE TO authenticated
  USING (((get_my_role() = ANY (ARRAY['super_admin'::text, 'admin'::text, 'CEO'::text, 'hr_manager'::text, 'hr'::text])) OR ((get_my_role() = ANY (ARRAY['regional_manager'::text, 'regional_hr_officer'::text])) AND (EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = employee_documents.employee_id) AND ((e.region_code = get_my_region_code()) OR (e.site_id IN ( SELECT sites.id
           FROM sites
          WHERE (sites.region_code = get_my_region_code()))))))))));
CREATE POLICY "employee_tasks_delete" ON public."employee_tasks" AS permissive FOR DELETE TO authenticated
  USING (( SELECT is_manager() AS is_manager));
CREATE POLICY "employee_tasks_insert" ON public."employee_tasks" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "employee_tasks_read" ON public."employee_tasks" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "employee_tasks_update" ON public."employee_tasks" AS permissive FOR UPDATE TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "employees_delete" ON public."employees" AS permissive FOR DELETE TO authenticated
  USING ((is_ceo() OR (get_my_role() = ANY (ARRAY['super_admin'::text, 'admin'::text, 'hr_manager'::text]))));
CREATE POLICY "employees_insert" ON public."employees" AS permissive FOR INSERT TO authenticated
  WITH CHECK (((get_my_role() = ANY (ARRAY['super_admin'::text, 'admin'::text, 'CEO'::text, 'hr_manager'::text, 'hr'::text])) OR ((get_my_role() = ANY (ARRAY['regional_manager'::text, 'regional_hr_officer'::text])) AND ((site_id IN ( SELECT sites.id
   FROM sites
  WHERE (sites.region_code = get_my_region_code()))) OR (region_code = get_my_region_code())) AND ((role)::text <> ALL ((ARRAY['super_admin'::character varying, 'admin'::character varying, 'CEO'::character varying, 'regional_manager'::character varying, 'operations_manager'::character varying, 'finance_manager'::character varying, 'hr_manager'::character varying])::text[]))) OR (is_manager() AND ((site_id = get_my_site_id()) OR (get_my_site_id() IS NULL)) AND ((role)::text <> ALL ((ARRAY['super_admin'::character varying, 'admin'::character varying, 'CEO'::character varying, 'regional_manager'::character varying, 'regional_hr_officer'::character varying, 'operations_manager'::character varying, 'finance_manager'::character varying, 'hr_manager'::character varying])::text[])))));
CREATE POLICY "employees_read" ON public."employees" AS permissive FOR SELECT TO authenticated
  USING (((get_my_scope_level() = 'HQ'::text) OR (get_my_role() = ANY (ARRAY['super_admin'::text, 'admin'::text, 'CEO'::text, 'hr_manager'::text, 'hr'::text, 'operations_manager'::text, 'finance_manager'::text, 'auditor'::text])) OR ((get_my_role() = ANY (ARRAY['regional_manager'::text, 'regional_hr_officer'::text, 'regional_procurement_lead'::text, 'regional_finance_officer'::text, 'regional_logistics_lead'::text, 'regional_security_supervisor'::text])) AND ((region_code = get_my_region_code()) OR (site_id IN ( SELECT sites.id
   FROM sites
  WHERE (sites.region_code = get_my_region_code()))))) OR (site_id = get_my_site_id()) OR (id = auth.uid()) OR (lower((email)::text) = lower((auth.jwt() ->> 'email'::text)))));
CREATE POLICY "employees_update" ON public."employees" AS permissive FOR UPDATE TO authenticated
  USING (((get_my_role() = ANY (ARRAY['super_admin'::text, 'admin'::text, 'CEO'::text, 'hr_manager'::text, 'hr'::text])) OR ((get_my_role() = ANY (ARRAY['regional_manager'::text, 'regional_hr_officer'::text])) AND ((region_code = get_my_region_code()) OR (site_id IN ( SELECT sites.id
   FROM sites
  WHERE (sites.region_code = get_my_region_code())))) AND ((role)::text <> ALL ((ARRAY['super_admin'::character varying, 'admin'::character varying, 'CEO'::character varying, 'regional_manager'::character varying, 'operations_manager'::character varying, 'finance_manager'::character varying, 'hr_manager'::character varying])::text[]))) OR (is_manager() AND (site_id = get_my_site_id()) AND ((role)::text <> ALL ((ARRAY['super_admin'::character varying, 'admin'::character varying, 'CEO'::character varying, 'regional_manager'::character varying, 'regional_hr_officer'::character varying, 'operations_manager'::character varying, 'finance_manager'::character varying, 'hr_manager'::character varying])::text[]))) OR (id = auth.uid()) OR (lower((email)::text) = lower((auth.jwt() ->> 'email'::text)))));
CREATE POLICY "expenses_insert" ON public."expenses" AS permissive FOR INSERT TO authenticated
  WITH CHECK (( SELECT is_manager() AS is_manager));
CREATE POLICY "expenses_no_delete" ON public."expenses" AS permissive FOR DELETE TO authenticated
  USING (false);
CREATE POLICY "expenses_read" ON public."expenses" AS permissive FOR SELECT TO authenticated
  USING (( SELECT is_manager() AS is_manager));
CREATE POLICY "expenses_update" ON public."expenses" AS permissive FOR UPDATE TO authenticated
  USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "Allow HQ write facility_headcount_quotas" ON public."facility_headcount_quotas" AS permissive FOR ALL TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = auth.uid()) AND (((e.role)::text = ANY ((ARRAY['super_admin'::character varying, 'admin'::character varying, 'hr_manager'::character varying, 'operations_manager'::character varying])::text[])) OR (lower((e.role)::text) = 'ceo'::text))))));
CREATE POLICY "Allow authenticated read facility_headcount_quotas" ON public."facility_headcount_quotas" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "farmer_programs_insert" ON public."farmer_programs" AS permissive FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "farmer_programs_select" ON public."farmer_programs" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "farmer_programs_update" ON public."farmer_programs" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "fiscal_periods_all" ON public."fiscal_periods" AS permissive FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Allow authenticated insert on headcount_quota_requests" ON public."headcount_quota_requests" AS permissive FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "Allow authenticated read on headcount_quota_requests" ON public."headcount_quota_requests" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Allow authenticated update on headcount_quota_requests" ON public."headcount_quota_requests" AS permissive FOR UPDATE TO authenticated
  USING (true);
CREATE POLICY "hr_policies_delete" ON public."hr_country_policies" AS permissive FOR DELETE TO authenticated
  USING (true);
CREATE POLICY "hr_policies_insert" ON public."hr_country_policies" AS permissive FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "hr_policies_read" ON public."hr_country_policies" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "hr_policies_update" ON public."hr_country_policies" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "inbound_qc_inspections_update" ON public."inbound_qc_inspections" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "qc_inspections_insert" ON public."inbound_qc_inspections" AS permissive FOR INSERT TO authenticated
  WITH CHECK (((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'inbound_qc_inspector'::text, 'warehouse_manager'::text, 'inventory_manager'::text, 'procurement_manager'::text])) OR (EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = ( SELECT auth.uid() AS uid)) AND ((e.role)::text = ANY (ARRAY['super_admin'::text, 'inbound_qc_inspector'::text, 'warehouse_manager'::text, 'inventory_manager'::text, 'procurement_manager'::text])))))));
CREATE POLICY "qc_inspections_select" ON public."inbound_qc_inspections" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "qc_inspections_update" ON public."inbound_qc_inspections" AS permissive FOR UPDATE TO authenticated
  USING ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'inbound_qc_inspector'::text, 'warehouse_manager'::text, 'inventory_manager'::text])));
CREATE POLICY "inv_requests_zero_trust_delete" ON public."inventory_requests" AS permissive FOR DELETE TO authenticated
  USING (is_ceo());
CREATE POLICY "inv_requests_zero_trust_insert" ON public."inventory_requests" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((is_ceo() OR (((country_code)::text = get_my_country_code()) AND ((site_id = get_my_site_code_or_id()) OR (site_id IN ( SELECT (s.id)::text AS id
   FROM sites s
  WHERE (((s.id)::text = get_my_site_code_or_id()) OR (s.code = get_my_site_code_or_id())))) OR is_admin()))));
CREATE POLICY "inv_requests_zero_trust_select" ON public."inventory_requests" AS permissive FOR SELECT TO authenticated
  USING ((is_ceo() OR (is_admin() AND ((country_code)::text = get_my_country_code())) OR (((country_code)::text = get_my_country_code()) AND ((site_id = get_my_site_code_or_id()) OR (site_id IN ( SELECT (s.id)::text AS id
   FROM sites s
  WHERE (((s.id)::text = get_my_site_code_or_id()) OR (s.code = get_my_site_code_or_id()))))))));
CREATE POLICY "inv_requests_zero_trust_update" ON public."inventory_requests" AS permissive FOR UPDATE TO authenticated
  USING ((is_ceo() OR (is_admin() AND ((country_code)::text = get_my_country_code()))));
CREATE POLICY "invoice_items_delete" ON public."invoice_items" AS permissive FOR DELETE TO authenticated
  USING ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'finance_manager'::text])));
CREATE POLICY "invoice_items_insert" ON public."invoice_items" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1
   FROM vendor_invoices vi
  WHERE ((vi.id = invoice_items.invoice_id) AND ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text, 'finance_manager'::text, 'procurement_manager'::text])) OR ((vi.country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code)))))));
CREATE POLICY "invoice_items_select" ON public."invoice_items" AS permissive FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM vendor_invoices vi
  WHERE ((vi.id = invoice_items.invoice_id) AND ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text, 'finance_manager'::text, 'procurement_manager'::text, 'auditor'::text])) OR ((vi.country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code)))))));
CREATE POLICY "invoice_items_update" ON public."invoice_items" AS permissive FOR UPDATE TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM vendor_invoices vi
  WHERE ((vi.id = invoice_items.invoice_id) AND ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text, 'finance_manager'::text, 'procurement_manager'::text])) OR ((vi.country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code)))))));
CREATE POLICY "job_assignments_delete" ON public."job_assignments" AS permissive FOR DELETE TO authenticated
  USING (( SELECT is_manager() AS is_manager));
CREATE POLICY "job_assignments_insert" ON public."job_assignments" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "job_assignments_read" ON public."job_assignments" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "job_assignments_update" ON public."job_assignments" AS permissive FOR UPDATE TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "job_candidates_delete" ON public."job_candidates" AS permissive FOR DELETE TO authenticated
  USING (true);
CREATE POLICY "job_candidates_insert" ON public."job_candidates" AS permissive FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "job_candidates_read" ON public."job_candidates" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "job_candidates_update" ON public."job_candidates" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "job_reqs_delete" ON public."job_requisitions" AS permissive FOR DELETE TO authenticated
  USING (true);
CREATE POLICY "job_reqs_insert" ON public."job_requisitions" AS permissive FOR INSERT TO authenticated
  WITH CHECK (((approved_by IS NULL) OR (approved_by <> requested_by)));
CREATE POLICY "job_reqs_read" ON public."job_requisitions" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "job_reqs_update" ON public."job_requisitions" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (((approved_by IS NULL) OR (approved_by <> requested_by)));
CREATE POLICY "journal_entries_delete" ON public."journal_entries" AS permissive FOR DELETE TO authenticated
  USING (true);
CREATE POLICY "journal_entries_insert" ON public."journal_entries" AS permissive FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "journal_entries_read" ON public."journal_entries" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "journal_entries_update" ON public."journal_entries" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "journal_lines_delete" ON public."journal_lines" AS permissive FOR DELETE TO authenticated
  USING ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'finance_manager'::text])));
CREATE POLICY "journal_lines_insert" ON public."journal_lines" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1
   FROM journal_entries je
  WHERE ((je.id = journal_lines.journal_id) AND ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text, 'finance_manager'::text])) OR ((je.country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code)))))));
CREATE POLICY "journal_lines_select" ON public."journal_lines" AS permissive FOR SELECT TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM journal_entries je
  WHERE ((je.id = journal_lines.journal_id) AND ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text, 'finance_manager'::text, 'auditor'::text])) OR ((je.country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code)))))));
CREATE POLICY "journal_lines_update" ON public."journal_lines" AS permissive FOR UPDATE TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM journal_entries je
  WHERE ((je.id = journal_lines.journal_id) AND ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text, 'finance_manager'::text])) OR ((je.country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code)))))));
CREATE POLICY "logistics_zones_delete" ON public."logistics_zones" AS permissive FOR DELETE TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = ( SELECT auth.uid() AS uid)) AND ((e.role)::text = ANY (ARRAY['super_admin'::text, 'admin'::text, 'wms_manager'::text, 'inventory_manager'::text]))))));
CREATE POLICY "logistics_zones_insert" ON public."logistics_zones" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = ( SELECT auth.uid() AS uid)) AND ((e.role)::text = ANY (ARRAY['super_admin'::text, 'admin'::text, 'wms_manager'::text, 'inventory_manager'::text]))))));
CREATE POLICY "logistics_zones_update" ON public."logistics_zones" AS permissive FOR UPDATE TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = ( SELECT auth.uid() AS uid)) AND ((e.role)::text = ANY (ARRAY['super_admin'::text, 'admin'::text, 'wms_manager'::text, 'inventory_manager'::text]))))))
  WITH CHECK ((EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = ( SELECT auth.uid() AS uid)) AND ((e.role)::text = ANY (ARRAY['super_admin'::text, 'admin'::text, 'wms_manager'::text, 'inventory_manager'::text]))))));
CREATE POLICY "select_logistics_zones" ON public."logistics_zones" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "margin_requests_all" ON public."margin_approval_requests" AS permissive FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Users manage own mm accounts" ON public."mobile_money_accounts" AS permissive FOR ALL TO authenticated
  USING ((user_id = ( SELECT users.id
   FROM users
  WHERE (users.auth_id = ( SELECT auth.uid() AS uid)))))
  WITH CHECK ((user_id = ( SELECT users.id
   FROM users
  WHERE (users.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "payment_runs_delete" ON public."payment_runs" AS permissive FOR DELETE TO authenticated
  USING ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text])));
CREATE POLICY "payment_runs_insert" ON public."payment_runs" AS permissive FOR INSERT TO authenticated
  WITH CHECK (((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text, 'finance_manager'::text])) AND ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text])) OR ((country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code)))));
CREATE POLICY "payment_runs_select" ON public."payment_runs" AS permissive FOR SELECT TO authenticated
  USING (((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text, 'finance_manager'::text, 'auditor'::text])) OR ((country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code))));
RESET search_path;
