-- ============================================================================
-- Migration: 20261028_regional_finance_manager_rls_alignment.sql
-- Purpose:
--   Align PostgreSQL RLS helper functions, policies, and triggers for
--   regional_finance_manager and regional finance specialists:
--   1. Update enforce_authenticated_sensitive_transition() to allow
--      migration/admin sessions (postgres, supabase_admin) when auth.uid()
--      is NULL and resolve COALESCE(OLD.region_code, NEW.region_code, s.region_code)
--      when verifying regional expense approval scope.
--   2. Backfill expenses.region_code from sites.region_code where NULL.
--   3. Update private.finance_site_scope() and expenses_read_finance to
--      include tax_compliance_officer, credit_control_officer, and
--      payroll_specialist alongside accountant and treasury_officer.
--   4. Tighten shifts_select_policy and shifts_update_policy so regional
--      and store roles (including regional_finance_manager and
--      area_operations_manager) are strictly scoped via
--      is_site_in_my_authorized_scope(site_id, country_code).
-- ============================================================================

BEGIN;

-- 1. Update enforce_authenticated_sensitive_transition() first so subsequent
--    backfill UPDATE statements succeed under postgres/supabase_admin and
--    regional expense approvals fallback to sites.region_code when needed.
CREATE OR REPLACE FUNCTION public.enforce_authenticated_sensitive_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor public.employees%ROWTYPE;
  v_actor_country text;
  v_actor_region text;
  v_row_country text;
  v_row_region text;
  v_norm_role text;
  v_hq boolean;
