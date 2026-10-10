-- ============================================================================
-- Migration: 20261010_database_hardening_and_advisor_remediation.sql
-- Description: Comprehensive database security and performance hardening
-- 1. Fix mutable search_path on 10 functions (SEC-0011)
-- 2. Revoke public/anon access & restrict 25 SECURITY DEFINER functions (SEC-0028, SEC-0029)
-- 3. Add complete RLS policies for invoice_items, journal_lines, payment_runs (SEC-0008)
-- 4. Eliminate duplicate permissive policies across agents, drivers, trips, HR, accounting (PERF-0006)
-- 5. Optimize all RLS auth.*() calls with (SELECT auth.uid()) / (SELECT auth.jwt()) InitPlans (PERF-0003)
-- ============================================================================

-- ============================================================================
-- SECTION 1: SEARCH_PATH MUTABLE FIXES (SEC-0011)
-- ============================================================================

ALTER FUNCTION public.apply_transaction_settlement(p_transaction_id uuid, p_status text, p_metadata jsonb) 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.auto_provision_country_admin_site(p_country text, p_name text, p_currency text, p_address text, p_region text) 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.check_po_destination_is_warehouse_or_dc() 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.generate_next_site_code(p_country text) 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.get_financial_metrics(p_site_id text, p_start_date timestamp without time zone, p_end_date timestamp without time zone, p_country_code text) 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.increment_discount_usage(code_id text) 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.pos_decrement_stock(p_product_id uuid, p_quantity numeric, p_site_id text, p_product_name text, p_reason text, p_performed_by text, p_sale_date timestamp with time zone) 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.protect_country_admin_site() 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.trg_ensure_admin_site_on_new_country() 
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_store_operations_audits_timestamp() 
  SET search_path = public, pg_temp;


-- ============================================================================
-- SECTION 2: SECURITY DEFINER HARDENING & ACCESS CONTROL (SEC-0028, SEC-0029)
-- ============================================================================

-- 2.1 Trigger Functions: Revoke execution from PUBLIC, anon, and authenticated
REVOKE ALL ON FUNCTION public.enforce_inventory_requests_zero_trust() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_inventory_requests_zero_trust() TO service_role;
ALTER FUNCTION public.enforce_inventory_requests_zero_trust() SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.enforce_product_update_restrictions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_product_update_restrictions() TO service_role;
ALTER FUNCTION public.enforce_product_update_restrictions() SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.enforce_wms_job_update_restrictions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_wms_job_update_restrictions() TO service_role;
ALTER FUNCTION public.enforce_wms_job_update_restrictions() SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_auth_user() TO service_role;
ALTER FUNCTION public.handle_new_auth_user() SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
ALTER FUNCTION public.rls_auto_enable() SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.set_inventory_requests_country_code() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_inventory_requests_country_code() TO service_role;
ALTER FUNCTION public.set_inventory_requests_country_code() SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.set_wms_jobs_default_country_code() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_wms_jobs_default_country_code() TO service_role;
ALTER FUNCTION public.set_wms_jobs_default_country_code() SET search_path = public, pg_temp;

