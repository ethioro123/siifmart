-- Migration: Restore staging quick login test accounts
-- Re-activates role-coverage staging accounts at Addis Ababa DC so all quick logins work as originally configured

BEGIN;

UPDATE public.employees
SET status = 'Active',
    updated_at = now()
WHERE email IN (
  'et-add-dc-01.inventory_specialist@role-coverage.staging.siifmart.invalid',
  'et-add-dc-01.returns_clerk@role-coverage.staging.siifmart.invalid',
  'et-add-dc-01.stock_clerk@role-coverage.staging.siifmart.invalid',
  'et-add-onl-01.store_supervisor@role-coverage.staging.siifmart.invalid'
);

INSERT INTO public.system_logs (action, module, details)
VALUES (
  'RESTORE_STAGING_QUICK_LOGIN_STAFF',
  'Employees',
  'Reactivated role-coverage staging accounts at Addis Ababa DC for Quick Login.'
);

COMMIT;
