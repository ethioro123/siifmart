-- Migration: Secure Purchase Order Approval & Rejection Identity Verification
-- Date: 2026-10-17
-- Description:
-- Verifies the approver / rejector identity against the signed-in session (auth.uid() -> public.employees).
-- Prevents role and identity spoofing where arbitrary roles (e.g. CEO) or identities could be claimed.

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
    v_caller RECORD;
    v_effective_id TEXT;
    v_effective_name TEXT;
    v_effective_role TEXT;
    v_region_code TEXT;
    v_autonomous_limit NUMERIC := 150000.00;
    v_is_escalated BOOLEAN := false;
    v_is_regional_role BOOLEAN := false;
    v_is_hq_role BOOLEAN := false;
    v_new_notes TEXT;
BEGIN
    -- 0. Identity Verification Guard against authenticated session
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

        -- Verify claimed approver ID matches authenticated employee
        IF p_approver_id IS NOT NULL AND TRIM(p_approver_id) != '' AND p_approver_id != v_caller.id::text THEN
            RAISE EXCEPTION 'Identity Spoofing Blocked: Claimed approver ID does not match signed-in employee profile.';
        END IF;

        -- Enforce true identity and verified role from database
        v_effective_id := v_caller.id::text;
        v_effective_name := COALESCE(v_caller.name, p_approver_name);
        v_effective_role := COALESCE(v_caller.role, p_approver_role);
    ELSE
        -- Fallback for service_role / internal backend calls
        v_effective_id := p_approver_id;
        v_effective_name := p_approver_name;
        v_effective_role := p_approver_role;
    END IF;

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
    IF v_effective_role IN ('warehouse_manager', 'store_manager', 'cashier', 'driver', 'picker', 'packer', 'receiver', 'stock_clerk') THEN
        RAISE EXCEPTION 'Segregation of Duties Violation: Role "%" is not authorized to approve purchase orders', v_effective_role;
    END IF;

    -- 4. 4-Eyes Principle Guard: Creator CANNOT approve their own PO
    IF v_effective_role NOT IN ('super_admin', 'CEO', 'ceo') AND (
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

    -- 7. Classify approver authority tier using verified role
    v_is_regional_role := v_effective_role IN ('regional_manager', 'regional_procurement_lead', 'regional_finance_officer');
    v_is_hq_role := v_effective_role IN ('super_admin', 'CEO', 'ceo', 'admin', 'procurement_manager', 'finance_manager', 'operations_manager');

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
    v_new_notes := COALESCE(v_po.notes, '') || E'\n[APPROVED_BY:' || v_effective_name || E' (' || v_effective_role || E'):' || NOW()::text || E' REASON:' || p_reason_code;
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

-- Upgrade reject_purchase_order with authenticated employee verification
CREATE OR REPLACE FUNCTION public.reject_purchase_order(
    p_po_id UUID,
    p_rejector_id TEXT,
    p_rejector_name TEXT,
    p_rejector_role TEXT,
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
    v_caller RECORD;
    v_effective_id TEXT;
    v_effective_name TEXT;
    v_effective_role TEXT;
    v_new_notes TEXT;
BEGIN
    -- 0. Identity Verification Guard against authenticated session
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

        IF p_rejector_id IS NOT NULL AND TRIM(p_rejector_id) != '' AND p_rejector_id != v_caller.id::text THEN
            RAISE EXCEPTION 'Identity Spoofing Blocked: Claimed rejector ID does not match signed-in employee profile.';
        END IF;

        v_effective_id := v_caller.id::text;
        v_effective_name := COALESCE(v_caller.name, p_rejector_name);
        v_effective_role := COALESCE(v_caller.role, p_rejector_role);
    ELSE
        v_effective_id := p_rejector_id;
        v_effective_name := p_rejector_name;
        v_effective_role := p_rejector_role;
    END IF;

    SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase order % not found', p_po_id;
    END IF;

    IF v_po.status IN ('Received', 'Partially Received') THEN
        RAISE EXCEPTION 'Cannot reject purchase order that has already been received';
    END IF;

    IF p_reason_code IS NULL OR TRIM(p_reason_code) = '' THEN
        RAISE EXCEPTION 'Managerial Accountability Violation: Structured reason code is mandatory for PO rejection';
    END IF;

    v_new_notes := COALESCE(v_po.notes, '') || E'\n[REJECTED_BY:' || v_effective_name || E' (' || v_effective_role || E'):' || NOW()::text || E' REASON:' || p_reason_code || E']';
    IF p_notes IS NOT NULL AND TRIM(p_notes) != '' THEN
        v_new_notes := v_new_notes || E'\n[REJECTION_NOTE: ' || TRIM(p_notes) || E']';
    END IF;

    UPDATE public.purchase_orders
    SET status = 'Rejected',
        rejected_by = v_effective_name,
        rejected_at = NOW(),
        rejection_reason_code = p_reason_code,
        rejection_notes = p_notes,
        notes = v_new_notes,
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
        'PURCHASE_ORDER_REJECTED',
        'Procurement',
        json_build_object(
            'po_id', p_po_id,
            'po_number', v_po.po_number,
            'total_amount', v_po.total_amount,
            'currency', v_po.currency,
            'rejector_role', v_effective_role,
            'reason_code', p_reason_code,
            'notes', p_notes,
            'gps', p_gps_coords
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
        'status', 'Rejected',
        'rejected_by', v_effective_name,
        'rejected_at', NOW()
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_purchase_order(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_purchase_order(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.reject_purchase_order(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_purchase_order(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;
