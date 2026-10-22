-- All fixture writes are rolled back, including generated order numbers and audit rows.
BEGIN;
SELECT set_config('request.jwt.claim.role', 'service_role', true);
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);
DO $test$
DECLARE site uuid;
DECLARE po uuid := gen_random_uuid();
DECLARE product uuid := gen_random_uuid();
DECLARE item uuid;
DECLARE stored_price numeric;
DECLARE stored_attributes jsonb;
DECLARE approved text;
DECLARE rejected boolean;
DECLARE chilled jsonb := '{"storage":{"type":"Chilled (0-4 C)","isPerishable":true,"shelfLifeDays":"14","requirementsConfirmed":true}}';
BEGIN
  SELECT id INTO site FROM public.sites WHERE type = 'Warehouse' AND country = 'ET' AND status = 'Active' ORDER BY code LIMIT 1;
  IF site IS NULL THEN RAISE EXCEPTION 'Staging warehouse fixture unavailable'; END IF;
  INSERT INTO public.purchase_orders(id,site_id,supplier_name,total_amount,items_count,status,temp_req,shelf_life,country_code)
  VALUES(po,site,'Requirement regression',100,1,'Draft','Ambient','7','ET');
  rejected := false;
  BEGIN
    INSERT INTO public.po_items(po_id,product_name,quantity,unit_cost,total_cost,custom_attributes)
    VALUES(po,'Cold product',1,10,10,chilled);
  EXCEPTION WHEN check_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Ambient delivery accepted chilled goods'; END IF;

  UPDATE public.purchase_orders SET temp_req = 'Chilled' WHERE id = po;
  INSERT INTO public.po_items(po_id,product_name,quantity,unit_cost,total_cost,retail_price,custom_attributes)
  VALUES(po,'Cold product',1,10.25,10.25,999,chilled) RETURNING id,retail_price INTO item,stored_price;
  IF stored_price <> 0 THEN RAISE EXCEPTION 'New product PO published a retail price'; END IF;

  rejected := false;
  BEGIN
    UPDATE public.purchase_orders SET shelf_life = '15' WHERE id = po;
  EXCEPTION WHEN check_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Remaining shelf life exceeded total life'; END IF;
  rejected := false;
  BEGIN
    UPDATE public.purchase_orders SET temp_req = 'Ambient' WHERE id = po;
  EXCEPTION WHEN check_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Header update bypassed temperature protection'; END IF;
  rejected := false;
  BEGIN
    INSERT INTO public.po_items(po_id,product_name,quantity,unit_cost,total_cost,custom_attributes)
    VALUES(po,'Unconfirmed',1,10,10,'{"storage":{"type":"Chilled","requirementsConfirmed":false}}');
  EXCEPTION WHEN check_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Unconfirmed new product accepted'; END IF;

  DELETE FROM public.po_items WHERE id = item;
  UPDATE public.purchase_orders SET temp_req = 'Ambient' WHERE id = po;
  INSERT INTO public.products(id,site_id,name,sku,category,price,stock,custom_attributes)
  VALUES(product,site,'Catalog regression','ET-TEST-' || gen_random_uuid()::text,'General',42,0,'{"storage":{"type":"Ambient"}}');
  INSERT INTO public.po_items(po_id,product_id,product_name,quantity,unit_cost,total_cost,retail_price,custom_attributes)
  VALUES(po,product,'Catalog regression',1,10,10,999,'{"storage":{"type":"Frozen"}}')
  RETURNING retail_price,custom_attributes INTO stored_price,stored_attributes;
  IF stored_price <> 42 OR stored_attributes #>> '{storage,type}' <> 'Ambient' THEN
    RAISE EXCEPTION 'Catalog price/specification snapshot could be overwritten';
  END IF;
  INSERT INTO public.products(site_id,name,sku,category,price,stock)
  VALUES(site,'Unpriced regression','ET-TEST-' || gen_random_uuid()::text,'General',0,0)
  RETURNING approval_status INTO approved;
  IF approved <> 'pending' THEN RAISE EXCEPTION 'Unpriced new product bypassed product approval'; END IF;
  rejected := false;
  BEGIN
    PERFORM private.po_shelf_life_days('2.5');
  EXCEPTION WHEN check_violation THEN rejected := true;
  END;
  IF NOT rejected THEN RAISE EXCEPTION 'Fractional shelf life accepted'; END IF;
END;
$test$;
ROLLBACK;
SELECT 'PO delivery and pricing integrity assertions passed' AS result;
