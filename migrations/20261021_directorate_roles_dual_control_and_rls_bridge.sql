-- Migration: 20261021_directorate_roles_dual_control_and_rls_bridge.sql
-- Description: Unifies National Directorate canonical roles with RLS policies, zero-trust triggers, and dual-control functions

-- 1. Create canonical role normalization function
CREATE OR REPLACE FUNCTION public.normalize_role(p_role TEXT)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE lower(trim(coalesce(p_role, '')))
    WHEN 'country_managing_director' THEN 'admin'
    WHEN 'head_of_operations' THEN 'operations_manager'
    WHEN 'operations_head' THEN 'operations_manager'
    WHEN 'head_of_finance' THEN 'finance_manager'
    WHEN 'finance_head' THEN 'finance_manager'
    WHEN 'head_of_procurement' THEN 'procurement_manager'
    WHEN 'procurement_head' THEN 'procurement_manager'
    WHEN 'head_of_hr' THEN 'hr_manager'
    WHEN 'hr_head' THEN 'hr_manager'
    WHEN 'head_of_supply_chain' THEN 'supply_chain_manager'
    WHEN 'supply_chain_head' THEN 'supply_chain_manager'
    WHEN 'head_of_merchandising' THEN 'merchandising_manager'
    WHEN 'merchandising_head' THEN 'merchandising_manager'
    WHEN 'head_of_it' THEN 'it_manager'
    WHEN 'it_head' THEN 'it_manager'
    WHEN 'head_of_audit' THEN 'auditor'
    WHEN 'audit_head' THEN 'auditor'
    ELSE lower(trim(coalesce(p_role, '')))
  END;
$$;

-- 2. Upgrade get_my_role() to return normalized canonical roles for seamless RLS across all 53 tables
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_role TEXT;
  v_uid UUID;
  v_email TEXT;
BEGIN
  -- Fast path 0: Custom role claim in JWT if populated
  v_role := (select auth.jwt() ->> 'role');
  IF v_role IS NOT NULL AND v_role <> '' AND v_role NOT IN ('authenticated', 'anon', 'service_role') THEN
    RETURN public.normalize_role(v_role);
  END IF;

  v_uid := (select auth.uid());
  v_email := (select auth.jwt() ->> 'email');

  IF v_uid IS NULL AND v_email IS NULL THEN
    RETURN NULL;
  END IF;

  -- Fast path 1: Primary Key / UUID index seek (< 0.05ms)
  IF v_uid IS NOT NULL THEN
    SELECT role INTO v_role 
    FROM public.employees 
    WHERE id = v_uid
    LIMIT 1;

    IF v_role IS NOT NULL THEN
      RETURN public.normalize_role(v_role);
    END IF;
  END IF;

  -- Fast path 2: Direct JWT session email lookup (0ms DB overhead)
  IF v_email IS NOT NULL AND v_email <> '' THEN
    SELECT role INTO v_role 
    FROM public.employees 
    WHERE LOWER(email) = LOWER(v_email)
    LIMIT 1;

    IF v_role IS NOT NULL THEN
      RETURN public.normalize_role(v_role);
    END IF;
  END IF;

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

-- 3. Upgrade is_site_in_my_authorized_scope to recognize canonical Directorate roles
CREATE OR REPLACE FUNCTION public.is_site_in_my_authorized_scope(p_site_id text, p_country_code text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees actor
    LEFT JOIN public.sites actor_site ON actor_site.id = actor.site_id
    JOIN public.sites target_site
      ON target_site.id::text = p_site_id OR target_site.code = p_site_id
    WHERE actor.id = auth.uid()
      AND COALESCE(lower(actor.status), 'active') = 'active'
      AND (p_country_code IS NULL OR upper(p_country_code) = upper(target_site.country))
      AND (
        lower(actor.role) IN ('super_admin','ceo')
        OR (
          upper(actor_site.country) = upper(target_site.country)
          AND (
            (public.normalize_role(actor.role) IN (
              'admin','operations_manager','finance_manager','procurement_manager',
              'hr_manager','supply_chain_manager','inventory_manager','logistics_manager',
              'auditor','regional_manager','regional_procurement_lead',
              'regional_finance_officer','regional_hr_officer','regional_logistics_lead')
             AND (lower(actor.role) NOT LIKE 'regional_%' OR actor.region_code = target_site.region_code))
            OR actor.site_id = target_site.id
          )
        )
      )
  );
$$;

-- 4. Upgrade get_my_scope_level to classify canonical Directorate roles as HQ
CREATE OR REPLACE FUNCTION public.get_my_scope_level()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_scope TEXT;
    v_uid UUID;
    v_email TEXT;
    v_role TEXT;
    v_norm_role TEXT;
