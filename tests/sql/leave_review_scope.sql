BEGIN;
DO $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='public.leave_requests'::regclass AND relrowsecurity) THEN RAISE EXCEPTION 'Leave RLS missing'; END IF;
 IF has_table_privilege('anon','public.leave_requests','INSERT') OR has_table_privilege('anon','public.leave_requests','UPDATE') THEN RAISE EXCEPTION 'Anonymous leave writes permitted'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='leave_requests' AND policyname='leave_reviewer_update' AND qual LIKE '%is_site_in_my_authorized_scope%') THEN RAISE EXCEPTION 'Scoped reviewer policy missing'; END IF;
 IF EXISTS(SELECT 1 FROM pg_policies WHERE tablename='leave_requests' AND policyname IN ('leave_requests_read','leave_requests_update','leave_requests_insert')) THEN RAISE EXCEPTION 'Legacy permissive leave policy remains'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgrelid='public.leave_requests'::regclass AND tgname='leave_review_guard') THEN RAISE EXCEPTION 'Review guard missing'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.guard_leave_review()'::regprocedure AND prosecdef) THEN RAISE EXCEPTION 'Leave review must retain caller RLS'; END IF;
END $$;
ROLLBACK;
