-- Staging fixtures; all test writes roll back.
BEGIN;
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000105","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE r jsonb;
BEGIN
 r:=public.open_counter_shift('c1111111-1111-4000-8000-000000000113','Counter 4',100,'f1000000-0000-4000-8000-000000000001');
 IF r->>'cashier_id'<>'e1000000-0000-4000-8000-000000000105' THEN RAISE EXCEPTION 'Wrong cashier'; END IF;
 IF NOT (public.counter_shift_summary('f1000000-0000-4000-8000-000000000001')->>'blind')::boolean THEN RAISE EXCEPTION 'Blind balance exposed'; END IF;
 BEGIN
 UPDATE public.shifts SET expected_cash=0 WHERE id='f1000000-0000-4000-8000-000000000001';
 RAISE EXCEPTION 'Direct financial edit allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
 PERFORM public.open_counter_shift('c1111111-1111-4000-8000-000000000113','Counter 3',100,'f1000000-0000-4000-8000-000000000002');
 RAISE EXCEPTION 'Second cashier drawer allowed';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'SHIFT_CASHIER_ALREADY_OPEN' THEN RAISE; END IF; END;
 BEGIN
 PERFORM public.submit_counter_count('f1000000-0000-4000-8000-000000000001','{"100":-1}','test');
 RAISE EXCEPTION 'Negative count accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Invalid denomination count' THEN RAISE; END IF; END;
END $$;
-- Seed more than the old 25-receipt cache limit under the authenticated cashier claims.
RESET ROLE;
INSERT INTO public.sales(id,site_id,country_code,currency,sale_date,subtotal,tax,total,payment_method,status,fulfillment_status,cashier_name)
SELECT gen_random_uuid(),'c1111111-1111-4000-8000-000000000113','ET','ETB',clock_timestamp(),10,0,10,'Cash','Completed','Delivered','Client supplied' FROM generate_series(1,30);
SET LOCAL ROLE authenticated;
SELECT public.request_counter_drop('f1000000-0000-4000-8000-000000000001',30,'TEST-BAG','Regression test','f2000000-0000-4000-8000-000000000001');
DO $$ BEGIN
 BEGIN
 PERFORM public.approve_counter_drop('f2000000-0000-4000-8000-000000000001');
 RAISE EXCEPTION 'Self approval allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000104","role":"authenticated"}',true);
SELECT public.approve_counter_drop('f2000000-0000-4000-8000-000000000001');
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000102","role":"authenticated"}',true);
SELECT public.transfer_counter_safe_bags(ARRAY['f2000000-0000-4000-8000-000000000001']::uuid[],'REGRESSION-BANK-MANIFEST');
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000105","role":"authenticated"}',true);
DO $$
DECLARE r jsonb;
BEGIN
 r:=public.submit_counter_count('f1000000-0000-4000-8000-000000000001','{"100":3,"50":1,"20":1}','All cash counted');
 IF (r->>'expected_cash')::numeric<>370 OR (r->>'actual_cash')::numeric<>370 THEN RAISE EXCEPTION 'Totals did not include 30 sales minus confirmed drop'; END IF;
 r:=public.submit_counter_count('f1000000-0000-4000-8000-000000000001','{"100":1}','Attempt recount');
 IF (r->>'actual_cash')::numeric<>370 THEN RAISE EXCEPTION 'Locked count overwritten'; END IF;
 BEGIN
 PERFORM public.review_counter_shift('f1000000-0000-4000-8000-000000000001','supervisor','Flagged','Self review');
 RAISE EXCEPTION 'Self review allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000104","role":"authenticated"}',true);
SELECT public.review_counter_shift('f1000000-0000-4000-8000-000000000001','supervisor','Flagged','Count reviewed independently');
DO $$ BEGIN
 BEGIN
 PERFORM public.review_counter_shift('f1000000-0000-4000-8000-000000000001','finance','Reconciled','Attempt Finance review');
 RAISE EXCEPTION 'Supervisor performed Finance approval';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
ROLLBACK;