-- 2.2 Maintenance & Settlement Functions: Only service_role
REVOKE ALL ON FUNCTION public.cleanup_expired_system_logs(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_system_logs(integer) TO service_role;
ALTER FUNCTION public.cleanup_expired_system_logs(integer) SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.apply_transaction_settlement(uuid, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_transaction_settlement(uuid, text, jsonb) TO service_role;

-- 2.3 Convert Auth/Role Helper Functions to SECURITY INVOKER
ALTER FUNCTION public.get_auth_role() SECURITY INVOKER SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.get_auth_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated, service_role;

ALTER FUNCTION public.get_my_country() SECURITY INVOKER SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.get_my_country() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_country() TO authenticated, service_role;

ALTER FUNCTION public.get_my_country_code() SECURITY INVOKER SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.get_my_country_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_country_code() TO authenticated, service_role;

ALTER FUNCTION public.get_my_employee_code() SECURITY INVOKER SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.get_my_employee_code() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_employee_code() TO authenticated, service_role;

ALTER FUNCTION public.get_my_employee_id() SECURITY INVOKER SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.get_my_employee_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_employee_id() TO authenticated, service_role;

ALTER FUNCTION public.get_my_role() SECURITY INVOKER SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated, service_role;

ALTER FUNCTION public.get_my_site_code_or_id() SECURITY INVOKER SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.get_my_site_code_or_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_site_code_or_id() TO authenticated, service_role;

ALTER FUNCTION public.get_my_site_id() SECURITY INVOKER SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.get_my_site_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_site_id() TO authenticated, service_role;

ALTER FUNCTION public.is_admin() SECURITY INVOKER SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

ALTER FUNCTION public.is_ceo() SECURITY INVOKER SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.is_ceo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_ceo() TO authenticated, service_role;

ALTER FUNCTION public.is_manager() SECURITY INVOKER SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.is_manager() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_manager() TO authenticated, service_role;

-- 2.4 RPC Business Functions: Convert safe routines to SECURITY INVOKER with role guards
ALTER FUNCTION public.pos_decrement_stock(uuid, numeric, text, text, text, text, timestamp with time zone) 
  SECURITY INVOKER SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.pos_decrement_stock(uuid, numeric, text, text, text, text, timestamp with time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pos_decrement_stock(uuid, numeric, text, text, text, text, timestamp with time zone) TO authenticated, service_role;

ALTER FUNCTION public.approve_purchase_order(uuid, text, text, text, text, text, text) 
  SECURITY INVOKER SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.approve_purchase_order(uuid, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_purchase_order(uuid, text, text, text, text, text, text) TO authenticated, service_role;

ALTER FUNCTION public.reject_purchase_order(uuid, text, text, text, text, text, text) 
  SECURITY INVOKER SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.reject_purchase_order(uuid, text, text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_purchase_order(uuid, text, text, text, text, text, text) TO authenticated, service_role;

ALTER FUNCTION public.get_financial_metrics(text, timestamp without time zone, timestamp without time zone, text) 
  SECURITY INVOKER SET search_path = public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.get_financial_metrics(text, timestamp without time zone, timestamp without time zone, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_financial_metrics(text, timestamp without time zone, timestamp without time zone, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.increment_discount_usage(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_discount_usage(text) TO authenticated, service_role;


-- ============================================================================
-- SECTION 3: RLS POLICIES FOR TABLES WITH ZERO POLICIES (SEC-0008)
-- ============================================================================

-- 3.1 payment_runs
ALTER TABLE public.payment_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_runs_select" ON public.payment_runs;
CREATE POLICY "payment_runs_select" ON public.payment_runs
FOR SELECT TO authenticated
USING (
  (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'admin', 'finance_manager', 'auditor']))
  OR (country_code = (SELECT get_my_country_code()))
);

DROP POLICY IF EXISTS "payment_runs_insert" ON public.payment_runs;
CREATE POLICY "payment_runs_insert" ON public.payment_runs
FOR INSERT TO authenticated
WITH CHECK (
  (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'admin', 'finance_manager']))
  AND (
    (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') IN ('super_admin', 'CEO'))
    OR (country_code = (SELECT get_my_country_code()))
  )
);

DROP POLICY IF EXISTS "payment_runs_update" ON public.payment_runs;
CREATE POLICY "payment_runs_update" ON public.payment_runs
FOR UPDATE TO authenticated
USING (
  (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'admin', 'finance_manager']))
  AND (
    (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') IN ('super_admin', 'CEO'))
    OR (country_code = (SELECT get_my_country_code()))
  )
);

DROP POLICY IF EXISTS "payment_runs_delete" ON public.payment_runs;
CREATE POLICY "payment_runs_delete" ON public.payment_runs
FOR DELETE TO authenticated
USING (
  COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO'])
);

-- 3.2 invoice_items (Foreign key to vendor_invoices)
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoice_items_select" ON public.invoice_items;
CREATE POLICY "invoice_items_select" ON public.invoice_items
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_invoices vi
    WHERE vi.id = invoice_items.invoice_id
    AND (
      (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'admin', 'finance_manager', 'procurement_manager', 'auditor']))
      OR (vi.country_code = (SELECT get_my_country_code()))
    )
  )
);

