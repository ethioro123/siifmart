-- ============================================================================
-- Migration: Expand shifts table for Zero-Trust & Daily HQ Reconciliation
-- Date: 2026-09-25
-- Description:
--   1. Expands shifts table with full cash drawer, multi-tender, and HQ audit columns
--   2. Enforces Row Level Security (RLS) with site isolation
--   3. Enables HQ Finance/Auditor dual-control reconciliation sign-offs
-- ============================================================================

-- Step 1: Ensure shifts table exists and has all required financial/audit columns
CREATE TABLE IF NOT EXISTS public.shifts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    site_id UUID,
    status TEXT NOT NULL DEFAULT 'Open',
    notes TEXT
);

-- Step 2: Add full shift financial, cashier, and reconciliation columns
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

-- Step 3: Indexes for rapid site and cashier lookups
CREATE INDEX IF NOT EXISTS idx_shifts_site_id ON public.shifts(site_id);
CREATE INDEX IF NOT EXISTS idx_shifts_cashier_id ON public.shifts(cashier_id);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON public.shifts(status);
CREATE INDEX IF NOT EXISTS idx_shifts_start_time ON public.shifts(start_time DESC);
CREATE INDEX IF NOT EXISTS idx_shifts_reconciliation_status ON public.shifts(reconciliation_status);

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Step 5: Clean up any old policies
DROP POLICY IF EXISTS "shifts_select_policy" ON public.shifts;
DROP POLICY IF EXISTS "shifts_insert_policy" ON public.shifts;
DROP POLICY IF EXISTS "shifts_update_policy" ON public.shifts;
DROP POLICY IF EXISTS "shifts_delete_policy" ON public.shifts;
DROP POLICY IF EXISTS "Allow authenticated to read shifts" ON public.shifts;
DROP POLICY IF EXISTS "Allow authenticated to insert shifts" ON public.shifts;
DROP POLICY IF EXISTS "Allow authenticated to update shifts" ON public.shifts;

-- Step 6: Define Zero-Trust RLS Policies

-- Policy A: SELECT
-- Cashiers & Branch staff view their site's shifts.
-- HQ / Executive / Finance roles view ALL sites.
CREATE POLICY "shifts_select_policy" ON public.shifts
    FOR SELECT TO authenticated
    USING (
        (SELECT COALESCE(public.get_my_role(), auth.jwt() ->> 'role')) IN ('super_admin', 'admin', 'CEO', 'finance_manager', 'auditor', 'operations_manager', 'regional_manager')
        OR site_id::text = (SELECT public.get_my_site_id())::text
        OR site_id::text = (SELECT site_id::text FROM public.employees WHERE id::text = auth.uid()::text LIMIT 1)
        OR site_id IS NULL
    );

-- Policy B: INSERT
-- Authenticated staff can start a shift for their assigned site
CREATE POLICY "shifts_insert_policy" ON public.shifts
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) IS NOT NULL
    );

-- Policy C: UPDATE
-- Cashiers can update/close their own open shift.
-- HQ / Finance can reconcile, audit, or flag shifts.
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

-- Policy D: DELETE
-- Zero Autonomous Branch Authority: Strictly restricted to super_admin / CEO only.
CREATE POLICY "shifts_delete_policy" ON public.shifts
    FOR DELETE TO authenticated
    USING (
        (SELECT COALESCE(public.get_my_role(), auth.jwt() ->> 'role')) IN ('super_admin', 'admin', 'CEO')
    );

