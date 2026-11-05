-- Read-only deployment assertions for the investigated staging project.
DO $$ BEGIN
 ASSERT to_regclass('public.employee_attendance') IS NULL,'Attendance table now exists; re-evaluate finding';
 ASSERT to_regprocedure('public.attest_payroll_regional_hr(text,text)') IS NULL,'Regional attestation command now exists; re-evaluate finding';
END $$;
SELECT 'CONFIRMED: employee_attendance table and regional payroll attestation command are absent from staging' result;
