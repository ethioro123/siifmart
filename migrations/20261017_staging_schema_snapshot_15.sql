-- Staging security and access snapshot, part 15 of 16.
SET search_path = public, extensions, auth;
CREATE POLICY "payment_runs_update" ON public."payment_runs" AS permissive FOR UPDATE TO authenticated
  USING (((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text, 'finance_manager'::text])) AND ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text])) OR ((country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code)))));
CREATE POLICY "payroll_runs_insert" ON public."payroll_runs" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((initiated_by IS NOT NULL));
CREATE POLICY "payroll_runs_read" ON public."payroll_runs" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "payroll_runs_update" ON public."payroll_runs" AS permissive FOR UPDATE TO authenticated
  USING (((hr_approved_by IS NULL) OR (hr_approved_by <> initiated_by)))
  WITH CHECK (((hr_approved_by IS NULL) OR (hr_approved_by <> initiated_by)));
CREATE POLICY "perf_reviews_delete" ON public."performance_reviews" AS permissive FOR DELETE TO authenticated
  USING (true);
CREATE POLICY "perf_reviews_insert" ON public."performance_reviews" AS permissive FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "perf_reviews_read" ON public."performance_reviews" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "perf_reviews_update" ON public."performance_reviews" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "petty_cash_accounts_all" ON public."petty_cash_accounts" AS permissive FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "petty_cash_replenishments_all" ON public."petty_cash_replenishments" AS permissive FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "petty_cash_vouchers_all" ON public."petty_cash_vouchers" AS permissive FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "po_items_zero_trust_delete" ON public."po_items" AS permissive FOR DELETE TO authenticated
  USING ((po_id IN ( SELECT purchase_orders.id
   FROM purchase_orders)));
CREATE POLICY "po_items_zero_trust_insert" ON public."po_items" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((po_id IN ( SELECT purchase_orders.id
   FROM purchase_orders)));
CREATE POLICY "po_items_zero_trust_select" ON public."po_items" AS permissive FOR SELECT TO authenticated
  USING ((po_id IN ( SELECT purchase_orders.id
   FROM purchase_orders)));
CREATE POLICY "po_items_zero_trust_update" ON public."po_items" AS permissive FOR UPDATE TO authenticated
  USING ((po_id IN ( SELECT purchase_orders.id
   FROM purchase_orders)));
