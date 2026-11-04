-- All fixtures roll back. No production business records are mutated.
BEGIN;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$
DECLARE manager public.employees%ROWTYPE; worker public.employees%ROWTYPE; foreign_worker public.employees%ROWTYPE;
 sale uuid:=gen_random_uuid(); own_sale uuid:=gen_random_uuid(); receipt text:='POSREVIEW'||replace(gen_random_uuid()::text,'-',''); result jsonb; evidence jsonb; blocked boolean; review_id uuid; transfer_id uuid:=gen_random_uuid(); origin_id uuid;
BEGIN
 SELECT e.* INTO manager FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE s.country='ET' AND e.role='store_manager' AND e.status='Active' ORDER BY e.id LIMIT 1;
 SELECT * INTO worker FROM public.employees WHERE site_id=manager.site_id AND role='cashier' AND status='Active' LIMIT 1;
 SELECT e.* INTO foreign_worker FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE s.country='KE' AND e.role='store_manager' AND e.status='Active' LIMIT 1;
 ASSERT manager.id IS NOT NULL AND worker.id IS NOT NULL AND foreign_worker.id IS NOT NULL;
 INSERT INTO public.sales(id,site_id,country_code,currency,subtotal,tax,total,payment_method,status,cashier_id,cashier_name,receipt_number)
 VALUES(sale,manager.site_id,'ET','ETB',100,0,100,'Cash','Pending',worker.id,worker.name,receipt);
 PERFORM set_config('request.jwt.claim.sub',manager.id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',manager.id,'role','authenticated')::text,true);
 result:=public.pos_manager_review_queue(manager.site_id,'ET','payment',false,0);
 ASSERT jsonb_array_length(result)<=25;
 ASSERT EXISTS(SELECT 1 FROM jsonb_array_elements(result) x WHERE x->>'id'=sale::text), 'Pending payment must be visible';
 evidence:=public.pos_manager_review_detail(manager.site_id,'ET','sale',sale,0);
 ASSERT (evidence->>'can_note')::boolean;
 ASSERT (evidence->>'can_controls')::boolean;
 ASSERT NOT (evidence->'fields' ? 'customer_phone'), 'Customer private contact must not be disclosed';
 result:=public.record_pos_manager_review(manager.site_id,'ET','sale',sale,evidence->>'fingerprint','Verified pending payment evidence');
 review_id:=(result->>'id')::uuid;
 ASSERT (result->>'saved')::boolean;
 result:=public.record_pos_manager_review(manager.site_id,'ET','sale',sale,evidence->>'fingerprint','Verified pending payment evidence');
 ASSERT (result->>'id')::uuid=review_id, 'Repeat must be idempotent';
 ASSERT (SELECT status FROM public.sales WHERE id=sale)='Pending', 'Observation must never collect or refund payment';
 blocked:=false;
 BEGIN PERFORM public.record_pos_manager_review(manager.site_id,'ET','sale',sale,evidence->>'fingerprint','Different overwrite reason'); EXCEPTION WHEN raise_exception THEN blocked:=true; END;
 ASSERT blocked,'Saved observations must not be overwritten';
 blocked:=false;
 BEGIN PERFORM public.record_pos_manager_review(manager.site_id,'ET','sale',sale,'stale','Checked stale evidence'); EXCEPTION WHEN serialization_failure THEN blocked:=true; END;
 ASSERT blocked,'Stale evidence must be rejected';
 SELECT id INTO origin_id FROM public.sites WHERE country='ET' AND id<>manager.site_id LIMIT 1;
 INSERT INTO public.transfers(id,source_site_id,dest_site_id,country_code,status,items,order_ref)
 VALUES(transfer_id,origin_id,manager.site_id,'ET','Requested','[]'::jsonb,receipt||'TRANSFER');
 evidence:=public.pos_manager_review_detail(manager.site_id,'ET','receiving',transfer_id,0);
 ASSERT NOT (evidence->'fields' ?| ARRAY['items','expected_quantity','received_quantity','discrepancy_details']), 'Blind receiving must hide manifests and counts';
 ASSERT (evidence->>'can_controls')::boolean, 'Existing receiving controls should be available';
 result:=public.record_pos_manager_review(manager.site_id,'ET','receiving',transfer_id,evidence->>'fingerprint','Reviewed incoming transfer status');
 ASSERT (result->>'saved')::boolean;
 ASSERT (SELECT status FROM public.transfers WHERE id=transfer_id)='Requested', 'Review note cannot receive stock';
 PERFORM set_config('request.jwt.claim.sub',worker.id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',worker.id,'role','authenticated')::text,true);
 blocked:=false;
 BEGIN PERFORM public.pos_manager_review_queue(manager.site_id,'ET','all',false,0); EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 ASSERT blocked,'Cashier must not gain manager review access';
 PERFORM set_config('request.jwt.claim.sub',foreign_worker.id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',foreign_worker.id,'role','authenticated')::text,true);
 blocked:=false;
 BEGIN PERFORM public.pos_manager_review_detail(manager.site_id,'ET','sale',sale,0); EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 ASSERT blocked,'Cross-country review must be denied';
 PERFORM set_config('request.jwt.claim.sub',manager.id::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',manager.id,'role','authenticated')::text,true);
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 INSERT INTO public.sales(id,site_id,country_code,currency,subtotal,tax,total,payment_method,status,cashier_id,cashier_name,receipt_number)
 VALUES(own_sale,manager.site_id,'ET','ETB',100,0,100,'Cash','Pending',manager.id,manager.name,receipt||'OWN');
 sale:=own_sale;
 evidence:=public.pos_manager_review_detail(manager.site_id,'ET','sale',sale,0);
 ASSERT NOT (evidence->>'can_note')::boolean,'Own activity must not be independently reviewed';
 blocked:=false;
 BEGIN PERFORM public.record_pos_manager_review(manager.site_id,'ET','sale',sale,evidence->>'fingerprint','Self review is not allowed'); EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 ASSERT blocked;
END $$;
ROLLBACK;
