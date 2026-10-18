-- Role and tenant scopes for operational and commercial tables.

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.category_zones;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.category_zones;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.category_zones;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.category_zones;
CREATE POLICY category_zones_scoped ON public.category_zones FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','warehouse_manager','inventory_manager','operations_manager'])
  AND public.is_site_in_my_authorized_scope(category_zones.site_id::text, NULL)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','warehouse_manager','inventory_manager','operations_manager'])
  AND public.is_site_in_my_authorized_scope(category_zones.site_id::text, NULL)
);

DROP POLICY IF EXISTS coa_read ON public.chart_of_accounts;
DROP POLICY IF EXISTS coa_insert ON public.chart_of_accounts;
DROP POLICY IF EXISTS coa_update ON public.chart_of_accounts;
DROP POLICY IF EXISTS coa_delete ON public.chart_of_accounts;
CREATE POLICY chart_of_accounts_scoped ON public.chart_of_accounts FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','accountant','controller','auditor'])
  AND public.is_country_in_my_authorized_scope(chart_of_accounts.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','accountant','controller'])
  AND public.is_country_in_my_authorized_scope(chart_of_accounts.country_code)
);

DROP POLICY IF EXISTS discount_codes_select_policy ON public.discount_codes;
CREATE POLICY discount_codes_read_country_site ON public.discount_codes FOR SELECT TO authenticated
USING (
  upper(discount_codes.country_code) = upper(public.get_my_country_code())
  AND (cardinality(discount_codes.applicable_sites) IS NULL
       OR cardinality(discount_codes.applicable_sites) = 0
       OR public.get_my_site_id()::text = ANY(discount_codes.applicable_sites)
       OR lower(public.get_my_role()) IN ('super_admin','ceo','admin','operations_manager'))
);

DROP POLICY IF EXISTS farmer_programs_select ON public.farmer_programs;
DROP POLICY IF EXISTS farmer_programs_insert ON public.farmer_programs;
DROP POLICY IF EXISTS farmer_programs_update ON public.farmer_programs;
CREATE POLICY farmer_programs_scoped ON public.farmer_programs FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','procurement_manager','supply_chain_manager','agriculture_manager'])
  AND public.is_country_in_my_authorized_scope(farmer_programs.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','procurement_manager','supply_chain_manager','agriculture_manager'])
  AND public.is_country_in_my_authorized_scope(farmer_programs.country_code)
);

DROP POLICY IF EXISTS qc_inspections_select ON public.inbound_qc_inspections;
DROP POLICY IF EXISTS inbound_qc_inspections_update ON public.inbound_qc_inspections;
DROP POLICY IF EXISTS qc_inspections_insert ON public.inbound_qc_inspections;
CREATE POLICY qc_inspections_select_scoped ON public.inbound_qc_inspections FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','inbound_qc_inspector','warehouse_manager','inventory_manager','procurement_manager'])
  AND public.is_site_in_my_authorized_scope(inbound_qc_inspections.site_id::text, inbound_qc_inspections.country_code)
);
CREATE POLICY qc_inspections_insert_scoped ON public.inbound_qc_inspections FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','inbound_qc_inspector','warehouse_manager','inventory_manager','procurement_manager'])
  AND public.is_site_in_my_authorized_scope(inbound_qc_inspections.site_id::text, inbound_qc_inspections.country_code)
);
CREATE POLICY qc_inspections_update_scoped ON public.inbound_qc_inspections FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','inbound_qc_inspector','warehouse_manager','inventory_manager'])
  AND public.is_site_in_my_authorized_scope(inbound_qc_inspections.site_id::text, inbound_qc_inspections.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','inbound_qc_inspector','warehouse_manager','inventory_manager'])
  AND public.is_site_in_my_authorized_scope(inbound_qc_inspections.site_id::text, inbound_qc_inspections.country_code)
);

DROP POLICY IF EXISTS job_candidates_read ON public.job_candidates;
DROP POLICY IF EXISTS job_candidates_insert ON public.job_candidates;
DROP POLICY IF EXISTS job_candidates_update ON public.job_candidates;
DROP POLICY IF EXISTS job_candidates_delete ON public.job_candidates;
CREATE POLICY job_candidates_scoped ON public.job_candidates FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer','recruiter'])
  AND public.is_site_in_my_authorized_scope(job_candidates.site_id, job_candidates.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer','recruiter'])
  AND public.is_site_in_my_authorized_scope(job_candidates.site_id, job_candidates.country_code)
);

DROP POLICY IF EXISTS job_reqs_read ON public.job_requisitions;
DROP POLICY IF EXISTS job_reqs_update ON public.job_requisitions;
DROP POLICY IF EXISTS job_reqs_delete ON public.job_requisitions;
CREATE POLICY job_requisitions_read_scoped ON public.job_requisitions FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer','operations_manager','department_manager'])
  AND public.is_site_in_my_authorized_scope(job_requisitions.site_id, job_requisitions.country_code)
);
CREATE POLICY job_requisitions_insert_scoped ON public.job_requisitions FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer','operations_manager','department_manager'])
  AND public.is_site_in_my_authorized_scope(job_requisitions.site_id, job_requisitions.country_code)
);
CREATE POLICY job_requisitions_update_scoped ON public.job_requisitions FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer','operations_manager'])
  AND public.is_site_in_my_authorized_scope(job_requisitions.site_id, job_requisitions.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer','operations_manager'])
  AND public.is_site_in_my_authorized_scope(job_requisitions.site_id, job_requisitions.country_code)
);

DROP POLICY IF EXISTS select_logistics_zones ON public.logistics_zones;
CREATE POLICY logistics_zones_read_scoped ON public.logistics_zones FOR SELECT TO authenticated
USING (
  upper(logistics_zones.country) = upper(public.get_my_country_code())
  AND lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','operations_manager','logistics_manager','regional_manager','warehouse_manager','store_manager'])
);