CREATE POLICY "points_tx_insert" ON public."points_transactions" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "points_tx_read" ON public."points_transactions" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "pos_cash_drops_insert" ON public."pos_cash_drops" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((is_ceo() OR (((country_code)::text = get_my_country_code()) AND ((site_id = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (site_id IN ( SELECT (s.id)::text AS id
   FROM sites s
  WHERE (((s.id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (s.code = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id))))) OR is_admin()))));
CREATE POLICY "pos_cash_drops_read" ON public."pos_cash_drops" AS permissive FOR SELECT TO authenticated
  USING ((is_ceo() OR (is_admin() AND ((country_code)::text = get_my_country_code())) OR ((( SELECT get_my_role() AS get_my_role) = 'regional_manager'::text) AND (site_id IN ( SELECT (s.id)::text AS id
   FROM sites s
  WHERE (s.region_code = ( SELECT e.region_code
           FROM employees e
          WHERE ((e.id = ( SELECT auth.uid() AS uid)) OR ((e.email)::text = (( SELECT users.email
                   FROM auth.users
                  WHERE (users.id = ( SELECT auth.uid() AS uid))))::text))
         LIMIT 1))))) OR (((country_code)::text = get_my_country_code()) AND ((site_id = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (site_id IN ( SELECT (s.id)::text AS id
   FROM sites s
  WHERE (((s.id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (s.code = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)))))))));
CREATE POLICY "pos_cash_drops_update" ON public."pos_cash_drops" AS permissive FOR UPDATE TO authenticated
  USING ((is_ceo() OR (is_admin() AND ((country_code)::text = get_my_country_code())) OR (is_manager() AND ((site_id = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (site_id IN ( SELECT (s.id)::text AS id
   FROM sites s
  WHERE (((s.id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (s.code = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)))))))));
CREATE POLICY "pos_overrides_insert" ON public."pos_supervisory_overrides" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((cashier_id <> supervisor_id));
CREATE POLICY "pos_overrides_read" ON public."pos_supervisory_overrides" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "pricing_rules_delete" ON public."pricing_rules" AS permissive FOR DELETE TO authenticated
  USING ((( SELECT is_ceo() AS is_ceo) OR (((country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code)) AND (( SELECT get_my_role() AS get_my_role) = 'merchandising_manager'::text))));
CREATE POLICY "pricing_rules_insert" ON public."pricing_rules" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((( SELECT is_ceo() AS is_ceo) OR (((country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code)) AND (( SELECT get_my_role() AS get_my_role) = 'merchandising_manager'::text))));
CREATE POLICY "pricing_rules_select" ON public."pricing_rules" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT is_ceo() AS is_ceo) OR (((country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code)) AND (( SELECT is_admin() AS is_admin) OR (( SELECT get_my_role() AS get_my_role) = 'merchandising_manager'::text)))));
CREATE POLICY "pricing_rules_update" ON public."pricing_rules" AS permissive FOR UPDATE TO authenticated
  USING ((( SELECT is_ceo() AS is_ceo) OR (((country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code)) AND (( SELECT get_my_role() AS get_my_role) = 'merchandising_manager'::text))))
  WITH CHECK ((( SELECT is_ceo() AS is_ceo) OR (((country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code)) AND (( SELECT get_my_role() AS get_my_role) = 'merchandising_manager'::text))));
CREATE POLICY "product_master_insert" ON public."product_master" AS permissive FOR INSERT TO authenticated
  WITH CHECK (((country_code = ( SELECT get_my_country_code() AS get_my_country_code)) AND ((status = 'PENDING'::text) OR (( SELECT get_my_role() AS get_my_role) = ANY (ARRAY['super_admin'::text, 'operations_manager'::text, 'procurement_manager'::text, 'supply_chain_manager'::text])))));
CREATE POLICY "product_master_select" ON public."product_master" AS permissive FOR SELECT TO authenticated
  USING ((is_ceo() OR ((country_code = ( SELECT get_my_country_code() AS get_my_country_code)) AND ((status = 'APPROVED'::text) OR is_admin() OR (created_by = (( SELECT auth.uid() AS uid))::text)))));
CREATE POLICY "product_master_update" ON public."product_master" AS permissive FOR UPDATE TO authenticated
  USING (((( SELECT get_my_role() AS get_my_role) = ANY (ARRAY['super_admin'::text, 'operations_manager'::text, 'procurement_manager'::text, 'supply_chain_manager'::text])) AND (is_ceo() OR (country_code = ( SELECT get_my_country_code() AS get_my_country_code)))))
  WITH CHECK ((( SELECT get_my_role() AS get_my_role) = ANY (ARRAY['super_admin'::text, 'operations_manager'::text, 'procurement_manager'::text, 'supply_chain_manager'::text])));
CREATE POLICY "products_delete" ON public."products" AS permissive FOR DELETE TO authenticated
  USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "products_insert" ON public."products" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "products_read" ON public."products" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "products_update" ON public."products" AS permissive FOR UPDATE TO authenticated
  USING ((is_ceo() OR (is_admin() AND (site_id IN ( SELECT s.id
   FROM sites s
  WHERE ((s.country)::text = get_my_country_code())))) OR ((( SELECT get_my_role() AS get_my_role) = 'regional_manager'::text) AND (site_id IN ( SELECT s.id
   FROM sites s
  WHERE (s.region_code = ( SELECT e.region_code
           FROM employees e
          WHERE ((e.id = ( SELECT auth.uid() AS uid)) OR ((e.email)::text = (( SELECT users.email
                   FROM auth.users
                  WHERE (users.id = ( SELECT auth.uid() AS uid))))::text))
         LIMIT 1))))) OR (is_manager() AND (((site_id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (site_id IN ( SELECT s.id
   FROM sites s
  WHERE (((s.id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (s.code = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)))))))));
CREATE POLICY "po_zero_trust_delete" ON public."purchase_orders" AS permissive FOR DELETE TO authenticated
  USING (((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text])) OR (EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = ( SELECT auth.uid() AS uid)) AND ((e.role)::text = 'super_admin'::text))))));
CREATE POLICY "po_zero_trust_insert" ON public."purchase_orders" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text, 'procurement_manager'::text, 'buyer'::text, 'supply_chain_manager'::text, 'operations_manager'::text, 'regional_manager'::text])) OR (EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = ( SELECT auth.uid() AS uid)) AND ((e.role)::text = ANY (ARRAY['super_admin'::text, 'procurement_manager'::text, 'buyer'::text, 'operations_manager'::text, 'regional_manager'::text])))))) AND ((site_id IS NULL) OR (site_id IN ( SELECT sites.id
   FROM sites
  WHERE ((sites.type)::text = ANY (ARRAY['Warehouse'::text, 'Distribution Center'::text])))))));
