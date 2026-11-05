-- Audit reproduction only: all inventory/movement changes are rolled back.
BEGIN;
SET LOCAL statement_timeout='5s';
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000088',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000088","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE before_stock numeric; blocked boolean:=false; BEGIN
 SELECT stock INTO before_stock FROM public.products WHERE id='dd450985-8a61-40c6-a1f6-7fe6723f0858';
 BEGIN
  PERFORM public.pos_decrement_stock('dd450985-8a61-40c6-a1f6-7fe6723f0858',1,'c1111111-1111-4000-8000-000000000110','','AUDIT-NO-SALE','Audit actor',now());
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 ASSERT blocked,'Receiver can still bypass a sale or adjustment approval';
 ASSERT (SELECT stock FROM public.products WHERE id='dd450985-8a61-40c6-a1f6-7fe6723f0858')=before_stock;
END $$;
ROLLBACK;
SELECT 'PASS: direct stock writer is denied to a receiver' AS result;
