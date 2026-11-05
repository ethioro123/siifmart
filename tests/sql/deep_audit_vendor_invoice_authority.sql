-- Deep audit reproduction; every invoice and line is rolled back.
BEGIN;
SET LOCAL statement_timeout='5s';
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000072',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000072","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE invoice uuid:=gen_random_uuid(); blocked boolean:=false; BEGIN
 BEGIN
 INSERT INTO public.vendor_invoices(id,invoice_number,vendor_id,vendor_name,po_id,site_id,country_code,due_date,
 subtotal,total_amount,currency,status,match_status,created_by_id,approved_by_id,approved_at)
 VALUES(invoice,'AUDIT-'||invoice,'AUDIT-VENDOR','Audit supplier','62b3caff-b285-4e9b-a431-17e1df9165fb',
 'c1111111-1111-4000-8000-000000000110','ET',current_date,10000,10000,'ETB','Approved','Matched',auth.uid(),auth.uid(),now());
 EXCEPTION WHEN raise_exception THEN blocked:=true; END;
 ASSERT blocked,'Self-approved fabricated invoice accepted';
END $$;
ROLLBACK;
SELECT 'PASS: invoice maker cannot insert a self-approved fabricated match; rolled back' AS result;
