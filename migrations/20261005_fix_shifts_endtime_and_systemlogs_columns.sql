-- ============================================================================
-- Migration: Fix shifts end_time NOT NULL and system_logs country_code schema cache
-- Date: 2026-10-05
-- Description:
--   1. Drops NOT NULL constraint on public.shifts(end_time) so open shifts can be started.
--   2. Ensures public.shifts has country_code and all zero-trust columns.
--   3. Adds all compatibility columns to public.system_logs (country_code, site_id, employee_id, device_id, gps_location, metadata).
--   4. Signals PostgREST to immediately reload its schema cache.
-- ============================================================================

-- Step 1: Ensure shifts end_time is nullable (shifts are open upon creation)
ALTER TABLE public.shifts ALTER COLUMN end_time DROP NOT NULL;

-- Step 2: Ensure all shifts columns exist
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'ET';
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS shift_number TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS cashier_id TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS cashier_name TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS opening_float NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS cash_sales NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS card_sales NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS mobile_sales NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS expenses NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS cash_drops NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS drop_count NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS expected_cash NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS actual_cash NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS variance NUMERIC DEFAULT 0;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS denominations JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS discrepancy_reason TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS supervisor_id TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS supervisor_name TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS supervisor_role TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS supervisor_signed_at TIMESTAMPTZ;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Open';
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS reconciliation_status TEXT DEFAULT 'Pending';

-- Step 3: Add compatibility and Zero-Trust columns to system_logs
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS user_name    TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS ip_address   TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS created_at   TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS entity_type  TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS entity_id    TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS performed_by TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS site_id      TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS country_code TEXT DEFAULT 'ET';
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS module       TEXT DEFAULT 'General';
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS employee_id  TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS device_id    TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS gps_location TEXT;
ALTER TABLE public.system_logs ADD COLUMN IF NOT EXISTS metadata     JSONB DEFAULT '{}'::jsonb;

-- Step 4: Relax constraints on legacy system_logs columns so audits never fail
ALTER TABLE public.system_logs DROP CONSTRAINT IF EXISTS system_logs_module_check;
ALTER TABLE public.system_logs ALTER COLUMN module DROP NOT NULL;
ALTER TABLE public.system_logs ALTER COLUMN user_name DROP NOT NULL;

-- Step 5: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