CREATE POLICY "po_zero_trust_select" ON public."purchase_orders" AS permissive FOR SELECT TO authenticated
  USING (((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text, 'procurement_manager'::text, 'finance_manager'::text, 'operations_manager'::text, 'regional_manager'::text, 'buyer'::text, 'demand_planner'::text, 'vendor_relations_manager'::text, 'replenishment_planner'::text, 'supply_chain_manager'::text])) OR ((country_code)::text = ( SELECT COALESCE((s.country)::text, 'ET'::text) AS "coalesce"
   FROM sites s
  WHERE (s.id = ( SELECT e.site_id
           FROM employees e
          WHERE (e.id = ( SELECT auth.uid() AS uid))
         LIMIT 1)))) OR (site_id IN ( SELECT s2.id
   FROM sites s2
  WHERE ((s2.country)::text = ( SELECT COALESCE((s3.country)::text, 'ET'::text) AS "coalesce"
           FROM sites s3
          WHERE (s3.id = ( SELECT e2.site_id
                   FROM employees e2
                  WHERE (e2.id = ( SELECT auth.uid() AS uid))
                 LIMIT 1))))))));
CREATE POLICY "po_zero_trust_update" ON public."purchase_orders" AS permissive FOR UPDATE TO authenticated
  USING (((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text, 'procurement_manager'::text, 'finance_manager'::text, 'operations_manager'::text, 'regional_manager'::text, 'buyer'::text, 'warehouse_manager'::text, 'receiver'::text, 'inventory_specialist'::text])) OR (EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = ( SELECT auth.uid() AS uid)) AND ((e.role)::text = ANY (ARRAY['super_admin'::text, 'procurement_manager'::text, 'finance_manager'::text, 'operations_manager'::text, 'regional_manager'::text, 'buyer'::text, 'warehouse_manager'::text, 'receiver'::text, 'inventory_specialist'::text]))))) OR ( SELECT is_manager() AS is_manager) OR ( SELECT is_admin() AS is_admin)));
CREATE POLICY "Users can read own ratings" ON public."ratings" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IN ( SELECT users.auth_id
   FROM users
  WHERE (users.id = ANY (ARRAY[ratings.from_user_id, ratings.to_user_id])))));
CREATE POLICY "Allow HQ write regional_delegation_rules" ON public."regional_delegation_rules" AS permissive FOR ALL TO authenticated
  USING ((EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = auth.uid()) AND (((e.role)::text = ANY ((ARRAY['super_admin'::character varying, 'admin'::character varying, 'operations_manager'::character varying])::text[])) OR (lower((e.role)::text) = 'ceo'::text))))));
CREATE POLICY "Allow authenticated read regional_delegation_rules" ON public."regional_delegation_rules" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Allow public read on regions" ON public."regions" AS permissive FOR SELECT TO PUBLIC
  USING (true);
CREATE POLICY "regions_delete" ON public."regions" AS permissive FOR DELETE TO PUBLIC
  USING (is_ceo());
CREATE POLICY "regions_insert" ON public."regions" AS permissive FOR INSERT TO PUBLIC
  WITH CHECK (is_admin());
CREATE POLICY "regions_update" ON public."regions" AS permissive FOR UPDATE TO PUBLIC
  USING (is_admin())
  WITH CHECK (is_admin());
