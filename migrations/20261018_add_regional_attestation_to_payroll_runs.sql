-- ============================================================================
-- Migration: 20261018_add_regional_attestation_to_payroll_runs.sql
-- Purpose: Add regional audit attestation fields to public.payroll_runs so that
--          Regional HR officers can record formal regional roster audits rather
--          than just rendering an unrecorded display badge.
-- ============================================================================

ALTER TABLE public.payroll_runs
ADD COLUMN IF NOT EXISTS regional_attested_by TEXT,
ADD COLUMN IF NOT EXISTS regional_attested_by_role VARCHAR(50),
ADD COLUMN IF NOT EXISTS regional_attested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS regional_notes TEXT;

COMMENT ON COLUMN public.payroll_runs.regional_attested_by IS 'Regional HR Officer who audited regional headcount, attendance, and leave deductions';
COMMENT ON COLUMN public.payroll_runs.regional_attested_at IS 'Timestamp when regional HR performed roster audit';
COMMENT ON COLUMN public.payroll_runs.regional_notes IS 'Audit notes recorded during regional roster verification';