BEGIN
  IF auth.role() = 'service_role' OR current_user IN ('postgres', 'supabase_admin') THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authenticated employee session required'; END IF;

  SELECT e.* INTO v_actor FROM public.employees e
  WHERE e.id = auth.uid() AND COALESCE(lower(e.status), 'active') = 'active' LIMIT 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active employee profile required'; END IF;

  SELECT upper(s.country), COALESCE(v_actor.region_code, s.region_code) INTO v_actor_country, v_actor_region
  FROM public.sites s WHERE s.id = v_actor.site_id LIMIT 1;

  v_norm_role := public.normalize_role(v_actor.role);
  v_hq := v_norm_role IN (
    'group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_csco',
    'country_managing_director', 'country_operations_director', 'country_supply_chain_director'
  );

  -- 1. TRANSFERS WORKFLOW
  IF TG_TABLE_NAME = 'transfers' THEN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Approved' THEN
      IF v_norm_role NOT IN (
          'group_ceo', 'group_coo', 'group_csco',
          'country_managing_director', 'country_operations_director', 'country_supply_chain_director',
          'regional_operations_manager', 'area_operations_manager',
          'regional_logistics_manager', 'regional_supply_chain_manager',
          'warehouse_manager', 'inventory_manager', 'dispatch_supervisor'
      ) THEN
        RAISE EXCEPTION 'Only an authorized logistics, warehouse, or operations manager may approve transfers';
      END IF;
      IF NEW.approved_by IS DISTINCT FROM v_actor.name
         OR public.normalize_role(COALESCE(NEW.approved_by_role, '')) <> v_norm_role THEN
        RAISE EXCEPTION 'Transfer approver must match the authenticated employee';
      END IF;
      SELECT upper(COALESCE(NEW.country_code, s.country)) INTO v_row_country
      FROM (SELECT 1) q LEFT JOIN public.sites s ON s.id = NEW.source_site_id;
      IF v_row_country IS DISTINCT FROM v_actor_country AND NOT v_hq THEN
        RAISE EXCEPTION 'Transfer approval is limited to the employee country';
      END IF;
      IF NOT v_hq AND v_norm_role IN ('regional_operations_manager', 'area_operations_manager', 'regional_logistics_manager')
         AND (NEW.source_region_code IS DISTINCT FROM v_actor_region OR NEW.dest_region_code IS DISTINCT FROM v_actor_region) THEN
        RAISE EXCEPTION 'Regional approval is limited to the employee region';
      END IF;
      IF NOT v_hq AND v_norm_role NOT IN (
          'country_managing_director', 'country_operations_director', 'country_supply_chain_director',
          'regional_operations_manager', 'area_operations_manager',
          'regional_supply_chain_manager', 'regional_logistics_manager'
      ) AND NEW.source_site_id IS DISTINCT FROM v_actor.site_id THEN
        RAISE EXCEPTION 'Transfer approval is limited to the employee site';
      END IF;
      IF (COALESCE(NEW.is_inter_region, false)
          OR (NEW.source_region_code IS NOT NULL AND NEW.dest_region_code IS NOT NULL AND NEW.source_region_code <> NEW.dest_region_code))
         AND NOT v_hq AND v_norm_role NOT IN (
          'country_managing_director', 'country_operations_director',
          'regional_supply_chain_manager', 'country_supply_chain_director'
      ) THEN
        RAISE EXCEPTION 'Inter-region transfer requires executive operations or supply chain approval';
      END IF;
    ELSIF OLD.transfer_status IS DISTINCT FROM NEW.transfer_status AND NEW.transfer_status = 'Received' THEN
      IF v_norm_role NOT IN (
          'group_ceo', 'group_coo', 'group_csco',
          'country_managing_director', 'country_operations_director', 'country_supply_chain_director',
          'regional_operations_manager', 'area_operations_manager',
          'regional_supply_chain_manager', 'regional_logistics_manager',
          'warehouse_manager', 'store_manager', 'receiver', 'inventory_manager',
          'inventory_specialist', 'dispatch_supervisor', 'replenishment_planner'
      ) THEN
        RAISE EXCEPTION 'Role is not authorized to receive transfers';
      END IF;
      IF NEW.received_by IS DISTINCT FROM v_actor.name THEN
        RAISE EXCEPTION 'Transfer receiver must match the authenticated employee';
      END IF;
      SELECT upper(COALESCE(NEW.country_code, s.country)) INTO v_row_country
      FROM (SELECT 1) q LEFT JOIN public.sites s ON s.id = NEW.dest_site_id;
      IF v_row_country IS DISTINCT FROM v_actor_country AND NOT v_hq THEN
        RAISE EXCEPTION 'Transfer receiving is limited to the employee country';
      END IF;
      IF NOT v_hq AND v_norm_role IN ('regional_operations_manager', 'area_operations_manager', 'regional_logistics_manager', 'regional_supply_chain_manager')
         AND NEW.dest_region_code IS DISTINCT FROM v_actor_region THEN
        RAISE EXCEPTION 'Regional receiving is limited to the employee region';
      END IF;
      IF NOT v_hq AND v_norm_role NOT IN (
          'regional_operations_manager', 'area_operations_manager',
          'regional_logistics_manager', 'regional_supply_chain_manager',
          'country_managing_director', 'country_operations_director', 'country_supply_chain_director'
      ) AND NEW.dest_site_id IS DISTINCT FROM v_actor.site_id THEN
        RAISE EXCEPTION 'Transfer receiving is limited to the destination site';
      END IF;
    END IF;

  -- 2. EXPENSES WORKFLOW
  ELSIF TG_TABLE_NAME = 'expenses' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Approved' THEN
    IF v_norm_role NOT IN (
        'group_ceo', 'group_cfo', 'country_managing_director', 'country_finance_director', 'cfo',
        'regional_operations_manager', 'area_operations_manager', 'regional_finance_manager'
    ) THEN
      RAISE EXCEPTION 'Role is not authorized to approve expenses';
    END IF;
    IF NEW.approved_by_id IS DISTINCT FROM v_actor.id OR NEW.approved_by IS DISTINCT FROM v_actor.name THEN
      RAISE EXCEPTION 'Expense approver must match the authenticated employee';
    END IF;
    IF OLD.created_by_id = v_actor.id AND NOT v_hq THEN RAISE EXCEPTION 'Expense creator cannot approve their own expense'; END IF;
    IF COALESCE(OLD.escalated_to_ceo, false) AND NOT v_hq AND v_norm_role <> 'country_finance_director' THEN
      RAISE EXCEPTION 'Executive approval required for this expense';
    END IF;
    SELECT upper(COALESCE(NEW.country_code, s.country)), COALESCE(OLD.region_code, NEW.region_code, s.region_code)
      INTO v_row_country, v_row_region
      FROM (SELECT 1) q LEFT JOIN public.sites s ON s.id = NEW.site_id;
    IF NEW.region_code IS NULL AND v_row_region IS NOT NULL THEN
      NEW.region_code := v_row_region;
    END IF;
    IF v_row_country IS DISTINCT FROM v_actor_country AND NOT v_hq THEN RAISE EXCEPTION 'Expense approval is limited to the employee country'; END IF;
    IF v_norm_role IN ('regional_operations_manager', 'area_operations_manager', 'regional_finance_manager') AND v_row_region IS DISTINCT FROM v_actor_region THEN
      RAISE EXCEPTION 'Expense approval is limited to the employee region';
    END IF;

  -- 3. PURCHASE ORDERS WORKFLOW
  ELSIF TG_TABLE_NAME = 'purchase_orders' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('Approved', 'Rejected') THEN
    IF v_norm_role NOT IN (
        'group_ceo', 'country_managing_director',
        'country_commercial_director', 'country_finance_director',
        'country_operations_director', 'country_supply_chain_director',
        'regional_operations_manager', 'regional_procurement_manager', 'regional_finance_manager', 'buyer'
    ) THEN
      RAISE EXCEPTION 'Role is not authorized to approve or reject purchase orders';
    END IF;
    IF NEW.status = 'Approved' AND (NEW.approver_employee_id IS DISTINCT FROM v_actor.id::text
        OR (public.normalize_role(COALESCE(NEW.approver_role, '')) <> v_norm_role AND lower(COALESCE(NEW.approver_role, '')) <> lower(v_actor.role))
        OR NEW.approved_by IS DISTINCT FROM v_actor.name) THEN
      RAISE EXCEPTION 'Purchase order approver must match the authenticated employee';
    END IF;
    IF NEW.status = 'Rejected' AND NEW.rejected_by IS DISTINCT FROM v_actor.name THEN
      RAISE EXCEPTION 'Purchase order rejector must match the authenticated employee';
    END IF;
    SELECT upper(COALESCE(NEW.country_code, s.country)) INTO v_row_country
    FROM (SELECT 1) q LEFT JOIN public.sites s ON s.id = NEW.site_id;
    IF v_row_country IS DISTINCT FROM v_actor_country AND NOT v_hq THEN RAISE EXCEPTION 'Purchase order decision is limited to the employee country'; END IF;
    IF v_norm_role IN ('regional_operations_manager', 'regional_procurement_manager', 'regional_finance_manager') AND NEW.region_code IS DISTINCT FROM v_actor_region THEN
      RAISE EXCEPTION 'Purchase order decision is limited to the employee region';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Backfill any missing expenses.region_code from sites.region_code
