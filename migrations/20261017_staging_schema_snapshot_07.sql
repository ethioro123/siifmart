-- Staging schema snapshot, part 07 of 16.
SET search_path = public, extensions, auth;
SET check_function_bodies = off;
CREATE OR REPLACE FUNCTION public.approve_purchase_order(p_po_id uuid, p_approver_id text, p_approver_name text, p_approver_role text, p_reason_code text, p_notes text DEFAULT ''::text, p_gps_coords text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

    SELECT * INTO v_po FROM public.purchase_orders WHERE id = p_po_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Purchase order % not found', p_po_id;
    END IF;

    IF v_po.status NOT IN ('Draft', 'Pending') THEN
        RAISE EXCEPTION 'Purchase order cannot be approved from current status "%"', v_po.status;
    END IF;

    IF v_effective_role IN ('warehouse_manager', 'store_manager', 'cashier', 'driver', 'picker', 'packer', 'receiver', 'stock_clerk') THEN
        RAISE EXCEPTION 'Segregation of Duties Violation: Role "%" is not authorized to approve purchase orders', v_effective_role;
    END IF;

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

    v_is_regional_role := v_effective_role IN ('regional_manager', 'regional_procurement_lead', 'regional_finance_officer');
    v_is_hq_role := v_effective_role IN ('super_admin', 'CEO', 'ceo', 'admin', 'procurement_manager', 'finance_manager', 'operations_manager');

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
$function$;
CREATE OR REPLACE FUNCTION public.approve_transfer(p_transfer_id uuid, p_approver_id text, p_approver_name text, p_approver_role text, p_notes text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_transfer RECORD;
    v_is_inter_regional BOOLEAN := false;
    v_is_hq_role BOOLEAN := false;
BEGIN
    SELECT * INTO v_transfer FROM public.transfers WHERE id = p_transfer_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transfer % not found', p_transfer_id;
    END IF;

    IF v_transfer.status NOT IN ('Requested', 'Draft') AND COALESCE(v_transfer.transfer_status, '') NOT IN ('Requested', 'Draft', '') THEN
        RAISE EXCEPTION 'Transfer cannot be approved from current status "%" (transfer_status: "%")', v_transfer.status, v_transfer.transfer_status;
    END IF;

    IF p_approver_role IN ('cashier', 'picker', 'packer', 'driver', 'stock_clerk') THEN
        RAISE EXCEPTION 'Segregation of Duties Violation: Role "%" is not authorized to approve stock transfers', p_approver_role;
    END IF;

    IF p_approver_role NOT IN ('super_admin', 'CEO', 'ceo') AND v_transfer.requested_by IS NOT NULL THEN
        IF LOWER(TRIM(v_transfer.requested_by)) = LOWER(TRIM(p_approver_name)) THEN
            RAISE EXCEPTION 'Zero-Trust 4-Eyes Violation: Self-approval is prohibited. Transfer requester cannot approve their own transfer.';
        END IF;
    END IF;

    v_is_inter_regional := COALESCE(v_transfer.is_inter_region, false)
      OR (v_transfer.source_region_code IS NOT NULL AND v_transfer.dest_region_code IS NOT NULL AND v_transfer.source_region_code <> v_transfer.dest_region_code);

    v_is_hq_role := p_approver_role IN ('super_admin', 'CEO', 'ceo', 'operations_manager', 'logistics_manager');

    IF v_is_inter_regional AND NOT v_is_hq_role THEN
        RAISE EXCEPTION 'Authority Boundary Violation: Inter-Regional transfer between region % and region % requires National HQ Executive approval (Operations/Logistics Manager or CEO).',
            COALESCE(v_transfer.source_region_code, 'origin'), COALESCE(v_transfer.dest_region_code, 'destination');
    END IF;

    UPDATE public.transfers
    SET status = 'Approved',
        transfer_status = 'Approved',
        approved_by = p_approver_name,
        approved_at = NOW(),
        approved_by_role = p_approver_role,
        approval_notes = p_notes,
        updated_at = NOW()
    WHERE id = p_transfer_id;

    UPDATE public.wms_jobs
    SET transfer_status = 'Approved',
        status = CASE WHEN status = 'Draft' THEN 'Pending' ELSE status END,
        updated_at = NOW()
    WHERE (order_ref = p_transfer_id::text OR id::text = p_transfer_id::text OR order_ref = v_transfer.order_ref)
      AND type = 'TRANSFER';

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
$function$;
CREATE OR REPLACE FUNCTION public.auto_provision_country_admin_site(p_country text, p_name text DEFAULT NULL::text, p_currency text DEFAULT NULL::text, p_address text DEFAULT NULL::text, p_region text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_site_id uuid;
    v_code text;
    v_name text;
    v_currency text;
    v_address text;
    v_region text;
    v_country text;
    v_next_site_num integer;
BEGIN
    v_country := UPPER(TRIM(p_country));
    IF v_country IS NULL OR v_country = '' THEN
        v_country := 'ET';
    END IF;
    
    -- Check if an Administration site already exists for this country
    SELECT id INTO v_site_id
    FROM sites
    WHERE UPPER(country) = v_country
      AND type IN ('Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations')
    LIMIT 1;

    IF v_site_id IS NOT NULL THEN
        RETURN v_site_id;
    END IF;

    -- Dynamically resolve next unique site_number to satisfy sites_site_number_unique constraint
    SELECT COALESCE(MAX(site_number), 0) + 1 INTO v_next_site_num FROM sites;

    -- Human-readable country-scoped site code: KE-01, UG-01, TZ-01, RW-01, ET-01
    v_code := v_country || '-01';
    
    -- Ensure code is unique in case of collision
    IF EXISTS (SELECT 1 FROM sites WHERE code = v_code) THEN
        v_code := generate_next_site_code(v_country);
    END IF;

    v_name := COALESCE(p_name, CASE 
        WHEN v_country = 'ET' THEN 'Central Operations'
        WHEN v_country = 'KE' THEN 'Kenya Central Operations'
        WHEN v_country = 'UG' THEN 'Uganda Central Operations'
        WHEN v_country = 'RW' THEN 'Rwanda Central Operations'
        WHEN v_country = 'TZ' THEN 'Tanzania Central Operations'
        ELSE v_country || ' Central Operations'
    END);
    v_currency := COALESCE(p_currency, CASE 
        WHEN v_country = 'ET' THEN 'ETB'
        WHEN v_country = 'KE' THEN 'KSh'
        WHEN v_country = 'UG' THEN 'USh'
        WHEN v_country = 'RW' THEN 'RWF'
        WHEN v_country = 'TZ' THEN 'TSh'
        ELSE 'USD'
    END);
    v_region := COALESCE(p_region, 'Central');
    v_address := COALESCE(p_address, v_region || ' Central Business District');

    -- Insert new Administration HQ with guaranteed unique site_number and human-readable code
    INSERT INTO sites (
        name,
        code,
        type,
        address,
        region,
        status,
        manager,
        country,
        currency,
        site_number,
        is_fulfillment_node,
        created_at,
        updated_at
    ) VALUES (
        v_name,
        v_code,
        'Administration',
        v_address,
        v_region,
        'Active',
        'HQ Administration',
        v_country,
        v_currency,
        v_next_site_num,
        false,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_site_id;

    RETURN v_site_id;
END;
$function$;
CREATE OR REPLACE FUNCTION public.calculate_job_assignment_duration()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
    NEW.actual_duration = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 60; -- minutes
  END IF;
  RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.check_po_destination_is_warehouse_or_dc()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_site_type text;
    v_site_name text;
BEGIN
    IF NEW.site_id IS NOT NULL THEN
        SELECT type, name INTO v_site_type, v_site_name 
        FROM sites 
        WHERE id = NEW.site_id;

        IF v_site_type IS NOT NULL AND v_site_type NOT IN ('Warehouse', 'Distribution Center') THEN
            RAISE EXCEPTION 'Procurement policy violation: Purchase orders can only be routed to a Warehouse or Distribution Center. Selected site "%" (%) is not an authorized storage node.', 
                COALESCE(v_site_name, NEW.site_id::text), v_site_type;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;
CREATE OR REPLACE FUNCTION public.cleanup_expired_system_logs(days_to_keep integer DEFAULT 60)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM public.system_logs
  WHERE created_at < (NOW() - (days_to_keep || ' days')::INTERVAL);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$function$;
SET check_function_bodies = on;
RESET search_path;
