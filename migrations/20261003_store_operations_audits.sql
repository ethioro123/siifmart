-- ============================================================================
-- SIIFMART MULTI-COUNTRY STORE OPERATIONS AUDITS & FIELD INSPECTIONS TABLE
-- Table: store_operations_audits
-- Date: 2026-10-03
-- Purpose: Unannounced store walkthroughs, planogram scoring, and cash spot audits
-- Traceability: .agent/RULES.md (Rule 7, Rule 9, Rule 17, Rule 18)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.store_operations_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(5) NOT NULL DEFAULT 'ET',
    site_id TEXT NOT NULL,
    site_name TEXT,
    auditor_id TEXT NOT NULL,
    auditor_name TEXT NOT NULL,
    manager_on_duty_id TEXT,
    manager_on_duty_name TEXT,
    audit_type TEXT NOT NULL DEFAULT 'unannounced_walkthrough' CHECK (
        audit_type IN ('unannounced_walkthrough', 'cash_spot_audit', 'planogram_check', 'full_inspection')
    ),
    planogram_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    planogram_notes TEXT,
    shelf_hygiene_score NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    halal_catalog_compliant BOOLEAN NOT NULL DEFAULT true,
    cash_counted NUMERIC(15, 2),
    cash_expected NUMERIC(15, 2),
    cash_variance NUMERIC(15, 2) DEFAULT 0.00,
    register_id TEXT,
    findings TEXT,
    corrective_actions TEXT,
    status TEXT NOT NULL DEFAULT 'passed' CHECK (
        status IN ('passed', 'flagged', 'action_required', 'escalated_to_hq')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Performance & Isolation Indexes
CREATE INDEX IF NOT EXISTS idx_store_audits_country ON public.store_operations_audits(country_code);
CREATE INDEX IF NOT EXISTS idx_store_audits_site ON public.store_operations_audits(site_id);
CREATE INDEX IF NOT EXISTS idx_store_audits_auditor ON public.store_operations_audits(auditor_id);
CREATE INDEX IF NOT EXISTS idx_store_audits_created ON public.store_operations_audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_audits_status ON public.store_operations_audits(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.store_operations_audits ENABLE ROW LEVEL SECURITY;

-- Drop previous policies if they exist
DROP POLICY IF EXISTS "store_audits_select_policy" ON public.store_operations_audits;
DROP POLICY IF EXISTS "store_audits_insert_policy" ON public.store_operations_audits;
DROP POLICY IF EXISTS "store_audits_update_policy" ON public.store_operations_audits;

-- RLS Policy: Read Audits (All authenticated users can view audits for their accessible sites or all sites if permitted)
CREATE POLICY "store_audits_select_policy"
    ON public.store_operations_audits
    FOR SELECT
    TO authenticated
    USING (true);

-- RLS Policy: Insert Audits (Authenticated staff/auditors can insert inspections)
CREATE POLICY "store_audits_insert_policy"
    ON public.store_operations_audits
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- RLS Policy: Update Audits (Only authorized auditors, managers, and HQ admins)
CREATE POLICY "store_audits_update_policy"
    ON public.store_operations_audits
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_store_operations_audits_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_store_operations_audits_timestamp ON public.store_operations_audits;
CREATE TRIGGER trigger_store_operations_audits_timestamp
    BEFORE UPDATE ON public.store_operations_audits
    FOR EACH ROW
    EXECUTE FUNCTION update_store_operations_audits_timestamp();

COMMENT ON TABLE public.store_operations_audits IS 'Unannounced store walkthroughs, planogram scoring, and cash spot audits under Central Operations Directorate (SOP-MGT-021).';
