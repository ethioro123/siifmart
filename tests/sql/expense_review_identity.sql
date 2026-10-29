-- Run as database owner; no data mutations are retained.
BEGIN;
DO $$
BEGIN
  BEGIN
    PERFORM public.decide_expense('00000000-0000-0000-0000-000000000000'::uuid,'Approved','Identity test');
    RAISE EXCEPTION 'Unsigned review unexpectedly succeeded';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%Signed-in review%' THEN RAISE; END IF;
  END;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE oid='public.decide_expense(uuid,text,text)'::regprocedure AND prosecdef) THEN
    RAISE EXCEPTION 'Expense review must preserve row-level security';
  END IF;
END $$;
ROLLBACK;