DROP POLICY IF EXISTS "invoice_items_insert" ON public.invoice_items;
CREATE POLICY "invoice_items_insert" ON public.invoice_items
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendor_invoices vi
    WHERE vi.id = invoice_items.invoice_id
    AND (
      (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'admin', 'finance_manager', 'procurement_manager']))
      OR (vi.country_code = (SELECT get_my_country_code()))
    )
  )
);

DROP POLICY IF EXISTS "invoice_items_update" ON public.invoice_items;
CREATE POLICY "invoice_items_update" ON public.invoice_items
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_invoices vi
    WHERE vi.id = invoice_items.invoice_id
    AND (
      (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'admin', 'finance_manager', 'procurement_manager']))
      OR (vi.country_code = (SELECT get_my_country_code()))
    )
  )
);

DROP POLICY IF EXISTS "invoice_items_delete" ON public.invoice_items;
CREATE POLICY "invoice_items_delete" ON public.invoice_items
FOR DELETE TO authenticated
USING (
  COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'finance_manager'])
);

-- 3.3 journal_lines (Foreign key to journal_entries)
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "journal_lines_select" ON public.journal_lines;
CREATE POLICY "journal_lines_select" ON public.journal_lines
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.journal_entries je
    WHERE je.id = journal_lines.journal_id
    AND (
      (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'admin', 'finance_manager', 'auditor']))
      OR (je.country_code = (SELECT get_my_country_code()))
    )
  )
);

DROP POLICY IF EXISTS "journal_lines_insert" ON public.journal_lines;
CREATE POLICY "journal_lines_insert" ON public.journal_lines
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.journal_entries je
    WHERE je.id = journal_lines.journal_id
    AND (
      (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'admin', 'finance_manager']))
      OR (je.country_code = (SELECT get_my_country_code()))
    )
  )
);

DROP POLICY IF EXISTS "journal_lines_update" ON public.journal_lines;
CREATE POLICY "journal_lines_update" ON public.journal_lines
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.journal_entries je
    WHERE je.id = journal_lines.journal_id
    AND (
      (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'admin', 'finance_manager']))
      OR (je.country_code = (SELECT get_my_country_code()))
    )
  )
);

DROP POLICY IF EXISTS "journal_lines_delete" ON public.journal_lines;
CREATE POLICY "journal_lines_delete" ON public.journal_lines
FOR DELETE TO authenticated
USING (
  COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'finance_manager'])
);


-- ============================================================================
-- SECTION 4: ELIMINATE MULTIPLE PERMISSIVE POLICIES (PERF-0006)
-- ============================================================================

-- 4.1 Drop legacy open public policies that bypass authentication
DROP POLICY IF EXISTS "Allow public read on agents" ON public.agents;
DROP POLICY IF EXISTS "Allow public manage on agents" ON public.agents;

DROP POLICY IF EXISTS "Allow public read on agent_deposits" ON public.agent_deposits;
DROP POLICY IF EXISTS "Allow public manage on agent_deposits" ON public.agent_deposits;

DROP POLICY IF EXISTS "Allow public read on deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Allow public insert on deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Allow public update on deliveries" ON public.deliveries;

DROP POLICY IF EXISTS "Allow public read on drivers" ON public.drivers;
DROP POLICY IF EXISTS "Allow public insert on drivers" ON public.drivers;
DROP POLICY IF EXISTS "Allow public update on drivers" ON public.drivers;
DROP POLICY IF EXISTS "Allow public delete on drivers" ON public.drivers;

