-- ============================================================================
-- Migration: 20261013_add_shift_counter_and_cashier_code.sql
-- Description: Adds counter_number and cashier_code to shifts table
--              for strict 1-cashier-to-1-counter retail accountability.
-- ============================================================================

ALTER TABLE public.shifts 
ADD COLUMN IF NOT EXISTS counter_number TEXT DEFAULT 'Counter 1',
ADD COLUMN IF NOT EXISTS cashier_code TEXT;

-- Index for checking active counter occupancy per site
CREATE INDEX IF NOT EXISTS idx_shifts_site_counter_status 
ON public.shifts (site_id, counter_number, status);

-- Index for cashier shift lookup
CREATE INDEX IF NOT EXISTS idx_shifts_cashier_code_status 
ON public.shifts (cashier_code, status);
