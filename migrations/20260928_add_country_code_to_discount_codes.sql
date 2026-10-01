-- ============================================================================
-- Migration: Add country_code to discount_codes for Multi-Country Isolation
-- ============================================================================

-- 1. Add columns directly using standard idempotent DDL
ALTER TABLE public.discount_codes 
ADD COLUMN IF NOT EXISTS country_code TEXT NOT NULL DEFAULT 'ET';

ALTER TABLE public.discount_codes 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'ETB';

-- 2. Indexes for national scoping & fast lookup
CREATE INDEX IF NOT EXISTS idx_discount_codes_country 
ON public.discount_codes(country_code);

CREATE INDEX IF NOT EXISTS idx_discount_codes_country_code 
ON public.discount_codes(country_code, code);

-- 3. Enable and configure Row Level Security (RLS)
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "discount_codes_select_policy" ON public.discount_codes;
DROP POLICY IF EXISTS "discount_codes_insert_policy" ON public.discount_codes;
DROP POLICY IF EXISTS "discount_codes_update_policy" ON public.discount_codes;
DROP POLICY IF EXISTS "discount_codes_delete_policy" ON public.discount_codes;

-- SELECT: Authenticated users can view discount codes
CREATE POLICY "discount_codes_select_policy" ON public.discount_codes
    FOR SELECT TO authenticated
    USING (true);

-- INSERT: Restricted to HQ management roles
CREATE POLICY "discount_codes_insert_policy" ON public.discount_codes
    FOR INSERT TO authenticated
    WITH CHECK (
        COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'admin', 'CEO', 'finance_manager', 'operations_manager')
    );

-- UPDATE: Restricted to HQ management roles
CREATE POLICY "discount_codes_update_policy" ON public.discount_codes
    FOR UPDATE TO authenticated
    USING (
        COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'admin', 'CEO', 'finance_manager', 'operations_manager')
    )
    WITH CHECK (
        COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'admin', 'CEO', 'finance_manager', 'operations_manager')
    );

-- DELETE: Restricted to corporate executives
CREATE POLICY "discount_codes_delete_policy" ON public.discount_codes
    FOR DELETE TO authenticated
    USING (
        COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'admin', 'CEO')
    );