DROP POLICY IF EXISTS "Allow public read on trips" ON public.trips;
DROP POLICY IF EXISTS "Allow public insert on trips" ON public.trips;
DROP POLICY IF EXISTS "Allow public update on trips" ON public.trips;

-- 4.2 Consolidate duplicate SELECT policies on agent_deposits into single policy
DROP POLICY IF EXISTS "Users read own agent deposits" ON public.agent_deposits;
DROP POLICY IF EXISTS "Agents read their deposits" ON public.agent_deposits;
CREATE POLICY "agent_deposits_select" ON public.agent_deposits
FOR SELECT TO authenticated
USING (
  (((SELECT auth.jwt()) ->> 'role') = 'service_role')
  OR user_id = (SELECT users.id FROM users WHERE users.auth_id = (SELECT auth.uid()))
  OR EXISTS (
    SELECT 1 FROM agents a
    JOIN users u ON u.id = agent_deposits.user_id
    WHERE a.id = agent_deposits.agent_id
      AND u.auth_id = (SELECT auth.uid())
  )
);

-- 4.3 Restrict "*_write" policies from FOR ALL to FOR INSERT, UPDATE, DELETE
-- chart_of_accounts
DROP POLICY IF EXISTS "coa_write" ON public.chart_of_accounts;
CREATE POLICY "coa_write" ON public.chart_of_accounts
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
-- Note: Replace with non-overlapping mutation policy
DROP POLICY IF EXISTS "coa_write" ON public.chart_of_accounts;
CREATE POLICY "coa_insert" ON public.chart_of_accounts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "coa_update" ON public.chart_of_accounts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "coa_delete" ON public.chart_of_accounts FOR DELETE TO authenticated USING (true);

-- disciplinary_records
DROP POLICY IF EXISTS "disciplinary_write" ON public.disciplinary_records;
CREATE POLICY "disciplinary_insert" ON public.disciplinary_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "disciplinary_update" ON public.disciplinary_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "disciplinary_delete" ON public.disciplinary_records FOR DELETE TO authenticated USING (true);

-- hr_country_policies
DROP POLICY IF EXISTS "hr_policies_write" ON public.hr_country_policies;
CREATE POLICY "hr_policies_insert" ON public.hr_country_policies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "hr_policies_update" ON public.hr_country_policies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "hr_policies_delete" ON public.hr_country_policies FOR DELETE TO authenticated USING (true);

-- job_candidates
DROP POLICY IF EXISTS "job_candidates_write" ON public.job_candidates;
CREATE POLICY "job_candidates_insert" ON public.job_candidates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "job_candidates_update" ON public.job_candidates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "job_candidates_delete" ON public.job_candidates FOR DELETE TO authenticated USING (true);

-- job_requisitions
DROP POLICY IF EXISTS "job_reqs_write" ON public.job_requisitions;
CREATE POLICY "job_reqs_insert" ON public.job_requisitions FOR INSERT TO authenticated WITH CHECK ((approved_by IS NULL) OR (approved_by <> requested_by));
CREATE POLICY "job_reqs_update" ON public.job_requisitions FOR UPDATE TO authenticated USING (true) WITH CHECK ((approved_by IS NULL) OR (approved_by <> requested_by));
CREATE POLICY "job_reqs_delete" ON public.job_requisitions FOR DELETE TO authenticated USING (true);

-- journal_entries
DROP POLICY IF EXISTS "journal_entries_write" ON public.journal_entries;
CREATE POLICY "journal_entries_insert" ON public.journal_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "journal_entries_update" ON public.journal_entries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "journal_entries_delete" ON public.journal_entries FOR DELETE TO authenticated USING (true);

-- performance_reviews
DROP POLICY IF EXISTS "perf_reviews_write" ON public.performance_reviews;
CREATE POLICY "perf_reviews_insert" ON public.performance_reviews FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "perf_reviews_update" ON public.performance_reviews FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "perf_reviews_delete" ON public.performance_reviews FOR DELETE TO authenticated USING (true);

