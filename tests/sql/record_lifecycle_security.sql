-- Staging integration regression. Every fixture and action rolls back.
BEGIN;
CREATE TEMP TABLE lifecycle_security_results(test text);
DO $$
DECLARE requester uuid; hr uuid; ops uuid; finance uuid; director uuid; target uuid; country_target uuid;
 facility uuid:=gen_random_uuid(); req uuid; result jsonb; blocked boolean; v_region text;
BEGIN
 SELECT e.id,e.region_code INTO requester,v_region FROM public.employees e JOIN public.sites s ON s.id=e.site_id
 WHERE e.role='regional_operations_manager' AND e.status='Active' AND s.country='ET' ORDER BY e.id LIMIT 1;
 SELECT e.id INTO hr FROM public.employees e JOIN public.sites s ON s.id=e.site_id
 WHERE e.role='regional_hr_manager' AND e.status='Active' AND e.region_code=v_region AND s.country='ET' LIMIT 1;
 SELECT e.id INTO ops FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='country_operations_director' AND e.status='Active' AND s.country='ET' LIMIT 1;
 SELECT e.id INTO finance FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='country_finance_director' AND e.status='Active' AND s.country='ET' LIMIT 1;
 SELECT e.id INTO director FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='country_managing_director' AND e.status='Active' AND s.country='ET' LIMIT 1;
 SELECT e.id INTO target FROM public.employees e JOIN public.sites s ON s.id=e.site_id
 WHERE e.role='cashier' AND e.status='Active' AND e.region_code=v_region AND s.country='ET'
 AND NOT EXISTS(SELECT 1 FROM public.shifts sh WHERE sh.cashier_id=e.id AND sh.status='Open')
 AND NOT EXISTS(SELECT 1 FROM public.wms_jobs j WHERE j.assigned_to IN (e.id::text,e.name) AND j.status NOT IN ('Completed','Cancelled'))
 ORDER BY e.id LIMIT 1;
 SELECT e.id INTO country_target FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='cashier' AND e.status='Active' AND s.country='KE' LIMIT 1;
 IF requester IS NULL OR hr IS NULL OR ops IS NULL OR finance IS NULL OR director IS NULL OR target IS NULL OR country_target IS NULL THEN
   RAISE EXCEPTION 'Staging lifecycle test actors are missing'; END IF;
 PERFORM set_config('request.jwt.claim.sub',requester::text,true);
 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 PERFORM public.list_lifecycle_targets('employee','ET','',0);
 INSERT INTO lifecycle_security_results VALUES('bounded target lookup executes');
 BEGIN
   PERFORM public.request_record_lifecycle('employee',country_target,'Cross-country request must fail',jsonb_build_object('reason_code','contract_expiration','effective_date',current_date));
   RAISE EXCEPTION 'Unexpected cross-country success';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%outside your authorized scope%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_security_results VALUES('cross-country request denied');
 req:=public.request_record_lifecycle('employee',target,'Offboarding integration regression',jsonb_build_object('reason_code','contract_expiration','effective_date',current_date));
 BEGIN
   PERFORM public.decide_record_lifecycle(req,true,'Self approval must be rejected');
   RAISE EXCEPTION 'Unexpected self-approval';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%independent reviewer%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_security_results VALUES('requester self-approval denied');
 PERFORM set_config('request.jwt.claim.sub',hr::text,true);
 BEGIN
   UPDATE public.employees SET status='Terminated' WHERE id=target;
   RAISE EXCEPTION 'Unexpected direct status change';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%independent lifecycle review%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_security_results VALUES('direct termination bypass denied');
 BEGIN
   PERFORM public.decide_record_lifecycle(req,true,'Incomplete handover must be rejected');
   RAISE EXCEPTION 'Unexpected incomplete handover approval';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%handover evidence%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_security_results VALUES('incomplete handover denied');
 PERFORM set_config('request.jwt.claim.sub',requester::text,true);
 UPDATE public.employees SET status='On Leave' WHERE id=target;
 PERFORM set_config('request.jwt.claim.sub',hr::text,true);
 BEGIN
   PERFORM public.decide_record_lifecycle(req,true,'Changed target must be rejected');
   RAISE EXCEPTION 'Unexpected stale target approval';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%record changed%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_security_results VALUES('stale target approval denied');
 PERFORM set_config('request.jwt.claim.sub',requester::text,true);
 PERFORM public.withdraw_record_lifecycle(req,'Withdraw stale offboarding evidence');
 req:=public.request_record_lifecycle('employee',target,'Verified offboarding integration regression',jsonb_build_object('reason_code','contract_expiration','effective_date',current_date,
 'assets_returned',true,'pos_access_revoked',true,'wms_badge_deactivated',true,'keys_surrendered',true,'cash_drawer_reconciled',true));
 PERFORM set_config('request.jwt.claim.sub',hr::text,true);
 result:=public.decide_record_lifecycle(req,true,'HR independently verified the handover evidence');
 IF result->>'status'<>'Applied' OR (SELECT status FROM public.employees WHERE id=target)<>'Terminated' THEN RAISE EXCEPTION 'Offboarding did not apply'; END IF;
 INSERT INTO lifecycle_security_results VALUES('independent HR approval applies atomically');
 BEGIN
   UPDATE public.record_lifecycle_events SET reason='Tampered evidence' WHERE request_id=req;
   RAISE EXCEPTION 'Unexpected audit mutation';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%cannot be changed or deleted%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_security_results VALUES('audit changes denied');
 PERFORM set_config('request.jwt.claim.sub',target::text,true);
 IF private.has_active_operational_employee() THEN RAISE EXCEPTION 'Terminated employee still active'; END IF;
 BEGIN
   PERFORM public.list_lifecycle_targets('employee','ET','',0);
   RAISE EXCEPTION 'Inactive employee sees targets';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%valid authenticated country scope%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_security_results VALUES('terminated actor loses operational scope');
 PERFORM set_config('request.jwt.claim.sub','',true);
 INSERT INTO public.sites(id,name,code,type,status,country,region_code,site_number)
 VALUES(facility,'Lifecycle rollback fixture','LC-'||substr(facility::text,1,8),'Warehouse','Active','ET',v_region,(SELECT coalesce(max(site_number),0)+100 FROM public.sites));
 PERFORM set_config('request.jwt.claim.sub',requester::text,true);
 req:=public.request_record_lifecycle('site',facility,'Facility closure regression fixture','{}');
 PERFORM set_config('request.jwt.claim.sub',director::text,true);
 BEGIN
   PERFORM public.decide_record_lifecycle(req,true,'Managing director cannot skip operations clearance');
   RAISE EXCEPTION 'Unexpected review stage bypass';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%designated department reviewer%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_security_results VALUES('facility review stages cannot be skipped');
 PERFORM set_config('request.jwt.claim.sub',ops::text,true);
 result:=public.decide_record_lifecycle(req,true,'Operations verified the closure evidence');
 IF result->>'status'<>'Operations cleared' THEN RAISE EXCEPTION 'Operations clearance not recorded'; END IF;
 PERFORM set_config('request.jwt.claim.sub',finance::text,true);
 result:=public.decide_record_lifecycle(req,true,'Finance verified outstanding obligations');
 IF result->>'status'<>'Finance cleared' THEN RAISE EXCEPTION 'Finance clearance not recorded'; END IF;
 PERFORM set_config('request.jwt.claim.sub',director::text,true);
 result:=public.decide_record_lifecycle(req,true,'Managing director authorizes reviewed closure');
 IF result->>'status'<>'Applied' OR (SELECT status FROM public.sites WHERE id=facility)<>'Closed' THEN RAISE EXCEPTION 'Facility closure not applied'; END IF;
 INSERT INTO lifecycle_security_results VALUES('three independent facility clearances apply closure');
 BEGIN
   UPDATE public.sites SET status='Active' WHERE id=facility;
   RAISE EXCEPTION 'Unexpected unreviewed reopening';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%separate reviewed workflow%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_security_results VALUES('unreviewed reopening denied');
 BEGIN
   INSERT INTO public.wms_jobs(type,priority,items_count,status,site_id,country_code)
   VALUES('COUNT','Normal',0,'Pending',facility,'ET');
   RAISE EXCEPTION 'Unexpected new work at closed facility';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%facility is closed%' THEN RAISE; END IF; END;
 INSERT INTO lifecycle_security_results VALUES('closed facility rejects new operational work');
 PERFORM set_config('request.jwt.claim.sub',requester::text,true);
 SELECT s.id INTO facility FROM public.sites s WHERE s.country='ET' AND s.region_code=v_region AND s.type IN ('Warehouse','Distribution Center')
   AND s.status='Active' AND EXISTS(SELECT 1 FROM public.employees e WHERE e.site_id=s.id AND e.status='Active') ORDER BY s.id LIMIT 1;
 req:=public.request_record_lifecycle('site',facility,'Closure must not bypass outstanding facility dependencies','{}');
 PERFORM set_config('request.jwt.claim.sub',ops::text,true);
 PERFORM public.decide_record_lifecycle(req,true,'Operations clearance for dependency regression');
 PERFORM set_config('request.jwt.claim.sub',finance::text,true);
 PERFORM public.decide_record_lifecycle(req,true,'Finance clearance for dependency regression');
 PERFORM set_config('request.jwt.claim.sub',director::text,true);
 BEGIN
   PERFORM public.decide_record_lifecycle(req,true,'Final approval must still verify live dependencies');
   RAISE EXCEPTION 'Unexpected closure with unresolved dependencies';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM NOT LIKE '%Resolve facility stock%' THEN RAISE; END IF; END;
 IF (SELECT status FROM public.sites WHERE id=facility)<>'Active' THEN RAISE EXCEPTION 'Blocked closure changed facility'; END IF;
 INSERT INTO lifecycle_security_results VALUES('live dependencies prevent closure despite all review stages');

END;
$$;
SELECT * FROM lifecycle_security_results;
ROLLBACK;
