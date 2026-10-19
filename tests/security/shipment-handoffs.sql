-- Run on staging; every fixture and audit is rolled back.
BEGIN;
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
CREATE FUNCTION pg_temp.expect_shipment_error(statement text, fragment text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE statement;
  EXCEPTION WHEN OTHERS THEN
    IF position(fragment IN SQLERRM) = 0 THEN RAISE EXCEPTION 'Unexpected rejection: %',SQLERRM; END IF;
    RETURN;
  END;
  RAISE EXCEPTION 'Expected rejection containing: %',fragment;
END;
$$;
DO $$
DECLARE
  source uuid;
  destination uuid;
  v_country text;
  dispatcher uuid;
  driver uuid;
  floor_worker uuid;
  foreign_driver uuid;
  receiver uuid;
  receiver_name text;
  parent uuid := gen_random_uuid();
  child uuid := gen_random_uuid();
  collision uuid := gen_random_uuid();
  manifest jsonb := '[{"productId":"fixture","sku":"TEST-CARROTS","name":"Carrots","expectedQty":10,"pickedQty":0,"packedQty":0,"status":"Pending"}]';
BEGIN
  SELECT e.site_id,s.country,e.id INTO source,v_country,dispatcher FROM public.employees e JOIN public.sites s ON s.id=e.site_id
   WHERE e.role='dispatcher' AND lower(e.status)='active' AND s.type='Warehouse'
     AND NOT EXISTS (SELECT 1 FROM public.wms_jobs j WHERE COALESCE(j.source_site_id,j.site_id)=e.site_id AND j.status NOT IN ('Completed','Cancelled'))
     AND EXISTS (SELECT 1 FROM public.employees d WHERE d.site_id=e.site_id AND d.role='driver' AND d.status='Active') LIMIT 1;
  IF source IS NULL THEN RAISE EXCEPTION 'Staging fixture needs an idle warehouse with dispatcher and driver'; END IF;
  SELECT id INTO driver FROM public.employees WHERE site_id=source AND role='driver' AND status='Active' LIMIT 1;
  SELECT id INTO floor_worker FROM public.employees WHERE site_id=source AND role='picker' AND status='Active' LIMIT 1;
  SELECT e.id INTO foreign_driver FROM public.employees e JOIN public.sites s ON s.id=e.site_id WHERE e.role='driver' AND s.country<>v_country AND e.status='Active' LIMIT 1;
  SELECT e.site_id,e.id,e.name INTO destination,receiver,receiver_name FROM public.employees e JOIN public.sites s ON s.id=e.site_id
   WHERE e.role='receiver' AND e.status='Active' AND e.site_id<>source AND s.country=v_country LIMIT 1;
  IF driver IS NULL OR receiver IS NULL OR floor_worker IS NULL OR foreign_driver IS NULL THEN RAISE EXCEPTION 'Required staging actors missing'; END IF;
  INSERT INTO public.transfers(id,source_site_id,dest_site_id,country_code,status,transfer_status,items)
    VALUES(parent,source,destination,v_country,'Requested','Packed',manifest);
  INSERT INTO public.wms_jobs(id,site_id,source_site_id,dest_site_id,country_code,type,status,priority,items_count,line_items,location,order_ref,transfer_status)
    VALUES(parent,source,source,destination,v_country,'TRANSFER','Pending','Normal',10,manifest,'Dispatch Bay',parent::text,'Packed'),
      (child,source,source,destination,v_country,'DISPATCH','Pending','Normal',10,manifest,'Dispatch Bay',parent::text,'Packed'),
      (collision,source,source,destination,v_country,'DISPATCH','Pending','Normal',10,manifest,'Dispatch Bay',gen_random_uuid()::text,'Packed');
  PERFORM set_config('test.shipment',jsonb_build_object('parent',parent,'child',child,'collision',collision,'dispatcher',dispatcher,
    'driver',driver,'floor',floor_worker,'foreign',foreign_driver,'receiver',receiver,'receiverName',receiver_name)::text,true);
END;
$$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  f jsonb := current_setting('test.shipment')::jsonb;
  parent uuid := (f->>'parent')::uuid;
  child uuid := (f->>'child')::uuid;
  collision uuid := (f->>'collision')::uuid;
  row_count integer;
  state text;
BEGIN
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',f->>'dispatcher','role','authenticated')::text,true);
  UPDATE public.wms_jobs SET assigned_to=f->>'driver',location='Dock D6',status='In-Progress' WHERE id=child;
  GET DIAGNOSTICS row_count=ROW_COUNT;
  IF row_count<>1 THEN RAISE EXCEPTION 'Dispatcher could not allocate an authorized shipment'; END IF;
  PERFORM pg_temp.expect_shipment_error(format('UPDATE public.wms_jobs SET location=%L WHERE id=%L','Dock D6',collision),'already occupied');
  PERFORM pg_temp.expect_shipment_error(format('UPDATE public.wms_jobs SET assigned_to=%L WHERE id=%L',f->>'floor',child),'verified driver');
  PERFORM pg_temp.expect_shipment_error(format('UPDATE public.wms_jobs SET assigned_to=%L WHERE id=%L',f->>'foreign',child),'verified driver');
  PERFORM pg_temp.expect_shipment_error(format('UPDATE public.wms_jobs SET status=%L WHERE id=%L','Completed',child),'Record arrival');
  PERFORM pg_temp.expect_shipment_error(format('UPDATE public.wms_jobs SET transfer_status=%L WHERE id=%L','Delivered',child),'Record departure');
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',f->>'driver','role','authenticated')::text,true);
  PERFORM pg_temp.expect_shipment_error(format('UPDATE public.wms_jobs SET transfer_status=%L WHERE id=%L','Shipped',child),'Dispatch must release');
  UPDATE public.wms_jobs SET assigned_to=f->>'driver' WHERE id=collision;
  GET DIAGNOSTICS row_count=ROW_COUNT;
  IF row_count<>0 THEN RAISE EXCEPTION 'Driver claimed an unassigned shipment'; END IF;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',f->>'dispatcher','role','authenticated')::text,true);
  UPDATE public.wms_jobs SET transfer_status='Shipped',location='In-Transit' WHERE id=child;
  SELECT transfer_status INTO state FROM public.transfers WHERE id=parent;
  IF state IS DISTINCT FROM 'Shipped' THEN RAISE EXCEPTION 'Departure did not synchronize'; END IF;
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',f->>'receiver','role','authenticated')::text,true);
  PERFORM pg_temp.expect_shipment_error(format('UPDATE public.transfers SET status=%L,transfer_status=%L,received_by=%L WHERE id=%L','Completed','Received',f->>'receiverName',parent),'Record transport arrival');
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',f->>'driver','role','authenticated')::text,true);
  PERFORM pg_temp.expect_shipment_error(format('UPDATE public.wms_jobs SET transfer_status=%L,line_items=jsonb_build_array(line_items->0 || %L::jsonb),notes=%L WHERE id=%L','Delivered','{"deliveredQty":11}','Invalid quantity',child),'Invalid arrival quantity');
  UPDATE public.wms_jobs SET transfer_status='Partially Delivered',line_items=jsonb_build_array(line_items->0 || '{"deliveredQty":6,"sku":"TAMPERED"}'::jsonb),notes='Four units damaged in transit' WHERE id=child;
  IF (SELECT line_items->0->>'sku' FROM public.wms_jobs WHERE id=child) <> 'TEST-CARROTS' THEN RAISE EXCEPTION 'Arrival changed product identity'; END IF;
  IF (SELECT received_by FROM public.wms_jobs WHERE id=child) IS NOT NULL THEN RAISE EXCEPTION 'Driver recorded destination acceptance'; END IF;
  SELECT transfer_status INTO state FROM public.transfers WHERE id=parent;
  IF state IS DISTINCT FROM 'Partially Delivered' OR (SELECT received_at FROM public.transfers WHERE id=parent) IS NOT NULL THEN RAISE EXCEPTION 'Arrival was confused with receipt'; END IF;
  PERFORM pg_temp.expect_shipment_error(format('UPDATE public.wms_jobs SET delivered_at=now()+interval %L WHERE id=%L','1 hour',child),'immutable');
  PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',f->>'receiver','role','authenticated')::text,true);
  UPDATE public.wms_jobs SET transfer_status='Received',status='Completed',received_by=f->>'receiverName',received_at=now() WHERE id=parent;
  GET DIAGNOSTICS row_count=ROW_COUNT;
  IF row_count<>1 THEN RAISE EXCEPTION 'Destination receiver could not accept the arrival'; END IF;
  IF (SELECT status FROM public.transfers WHERE id=parent) IS DISTINCT FROM 'Completed' THEN RAISE EXCEPTION 'Accepted receipt did not complete transfer'; END IF;
END;
$$;
ROLLBACK;
SELECT 'dispatch: allocation, dock collision, driver/site eligibility, departure, arrival quantities, custody, receipt and audit timestamp guards passed' AS result;
