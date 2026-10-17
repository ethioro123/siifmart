-- ============================================================================
-- Migration: 20261017_regional_governance_and_spending_limits.sql
-- Description: Unifies regional spending limits across Procurement, Financials,
--              and HR. Implements database-level security guards for:
--              1. Regional autonomous PO limits & National HQ escalation.
--              2. Regional autonomous expense limits & CEO authorization.
--              3. Server-side SECURITY DEFINER RPCs for tamper-proof execution.
-- ============================================================================

-- 1. Extend regions table with autonomous expense limit and monthly expense budget
ALTER TABLE public.regions
  ADD COLUMN IF NOT EXISTS autonomous_expense_limit numeric DEFAULT 25000,
  ADD COLUMN IF NOT EXISTS monthly_expense_budget numeric DEFAULT 0;

-- 2. Extend purchase_orders table with explicit HQ sign-off tracking columns if not present
ALTER TABLE public.purchase_orders
  ADD COLUMN IF NOT EXISTS hq_approved_by text,
  ADD COLUMN IF NOT EXISTS hq_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS requires_hq_approval boolean DEFAULT false;

-- 3. Extend expenses table with region_code and regional approval escalation tracking
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS region_code text REFERENCES public.regions(code) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS requires_hq_approval boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hq_approved_by text,
  ADD COLUMN IF NOT EXISTS hq_approved_at timestamptz;

-- 4. Backfill expenses region_code from sites where available
UPDATE public.expenses e
SET region_code = s.region_code
FROM public.sites s
WHERE (e.site_id = s.id OR e.site_id::text = s.id::text)
  AND e.region_code IS NULL
  AND s.region_code IS NOT NULL;

