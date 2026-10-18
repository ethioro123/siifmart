-- Tenant boundary and anonymous RPC hardening. Requires the preceding identity migration.

-- A permissive SELECT policy is OR-ed with every other policy. Remove the
-- authenticated-only transfer policy that bypassed the sovereign rule.
DROP POLICY IF EXISTS transfers_read ON public.transfers;

-- Scope site-bearing operational data to the user's country and site/manager scope.
DROP POLICY IF EXISTS stock_movements_read ON public.stock_movements;
CREATE POLICY stock_movements_read_scoped ON public.stock_movements
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sites s
    WHERE s.id = stock_movements.site_id
      AND upper(s.country) = upper(public.get_my_country_code())
      AND (public.is_ceo() OR public.is_manager() OR s.id = public.get_my_site_id())
  )
);
DROP POLICY IF EXISTS stock_movements_insert ON public.stock_movements;
CREATE POLICY stock_movements_insert_scoped ON public.stock_movements
FOR INSERT TO authenticated
WITH CHECK (
  (public.is_admin() OR public.is_manager())
  AND public.is_site_in_my_authorized_scope(stock_movements.site_id::text, NULL)
);
-- Stock movements are an append-only ledger; corrections use a compensating movement.
DROP POLICY IF EXISTS stock_movements_update ON public.stock_movements;
DROP POLICY IF EXISTS stock_movements_delete ON public.stock_movements;

DROP POLICY IF EXISTS zones_read ON public.warehouse_zones;
CREATE POLICY zones_read_scoped ON public.warehouse_zones
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sites s
    WHERE s.id = warehouse_zones.site_id
      AND upper(s.country) = upper(public.get_my_country_code())
      AND (public.is_ceo() OR public.is_manager() OR s.id = public.get_my_site_id())
  )
);
DROP POLICY IF EXISTS zones_write ON public.warehouse_zones;
CREATE POLICY zones_write_scoped ON public.warehouse_zones
FOR INSERT TO authenticated
WITH CHECK (
  (public.is_admin() OR public.is_manager())
  AND public.is_site_in_my_authorized_scope(warehouse_zones.site_id::text, NULL)
);
DROP POLICY IF EXISTS zones_update ON public.warehouse_zones;
CREATE POLICY zones_update_scoped ON public.warehouse_zones
FOR UPDATE TO authenticated
USING (
  (public.is_admin() OR public.is_manager())
  AND public.is_site_in_my_authorized_scope(warehouse_zones.site_id::text, NULL)
)
WITH CHECK (
  (public.is_admin() OR public.is_manager())
  AND public.is_site_in_my_authorized_scope(warehouse_zones.site_id::text, NULL)
);
DROP POLICY IF EXISTS zones_delete ON public.warehouse_zones;
CREATE POLICY zones_delete_scoped ON public.warehouse_zones
FOR DELETE TO authenticated
USING (
  public.is_admin()
  AND public.is_site_in_my_authorized_scope(warehouse_zones.site_id::text, NULL)
);

DROP POLICY IF EXISTS staff_schedules_read ON public.staff_schedules;
CREATE POLICY staff_schedules_read_scoped ON public.staff_schedules
FOR SELECT TO authenticated
USING (
  upper(staff_schedules.country_code) = upper(public.get_my_country_code())
  AND (public.is_ceo() OR public.is_manager() OR staff_schedules.site_id = public.get_my_site_id())
);
DROP POLICY IF EXISTS staff_schedules_insert ON public.staff_schedules;
CREATE POLICY staff_schedules_insert_scoped ON public.staff_schedules
FOR INSERT TO authenticated
WITH CHECK (
  public.is_manager()
  AND upper(staff_schedules.country_code) = upper(public.get_my_country_code())
  AND public.is_site_in_my_authorized_scope(staff_schedules.site_id::text, staff_schedules.country_code)
);
DROP POLICY IF EXISTS staff_schedules_update ON public.staff_schedules;
CREATE POLICY staff_schedules_update_scoped ON public.staff_schedules
FOR UPDATE TO authenticated
USING (
  public.is_manager()
  AND upper(staff_schedules.country_code) = upper(public.get_my_country_code())
  AND public.is_site_in_my_authorized_scope(staff_schedules.site_id::text, staff_schedules.country_code)
)
WITH CHECK (
  public.is_manager()
  AND upper(staff_schedules.country_code) = upper(public.get_my_country_code())
  AND public.is_site_in_my_authorized_scope(staff_schedules.site_id::text, staff_schedules.country_code)
);
DROP POLICY IF EXISTS staff_schedules_delete ON public.staff_schedules;
CREATE POLICY staff_schedules_delete_scoped ON public.staff_schedules
FOR DELETE TO authenticated
USING (
  public.is_manager()
  AND upper(staff_schedules.country_code) = upper(public.get_my_country_code())
  AND public.is_site_in_my_authorized_scope(staff_schedules.site_id::text, staff_schedules.country_code)
);

