-- Migration: Add driver dispatch fields to transfers
-- Purpose:
-- Differentiate between external logistics (couriers/third-party) where dispatch enables immediate receiving,
-- versus internal fleet drivers where the driver must confirm delivery before receiving is unlocked.

ALTER TABLE public.transfers
ADD COLUMN IF NOT EXISTS driver_type TEXT DEFAULT 'INTERNAL',
ADD COLUMN IF NOT EXISTS driver_id UUID,
ADD COLUMN IF NOT EXISTS driver_name TEXT,
ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dispatched_by TEXT;

COMMENT ON COLUMN public.transfers.driver_type IS 'INTERNAL (company fleet driver who must confirm delivery) or EXTERNAL (third-party courier where dispatch enables direct receiving)';
