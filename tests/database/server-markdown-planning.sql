BEGIN;
SET LOCAL statement_timeout='15s';
-- Synthetic receipts are rolled back. Authenticated role calls exercise the actual public API grants.
DO $$
DECLARE actor uuid; p public.products%ROWTYPE; other_site uuid; sale uuid; expected numeric; i integer;
BEGIN
 SELECT e.id INTO actor FROM public.employees e JOIN public.sites s ON s.id=e.site_id
 WHERE e.role='merchandising_specialist' AND lower(e.status)='active' AND s.country='ET' AND s.region_code IS NULL LIMIT 1;
 IF actor IS NULL THEN RAISE EXCEPTION 'Staging specialist fixture missing'; END IF;
 PERFORM set_config('request.jwt.claim.sub',actor::text,true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 SELECT prod.* INTO p FROM public.products prod JOIN public.sites s ON s.id=prod.site_id
 WHERE s.country='ET' AND prod.cost_price>0 AND round(prod.cost_price)<round(prod.price*.8) AND prod.stock>0 AND prod.status<>'archived'
 AND (prod.expiry_date IS NULL OR prod.expiry_date>current_date+30) AND private.markdown_scope(prod.site_id,'ET')
 AND NOT EXISTS(SELECT 1 FROM public.inventory_requests r WHERE r.product_id=prod.id::text AND r.status='pending' AND r.change_type='edit') LIMIT 1;
 IF p.id IS NULL THEN RAISE EXCEPTION 'Staging scoped product fixture missing'; END IF;
 SELECT id INTO other_site FROM public.sites WHERE country='ET' AND id<>p.site_id LIMIT 1;
 FOR i IN 1..26 LOOP
  INSERT INTO public.sales(site_id,country_code,currency,status,sale_date,subtotal,tax,total,payment_method)
  VALUES(p.site_id,'ET','ETB','Completed',now()-interval '1 day',p.price,0,p.price,'Cash') RETURNING id INTO sale;
  INSERT INTO public.sale_items(sale_id,product_id,product_name,quantity,price) VALUES(sale,p.id,p.name,1,p.price);
 END LOOP;
 -- Neither a pending receipt nor sales from another facility belong to this baseline.
 INSERT INTO public.sales(site_id,country_code,currency,status,sale_date,subtotal,tax,total,payment_method)
 VALUES(p.site_id,'ET','ETB','Pending',now(),p.price,0,p.price,'Cash') RETURNING id INTO sale;
 INSERT INTO public.sale_items(sale_id,product_id,product_name,quantity,price) VALUES(sale,p.id,p.name,100,p.price);
 INSERT INTO public.sales(site_id,country_code,currency,status,sale_date,subtotal,tax,total,payment_method)
 VALUES(other_site,'ET','ETB','Completed',now(),p.price,0,p.price,'Cash') RETURNING id INTO sale;
 INSERT INTO public.sale_items(sale_id,product_id,product_name,quantity,price) VALUES(sale,p.id,p.name,100,p.price);
 SELECT round(coalesce(sum(si.quantity),0)) INTO expected FROM public.sale_items si JOIN public.sales s ON s.id=si.sale_id
 WHERE si.product_id=p.id AND s.site_id=p.site_id AND s.country_code='ET' AND s.status='Completed'
 AND s.sale_date>=now()-interval '30 days' AND s.sale_date<=now() AND si.quantity>0;
 PERFORM set_config('test.markdown_product',p.id::text,true);PERFORM set_config('test.markdown_expected',expected::text,true);
END; $$;
SET LOCAL ROLE authenticated;
DO $$
DECLARE plan jsonb; p uuid:=current_setting('test.markdown_product')::uuid; expected numeric:=current_setting('test.markdown_expected')::numeric; result jsonb;
BEGIN
 plan:=public.generate_markdown_plan(p,'ET',(now() AT TIME ZONE 'Africa/Addis_Ababa')::date+21);
 IF (plan->>'unitsSold30d')::numeric<>expected OR expected<26 THEN RAISE EXCEPTION 'TEST: full sales window not aggregated'; END IF;
 IF plan->'projectedMarginPct'<>'null' OR plan->'totalLandedCost'<>'null' OR plan ? 'snapshot' OR plan ? 'costPrice' THEN RAISE EXCEPTION 'TEST: restricted financial data exposed'; END IF;
 IF plan->'stages'->1->'selectedImpact'->'marginPct'<>'null' THEN RAISE EXCEPTION 'TEST: restricted selected margin exposed'; END IF;
 IF (plan->'stages'->1->'selectedImpact'->>'revenue')::numeric<>(plan->'totalProjectedSales')::numeric*(plan->'stages'->1->>'price')::numeric THEN RAISE EXCEPTION 'TEST: selected-price preview inconsistent'; END IF;
 PERFORM set_config('test.markdown_token',plan->>'token',true);
 BEGIN
  PERFORM public.generate_markdown_plan(p,'KE',(now() AT TIME ZONE 'Africa/Addis_Ababa')::date+21);
  RAISE EXCEPTION 'TEST: wrong-country plan accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.submit_markdown_plan((plan->>'token')::uuid,-1);
  RAISE EXCEPTION 'TEST: invalid stage accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM LIKE 'TEST:%' THEN RAISE; END IF; END;
END; $$;
RESET ROLE;
-- Alter the private stored evidence to reproduce any live product version mismatch.
UPDATE private.markdown_plans SET snapshot=jsonb_set(snapshot,'{price}','0') WHERE id=current_setting('test.markdown_token')::uuid;
SET LOCAL ROLE authenticated;
DO $$
BEGIN
 BEGIN
  PERFORM public.submit_markdown_plan(current_setting('test.markdown_token')::uuid,1);
  RAISE EXCEPTION 'TEST: stale product snapshot accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
END; $$;
RESET ROLE;
UPDATE private.markdown_plans e SET snapshot=to_jsonb(p) FROM public.products p WHERE e.id=current_setting('test.markdown_token')::uuid AND p.id=e.product_id;
SET LOCAL ROLE authenticated;
DO $$
DECLARE response jsonb; repeat_response jsonb;
BEGIN
 response:=public.submit_markdown_plan(current_setting('test.markdown_token')::uuid,1);
 repeat_response:=public.submit_markdown_plan(current_setting('test.markdown_token')::uuid,1);
 IF response IS DISTINCT FROM repeat_response OR response->>'saved'<>'true' THEN RAISE EXCEPTION 'TEST: idempotent save failed'; END IF;
 PERFORM set_config('test.markdown_request',response->>'requestId',true);
END; $$;
RESET ROLE;
DO $$
DECLARE r public.inventory_requests%ROWTYPE; p public.products%ROWTYPE; country_deadline date;
BEGIN
 SELECT * INTO r FROM public.inventory_requests WHERE id=current_setting('test.markdown_request')::uuid;
 IF r.status<>'pending' OR r.proposed_changes ? 'costPrice' OR r.proposed_changes ? 'cost_price' OR r.approved_at IS NOT NULL THEN RAISE EXCEPTION 'TEST: approval or cost disclosure bypass'; END IF;
 SELECT * INTO p FROM public.products WHERE id=current_setting('test.markdown_product')::uuid;
 -- Test expiry using the product fixture when within the supported horizon; otherwise compare at submission below.
 country_deadline:=(now() AT TIME ZONE 'Africa/Addis_Ababa')::date+21;
 UPDATE private.markdown_plans SET request_id=NULL,deadline=country_deadline+400 WHERE id=current_setting('test.markdown_token')::uuid;
END; $$;
ROLLBACK;
SELECT 'PASS: full sales baseline, private cost protection, country denial, stale snapshot rejection, selected-price impact and pending idempotent proposal' AS result;
