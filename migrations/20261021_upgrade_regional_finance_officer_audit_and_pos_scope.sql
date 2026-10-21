-- Migration: 20261021_upgrade_regional_finance_officer_audit_and_pos_scope.sql
-- Grants Regional Finance Officers (regional_finance_officer / regional_finance_manager)
-- authoritative visibility and sign-off on branch cash drops, till variance audits,
-- POS overrides, shifts, and autonomous expenses.

-- 1. Upgrade approve_expense to normalize approver role
CREATE OR REPLACE FUNCTION public.approve_expense(
    p_expense_id uuid,
    p_approver_id uuid,
    p_approver_name text,
    p_approver_role text,
    p_notes text DEFAULT NULL::text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_expense RECORD;
    v_region_code TEXT;
    v_autonomous_limit NUMERIC := 35000.00;
    v_norm_role TEXT;
    v_is_ceo BOOLEAN := false;
    v_is_regional BOOLEAN := false;
BEGIN
    SELECT * INTO v_expense FROM public.expenses WHERE id = p_expense_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Expense % not found', p_expense_id;
    END IF;

    IF v_expense.status != 'Pending' THEN
        RAISE EXCEPTION 'Expense cannot be approved from current status "%"', v_expense.status;
    END IF;

    v_norm_role := public.normalize_role(p_approver_role);
    v_is_ceo := v_norm_role IN ('super_admin', 'ceo');

    IF NOT v_is_ceo AND (
        (v_expense.created_by_id IS NOT NULL AND v_expense.created_by_id = p_approver_id)
        OR (v_expense.created_by_name IS NOT NULL AND LOWER(TRIM(v_expense.created_by_name)) = LOWER(TRIM(p_approver_name)))
    ) THEN
        RAISE EXCEPTION 'Maker-Checker Violation: Expense creator cannot approve their own expense (4-Eyes Principle).';
    END IF;

    IF v_expense.escalated_to_ceo IS TRUE AND NOT v_is_ceo THEN
        RAISE EXCEPTION 'Executive Authorization Required: This expense exceeds the sovereign threshold and requires CEO approval.';
    END IF;

    v_region_code := v_expense.region_code;
    IF v_region_code IS NULL AND v_expense.site_id IS NOT NULL THEN
        SELECT s.region_code INTO v_region_code FROM public.sites s WHERE s.id = v_expense.site_id;
    END IF;

    IF v_region_code IS NOT NULL THEN
        SELECT COALESCE(r.autonomous_expense_limit, 35000.00) INTO v_autonomous_limit
        FROM public.regions r
        WHERE r.code = v_region_code;
    END IF;

    v_is_regional := v_norm_role IN ('regional_manager', 'regional_finance_officer');
    IF v_is_regional AND NOT v_is_ceo AND v_norm_role NOT IN ('finance_manager', 'cfo', 'admin') THEN
        IF COALESCE(v_expense.amount, 0) > v_autonomous_limit THEN
            RAISE EXCEPTION 'Autonomous Cap Exceeded: Expense amount (% %) exceeds region % autonomous limit of % %. Requires National HQ sign-off.',
                v_expense.country_code, v_expense.amount, COALESCE(v_region_code, 'territory'), v_expense.country_code, v_autonomous_limit;
        END IF;
    END IF;

    UPDATE public.expenses
    SET status = 'Approved',
        approved_by = p_approver_name,
        approved_by_name = p_approver_name,
        approved_by_id = p_approver_id,
        approved_at = NOW(),
        hq_approved_by = CASE WHEN v_is_ceo THEN p_approver_name ELSE v_expense.hq_approved_by END,
        hq_approved_at = CASE WHEN v_is_ceo THEN NOW() ELSE v_expense.hq_approved_at END,
        requires_hq_approval = false,
        updated_at = NOW()
    WHERE id = p_expense_id;

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
        p_approver_name,
        'EXPENSE_APPROVED',
        'Financials',
        json_build_object(
            'expense_id', p_expense_id,
            'amount', v_expense.amount,
            'category', v_expense.category,
            'description', v_expense.description,
            'approver_role', p_approver_role,
            'is_ceo_escalation', v_expense.escalated_to_ceo,
            'region_code', v_region_code,
            'notes', p_notes
        )::text,
        v_expense.site_id,
        v_expense.country_code,
        'expenses',
        p_expense_id::text,
        p_approver_id
    );

    RETURN json_build_object(
        'success', true,
        'expense_id', p_expense_id,
        'status', 'Approved',
        'approved_by', p_approver_name,
        'approved_at', NOW()
    );
