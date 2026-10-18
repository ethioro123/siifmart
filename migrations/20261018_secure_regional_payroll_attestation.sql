-- Record the authenticated regional HR actor and enforce country/region scope
-- for every write to the payroll regional-attestation fields.
ALTER TABLE public.payroll_runs
  ADD COLUMN IF NOT EXISTS regional_attested_by_id UUID;

CREATE OR REPLACE FUNCTION public.enforce_regional_payroll_attestation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_actor public.employees%ROWTYPE;
  v_region TEXT;
  v_country TEXT;
  v_site_matches BOOLEAN;
BEGIN
  IF OLD.regional_attested_by_id IS NOT NULL
     OR OLD.regional_attested_at IS NOT NULL
     OR OLD.regional_attested_by IS NOT NULL THEN
    RAISE EXCEPTION 'Regional HR attestation is already recorded and cannot be changed';
  END IF;

  IF auth.uid() IS NULL
     OR lower(coalesce(public.get_my_role(), '')) <> 'regional_hr_officer' THEN
    RAISE EXCEPTION 'Only the authenticated Regional HR Officer may attest payroll';
  END IF;

  SELECT e.* INTO v_actor
  FROM public.employees e
  WHERE e.id = auth.uid()
  LIMIT 1;

  IF v_actor.id IS NULL OR lower(coalesce(v_actor.role, '')) <> 'regional_hr_officer' THEN
    RAISE EXCEPTION 'Authenticated user has no active Regional HR employee record';
  END IF;

  v_region := public.get_my_region_code();
  v_country := public.get_my_country_code_strict();
  IF v_region IS NULL OR v_country IS NULL THEN
    RAISE EXCEPTION 'Regional HR country and region scope are required';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.sites s
    WHERE (s.id::text = NEW.site_id OR s.code = NEW.site_id)
      AND upper(s.country) = upper(NEW.country_code)
      AND upper(NEW.country_code) = upper(v_country)
      AND s.region_code = v_region
  ) INTO v_site_matches;

  IF NOT v_site_matches THEN
    RAISE EXCEPTION 'Payroll run is outside the authenticated Regional HR scope';
  END IF;

  -- Never trust signer identity, role, or timestamp supplied by the client.
  NEW.regional_attested_by_id := v_actor.id;
  NEW.regional_attested_by := v_actor.name;
  NEW.regional_attested_by_role := v_actor.role;
  NEW.regional_attested_at := clock_timestamp();
  NEW.updated_at := clock_timestamp();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS payroll_runs_enforce_regional_attestation ON public.payroll_runs;
CREATE TRIGGER payroll_runs_enforce_regional_attestation
  BEFORE UPDATE OF regional_attested_by_id, regional_attested_by,
    regional_attested_by_role, regional_attested_at, regional_notes
  ON public.payroll_runs
  FOR EACH ROW
  WHEN (
    OLD.regional_attested_by_id IS DISTINCT FROM NEW.regional_attested_by_id
    OR OLD.regional_attested_by IS DISTINCT FROM NEW.regional_attested_by
    OR OLD.regional_attested_by_role IS DISTINCT FROM NEW.regional_attested_by_role
    OR OLD.regional_attested_at IS DISTINCT FROM NEW.regional_attested_at
    OR OLD.regional_notes IS DISTINCT FROM NEW.regional_notes
  )
  EXECUTE FUNCTION public.enforce_regional_payroll_attestation();

CREATE OR REPLACE FUNCTION public.attest_payroll_regional_hr(
  p_run_id TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS public.payroll_runs
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_run public.payroll_runs%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL
     OR lower(coalesce(public.get_my_role(), '')) <> 'regional_hr_officer' THEN
    RAISE EXCEPTION 'Only the authenticated Regional HR Officer may attest payroll';
  END IF;

  SELECT * INTO v_run
  FROM public.payroll_runs
  WHERE id = p_run_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payroll run % not found or unavailable', p_run_id;
  END IF;

  IF v_run.regional_attested_at IS NOT NULL OR v_run.regional_attested_by_id IS NOT NULL THEN
    RAISE EXCEPTION 'Regional HR attestation is already recorded';
  END IF;

  UPDATE public.payroll_runs
  SET regional_attested_by_id = auth.uid(),
      regional_attested_by = 'server-verified',
      regional_attested_by_role = 'regional_hr_officer',
      regional_attested_at = clock_timestamp(),
      regional_notes = coalesce(p_notes, v_run.regional_notes)
  WHERE id = p_run_id
  RETURNING * INTO v_run;

  RETURN v_run;
END;
$$;

REVOKE ALL ON FUNCTION public.attest_payroll_regional_hr(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.attest_payroll_regional_hr(TEXT, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.enforce_regional_payroll_attestation() FROM PUBLIC, anon;