-- 5. UPGRADED SERVER-SIDE RPC: 4-EYES PO APPROVAL WITH REGIONAL LIMIT ENFORCEMENT
CREATE OR REPLACE FUNCTION public.approve_purchase_order(
    p_po_id UUID,
    p_approver_id TEXT,
    p_approver_name TEXT,
    p_approver_role TEXT,
    p_reason_code TEXT,
    p_notes TEXT DEFAULT '',
    p_gps_coords TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_po RECORD;
    v_region_code TEXT;
    v_autonomous_limit NUMERIC := 150000.00;
    v_is_escalated BOOLEAN := false;
    v_is_regional_role BOOLEAN := false;
    v_is_hq_role BOOLEAN := false;
    v_new_notes TEXT;
BEGIN
    -- 1. Fetch Purchase Order
    SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase order % not found', p_po_id;
    END IF;

    -- 2. Status Guard: Must be Draft or Pending
    IF v_po.status NOT IN ('Draft', 'Pending') THEN
        RAISE EXCEPTION 'Purchase order cannot be approved from current status "%"', v_po.status;
    END IF;

    -- 3. Role Authorization Guard: Warehouse Managers & Store Staff CANNOT approve POs
    IF p_approver_role IN ('warehouse_manager', 'store_manager', 'cashier', 'driver', 'picker', 'packer', 'receiver', 'stock_clerk') THEN
        RAISE EXCEPTION 'Segregation of Duties Violation: Role "%" is not authorized to approve purchase orders', p_approver_role;
    END IF;

    -- 4. 4-Eyes Principle Guard: Creator CANNOT approve their own PO
    IF p_approver_role NOT IN ('super_admin', 'CEO', 'ceo') AND (
        (v_po.created_by IS NOT NULL AND LOWER(TRIM(v_po.created_by)) = LOWER(TRIM(p_approver_name)))
        OR (v_po.requested_by IS NOT NULL AND LOWER(TRIM(v_po.requested_by)) = LOWER(TRIM(p_approver_name)))
    ) THEN
        RAISE EXCEPTION 'Zero-Trust 4-Eyes Violation: Self-approval is strictly prohibited. The creator of a purchase order cannot approve it.';
    END IF;

    -- 5. Mandatory Structured Reason Code
    IF p_reason_code IS NULL OR TRIM(p_reason_code) = '' THEN
        RAISE EXCEPTION 'Managerial Accountability Violation: Structured reason code is mandatory for PO approval';
    END IF;

    -- 6. Resolve Region and Dynamic Autonomous PO Limit
    v_region_code := v_po.region_code;
    IF v_region_code IS NULL AND v_po.site_id IS NOT NULL THEN
        SELECT s.region_code INTO v_region_code FROM public.sites s WHERE s.id = v_po.site_id;
    END IF;

    IF v_region_code IS NOT NULL THEN
        SELECT COALESCE(r.autonomous_po_limit, 150000.00) INTO v_autonomous_limit
        FROM public.regions r
        WHERE r.code = v_region_code;
    END IF;

    -- 7. Classify approver authority tier
    v_is_regional_role := p_approver_role IN ('regional_manager', 'regional_procurement_lead', 'regional_finance_officer');
    v_is_hq_role := p_approver_role IN ('super_admin', 'CEO', 'ceo', 'admin', 'procurement_manager', 'finance_manager', 'operations_manager');

    -- Check if PO amount exceeds regional autonomous limit
    IF COALESCE(v_po.total_amount, 0) > v_autonomous_limit THEN
        v_is_escalated := true;

        IF v_is_regional_role AND NOT v_is_hq_role THEN
            RAISE EXCEPTION 'Autonomous Cap Exceeded: Order total (% %) exceeds region % autonomous limit of % %. This order requires National HQ sign-off.',
                COALESCE(v_po.currency, ''), COALESCE(v_po.total_amount, 0), COALESCE(v_region_code, 'territory'),
                COALESCE(v_po.currency, ''), v_autonomous_limit;
        END IF;
    END IF;

    -- 8. Compose notes with immutable audit trail
    v_new_notes := COALESCE(v_po.notes, '') || E'\n[APPROVED_BY:' || p_approver_name || E' (' || p_approver_role || E'):' || NOW()::text || E' REASON:' || p_reason_code;
    IF v_is_escalated THEN
        v_new_notes := v_new_notes || E' (NATIONAL_HQ_ESCALATION)]';
    ELSE
        v_new_notes := v_new_notes || E']';
    END IF;

    IF p_notes IS NOT NULL AND TRIM(p_notes) != '' THEN
        v_new_notes := v_new_notes || E'\n[APPROVAL_NOTE: ' || TRIM(p_notes) || E']';
    END IF;

    -- 9. Update Purchase Order
    UPDATE public.purchase_orders
    SET status = 'Approved',
        approved_by = p_approver_name,
        approved_at = NOW(),
        approver_role = p_approver_role,
        approver_employee_id = p_approver_id,
        approver_gps = p_gps_coords,
        approval_reason_code = p_reason_code,
        approval_notes = p_notes,
        notes = v_new_notes,
        requires_hq_approval = false,
        hq_approved_by = CASE WHEN v_is_escalated THEN p_approver_name ELSE v_po.hq_approved_by END,
        hq_approved_at = CASE WHEN v_is_escalated THEN NOW() ELSE v_po.hq_approved_at END,
        updated_at = NOW()
    WHERE id = p_po_id;

    -- 10. Insert Tamper-Proof Audit Log into system_logs
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
        'PURCHASE_ORDER_APPROVED',
        'Procurement',
        json_build_object(
            'po_id', p_po_id,
            'po_number', v_po.po_number,
            'total_amount', v_po.total_amount,
            'currency', v_po.currency,
            'approver_role', p_approver_role,
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
        p_approver_id
    );

    RETURN json_build_object(
        'success', true,
        'po_id', p_po_id,
        'status', 'Approved',
        'approved_by', p_approver_name,
        'approved_at', NOW(),
        'is_escalated', v_is_escalated
    );
END;
$$;

-- 6. SERVER-SIDE RPC: ZERO-TRUST EXPENSE APPROVAL WITH CEO & REGIONAL LIMIT GUARDS
CREATE OR REPLACE FUNCTION public.approve_expense(
    p_expense_id UUID,
    p_approver_id TEXT,
    p_approver_name TEXT,
    p_approver_role TEXT,
    p_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_expense RECORD;
    v_region_code TEXT;
    v_autonomous_limit NUMERIC := 25000.00;
    v_is_ceo BOOLEAN := false;
    v_is_regional BOOLEAN := false;
BEGIN
    -- 1. Fetch Expense
    SELECT * INTO v_expense FROM public.expenses WHERE id = p_expense_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Expense % not found', p_expense_id;
    END IF;

    -- 2. Status Guard: Must be Pending
    IF v_expense.status != 'Pending' THEN
        RAISE EXCEPTION 'Expense cannot be approved from current status "%"', v_expense.status;
    END IF;

    -- 3. 4-Eyes Principle Guard: Creator cannot approve their own expense
    IF p_approver_role NOT IN ('super_admin', 'CEO', 'ceo') AND (
        (v_expense.created_by_id IS NOT NULL AND v_expense.created_by_id = p_approver_id)
        OR (v_expense.created_by_name IS NOT NULL AND LOWER(TRIM(v_expense.created_by_name)) = LOWER(TRIM(p_approver_name)))
    ) THEN
        RAISE EXCEPTION 'Maker-Checker Violation: Expense creator cannot approve their own expense (4-Eyes Principle).';
    END IF;

    -- 4. CEO Escalation Guard
    v_is_ceo := p_approver_role IN ('super_admin', 'CEO', 'ceo');
    IF v_expense.escalated_to_ceo IS TRUE AND NOT v_is_ceo THEN
        RAISE EXCEPTION 'Executive Authorization Required: This expense exceeds the sovereign threshold and requires CEO approval.';
    END IF;

    -- 5. Regional Autonomous Expense Limit Guard
    v_region_code := v_expense.region_code;
    IF v_region_code IS NULL AND v_expense.site_id IS NOT NULL THEN
        SELECT s.region_code INTO v_region_code FROM public.sites s WHERE s.id = v_expense.site_id;
    END IF;

    IF v_region_code IS NOT NULL THEN
        SELECT COALESCE(r.autonomous_expense_limit, 25000.00) INTO v_autonomous_limit
        FROM public.regions r
        WHERE r.code = v_region_code;
    END IF;

    v_is_regional := p_approver_role IN ('regional_manager', 'regional_finance_officer');
    IF v_is_regional AND NOT v_is_ceo AND p_approver_role NOT IN ('finance_manager', 'cfo') THEN
        IF COALESCE(v_expense.amount, 0) > v_autonomous_limit THEN
            RAISE EXCEPTION 'Autonomous Cap Exceeded: Expense amount (% %) exceeds region % autonomous limit of % %. Requires National HQ sign-off.',
                v_expense.country_code, v_expense.amount, COALESCE(v_region_code, 'territory'), v_expense.country_code, v_autonomous_limit;
        END IF;
    END IF;

    -- 6. Update Expense Record
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

    -- 7. Tamper-Proof Audit Log
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

-- 7. Grant execution privileges to authenticated users & service role
REVOKE EXECUTE ON FUNCTION public.approve_purchase_order(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_purchase_order(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.approve_expense(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_expense(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