-- training_records
DROP POLICY IF EXISTS "training_records_write" ON public.training_records;
CREATE POLICY "training_records_insert" ON public.training_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "training_records_update" ON public.training_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "training_records_delete" ON public.training_records FOR DELETE TO authenticated USING (true);

-- vendor_invoices
DROP POLICY IF EXISTS "vendor_invoices_write" ON public.vendor_invoices;
CREATE POLICY "vendor_invoices_insert" ON public.vendor_invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vendor_invoices_update" ON public.vendor_invoices FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vendor_invoices_delete" ON public.vendor_invoices FOR DELETE TO authenticated USING (true);

-- logistics_zones: replace all_logistics_zones (FOR ALL) with mutations only
DROP POLICY IF EXISTS "all_logistics_zones" ON public.logistics_zones;
CREATE POLICY "logistics_zones_insert" ON public.logistics_zones
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.role::text = ANY (ARRAY['super_admin', 'admin', 'wms_manager', 'inventory_manager'])
  )
);

CREATE POLICY "logistics_zones_update" ON public.logistics_zones
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.role::text = ANY (ARRAY['super_admin', 'admin', 'wms_manager', 'inventory_manager'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.role::text = ANY (ARRAY['super_admin', 'admin', 'wms_manager', 'inventory_manager'])
  )
);

CREATE POLICY "logistics_zones_delete" ON public.logistics_zones
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.role::text = ANY (ARRAY['super_admin', 'admin', 'wms_manager', 'inventory_manager'])
  )
);


-- ============================================================================
-- SECTION 5: INITPLAN PERFORMANCE OPTIMIZATIONS (PERF-0003)
-- ============================================================================

-- 5.1 sales
DROP POLICY IF EXISTS "sales_read" ON public.sales;
DROP POLICY IF EXISTS "sales_isolation_select" ON public.sales;
CREATE POLICY "sales_isolation_select" ON public.sales
FOR SELECT TO authenticated
USING (
  (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'admin']))
  OR (
    site_id IN (
      SELECT s.id FROM sites s
      WHERE s.country::text = (
        SELECT COALESCE(s2.country::text, 'ET')
        FROM sites s2
        WHERE s2.id = (
          SELECT e.site_id FROM employees e
          WHERE e.id = (SELECT auth.uid())
          LIMIT 1
        )
      )
    )
  )
);

-- 5.2 purchase_orders
DROP POLICY IF EXISTS "po_zero_trust_select" ON public.purchase_orders;
CREATE POLICY "po_zero_trust_select" ON public.purchase_orders
FOR SELECT TO authenticated
USING (
  (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'admin', 'procurement_manager', 'finance_manager', 'operations_manager', 'regional_manager', 'buyer', 'demand_planner', 'vendor_relations_manager', 'replenishment_planner', 'supply_chain_manager']))
  OR country_code::text = (
    SELECT COALESCE(s.country::text, 'ET')
    FROM sites s
    WHERE s.id = (
      SELECT e.site_id FROM employees e
      WHERE e.id = (SELECT auth.uid())
      LIMIT 1
    )
  )
  OR site_id IN (
    SELECT s2.id FROM sites s2
    WHERE s2.country::text = (
      SELECT COALESCE(s3.country::text, 'ET')
      FROM sites s3
      WHERE s3.id = (
        SELECT e2.site_id FROM employees e2
        WHERE e2.id = (SELECT auth.uid())
        LIMIT 1
      )
    )
  )
);

DROP POLICY IF EXISTS "po_zero_trust_insert" ON public.purchase_orders;
CREATE POLICY "po_zero_trust_insert" ON public.purchase_orders
FOR INSERT TO authenticated
WITH CHECK (
  ((COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'admin', 'procurement_manager', 'buyer', 'supply_chain_manager', 'operations_manager', 'regional_manager']))
  OR EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.role::text = ANY (ARRAY['super_admin', 'procurement_manager', 'buyer', 'operations_manager', 'regional_manager'])
  ))
  AND (site_id IS NULL OR site_id IN (
    SELECT sites.id FROM sites
    WHERE sites.type::text = ANY (ARRAY['Warehouse', 'Distribution Center'])
  ))
);

