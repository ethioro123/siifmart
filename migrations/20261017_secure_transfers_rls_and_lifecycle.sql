-- ============================================================================
-- Migration: 20261017_secure_transfers_rls_and_lifecycle.sql
-- Description: Hardens Stock Transfers across Database RLS, Sovereignty, and Lifecycle:
--              1. Replaces wide-open RLS with strict site, region & country sovereignty.
--              2. Server-side SECURITY DEFINER RPC `approve_transfer` with HQ inter-regional guard.
--              3. Server-side SECURITY DEFINER RPC `receive_transfer_atomic` with dual-table sync.
--              4. Explicit audit logging to public.system_logs.
-- ============================================================================

-- 1. Ensure audit and status columns exist on transfers table
ALTER TABLE public.transfers
  ADD COLUMN IF NOT EXISTS approved_by TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by_role TEXT,
  ADD COLUMN IF NOT EXISTS approval_notes TEXT,
  ADD COLUMN IF NOT EXISTS transfer_status TEXT;

-- 2. Revoke wide-open legacy policies on transfers
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.transfers;
DROP POLICY IF EXISTS "transfers_select" ON public.transfers;
DROP POLICY IF EXISTS "transfers_insert" ON public.transfers;
DROP POLICY IF EXISTS "transfers_update" ON public.transfers;
DROP POLICY IF EXISTS "transfers_delete" ON public.transfers;
DROP POLICY IF EXISTS "transfers_select_sovereign" ON public.transfers;
DROP POLICY IF EXISTS "transfers_insert_sovereign" ON public.transfers;
DROP POLICY IF EXISTS "transfers_update_sovereign" ON public.transfers;
DROP POLICY IF EXISTS "transfers_delete_prohibited" ON public.transfers;

-- 3. Sovereign Multi-Country & Branch Scoped RLS Policies
ALTER TABLE public.transfers ENABLE ROW LEVEL SECURITY;

-- 3a. SELECT POLICY: Strict Country Sovereignty & Role-Based Scoping
CREATE POLICY "transfers_select_sovereign" ON public.transfers
FOR SELECT TO authenticated
USING (
  -- CEO & Super Admin have universal scope
  (SELECT public.get_my_role()) IN ('super_admin', 'CEO', 'ceo')
  OR (
    -- Country sovereignty guard: must match the user's active country
    country_code = public.get_my_country_code()
    AND (
      -- HQ executive roles can view national transfers in their country
      (SELECT public.get_my_role()) IN ('operations_manager', 'logistics_manager', 'finance_manager', 'procurement_manager', 'auditor')
      -- Regional managers can view transfers in their region
      OR (SELECT public.get_my_role()) = 'regional_manager'
      -- Branch staff can view transfers where their branch is source or destination
      OR source_site_id = public.get_my_site_id()
      OR dest_site_id = public.get_my_site_id()
      -- Assigned driver can view their assigned transfer
      OR (driver_id IS NOT NULL AND driver_id::text = auth.uid()::text)
    )
  )
);

-- 3b. INSERT POLICY: Branch Staff & Managers can create within their country
CREATE POLICY "transfers_insert_sovereign" ON public.transfers
FOR INSERT TO authenticated
WITH CHECK (
  (SELECT public.get_my_role()) IN ('super_admin', 'CEO', 'ceo')
  OR (
    country_code = public.get_my_country_code()
    AND (
      public.is_manager()
      OR source_site_id = public.get_my_site_id()
    )
  )
);

-- 3c. UPDATE POLICY: Origin/Destination Staff, Drivers, or Managers
CREATE POLICY "transfers_update_sovereign" ON public.transfers
FOR UPDATE TO authenticated
USING (
  (SELECT public.get_my_role()) IN ('super_admin', 'CEO', 'ceo')
  OR (
    country_code = public.get_my_country_code()
    AND (
      public.is_manager()
      OR source_site_id = public.get_my_site_id()
      OR dest_site_id = public.get_my_site_id()
      OR (driver_id IS NOT NULL AND driver_id::text = auth.uid()::text)
    )
  )
);

