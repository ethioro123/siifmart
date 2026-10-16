-- Migration: Add transfer discrepancy resolution and loaned staff payroll attribution
-- Purpose:
-- 1. Support two-tier discrepancy resolution (Store Manager local resolution vs. Loss Prevention security escalation)
-- 2. Attribute loaned worker shift hours and payroll to their home branch (home_site_id)

-- 1. Transfer Discrepancy Resolution
ALTER TABLE public.transfers
ADD COLUMN IF NOT EXISTS discrepancy_resolution_type TEXT,
ADD COLUMN IF NOT EXISTS discrepancy_reason_code TEXT,
ADD COLUMN IF NOT EXISTS discrepancy_resolved_by TEXT,
ADD COLUMN IF NOT EXISTS discrepancy_resolved_at TIMESTAMPTZ;

COMMENT ON COLUMN public.transfers.discrepancy_resolution_type IS 'LOCAL_STORE_MANAGER or ESCALATED_LOSS_PREVENTION';
COMMENT ON COLUMN public.transfers.discrepancy_reason_code IS 'Audit reason code explaining the variance (e.g. DAMAGED_IN_TRANSIT, SUPPLIER_SHORT_PACK, MISCOUNT_ACCEPTED, RETURNED_TO_ORIGIN)';

-- 2. Shift Payroll Home Branch Attribution
ALTER TABLE public.shifts
ADD COLUMN IF NOT EXISTS home_site_id UUID;

COMMENT ON COLUMN public.shifts.home_site_id IS 'Home station of the cashier if loaned to this branch, ensuring payroll and hours remain with their home branch.';
