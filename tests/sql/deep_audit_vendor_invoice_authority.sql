-- Deep audit reproduction; every invoice and line is rolled back.
BEGIN;
SET LOCAL statement_timeout='5s';
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000072',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000072","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE invoice uuid:=gen_random_uuid(); BEGIN
 INSERT INTO public.vendor_invoices(id,invoice_number,vendor_id,vendor_name,po_id,site_id,country_code,due_date,
 subtotal,total_amount,currency,status,match_status,created_by_id,approved_by_id,approved_at)
 VALUES(invoice,'AUDIT-'||invoice,'AUDIT-VENDOR','Audit supplier','62b3caff-b285-4e9b-a431-17e1df9165fb',
 'c1111111-1111-4000-8000-000000000110','ET',current_date,10000,10000,'ETB','Approved','Matched',auth.uid(),auth.uid(),now());
 INSERT INTO public.invoice_items(invoice_id,product_id,sku,item_name,po_quantity,received_quantity,invoiced_quantity,po_unit_price,invoiced_unit_price,total_price)
 VALUES(invoice,'dd450985-8a61-40c6-a1f6-7fe6723f0858','ETDI001','Audit dishes',10000,10000,10000,1,1,10000);
 ASSERT EXISTS(SELECT 1 FROM public.vendor_invoices WHERE id=invoice AND status='Approved' AND match_status='Matched'
 AND created_by_id=approved_by_id AND override_reason IS NULL AND receiving_record_id IS NULL),
 'Reproduction changed: database rejected self-approved unverified matching';
END $$;
ROLLBACK;
SELECT 'CONFIRMED: authorized finance maker can submit self-approved Matched invoice with fabricated PO/receipt snapshots; rolled back' AS result;