UPDATE public.expenses e
   SET region_code = s.region_code
  FROM public.sites s
 WHERE e.site_id = s.id
   AND e.region_code IS NULL
   AND s.region_code IS NOT NULL;

-- 3. Update private.finance_site_scope to cover all regional/HQ finance specialists
CREATE OR REPLACE FUNCTION private.finance_site_scope(
  p_site_id text,
  p_country_code text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.is_site_in_my_authorized_scope(p_site_id, p_country_code)
    OR EXISTS (
      SELECT 1
      FROM public.employees actor
      JOIN public.sites home ON home.id = actor.site_id
      JOIN public.sites target ON target.id::text = p_site_id OR target.code = p_site_id
      WHERE actor.id = (SELECT auth.uid())
        AND COALESCE(lower(actor.status), 'active') = 'active'
        AND lower(actor.role) IN (
          'accountant',
          'treasury_officer',
          'tax_compliance_officer',
          'credit_control_officer',
          'payroll_specialist',
          'cfo',
          'controller'
        )
        AND home.type = 'Administration'
        AND upper(home.country) = upper(target.country)
        AND upper(p_country_code) = upper(target.country)
        AND (
          (home.code = upper(home.country) || '-HQ'
            AND home.region_code IS NULL AND actor.region_code IS NULL)
          OR (COALESCE(actor.region_code, home.region_code) IS NOT NULL
            AND lower(target.region_code) = lower(COALESCE(actor.region_code, home.region_code)))
        )
    );
$$;

-- 4. Update expenses_read_finance to include tax_compliance_officer, credit_control_officer, payroll_specialist
DROP POLICY IF EXISTS "expenses_read_finance" ON public.expenses;
CREATE POLICY "expenses_read_finance"
  ON public.expenses
  FOR SELECT
  USING (
    (
      public.is_manager()
      OR lower(public.get_my_role()) = ANY (ARRAY[
        'cfo'::text,
        'regional_finance_manager'::text,
        'accountant'::text,
        'treasury_officer'::text,
        'tax_compliance_officer'::text,
        'credit_control_officer'::text,
        'payroll_specialist'::text,
        'auditor'::text,
        'country_compliance_manager'::text
      ])
    )
    AND private.finance_site_scope((site_id)::text, (country_code)::text)
  );

-- 5. Tighten shifts_select_policy and shifts_update_policy so regional and site
--    roles (including regional_finance_manager and area_operations_manager)
--    are scoped via is_site_in_my_authorized_scope(site_id, country_code)
DROP POLICY IF EXISTS "shifts_select_policy" ON public.shifts;
CREATE POLICY "shifts_select_policy"
  ON public.shifts
  FOR SELECT
  USING (
    public.is_ceo()
    OR (
      upper((country_code)::text) = upper(public.get_my_country_code())
      AND (
        public.is_admin()
        OR public.normalize_role(public.get_my_role()) = ANY (ARRAY[
          'group_ceo'::text,
          'group_cfo'::text,
          'country_managing_director'::text,
          'country_finance_director'::text,
          'country_operations_director'::text,
          'country_compliance_manager'::text,
          'auditor'::text
        ])
        OR public.is_site_in_my_authorized_scope((site_id)::text, (country_code)::text)
        OR (cashier_id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "shifts_update_policy" ON public.shifts;
CREATE POLICY "shifts_update_policy"
  ON public.shifts
  FOR UPDATE
  USING (
    public.is_ceo()
    OR (
      upper((country_code)::text) = upper(public.get_my_country_code())
      AND (
        public.is_admin()
        OR public.normalize_role(public.get_my_role()) = ANY (ARRAY[
          'group_ceo'::text,
          'group_cfo'::text,
          'country_managing_director'::text,
          'country_finance_director'::text,
          'country_operations_director'::text,
          'country_compliance_manager'::text,
          'auditor'::text
        ])
        OR (
          public.normalize_role(public.get_my_role()) = ANY (ARRAY[
            'regional_operations_manager'::text,
            'area_operations_manager'::text,
            'regional_finance_manager'::text,
            'regional_security_manager'::text,
            'store_manager'::text,
            'assistant_store_manager'::text,
            'head_cashier'::text,
            'shift_supervisor'::text
          ])
          AND public.is_site_in_my_authorized_scope((site_id)::text, (country_code)::text)
        )
        OR (cashier_id = auth.uid())
      )
    )
  );

COMMIT;
