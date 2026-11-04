-- All fixtures and their stock/audit changes roll back. Run on staging only.
BEGIN;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
SELECT set_config('request.jwt.claim.role','service_role',true);
DO $setup$
DECLARE actor public.employees%ROWTYPE; src uuid:=gen_random_uuid(); dest uuid:=gen_random_uuid();
 sku text:='ETLOTTEST'||replace(gen_random_uuid()::text,'-',''); job uuid; zone uuid; n integer;
BEGIN
 SELECT * INTO actor FROM public.employees WHERE role='receiver' AND site_id='a1111111-1111-4000-8000-000000000001' AND lower(status)='active' LIMIT 1;
 IF actor.id IS NULL THEN RAISE EXCEPTION 'Receiver fixture missing'; END IF;
 IF EXISTS(SELECT 1 FROM public.warehouse_zones WHERE site_id=actor.site_id AND upper(name) ~ '^(ZONE[[:space:]]+)?Z($|[[:space:]-])')
 OR EXISTS(SELECT 1 FROM public.products WHERE site_id=actor.site_id AND upper(location) LIKE 'Z-%') THEN RAISE EXCEPTION 'Test requires unused zone Z'; END IF;
 INSERT INTO public.warehouse_zones(site_id,name,type,capacity,occupied,is_locked,allow_putaway)
 VALUES(actor.site_id,'Zone Z','Dry',1000000,0,false,true) RETURNING id INTO zone;
 INSERT INTO public.products(id,site_id,name,sku,category,price,cost_price,stock,status,location,batch_number,expiry_date,approval_status,zone_id)
 VALUES(src,actor.site_id,'Lot conflict regression',sku,'General',0,10,0,'active','On Order','NEW','2030-01-01','pending',zone),
 (dest,actor.site_id,'Lot conflict regression',sku,'General',0,10,0,'active','Z-98-98','OLD','2029-01-01','pending',zone);
 UPDATE public.products SET location='On Order' WHERE id=src;
 FOR n IN 1..6 LOOP
  job:=gen_random_uuid();
  INSERT INTO public.wms_jobs(id,site_id,country_code,type,status,priority,location,order_ref,assigned_to,items_count,line_items)
  VALUES(job,actor.site_id,'ET','PUTAWAY','In-Progress','Normal','Receiving Dock','lot-conflict-regression',actor.id::text,1,
   jsonb_build_array(jsonb_build_object('productId',src,'sku',sku,'name','Lot conflict regression',
    'expectedQty',CASE WHEN n=1 THEN 5 WHEN n=2 THEN 3 ELSE 2 END,'status','Pending',
    'batchNumber',CASE WHEN n=3 THEN 'DIFFERENT' ELSE 'NEW' END,
    'expiryDate',CASE WHEN n=4 THEN '2031-01-01' ELSE '2030-01-01' END)));
  INSERT INTO public.job_assignments(job_id,employee_id,employee_name) VALUES(job,actor.id,actor.name);
  PERFORM set_config('test.job'||n,job::text,true);
 END LOOP;
 PERFORM set_config('test.src',src::text,true); PERFORM set_config('test.dest',dest::text,true);
 PERFORM set_config('request.jwt.claim.sub',actor.id::text,true);
 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor.id,'role','authenticated','email',actor.email)::text,true);
END;
$setup$;
SET LOCAL ROLE authenticated;
DO $checks$
DECLARE src uuid:=current_setting('test.src')::uuid; dest uuid:=current_setting('test.dest')::uuid;
 result jsonb; details text; blocked boolean; n integer;
BEGIN
 BEGIN
  result:=public.place_putaway_stock(current_setting('test.job1')::uuid,0,5,'Z-98-98');
 EXCEPTION WHEN unique_violation THEN
  IF current_setting('test.expect_duplicate',true)='true' THEN
   PERFORM set_config('test.duplicate_reproduced','true',true); RETURN;
  END IF;
  RAISE;
 END;
 ASSERT (result->>'product_id')::uuid=dest, 'Empty destination identity must be reused';
 ASSERT EXISTS(SELECT 1 FROM public.products WHERE id=dest AND stock=5 AND batch_number='NEW' AND expiry_date='2030-01-01'), 'Empty row lot metadata must be replaced';
 ASSERT EXISTS(SELECT 1 FROM public.products WHERE id=src AND stock=0 AND location='On Order'), 'Receiving placeholder must remain unchanged';
 result:=public.place_putaway_stock(current_setting('test.job2')::uuid,0,3,'Z-98-98');
 ASSERT (result->>'product_id')::uuid=dest, 'Matching lots must consolidate';
 ASSERT (SELECT stock FROM public.products WHERE id=dest)=8, 'Matching lot quantity must add exactly once';
 FOR n IN 3..4 LOOP
  blocked:=false;
  BEGIN
   PERFORM public.place_putaway_stock(current_setting('test.job'||n)::uuid,0,2,'Z-98-98');
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
   GET STACKED DIAGNOSTICS details=PG_EXCEPTION_DETAIL;
   IF details IS DISTINCT FROM 'PUTAWAY_BIN_LOT_CONFLICT' THEN RAISE; END IF;
   blocked:=true;
  END;
  ASSERT blocked, 'Occupied incompatible batch or expiry must be rejected';
  ASSERT (SELECT line_items->0->>'status' FROM public.wms_jobs WHERE id=current_setting('test.job'||n)::uuid)='Pending', 'Rejected jobs must remain pending';
 END LOOP;
 ASSERT (SELECT stock FROM public.products WHERE id=dest)=8, 'Rejected placements must not change stock';
 ASSERT (SELECT count(*) FROM public.stock_movements WHERE product_id=dest)=2, 'Only successful placements may create movements';
 blocked:=false;
 BEGIN PERFORM public.place_putaway_stock(current_setting('test.job1')::uuid,0,5,'Z-98-98');
 EXCEPTION WHEN OTHERS THEN IF position('already recorded' IN SQLERRM)=0 THEN RAISE; END IF; blocked:=true; END;
 ASSERT blocked, 'A retry must not duplicate placement';
 result:=public.place_putaway_stock(current_setting('test.job5')::uuid,0,2,'Z-98-97');
 ASSERT (result->>'product_id')::uuid=src, 'Unused receiving placeholder must still move into an empty bin';
 result:=public.place_putaway_stock(current_setting('test.job6')::uuid,0,2,'Z-98-96');
 ASSERT (result->>'product_id')::uuid NOT IN (src,dest), 'A stocked source requires a separate destination record';
 ASSERT (SELECT stock FROM public.products WHERE id=src)=2, 'Creating another destination must not alter existing stock';
END;
$checks$;
SELECT current_setting('test.duplicate_reproduced',true) AS baseline_duplicate_reproduced;
ROLLBACK;
