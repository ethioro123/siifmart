-- Migration: 20261021_dual_control_salary_and_compensation_governance.sql
-- Description: Unlocks HR initiation for team compensation adjustments and establishes atomic DB-level salary sync upon dual-control approval

-- 1. Drop existing restrictive insert policy on salary_requests
DROP POLICY IF EXISTS salary_requests_insert_scoped ON public.salary_requests;

-- 2. Create comprehensive insert policy allowing HR leaders to propose adjustments for employees in their scope
CREATE POLICY salary_requests_insert_scoped ON public.salary_requests
FOR INSERT TO authenticated
WITH CHECK (
  (
    -- HR leadership, Regional HR, Managing Directors, CEO & Super Admin
    (
      public.normalize_role(public.get_my_role()) IN ('super_admin', 'ceo', 'admin', 'hr_manager', 'regional_hr_officer', 'hr')
      AND public.is_site_in_my_authorized_scope(site_id, country_code::text)
    )
    -- OR self-request (employee submitting for own review)
    OR (
      employee_id = auth.uid()
      AND public.is_site_in_my_authorized_scope(site_id, country_code::text)
    )
  )
  AND (status::text = ANY (ARRAY['pending'::text, 'Pending'::text, 'draft'::text, 'Draft'::text]))
);

-- 3. Upgrade employees_update policy to permit Finance leadership to sync compensation
DROP POLICY IF EXISTS employees_update ON public.employees;

CREATE POLICY employees_update ON public.employees
FOR UPDATE TO authenticated
USING (
  (
    public.normalize_role(public.get_my_role()) IN (
      'super_admin', 'admin', 'ceo', 'hr_manager', 'hr', 'finance_manager'
    )
    AND public.is_site_in_my_authorized_scope(site_id::text)
  )
  OR (
    public.normalize_role(public.get_my_role()) IN ('regional_manager', 'regional_hr_officer', 'regional_finance_officer')
    AND (
      region_code = public.get_my_region_code()
      OR site_id IN (SELECT s.id FROM public.sites s WHERE s.region_code = public.get_my_region_code())
    )
    AND (
      public.normalize_role(role) NOT IN (
        'super_admin', 'admin', 'ceo', 'regional_manager', 'operations_manager', 'finance_manager', 'hr_manager'
      )
    )
  )
  OR (id = auth.uid())
  OR (lower(email::text) = lower(auth.jwt() ->> 'email'))
)
WITH CHECK (
  (
    public.normalize_role(public.get_my_role()) IN (
      'super_admin', 'admin', 'ceo', 'hr_manager', 'hr', 'finance_manager'
    )
    AND public.is_site_in_my_authorized_scope(site_id::text)
  )
  OR (
    public.normalize_role(public.get_my_role()) IN ('regional_manager', 'regional_hr_officer', 'regional_finance_officer')
    AND (
      region_code = public.get_my_region_code()
      OR site_id IN (SELECT s.id FROM public.sites s WHERE s.region_code = public.get_my_region_code())
    )
    AND (
      public.normalize_role(role) NOT IN (
        'super_admin', 'admin', 'ceo', 'regional_manager', 'operations_manager', 'finance_manager', 'hr_manager'
      )
    )
  )
  OR (id = auth.uid())
  OR (lower(email::text) = lower(auth.jwt() ->> 'email'))
);

-- 4. Create atomic trigger to sync public.employees.salary upon approved dual-control request
CREATE OR REPLACE FUNCTION public.handle_salary_request_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    -- Verify target employee exists and update compensation
    UPDATE public.employees
    SET salary = NEW.proposed_salary,
        updated_at = NOW()
    WHERE id = NEW.employee_id;

    -- Record atomic system audit log
    INSERT INTO public.system_logs (
      user_name,
      action,
      module,
      details,
      site_id,
      country_code,
      entity_type,
      entity_id,
      performed_by
    ) VALUES (
      COALESCE(NEW.approved_by, 'System'),
      'SALARY_CHANGE_APPROVED',
      'Finance',
      json_build_object(
        'request_id', NEW.id,
        'employee_id', NEW.employee_id,
        'employee_name', NEW.employee_name,
        'previous_salary', NEW.current_salary,
        'approved_salary', NEW.proposed_salary,
        'currency', NEW.currency,
        'approver_role', NEW.approved_by_role,
        'approved_by', NEW.approved_by
      )::text,
      NEW.site_id,
      NEW.country_code,
      'employees',
      NEW.employee_id::text,
      (SELECT auth.uid())::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_salary_request_approval ON public.salary_requests;
CREATE TRIGGER trg_handle_salary_request_approval
  AFTER UPDATE OF status ON public.salary_requests
  FOR EACH ROW
  WHEN (NEW.status = 'approved')
  EXECUTE FUNCTION public.handle_salary_request_approval();


-- 5. Fix legacy log_sensitive_change trigger on public.employees to match live system_logs schema
CREATE OR REPLACE FUNCTION public.log_sensitive_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF OLD.salary IS DISTINCT FROM NEW.salary THEN
    INSERT INTO public.system_logs (
      performed_by,
      employee_id,
      user_name,
      action,
      details,
      module,
      site_id,
      created_at
    )
    VALUES (
      (SELECT auth.uid())::text,
      NEW.id::text,
      COALESCE((SELECT name FROM public.employees WHERE id = auth.uid()), 'System'),
      'SALARY_UPDATE',
      'Salary changed for employee ' || NEW.name || ' (' || NEW.id || '): ' || COALESCE(OLD.salary, 0) || ' -> ' || COALESCE(NEW.salary, 0),
      'HR',
      NEW.site_id::text,
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;