DROP POLICY IF EXISTS margin_requests_all ON public.margin_approval_requests;
CREATE POLICY margin_approval_requests_scoped ON public.margin_approval_requests FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','merchandising_manager','pricing_manager','finance_manager','regional_manager'])
  AND public.is_site_in_my_authorized_scope(margin_approval_requests.site_id, margin_approval_requests.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','merchandising_manager','pricing_manager','finance_manager','regional_manager'])
  AND public.is_site_in_my_authorized_scope(margin_approval_requests.site_id, margin_approval_requests.country_code)
);

DROP POLICY IF EXISTS perf_reviews_read ON public.performance_reviews;
DROP POLICY IF EXISTS perf_reviews_insert ON public.performance_reviews;
DROP POLICY IF EXISTS perf_reviews_update ON public.performance_reviews;
DROP POLICY IF EXISTS perf_reviews_delete ON public.performance_reviews;
CREATE POLICY performance_reviews_read_scoped ON public.performance_reviews FOR SELECT TO authenticated
USING (
  performance_reviews.employee_id = auth.uid()
  OR (lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
      AND public.is_country_in_my_authorized_scope(performance_reviews.country_code))
);
CREATE POLICY performance_reviews_insert_scoped ON public.performance_reviews FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
  AND public.is_country_in_my_authorized_scope(performance_reviews.country_code)
);
CREATE POLICY performance_reviews_update_scoped ON public.performance_reviews FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
  AND public.is_country_in_my_authorized_scope(performance_reviews.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
  AND public.is_country_in_my_authorized_scope(performance_reviews.country_code)
);

DROP POLICY IF EXISTS pos_overrides_read ON public.pos_supervisory_overrides;
CREATE POLICY pos_overrides_read_scoped ON public.pos_supervisory_overrides FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','operations_manager','finance_manager','auditor','store_manager','regional_manager'])
  AND public.is_site_in_my_authorized_scope(pos_supervisory_overrides.site_id, pos_supervisory_overrides.country_code)
);

DROP POLICY IF EXISTS "Allow authenticated read regional_delegation_rules" ON public.regional_delegation_rules;
CREATE POLICY regional_delegation_rules_read_scoped ON public.regional_delegation_rules FOR SELECT TO authenticated
USING (
  public.is_country_in_my_authorized_scope(regional_delegation_rules.country_code)
  AND (lower(public.get_my_role()) IN ('super_admin','ceo','admin','operations_manager')
       OR (lower(public.get_my_role()) = 'regional_manager'
           AND regional_delegation_rules.region_code = public.get_my_region_code()))
);

DROP POLICY IF EXISTS store_audits_insert_policy ON public.store_operations_audits;
DROP POLICY IF EXISTS store_audits_select_policy ON public.store_operations_audits;
DROP POLICY IF EXISTS store_audits_update_policy ON public.store_operations_audits;
CREATE POLICY store_operations_audits_scoped ON public.store_operations_audits FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','operations_manager','regional_manager','store_manager','auditor'])
  AND public.is_site_in_my_authorized_scope(store_operations_audits.site_id, store_operations_audits.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','operations_manager','regional_manager','store_manager','auditor'])
  AND public.is_site_in_my_authorized_scope(store_operations_audits.site_id, store_operations_audits.country_code)
);

DROP POLICY IF EXISTS training_records_read ON public.training_records;
DROP POLICY IF EXISTS training_records_insert ON public.training_records;
DROP POLICY IF EXISTS training_records_update ON public.training_records;
DROP POLICY IF EXISTS training_records_delete ON public.training_records;
CREATE POLICY training_records_read_scoped ON public.training_records FOR SELECT TO authenticated
USING (
  training_records.employee_id = auth.uid()
  OR (lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
      AND public.is_country_in_my_authorized_scope(training_records.country_code))
);
CREATE POLICY training_records_insert_scoped ON public.training_records FOR INSERT TO authenticated
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
  AND public.is_country_in_my_authorized_scope(training_records.country_code)
);
CREATE POLICY training_records_update_scoped ON public.training_records FOR UPDATE TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
  AND public.is_country_in_my_authorized_scope(training_records.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','hr_manager','regional_hr_officer'])
  AND public.is_country_in_my_authorized_scope(training_records.country_code)
);

DROP POLICY IF EXISTS vendor_invoices_read ON public.vendor_invoices;
DROP POLICY IF EXISTS vendor_invoices_insert ON public.vendor_invoices;
DROP POLICY IF EXISTS vendor_invoices_update ON public.vendor_invoices;
DROP POLICY IF EXISTS vendor_invoices_delete ON public.vendor_invoices;
CREATE POLICY vendor_invoices_scoped ON public.vendor_invoices FOR ALL TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','accountant','procurement_manager','vendor_relations_manager'])
  AND public.is_site_in_my_authorized_scope(vendor_invoices.site_id, vendor_invoices.country_code)
)
WITH CHECK (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','finance_manager','cfo','accountant','procurement_manager','vendor_relations_manager'])
  AND public.is_site_in_my_authorized_scope(vendor_invoices.site_id, vendor_invoices.country_code)
);

DROP POLICY IF EXISTS scorecards_select ON public.vendor_scorecards;
CREATE POLICY scorecards_select_scoped ON public.vendor_scorecards FOR SELECT TO authenticated
USING (
  lower(public.get_my_role()) = ANY (ARRAY['super_admin','ceo','admin','procurement_manager','vendor_relations_manager','supply_chain_manager','auditor'])
  AND public.is_country_in_my_authorized_scope(vendor_scorecards.country_code)
);