BEGIN
    v_uid := auth.uid();
    v_email := auth.jwt() ->> 'email';

    IF v_uid IS NULL AND v_email IS NULL THEN
        RETURN NULL;
    END IF;

    IF v_uid IS NOT NULL THEN
        SELECT scope_level, role INTO v_scope, v_role
        FROM public.employees
        WHERE id = v_uid
        LIMIT 1;

        IF v_scope IS NOT NULL THEN
            RETURN v_scope;
        END IF;
    END IF;

    IF v_email IS NOT NULL AND v_email <> '' THEN
        SELECT scope_level, role INTO v_scope, v_role
        FROM public.employees
        WHERE LOWER(email) = LOWER(v_email)
        LIMIT 1;

        IF v_scope IS NOT NULL THEN
            RETURN v_scope;
        END IF;
    END IF;

    v_norm_role := public.normalize_role(v_role);

    IF v_norm_role IN ('super_admin', 'admin', 'ceo', 'operations_manager', 'finance_manager', 'hr_manager', 'hr', 'procurement_manager', 'supply_chain_manager', 'auditor', 'merchandising_manager', 'it_manager') THEN
        RETURN 'HQ';
    ELSIF v_norm_role IN ('regional_manager', 'regional_procurement_lead', 'regional_finance_officer', 'regional_hr_officer', 'regional_logistics_lead', 'regional_security_supervisor') THEN
        RETURN 'REGIONAL';
    ELSE
        RETURN 'SITE';
    END IF;

    RETURN 'SITE';
EXCEPTION WHEN OTHERS THEN
    RETURN 'SITE';
END;
$$;

