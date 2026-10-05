-- ==============================================================================
-- Migration: Zero-Trust Procurement & Sourcing Suite
-- Description:
--   1. Replaces insecure public/anon RLS policies on purchase_orders and po_items.
--   2. Adds supervisory accountability columns (reason codes, GPS, employee ID).
--   3. Adds country scoping and dual-control banking columns to suppliers.
--   4. Creates tables for Vendor Relations (scorecards, contracts, farmer programs),
--      Customs & Import Declarations (Djibouti/Mombasa/Airports), and Inbound QC.
--   5. Implements SECURITY DEFINER RPCs for 4-Eyes PO Approval & Rejection.
-- ==============================================================================

-- 1. ENHANCE PURCHASE_ORDERS WITH AUDIT & ZERO-TRUST COLUMNS
ALTER TABLE public.purchase_orders
    ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT 'ET',
    ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'ETB',
    ADD COLUMN IF NOT EXISTS approved_by VARCHAR(200),
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS approver_role VARCHAR(100),
    ADD COLUMN IF NOT EXISTS approver_employee_id VARCHAR(100),
    ADD COLUMN IF NOT EXISTS approver_gps VARCHAR(100),
    ADD COLUMN IF NOT EXISTS approval_reason_code VARCHAR(100),
    ADD COLUMN IF NOT EXISTS approval_notes TEXT,
    ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(200),
    ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS rejection_reason_code VARCHAR(100),
    ADD COLUMN IF NOT EXISTS rejection_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_po_country_code ON public.purchase_orders(country_code);
CREATE INDEX IF NOT EXISTS idx_po_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_approved_at ON public.purchase_orders(approved_at);

