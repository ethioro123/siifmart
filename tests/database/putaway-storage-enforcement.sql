-- Rollback-only worker regression: no test inventory or movements survive.
BEGIN;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
SELECT set_config('request.jwt.claim.role','service_role',true);
DO $test$
DECLARE actor public.employees%ROWTYPE; product uuid:=gen_random_uuid(); job uuid:=gen_random_uuid(); test_sku text:='ETTEST'||replace(gen_random_uuid()::text,'-','');
BEGIN
 SELECT * INTO actor FROM public.employees WHERE role='receiver' AND site_id='a1111111-1111-4000-8000-000000000001' AND lower(status)='active' LIMIT 1;
 IF actor.id IS NULL THEN RAISE EXCEPTION 'Receiver fixture missing'; END IF;
 IF EXISTS(SELECT 1 FROM public.warehouse_zones WHERE site_id=actor.site_id AND upper(name) ~ '^(ZONE[[:space:]]+)?Z($|[[:space:]-])') OR EXISTS(SELECT 1 FROM public.products WHERE site_id=actor.site_id AND upper(location) LIKE 'Z-%') THEN RAISE EXCEPTION 'Test requires unused zone Z'; END IF;
 INSERT INTO public.warehouse_zones(site_id,name,type,temperature,capacity,occupied,is_locked,allow_putaway) VALUES(actor.site_id,'Zone Z','Dry','Ambient',5,0,false,true);
 INSERT INTO public.products(id,site_id,name,sku,category,price,cost_price,stock,status,location,approval_status)
 VALUES(product,actor.site_id,'Putaway regression',test_sku,'General',0,10,0,'active','On Order','pending');
 INSERT INTO public.wms_jobs(id,site_id,country_code,type,status,priority,location,order_ref,assigned_to,items_count,line_items)
 VALUES(job,actor.site_id,'ET','PUTAWAY','In-Progress','Normal','Receiving Dock','putaway-regression',actor.id::text,1,
 jsonb_build_array(jsonb_build_object('productId',product,'sku',test_sku,'name','Putaway regression','expectedQty',10,'status','Pending','batchNumber','TEST-LOT','expiryDate','2028-01-01')));
 INSERT INTO public.job_assignments(job_id,employee_id,employee_name) VALUES(job,actor.id,actor.name);
 PERFORM set_config('test.product',product::text,true); PERFORM set_config('test.job',job::text,true);
 PERFORM set_config('request.jwt.claim.sub',actor.id::text,true);
 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor.id,'role','authenticated','email',actor.email)::text,true);
END;
$test$;
-- Run placement checks with authenticated JWT claims; fixture setup remains transaction-local.
DO $test$
DECLARE product uuid:=current_setting('test.product')::uuid; job uuid:=current_setting('test.job')::uuid;
 changed integer; blocked boolean; result jsonb;
BEGIN
 blocked:=false;
 BEGIN PERFORM public.place_putaway_stock(job,0,11,'Z-99-99'); EXCEPTION WHEN OTHERS THEN blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Over-placement accepted'; END IF;
 blocked:=false;
 BEGIN PERFORM public.place_putaway_stock(job,0,10,'On Order'); EXCEPTION WHEN OTHERS THEN blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Invalid storage bin accepted'; END IF;
 blocked:=false;
 BEGIN PERFORM public.place_putaway_stock(job,0,10,'Z-99-99'); EXCEPTION WHEN OTHERS THEN IF position('capacity' IN SQLERRM)=0 THEN RAISE; END IF; blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Over-capacity placement accepted'; END IF;
 IF (SELECT stock FROM public.products WHERE id=product)<>0 THEN RAISE EXCEPTION 'Rejected placement changed stock'; END IF;
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 PERFORM set_config('request.jwt.claims','{"role":"service_role"}',true);
 UPDATE public.warehouse_zones SET capacity=20,is_locked=true WHERE site_id=(SELECT site_id FROM public.wms_jobs WHERE id=job) AND name='Zone Z';
 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 blocked:=false;
 BEGIN PERFORM public.place_putaway_stock(job,0,10,'Z-99-99'); EXCEPTION WHEN OTHERS THEN IF position('locked' IN SQLERRM)=0 THEN RAISE; END IF; blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Locked zone placement accepted'; END IF;
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 UPDATE public.warehouse_zones SET is_locked=false,temperature='Frozen' WHERE site_id=(SELECT site_id FROM public.wms_jobs WHERE id=job) AND name='Zone Z';
 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 blocked:=false;
 BEGIN PERFORM public.place_putaway_stock(job,0,10,'Z-99-99'); EXCEPTION WHEN OTHERS THEN IF position('storage requirement' IN SQLERRM)=0 THEN RAISE; END IF; blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Wrong storage zone accepted'; END IF;
 PERFORM set_config('request.jwt.claim.role','service_role',true);
 UPDATE public.warehouse_zones SET temperature='Ambient' WHERE site_id=(SELECT site_id FROM public.wms_jobs WHERE id=job) AND name='Zone Z';
 PERFORM set_config('request.jwt.claim.role','authenticated',true);
 result:=public.place_putaway_stock(job,0,10,'Z-99-99');
 IF (result->>'product_id')::uuid<>product THEN RAISE EXCEPTION 'Placeholder was not recycled'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.products WHERE id=product AND stock=10 AND location='Z-99-99' AND approval_status='pending' AND price=0) THEN RAISE EXCEPTION 'Stock or approval state incorrect'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.wms_jobs WHERE id=job AND line_items->0->>'status'='Picked') THEN RAISE EXCEPTION 'Placement progress missing'; END IF;
 IF (SELECT count(*) FROM public.stock_movements WHERE product_id=product)<>1 THEN RAISE EXCEPTION 'Movement audit missing or duplicated'; END IF;
 blocked:=false;
 BEGIN PERFORM public.place_putaway_stock(job,0,10,'Z-99-99'); EXCEPTION WHEN OTHERS THEN blocked:=true; END;
 IF NOT blocked THEN RAISE EXCEPTION 'Duplicate placement accepted'; END IF;
 IF (SELECT stock FROM public.products WHERE id=product)<>10 THEN RAISE EXCEPTION 'Retry changed inventory'; END IF;
END;
$test$;
ROLLBACK;

SELECT 'Putaway capacity, lock, storage, stock audit and duplicate checks passed; rolled back' AS result;
