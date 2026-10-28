-- Staging behavioral test. Every inserted business record is rolled back.
BEGIN;
DO $test$
DECLARE target public.sites%ROWTYPE; dest uuid; ops uuid; proc uuid; hr uuid; finance uuid; buyer uuid;
 other_ops uuid; supplier uuid; maker uuid; reg_limit numeric; actor record; response jsonb; baseline jsonb:='{}';
 po_id uuid:=gen_random_uuid(); high_po uuid:=gen_random_uuid(); expense_id uuid:=gen_random_uuid();
 quota_id uuid:=gen_random_uuid(); transfer_id uuid:=gen_random_uuid(); pr_id uuid:=gen_random_uuid();
 sample record; queue text; n bigint; expected bigint; wrong_country text;
BEGIN
 SELECT s.* INTO target FROM public.sites s JOIN public.regions r ON r.code=s.region_code
 WHERE s.type IN ('Warehouse','Distribution Center') AND s.country='ET' AND r.autonomous_po_limit>0 AND lower(r.status)='active'
 AND EXISTS(SELECT 1 FROM public.employees e WHERE e.role='regional_operations_manager' AND e.region_code=s.region_code AND lower(e.status)='active')
 AND EXISTS(SELECT 1 FROM public.employees e WHERE e.role='regional_procurement_manager' AND e.region_code=s.region_code AND lower(e.status)='active')
 AND EXISTS(SELECT 1 FROM public.employees e WHERE e.role='regional_hr_manager' AND e.region_code=s.region_code AND lower(e.status)='active') ORDER BY s.id LIMIT 1;
 IF target.id IS NULL THEN RAISE EXCEPTION 'Missing staging regional fixtures'; END IF;
 SELECT autonomous_po_limit INTO reg_limit FROM public.regions WHERE code=target.region_code;
 SELECT id INTO dest FROM public.sites WHERE country=target.country AND id<>target.id AND region_code=target.region_code AND type='Store' LIMIT 1;
 SELECT id INTO ops FROM public.employees WHERE role='regional_operations_manager' AND region_code=target.region_code AND lower(status)='active' LIMIT 1;
 SELECT id INTO proc FROM public.employees WHERE role='regional_procurement_manager' AND region_code=target.region_code AND lower(status)='active' LIMIT 1;
 SELECT id INTO hr FROM public.employees WHERE role='regional_hr_manager' AND region_code=target.region_code AND lower(status)='active' LIMIT 1;
 SELECT e.id INTO finance FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='country_finance_director' AND s.country=target.country AND lower(e.status)='active' LIMIT 1;
 SELECT e.id INTO buyer FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='buyer' AND coalesce(e.region_code,s.region_code)=target.region_code AND s.country=target.country AND lower(e.status)='active' LIMIT 1;
 SELECT e.id INTO other_ops FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='regional_operations_manager' AND coalesce(e.region_code,s.region_code)<>target.region_code AND s.country=target.country AND lower(e.status)='active' LIMIT 1;
 SELECT id INTO maker FROM public.employees WHERE site_id=dest AND lower(status)='active' AND role NOT LIKE 'regional%' LIMIT 1;
 SELECT id INTO supplier FROM public.suppliers WHERE upper(country_code)=target.country AND lower(verification_status)='verified' AND lower(type) IS DISTINCT FROM 'one-time' AND region_code=target.region_code LIMIT 1;
 IF dest IS NULL OR finance IS NULL OR buyer IS NULL OR other_ops IS NULL OR supplier IS NULL OR maker IS NULL THEN RAISE EXCEPTION 'Missing staging country fixtures'; END IF;
 -- Baselines are read with the actual authenticated database role and existing RLS.
 FOR sample IN SELECT * FROM (VALUES(ops,'expenses'),(ops,'transfers'),(ops,'headcount'),(proc,'purchase_orders'),(finance,'po_finance'),(buyer,'purchase_requests'),(other_ops,'expenses')) x(id,key) LOOP
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',sample.id,'role','authenticated')::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  response:=public.get_my_approval_inbox(target.country);
  SELECT (q->>'count')::bigint INTO n FROM jsonb_array_elements(response->'queues')q WHERE q->>'key'=sample.key;
  IF n IS NULL THEN RAISE EXCEPTION 'Expected ready queue % for fixture actor',sample.key; END IF;
  baseline:=baseline||jsonb_build_object(sample.id::text||sample.key,n);
  EXECUTE 'RESET ROLE';
 END LOOP;
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 INSERT INTO public.purchase_orders(id,site_id,country_code,region_code,supplier_id,supplier_name,total_amount,items_count,status,created_by,requested_by,currency)
 VALUES(po_id,target.id,target.country,target.region_code,supplier,'Inbox rollback supplier',least(reg_limit,100),1,'Pending','Independent fixture maker','Independent fixture requester','ETB'),
 (high_po,target.id,target.country,target.region_code,supplier,'Inbox rollback supplier',reg_limit+1,1,'Pending','Independent fixture maker','Independent fixture requester','ETB');
 INSERT INTO public.expenses(id,site_id,country_code,region_code,expense_date,category,description,amount,status,created_by_id,created_by_name)
 VALUES(expense_id,target.id,target.country,target.region_code,current_date,'Other','Inbox rollback fixture',1,'Pending',maker,'Independent fixture maker');
 INSERT INTO public.headcount_quota_requests(id,site_id,region_code,country_code,role,requested_quota,increase_amount,reason,requested_by,status)
 VALUES(quota_id,target.id::text,target.region_code,target.country,'picker',6,1,'Inbox rollback fixture','Independent fixture maker','PENDING');
 INSERT INTO public.wms_jobs(id,type,priority,items_count,site_id,source_site_id,dest_site_id,country_code,status,transfer_status,requested_by,line_items)
 VALUES(transfer_id,'TRANSFER','Normal',1,target.id,target.id,dest,target.country,'Pending','Requested','Independent fixture maker','[{"productId":"fixture","quantity":1}]');
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',maker,'role','authenticated')::text,true);
 INSERT INTO public.purchase_requisitions(id,requester_employee_id,requester_name,requester_site_id,destination_site_id,country_code,region_code,title,business_reason,items,currency)
 VALUES(pr_id,maker,'Independent fixture requester',dest,target.id,target.country,target.region_code,'Inbox rollback fixture','Operational need','[{"product_name":"Coffee","quantity":1}]','ETB');
 FOR sample IN SELECT * FROM (VALUES(ops,'expenses',1),(ops,'transfers',1),(ops,'headcount',1),(proc,'purchase_orders',1),(finance,'po_finance',1),(buyer,'purchase_requests',1),(other_ops,'expenses',0)) x(id,key,delta) LOOP
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',sample.id,'role','authenticated')::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  response:=public.get_my_approval_inbox(target.country);
  SELECT (q->>'count')::bigint INTO n FROM jsonb_array_elements(response->'queues')q WHERE q->>'key'=sample.key;
  expected:=(baseline->>(sample.id::text||sample.key))::bigint+sample.delta;
  IF n IS DISTINCT FROM expected THEN RAISE EXCEPTION '% expected %, got %',sample.key,expected,n; END IF;
  IF (response->>'total')::bigint<>(SELECT coalesce(sum((q->>'count')::bigint),0) FROM jsonb_array_elements(response->'queues')q WHERE q->>'status'='ready') THEN RAISE EXCEPTION 'Total includes unavailable queues'; END IF;
  wrong_country:=CASE WHEN target.country='ET' THEN 'KE' ELSE 'ET' END;
  BEGIN PERFORM public.get_my_approval_inbox(wrong_country); RAISE EXCEPTION 'Cross-country inbox allowed'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  EXECUTE 'RESET ROLE';
 END LOOP;
 -- Own expense and transfer disappear, with no approval/permission changes.
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 UPDATE public.expenses SET created_by_id=ops WHERE id=expense_id;
 UPDATE public.wms_jobs SET requested_by=(SELECT name FROM public.employees WHERE id=ops) WHERE id=transfer_id;
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',ops,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 response:=public.get_my_approval_inbox(target.country);
 FOR queue IN SELECT unnest(ARRAY['expenses','transfers']) LOOP
  SELECT (q->>'count')::bigint INTO n FROM jsonb_array_elements(response->'queues')q WHERE q->>'key'=queue;
  IF n IS DISTINCT FROM (baseline->>(ops::text||queue))::bigint THEN RAISE EXCEPTION 'Self-request counted for %',queue; END IF;
 END LOOP;
 EXECUTE 'RESET ROLE';
END;
$test$;
ROLLBACK;
