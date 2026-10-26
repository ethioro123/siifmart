-- Rollback-only staging boundary, calendar-day and scope regression.
BEGIN;
SET LOCAL statement_timeout='15s';
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$
DECLARE worker uuid; facility uuid; country text; actor uuid; baseline integer; release_job uuid; extra uuid; stats jsonb; tz text; start_day timestamptz; done_baseline integer;
BEGIN
 SELECT id,site_id INTO worker,facility FROM public.employees WHERE role='picker' AND lower(status)='active' AND site_id IS NOT NULL LIMIT 1;
 SELECT s.country INTO country FROM public.sites s WHERE id=facility;
 SELECT id INTO actor FROM public.employees WHERE role='group_ceo' AND lower(status)='active' LIMIT 1;
 IF worker IS NULL OR actor IS NULL THEN RAISE EXCEPTION 'Missing staging employee fixture'; END IF;
 SELECT count(*) INTO baseline FROM public.wms_jobs WHERE assigned_to=worker::text AND site_id=facility AND country_code=country AND status NOT IN ('Completed','Cancelled','Deleted');
 IF baseline>=100 THEN RAISE EXCEPTION 'Fixture worker already at capacity'; END IF;
 FOR i IN baseline+1..100 LOOP
  INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,assigned_to,line_items,items_count)
  VALUES(facility,country,'COUNT','Pending','Normal',worker::text,'[]',0) RETURNING id INTO release_job;
 END LOOP;
 BEGIN
  INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,assigned_to,line_items,items_count)
  VALUES(facility,country,'COUNT','Pending','Normal',worker::text,'[]',0);
  RAISE EXCEPTION 'TEST: 101st job accepted';
 EXCEPTION WHEN check_violation THEN NULL; END;
 INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,line_items,items_count)
 VALUES(facility,country,'COUNT','Pending','Normal','[]',0) RETURNING id INTO extra;
 BEGIN
  UPDATE public.wms_jobs SET assigned_to=worker::text WHERE id=extra;
  RAISE EXCEPTION 'TEST: assignment update bypassed capacity';
 EXCEPTION WHEN check_violation THEN NULL; END;
 PERFORM set_config('request.jwt.claim.sub',actor::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 stats:=public.assignment_workloads(facility,country,ARRAY[worker]);
 IF (stats->'workers'->0->>'active')::integer<>100 THEN RAISE EXCEPTION 'TEST: active workload undercounted'; END IF;
 done_baseline:=(stats->'workers'->0->>'completedToday')::integer;tz:=stats->>'timezone';
 start_day:=date_trunc('day',now() AT TIME ZONE tz) AT TIME ZONE tz;
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 INSERT INTO public.wms_jobs(site_id,country_code,type,status,priority,assigned_to,completed_by,completed_at,line_items,items_count)
 VALUES(facility,country,'COUNT','Completed','Normal',worker::text,worker::text,start_day,'[]',0),
 (facility,country,'COUNT','Completed','Normal',worker::text,worker::text,start_day-interval '1 microsecond','[]',0),
 (facility,country,'COUNT','Cancelled','Normal',worker::text,worker::text,now(),'[]',0);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 stats:=public.assignment_workloads(facility,country,ARRAY[worker]);
 IF (stats->'workers'->0->>'completedToday')::integer<>done_baseline+1 THEN RAISE EXCEPTION 'TEST: calendar midnight boundary failed'; END IF;
 BEGIN
  PERFORM public.assignment_workloads(facility,'INVALID',ARRAY[worker]);
  RAISE EXCEPTION 'TEST: cross-country workload accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 PERFORM set_config('test.capacity_actor',actor::text,true);
 PERFORM set_config('test.capacity_worker',worker::text,true);
 PERFORM set_config('test.capacity_extra',extra::text,true);
 PERFORM set_config('test.capacity_release',release_job::text,true);
 PERFORM set_config('request.jwt.claim.sub','',true);
 PERFORM set_config('request.jwt.claims','{"role":"anon"}',true);
 BEGIN
  PERFORM public.assignment_workloads(facility,country,ARRAY[worker]);
  RAISE EXCEPTION 'TEST: anonymous workload accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END; $$;
ROLLBACK;
SELECT 'PASS: 100-job boundary, direct update rejection, exact counts, midnight and scope' AS result;
