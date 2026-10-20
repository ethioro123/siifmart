-- Staging-only rollback regression. Existing fixtures are restored by ROLLBACK.
BEGIN;
UPDATE public.employees SET role = 'hr_generalist'
WHERE id IN ('e1000000-0000-4000-8000-000000000012',
             'e1000000-0000-4000-8000-000000000072');
SET LOCAL ROLE authenticated;

DO $test$
BEGIN
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub', 'e1000000-0000-4000-8000-000000000012',
                       'role', 'authenticated')::text, true);
  IF NOT private.hr_site_scope('ET-ADA-STR-01', 'ET')
    OR NOT private.hr_site_scope('ET-ADD-STR-01', 'ET')
    OR private.hr_site_scope('KE-MBA-STR-01', 'KE')
    OR NOT private.hr_hq_scope('ET')
    OR private.hr_hq_scope('KE') THEN
    RAISE EXCEPTION 'HQ HR boundary failed';
  END IF;

  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub', 'e1000000-0000-4000-8000-000000000072',
                       'role', 'authenticated')::text, true);
  IF NOT private.hr_site_scope('ET-ADA-STR-01', 'ET')
    OR private.hr_site_scope('ET-ADD-STR-01', 'ET')
    OR private.hr_site_scope('KE-MBA-STR-01', 'KE')
    OR private.hr_hq_scope('ET') THEN
    RAISE EXCEPTION 'Regional HR boundary failed';
  END IF;
END;
$test$;
ROLLBACK;