DROP POLICY IF EXISTS "po_zero_trust_update" ON public.purchase_orders;
CREATE POLICY "po_zero_trust_update" ON public.purchase_orders
FOR UPDATE TO authenticated
USING (
  ((COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'admin', 'procurement_manager', 'finance_manager', 'operations_manager', 'regional_manager', 'buyer', 'warehouse_manager', 'receiver', 'inventory_specialist']))
  OR EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.role::text = ANY (ARRAY['super_admin', 'procurement_manager', 'finance_manager', 'operations_manager', 'regional_manager', 'buyer', 'warehouse_manager', 'receiver', 'inventory_specialist'])
  )
  OR (SELECT is_manager())
  OR (SELECT is_admin()))
);

DROP POLICY IF EXISTS "po_zero_trust_delete" ON public.purchase_orders;
CREATE POLICY "po_zero_trust_delete" ON public.purchase_orders
FOR DELETE TO authenticated
USING (
  (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO']))
  OR EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.role::text = 'super_admin'
  )
);

-- 5.3 shifts
DROP POLICY IF EXISTS "shifts_read" ON public.shifts;
DROP POLICY IF EXISTS "shifts_select_policy" ON public.shifts;
CREATE POLICY "shifts_select_policy" ON public.shifts
FOR SELECT TO authenticated
USING (
  ((SELECT COALESCE(get_my_role(), ((SELECT auth.jwt()) ->> 'role'))) = ANY (ARRAY['super_admin', 'admin', 'CEO', 'finance_manager', 'auditor', 'operations_manager', 'regional_manager']))
  OR site_id::text = (SELECT get_my_site_code_or_id())
  OR site_id = (
    SELECT e.site_id FROM employees e
    WHERE e.id = (SELECT auth.uid())
    LIMIT 1
  )
  OR site_id IS NULL
);

DROP POLICY IF EXISTS "shifts_update" ON public.shifts;
DROP POLICY IF EXISTS "shifts_update_policy" ON public.shifts;
CREATE POLICY "shifts_update_policy" ON public.shifts
FOR UPDATE TO authenticated
USING (
  ((SELECT COALESCE(get_my_role(), ((SELECT auth.jwt()) ->> 'role'))) = ANY (ARRAY['super_admin', 'admin', 'CEO', 'finance_manager', 'auditor', 'operations_manager', 'store_manager']))
  OR cashier_id = (SELECT auth.uid())
  OR cashier_id::text = (
    SELECT employees.code FROM employees
    WHERE employees.id = (SELECT auth.uid())
    LIMIT 1
  )
);

DROP POLICY IF EXISTS "shifts_delete" ON public.shifts;
DROP POLICY IF EXISTS "shifts_delete_policy" ON public.shifts;
CREATE POLICY "shifts_delete_policy" ON public.shifts
FOR DELETE TO authenticated
USING (
  (SELECT COALESCE(get_my_role(), ((SELECT auth.jwt()) ->> 'role'))) = ANY (ARRAY['super_admin', 'admin', 'CEO'])
);

-- 5.4 barcode_approvals
DROP POLICY IF EXISTS "barcode_approvals_read" ON public.barcode_approvals;
DROP POLICY IF EXISTS "barcode_approvals_country_isolation_select" ON public.barcode_approvals;
CREATE POLICY "barcode_approvals_country_isolation_select" ON public.barcode_approvals
FOR SELECT TO authenticated
USING (
  (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'admin']))
  OR site_id::text IN (
    SELECT sites.id::text FROM sites
    WHERE sites.country::text = ((SELECT auth.jwt()) ->> 'country_code')
       OR ((SELECT auth.jwt()) ->> 'country_code') IS NULL
  )
);

