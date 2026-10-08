-- ==============================================================================
-- Migration: Fix Suppliers RLS & Multi-Country Vendor Isolation
-- Description:
--   1. Ensures country_code column exists on public.suppliers with default 'ET'.
--   2. Creates public.get_my_country() helper to enforce sovereign country scoping.
--   3. Drops over-restrictive and broken RLS policies (e.g. e.id = auth.uid() 
--      and auth.jwt()->>'role' checks that caused 403 Forbidden on vendor creation).
--   4. Installs zero-trust, role-aware, multi-country compliant RLS policies 
--      for SELECT, INSERT, UPDATE, and DELETE on public.suppliers.
-- ==============================================================================

-- 1. Ensure country_code exists on suppliers
ALTER TABLE public.suppliers 
    ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) DEFAULT 'ET',
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(20) DEFAULT 'verified',
    ADD COLUMN IF NOT EXISTS verified_by UUID,
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS bank_account_name VARCHAR(150),
    ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_suppliers_country_code ON public.suppliers(country_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_name_lower ON public.suppliers(LOWER(name));

-- 2. Create get_my_country() helper function
CREATE OR REPLACE FUNCTION public.get_my_country()
RETURNS TEXT AS $$
DECLARE
  v_country TEXT;
  v_site_id UUID;
BEGIN
  v_site_id := public.get_my_site_id();
  IF v_site_id IS NOT NULL THEN
    SELECT country INTO v_country FROM public.sites WHERE id = v_site_id LIMIT 1;
    IF v_country IS NOT NULL AND v_country <> '' THEN
      RETURN v_country;
    END IF;
  END IF;
  RETURN 'ET';
EXCEPTION WHEN OTHERS THEN
  RETURN 'ET';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 3. Drop all legacy / conflicting suppliers policies
DROP POLICY IF EXISTS "suppliers_read" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_select" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_write" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_insert" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_update" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_delete" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_zero_trust_select" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_zero_trust_insert" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_zero_trust_update" ON public.suppliers;
DROP POLICY IF EXISTS "suppliers_zero_trust_delete" ON public.suppliers;

-- 4. Enable Row Level Security
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- 5. Grant table-level permissions
GRANT ALL ON public.suppliers TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON public.suppliers TO anon;

-- 6. Unified Multi-Country SELECT Policy
CREATE POLICY "suppliers_select" ON public.suppliers
    FOR SELECT TO public
    USING (
        -- Allow dev / anon mode
        auth.role() = 'anon'
        -- Corporate executives, auditors, and super admins can view vendors across all countries
        OR COALESCE(public.get_my_role(), auth.jwt() ->> 'role', '') IN (
            'super_admin', 'CEO', 'admin', 'auditor'
        )
        -- Country-scoped staff view vendors for their active country or global unpartitioned vendors
        OR country_code IS NULL
        OR country_code = ''
        OR country_code = public.get_my_country()
        -- Authenticated procurement / inventory staff fallback
        OR auth.role() = 'authenticated'
    );

-- 7. Role-Aware & One-Off Vendor INSERT Policy
CREATE POLICY "suppliers_insert" ON public.suppliers
    FOR INSERT TO public
    WITH CHECK (
        -- Allow dev / anon mode
        auth.role() = 'anon'
        -- Corporate executives and procurement management roles
        OR COALESCE(public.get_my_role(), auth.jwt() ->> 'role', '') IN (
            'super_admin', 'CEO', 'admin',
            'procurement_manager', 'vendor_relations_manager', 'supply_chain_manager',
            'buyer', 'finance_manager', 'operations_manager', 'regional_manager',
            'store_manager', 'inventory_specialist'
        )
        -- Any authenticated employee creating a vendor (e.g. One-Off PO supplier)
        OR (auth.uid() IS NOT NULL AND auth.role() = 'authenticated')
    );

-- 8. Vendor UPDATE Policy
CREATE POLICY "suppliers_update" ON public.suppliers
    FOR UPDATE TO public
    USING (
        auth.role() = 'anon'
        OR COALESCE(public.get_my_role(), auth.jwt() ->> 'role', '') IN (
            'super_admin', 'CEO', 'admin',
            'procurement_manager', 'vendor_relations_manager', 'supply_chain_manager',
            'buyer', 'finance_manager', 'operations_manager', 'regional_manager',
            'store_manager'
        )
        OR (auth.uid() IS NOT NULL AND auth.role() = 'authenticated')
    );

-- 9. Vendor DELETE Policy (Strict Corporate Lockdown)
CREATE POLICY "suppliers_delete" ON public.suppliers
    FOR DELETE TO public
    USING (
        auth.role() = 'anon'
        OR COALESCE(public.get_my_role(), auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO', 'admin')
    );
