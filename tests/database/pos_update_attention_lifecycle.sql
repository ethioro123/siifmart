-- Staging rollback verification. No receipts, catalog data or price history remain afterward.
BEGIN;
DO $$
DECLARE actor uuid; product uuid; site uuid; country text; stamp timestamptz;
BEGIN
 SELECT e.id,p.id,p.site_id,upper(s.country),p.created_at INTO actor,product,site,country,stamp
 FROM public.employees e JOIN public.sites s ON s.id=e.site_id JOIN public.products p ON p.site_id=s.id
 WHERE lower(e.role) IN ('cashier','pos') AND lower(e.status)='active' AND p.created_at IS NOT NULL LIMIT 1;
 IF actor IS NULL THEN RAISE EXCEPTION 'No scoped staging test actor'; END IF;
 PERFORM set_config('test.actor',actor::text,true);
 PERFORM set_config('test.product',product::text,true);
 PERFORM set_config('test.site',site::text,true);
 PERFORM set_config('test.country',country,true);
 PERFORM set_config('test.stamp',stamp::text,true);
 INSERT INTO public.product_price_history(product_id,site_id,country_code,product_name,sku,
 old_regular_price,new_regular_price,old_sale_price,new_sale_price,old_is_on_sale,new_is_on_sale,
 old_effective_price,new_effective_price,changed_at)
 SELECT product,site,country,'Rollback test product','ROLLBACK-ONLY',100,150,NULL,NULL,false,false,100,150,now()-interval '30 days';
 PERFORM set_config('request.jwt.claim.sub',actor::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
END $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE site uuid:=current_setting('test.site')::uuid; country text:=current_setting('test.country');
 product uuid:=current_setting('test.product')::uuid; stamp timestamptz:=current_setting('test.stamp')::timestamptz;
 saved timestamptz; denied boolean:=false;
BEGIN
 IF public.count_unreviewed_product_price_history(site,now()-interval '7 days') < 1 THEN
  RAISE EXCEPTION 'Old unreviewed price change expired';
 END IF;
 PERFORM public.mark_pos_catalog_updates_read(site,country,jsonb_build_array(jsonb_build_object('product_id',product,'kind','new','changed_at',stamp)));
 PERFORM public.mark_pos_catalog_updates_read(site,country,jsonb_build_array(jsonb_build_object('product_id',product,'kind','new','changed_at',stamp-interval '1 day')));
 SELECT read_through INTO saved FROM public.pos_catalog_update_reads WHERE product_id=product AND kind='new';
 IF saved IS DISTINCT FROM stamp THEN RAISE EXCEPTION 'Older device regressed the read receipt'; END IF;
 BEGIN
  PERFORM public.mark_pos_catalog_updates_read(site,CASE country WHEN 'ET' THEN 'KE' ELSE 'ET' END,
    jsonb_build_array(jsonb_build_object('product_id',product,'kind','new','changed_at',stamp)));
 EXCEPTION WHEN insufficient_privilege THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Cross-country write was allowed'; END IF;
 denied:=false;
 BEGIN
  PERFORM public.mark_pos_catalog_updates_read(site,country,jsonb_build_array(jsonb_build_object('product_id',product,'kind','new','changed_at',now()+interval '1 day')));
 EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Future event was acknowledged'; END IF;
 denied:=false;
 BEGIN
  PERFORM public.mark_pos_catalog_updates_read(site,country,jsonb_build_array(jsonb_build_object('product_id',product,'kind','price','changed_at',stamp)));
 EXCEPTION WHEN raise_exception THEN denied:=true; END;
 IF NOT denied THEN RAISE EXCEPTION 'Catalog receipt acknowledged a price change'; END IF;
 PERFORM set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
 IF EXISTS(SELECT 1 FROM public.pos_catalog_update_reads) THEN RAISE EXCEPTION 'Another employee can read receipts'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'Price age, monotonic reads, country isolation, future rejection, price separation and employee isolation passed; rolled back' AS result;
