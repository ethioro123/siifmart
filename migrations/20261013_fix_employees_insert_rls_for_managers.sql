-- ═══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: 20261013_fix_employees_insert_rls_for_managers.sql
-- DESCRIPTION: Allow Facility & Site Managers (Warehouse Manager, Store Manager, etc.)
--              to onboard facility talent (Pickers, Packers, Receivers, Drivers, etc.)
--              for their assigned site, while blocking creation of executive/HQ roles.
-- ═══════════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "employees_insert" ON public.employees;

CREATE POLICY "employees_insert" ON public.employees
    FOR INSERT TO authenticated
    WITH CHECK (
      -- 1. Executive / Regional / HR administrators can onboard staff across any site
      (SELECT public.is_admin())
      OR
      -- 2. Facility & Site Managers can onboard staff for their assigned site
      (
        (SELECT public.is_manager())
        AND (
          site_id = (SELECT public.get_my_site_id())
          OR (SELECT public.get_my_site_id()) IS NULL
        )
        AND role NOT IN (
          'super_admin', 'admin', 'CEO', 'ceo',
          'regional_manager', 'regional_procurement_lead', 'regional_finance_officer',
          'regional_hr_officer', 'regional_logistics_lead', 'regional_security_supervisor',
          'operations_manager', 'finance_manager', 'hr_manager', 'procurement_manager',
          'supply_chain_manager', 'merchandising_manager'
        )
      )
    );
