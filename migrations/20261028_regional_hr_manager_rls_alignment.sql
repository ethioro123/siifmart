-- ============================================================================
-- Migration: 20261028_regional_hr_manager_rls_alignment.sql
-- Purpose:
--   Align PostgreSQL RLS helper functions and policies for
--   regional_hr_manager and regional HR specialists:
--   1. Update private.hr_site_scope() to resolve
--      COALESCE(actor.region_code, home.region_code) when matching regional
--      HR specialists (talent_recruiter, training_coordinator,
--      payroll_specialist, hr_generalist).
--   2. Update payroll_runs_read_hr_support on public.payroll_runs to include
--      regional_hr_manager, hr_generalist, country_hr_director, and
--      regional_operations_manager alongside payroll_specialist so HR leaders
--      can read the payroll runs they initiate and approve.
--   3. Update facility_headcount_quotas_read_scoped and
--      headcount_quota_requests_scoped to cover regional_hr_manager,
--      area_operations_manager, hr_generalist, talent_recruiter, and
--      authorized hiring managers via private.hr_site_scope().
--   4. Update leave_requests_read_scoped and leave_requests_update_scoped
--      to include hr_generalist, regional_operations_manager,
--      area_operations_manager, store_manager, and warehouse_manager within
--      their authorized site scope.
--   5. Update employee_docs_read, employee_docs_insert, and
--      employee_docs_update to use private.hr_employee_scope() and include
--      area_operations_manager, talent_recruiter, and training_coordinator.
-- ============================================================================

BEGIN;

-- 1. Update private.hr_site_scope to resolve COALESCE(actor.region_code, home.region_code)
CREATE OR REPLACE FUNCTION private.hr_site_scope(
  p_site_id text,
  p_country_code text DEFAULT NULL::text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.is_site_in_my_authorized_scope(p_site_id, p_country_code)
    OR EXISTS (
      SELECT 1
      FROM public.employees actor
      JOIN public.sites home ON home.id = actor.site_id
      JOIN public.sites target ON target.id::text = p_site_id OR target.code = p_site_id
      WHERE actor.id = (SELECT auth.uid())
        AND COALESCE(lower(actor.status), 'active') = 'active'
        AND lower(actor.role) IN (
          'talent_recruiter',
          'training_coordinator',
          'payroll_specialist',
          'hr_generalist'
        )
        AND home.type = 'Administration'
        AND upper(home.country) = upper(target.country)
        AND (p_country_code IS NULL OR upper(p_country_code) = upper(target.country))
        AND (
          (home.code = upper(home.country) || '-HQ'
            AND home.region_code IS NULL AND actor.region_code IS NULL)
          OR (COALESCE(actor.region_code, home.region_code) IS NOT NULL
            AND lower(target.region_code) = lower(COALESCE(actor.region_code, home.region_code)))
        )
    );
$$;

-- 2. Update payroll_runs_read_hr_support on public.payroll_runs
DROP POLICY IF EXISTS "payroll_runs_read_hr_support" ON public.payroll_runs;
CREATE POLICY "payroll_runs_read_hr_support"
  ON public.payroll_runs
  FOR SELECT
  USING (
    lower(public.get_my_role()) = ANY (ARRAY[
      'regional_hr_manager'::text,
      'hr_generalist'::text,
      'country_hr_director'::text,
      'payroll_specialist'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text
    ])
    AND private.hr_site_scope(site_id, (country_code)::text)
  );

-- 3. Update facility_headcount_quotas_read_scoped and headcount_quota_requests_scoped
DROP POLICY IF EXISTS "facility_headcount_quotas_read_scoped" ON public.facility_headcount_quotas;
CREATE POLICY "facility_headcount_quotas_read_scoped"
  ON public.facility_headcount_quotas
  FOR SELECT
  USING (
    (
      public.is_manager()
      OR lower(public.get_my_role()) = ANY (ARRAY[
        'group_ceo'::text,
        'country_managing_director'::text,
        'country_hr_director'::text,
        'regional_hr_manager'::text,
        'hr_generalist'::text,
        'talent_recruiter'::text,
        'country_operations_director'::text,
        'regional_operations_manager'::text,
        'area_operations_manager'::text
      ])
    )
    AND private.hr_site_scope(site_id, (country_code)::text)
  );

DROP POLICY IF EXISTS "headcount_quota_requests_scoped" ON public.headcount_quota_requests;
CREATE POLICY "headcount_quota_requests_scoped"
  ON public.headcount_quota_requests
  FOR ALL
  USING (
    lower(public.get_my_role()) = ANY (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'country_hr_director'::text,
      'regional_hr_manager'::text,
      'hr_generalist'::text,
      'country_operations_director'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text
    ])
    AND private.hr_site_scope(site_id, (country_code)::text)
  )
  WITH CHECK (
    lower(public.get_my_role()) = ANY (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'country_hr_director'::text,
      'regional_hr_manager'::text,
      'hr_generalist'::text,
      'country_operations_director'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text
    ])
    AND private.hr_site_scope(site_id, (country_code)::text)
  );

