BEGIN;
DO $$ DECLARE site uuid:='a1111111-1111-4000-8000-000000000001'; BEGIN
 PERFORM set_config('test.history_worker',(SELECT id::text FROM public.employees WHERE site_id=site AND role='packer' LIMIT 1),true);
 PERFORM set_config('test.history_manager',(SELECT id::text FROM public.employees WHERE site_id=site AND role='warehouse_manager' LIMIT 1),true);
 PERFORM set_config('test.history_own',(SELECT id::text FROM public.wms_jobs WHERE site_id=site AND status='Completed' AND completed_by=current_setting('test.history_worker') LIMIT 1),true);
 PERFORM set_config('test.history_other',(SELECT id::text FROM public.wms_jobs WHERE site_id=site AND status='Completed' AND completed_by IS DISTINCT FROM current_setting('test.history_worker') LIMIT 1),true);
 IF current_setting('test.history_own')='' OR current_setting('test.history_other')='' THEN RAISE EXCEPTION 'Completed job fixtures required'; END IF;
END; $$;
SELECT set_config('request.jwt.claim.sub',current_setting('test.history_worker'),true);
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.history_worker'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.wms_jobs WHERE id=current_setting('test.history_own')::uuid) THEN RAISE EXCEPTION 'TEST: own completion hidden'; END IF;
 IF EXISTS(SELECT 1 FROM public.wms_jobs WHERE id=current_setting('test.history_other')::uuid) THEN RAISE EXCEPTION 'TEST: another employee completion leaked'; END IF;
 IF EXISTS(SELECT 1 FROM public.wms_jobs WHERE status IN ('Completed','Cancelled','Deleted') AND (status<>'Completed' OR completed_by IS DISTINCT FROM public.get_my_employee_id()::text)) THEN RAISE EXCEPTION 'TEST: site-wide policy bypassed history restriction'; END IF;
END; $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub',current_setting('test.history_manager'),true);
SELECT set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.history_manager'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.wms_jobs WHERE id IN(current_setting('test.history_own')::uuid,current_setting('test.history_other')::uuid))<>2 THEN RAISE EXCEPTION 'TEST: manager lost team history'; END IF;
END; $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: own completed history only for floor staff; scoped manager team history retained' AS result;
