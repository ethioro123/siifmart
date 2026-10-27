BEGIN;
SET LOCAL statement_timeout='8s';
-- Privileged row access with authenticated actor claims exercises triggers, not zero-row RLS updates.
DO $$
DECLARE actor uuid; p public.products%ROWTYPE; other_product public.products%ROWTYPE; request_id uuid;
BEGIN
 SELECT e.id INTO actor FROM public.employees e JOIN public.sites s ON s.id=e.site_id
 WHERE lower(e.status)='active' AND s.country='ET' AND e.role='country_commercial_director' LIMIT 1;
 IF actor IS NULL THEN RAISE EXCEPTION 'Staging merchandising approver fixture missing'; END IF;
 SELECT prod.* INTO p FROM public.products prod JOIN public.sites s ON s.id=prod.site_id
 WHERE s.country='ET' AND prod.price>1 AND NOT EXISTS(SELECT 1 FROM public.inventory_requests r WHERE r.product_id=prod.id::text AND r.status='pending' AND r.change_type='edit') LIMIT 1;
 IF p.id IS NULL THEN RAISE EXCEPTION 'Staging product fixture missing'; END IF;
 PERFORM set_config('request.jwt.claim.sub',actor::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,adjustment_reason,proposed_changes)
 VALUES(p.id::text,p.name,p.sku,p.site_id::text,'ET','edit','pending','PRICE_CHANGE: Clearance proposal: rollback regression',jsonb_build_object('salePrice',round(p.price*.9),'isOnSale',true)) RETURNING id INTO request_id;
 BEGIN
  INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,adjustment_reason,proposed_changes)
  VALUES(p.id::text,p.name,p.sku,p.site_id::text,'ET','edit','pending','PRICE_CHANGE: Clearance proposal: duplicate regression',jsonb_build_object('salePrice',round(p.price*.8),'isOnSale',true));
  RAISE EXCEPTION 'TEST: duplicate clearance proposal accepted';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 BEGIN
  INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,adjustment_reason,proposed_changes)
  VALUES(p.id::text,p.name,p.sku,p.site_id::text,'ET','edit','pending','PRICE_CHANGE: competing regular price edit',jsonb_build_object('price',p.price+1));
  RAISE EXCEPTION 'TEST: competing edit accepted after clearance proposal';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 SELECT prod.* INTO other_product FROM public.products prod JOIN public.sites s ON s.id=prod.site_id
 WHERE s.country='ET' AND prod.id<>p.id AND prod.price>1 AND NOT EXISTS(SELECT 1 FROM public.inventory_requests r WHERE r.product_id=prod.id::text AND r.status='pending' AND r.change_type='edit') LIMIT 1;
 IF other_product.id IS NULL THEN RAISE EXCEPTION 'Staging independent product fixture missing'; END IF;
 INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,adjustment_reason,proposed_changes)
 VALUES(other_product.id::text,other_product.name,other_product.sku,other_product.site_id::text,'ET','edit','pending','PRICE_CHANGE: other product regression',jsonb_build_object('price',other_product.price+1));
 BEGIN
  INSERT INTO public.inventory_requests(product_id,product_name,product_sku,site_id,country_code,change_type,status,adjustment_reason,proposed_changes)
  VALUES(other_product.id::text,other_product.name,other_product.sku,other_product.site_id::text,'ET','edit','pending','PRICE_CHANGE: Clearance proposal: existing edit regression',jsonb_build_object('salePrice',round(other_product.price*.9),'isOnSale',true));
  RAISE EXCEPTION 'TEST: clearance ignored a pre-existing pending edit';
 EXCEPTION WHEN unique_violation THEN NULL; END;
END; $$;
ROLLBACK;
SELECT 'PASS: duplicate markdown and competing edits blocked in either order; another product remains independent' AS result;
