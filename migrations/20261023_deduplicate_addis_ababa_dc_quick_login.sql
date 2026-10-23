-- Migration: Deduplicate Addis Ababa Distribution Center employees to ensure one employee per role
-- Reassigns retired online store fixture accounts back to ET-ADD-ONL-01 as Terminated
-- Deactivates duplicate role-coverage fixtures at ET-ADD-DC-01 where named staging staff exist

BEGIN;

-- 1. Reassign retired online store retail fixtures back to ET-ADD-ONL-01 and mark Terminated
UPDATE public.employees
SET site_id = 'a1111111-1111-4000-8000-000000000006',
    status = 'Terminated',
    updated_at = now()
WHERE email IN (
  'et-add-onl-01.assistant_manager@role-coverage.staging.siifmart.invalid',
  'et-add-onl-01.cashier@role-coverage.staging.siifmart.invalid',
  'et-add-onl-01.loss_prevention@role-coverage.staging.siifmart.invalid',
  'et-add-onl-01.merchandiser@role-coverage.staging.siifmart.invalid',
  'et-add-onl-01.sales_associate@role-coverage.staging.siifmart.invalid',
  'et-add-onl-01.store_manager@role-coverage.staging.siifmart.invalid'
);

-- 2. Deactivate redundant role-coverage fixtures where active named staging staff already staff ET-ADD-DC-01
UPDATE public.employees
SET status = 'Terminated',
    updated_at = now()
WHERE email IN (
  'et-add-dc-01.inventory_specialist@role-coverage.staging.siifmart.invalid',
  'et-add-dc-01.returns_clerk@role-coverage.staging.siifmart.invalid',
  'et-add-dc-01.stock_clerk@role-coverage.staging.siifmart.invalid',
  'et-add-onl-01.store_supervisor@role-coverage.staging.siifmart.invalid'
);

-- 3. Audit trail
INSERT INTO public.system_logs (action, module, details)
VALUES (
  'DEDUPLICATE_ADDIS_ABABA_DC_STAFF',
  'Employees',
  'Ensured Addis Ababa Distribution Center has exactly one employee per role for staging and Quick Login.'
);

COMMIT;
