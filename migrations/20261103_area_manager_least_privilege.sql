-- Intersect existing permissive RLS policies with the assigned-store boundary.
-- The Area Manager may supervise only their retail cluster, never a whole region
-- merely because a row has the same region_code.
BEGIN;

DO $policy$
DECLARE
  item record;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('sales', 'site_id', 'country_code'),
      ('shifts', 'site_id', 'country_code'),
      ('expenses', 'site_id', 'country_code'),
      ('purchase_orders', 'site_id', 'country_code'),
      ('products', 'site_id', NULL),
      ('leave_requests', 'site_id', 'country_code'),
      ('facility_headcount_quotas', 'site_id', 'country_code'),
      ('headcount_quota_requests', 'site_id', 'country_code'),
      ('pos_supervisory_overrides', 'site_id', 'country_code'),
      ('inventory_requests', 'site_id', 'country_code'),
      ('employee_change_requests', 'site_id', 'country_code')
    ) AS policy_table(table_name, site_column, country_column)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS area_manager_store_read_guard ON public.%I', item.table_name);
    EXECUTE format(
      'CREATE POLICY area_manager_store_read_guard ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING
       (public.normalize_role(public.get_my_role()) <> ''area_operations_manager'' OR
        private.area_store_scope(%I::text, %s))',
      item.table_name, item.site_column,
      CASE WHEN item.country_column IS NULL THEN 'NULL'
           ELSE format('%I::text', item.country_column) END
    );
  END LOOP;
END;
$policy$;

DROP POLICY IF EXISTS area_manager_employee_read_guard ON public.employees;
CREATE POLICY area_manager_employee_read_guard ON public.employees AS RESTRICTIVE
FOR SELECT TO authenticated USING (
  public.normalize_role(public.get_my_role()) <> 'area_operations_manager'
  OR id = auth.uid()
  OR private.area_store_scope(site_id::text)
);

DROP POLICY IF EXISTS area_manager_transfer_read_guard ON public.transfers;
CREATE POLICY area_manager_transfer_read_guard ON public.transfers AS RESTRICTIVE
FOR SELECT TO authenticated USING (
  public.normalize_role(public.get_my_role()) <> 'area_operations_manager'
  OR private.area_store_scope(source_site_id::text, country_code)
  OR private.area_store_scope(dest_site_id::text, country_code)
);

-- These records are outside retail-cluster oversight or expose unrelated staff
-- and customer details. Area Managers use scoped operating summaries instead.
DO $policy$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'employee_documents', 'payroll_runs', 'system_logs', 'wms_jobs', 'customers'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS area_manager_sensitive_read_guard ON public.%I', table_name);
    EXECUTE format(
      'CREATE POLICY area_manager_sensitive_read_guard ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING
       (public.normalize_role(public.get_my_role()) <> ''area_operations_manager'')', table_name
    );
  END LOOP;
END;
$policy$;

-- Area Managers inspect these workflows but cannot perform their direct writes.
-- The existing operational/finance/warehouse approvers retain their policies.
DO $policy$
DECLARE
  table_name text;
  operation text;
  policy_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'products', 'sales', 'shifts', 'expenses', 'purchase_orders',
    'wms_jobs', 'employee_documents', 'payroll_runs', 'leave_requests',
    'headcount_quota_requests', 'customers', 'system_config'
  ] LOOP
    FOREACH operation IN ARRAY ARRAY['INSERT', 'UPDATE', 'DELETE'] LOOP
      policy_name := 'area_manager_' || lower(operation) || '_guard';
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);
      IF operation = 'INSERT' THEN
        EXECUTE format(
          'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR INSERT TO authenticated
           WITH CHECK (public.normalize_role(public.get_my_role()) <> ''area_operations_manager'')',
          policy_name, table_name
        );
      ELSIF operation = 'UPDATE' THEN
        EXECUTE format(
          'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR UPDATE TO authenticated
           USING (public.normalize_role(public.get_my_role()) <> ''area_operations_manager'')
           WITH CHECK (public.normalize_role(public.get_my_role()) <> ''area_operations_manager'')',
          policy_name, table_name
        );
      ELSE
        EXECUTE format(
          'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR DELETE TO authenticated
           USING (public.normalize_role(public.get_my_role()) <> ''area_operations_manager'')',
          policy_name, table_name
        );
      END IF;
    END LOOP;
  END LOOP;
END;
$policy$;

-- Assigned-store transfers are allowed only when both ends of the transfer are
-- in the manager's cluster. This closes the country-wide role OR in the older
-- permissive transfer policies while retaining intra-cluster coordination.
DROP POLICY IF EXISTS area_manager_transfer_insert_guard ON public.transfers;
CREATE POLICY area_manager_transfer_insert_guard ON public.transfers AS RESTRICTIVE
FOR INSERT TO authenticated WITH CHECK (
  public.normalize_role(public.get_my_role()) <> 'area_operations_manager'
  OR (private.area_store_scope(source_site_id::text, country_code)
      AND private.area_store_scope(dest_site_id::text, country_code))
);

DROP POLICY IF EXISTS area_manager_transfer_update_guard ON public.transfers;
CREATE POLICY area_manager_transfer_update_guard ON public.transfers AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (
  public.normalize_role(public.get_my_role()) <> 'area_operations_manager'
  OR (private.area_store_scope(source_site_id::text, country_code)
      AND private.area_store_scope(dest_site_id::text, country_code))
)
WITH CHECK (
  public.normalize_role(public.get_my_role()) <> 'area_operations_manager'
  OR (private.area_store_scope(source_site_id::text, country_code)
      AND private.area_store_scope(dest_site_id::text, country_code))
);

DROP POLICY IF EXISTS area_manager_employee_insert_guard ON public.employees;
CREATE POLICY area_manager_employee_insert_guard ON public.employees AS RESTRICTIVE
FOR INSERT TO authenticated WITH CHECK (
  public.normalize_role(public.get_my_role()) <> 'area_operations_manager'
  OR (private.area_store_scope(site_id::text)
      AND role IN ('store_manager', 'assistant_store_manager', 'shift_supervisor',
                   'pos_supervisor', 'stock_control_supervisor', 'cashier',
                   'sales_associate', 'store_associate', 'customer_service',
                   'merchandiser', 'stock_clerk', 'loss_prevention'))
);

DROP POLICY IF EXISTS area_manager_employee_update_guard ON public.employees;
CREATE POLICY area_manager_employee_update_guard ON public.employees AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (
  public.normalize_role(public.get_my_role()) <> 'area_operations_manager'
  OR (private.area_store_scope(site_id::text)
      AND role IN ('store_manager', 'assistant_store_manager', 'shift_supervisor',
                   'pos_supervisor', 'stock_control_supervisor', 'cashier',
                   'sales_associate', 'store_associate', 'customer_service',
                   'merchandiser', 'stock_clerk', 'loss_prevention'))
)
WITH CHECK (
  public.normalize_role(public.get_my_role()) <> 'area_operations_manager'
  OR (private.area_store_scope(site_id::text)
      AND role IN ('store_manager', 'assistant_store_manager', 'shift_supervisor',
                   'pos_supervisor', 'stock_control_supervisor', 'cashier',
                   'sales_associate', 'store_associate', 'customer_service',
                   'merchandiser', 'stock_clerk', 'loss_prevention'))
);

COMMIT;
