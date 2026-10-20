-- Preserve the existing role allowlist while admitting the new HR profile.
DO $migration$
DECLARE role_check text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO role_check
  FROM pg_constraint
  WHERE conrelid = 'public.employees'::regclass
    AND conname = 'check_employee_role';

  IF role_check IS NULL OR position('credit_control_officer' IN role_check) = 0 THEN
    RAISE EXCEPTION 'Unexpected employees role constraint';
  END IF;
  IF position('hr_generalist' IN role_check) > 0 THEN
    RETURN;
  END IF;

  ALTER TABLE public.employees DROP CONSTRAINT check_employee_role;
  EXECUTE 'ALTER TABLE public.employees ADD CONSTRAINT check_employee_role '
    || replace(role_check,
       '''credit_control_officer''::text',
       '''credit_control_officer''::text, ''hr_generalist''::text');
END;
$migration$;
