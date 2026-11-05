-- Investigation only: self-service changes rolled back before returning.
BEGIN;
SET LOCAL statement_timeout='8s';
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000088',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000088","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 UPDATE public.employees SET attendance_rate=100,performance_score=100 WHERE id=auth.uid();
 ASSERT EXISTS(SELECT 1 FROM public.employees WHERE id=auth.uid() AND attendance_rate=100 AND performance_score=100),
 'Reproduction changed: employee cannot self-write attendance/performance indicators';
END $$;
ROLLBACK;
SELECT 'CONFIRMED: floor employee self-writes attendance and performance metrics displayed in staff profile; rolled back' result;