-- 3d. DELETE POLICY: Zero-Trust Prohibits Hard Deletions (only Super Admin fallback)
CREATE POLICY "transfers_delete_prohibited" ON public.transfers
FOR DELETE TO authenticated
USING (
  (SELECT public.get_my_role()) IN ('super_admin', 'CEO', 'ceo')
);

-- 4. SERVER-SIDE RPC: APPROVE TRANSFER (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.approve_transfer(
    p_transfer_id UUID,
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
    v_transfer RECORD;
    v_is_inter_regional BOOLEAN := false;
    v_is_hq_role BOOLEAN := false;
BEGIN
    -- 1. Fetch Transfer Record
    SELECT * INTO v_transfer FROM public.transfers WHERE id = p_transfer_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transfer % not found', p_transfer_id;
    END IF;

    -- 2. Status Guard: Must be Requested or Draft
    IF v_transfer.status NOT IN ('Requested', 'Draft') AND COALESCE(v_transfer.transfer_status, '') NOT IN ('Requested', 'Draft', '') THEN
        RAISE EXCEPTION 'Transfer cannot be approved from current status "%" (transfer_status: "%")', v_transfer.status, v_transfer.transfer_status;
    END IF;

    -- 3. Role Authorization Guard: Cashiers, Pickers, Packers cannot approve transfers
    IF p_approver_role IN ('cashier', 'picker', 'packer', 'driver', 'stock_clerk') THEN
        RAISE EXCEPTION 'Segregation of Duties Violation: Role "%" is not authorized to approve stock transfers', p_approver_role;
    END IF;

    -- 4. 4-Eyes Principle Guard: Requester cannot approve their own transfer
    IF p_approver_role NOT IN ('super_admin', 'CEO', 'ceo') AND v_transfer.requested_by IS NOT NULL THEN
        IF LOWER(TRIM(v_transfer.requested_by)) = LOWER(TRIM(p_approver_name)) THEN
            RAISE EXCEPTION 'Zero-Trust 4-Eyes Violation: Self-approval is prohibited. Transfer requester cannot approve their own transfer.';
        END IF;
    END IF;

    -- 5. Inter-Regional Governance Guard
    v_is_inter_regional := COALESCE(v_transfer.is_inter_region, false)
      OR (v_transfer.source_region_code IS NOT NULL AND v_transfer.dest_region_code IS NOT NULL AND v_transfer.source_region_code <> v_transfer.dest_region_code);

    v_is_hq_role := p_approver_role IN ('super_admin', 'CEO', 'ceo', 'operations_manager', 'logistics_manager');

    IF v_is_inter_regional AND NOT v_is_hq_role THEN
        RAISE EXCEPTION 'Authority Boundary Violation: Inter-Regional transfer between region % and region % requires National HQ Executive approval (Operations/Logistics Manager or CEO).',
            COALESCE(v_transfer.source_region_code, 'origin'), COALESCE(v_transfer.dest_region_code, 'destination');
    END IF;

    -- 6. Update transfers table
    UPDATE public.transfers
    SET status = 'Approved',
        transfer_status = 'Approved',
        approved_by = p_approver_name,
        approved_at = NOW(),
        approved_by_role = p_approver_role,
        approval_notes = p_notes,
        updated_at = NOW()
    WHERE id = p_transfer_id;

    -- 7. Synchronize linked WMS Jobs in wms_jobs table
    UPDATE public.wms_jobs
    SET transfer_status = 'Approved',
        status = CASE WHEN status = 'Draft' THEN 'Pending' ELSE status END,
        updated_at = NOW()
    WHERE (order_ref = p_transfer_id::text OR id::text = p_transfer_id::text OR order_ref = v_transfer.order_ref)
      AND type = 'TRANSFER';

    -- 8. Record Immutable Audit Log
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
        'TRANSFER_APPROVED',
        'Inventory',
        json_build_object(
            'transfer_id', p_transfer_id,
            'order_ref', v_transfer.order_ref,
            'source_site_id', v_transfer.source_site_id,
            'dest_site_id', v_transfer.dest_site_id,
            'is_inter_region', v_is_inter_regional,
            'approver_role', p_approver_role,
            'notes', p_notes
        )::text,
        v_transfer.source_site_id,
        v_transfer.country_code,
        'transfers',
        p_transfer_id::text,
        p_approver_id
    );

    RETURN json_build_object(
        'success', true,
        'transfer_id', p_transfer_id,
        'status', 'Approved',
        'approved_by', p_approver_name,
        'approved_at', NOW()
    );
END;
$$;

-- 5. SERVER-SIDE RPC: RECEIVE TRANSFER ATOMICALLY (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.receive_transfer_atomic(
    p_transfer_id UUID,
    p_receiver_id TEXT,
    p_receiver_name TEXT,
    p_receiver_role TEXT,
    p_has_discrepancy BOOLEAN DEFAULT false,
    p_discrepancy_details TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_transfer RECORD;
BEGIN
    -- 1. Fetch Transfer Record
    SELECT * INTO v_transfer FROM public.transfers WHERE id = p_transfer_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transfer % not found', p_transfer_id;
    END IF;

    -- 2. Status Guard: Must be Shipped, In-Transit, or Delivered
    IF v_transfer.status NOT IN ('In-Transit', 'Shipped', 'Delivered') 
       AND COALESCE(v_transfer.transfer_status, '') NOT IN ('In-Transit', 'Shipped', 'Delivered') THEN
        RAISE EXCEPTION 'Transfer cannot be received from current status "%" (transfer_status: "%"). Must be in-transit or delivered.',
            v_transfer.status, v_transfer.transfer_status;
    END IF;

    -- 3. Update transfers table with atomic sync
    UPDATE public.transfers
    SET status = 'Completed',
        transfer_status = 'Received',
        received_by = p_receiver_name,
        received_at = NOW(),
        has_discrepancy = p_has_discrepancy,
        discrepancy_details = p_discrepancy_details,
        updated_at = NOW()
    WHERE id = p_transfer_id;

    -- 4. Synchronize linked WMS Jobs
    UPDATE public.wms_jobs
    SET status = 'Completed',
        transfer_status = 'Received',
        received_at = NOW(),
        received_by = p_receiver_name,
        updated_at = NOW()
    WHERE (order_ref = p_transfer_id::text OR id::text = p_transfer_id::text OR order_ref = v_transfer.order_ref)
      AND type = 'TRANSFER';

    -- 5. Record Immutable Audit Log
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
        p_receiver_name,
        'TRANSFER_RECEIVED',
        'Inventory',
        json_build_object(
            'transfer_id', p_transfer_id,
            'order_ref', v_transfer.order_ref,
            'dest_site_id', v_transfer.dest_site_id,
            'receiver_role', p_receiver_role,
            'has_discrepancy', p_has_discrepancy,
            'discrepancy_details', p_discrepancy_details,
            'notes', p_notes
        )::text,
        v_transfer.dest_site_id,
        v_transfer.country_code,
        'transfers',
        p_transfer_id::text,
        p_receiver_id
    );

    RETURN json_build_object(
        'success', true,
        'transfer_id', p_transfer_id,
        'status', 'Completed',
        'transfer_status', 'Received',
        'received_by', p_receiver_name,
        'received_at', NOW()
    );
END;
$$;

-- 6. Grant execution privileges to authenticated users & service role
REVOKE EXECUTE ON FUNCTION public.approve_transfer(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_transfer(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.receive_transfer_atomic(UUID, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.receive_transfer_atomic(UUID, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT) TO authenticated, service_role;