-- 4. Update leave_requests_read_scoped and leave_requests_update_scoped
DROP POLICY IF EXISTS "leave_requests_read_scoped" ON public.leave_requests;
CREATE POLICY "leave_requests_read_scoped"
  ON public.leave_requests
  FOR SELECT
  USING (
    (employee_id = auth.uid())
    OR (
      lower(public.get_my_role()) = ANY (ARRAY[
        'group_ceo'::text,
        'country_managing_director'::text,
        'country_hr_director'::text,
        'regional_hr_manager'::text,
        'hr_generalist'::text,
        'country_operations_director'::text,
        'regional_operations_manager'::text,
        'area_operations_manager'::text,
        'store_manager'::text,
        'warehouse_manager'::text
      ])
      AND private.hr_site_scope(site_id, (country_code)::text)
    )
  );

DROP POLICY IF EXISTS "leave_requests_update_scoped" ON public.leave_requests;
CREATE POLICY "leave_requests_update_scoped"
  ON public.leave_requests
  FOR UPDATE
  USING (
    lower(public.get_my_role()) = ANY (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'country_hr_director'::text,
      'regional_hr_manager'::text,
      'hr_generalist'::text,
      'country_operations_director'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text,
      'store_manager'::text,
      'warehouse_manager'::text
    ])
    AND private.hr_site_scope(site_id, (country_code)::text)
  )
  WITH CHECK (
    lower(public.get_my_role()) = ANY (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'country_hr_director'::text,
      'regional_hr_manager'::text,
      'hr_generalist'::text,
      'country_operations_director'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text,
      'store_manager'::text,
      'warehouse_manager'::text
    ])
    AND private.hr_site_scope(site_id, (country_code)::text)
  );

-- 5. Update employee_documents policies to use private.hr_employee_scope
DROP POLICY IF EXISTS "employee_docs_read" ON public.employee_documents;
CREATE POLICY "employee_docs_read"
  ON public.employee_documents
  FOR SELECT
  USING (
    (employee_id = auth.uid())
    OR (
      (
        public.is_manager()
        OR lower(public.get_my_role()) = ANY (ARRAY[
          'group_ceo'::text,
          'country_managing_director'::text,
          'country_hr_director'::text,
          'regional_hr_manager'::text,
          'hr_generalist'::text,
          'talent_recruiter'::text,
          'training_coordinator'::text,
          'country_operations_director'::text,
          'regional_operations_manager'::text,
          'area_operations_manager'::text,
          'auditor'::text,
          'country_compliance_manager'::text
        ])
      )
      AND private.hr_employee_scope(employee_id, NULL::text)
    )
  );

DROP POLICY IF EXISTS "employee_docs_insert" ON public.employee_documents;
CREATE POLICY "employee_docs_insert"
  ON public.employee_documents
  FOR INSERT
  WITH CHECK (
    (employee_id = auth.uid())
    OR (
      (
        public.is_manager()
        OR lower(public.get_my_role()) = ANY (ARRAY[
          'group_ceo'::text,
          'country_managing_director'::text,
          'country_hr_director'::text,
          'regional_hr_manager'::text,
          'hr_generalist'::text,
          'talent_recruiter'::text,
          'training_coordinator'::text,
          'country_operations_director'::text,
          'regional_operations_manager'::text,
          'area_operations_manager'::text
        ])
      )
      AND private.hr_employee_scope(employee_id, NULL::text)
    )
  );

DROP POLICY IF EXISTS "employee_docs_update" ON public.employee_documents;
CREATE POLICY "employee_docs_update"
  ON public.employee_documents
  FOR UPDATE
  USING (
    lower(public.get_my_role()) = ANY (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'country_hr_director'::text,
      'regional_hr_manager'::text,
      'hr_generalist'::text,
      'talent_recruiter'::text,
      'training_coordinator'::text,
      'country_operations_director'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text
    ])
    AND private.hr_employee_scope(employee_id, NULL::text)
  )
  WITH CHECK (
    lower(public.get_my_role()) = ANY (ARRAY[
      'group_ceo'::text,
      'country_managing_director'::text,
      'country_hr_director'::text,
      'regional_hr_manager'::text,
      'hr_generalist'::text,
      'talent_recruiter'::text,
      'training_coordinator'::text,
      'country_operations_director'::text,
      'regional_operations_manager'::text,
      'area_operations_manager'::text
    ])
    AND private.hr_employee_scope(employee_id, NULL::text)
  );

COMMIT;