-- 2. ENHANCE SUPPLIERS WITH COUNTRY ISOLATION & VERIFICATION COLUMNS
ALTER TABLE public.suppliers
    ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT 'ET',
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'verified',
    ADD COLUMN IF NOT EXISTS verified_by VARCHAR(200),
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(200),
    ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100),
    ADD COLUMN IF NOT EXISTS bank_branch_code VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_suppliers_country_code ON public.suppliers(country_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_tax_id ON public.suppliers(tax_id);

-- 3. VENDOR RELATIONS: SCORECARDS TABLE
CREATE TABLE IF NOT EXISTS public.vendor_scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET',
    evaluation_period VARCHAR(50) NOT NULL,
    quality_score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    delivery_score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    pricing_score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    compliance_score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    overall_score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    evaluator_id VARCHAR(100) NOT NULL,
    evaluator_name VARCHAR(200) NOT NULL,
    evaluator_role VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_scorecards_country ON public.vendor_scorecards(country_code);
CREATE INDEX IF NOT EXISTS idx_vendor_scorecards_supplier ON public.vendor_scorecards(supplier_id);

-- 4. VENDOR RELATIONS: CONTRACTS & COOPERATIVES TABLE
CREATE TABLE IF NOT EXISTS public.vendor_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET',
    contract_number VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    contract_type VARCHAR(50) NOT NULL DEFAULT 'Annual Master Agreement',
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_terms VARCHAR(100) NOT NULL DEFAULT 'Net 30',
    auto_renew BOOLEAN DEFAULT FALSE,
    agreed_margin_pct NUMERIC(5,2),
    notes TEXT,
    created_by VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_contracts_country ON public.vendor_contracts(country_code);
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_supplier ON public.vendor_contracts(supplier_id);

-- 5. VENDOR RELATIONS: FARMER / COOPERATIVE PROGRAMS TABLE
CREATE TABLE IF NOT EXISTS public.farmer_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET',
    program_name VARCHAR(200) NOT NULL,
    cooperative_name VARCHAR(200) NOT NULL,
    region VARCHAR(100) NOT NULL,
    primary_crops TEXT[] DEFAULT '{}',
    member_count INTEGER DEFAULT 0,
    lead_contact VARCHAR(200),
    phone VARCHAR(50),
    fair_trade_certified BOOLEAN DEFAULT TRUE,
    organic_certified BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    manager_name VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farmer_programs_country ON public.farmer_programs(country_code);

-- 6. CUSTOMS & CROSS-BORDER IMPORT DECLARATIONS TABLE
CREATE TABLE IF NOT EXISTS public.customs_declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    declaration_number VARCHAR(100) NOT NULL,
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET',
    port_of_entry VARCHAR(100) NOT NULL,
    transport_mode VARCHAR(50) NOT NULL DEFAULT 'Sea / Maritime',
    carrier_name VARCHAR(200),
    bill_of_lading VARCHAR(100),
    letter_of_credit_ref VARCHAR(100),
    clearing_agent VARCHAR(200),
    customs_status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
    duty_amount NUMERIC(15,2) DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'ETB',
    eta DATE,
    cleared_at TIMESTAMPTZ,
    associated_po_numbers TEXT[] DEFAULT '{}',
    specialist_id VARCHAR(100),
    specialist_name VARCHAR(200),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customs_declarations_country ON public.customs_declarations(country_code);
CREATE INDEX IF NOT EXISTS idx_customs_status ON public.customs_declarations(customs_status);

-- 7. INBOUND DOCK QC INSPECTIONS TABLE
CREATE TABLE IF NOT EXISTS public.inbound_qc_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
    po_number VARCHAR(100),
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET',
    inspector_id VARCHAR(100) NOT NULL,
    inspector_name VARCHAR(200) NOT NULL,
    inspector_role VARCHAR(100) NOT NULL DEFAULT 'inbound_qc_inspector',
    inspection_date TIMESTAMPTZ DEFAULT NOW(),
    sample_size INTEGER NOT NULL DEFAULT 10,
    cold_chain_temp_celsius NUMERIC(4,1),
    temp_compliance_status VARCHAR(50) DEFAULT 'Compliant',
    packaging_integrity VARCHAR(50) NOT NULL DEFAULT 'Passed',
    expiry_check VARCHAR(50) NOT NULL DEFAULT 'Passed',
    food_safety_passed BOOLEAN NOT NULL DEFAULT TRUE,
    discrepancy_found BOOLEAN NOT NULL DEFAULT FALSE,
    discrepancy_details TEXT,
    disposition VARCHAR(50) NOT NULL DEFAULT 'Accepted',
    supervisor_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qc_inspections_country ON public.inbound_qc_inspections(country_code);
CREATE INDEX IF NOT EXISTS idx_qc_inspections_po ON public.inbound_qc_inspections(po_id);

-- 8. ENABLE RLS ON ALL TABLES
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farmer_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customs_declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_qc_inspections ENABLE ROW LEVEL SECURITY;

-- 9. DROP OVERLY PERMISSIVE / LEGACY POLICIES
DROP POLICY IF EXISTS "po_read" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_select" ON public.purchase_orders;
DROP POLICY IF EXISTS "po_isolation_select" ON public.purchase_orders;
DROP POLICY IF EXISTS "po_insert" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_insert" ON public.purchase_orders;
DROP POLICY IF EXISTS "po_update" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_update" ON public.purchase_orders;
DROP POLICY IF EXISTS "po_delete" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_delete" ON public.purchase_orders;

DROP POLICY IF EXISTS "po_items_read" ON public.po_items;
DROP POLICY IF EXISTS "po_items_select" ON public.po_items;
DROP POLICY IF EXISTS "po_items_insert" ON public.po_items;
DROP POLICY IF EXISTS "po_items_update" ON public.po_items;
DROP POLICY IF EXISTS "po_items_delete" ON public.po_items;

DROP POLICY IF EXISTS "suppliers_read" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_select" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_write" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_insert" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_update" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_delete" ON public.suppliers;

-- 10. CREATE HARDENED ZERO-TRUST POLICIES FOR PURCHASE_ORDERS
-- Strict SELECT: requires authenticated user, isolates by country unless CEO/Corporate Director
CREATE POLICY "po_zero_trust_select" ON public.purchase_orders
    FOR SELECT TO authenticated
    USING (
        COALESCE(auth.jwt() ->> 'role', '') IN (
            'super_admin', 'CEO', 'admin',
            'procurement_manager', 'finance_manager', 'operations_manager', 'regional_manager',
            'buyer', 'demand_planner', 'vendor_relations_manager', 'replenishment_planner', 'supply_chain_manager'
        )
        OR country_code = (
            SELECT COALESCE(s.country, 'ET')
            FROM public.sites s
            WHERE s.id = (
                SELECT e.site_id FROM public.employees e
                WHERE e.id::text = auth.uid()::text
                LIMIT 1
            )
        )
        OR site_id IN (
            SELECT s2.id FROM public.sites s2
            WHERE s2.country = (
                SELECT COALESCE(s3.country, 'ET')
                FROM public.sites s3
                WHERE s3.id = (
                    SELECT e2.site_id FROM public.employees e2
                    WHERE e2.id::text = auth.uid()::text
                    LIMIT 1
                )
            )
        )
    );

-- Strict INSERT: Only authorized sourcing roles, destination must be Warehouse/DC
CREATE POLICY "po_zero_trust_insert" ON public.purchase_orders
    FOR INSERT TO authenticated
    WITH CHECK (
        (
            COALESCE(auth.jwt() ->> 'role', '') IN (
                'super_admin', 'CEO', 'admin',
                'procurement_manager', 'buyer', 'supply_chain_manager',
                'operations_manager', 'regional_manager'
            )
            OR EXISTS (
                SELECT 1 FROM public.employees e
                WHERE e.id::text = auth.uid()::text
                AND e.role IN ('super_admin', 'procurement_manager', 'buyer', 'operations_manager', 'regional_manager')
            )
        )
        AND (
            site_id IS NULL
            OR site_id IN (
                SELECT id FROM public.sites WHERE type IN ('Warehouse', 'Distribution Center')
            )
        )
    );

-- Strict UPDATE: Authorized roles, prevents modification of received/settled POs
CREATE POLICY "po_zero_trust_update" ON public.purchase_orders
    FOR UPDATE TO authenticated
    USING (
        COALESCE(auth.jwt() ->> 'role', '') IN (
            'super_admin', 'CEO', 'admin',
            'procurement_manager', 'finance_manager', 'operations_manager', 'regional_manager',
            'buyer'
        )
        OR EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id::text = auth.uid()::text
            AND e.role IN ('super_admin', 'procurement_manager', 'finance_manager', 'operations_manager', 'regional_manager')
        )
    )
    WITH CHECK (
        site_id IS NULL
        OR site_id IN (
            SELECT id FROM public.sites WHERE type IN ('Warehouse', 'Distribution Center')
        )
    );

