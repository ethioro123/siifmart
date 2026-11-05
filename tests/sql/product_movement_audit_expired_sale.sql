-- Audit reproduction only. Expiry setup, sale, stock and financial rows are rolled back.
BEGIN;
SET LOCAL statement_timeout='5s';
SELECT set_config('request.jwt.claim.sub','',true);
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
UPDATE public.products SET expiry_date=current_date-1
WHERE id='0bfe7446-613b-42c3-8f66-5a1d80ae1d0e';
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000095',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000095","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE result jsonb; BEGIN
 result:=public.create_pos_sale_atomic(jsonb_build_object('id',gen_random_uuid(),'site_id','c1111111-1111-4000-8000-000000000112',
 'payment_method','Cash','amount_tendered',1000000,'type','In-Store'),
 jsonb_build_array(jsonb_build_object('product_id','0bfe7446-613b-42c3-8f66-5a1d80ae1d0e','quantity',1)));
 IF result->>'status' IS DISTINCT FROM 'Completed' THEN RAISE EXCEPTION 'Reproduction changed: expired sale was blocked'; END IF;
END $$;
ROLLBACK;
SELECT 'CONFIRMED: authenticated cashier sold an expired lot through the atomic sale RPC; rollback complete' AS result;
