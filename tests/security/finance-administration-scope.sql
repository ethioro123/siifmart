-- Staging-only rollback regression for HQ, regional, and national boundaries.
BEGIN;
-- Temporarily turn an existing regional lead fixture into regional support.
UPDATE public.employees SET role = 'accountant'
WHERE id = 'e1000000-0000-4000-8000-000000000072';
SET LOCAL ROLE authenticated;

DO $test$
DECLARE
  actor_id uuid := 'e1000000-0000-4000-8000-000000000012';
  target_id uuid;
  draft_id uuid;
BEGIN
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub', actor_id, 'role', 'authenticated')::text, true);
  IF NOT private.finance_site_scope('ET-ADA-STR-01', 'ET')
    OR NOT private.finance_site_scope('ET-ADD-STR-01', 'ET')
    OR private.finance_site_scope('KE-MBA-STR-01', 'KE')
    OR NOT private.finance_hq_scope('ET')
    OR private.finance_hq_scope('KE') THEN
    RAISE EXCEPTION 'HQ finance boundary failed';
  END IF;

  SELECT id INTO target_id FROM public.sites WHERE code = 'ET-ADA-STR-01';
  INSERT INTO public.expenses(site_id, country_code, expense_date, category,
    description, amount, status, created_by_id)
  VALUES(target_id, 'ET', CURRENT_DATE, 'Other', 'Rollback finance scope test',
    1, 'Pending', actor_id) RETURNING id INTO draft_id;

  BEGIN
    UPDATE public.expenses SET status = 'Approved' WHERE id = draft_id;
    RAISE EXCEPTION 'Accountant approved an expense';
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE <> '42501' AND SQLERRM <> 'Role is not authorized to approve expenses' THEN
      RAISE;
    END IF;
  END;

  SELECT id INTO target_id FROM public.sites WHERE code = 'KE-MBA-STR-01';
  BEGIN
    INSERT INTO public.expenses(site_id, country_code, expense_date, category,
      description, amount, status, created_by_id)
    VALUES(target_id, 'KE', CURRENT_DATE, 'Other', 'Rollback cross-country test',
      1, 'Pending', actor_id);
    RAISE EXCEPTION 'HQ accountant crossed country';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$test$;

DO $test$
DECLARE
  actor_id uuid := 'e1000000-0000-4000-8000-000000000072';
  target_id uuid;
BEGIN
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub', actor_id, 'role', 'authenticated')::text, true);
  IF NOT private.finance_site_scope('ET-ADA-STR-01', 'ET')
    OR private.finance_site_scope('ET-ADD-STR-01', 'ET')
    OR private.finance_site_scope('KE-MBA-STR-01', 'KE')
    OR private.finance_hq_scope('ET') THEN
    RAISE EXCEPTION 'Regional finance boundary failed';
  END IF;

  SELECT id INTO target_id FROM public.sites WHERE code = 'ET-ADA-STR-01';
  INSERT INTO public.expenses(site_id, country_code, expense_date, category,
    description, amount, status, created_by_id)
  VALUES(target_id, 'ET', CURRENT_DATE, 'Other', 'Rollback regional scope test',
    1, 'Pending', actor_id);

  SELECT id INTO target_id FROM public.sites WHERE code = 'ET-ADD-STR-01';
  BEGIN
    INSERT INTO public.expenses(site_id, country_code, expense_date, category,
      description, amount, status, created_by_id)
    VALUES(target_id, 'ET', CURRENT_DATE, 'Other', 'Rollback cross-region test',
      1, 'Pending', actor_id);
    RAISE EXCEPTION 'Regional accountant crossed region';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$test$;
ROLLBACK;