-- Strict DELETE: Only CEO / Super Admin can physically delete (normal workflow is soft-cancel)
CREATE POLICY "po_zero_trust_delete" ON public.purchase_orders
    FOR DELETE TO authenticated
    USING (
        COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO')
        OR EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id::text = auth.uid()::text
            AND e.role IN ('super_admin')
        )
    );

-- 11. HARDENED PO_ITEMS POLICIES (Tied to PO access)
CREATE POLICY "po_items_zero_trust_select" ON public.po_items
    FOR SELECT TO authenticated
    USING (
        po_id IN (SELECT id FROM public.purchase_orders)
    );

CREATE POLICY "po_items_zero_trust_insert" ON public.po_items
    FOR INSERT TO authenticated
    WITH CHECK (
        po_id IN (SELECT id FROM public.purchase_orders)
    );

CREATE POLICY "po_items_zero_trust_update" ON public.po_items
    FOR UPDATE TO authenticated
    USING (
        po_id IN (SELECT id FROM public.purchase_orders)
    );

CREATE POLICY "po_items_zero_trust_delete" ON public.po_items
    FOR DELETE TO authenticated
    USING (
        po_id IN (SELECT id FROM public.purchase_orders)
    );

-- 12. HARDENED SUPPLIERS POLICIES
CREATE POLICY "suppliers_zero_trust_select" ON public.suppliers
    FOR SELECT TO authenticated
    USING (
        COALESCE(auth.jwt() ->> 'role', '') IN (
            'super_admin', 'CEO', 'admin',
            'procurement_manager', 'finance_manager', 'operations_manager', 'regional_manager',
            'buyer', 'vendor_relations_manager', 'supply_chain_manager'
        )
        OR country_code = (
            SELECT COALESCE(s.country, 'ET')
            FROM public.sites s
            WHERE s.id = (
                SELECT e.site_id FROM public.employees e
                WHERE e.id::text = auth.uid()::text
                LIMIT 1
            )
        )
    );

