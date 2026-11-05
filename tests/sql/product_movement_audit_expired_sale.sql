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
DO $$ DECLARE blocked boolean:=false; BEGIN
 BEGIN
  PERFORM public.create_pos_sale_atomic(jsonb_build_object('id',gen_random_uuid(),'site_id','c1111111-1111-4000-8000-000000000112',
   'payment_method','Cash','amount_tendered',1000000,'type','In-Store'),
   jsonb_build_array(jsonb_build_object('product_id','0bfe7446-613b-42c3-8f66-5a1d80ae1d0e','quantity',1)));
 EXCEPTION WHEN raise_exception THEN
  IF SQLERRM='Product is unavailable at the selected site' THEN blocked:=true; ELSE RAISE; END IF;
 END;
 ASSERT blocked,'Expired lot could still be sold';
END $$;
ROLLBACK;
SELECT 'PASS: expired lot sale is rejected inside the atomic sale RPC' AS result;
