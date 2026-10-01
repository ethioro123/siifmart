-- ============================================================================
-- Migration: Create discount_codes table for Zero-Trust HQ Management
-- Date: 2026-09-25
-- Description:
--   1. Centralizes promo & discount codes in Supabase
--   2. Prevents branch cashiers/managers from creating unauthorized discounts
--   3. Enforces RLS: HQ creates/edits; authenticated cashiers can read/validate
--   4. Provides atomic RPC function to increment usage count on checkout
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON public.discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_status ON public.discount_codes(status);

-- Enable RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies
DROP POLICY IF EXISTS "discount_codes_select_policy" ON public.discount_codes;
DROP POLICY IF EXISTS "discount_codes_insert_policy" ON public.discount_codes;
DROP POLICY IF EXISTS "discount_codes_update_policy" ON public.discount_codes;
DROP POLICY IF EXISTS "discount_codes_delete_policy" ON public.discount_codes;

-- SELECT: Authenticated users (cashiers, managers, HQ) can read discount codes to validate
CREATE POLICY "discount_codes_select_policy" ON public.discount_codes
    FOR SELECT TO authenticated
    USING (true);

-- INSERT / UPDATE / DELETE: Strictly restricted to HQ management
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