-- 5.5 discount_codes
DROP POLICY IF EXISTS "discount_codes_insert_policy" ON public.discount_codes;
CREATE POLICY "discount_codes_insert_policy" ON public.discount_codes
FOR INSERT TO authenticated
WITH CHECK (
  COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'admin', 'CEO', 'finance_manager', 'operations_manager'])
);

DROP POLICY IF EXISTS "discount_codes_update_policy" ON public.discount_codes;
CREATE POLICY "discount_codes_update_policy" ON public.discount_codes
FOR UPDATE TO authenticated
USING (
  COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'admin', 'CEO', 'finance_manager', 'operations_manager'])
)
WITH CHECK (
  COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'admin', 'CEO', 'finance_manager', 'operations_manager'])
);

DROP POLICY IF EXISTS "discount_codes_delete_policy" ON public.discount_codes;
CREATE POLICY "discount_codes_delete_policy" ON public.discount_codes
FOR DELETE TO authenticated
USING (
  COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'admin', 'CEO'])
);

-- 5.6 inbound_qc_inspections
DROP POLICY IF EXISTS "qc_inspections_insert" ON public.inbound_qc_inspections;
CREATE POLICY "qc_inspections_insert" ON public.inbound_qc_inspections
FOR INSERT TO authenticated
WITH CHECK (
  (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'inbound_qc_inspector', 'warehouse_manager', 'inventory_manager', 'procurement_manager']))
  OR EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.role::text = ANY (ARRAY['super_admin', 'inbound_qc_inspector', 'warehouse_manager', 'inventory_manager', 'procurement_manager'])
  )
);

DROP POLICY IF EXISTS "qc_inspections_update" ON public.inbound_qc_inspections;
CREATE POLICY "qc_inspections_update" ON public.inbound_qc_inspections
FOR UPDATE TO authenticated
USING (
  COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'inbound_qc_inspector', 'warehouse_manager', 'inventory_manager'])
);

-- 5.7 customs_declarations
DROP POLICY IF EXISTS "customs_insert" ON public.customs_declarations;
CREATE POLICY "customs_insert" ON public.customs_declarations
FOR INSERT TO authenticated
WITH CHECK (
  (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'customs_import_specialist', 'procurement_manager', 'supply_chain_manager']))
  OR EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.role::text = ANY (ARRAY['super_admin', 'customs_import_specialist', 'procurement_manager', 'supply_chain_manager'])
  )
);

DROP POLICY IF EXISTS "customs_update" ON public.customs_declarations;
CREATE POLICY "customs_update" ON public.customs_declarations
FOR UPDATE TO authenticated
USING (
  COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'customs_import_specialist', 'procurement_manager', 'supply_chain_manager'])
);

-- 5.8 farmer_programs
DROP POLICY IF EXISTS "farmer_programs_insert" ON public.farmer_programs;
CREATE POLICY "farmer_programs_insert" ON public.farmer_programs
FOR INSERT TO authenticated
WITH CHECK (
  (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'procurement_manager', 'vendor_relations_manager']))
  OR EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.role::text = ANY (ARRAY['super_admin', 'procurement_manager', 'vendor_relations_manager'])
  )
);

DROP POLICY IF EXISTS "farmer_programs_update" ON public.farmer_programs;
CREATE POLICY "farmer_programs_update" ON public.farmer_programs
FOR UPDATE TO authenticated
USING (
  COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'procurement_manager', 'vendor_relations_manager'])
);

-- 5.9 vendor_contracts
DROP POLICY IF EXISTS "contracts_insert" ON public.vendor_contracts;
CREATE POLICY "contracts_insert" ON public.vendor_contracts
FOR INSERT TO authenticated
WITH CHECK (
  (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'procurement_manager', 'vendor_relations_manager', 'finance_manager']))
  OR EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.role::text = ANY (ARRAY['super_admin', 'procurement_manager', 'vendor_relations_manager', 'finance_manager'])
  )
);

