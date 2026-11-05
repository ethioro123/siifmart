-- All fixture orders, changes and audit rows are rolled back.
BEGIN;
DO $test$
DECLARE ceo uuid; target public.regions; other public.regions; warehouse uuid; manager uuid; regional_actor uuid; floor_actor uuid;
 baseline numeric; result jsonb; n integer:=CASE WHEN current_setting('siifmart.large_fixture',true)='on' THEN 1005 ELSE 3 END; month_start date;
BEGIN
 SELECT id INTO ceo FROM public.employees WHERE role='group_ceo' AND lower(status)='active' LIMIT 1;
 SELECT * INTO target FROM public.regions WHERE code='ADD';
 SELECT * INTO other FROM public.regions WHERE code='ADA';
 SELECT id INTO warehouse FROM public.sites WHERE region_code=target.code AND type='Warehouse' AND status='Active' LIMIT 1;
 IF ceo IS NULL OR target.code IS NULL OR other.code IS NULL OR warehouse IS NULL THEN RAISE EXCEPTION 'Required region fixtures missing'; END IF;
 month_start:=date_trunc('month',statement_timestamp() AT TIME ZONE 'Africa/Nairobi')::date;
 SELECT coalesce(sum(po.total_amount),0) INTO baseline FROM public.purchase_orders po LEFT JOIN public.sites s ON s.id=po.site_id
 WHERE coalesce(po.region_code,s.region_code)=target.code AND po.country_code=target.country AND po.order_date>=month_start
 AND po.order_date<(month_start+interval '1 month')::date AND po.status IN('Approved','Ordered','Partially Received','Received');
 INSERT INTO public.purchase_orders(id,site_id,country_code,region_code,supplier_name,total_amount,items_count,status,currency,order_date)
 SELECT gen_random_uuid(),warehouse,target.country,CASE WHEN i%2=0 THEN target.code ELSE NULL END,'Transactional region verification',1,1,'Received','ETB',month_start FROM generate_series(1,n) i;
 PERFORM set_config('request.jwt.claims',json_build_object('sub',ceo,'role','authenticated')::text,true);
 SET LOCAL ROLE authenticated;
 result:=public.get_region_budget_status(target.code);
 IF (result->>'currentMonthSpend')::numeric<>baseline+n THEN RAISE EXCEPTION 'Complete region total mismatch'; END IF;
 PERFORM public.update_region_and_site_assignments(target.code,jsonb_build_object('autonomous_expense_limit',0,'change_reason','Transactional zero-limit verification'),ARRAY[]::uuid[],ARRAY[]::uuid[]);
 IF (SELECT autonomous_expense_limit FROM public.regions WHERE code=target.code)<>0 THEN RAISE EXCEPTION 'Zero expense limit not preserved'; END IF;
 BEGIN
  PERFORM public.update_region_and_site_assignments(target.code,jsonb_build_object('admin_hub_site_id',other.admin_hub_site_id,'change_reason','Transactional hub theft rejection'),ARRAY[]::uuid[],ARRAY[]::uuid[]);
  RAISE EXCEPTION 'Hub reuse was accepted' USING ERRCODE='XX000';
 EXCEPTION WHEN check_violation OR unique_violation THEN NULL; END;
 BEGIN
  UPDATE public.sites SET region_code=other.code WHERE id=target.admin_hub_site_id;
  RAISE EXCEPTION 'Linked hub moved' USING ERRCODE='XX000';
 EXCEPTION WHEN check_violation THEN NULL; END;
 manager:=other.regional_manager_id;
 IF manager IS NOT NULL THEN
  BEGIN
   PERFORM public.update_region_and_site_assignments(target.code,jsonb_build_object('regional_manager_id',manager,'change_reason','Transactional manager scope rejection'),ARRAY[]::uuid[],ARRAY[]::uuid[]);
   RAISE EXCEPTION 'Wrong-region manager accepted' USING ERRCODE='XX000';
  EXCEPTION WHEN check_violation OR unique_violation THEN NULL; END;
 END IF;
 RESET ROLE;
 SELECT e.id INTO regional_actor FROM public.employees e JOIN public.sites s ON s.id=e.site_id
 WHERE e.role='regional_operations_manager' AND lower(e.status)='active' AND coalesce(e.region_code,s.region_code)=target.code LIMIT 1;
 IF regional_actor IS NOT NULL THEN
  PERFORM set_config('request.jwt.claims',json_build_object('sub',regional_actor,'role','authenticated')::text,true);
  SET LOCAL ROLE authenticated;
  PERFORM public.get_region_budget_status(target.code);
  BEGIN PERFORM public.get_region_budget_status(other.code); RAISE EXCEPTION 'Other-region budget leaked' USING ERRCODE='XX000'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  BEGIN PERFORM public.get_region_budget_status('NRB'); RAISE EXCEPTION 'Other-country budget leaked' USING ERRCODE='XX000'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;
 END IF;
 SELECT id INTO floor_actor FROM public.employees WHERE role='picker' AND lower(status)='active' LIMIT 1;
 IF floor_actor IS NOT NULL THEN
  PERFORM set_config('request.jwt.claims',json_build_object('sub',floor_actor,'role','authenticated')::text,true);
  SET LOCAL ROLE authenticated;
  BEGIN PERFORM public.get_region_budget_status(target.code); RAISE EXCEPTION 'Unauthorized role read budget' USING ERRCODE='XX000'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  RESET ROLE;
 END IF;
 PERFORM set_config('request.jwt.claims','{}',true);
 SET LOCAL ROLE authenticated;
 BEGIN PERFORM public.get_region_budget_status(target.code); RAISE EXCEPTION 'Missing identity read budget' USING ERRCODE='XX000'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 RESET ROLE;
END;
$test$;
SELECT 'Complete totals, zero limits, hub protection and available actor-scope checks passed' verification;
ROLLBACK;
