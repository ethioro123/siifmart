-- ============================================================================
-- SIIFMART: Zero-Trust Ethiopia HQ Oversight & Anti-Tampering Migration
-- Date: 2026-09-25
-- Target: Run directly in Supabase SQL Editor
-- 
-- Contents:
--   PART 1: Shifts Table Expansion & Daily HQ Cash Drawer Balancing
--   PART 2: Centralized Promo & Discount Codes Management (HQ Only)
--   PART 3: Row Level Security (RLS) & Anti-Tamper Enforcement
-- ============================================================================

-- ============================================================================
-- PART 1: SHIFTS & CASH RECONCILIATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.shifts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    site_id UUID,
    status TEXT NOT NULL DEFAULT 'Open',
    notes TEXT
);

ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS shift_number TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS cashier_id TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS cashier_name TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS opening_float NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS cash_sales NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS card_sales NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS mobile_sales NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS expenses NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS expected_cash NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS actual_cash NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS variance NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS denominations JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS discrepancy_reason TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS closed_by TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS reconciled_by TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS reconciled_at TIMESTAMPTZ;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS reconciliation_status TEXT DEFAULT 'Pending';
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS hq_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_shifts_site_id ON public.shifts(site_id);
CREATE INDEX IF NOT EXISTS idx_shifts_cashier_id ON public.shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON public.shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_start_time ON public.shifts(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_shifts_reconciliation_status ON public.shifts(reconciliation_status);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "shifts_select_policy" ON public.shifts;
DROP POLICY IF EXISTS "shifts_insert_policy" ON public.shifts;
DROP POLICY IF EXISTS "shifts_update_policy" ON public.shifts;
DROP POLICY IF EXISTS "shifts_delete_policy" ON public.shifts;

CREATE POLICY "shifts_select_policy" ON public.shifts
    FOR SELECT TO authenticated
    USING (
        (SELECT COALESCE(public.get_my_role(), auth.jwt() ->> 'role')) IN ('super_admin', 'admin', 'CEO', 'finance_manager', 'auditor', 'operations_manager', 'regional_manager')
        OR site_id::text = (SELECT public.get_my_site_id())::text
        OR site_id::text = (SELECT site_id::text FROM public.employees WHERE id::text = auth.uid()::text LIMIT 1)
        OR site_id IS NULL
    );

CREATE POLICY "shifts_insert_policy" ON public.shifts
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) IS NOT NULL
    );

CREATE POLICY "shifts_update_policy" ON public.shifts
    FOR UPDATE TO authenticated
    USING (
        (SELECT COALESCE(public.get_my_role(), auth.jwt() ->> 'role')) IN ('super_admin', 'admin', 'CEO', 'finance_manager', 'auditor', 'operations_manager', 'store_manager')
        OR cashier_id::text = auth.uid()::text
        OR cashier_id::text = (SELECT code::text FROM public.employees WHERE id::text = auth.uid()::text LIMIT 1)
    )
    WITH CHECK (
        (SELECT COALESCE(public.get_my_role(), auth.jwt() ->> 'role')) IN ('super_admin', 'admin', 'CEO', 'finance_manager', 'auditor', 'operations_manager', 'store_manager')
        OR cashier_id::text = auth.uid()::text
        OR cashier_id::text = (SELECT code::text FROM public.employees WHERE id::text = auth.uid()::text LIMIT 1)
    );

CREATE POLICY "shifts_delete_policy" ON public.shifts
    FOR DELETE TO authenticated
    USING (
        (SELECT COALESCE(public.get_my_role(), auth.jwt() ->> 'role')) IN ('super_admin', 'admin', 'CEO')
    );

-- ============================================================================
-- PART 2: PROMO & DISCOUNT CODES (CENTRAL HQ OVERSIGHT)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.discount_codes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('PERCENTAGE', 'FIXED')),
    value NUMERIC NOT NULL CHECK (value > 0),
    min_purchase_amount NUMERIC DEFAULT 0,
    max_discount_amount NUMERIC,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    valid_until TIMESTAMPTZ NOT NULL,
    usage_limit INT,
    usage_count INT NOT NULL DEFAULT 0,
    per_customer_limit INT,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Expired', 'Disabled', 'Scheduled')),
    applicable_sites TEXT[] DEFAULT NULL,
    description TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON public.discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_status ON public.discount_codes(status);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "discount_codes_select_policy" ON public.discount_codes;
DROP POLICY IF EXISTS "discount_codes_insert_policy" ON public.discount_codes;
DROP POLICY IF EXISTS "discount_codes_update_policy" ON public.discount_codes;
DROP POLICY IF EXISTS "discount_codes_delete_policy" ON public.discount_codes;

CREATE POLICY "discount_codes_select_policy" ON public.discount_codes
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "discount_codes_insert_policy" ON public.discount_codes
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT COALESCE(public.get_my_role(), auth.jwt() ->> 'role')) IN ('super_admin', 'admin', 'CEO', 'finance_manager', 'operations_manager')
    );

CREATE POLICY "discount_codes_update_policy" ON public.discount_codes
    FOR UPDATE TO authenticated
    USING (
        (SELECT COALESCE(public.get_my_role(), auth.jwt() ->> 'role')) IN ('super_admin', 'admin', 'CEO', 'finance_manager', 'operations_manager')
    )
    WITH CHECK (
        (SELECT COALESCE(public.get_my_role(), auth.jwt() ->> 'role')) IN ('super_admin', 'admin', 'CEO', 'finance_manager', 'operations_manager')
    );

CREATE POLICY "discount_codes_delete_policy" ON public.discount_codes
    FOR DELETE TO authenticated
    USING (
        (SELECT COALESCE(public.get_my_role(), auth.jwt() ->> 'role')) IN ('super_admin', 'admin', 'CEO')
    );

-- Atomic RPC function for incrementing usage count on sale checkout
CREATE OR REPLACE FUNCTION public.increment_discount_usage(code_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.discount_codes
    SET usage_count = usage_count + 1,
        updated_at = timezone('utc'::text, now())
    WHERE id = code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
