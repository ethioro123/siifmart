-- Rollback-only: create a transfer fixture, approve twice, and reject duplicate child creation.
BEGIN;
SET LOCAL statement_timeout='5s';
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$
DECLARE t public.wms_jobs%ROWTYPE; fixture uuid:=gen_random_uuid(); leader uuid;
BEGIN
 SELECT * INTO t FROM public.wms_jobs WHERE id='2fb99fdb-ea86-4866-a087-98d18f919ef1';
 SELECT id INTO leader FROM public.employees WHERE role='group_ceo' AND lower(status)='active' LIMIT 1;
 IF t.id IS NULL OR leader IS NULL THEN RAISE EXCEPTION 'Staging fixture unavailable'; END IF;
 INSERT INTO public.wms_jobs SELECT (jsonb_populate_record(NULL::public.wms_jobs,to_jsonb(t)||jsonb_build_object('id',fixture,'job_number','REG-'||fixture::text,'transfer_status','Requested','status','Pending','requested_by','Regression requester','approved_by',NULL,'created_at',now(),'updated_at',now()))).*;
 PERFORM set_config('test.transfer_id',fixture::text,true);
 PERFORM set_config('request.jwt.claim.sub',leader::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',leader,'role','authenticated')::text,true);
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE first_pick jsonb; again jsonb; duplicate public.wms_jobs%ROWTYPE; blocked boolean:=false;
BEGIN
 first_pick:=public.approve_transfer_for_picking(current_setting('test.transfer_id')::uuid);
 again:=public.approve_transfer_for_picking(current_setting('test.transfer_id')::uuid);
 IF first_pick->>'id' IS DISTINCT FROM again->>'id' OR first_pick->>'order_ref'<>current_setting('test.transfer_id') THEN RAISE EXCEPTION 'Retry created a different PICK'; END IF;
 IF (SELECT count(*) FROM public.wms_jobs WHERE type='PICK' AND order_ref=current_setting('test.transfer_id') AND status<>'Cancelled')<>1 THEN RAISE EXCEPTION 'Duplicate PICK jobs exist'; END IF;
 IF (SELECT transfer_status FROM public.wms_jobs WHERE id=current_setting('test.transfer_id')::uuid)<>'Picking' THEN RAISE EXCEPTION 'Transfer approval was not saved'; END IF;
 SELECT * INTO duplicate FROM public.wms_jobs WHERE id=(first_pick->>'id')::uuid;
 BEGIN
  INSERT INTO public.wms_jobs SELECT (jsonb_populate_record(NULL::public.wms_jobs,to_jsonb(duplicate)||jsonb_build_object('id',gen_random_uuid()))).*;
 EXCEPTION WHEN unique_violation THEN blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Direct duplicate insertion was allowed'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','27331fda-2fcf-4c1f-b08a-6742837c94e2',true),set_config('request.jwt.claims','{"sub":"27331fda-2fcf-4c1f-b08a-6742837c94e2","role":"authenticated"}',true);
DO $$ DECLARE blocked boolean:=false; BEGIN
 BEGIN PERFORM public.approve_transfer_for_picking(current_setting('test.transfer_id')::uuid);
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Receiving worker could approve a transfer'; END IF;
END $$;
ROLLBACK;
