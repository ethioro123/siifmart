-- Migration: Enforce Dual-Control and Maker-Checker Segregation on Salary Requests
-- Prevents HR self-approval, enforces Finance/Executive sign-off, and sovereignly protects executive compensation

CREATE OR REPLACE FUNCTION public.guard_salary_request_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'pg_temp'
AS $$
DECLARE
  v_norm_role TEXT;
  v_my_name TEXT;
  v_is_ceo BOOLEAN;
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  
  v_norm_role := public.normalize_role(public.get_my_role());
  v_is_ceo := v_norm_role IN ('super_admin', 'ceo');

  -- When transitioning status to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- 1. Dual Control Check: Approver role MUST be Finance leadership or CEO/Admin
    IF v_norm_role NOT IN ('super_admin', 'ceo', 'admin', 'finance_manager', 'cfo', 'regional_finance_officer') THEN
      RAISE EXCEPTION 'Dual-Control Violation: Salary adjustments require Finance leadership or Executive approval (4-Eyes Principle).';
    END IF;

    -- 2. Maker-Checker Segregation: Requester cannot approve their own salary request
    IF NOT v_is_ceo AND (
      (OLD.requested_by IS NOT NULL AND LOWER(TRIM(OLD.requested_by)) = LOWER(TRIM(NEW.approved_by)))
      OR (OLD.employee_id = auth.uid())
    ) THEN
      RAISE EXCEPTION 'Maker-Checker Violation: Request initiator cannot approve their own compensation proposal.';
    END IF;

    -- 3. Executive Compensation Protection: Subordinate cannot approve salary adjustment for superiors or CEO
    IF EXISTS (
      SELECT 1 FROM public.employees e 
      WHERE e.id = OLD.employee_id 
        AND public.normalize_role(e.role) IN ('super_admin', 'ceo', 'admin')
    ) AND NOT v_is_ceo THEN
      RAISE EXCEPTION 'Executive Governance Violation: Only the Global CEO can authorize compensation changes for executive leadership.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_salary_request_decision ON public.salary_requests;
CREATE TRIGGER trg_guard_salary_request_decision
BEFORE UPDATE ON public.salary_requests
FOR EACH ROW
EXECUTE FUNCTION public.guard_salary_request_decision();

-- Update salary_requests_update_scoped to strictly enforce Finance / Executive approval
DROP POLICY IF EXISTS salary_requests_update_scoped ON public.salary_requests;
CREATE POLICY salary_requests_update_scoped ON public.salary_requests
FOR UPDATE TO authenticated
USING (
  public.normalize_role(public.get_my_role()) IN (
    'super_admin', 'ceo', 'admin', 'finance_manager', 'cfo', 'regional_finance_officer'
  )
  AND public.is_site_in_my_authorized_scope(site_id, country_code::text)
)
WITH CHECK (
  public.normalize_role(public.get_my_role()) IN (
    'super_admin', 'ceo', 'admin', 'finance_manager', 'cfo', 'regional_finance_officer'
  )
  AND public.is_site_in_my_authorized_scope(site_id, country_code::text)
);
