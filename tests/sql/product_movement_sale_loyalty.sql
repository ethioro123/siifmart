-- Rollback-only: one sale posts stock, customer spending and points exactly once.
BEGIN;
SET LOCAL statement_timeout='5s';
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
DO $$ DECLARE customer uuid:=gen_random_uuid(); BEGIN
 INSERT INTO public.customers(id,name,phone,loyalty_points,total_spent) VALUES(customer,'Rollback loyalty customer','AUDIT-'||left(customer::text,12),100,0);
 PERFORM set_config('test.loyalty.customer',customer::text,true);
 PERFORM set_config('test.loyalty.sale',gen_random_uuid()::text,true);
 PERFORM set_config('test.loyalty.stock',(SELECT stock::text FROM public.products WHERE id='0bfe7446-613b-42c3-8f66-5a1d80ae1d0e'),true);
 UPDATE public.system_config SET country_configs=jsonb_set(coalesce(country_configs,'{}'),'{ET}',
 coalesce(country_configs->'ET','{}')||'{"enableLoyalty":true,"loyaltyPointsRate":100}');
END $$;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000095',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000095","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE payload jsonb; items jsonb; saved jsonb; replay jsonb; rejected uuid:=gen_random_uuid(); blocked boolean:=false; BEGIN
 payload:=jsonb_build_object('id',current_setting('test.loyalty.sale'),'customer_id',current_setting('test.loyalty.customer'),
 'site_id','c1111111-1111-4000-8000-000000000112','payment_method','Cash','amount_tendered',1000000,'type','In-Store','points_redeemed',3);
 items:='[{"product_id":"0bfe7446-613b-42c3-8f66-5a1d80ae1d0e","quantity":1}]';
 saved:=public.create_pos_sale_atomic(payload,items);
 replay:=public.create_pos_sale_atomic(payload,items);
 ASSERT saved->>'id'=replay->>'id';
 BEGIN PERFORM public.create_pos_sale_atomic(payload||jsonb_build_object('id',rejected,'points_redeemed',100000),items);
 EXCEPTION WHEN raise_exception THEN IF SQLERRM='Insufficient or unavailable customer points' THEN blocked:=true; ELSE RAISE; END IF; END;
 ASSERT blocked,'Insufficient redemption was accepted';
 ASSERT NOT EXISTS(SELECT 1 FROM public.sales WHERE id=rejected),'Failed customer posting left a sale behind';
 ASSERT (SELECT stock FROM public.products WHERE id='0bfe7446-613b-42c3-8f66-5a1d80ae1d0e')=current_setting('test.loyalty.stock')::numeric-1;
END $$;
RESET ROLE;
DO $$ DECLARE sale public.sales%ROWTYPE; customer public.customers%ROWTYPE; BEGIN
 SELECT * INTO sale FROM public.sales WHERE id=current_setting('test.loyalty.sale')::uuid;
 SELECT * INTO customer FROM public.customers WHERE id=current_setting('test.loyalty.customer')::uuid;
 ASSERT customer.total_spent=sale.total,'Retry duplicated spending';
 ASSERT customer.loyalty_points=100+floor(sale.subtotal/100)::integer-3,'Retry duplicated earned/redeemed points';
 ASSERT (SELECT count(*) FROM private.sale_customer_posts WHERE sale_id=sale.id)=1;
 ASSERT NOT has_function_privilege('authenticated','public.pos_decrement_stock(uuid,numeric,text,text,text,text,timestamptz)','EXECUTE');
 ASSERT NOT has_function_privilege('anon','public.accept_verified_transfer(uuid)','EXECUTE');
END $$;
ROLLBACK;
SELECT 'PASS: valid sale, stock deduction and customer posting remain atomic and idempotent' AS result;