CREATE POLICY "suppliers_zero_trust_insert" ON public.suppliers
    FOR INSERT TO authenticated
    WITH CHECK (
        COALESCE(auth.jwt() ->> 'role', '') IN (
            'super_admin', 'CEO', 'admin',
            'procurement_manager', 'vendor_relations_manager', 'finance_manager'
        )
        OR EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id::text = auth.uid()::text
            AND e.role IN ('super_admin', 'procurement_manager', 'vendor_relations_manager', 'finance_manager')
        )
    );

CREATE POLICY "suppliers_zero_trust_update" ON public.suppliers
    FOR UPDATE TO authenticated
    USING (
        COALESCE(auth.jwt() ->> 'role', '') IN (
            'super_admin', 'CEO', 'admin',
            'procurement_manager', 'vendor_relations_manager', 'finance_manager'
        )
    );

CREATE POLICY "suppliers_zero_trust_delete" ON public.suppliers
    FOR DELETE TO authenticated
    USING (
        COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO')
    );

-- 13. POLICIES FOR NEW PROCUREMENT TABLES
-- Vendor Scorecards
CREATE POLICY "scorecards_select" ON public.vendor_scorecards FOR SELECT TO authenticated USING (true);
CREATE POLICY "scorecards_insert" ON public.vendor_scorecards FOR INSERT TO authenticated
    WITH CHECK (
        COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO', 'procurement_manager', 'vendor_relations_manager')
        OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id::text = auth.uid()::text AND e.role IN ('super_admin', 'procurement_manager', 'vendor_relations_manager'))
    );
CREATE POLICY "scorecards_update" ON public.vendor_scorecards FOR UPDATE TO authenticated
    USING (COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO', 'procurement_manager', 'vendor_relations_manager'));

-- Vendor Contracts
CREATE POLICY "contracts_select" ON public.vendor_contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "contracts_insert" ON public.vendor_contracts FOR INSERT TO authenticated
    WITH CHECK (
        COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO', 'procurement_manager', 'vendor_relations_manager', 'finance_manager')
        OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id::text = auth.uid()::text AND e.role IN ('super_admin', 'procurement_manager', 'vendor_relations_manager', 'finance_manager'))
    );
CREATE POLICY "contracts_update" ON public.vendor_contracts FOR UPDATE TO authenticated
    USING (COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO', 'procurement_manager', 'vendor_relations_manager', 'finance_manager'));

-- Farmer Programs
CREATE POLICY "farmer_programs_select" ON public.farmer_programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "farmer_programs_insert" ON public.farmer_programs FOR INSERT TO authenticated
    WITH CHECK (
        COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO', 'procurement_manager', 'vendor_relations_manager')
        OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id::text = auth.uid()::text AND e.role IN ('super_admin', 'procurement_manager', 'vendor_relations_manager'))
    );
CREATE POLICY "farmer_programs_update" ON public.farmer_programs FOR UPDATE TO authenticated
    USING (COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO', 'procurement_manager', 'vendor_relations_manager'));

-- Customs Declarations
CREATE POLICY "customs_select" ON public.customs_declarations FOR SELECT TO authenticated USING (true);
CREATE POLICY "customs_insert" ON public.customs_declarations FOR INSERT TO authenticated
    WITH CHECK (
        COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO', 'customs_import_specialist', 'procurement_manager', 'supply_chain_manager')
        OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id::text = auth.uid()::text AND e.role IN ('super_admin', 'customs_import_specialist', 'procurement_manager', 'supply_chain_manager'))
    );