END;
$$;

-- 2. Upgrade pos_cash_drops policies
DROP POLICY IF EXISTS "pos_cash_drops_read" ON public.pos_cash_drops;
CREATE POLICY "pos_cash_drops_read" ON public.pos_cash_drops
FOR SELECT TO authenticated
USING (
  public.is_ceo()
  OR (
    upper(country_code::text) = upper(public.get_my_country_code())
    AND (
      public.is_admin()
      OR public.normalize_role(public.get_my_role()) IN ('finance_manager', 'regional_finance_officer', 'regional_manager', 'auditor', 'operations_manager')
      OR public.is_site_in_my_authorized_scope(site_id::text, country_code::text)
      OR cashier_id = auth.uid()::text
    )
  )
);

DROP POLICY IF EXISTS "pos_cash_drops_update" ON public.pos_cash_drops;
CREATE POLICY "pos_cash_drops_update" ON public.pos_cash_drops
FOR UPDATE TO authenticated
USING (
  public.is_ceo()
  OR (
    upper(country_code::text) = upper(public.get_my_country_code())
    AND (
      public.is_admin()
      OR public.normalize_role(public.get_my_role()) IN ('finance_manager', 'regional_finance_officer', 'regional_manager', 'store_manager')
      OR public.is_site_in_my_authorized_scope(site_id::text, country_code::text)
    )
  )
);

-- 3. Upgrade pos_supervisory_overrides read policy
DROP POLICY IF EXISTS "pos_overrides_read_scoped" ON public.pos_supervisory_overrides;
CREATE POLICY "pos_overrides_read_scoped" ON public.pos_supervisory_overrides
FOR SELECT TO authenticated
USING (
  public.is_ceo()
  OR (
    upper(country_code::text) = upper(public.get_my_country_code())
    AND public.normalize_role(public.get_my_role()) = ANY (ARRAY[
      'super_admin', 'ceo', 'admin', 'operations_manager', 'finance_manager',
      'auditor', 'store_manager', 'regional_manager', 'regional_finance_officer'
    ])
    AND public.is_site_in_my_authorized_scope(site_id::text, country_code::text)
  )
);

-- 4. Upgrade shifts select and update policies
DROP POLICY IF EXISTS "shifts_select_policy" ON public.shifts;
CREATE POLICY "shifts_select_policy" ON public.shifts
FOR SELECT TO authenticated
USING (
  public.is_ceo()
  OR (
    upper(country_code::text) = upper(public.get_my_country_code())
    AND (
      public.is_admin()
      OR public.normalize_role(public.get_my_role()) = ANY (ARRAY[
        'super_admin', 'ceo', 'admin', 'finance_manager', 'auditor',
        'operations_manager', 'regional_manager', 'regional_finance_officer', 'store_manager'
      ])
      OR public.is_site_in_my_authorized_scope(site_id::text, country_code::text)
      OR cashier_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "shifts_update_policy" ON public.shifts;
CREATE POLICY "shifts_update_policy" ON public.shifts
FOR UPDATE TO authenticated
USING (
  public.is_ceo()
  OR (
    upper(country_code::text) = upper(public.get_my_country_code())
    AND (
      public.is_admin()
      OR public.normalize_role(public.get_my_role()) = ANY (ARRAY[
        'super_admin', 'ceo', 'admin', 'finance_manager', 'auditor',
        'operations_manager', 'regional_manager', 'regional_finance_officer', 'store_manager'
      ])
      OR public.is_site_in_my_authorized_scope(site_id::text, country_code::text)
      OR cashier_id = auth.uid()
    )
  )
);
