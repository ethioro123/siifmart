-- All fixtures and reviews roll back. Calls use authenticated manager/floor identities.
BEGIN;
CREATE TEMP TABLE operations_review_checks(name text);
GRANT INSERT ON operations_review_checks TO authenticated;
DO $test$
DECLARE facility public.sites%ROWTYPE; manager public.employees%ROWTYPE; worker public.employees%ROWTYPE; foreign_actor public.employees%ROWTYPE;
 operation text; job uuid; pick_job uuid; report uuid:=gen_random_uuid(); evidence jsonb; result jsonb; note jsonb; blocked boolean; ids uuid[]:='{}';
BEGIN
 SELECT s.* INTO facility FROM public.sites s WHERE s.country='ET' AND s.type IN('Warehouse','Distribution Center') AND s.status='Active'
 AND EXISTS(SELECT 1 FROM public.employees e WHERE e.site_id=s.id AND e.role='warehouse_manager' AND e.status='Active')
 AND EXISTS(SELECT 1 FROM public.employees e WHERE e.site_id=s.id AND e.role='receiver' AND e.status='Active') ORDER BY s.id LIMIT 1;
 SELECT * INTO manager FROM public.employees WHERE site_id=facility.id AND role='warehouse_manager' AND status='Active' LIMIT 1;
 SELECT * INTO worker FROM public.employees WHERE site_id=facility.id AND role='receiver' AND status='Active' LIMIT 1;
 SELECT e.* INTO foreign_actor FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE s.country='KE' AND e.role='warehouse_manager' AND e.status='Active' LIMIT 1;
 IF manager.id IS NULL OR worker.id IS NULL OR foreign_actor.id IS NULL THEN RAISE EXCEPTION 'Missing staging fixtures'; END IF;
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 FOREACH operation IN ARRAY ARRAY['RECEIVE','PUTAWAY','PICK','PACK','DISPATCH','TRANSFER','REPLENISH','COUNT','RETURNS','WASTE'] LOOP
 job:=gen_random_uuid();ids:=array_append(ids,job);
 INSERT INTO public.wms_jobs(id,site_id,country_code,type,status,priority,items_count,job_number,order_ref,line_items)
 VALUES(job,facility.id,'ET',operation,'Pending','Normal',1,'review-test-'||operation,gen_random_uuid()::text,
 '[{"productId":"00000000-0000-0000-0000-000000000001","name":"Coffee test fixture","sku":"ET-REVIEW","expectedQty":1,"pickedQty":0,"condition":"Good"}]');
 IF operation='PICK' THEN pick_job:=job; END IF;
 END LOOP;
 INSERT INTO private.floor_discrepancies(id,job_id,item_index,stage,site_id,country_code,manifest,expected_qty,first_count,recount,reason,reporter_id,reporter_name)
 VALUES(report,pick_job,0,'PICK',facility.id,'ET','{"productId":"00000000-0000-0000-0000-000000000001","sku":"ET-REVIEW"}',1,0,0,'Physical fixture recount differs',worker.id,worker.name);
 PERFORM set_config('request.jwt.claim.sub',manager.id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',manager.id,'role','authenticated')::text,true);
 EXECUTE 'SET LOCAL ROLE authenticated';
 FOREACH operation IN ARRAY ARRAY['RECEIVE','PUTAWAY','PICK','PACK','DISPATCH','TRANSFER','REPLENISH','COUNT','RETURNS','WASTE'] LOOP
 result:=public.operations_review_queue(facility.id,'ET',operation,'active',0);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(result) r WHERE r->>'reference'='review-test-'||operation) THEN RAISE EXCEPTION 'Missing operation %',operation; END IF;
 END LOOP;
 result:=public.operations_review_queue(facility.id,'ET','ALL','exceptions',0);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(result) r WHERE r->>'id'=pick_job::text) THEN RAISE EXCEPTION 'Unresolved pick missing from central exceptions'; END IF;
 evidence:=public.operations_review_detail(facility.id,'ET','job',pick_job,0);
 IF jsonb_array_length(evidence->'reports')<>1 OR NOT (evidence->'reports'->0->>'can_resolve')::boolean THEN RAISE EXCEPTION 'Independent resolution evidence missing'; END IF;
 note:=public.record_operations_review(facility.id,'ET','job',pick_job,evidence->>'fingerprint','Manager observed discrepancy; native reconciliation is still required');
 IF note<>public.record_operations_review(facility.id,'ET','job',pick_job,evidence->>'fingerprint','Manager observed discrepancy; native reconciliation is still required') THEN RAISE EXCEPTION 'Duplicate review retry'; END IF;
 result:=public.operations_review_queue(facility.id,'ET','PICK','exceptions',0);
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(result) r WHERE r->>'id'=pick_job::text) THEN RAISE EXCEPTION 'Observation incorrectly cleared hold'; END IF;
 blocked:=false;BEGIN PERFORM public.record_operations_review(facility.id,'ET','job',pick_job,evidence->>'fingerprint','Different note must not claim the original was saved');EXCEPTION WHEN raise_exception THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Changed review retry falsely confirmed'; END IF;
 INSERT INTO operations_review_checks VALUES('all ten operation queues load persisted work; central exceptions include unresolved pick; independent action evidence is present; review note is idempotent and does not clear the exception');
 blocked:=false;BEGIN PERFORM public.record_operations_review(facility.id,'ET','job',pick_job,'stale-fingerprint','Old evidence must not be accepted');EXCEPTION WHEN serialization_failure THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Stale review accepted'; END IF;
 -- Existing trusted decision APIs remain authoritative from the new workspace.
 PERFORM public.resolve_floor_discrepancy(pick_job,report,'count_corrected',1,'Independent physical reconciliation completed');
 PERFORM public.review_floor_discrepancy(pick_job,report,'counting_correction',NULL,'Evidence supports a counting correction without attributing fault');
 evidence:=public.operations_review_detail(facility.id,'ET','job',pick_job,0);
 IF evidence->'reports'->0->>'resolved_at' IS NULL OR evidence->'reports'->0->>'reviewed_at' IS NULL THEN RAISE EXCEPTION 'Native decisions not reflected'; END IF;
 result:=public.operations_review_queue(facility.id,'ET','PICK','exceptions',0);
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(result) r WHERE r->>'id'=pick_job::text) THEN RAISE EXCEPTION 'Reconciled and reviewed pick still in exception queue'; END IF;
 INSERT INTO operations_review_checks VALUES('stale evidence denied; native reconciliation and finding appear in the shared evidence view');
 evidence:=public.operations_review_detail(facility.id,'ET','job',ids[1],0);
 IF evidence->'lines'->0->>'expected' IS NOT NULL THEN RAISE EXCEPTION 'Receiving quantity revealed through job fallback'; END IF;
 PERFORM set_config('request.jwt.claim.sub',worker.id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',worker.id,'role','authenticated')::text,true);
 blocked:=false;BEGIN PERFORM public.operations_review_queue(facility.id,'ET','ALL','active',0);EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Floor user entered manager queue'; END IF;
 PERFORM set_config('request.jwt.claim.sub',foreign_actor.id::text,true);PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',foreign_actor.id,'role','authenticated')::text,true);
 blocked:=false;BEGIN PERFORM public.operations_review_detail(facility.id,'ET','job',pick_job,0);EXCEPTION WHEN insufficient_privilege THEN blocked:=true;END;
 IF NOT blocked THEN RAISE EXCEPTION 'Cross-country manager detail allowed'; END IF;
 EXECUTE 'RESET ROLE';
 INSERT INTO operations_review_checks VALUES('receiving fallback hides expected quantity; floor access and cross-country manager access denied');
END; $test$;
SELECT * FROM operations_review_checks;
ROLLBACK;