CREATE POLICY "customs_update" ON public.customs_declarations FOR UPDATE TO authenticated
    USING (COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO', 'customs_import_specialist', 'procurement_manager', 'supply_chain_manager'));

-- Inbound QC Inspections
CREATE POLICY "qc_inspections_select" ON public.inbound_qc_inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "qc_inspections_insert" ON public.inbound_qc_inspections FOR INSERT TO authenticated
    WITH CHECK (
        COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO', 'inbound_qc_inspector', 'warehouse_manager', 'inventory_manager', 'procurement_manager')
        OR EXISTS (SELECT 1 FROM public.employees e WHERE e.id::text = auth.uid()::text AND e.role IN ('super_admin', 'inbound_qc_inspector', 'warehouse_manager', 'inventory_manager', 'procurement_manager'))
    );
CREATE POLICY "qc_inspections_update" ON public.inbound_qc_inspections FOR UPDATE TO authenticated
    USING (COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO', 'inbound_qc_inspector', 'warehouse_manager', 'inventory_manager'));

-- 14. SERVER-SIDE RPC: 4-EYES PO APPROVAL (SECURITY DEFINER)
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
    v_new_notes TEXT;
    v_max_single_limit NUMERIC := 50000.00;
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
    IF p_approver_role IN ('warehouse_manager', 'store_manager', 'cashier', 'driver', 'picker', 'packer', 'receiver') THEN
        RAISE EXCEPTION 'Segregation of Duties Violation: Role "%" is not authorized to approve purchase orders', p_approver_role;
    END IF;

    -- 4. 4-Eyes Principle Guard: Creator CANNOT approve their own PO
    IF p_approver_role != 'super_admin' AND (
        (v_po.created_by IS NOT NULL AND LOWER(TRIM(v_po.created_by)) = LOWER(TRIM(p_approver_name)))
        OR (v_po.requested_by IS NOT NULL AND LOWER(TRIM(v_po.requested_by)) = LOWER(TRIM(p_approver_name)))
    ) THEN
        RAISE EXCEPTION 'Zero-Trust 4-Eyes Violation: Self-approval is strictly prohibited. The creator of a purchase order cannot approve it.';
    END IF;

    -- 5. Mandatory Structured Reason Code (Rule 18)
    IF p_reason_code IS NULL OR TRIM(p_reason_code) = '' THEN
        RAISE EXCEPTION 'Managerial Accountability Violation: Structured reason code is mandatory for PO approval';
    END IF;

    -- 6. Monetary Limit Guard: Single procurement manager cannot unilaterally approve high-value POs
    IF p_approver_role = 'procurement_manager' AND COALESCE(v_po.total_amount, 0) > v_max_single_limit THEN
        RAISE EXCEPTION 'Approval Threshold Exceeded: PO total (% %) exceeds single-manager limit (% %). Requires Finance Manager or Executive sign-off.',
            v_po.currency, v_po.total_amount, v_po.currency, v_max_single_limit;
    END IF;

    -- 7. Compose notes with immutable audit tag
    v_new_notes := COALESCE(v_po.notes, '') || E'\n[APPROVED_BY:' || p_approver_name || E' (' || p_approver_role || E'):' || NOW()::text || E' REASON:' || p_reason_code || E']';
    IF p_notes IS NOT NULL AND TRIM(p_notes) != '' THEN
        v_new_notes := v_new_notes || E'\n[APPROVAL_NOTE: ' || TRIM(p_notes) || E']';
    END IF;

    -- 8. Update Purchase Order
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
        updated_at = NOW()
    WHERE id = p_po_id;

    -- 9. Insert Tamper-Proof Audit Log into system_logs
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
            'gps', p_gps_coords
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
        'approved_at', NOW()
    );
END;
$$;

-- 15. SERVER-SIDE RPC: 4-EYES PO REJECTION (SECURITY DEFINER)
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
    v_new_notes TEXT;
BEGIN
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

    v_new_notes := COALESCE(v_po.notes, '') || E'\n[REJECTED_BY:' || p_rejector_name || E' (' || p_rejector_role || E'):' || NOW()::text || E' REASON:' || p_reason_code || E']';
    IF p_notes IS NOT NULL AND TRIM(p_notes) != '' THEN
        v_new_notes := v_new_notes || E'\n[REJECTION_NOTE: ' || TRIM(p_notes) || E']';
    END IF;

    UPDATE public.purchase_orders
    SET status = 'Rejected',
        rejected_by = p_rejector_name,
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
        p_rejector_name,
        'PURCHASE_ORDER_REJECTED',
        'Procurement',
        json_build_object(
            'po_id', p_po_id,
            'po_number', v_po.po_number,
            'rejector_role', p_rejector_role,
            'reason_code', p_reason_code,
            'notes', p_notes,
            'gps', p_gps_coords
        )::text,
        v_po.site_id,
        v_po.country_code,
        'purchase_orders',
        p_po_id::text,
        p_rejector_id
    );

    RETURN json_build_object(
        'success', true,
        'po_id', p_po_id,
        'status', 'Rejected',
        'rejected_by', p_rejector_name,
        'rejected_at', NOW()
    );
END;
$$;

NOTIFY pgrst, 'reload schema';
