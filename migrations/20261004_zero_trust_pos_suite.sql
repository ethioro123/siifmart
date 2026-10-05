-- ============================================================================
-- SIIFMART ZERO-TRUST POS ECOSYSTEM & CASH GOVERNANCE SUITE
-- Migration: 20261004_zero_trust_pos_suite.sql
-- Purpose:
--   1. Mid-Day Cash Safe Drops (pos_cash_drops)
--   2. Supervisory Overrides & Velocity Tracking (pos_supervisory_overrides)
--   3. Shift Table Zero-Trust Cash Drop & Country Scoping Expansion
--   4. Row-Level Security (RLS) & 4-Eyes Maker-Checker Enforcement
-- Traceability: .agent/RULES.md (Rule 1, Rule 2, Rule 7, Rule 9, Rule 18)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXPAND SHIFTS TABLE WITH CASH DROPS & SUPERVISORY AUDITING
-- ----------------------------------------------------------------------------
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) NOT NULL DEFAULT 'ET';
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS cash_drops NUMERIC(14, 2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS drop_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS supervisor_id TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS supervisor_name TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS supervisor_role TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS supervisor_signed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_shifts_country ON public.shifts(country_code);

-- ----------------------------------------------------------------------------
-- 2. MID-DAY CASH SAFE DROPS (pos_cash_drops)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pos_cash_drops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET',
    site_id TEXT NOT NULL,
    shift_id TEXT NOT NULL,
    drop_number TEXT NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'ETB',
    safe_bag_number TEXT,
    denominations JSONB DEFAULT '{}'::jsonb,
    reason TEXT NOT NULL DEFAULT 'threshold_exceeded',
    notes TEXT,
    
    -- Dual-Control 4-Eyes Sign-Off
    cashier_id TEXT NOT NULL,
    cashier_name TEXT NOT NULL,
    supervisor_id TEXT NOT NULL,
    supervisor_name TEXT NOT NULL,
    supervisor_role TEXT NOT NULL,
    
    -- Security Telemetry
    device_id TEXT,
    gps_coordinates TEXT,
    status TEXT NOT NULL DEFAULT 'deposited_in_safe' CHECK (
        status IN ('deposited_in_safe', 'transferred_to_bank', 'audited', 'variance_flagged')
    ),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Maker-Checker constraint: Cashier cannot be their own supervisor
    CONSTRAINT chk_cash_drop_dual_control CHECK (cashier_id <> supervisor_id)
);

CREATE INDEX IF NOT EXISTS idx_pos_cash_drops_country ON public.pos_cash_drops(country_code);
CREATE INDEX IF NOT EXISTS idx_pos_cash_drops_site ON public.pos_cash_drops(site_id);
CREATE INDEX IF NOT EXISTS idx_pos_cash_drops_shift ON public.pos_cash_drops(shift_id);
CREATE INDEX IF NOT EXISTS idx_pos_cash_drops_status ON public.pos_cash_drops(status);
CREATE INDEX IF NOT EXISTS idx_pos_cash_drops_created ON public.pos_cash_drops(created_at DESC);

ALTER TABLE public.pos_cash_drops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pos_cash_drops_read" ON public.pos_cash_drops;
DROP POLICY IF EXISTS "pos_cash_drops_insert" ON public.pos_cash_drops;
DROP POLICY IF EXISTS "pos_cash_drops_update" ON public.pos_cash_drops;

CREATE POLICY "pos_cash_drops_read" ON public.pos_cash_drops
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "pos_cash_drops_insert" ON public.pos_cash_drops
    FOR INSERT TO authenticated WITH CHECK (
        cashier_id IS NOT NULL AND supervisor_id IS NOT NULL AND cashier_id <> supervisor_id
    );

CREATE POLICY "pos_cash_drops_update" ON public.pos_cash_drops
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 3. SUPERVISORY OVERRIDES & VELOCITY TRACKING (pos_supervisory_overrides)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pos_supervisory_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET',
    site_id TEXT NOT NULL,
    shift_id TEXT,
    cashier_id TEXT NOT NULL,
    cashier_name TEXT NOT NULL,
    supervisor_id TEXT NOT NULL,
    supervisor_name TEXT NOT NULL,
    supervisor_role TEXT NOT NULL,
    
    override_type TEXT NOT NULL CHECK (
        override_type IN (
            'cart_void',
            'line_void',
            'price_override',
            'manual_discount',
            'return_refund',
            'no_sale_drawer_kick',
            'cash_threshold_bypass'
        )
    ),
    reason_code TEXT NOT NULL CHECK (
        reason_code IN (
            'customer_walkout',
            'wrong_item_scanned',
            'pricing_dispute',
            'accidental_duplicate',
            'damaged_defective_item',
            'manager_discretion_courtesy',
            'change_making',
            'till_audit_inspection',
            'cash_drawer_jam',
            'other_authorized'
        )
    ),
    reason_details TEXT,
    item_sku TEXT,
    item_name TEXT,
    original_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    override_value NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    device_id TEXT,
    gps_coordinates TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

    -- Maker-Checker constraint
    CONSTRAINT chk_override_maker_checker CHECK (cashier_id <> supervisor_id)
);

CREATE INDEX IF NOT EXISTS idx_pos_overrides_country ON public.pos_supervisory_overrides(country_code);
CREATE INDEX IF NOT EXISTS idx_pos_overrides_site ON public.pos_supervisory_overrides(site_id);
CREATE INDEX IF NOT EXISTS idx_pos_overrides_shift ON public.pos_supervisory_overrides(shift_id);
CREATE INDEX IF NOT EXISTS idx_pos_overrides_created ON public.pos_supervisory_overrides(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_overrides_type ON public.pos_supervisory_overrides(override_type);

ALTER TABLE public.pos_supervisory_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pos_overrides_read" ON public.pos_supervisory_overrides;
DROP POLICY IF EXISTS "pos_overrides_insert" ON public.pos_supervisory_overrides;

CREATE POLICY "pos_overrides_read" ON public.pos_supervisory_overrides
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "pos_overrides_insert" ON public.pos_supervisory_overrides
    FOR INSERT TO authenticated WITH CHECK (
        cashier_id <> supervisor_id
    );

COMMENT ON TABLE public.pos_cash_drops IS 'Dual-control mid-day safe skims when cash registers exceed safety thresholds.';
COMMENT ON TABLE public.pos_supervisory_overrides IS 'Audit trail of supervisory overrides (voids, kicks, refunds) with < 3% velocity tracking.';