DROP POLICY IF EXISTS store_points_read ON public.store_points;
CREATE POLICY store_points_read_scoped ON public.store_points
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sites s
    WHERE (s.id::text = store_points.site_id OR s.code = store_points.site_id)
      AND upper(s.country) = upper(public.get_my_country_code())
      AND (public.is_ceo() OR public.is_manager() OR s.id::text = public.get_my_site_id()::text)
  )
);
DROP POLICY IF EXISTS store_points_insert ON public.store_points;
CREATE POLICY store_points_insert_scoped ON public.store_points
FOR INSERT TO authenticated
WITH CHECK (
  public.is_manager()
  AND public.is_site_in_my_authorized_scope(store_points.site_id, NULL)
);
DROP POLICY IF EXISTS store_points_update ON public.store_points;
CREATE POLICY store_points_update_scoped ON public.store_points
FOR UPDATE TO authenticated
USING (
  public.is_manager()
  AND public.is_site_in_my_authorized_scope(store_points.site_id, NULL)
)
WITH CHECK (
  public.is_manager()
  AND public.is_site_in_my_authorized_scope(store_points.site_id, NULL)
);

DROP POLICY IF EXISTS products_read ON public.products;
CREATE POLICY products_read_scoped ON public.products
FOR SELECT TO authenticated
USING (
  products.site_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.sites s
    WHERE s.id = products.site_id
      AND upper(s.country) = upper(public.get_my_country_code())
      AND (public.is_ceo() OR public.is_manager() OR s.id = public.get_my_site_id())
  )
);
DROP POLICY IF EXISTS products_insert ON public.products;
CREATE POLICY products_insert_scoped ON public.products
FOR INSERT TO authenticated
WITH CHECK (
  public.is_admin()
  AND public.is_site_in_my_authorized_scope(products.site_id::text, NULL)
);

DROP POLICY IF EXISTS employee_tasks_read ON public.employee_tasks;
CREATE POLICY employee_tasks_read_scoped ON public.employee_tasks
FOR SELECT TO authenticated
USING (
  public.is_ceo()
  OR EXISTS (
    SELECT 1 FROM public.sites s
    WHERE (s.id::text = employee_tasks.site_id OR s.code = employee_tasks.site_id)
      AND upper(s.country) = upper(public.get_my_country_code())
      AND (public.is_manager() OR s.id::text = public.get_my_site_id()::text)
  )
  OR employee_tasks.assigned_to IN (auth.uid()::text, public.get_my_employee_id()::text)
);
DROP POLICY IF EXISTS employee_tasks_insert ON public.employee_tasks;
CREATE POLICY employee_tasks_insert_scoped ON public.employee_tasks
FOR INSERT TO authenticated
WITH CHECK (public.is_manager() AND public.is_site_in_my_authorized_scope(employee_tasks.site_id, NULL));
DROP POLICY IF EXISTS employee_tasks_update ON public.employee_tasks;
CREATE POLICY employee_tasks_update_scoped ON public.employee_tasks
FOR UPDATE TO authenticated
USING (
  (employee_tasks.assigned_to IN (auth.uid()::text, public.get_my_employee_id()::text)
   OR public.is_manager())
  AND public.is_site_in_my_authorized_scope(employee_tasks.site_id, NULL)
)
WITH CHECK (
  (employee_tasks.assigned_to IN (auth.uid()::text, public.get_my_employee_id()::text)
   OR public.is_manager())
  AND public.is_site_in_my_authorized_scope(employee_tasks.site_id, NULL)
);
DROP POLICY IF EXISTS employee_tasks_delete ON public.employee_tasks;
CREATE POLICY employee_tasks_delete_scoped ON public.employee_tasks
FOR DELETE TO authenticated
USING (public.is_manager() AND public.is_site_in_my_authorized_scope(employee_tasks.site_id, NULL));

