-- Correct the global Group CEO assignment. Apply to SIIFMART Staging.
-- HQ is the existing non-regional scope; a NULL site denotes global leadership.
BEGIN;
UPDATE public.employees
SET site_id = NULL, region_code = NULL, scope_level = 'HQ',
    home_site_id = NULL, is_loaned = false, loaned_at = NULL
WHERE role = 'group_ceo';

UPDATE public.users u
SET region_code = NULL, updated_at = now()
FROM public.employees e
WHERE e.role = 'group_ceo' AND u.auth_id = e.id;

ALTER TABLE public.employees
  ADD CONSTRAINT employees_group_ceo_global_assignment_check
  CHECK (role <> 'group_ceo' OR (
    site_id IS NULL AND region_code IS NULL AND home_site_id IS NULL
    AND scope_level = 'HQ' AND NOT coalesce(is_loaned, false)
  ));

INSERT INTO public.system_logs (action, module, details)
VALUES ('GROUP_CEO_GLOBAL_ASSIGNMENT', 'Employees',
        'Removed country facility and region assignment from Group CEO; global leadership is separate from country staffing.');
COMMIT;