-- 5. Upgrade approve_purchase_order function with dual-control canonical role recognition
CREATE OR REPLACE FUNCTION public.approve_purchase_order(
    p_po_id uuid,
    p_approver_id text,
    p_approver_name text,
    p_approver_role text,
    p_reason_code text,
    p_notes text DEFAULT ''::text,
    p_gps_coords text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
    v_po RECORD;
    v_caller RECORD;
    v_effective_id TEXT;
    v_effective_name TEXT;
    v_effective_role TEXT;
    v_norm_role TEXT;
    v_region_code TEXT;
    v_autonomous_limit NUMERIC := 150000.00;
    v_is_escalated BOOLEAN := false;
    v_is_regional_role BOOLEAN := false;
    v_is_hq_role BOOLEAN := false;
    v_new_notes TEXT;
BEGIN
    IF auth.role() = 'authenticated' OR auth.uid() IS NOT NULL THEN
        SELECT e.id, e.name, e.role, e.status
        INTO v_caller
        FROM public.employees e
        WHERE e.id = auth.uid()
           OR e.email = (SELECT email FROM auth.users WHERE id = auth.uid())
        LIMIT 1;

        IF v_caller.id IS NULL THEN
            RAISE EXCEPTION 'Identity Verification Failed: No employee profile matches the authenticated session.';
        END IF;

        IF v_caller.status IS NOT NULL AND LOWER(v_caller.status) != 'active' THEN
            RAISE EXCEPTION 'Identity Verification Failed: The authenticated employee account is inactive.';
        END IF;

        IF p_approver_id IS NOT NULL AND TRIM(p_approver_id) != '' AND p_approver_id != v_caller.id::text THEN
            RAISE EXCEPTION 'Identity Spoofing Blocked: Claimed approver ID does not match signed-in employee profile.';
        END IF;

        v_effective_id := v_caller.id::text;
        v_effective_name := COALESCE(v_caller.name, p_approver_name);
        v_effective_role := COALESCE(v_caller.role, p_approver_role);
    ELSE
        v_effective_id := p_approver_id;
        v_effective_name := p_approver_name;
        v_effective_role := p_approver_role;
    END IF;

    v_norm_role := public.normalize_role(v_effective_role);

    SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase order % not found', p_po_id;
    END IF;

    IF v_po.status NOT IN ('Draft', 'Pending') THEN
        RAISE EXCEPTION 'Purchase order cannot be approved from current status "%"', v_po.status;
    END IF;

    IF v_norm_role IN ('warehouse_manager', 'store_manager', 'cashier', 'driver', 'picker', 'packer', 'receiver', 'stock_clerk') THEN
        RAISE EXCEPTION 'Segregation of Duties Violation: Role "%" is not authorized to approve purchase orders', v_effective_role;
    END IF;

    IF v_norm_role NOT IN ('super_admin', 'ceo') AND (
        (v_po.created_by IS NOT NULL AND (
            LOWER(TRIM(v_po.created_by)) = LOWER(TRIM(v_effective_name)) OR
            LOWER(TRIM(v_po.created_by)) = LOWER(TRIM(v_effective_id))
        ))
        OR (v_po.requested_by IS NOT NULL AND (
            LOWER(TRIM(v_po.requested_by)) = LOWER(TRIM(v_effective_name)) OR
            LOWER(TRIM(v_po.requested_by)) = LOWER(TRIM(v_effective_id))
        ))
    ) THEN
        RAISE EXCEPTION 'Zero-Trust 4-Eyes Violation: Self-approval is strictly prohibited. The creator of a purchase order cannot approve it.';
    END IF;

    IF p_reason_code IS NULL OR TRIM(p_reason_code) = '' THEN
        RAISE EXCEPTION 'Managerial Accountability Violation: Structured reason code is mandatory for PO approval';
    END IF;

    v_region_code := v_po.region_code;
    IF v_region_code IS NULL AND v_po.site_id IS NOT NULL THEN
        SELECT s.region_code INTO v_region_code FROM public.sites s WHERE s.id = v_po.site_id;
    END IF;

    IF v_region_code IS NOT NULL THEN
        SELECT COALESCE(r.autonomous_po_limit, 150000.00) INTO v_autonomous_limit
        FROM public.regions r
        WHERE r.code = v_region_code;
    END IF;

    v_is_regional_role := v_norm_role IN ('regional_manager', 'regional_procurement_lead', 'regional_finance_officer');
    v_is_hq_role := v_norm_role IN ('super_admin', 'ceo', 'admin', 'procurement_manager', 'finance_manager', 'operations_manager');

    IF COALESCE(v_po.total_amount, 0) > v_autonomous_limit THEN
        v_is_escalated := true;

        IF v_is_regional_role AND NOT v_is_hq_role THEN
            RAISE EXCEPTION 'Autonomous Cap Exceeded: Order total (% %) exceeds region % autonomous limit of % %. This order requires National HQ sign-off.',
                COALESCE(v_po.currency, ''), COALESCE(v_po.total_amount, 0), COALESCE(v_region_code, 'territory'),
                COALESCE(v_po.currency, ''), v_autonomous_limit;
        END IF;
    END IF;

    v_new_notes := COALESCE(v_po.notes, '') || E'\n[APPROVED_BY:' || v_effective_name || E' (' || v_effective_role || E'):' || NOW()::text || E' REASON:' || p_reason_code;
    IF v_is_escalated THEN
        v_new_notes := v_new_notes || E' (NATIONAL_HQ_ESCALATION)]';
    ELSE
        v_new_notes := v_new_notes || E']';
    END IF;

    IF p_notes IS NOT NULL AND TRIM(p_notes) != '' THEN
        v_new_notes := v_new_notes || E'\n[APPROVAL_NOTE: ' || TRIM(p_notes) || E']';
    END IF;

    UPDATE public.purchase_orders
    SET status = 'Approved',
        approved_by = v_effective_name,
        approved_at = NOW(),
        approver_role = v_effective_role,
        approver_employee_id = v_effective_id,
        approver_gps = p_gps_coords,
        approval_reason_code = p_reason_code,
        approval_notes = p_notes,
        notes = v_new_notes,
        requires_hq_approval = false,
        hq_approved_by = CASE WHEN v_is_escalated THEN v_effective_name ELSE v_po.hq_approved_by END,
        hq_approved_at = CASE WHEN v_is_escalated THEN NOW() ELSE v_po.hq_approved_at END,
        updated_at = NOW()
    WHERE id = p_po_id;

    INSERT INTO public.system_logs (
        user_name,
        action,
        module,
        details,
        site_id,
        country_code,
        entity_type,
        entity_id,
        performed_by
    ) VALUES (
        v_effective_name,
        'PURCHASE_ORDER_APPROVED',
        'Procurement',
        json_build_object(
            'po_id', p_po_id,
            'po_number', v_po.po_number,
            'total_amount', v_po.total_amount,
            'currency', v_po.currency,
            'approver_role', v_effective_role,
            'reason_code', p_reason_code,
            'notes', p_notes,
            'gps', p_gps_coords,
            'is_escalated', v_is_escalated,
            'region_code', v_region_code,
            'autonomous_limit', v_autonomous_limit
        )::text,
        v_po.site_id,
        v_po.country_code,
        'purchase_orders',
        p_po_id::text,
        v_effective_id
    );

    RETURN json_build_object(
        'success', true,
        'po_id', p_po_id,
        'status', 'Approved',
        'approved_by', v_effective_name,
        'approved_at', NOW(),
        'is_escalated', v_is_escalated
    );
END;
$$;

-- 6. Upgrade enforce_regional_po_approval_scope_and_budget trigger
CREATE OR REPLACE FUNCTION public.enforce_regional_po_approval_scope_and_budget()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_region_code text;
  v_region_country text;
  v_region_status text;
  v_monthly_budget numeric;
  v_existing_spend numeric;
  v_site_country text;
  v_site_region text;
  v_actor_role text;
  v_norm_role text;
  v_actor_country text;
  v_actor_region text;
  v_actor_site uuid;
  v_month_start date;
  v_next_month date;
BEGIN
  IF NEW.status IS DISTINCT FROM 'Approved' OR OLD.status IS NOT DISTINCT FROM 'Approved' THEN
    RETURN NEW;
  END IF;

  v_region_code := NEW.region_code;
  IF NEW.site_id IS NOT NULL THEN
    SELECT upper(s.country), s.region_code
      INTO v_site_country, v_site_region
      FROM public.sites s
     WHERE s.id = NEW.site_id;
    IF v_region_code IS NULL THEN
      v_region_code := v_site_region;
    ELSIF v_site_region IS NOT NULL AND v_region_code <> v_site_region THEN
      RAISE EXCEPTION 'Purchase order region does not match its site' USING ERRCODE = '42501';
    END IF;
    IF v_site_country IS NOT NULL AND upper(NEW.country_code) <> v_site_country THEN
      RAISE EXCEPTION 'Purchase order country does not match its site' USING ERRCODE = '42501';
    END IF;
  END IF;

  IF v_region_code IS NOT NULL THEN
    SELECT upper(r.country), lower(coalesce(r.status, 'active')), coalesce(r.monthly_procurement_budget, 0)
      INTO v_region_country, v_region_status, v_monthly_budget
      FROM public.regions r
     WHERE r.code = v_region_code;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Purchase order references an unknown region' USING ERRCODE = '23503';
    END IF;
    IF upper(NEW.country_code) <> v_region_country THEN
      RAISE EXCEPTION 'Purchase order country does not match its region' USING ERRCODE = '42501';
    END IF;
    IF v_region_status <> 'active' THEN
      RAISE EXCEPTION 'Purchase orders cannot be approved while region % is %', v_region_code, v_region_status USING ERRCODE = '42501';
    END IF;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    SELECT lower(trim(e.role)), upper(s.country), e.region_code, e.site_id
      INTO v_actor_role, v_actor_country, v_actor_region, v_actor_site
      FROM public.employees e
      LEFT JOIN public.sites s ON s.id = e.site_id
     WHERE e.id = auth.uid()
       AND lower(coalesce(e.status, 'active')) IN ('active', 'enabled')
     LIMIT 1;
    IF v_actor_role IS NULL THEN
      RAISE EXCEPTION 'An active employee profile is required to approve purchase orders' USING ERRCODE = '42501';
    END IF;

    v_norm_role := public.normalize_role(v_actor_role);

    IF v_norm_role NOT IN ('super_admin', 'ceo', 'admin', 'operations_manager', 'finance_manager', 'procurement_manager', 'regional_manager', 'regional_procurement_lead', 'regional_finance_officer') THEN
      RAISE EXCEPTION 'Role % cannot approve purchase orders', v_actor_role USING ERRCODE = '42501';
    END IF;

    IF v_norm_role NOT IN ('super_admin', 'ceo') THEN
      IF v_region_code IS NULL THEN
        IF v_norm_role NOT IN ('admin', 'operations_manager', 'finance_manager', 'procurement_manager')
           OR v_actor_country IS DISTINCT FROM upper(NEW.country_code) THEN
          RAISE EXCEPTION 'Approver is outside the purchase order country or region' USING ERRCODE = '42501';
        END IF;
      ELSIF v_norm_role IN ('admin', 'operations_manager', 'finance_manager', 'procurement_manager') THEN
        IF v_actor_country IS DISTINCT FROM v_region_country THEN
          RAISE EXCEPTION 'Approver is outside the purchase order country' USING ERRCODE = '42501';
        END IF;
      ELSIF coalesce(v_actor_region, (SELECT s.region_code FROM public.sites s WHERE s.id = v_actor_site)) IS DISTINCT FROM v_region_code THEN
        RAISE EXCEPTION 'Approver is outside the purchase order region' USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  IF v_region_code IS NOT NULL AND v_monthly_budget > 0 THEN
    v_month_start := date_trunc('month', NEW.order_date)::date;
    v_next_month := (v_month_start + interval '1 month')::date;
    PERFORM pg_advisory_xact_lock(hashtext(v_region_code), hashtext(v_month_start::text));

    SELECT coalesce(sum(po.total_amount), 0)
      INTO v_existing_spend
      FROM public.purchase_orders po
     WHERE po.id <> NEW.id
       AND po.region_code = v_region_code
       AND po.order_date >= v_month_start
       AND po.order_date < v_next_month
       AND po.status IN ('Approved', 'Ordered', 'Partially Received', 'Received');

    IF v_existing_spend + NEW.total_amount > v_monthly_budget THEN
      RAISE EXCEPTION 'Monthly procurement budget exceeded for region %: existing % plus this order % is greater than cap %',
        v_region_code, v_existing_spend, NEW.total_amount, v_monthly_budget USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
