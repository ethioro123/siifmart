-- ============================================================================
-- Migration: 20261028_regional_procurement_manager_rls_alignment.sql
-- Purpose:
--   Align PostgreSQL RLS helper functions, triggers, and policies for
--   regional_procurement_manager (and regional department managers):
--   1. Fix private.procurement_supplier_scope(p_country, p_region, p_write) so
--      SELECT (p_write = false) allows regional and facility staff to read
--      country-wide national suppliers (p_region IS NULL) in addition to their
--      own region's suppliers, while keeping INSERT/UPDATE (p_write = true)
--      strictly locked to their assigned region_code.
--   2. Align public.guard_procurement_order_decision() and
--      public.guard_purchase_order_approval_policy() with poApprovalPolicy.ts
--      and enforce_regional_po_approval_scope_and_budget().
--   3. Include regional department managers in the regional branch of
--      employees_insert and employees_update so they can onboard/manage their
--      departmental teams across facilities in get_my_region_code().
-- ============================================================================

BEGIN;

-- 1. Fix private.procurement_supplier_scope so country-wide national suppliers
--    (region_code IS NULL) are visible on SELECT to regional & site staff in the same country.
CREATE OR REPLACE FUNCTION private.procurement_supplier_scope(
  p_country text,
  p_region text,
  p_write boolean DEFAULT false
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT (EXISTS (
    SELECT 1
    FROM public.employees actor
    LEFT JOIN public.sites home ON home.id = actor.site_id
    WHERE actor.id = (SELECT auth.uid())
      AND COALESCE(lower(actor.status), 'active') = 'active'
      AND upper(COALESCE(p_country, '')) IN ('ET', 'KE')
      AND (
        public.normalize_role(actor.role) IN ('group_ceo', 'group_coo', 'group_cfo', 'group_cco', 'group_csco')
        OR (
          home.id IS NOT NULL
          AND upper(home.country) = upper(p_country)
          AND public.normalize_role(actor.role) IN (
            'country_managing_director',
            'country_commercial_director',
            'regional_procurement_manager',
            'buyer',
            'vendor_relations_manager',
            'country_supply_chain_director',
            'country_operations_director',
            'regional_operations_manager',
            'area_operations_manager',
            'country_finance_director',
            'regional_finance_manager',
            'auditor',
            'country_compliance_manager',
            'store_manager',
            'warehouse_manager',
            'receiver',
            'inventory_specialist',
            'inventory_manager',
            'regional_supply_chain_manager',
            'regional_logistics_manager',
            'demand_planner',
            'replenishment_planner',
            'customs_import_specialist',
            'inbound_qc_inspector'
          )
          AND (
            NOT p_write
            OR public.normalize_role(actor.role) IN (
              'country_managing_director',
              'country_commercial_director',
              'regional_procurement_manager',
              'buyer',
              'vendor_relations_manager',
              'country_supply_chain_director',
              'country_operations_director',
              'regional_operations_manager',
              'area_operations_manager'
            )
          )
          AND (
            (
              home.type = 'Administration'
              AND home.code = upper(home.country) || '-HQ'
              AND home.region_code IS NULL
              AND actor.region_code IS NULL
            )
            OR (
              COALESCE(actor.region_code, home.region_code) IS NOT NULL
              AND (
                (NOT p_write AND (p_region IS NULL OR lower(p_region) = lower(COALESCE(actor.region_code, home.region_code))))
                OR (p_write AND lower(p_region) = lower(COALESCE(actor.region_code, home.region_code)))
              )
            )
            OR (
              NOT p_write
              AND home.type <> 'Administration'
              AND (p_region IS NULL OR lower(p_region) = lower(COALESCE(actor.region_code, home.region_code)))
            )
          )
        )
      )
  ))
  AND EXISTS (
    SELECT 1
    FROM public.employees scoped_actor
    LEFT JOIN public.sites scoped_home ON scoped_home.id = scoped_actor.site_id
    WHERE scoped_actor.id = (SELECT auth.uid())
      AND (
        public.normalize_role(scoped_actor.role) LIKE 'group_%'
        OR (
          scoped_home.code = upper(scoped_home.country) || '-HQ'
          AND COALESCE(scoped_actor.scope_level, 'HQ') = 'HQ'
          AND scoped_actor.region_code IS NULL
          AND scoped_home.region_code IS NULL
          AND scoped_actor.role NOT LIKE 'regional_%'
        )
        OR (
          COALESCE(scoped_actor.region_code, scoped_home.region_code) IS NOT NULL
          AND (
            (NOT p_write AND (p_region IS NULL OR lower(p_region) = lower(COALESCE(scoped_actor.region_code, scoped_home.region_code))))
            OR (p_write AND lower(p_region) = lower(COALESCE(scoped_actor.region_code, scoped_home.region_code)))
          )
        )
      )
  );
$$;

-- 2. Align guard_procurement_order_decision() with poApprovalPolicy.ts
CREATE OR REPLACE FUNCTION public.guard_procurement_order_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    actor public.employees%ROWTYPE;
    actor_role text;
BEGIN
    IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;
    SELECT * INTO actor FROM public.employees
      WHERE id = (SELECT auth.uid()) AND COALESCE(lower(status), 'active') = 'active';
    IF actor.id IS NULL THEN RAISE EXCEPTION 'Active employee required'; END IF;
    actor_role := public.normalize_role(actor.role::text);

    IF (NEW.site_id, NEW.country_code, NEW.region_code, NEW.created_by)
        IS DISTINCT FROM (OLD.site_id, OLD.country_code, OLD.region_code, OLD.created_by) THEN
        RAISE EXCEPTION 'Purchase order origin cannot be changed';
    END IF;
    IF actor_role IN ('buyer', 'demand_planner', 'replenishment_planner')
       AND (OLD.status NOT IN ('Draft', 'Pending') OR NEW.status NOT IN ('Draft', 'Pending')) THEN
        RAISE EXCEPTION 'Buying and planning staff may prepare draft purchase orders only';
    END IF;
    IF (NEW.approved_by, NEW.approved_at, NEW.rejected_by, NEW.rejected_at,
        NEW.approver_role, NEW.approver_employee_id, NEW.hq_approved_by, NEW.hq_approved_at)
        IS DISTINCT FROM
       (OLD.approved_by, OLD.approved_at, OLD.rejected_by, OLD.rejected_at,
        OLD.approver_role, OLD.approver_employee_id, OLD.hq_approved_by, OLD.hq_approved_at)
       OR (NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('Approved', 'Rejected')) THEN
        IF actor_role NOT IN (
            'group_ceo',
            'country_managing_director',
            'country_operations_director',
            'country_commercial_director',
            'regional_operations_manager',
            'regional_procurement_manager'
        ) THEN
            RAISE EXCEPTION 'Purchase order decision requires an authorized procurement or operations lead';
        END IF;
        IF actor_role <> 'group_ceo' AND
           (lower(trim(COALESCE(OLD.created_by, ''))) IN (lower(trim(actor.name)), actor.id::text)
            OR lower(trim(COALESCE(OLD.requested_by, ''))) IN (lower(trim(actor.name)), actor.id::text)) THEN
            RAISE EXCEPTION 'Purchase order creator cannot decide their own order';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- 3. Align guard_purchase_order_approval_policy() with poApprovalPolicy.ts
CREATE OR REPLACE FUNCTION public.guard_purchase_order_approval_policy()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor public.employees%ROWTYPE;
  v_actor_role text;
  v_actor_country text;
  v_actor_region text;
  v_region_code text;
  v_region_country text;
  v_limit numeric;
  v_region_status text;
  v_is_clearance_change boolean;
  v_is_approval boolean;
BEGIN
  v_is_clearance_change :=
    (NEW.finance_cleared_by_employee_id, NEW.finance_cleared_at,
     NEW.finance_clearance_reason, NEW.finance_cleared_amount,
     NEW.finance_cleared_supplier_id, NEW.finance_cleared_currency,
     NEW.finance_cleared_payment_terms) IS DISTINCT FROM
    (OLD.finance_cleared_by_employee_id, OLD.finance_cleared_at,
     OLD.finance_clearance_reason, OLD.finance_cleared_amount,
     OLD.finance_cleared_supplier_id, OLD.finance_cleared_currency,
     OLD.finance_cleared_payment_terms);
  v_is_approval := NEW.status = 'Approved' AND OLD.status IS DISTINCT FROM 'Approved';
  IF NOT v_is_clearance_change AND NOT v_is_approval THEN RETURN NEW; END IF;
  IF (SELECT auth.role()) = 'service_role' THEN RETURN NEW; END IF;

  SELECT * INTO v_actor FROM public.employees
    WHERE id = (SELECT auth.uid()) AND lower(coalesce(status, 'active')) = 'active';
  IF v_actor.id IS NULL THEN
    RAISE EXCEPTION 'Active employee required for PO decision' USING ERRCODE = '42501';
  END IF;
  v_actor_role := public.normalize_role(v_actor.role::text);
  SELECT upper(s.country), coalesce(v_actor.region_code, s.region_code)
    INTO v_actor_country, v_actor_region FROM public.sites s WHERE s.id = v_actor.site_id;
  v_region_code := NEW.region_code;
  IF v_region_code IS NULL THEN
    SELECT s.region_code INTO v_region_code FROM public.sites s WHERE s.id = NEW.site_id;
  END IF;
  IF v_region_code IS NOT NULL THEN
    SELECT upper(r.country), r.autonomous_po_limit, lower(r.status)
      INTO v_region_country, v_limit, v_region_status
      FROM public.regions r WHERE r.code = v_region_code;
    IF NOT FOUND OR v_limit IS NULL OR v_limit < 0 OR v_region_status <> 'active' THEN
      RAISE EXCEPTION 'An active region with a configured PO limit is required' USING ERRCODE = '23514';
    END IF;
    IF v_region_country IS DISTINCT FROM upper(NEW.country_code) THEN
      RAISE EXCEPTION 'PO country does not match the configured region' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF v_is_clearance_change THEN
    IF current_setting('siifmart.po_finance_clearance', true) IS DISTINCT FROM 'yes'
       OR v_actor_role <> 'country_finance_director'
       OR v_actor_country IS DISTINCT FROM upper(NEW.country_code)
       OR NEW.status NOT IN ('Draft', 'Pending')
       OR v_region_code IS NULL OR NEW.total_amount <= v_limit
       OR v_actor.id IS DISTINCT FROM NEW.finance_cleared_by_employee_id
       OR NEW.finance_cleared_at IS NULL
       OR nullif(btrim(NEW.finance_clearance_reason), '') IS NULL
       OR NEW.finance_cleared_amount IS DISTINCT FROM NEW.total_amount
       OR NEW.finance_cleared_supplier_id IS DISTINCT FROM NEW.supplier_id
       OR NEW.finance_cleared_currency IS DISTINCT FROM NEW.currency
       OR NEW.finance_cleared_payment_terms IS DISTINCT FROM NEW.payment_terms
       OR lower(btrim(coalesce(NEW.created_by, ''))) IN (lower(btrim(v_actor.name)), v_actor.id::text)
       OR lower(btrim(coalesce(NEW.requested_by, ''))) IN (lower(btrim(v_actor.name)), v_actor.id::text)
       OR (to_jsonb(NEW) - ARRAY['finance_cleared_by_employee_id','finance_cleared_at',
          'finance_clearance_reason','finance_cleared_amount','finance_cleared_supplier_id',
          'finance_cleared_currency','finance_cleared_payment_terms','updated_at']) IS DISTINCT FROM
          (to_jsonb(OLD) - ARRAY['finance_cleared_by_employee_id','finance_cleared_at',
          'finance_clearance_reason','finance_cleared_amount','finance_cleared_supplier_id',
          'finance_cleared_currency','finance_cleared_payment_terms','updated_at']) THEN
      RAISE EXCEPTION 'Finance clearance requires an independent HQ finance officer and unchanged PO terms' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF v_is_approval THEN
    IF v_actor_role NOT IN (
      'group_ceo',
      'country_managing_director',
      'country_operations_director',
      'country_commercial_director',
      'regional_operations_manager',
      'regional_procurement_manager'
    ) THEN
      RAISE EXCEPTION 'Final PO approval requires an authorized procurement lead' USING ERRCODE = '42501';
    END IF;
    IF v_actor_role <> 'group_ceo' AND (
       lower(btrim(coalesce(OLD.created_by, ''))) IN (lower(btrim(v_actor.name)), v_actor.id::text)
       OR lower(btrim(coalesce(OLD.requested_by, ''))) IN (lower(btrim(v_actor.name)), v_actor.id::text)
    ) THEN
      RAISE EXCEPTION 'PO creator cannot approve their own order' USING ERRCODE = '42501';
    END IF;
    IF v_actor_role <> 'group_ceo' AND v_actor_country IS DISTINCT FROM upper(NEW.country_code) THEN
      RAISE EXCEPTION 'PO approver is outside the order country' USING ERRCODE = '42501';
    END IF;
    IF v_actor_role IN ('regional_procurement_manager', 'regional_operations_manager') AND
       (v_region_code IS NULL OR v_actor_region IS DISTINCT FROM v_region_code
        OR NEW.total_amount > v_limit) THEN
      RAISE EXCEPTION 'PO exceeds your configured regional procurement authority' USING ERRCODE = '42501';
    END IF;
    IF v_region_code IS NOT NULL AND NEW.total_amount > v_limit AND
       (v_actor_role NOT IN ('country_commercial_director','country_managing_director','country_operations_director','group_ceo')
        OR NEW.finance_cleared_by_employee_id IS NULL
        OR NEW.finance_cleared_by_employee_id = v_actor.id
        OR NEW.finance_cleared_at IS NULL
        OR NEW.finance_cleared_amount IS DISTINCT FROM NEW.total_amount
        OR NEW.finance_cleared_supplier_id IS DISTINCT FROM NEW.supplier_id
        OR NEW.finance_cleared_currency IS DISTINCT FROM NEW.currency
        OR NEW.finance_cleared_payment_terms IS DISTINCT FROM NEW.payment_terms) THEN
      RAISE EXCEPTION 'PO above its regional limit requires current HQ finance clearance and HQ procurement approval' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Update employees_insert & employees_update so regional department managers
--    can onboard/manage their departmental staff across sites in their region_code.
DROP POLICY IF EXISTS "employees_insert" ON public.employees;
CREATE POLICY "employees_insert"
  ON public.employees
  FOR INSERT
  WITH CHECK (
    (public.get_my_role() = ANY (ARRAY['group_ceo'::text, 'country_managing_director'::text, 'country_hr_director'::text, 'hr_generalist'::text]))
    OR (
      (public.get_my_role() = ANY (ARRAY[
        'regional_operations_manager'::text,
        'area_operations_manager'::text,
        'regional_hr_manager'::text,
        'regional_supply_chain_manager'::text,
        'regional_procurement_manager'::text,
        'regional_logistics_manager'::text,
        'regional_finance_manager'::text,
        'regional_security_manager'::text,
        'regional_merchandising_manager'::text
      ]))
      AND (
        (site_id IN (SELECT sites.id FROM public.sites WHERE sites.region_code = public.get_my_region_code()))
        OR (region_code = public.get_my_region_code())
      )
      AND ((role)::text <> ALL (ARRAY['group_ceo'::text, 'country_managing_director'::text, 'regional_operations_manager'::text, 'country_operations_director'::text, 'country_finance_director'::text, 'country_hr_director'::text]))
    )
    OR (
      public.is_manager()
      AND ((site_id = public.get_my_site_id()) OR (public.get_my_site_id() IS NULL))
      AND ((role)::text <> ALL (ARRAY['group_ceo'::text, 'country_managing_director'::text, 'regional_operations_manager'::text, 'area_operations_manager'::text, 'regional_hr_manager'::text, 'country_operations_director'::text, 'country_finance_director'::text, 'country_hr_director'::text]))
    )
  );

DROP POLICY IF EXISTS "employees_update" ON public.employees;
CREATE POLICY "employees_update"
  ON public.employees
  FOR UPDATE
  USING (
    ((public.normalize_role(public.get_my_role()) = ANY (ARRAY['group_ceo'::text, 'country_managing_director'::text, 'country_hr_director'::text, 'hr_generalist'::text, 'country_finance_director'::text]))
      AND public.is_site_in_my_authorized_scope((site_id)::text))
    OR (
      (public.normalize_role(public.get_my_role()) = ANY (ARRAY[
        'regional_operations_manager'::text,
        'area_operations_manager'::text,
        'regional_hr_manager'::text,
        'regional_finance_manager'::text,
        'regional_supply_chain_manager'::text,
        'regional_procurement_manager'::text,
        'regional_logistics_manager'::text,
        'regional_security_manager'::text,
        'regional_merchandising_manager'::text
      ]))
      AND (
        (region_code = public.get_my_region_code())
        OR (site_id IN (SELECT s.id FROM public.sites s WHERE s.region_code = public.get_my_region_code()))
      )
      AND (public.normalize_role((role)::text) <> ALL (ARRAY['group_ceo'::text, 'country_managing_director'::text, 'regional_operations_manager'::text, 'country_operations_director'::text, 'country_finance_director'::text, 'country_hr_director'::text]))
    )
    OR (id = auth.uid())
    OR (lower((email)::text) = lower((auth.jwt() ->> 'email'::text)))
  )
  WITH CHECK (
    ((public.normalize_role(public.get_my_role()) = ANY (ARRAY['group_ceo'::text, 'country_managing_director'::text, 'country_hr_director'::text, 'hr_generalist'::text, 'country_finance_director'::text]))
      AND public.is_site_in_my_authorized_scope((site_id)::text))
    OR (
      (public.normalize_role(public.get_my_role()) = ANY (ARRAY[
        'regional_operations_manager'::text,
        'area_operations_manager'::text,
        'regional_hr_manager'::text,
        'regional_finance_manager'::text,
        'regional_supply_chain_manager'::text,
        'regional_procurement_manager'::text,
        'regional_logistics_manager'::text,
        'regional_security_manager'::text,
        'regional_merchandising_manager'::text
      ]))
      AND (
        (region_code = public.get_my_region_code())
        OR (site_id IN (SELECT s.id FROM public.sites s WHERE s.region_code = public.get_my_region_code()))
      )
      AND (public.normalize_role((role)::text) <> ALL (ARRAY['group_ceo'::text, 'country_managing_director'::text, 'regional_operations_manager'::text, 'country_operations_director'::text, 'country_finance_director'::text, 'country_hr_director'::text]))
    )
    OR (id = auth.uid())
    OR (lower((email)::text) = lower((auth.jwt() ->> 'email'::text)))
  );

COMMIT;