DROP POLICY IF EXISTS job_assignments_read ON public.job_assignments;
CREATE POLICY job_assignments_read_scoped ON public.job_assignments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.wms_jobs j
    WHERE j.id = job_assignments.job_id
      AND upper(j.country_code) = upper(public.get_my_country_code())
      AND (
        public.is_site_in_my_authorized_scope(COALESCE(j.site_id,j.dest_site_id)::text, j.country_code)
        OR (job_assignments.employee_id = auth.uid()
            AND public.is_site_in_my_authorized_scope(COALESCE(j.site_id,j.dest_site_id)::text, j.country_code))
      )
  )
);
DROP POLICY IF EXISTS job_assignments_insert ON public.job_assignments;
CREATE POLICY job_assignments_insert_scoped ON public.job_assignments
FOR INSERT TO authenticated
WITH CHECK (
  public.is_manager()
  AND EXISTS (SELECT 1 FROM public.wms_jobs j
              WHERE j.id = job_assignments.job_id
                AND public.is_site_in_my_authorized_scope(j.site_id::text, j.country_code))
);
DROP POLICY IF EXISTS job_assignments_update ON public.job_assignments;
CREATE POLICY job_assignments_update_scoped ON public.job_assignments
FOR UPDATE TO authenticated
USING (
  (job_assignments.employee_id = auth.uid() OR public.is_manager())
  AND EXISTS (SELECT 1 FROM public.wms_jobs j
              WHERE j.id = job_assignments.job_id
                AND public.is_site_in_my_authorized_scope(j.site_id::text, j.country_code))
)
WITH CHECK (
  (job_assignments.employee_id = auth.uid() OR public.is_manager())
  AND EXISTS (SELECT 1 FROM public.wms_jobs j
              WHERE j.id = job_assignments.job_id
                AND public.is_site_in_my_authorized_scope(j.site_id::text, j.country_code))
);
DROP POLICY IF EXISTS job_assignments_delete ON public.job_assignments;
CREATE POLICY job_assignments_delete_scoped ON public.job_assignments
FOR DELETE TO authenticated
USING (
  public.is_manager()
  AND EXISTS (SELECT 1 FROM public.wms_jobs j
              WHERE j.id = job_assignments.job_id
                AND public.is_site_in_my_authorized_scope(j.site_id::text, j.country_code))
);

DROP POLICY IF EXISTS points_tx_read ON public.points_transactions;
CREATE POLICY points_tx_read_scoped ON public.points_transactions
FOR SELECT TO authenticated
USING (
  points_transactions.employee_id IN (auth.uid()::text, public.get_my_employee_id()::text)
  OR public.is_ceo()
);
DROP POLICY IF EXISTS worker_points_read ON public.worker_points;
CREATE POLICY worker_points_read_scoped ON public.worker_points
FOR SELECT TO authenticated
USING (
  public.is_site_in_my_authorized_scope(worker_points.site_id, NULL)
  AND (worker_points.employee_id IN (auth.uid()::text, public.get_my_employee_id()::text)
       OR public.is_manager() OR public.is_ceo())
);
DROP POLICY IF EXISTS worker_points_insert ON public.worker_points;
CREATE POLICY worker_points_insert_scoped ON public.worker_points
FOR INSERT TO authenticated
WITH CHECK (
  public.is_manager() AND public.is_site_in_my_authorized_scope(worker_points.site_id, NULL)
);
DROP POLICY IF EXISTS worker_points_update ON public.worker_points;
CREATE POLICY worker_points_update_scoped ON public.worker_points
FOR UPDATE TO authenticated
USING (
  (worker_points.employee_id IN (auth.uid()::text, public.get_my_employee_id()::text)
   OR public.is_manager())
  AND public.is_site_in_my_authorized_scope(worker_points.site_id, NULL)
)
WITH CHECK (
  (worker_points.employee_id IN (auth.uid()::text, public.get_my_employee_id()::text)
   OR public.is_manager())
  AND public.is_site_in_my_authorized_scope(worker_points.site_id, NULL)
);
DROP POLICY IF EXISTS points_tx_insert ON public.points_transactions;
CREATE POLICY points_tx_insert_supervised ON public.points_transactions
FOR INSERT TO authenticated
WITH CHECK (public.is_ceo());