CREATE POLICY "salary_requests_insert" ON public."salary_requests" AS permissive FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "salary_requests_read" ON public."salary_requests" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "salary_requests_update" ON public."salary_requests" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "sale_items_delete" ON public."sale_items" AS permissive FOR DELETE TO authenticated
  USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "sale_items_insert" ON public."sale_items" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((is_ceo() OR is_admin() OR (EXISTS ( SELECT 1
   FROM sales s
  WHERE ((s.id = sale_items.sale_id) AND (((s.site_id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (s.site_id IN ( SELECT st.id
           FROM sites st
          WHERE (((st.id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (st.code = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)))))))))));
CREATE POLICY "sale_items_read" ON public."sale_items" AS permissive FOR SELECT TO authenticated
  USING ((is_ceo() OR is_admin() OR (EXISTS ( SELECT 1
   FROM sales s
  WHERE ((s.id = sale_items.sale_id) AND (((s.site_id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (s.site_id IN ( SELECT st.id
           FROM sites st
          WHERE (((st.id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (st.code = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)))))))))));
CREATE POLICY "sale_items_update" ON public."sale_items" AS permissive FOR UPDATE TO authenticated
  USING ((is_ceo() OR is_admin() OR (is_manager() AND (EXISTS ( SELECT 1
   FROM sales s
  WHERE ((s.id = sale_items.sale_id) AND (((s.site_id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (s.site_id IN ( SELECT st.id
           FROM sites st
          WHERE (((st.id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (st.code = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id))))))))))));
CREATE POLICY "sales_delete" ON public."sales" AS permissive FOR DELETE TO authenticated
  USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "sales_insert" ON public."sales" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((is_ceo() OR is_admin() OR (((site_id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (site_id IN ( SELECT s.id
   FROM sites s
  WHERE (((s.id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (s.code = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id))))))));
CREATE POLICY "sales_isolation_select" ON public."sales" AS permissive FOR SELECT TO authenticated
  USING (((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text])) OR (site_id IN ( SELECT s.id
   FROM sites s
  WHERE ((s.country)::text = ( SELECT COALESCE((s2.country)::text, 'ET'::text) AS "coalesce"
           FROM sites s2
          WHERE (s2.id = ( SELECT e.site_id
                   FROM employees e
                  WHERE (e.id = ( SELECT auth.uid() AS uid))
                 LIMIT 1))))))));
CREATE POLICY "sales_update" ON public."sales" AS permissive FOR UPDATE TO authenticated
  USING ((is_ceo() OR (is_admin() AND ((country_code IS NULL) OR ((country_code)::text = get_my_country_code()))) OR (is_manager() AND (((site_id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (site_id IN ( SELECT s.id
   FROM sites s
  WHERE (((s.id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR (s.code = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)))))))));
CREATE POLICY "shifts_delete_policy" ON public."shifts" AS permissive FOR DELETE TO authenticated
  USING ((( SELECT COALESCE(get_my_role(), (( SELECT auth.jwt() AS jwt) ->> 'role'::text)) AS "coalesce") = ANY (ARRAY['super_admin'::text, 'admin'::text, 'CEO'::text])));
CREATE POLICY "shifts_insert_policy" ON public."shifts" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "shifts_select_policy" ON public."shifts" AS permissive FOR SELECT TO authenticated
  USING (((( SELECT COALESCE(get_my_role(), ( SELECT (auth.jwt() ->> 'role'::text))) AS "coalesce") = ANY (ARRAY['super_admin'::text, 'admin'::text, 'CEO'::text, 'finance_manager'::text, 'auditor'::text, 'operations_manager'::text])) OR ((( SELECT COALESCE(get_my_role(), ( SELECT (auth.jwt() ->> 'role'::text))) AS "coalesce") = 'regional_manager'::text) AND (site_id IN ( SELECT s.id
   FROM sites s
  WHERE (s.region_code = ( SELECT get_my_region_code() AS get_my_region_code))))) OR (site_id = ( SELECT get_my_site_id() AS get_my_site_id)) OR ((site_id IS NULL) AND (( SELECT COALESCE(get_my_role(), ( SELECT (auth.jwt() ->> 'role'::text))) AS "coalesce") = ANY (ARRAY['super_admin'::text, 'admin'::text, 'CEO'::text, 'finance_manager'::text, 'auditor'::text, 'operations_manager'::text])))));
CREATE POLICY "shifts_update_policy" ON public."shifts" AS permissive FOR UPDATE TO authenticated
  USING (((( SELECT COALESCE(get_my_role(), (( SELECT auth.jwt() AS jwt) ->> 'role'::text)) AS "coalesce") = ANY (ARRAY['super_admin'::text, 'admin'::text, 'CEO'::text, 'finance_manager'::text, 'auditor'::text, 'operations_manager'::text, 'store_manager'::text])) OR (cashier_id = ( SELECT auth.uid() AS uid)) OR ((cashier_id)::text = ( SELECT employees.code
   FROM employees
  WHERE (employees.id = ( SELECT auth.uid() AS uid))
 LIMIT 1))));
CREATE POLICY "replenishment_sources_delete" ON public."site_replenishment_sources" AS permissive FOR DELETE TO authenticated
  USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "replenishment_sources_read" ON public."site_replenishment_sources" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "replenishment_sources_update" ON public."site_replenishment_sources" AS permissive FOR UPDATE TO authenticated
  USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "replenishment_sources_write" ON public."site_replenishment_sources" AS permissive FOR INSERT TO authenticated
  WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "sites_delete" ON public."sites" AS permissive FOR DELETE TO authenticated
  USING (( SELECT is_ceo() AS is_ceo));
CREATE POLICY "sites_read" ON public."sites" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "sites_update" ON public."sites" AS permissive FOR UPDATE TO authenticated
  USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "sites_write" ON public."sites" AS permissive FOR INSERT TO authenticated
  WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "staff_schedules_delete" ON public."staff_schedules" AS permissive FOR DELETE TO authenticated
  USING (( SELECT is_manager() AS is_manager));
CREATE POLICY "staff_schedules_insert" ON public."staff_schedules" AS permissive FOR INSERT TO authenticated
  WITH CHECK (( SELECT is_manager() AS is_manager));
CREATE POLICY "staff_schedules_read" ON public."staff_schedules" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "staff_schedules_update" ON public."staff_schedules" AS permissive FOR UPDATE TO authenticated
  USING (( SELECT is_manager() AS is_manager));
CREATE POLICY "stock_movements_delete" ON public."stock_movements" AS permissive FOR DELETE TO authenticated
  USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "stock_movements_insert" ON public."stock_movements" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "stock_movements_read" ON public."stock_movements" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "stock_movements_update" ON public."stock_movements" AS permissive FOR UPDATE TO authenticated
  USING (( SELECT is_manager() AS is_manager));
CREATE POLICY "store_audits_insert_policy" ON public."store_operations_audits" AS permissive FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "store_audits_select_policy" ON public."store_operations_audits" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "store_audits_update_policy" ON public."store_operations_audits" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "store_points_insert" ON public."store_points" AS permissive FOR INSERT TO authenticated
  WITH CHECK (( SELECT is_manager() AS is_manager));
CREATE POLICY "store_points_read" ON public."store_points" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "store_points_update" ON public."store_points" AS permissive FOR UPDATE TO authenticated
  USING (( SELECT is_manager() AS is_manager));
CREATE POLICY "suppliers_delete" ON public."suppliers" AS permissive FOR DELETE TO authenticated
  USING ((( SELECT COALESCE(get_my_role(), (( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) AS "coalesce") = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text])));
CREATE POLICY "suppliers_insert" ON public."suppliers" AS permissive FOR INSERT TO authenticated
  WITH CHECK (((( SELECT COALESCE(get_my_role(), (( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) AS "coalesce") = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text, 'procurement_manager'::text, 'vendor_relations_manager'::text, 'supply_chain_manager'::text, 'buyer'::text, 'finance_manager'::text, 'operations_manager'::text, 'regional_manager'::text, 'store_manager'::text, 'inventory_specialist'::text])) OR (( SELECT auth.uid() AS uid) IS NOT NULL)));
CREATE POLICY "suppliers_select" ON public."suppliers" AS permissive FOR SELECT TO authenticated
  USING (((( SELECT COALESCE(get_my_role(), (( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) AS "coalesce") = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text, 'auditor'::text])) OR (country_code IS NULL) OR ((country_code)::text = ''::text) OR ((country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code))));
CREATE POLICY "suppliers_update" ON public."suppliers" AS permissive FOR UPDATE TO authenticated
  USING (((( SELECT COALESCE(get_my_role(), (( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) AS "coalesce") = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'admin'::text, 'procurement_manager'::text, 'vendor_relations_manager'::text, 'supply_chain_manager'::text, 'buyer'::text, 'finance_manager'::text, 'operations_manager'::text, 'regional_manager'::text, 'store_manager'::text])) OR (( SELECT auth.uid() AS uid) IS NOT NULL)));
CREATE POLICY "Allow public read on supported_languages" ON public."supported_languages" AS permissive FOR SELECT TO PUBLIC
  USING (true);
CREATE POLICY "config_read" ON public."system_config" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "config_update" ON public."system_config" AS permissive FOR UPDATE TO authenticated
  USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "config_write" ON public."system_config" AS permissive FOR INSERT TO authenticated
  WITH CHECK (( SELECT is_admin() AS is_admin));
CREATE POLICY "logs_insert" ON public."system_logs" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "logs_read" ON public."system_logs" AS permissive FOR SELECT TO authenticated
  USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "tender_reconciliations_all" ON public."tender_reconciliations" AS permissive FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "training_records_delete" ON public."training_records" AS permissive FOR DELETE TO authenticated
  USING (true);
CREATE POLICY "training_records_insert" ON public."training_records" AS permissive FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "training_records_read" ON public."training_records" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "training_records_update" ON public."training_records" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Users can read own transactions" ON public."transactions" AS permissive FOR SELECT TO authenticated
  USING ((wallet_id IN ( SELECT w.id
   FROM (wallets w
     JOIN users u ON ((u.id = w.user_id)))
  WHERE (u.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "transfers_delete_prohibited" ON public."transfers" AS permissive FOR DELETE TO authenticated
  USING ((( SELECT get_my_role() AS get_my_role) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'ceo'::text])));
CREATE POLICY "transfers_insert_sovereign" ON public."transfers" AS permissive FOR INSERT TO authenticated
  WITH CHECK (((( SELECT get_my_role() AS get_my_role) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'ceo'::text])) OR ((country_code = get_my_country_code()) AND (is_manager() OR (source_site_id = get_my_site_id())))));
CREATE POLICY "transfers_read" ON public."transfers" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "transfers_select_sovereign" ON public."transfers" AS permissive FOR SELECT TO authenticated
  USING (((( SELECT get_my_role() AS get_my_role) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'ceo'::text])) OR ((country_code = get_my_country_code()) AND ((( SELECT get_my_role() AS get_my_role) = ANY (ARRAY['operations_manager'::text, 'logistics_manager'::text, 'finance_manager'::text, 'procurement_manager'::text, 'auditor'::text])) OR (( SELECT get_my_role() AS get_my_role) = 'regional_manager'::text) OR (source_site_id = get_my_site_id()) OR (dest_site_id = get_my_site_id()) OR ((driver_id IS NOT NULL) AND ((driver_id)::text = (auth.uid())::text))))));
CREATE POLICY "transfers_update_sovereign" ON public."transfers" AS permissive FOR UPDATE TO authenticated
  USING (((( SELECT get_my_role() AS get_my_role) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'ceo'::text])) OR ((country_code = get_my_country_code()) AND (is_manager() OR (source_site_id = get_my_site_id()) OR (dest_site_id = get_my_site_id()) OR ((driver_id IS NOT NULL) AND ((driver_id)::text = (auth.uid())::text))))));
CREATE POLICY "Users can insert own trips" ON public."trips" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((rider_id = ( SELECT users.id
   FROM users
  WHERE (users.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "Users can read own trips" ON public."trips" AS permissive FOR SELECT TO authenticated
  USING (((rider_id = ( SELECT users.id
   FROM users
  WHERE (users.auth_id = ( SELECT auth.uid() AS uid)))) OR (driver_id IN ( SELECT d.id
   FROM (drivers d
     JOIN users u ON ((u.id = d.user_id)))
  WHERE (u.auth_id = ( SELECT auth.uid() AS uid))))));
CREATE POLICY "Users can read own profile" ON public."users" AS permissive FOR SELECT TO authenticated
  USING ((auth_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "Users can update own profile" ON public."users" AS permissive FOR UPDATE TO authenticated
  USING ((auth_id = ( SELECT auth.uid() AS uid)))
  WITH CHECK ((auth_id = ( SELECT auth.uid() AS uid)));
CREATE POLICY "contracts_insert" ON public."vendor_contracts" AS permissive FOR INSERT TO authenticated
  WITH CHECK (((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'procurement_manager'::text, 'vendor_relations_manager'::text, 'finance_manager'::text])) OR (EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = ( SELECT auth.uid() AS uid)) AND ((e.role)::text = ANY (ARRAY['super_admin'::text, 'procurement_manager'::text, 'vendor_relations_manager'::text, 'finance_manager'::text])))))));
CREATE POLICY "contracts_select" ON public."vendor_contracts" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "contracts_update" ON public."vendor_contracts" AS permissive FOR UPDATE TO authenticated
  USING ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'procurement_manager'::text, 'vendor_relations_manager'::text, 'finance_manager'::text])));
CREATE POLICY "vendor_contracts_update" ON public."vendor_contracts" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "vendor_invoices_delete" ON public."vendor_invoices" AS permissive FOR DELETE TO authenticated
  USING (true);
CREATE POLICY "vendor_invoices_insert" ON public."vendor_invoices" AS permissive FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "vendor_invoices_read" ON public."vendor_invoices" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "vendor_invoices_update" ON public."vendor_invoices" AS permissive FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "scorecards_insert" ON public."vendor_scorecards" AS permissive FOR INSERT TO authenticated
  WITH CHECK (((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'procurement_manager'::text, 'vendor_relations_manager'::text])) OR (EXISTS ( SELECT 1
   FROM employees e
  WHERE ((e.id = ( SELECT auth.uid() AS uid)) AND ((e.role)::text = ANY (ARRAY['super_admin'::text, 'procurement_manager'::text, 'vendor_relations_manager'::text])))))));
CREATE POLICY "scorecards_select" ON public."vendor_scorecards" AS permissive FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "scorecards_update" ON public."vendor_scorecards" AS permissive FOR UPDATE TO authenticated
  USING ((COALESCE((( SELECT auth.jwt() AS jwt) ->> 'role'::text), ''::text) = ANY (ARRAY['super_admin'::text, 'CEO'::text, 'procurement_manager'::text, 'vendor_relations_manager'::text])));
CREATE POLICY "Users can read own wallet entries" ON public."wallet_ledger_entries" AS permissive FOR SELECT TO authenticated
  USING ((wallet_id IN ( SELECT w.id
   FROM (wallets w
     JOIN users u ON ((u.id = w.user_id)))
  WHERE (u.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "Users can read own wallet" ON public."wallets" AS permissive FOR SELECT TO authenticated
  USING ((user_id = ( SELECT users.id
   FROM users
  WHERE (users.auth_id = ( SELECT auth.uid() AS uid)))));
CREATE POLICY "zones_delete" ON public."warehouse_zones" AS permissive FOR DELETE TO authenticated
  USING (( SELECT is_admin() AS is_admin));
CREATE POLICY "zones_read" ON public."warehouse_zones" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "zones_update" ON public."warehouse_zones" AS permissive FOR UPDATE TO authenticated
  USING (( SELECT is_manager() AS is_manager));
CREATE POLICY "zones_write" ON public."warehouse_zones" AS permissive FOR INSERT TO authenticated
  WITH CHECK (( SELECT is_manager() AS is_manager));
CREATE POLICY "wms_job_items_zero_trust_delete" ON public."wms_job_items" AS permissive FOR DELETE TO authenticated
  USING (is_ceo());
CREATE POLICY "wms_job_items_zero_trust_insert" ON public."wms_job_items" AS permissive FOR INSERT TO authenticated
  WITH CHECK (((job_id)::text IN ( SELECT (wms_jobs.id)::text AS id
   FROM wms_jobs)));
CREATE POLICY "wms_job_items_zero_trust_select" ON public."wms_job_items" AS permissive FOR SELECT TO authenticated
  USING (((job_id)::text IN ( SELECT (wms_jobs.id)::text AS id
   FROM wms_jobs)));
CREATE POLICY "wms_job_items_zero_trust_update" ON public."wms_job_items" AS permissive FOR UPDATE TO authenticated
  USING (((job_id)::text IN ( SELECT (wms_jobs.id)::text AS id
   FROM wms_jobs)));
CREATE POLICY "wms_jobs_zero_trust_delete" ON public."wms_jobs" AS permissive FOR DELETE TO authenticated
  USING (is_ceo());
CREATE POLICY "wms_jobs_zero_trust_insert" ON public."wms_jobs" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((is_ceo() OR (is_manager() AND ((country_code)::text = get_my_country_code())) OR ((get_my_role() = ANY (ARRAY['receiver'::text, 'picker'::text, 'packer'::text, 'inventory_specialist'::text, 'forklift_operator'::text, 'stock_clerk'::text, 'dispatcher'::text, 'cashier'::text, 'driver'::text])) AND ((country_code)::text = get_my_country_code()))));
CREATE POLICY "wms_jobs_zero_trust_select" ON public."wms_jobs" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT is_ceo() AS is_ceo) OR ((( SELECT is_manager() AS is_manager) OR ( SELECT is_admin() AS is_admin)) AND (((country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code)) OR ((site_id)::text IN ( SELECT (sites.id)::text AS id
   FROM sites
  WHERE ((sites.country)::text = ( SELECT get_my_country_code() AS get_my_country_code)))) OR ((site_id)::text IN ( SELECT sites.code
   FROM sites
  WHERE ((sites.country)::text = ( SELECT get_my_country_code() AS get_my_country_code)))))) OR (((country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code)) AND (((site_id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR ((dest_site_id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR ((assigned_to)::text = (( SELECT auth.uid() AS uid))::text) OR ((( SELECT get_my_employee_id() AS get_my_employee_id) IS NOT NULL) AND ((assigned_to)::text = (( SELECT get_my_employee_id() AS get_my_employee_id))::text)) OR ((( SELECT get_my_employee_code() AS get_my_employee_code) IS NOT NULL) AND ((assigned_to)::text = ( SELECT get_my_employee_code() AS get_my_employee_code))) OR (EXISTS ( SELECT 1
   FROM job_assignments ja
  WHERE ((ja.job_id = wms_jobs.id) AND ((ja.employee_id = ( SELECT auth.uid() AS uid)) OR ((( SELECT get_my_employee_id() AS get_my_employee_id) IS NOT NULL) AND (ja.employee_id = ( SELECT get_my_employee_id() AS get_my_employee_id)))))))))));
CREATE POLICY "wms_jobs_zero_trust_update" ON public."wms_jobs" AS permissive FOR UPDATE TO authenticated
  USING ((( SELECT is_ceo() AS is_ceo) OR (( SELECT is_manager() AS is_manager) AND ((country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code))) OR (((country_code)::text = ( SELECT get_my_country_code() AS get_my_country_code)) AND (((assigned_to)::text = (( SELECT auth.uid() AS uid))::text) OR ((( SELECT get_my_employee_id() AS get_my_employee_id) IS NOT NULL) AND ((assigned_to)::text = (( SELECT get_my_employee_id() AS get_my_employee_id))::text)) OR ((( SELECT get_my_employee_code() AS get_my_employee_code) IS NOT NULL) AND ((assigned_to)::text = ( SELECT get_my_employee_code() AS get_my_employee_code))) OR (EXISTS ( SELECT 1
   FROM job_assignments ja
  WHERE ((ja.job_id = wms_jobs.id) AND ((ja.employee_id = ( SELECT auth.uid() AS uid)) OR ((( SELECT get_my_employee_id() AS get_my_employee_id) IS NOT NULL) AND (ja.employee_id = ( SELECT get_my_employee_id() AS get_my_employee_id))))))))) OR (((assigned_to IS NULL) OR ((assigned_to)::text = ''::text)) AND (((site_id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id)) OR ((dest_site_id)::text = ( SELECT get_my_site_code_or_id() AS get_my_site_code_or_id))))));
CREATE POLICY "worker_points_insert" ON public."worker_points" AS permissive FOR INSERT TO authenticated
  WITH CHECK ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "worker_points_read" ON public."worker_points" AS permissive FOR SELECT TO authenticated
  USING ((( SELECT auth.uid() AS uid) IS NOT NULL));
CREATE POLICY "worker_points_update" ON public."worker_points" AS permissive FOR UPDATE TO authenticated
  USING ((( SELECT is_manager() AS is_manager) OR (employee_id = (get_my_employee_id())::text)));
RESET search_path;
