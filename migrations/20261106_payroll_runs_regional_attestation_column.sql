-- Add regional_attested_by_id column to payroll_runs for authenticated regional HR attestation
ALTER TABLE public.payroll_runs
  ADD COLUMN IF NOT EXISTS regional_attested_by_id UUID;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
