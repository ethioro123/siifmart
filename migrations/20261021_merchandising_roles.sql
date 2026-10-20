-- Extend the existing employee role allowlist without dropping any older role.
DO $migration$
DECLARE role_check text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO role_check
  FROM pg_constraint
  WHERE conrelid = 'public.employees'::regclass
    AND conname = 'check_employee_role';

  IF role_check IS NULL OR position('merchandising_manager' IN role_check) = 0 THEN
    RAISE EXCEPTION 'Unexpected employees role constraint';
  END IF;
  IF position('merchandising_specialist' IN role_check) > 0
     OR position('regional_merchandising_lead' IN role_check) > 0 THEN
    RAISE EXCEPTION 'Merchandising roles already present; inspect role constraint';
  END IF;

  ALTER TABLE public.employees DROP CONSTRAINT check_employee_role;
  EXECUTE 'ALTER TABLE public.employees ADD CONSTRAINT check_employee_role '
    || replace(role_check,
       '''merchandising_manager''::text',
       '''merchandising_manager''::text, ''merchandising_specialist''::text, ''regional_merchandising_lead''::text');
END;
$migration$;
