-- Audit reproduction only: all inventory/movement changes are rolled back.
BEGIN;
SET LOCAL statement_timeout='5s';
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000088',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000088","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE before_stock numeric; after_stock numeric; BEGIN
 SELECT stock INTO before_stock FROM public.products WHERE id='dd450985-8a61-40c6-a1f6-7fe6723f0858';
 IF before_stock<1 THEN RAISE EXCEPTION 'Audit requires one unit of existing stock'; END IF;
 PERFORM public.pos_decrement_stock('dd450985-8a61-40c6-a1f6-7fe6723f0858',1,'c1111111-1111-4000-8000-000000000110','','AUDIT-NO-SALE-'||gen_random_uuid()::text,'Audit actor',now());
 SELECT stock INTO after_stock FROM public.products WHERE id='dd450985-8a61-40c6-a1f6-7fe6723f0858';
 IF after_stock IS DISTINCT FROM before_stock-1 THEN RAISE EXCEPTION 'Reproduction changed: direct decrement was blocked'; END IF;
 RAISE NOTICE 'CONFIRMED: receiver decremented stock through POS RPC without a sale or approval';
END $$;
ROLLBACK;