DROP POLICY IF EXISTS "contracts_update" ON public.vendor_contracts;
CREATE POLICY "contracts_update" ON public.vendor_contracts
FOR UPDATE TO authenticated
USING (
  COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'procurement_manager', 'vendor_relations_manager', 'finance_manager'])
);

-- 5.10 vendor_scorecards
DROP POLICY IF EXISTS "scorecards_insert" ON public.vendor_scorecards;
CREATE POLICY "scorecards_insert" ON public.vendor_scorecards
FOR INSERT TO authenticated
WITH CHECK (
  (COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'procurement_manager', 'vendor_relations_manager']))
  OR EXISTS (
    SELECT 1 FROM employees e
    WHERE e.id = (SELECT auth.uid())
      AND e.role::text = ANY (ARRAY['super_admin', 'procurement_manager', 'vendor_relations_manager'])
  )
);

DROP POLICY IF EXISTS "scorecards_update" ON public.vendor_scorecards;
CREATE POLICY "scorecards_update" ON public.vendor_scorecards
FOR UPDATE TO authenticated
USING (
  COALESCE(((SELECT auth.jwt()) ->> 'role'), '') = ANY (ARRAY['super_admin', 'CEO', 'procurement_manager', 'vendor_relations_manager'])
);

-- 5.11 suppliers
DROP POLICY IF EXISTS "suppliers_select" ON public.suppliers;
CREATE POLICY "suppliers_select" ON public.suppliers
FOR SELECT TO authenticated
USING (
  ((SELECT COALESCE(get_my_role(), ((SELECT auth.jwt()) ->> 'role'), '')) = ANY (ARRAY['super_admin', 'CEO', 'admin', 'auditor']))
  OR country_code IS NULL
  OR country_code = ''
  OR country_code = (SELECT get_my_country_code())
);

DROP POLICY IF EXISTS "suppliers_insert" ON public.suppliers;
CREATE POLICY "suppliers_insert" ON public.suppliers
FOR INSERT TO authenticated
WITH CHECK (
  ((SELECT COALESCE(get_my_role(), ((SELECT auth.jwt()) ->> 'role'), '')) = ANY (ARRAY['super_admin', 'CEO', 'admin', 'procurement_manager', 'vendor_relations_manager', 'supply_chain_manager', 'buyer', 'finance_manager', 'operations_manager', 'regional_manager', 'store_manager', 'inventory_specialist']))
  OR (SELECT auth.uid()) IS NOT NULL
);

DROP POLICY IF EXISTS "suppliers_update" ON public.suppliers;
CREATE POLICY "suppliers_update" ON public.suppliers
FOR UPDATE TO authenticated
USING (
  ((SELECT COALESCE(get_my_role(), ((SELECT auth.jwt()) ->> 'role'), '')) = ANY (ARRAY['super_admin', 'CEO', 'admin', 'procurement_manager', 'vendor_relations_manager', 'supply_chain_manager', 'buyer', 'finance_manager', 'operations_manager', 'regional_manager', 'store_manager']))
  OR (SELECT auth.uid()) IS NOT NULL
);

DROP POLICY IF EXISTS "suppliers_delete" ON public.suppliers;
CREATE POLICY "suppliers_delete" ON public.suppliers
FOR DELETE TO authenticated
USING (
  (SELECT COALESCE(get_my_role(), ((SELECT auth.jwt()) ->> 'role'), '')) = ANY (ARRAY['super_admin', 'CEO', 'admin'])
);

-- 5.12 employees
DROP POLICY IF EXISTS "employees_update_admin" ON public.employees;
CREATE POLICY "employees_update_admin" ON public.employees
FOR UPDATE TO authenticated
USING (
  (SELECT is_admin())
  OR ((SELECT is_manager()) AND site_id = (SELECT get_my_site_id()))
  OR id = (SELECT auth.uid())
  OR email = ((SELECT auth.jwt()) ->> 'email')
);
