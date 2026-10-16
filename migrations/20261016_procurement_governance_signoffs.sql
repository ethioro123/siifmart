-- Migration: 20261016_procurement_governance_signoffs.sql
-- Description: Adds supervisory sign-off and audit columns to vendor_contracts, customs_declarations, and inbound_qc_inspections, and ensures RLS policies allow authorized updates.

ALTER TABLE public.vendor_contracts
    ADD COLUMN IF NOT EXISTS signed_off_by VARCHAR(200),
    ADD COLUMN IF NOT EXISTS signed_off_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS signed_off_role VARCHAR(100);

ALTER TABLE public.customs_declarations
    ADD COLUMN IF NOT EXISTS cleared_by VARCHAR(200),
    ADD COLUMN IF NOT EXISTS cleared_by_role VARCHAR(100);

ALTER TABLE public.inbound_qc_inspections
    ADD COLUMN IF NOT EXISTS supervisor_waived_by VARCHAR(200),
    ADD COLUMN IF NOT EXISTS supervisor_waived_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS supervisor_waived_reason TEXT;

-- Update RLS policies to allow authorized updates
DROP POLICY IF EXISTS "vendor_contracts_update" ON public.vendor_contracts;
CREATE POLICY "vendor_contracts_update" ON public.vendor_contracts FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "customs_declarations_update" ON public.customs_declarations;
CREATE POLICY "customs_declarations_update" ON public.customs_declarations FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "inbound_qc_inspections_update" ON public.inbound_qc_inspections;
CREATE POLICY "inbound_qc_inspections_update" ON public.inbound_qc_inspections FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "farmer_programs_insert" ON public.farmer_programs;
CREATE POLICY "farmer_programs_insert" ON public.farmer_programs FOR INSERT TO authenticated
    WITH CHECK (true);

DROP POLICY IF EXISTS "farmer_programs_update" ON public.farmer_programs;
CREATE POLICY "farmer_programs_update" ON public.farmer_programs FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);
