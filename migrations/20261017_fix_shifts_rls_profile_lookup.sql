-- Fix authenticated shifts reads that referenced auth.users directly from RLS.
-- Profile lookups use narrowly scoped SECURITY DEFINER helpers instead, and
-- NULL-site shifts are visible only to HQ-level roles.

BEGIN;

DROP POLICY IF EXISTS "shifts_select_policy" ON public.shifts;

CREATE POLICY "shifts_select_policy" ON public.shifts
FOR SELECT TO authenticated
USING (
  (
    (SELECT COALESCE(public.get_my_role(), (SELECT auth.jwt() ->> 'role')))
    = ANY (ARRAY[
      'super_admin', 'admin', 'CEO', 'finance_manager',
      'auditor', 'operations_manager'
    ]::text[])
  )
  OR (
    (SELECT COALESCE(public.get_my_role(), (SELECT auth.jwt() ->> 'role'))) = 'regional_manager'
    AND site_id IN (
      SELECT s.id
      FROM public.sites AS s
      WHERE s.region_code = (SELECT public.get_my_region_code())
    )
  )
  OR site_id = (SELECT public.get_my_site_id())
  OR (
    site_id IS NULL
    AND (SELECT COALESCE(public.get_my_role(), (SELECT auth.jwt() ->> 'role')))
      = ANY (ARRAY[
        'super_admin', 'admin', 'CEO', 'finance_manager',
        'auditor', 'operations_manager'
      ]::text[])
  )
);

COMMIT;