DROP POLICY IF EXISTS barcode_approvals_insert ON public.barcode_approvals;
CREATE POLICY barcode_approvals_insert_scoped ON public.barcode_approvals
FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND lower(COALESCE(status,'')) IN ('pending','submitted')
  AND public.is_site_in_my_authorized_scope(site_id::text, country_code)
);

DROP POLICY IF EXISTS logs_insert ON public.system_logs;
CREATE POLICY logs_insert_actor_scoped ON public.system_logs
FOR INSERT TO authenticated
WITH CHECK (
  COALESCE(performed_by, employee_id) IN (auth.uid()::text, public.get_my_employee_id()::text)
  AND (site_id IS NULL OR public.is_site_in_my_authorized_scope(site_id, country_code))
);

DROP POLICY IF EXISTS shifts_insert_policy ON public.shifts;
CREATE POLICY shifts_insert_scoped ON public.shifts
FOR INSERT TO authenticated
WITH CHECK (
  cashier_id = auth.uid()
  AND public.is_site_in_my_authorized_scope(site_id::text, country_code)
);

-- These tables have no country/site key on the row. Until they are migrated to
-- a tenant-aware schema, authenticated access is denied rather than global.
DROP POLICY IF EXISTS customers_read ON public.customers;
DROP POLICY IF EXISTS customers_insert ON public.customers;
DROP POLICY IF EXISTS customers_update ON public.customers;
DROP POLICY IF EXISTS customers_delete ON public.customers;
DROP POLICY IF EXISTS discrepancy_claims_read ON public.discrepancy_claims;
DROP POLICY IF EXISTS discrepancy_claims_insert ON public.discrepancy_claims;
DROP POLICY IF EXISTS discrepancy_claims_update ON public.discrepancy_claims;
DROP POLICY IF EXISTS discrepancy_claims_delete ON public.discrepancy_claims;
DROP POLICY IF EXISTS discrepancy_resolutions_read ON public.discrepancy_resolutions;
DROP POLICY IF EXISTS discrepancy_resolutions_insert ON public.discrepancy_resolutions;
DROP POLICY IF EXISTS discrepancy_resolutions_update ON public.discrepancy_resolutions;
DROP POLICY IF EXISTS discrepancy_resolutions_delete ON public.discrepancy_resolutions;

-- SECURITY INVOKER ensures RLS on source tables scopes this aggregate RPC.
ALTER FUNCTION public.get_warehouse_metrics(text, timestamp without time zone, timestamp without time zone, text)
  SECURITY INVOKER;
ALTER FUNCTION public.get_warehouse_metrics(text, timestamp without time zone, timestamp without time zone, text)
  SET search_path = pg_catalog, public, pg_temp;
REVOKE EXECUTE ON FUNCTION public.get_warehouse_metrics(text, timestamp without time zone, timestamp without time zone, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_warehouse_metrics(text, timestamp without time zone, timestamp without time zone, text)
  TO authenticated, service_role;

-- Remove anonymous execution from every privileged SECURITY DEFINER routine.
DO $block$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f.signature);
  END LOOP;
END;
$block$;

-- Pin mutable search_path on this privileged utility function.
ALTER FUNCTION public.set_default_shift_number()
  SET search_path = pg_catalog, public, pg_temp;
