-- Staging regression: no fixtures or approvals survive this transaction.
BEGIN;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
SELECT set_config('request.jwt.claim.role','service_role',true);
DO $test$
DECLARE v_site public.sites%ROWTYPE; v_finance uuid; v_po uuid := gen_random_uuid(); v_limit numeric;
BEGIN
 SELECT s.* INTO v_site FROM public.sites s JOIN public.regions r ON r.code=s.region_code
 WHERE s.country='ET' AND s.type='Warehouse' AND lower(r.status)='active' AND r.autonomous_po_limit IS NOT NULL ORDER BY s.code LIMIT 1;
 SELECT e.id INTO v_finance FROM public.employees e JOIN public.sites s ON s.id=e.site_id
 WHERE e.role='country_finance_director' AND s.country='ET' AND lower(e.status)='active' LIMIT 1;
 IF v_site.id IS NULL OR v_finance IS NULL THEN RAISE EXCEPTION 'Missing staging finance/warehouse fixtures'; END IF;
 SELECT autonomous_po_limit INTO v_limit FROM public.regions WHERE code=v_site.region_code;
 INSERT INTO public.purchase_orders(id,site_id,supplier_name,total_amount,items_count,status,country_code,region_code,created_by,requested_by,currency)
 VALUES(v_po,v_site.id,'Finance queue regression',v_limit+1,0,'Pending','ET',v_site.region_code,'Independent test buyer','Independent test buyer','ETB');
 PERFORM set_config('test.po_id',v_po::text,true);
 PERFORM set_config('request.jwt.claim.sub',v_finance::text,true);
 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',v_finance,'role','authenticated')::text,true);
END;
$test$;
SET LOCAL ROLE authenticated;
DO $test$
DECLARE v_po uuid := current_setting('test.po_id')::uuid; v_result jsonb;
BEGIN
 v_result := public.get_po_finance_review_queue('ET',50,0);
 IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_result->'data') row WHERE row->>'id'=v_po::text) THEN
   RAISE EXCEPTION 'Pending over-limit PO missing from HQ finance queue'; END IF;
 IF (public.get_po_finance_review_queue('KE',20,0)->>'count')::integer <> 0 THEN RAISE EXCEPTION 'Cross-country queue exposed'; END IF;
 PERFORM public.clear_purchase_order_finance(v_po,'Checked test budget and available funding');
 IF NOT EXISTS(SELECT 1 FROM public.purchase_orders WHERE id=v_po AND finance_cleared_at IS NOT NULL AND status='Pending') THEN
   RAISE EXCEPTION 'Finance clearance was not saved independently of final approval'; END IF;
 IF EXISTS (SELECT 1 FROM jsonb_array_elements(public.get_po_finance_review_queue('ET',50,0)->'data') row WHERE row->>'id'=v_po::text) THEN
   RAISE EXCEPTION 'Cleared PO remained in pending queue'; END IF;
END;
$test$;
RESET ROLE;
SELECT set_config('request.jwt.claim.role','service_role',true);
UPDATE public.purchase_orders SET total_amount=total_amount+1,
 created_by=(SELECT name FROM public.employees WHERE id=(SELECT auth.uid()))
 WHERE id=current_setting('test.po_id')::uuid;
SELECT set_config('request.jwt.claim.role','authenticated',true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE v_po uuid := current_setting('test.po_id')::uuid; blocked boolean := false; changed integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(public.get_po_finance_review_queue('ET',50,0)->'data') row WHERE row->>'id'=v_po::text) THEN
   RAISE EXCEPTION 'Changed amount did not invalidate finance clearance'; END IF;
 BEGIN
   PERFORM public.clear_purchase_order_finance(v_po,'Trying to clear my own order');
 EXCEPTION WHEN insufficient_privilege THEN blocked := true;
 END;
 IF NOT blocked THEN RAISE EXCEPTION 'Finance creator cleared their own PO'; END IF;
 UPDATE public.purchase_orders SET notes='Direct finance edit' WHERE id=v_po;
 GET DIAGNOSTICS changed = ROW_COUNT;
 IF changed <> 0 THEN RAISE EXCEPTION 'Finance acquired direct PO editing rights'; END IF;
END;
$test$;
ROLLBACK;
