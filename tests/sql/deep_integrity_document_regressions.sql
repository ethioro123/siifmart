-- All fixtures and state changes are rolled back.
BEGIN;
SET LOCAL statement_timeout='8s';
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000072',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000072","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE po public.purchase_orders%ROWTYPE; p public.po_items%ROWTYPE; saved jsonb; inv uuid; bad uuid; blocked boolean:=false; BEGIN
 SELECT * INTO po FROM public.purchase_orders WHERE id='62b3caff-b285-4e9b-a431-17e1df9165fb';
 SELECT * INTO p FROM public.po_items WHERE po_id=po.id LIMIT 1;
 saved:=public.create_vendor_invoice_atomic(jsonb_build_object('invoice_number','AUDIT-'||gen_random_uuid(),'vendor_id',coalesce(po.supplier_id::text,'AUDIT-VENDOR'),'vendor_name',po.supplier_name,
 'po_id',po.id,'site_id',po.site_id,'country_code','ET','currency','ETB','due_date',current_date),
 jsonb_build_array(jsonb_build_object('sku',p.sku,'product_id','dd450985-8a61-40c6-a1f6-7fe6723f0858','item_name',p.product_name,'invoiced_quantity',1,'invoiced_unit_price',p.unit_cost,'tax_rate',0)));
 inv:=(saved#>>'{invoice,id}')::uuid;
 ASSERT saved#>>'{invoice,match_status}'='Matched','Trusted receipt did not match';
 ASSERT (saved#>>'{items,0,po_quantity}')::numeric=p.quantity;
 BEGIN UPDATE public.vendor_invoices SET status='Approved' WHERE id=inv;
 EXCEPTION WHEN insufficient_privilege THEN blocked:=true; END;
 ASSERT blocked,'Maker approved own invoice';
 PERFORM set_config('test.invoice',inv::text,true);
 saved:=public.create_vendor_invoice_atomic(jsonb_build_object('invoice_number','AUDIT-'||gen_random_uuid(),'vendor_id',coalesce(po.supplier_id::text,'AUDIT-VENDOR'),'vendor_name',po.supplier_name,
 'po_id',po.id,'site_id',po.site_id,'country_code','ET','currency','ETB','due_date',current_date),
 jsonb_build_array(jsonb_build_object('sku',p.sku,'product_id','dd450985-8a61-40c6-a1f6-7fe6723f0858','item_name',p.product_name,'invoiced_quantity',10000,'invoiced_unit_price',1,'tax_rate',0,'received_quantity',10000,'po_quantity',10000)));
 ASSERT saved#>>'{invoice,match_status}'='Discrepancy_Quantity','Fabricated receipt snapshots trusted';
 bad:=(saved#>>'{invoice,id}')::uuid;PERFORM set_config('test.badinvoice',bad::text,true);
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000003',true);
SELECT set_config('request.jwt.claims','{"sub":"e1000000-0000-4000-8000-000000000003","role":"authenticated"}',true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE inv uuid:=current_setting('test.invoice')::uuid; bad uuid:=current_setting('test.badinvoice')::uuid; blocked boolean:=false; run jsonb; BEGIN
 BEGIN UPDATE public.vendor_invoices SET status='Approved',match_status='Matched' WHERE id=bad; EXCEPTION WHEN raise_exception THEN blocked:=true; END;
 ASSERT blocked,'Unmatched invoice approved without override';
 UPDATE public.vendor_invoices SET status='Approved' WHERE id=inv;
 ASSERT EXISTS(SELECT 1 FROM public.vendor_invoices WHERE id=inv AND approved_by_id=auth.uid() AND created_by_id<>auth.uid());
 run:=public.create_payment_run_atomic(ARRAY[inv],'ET','ETB','Bank_Transfer');
 ASSERT EXISTS(SELECT 1 FROM public.vendor_invoices WHERE id=inv AND payment_run_id=(run->>'id')::uuid),'Invoice link missing';
 blocked:=false;BEGIN PERFORM public.create_payment_run_atomic(ARRAY[inv],'KE','KES','Bank_Transfer');EXCEPTION WHEN OTHERS THEN blocked:=true;END;
 ASSERT blocked,'Country mismatch accepted';
 blocked:=false;BEGIN PERFORM public.create_payment_run_atomic(ARRAY[inv],'ET','ETB','Bank_Transfer');EXCEPTION WHEN raise_exception THEN blocked:=true;END;
 ASSERT blocked,'Invoice added to second payment run';
END $$;
RESET ROLE;
-- A complete AR aggregate must include all 26 rows, rather than the first list page.
SELECT set_config('request.jwt.claims','{"role":"service_role"}',true);
SELECT set_config('request.jwt.claim.sub','',true);
DO $$ DECLARE before_total numeric; after_total numeric; BEGIN
 PERFORM set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000003',true);
 SELECT (public.ar_aging_totals('ET')->>'totalOutstanding')::numeric INTO before_total;
 PERFORM set_config('request.jwt.claim.sub','',true);
 INSERT INTO public.ar_invoices(customer_id,customer_name,invoice_number,site_id,country_code,total_amount,balance_due,currency,status,due_date)
 SELECT 'AUDIT-CUSTOMER','Audit customer','AUDIT-'||gen_random_uuid(),'c1111111-1111-4000-8000-000000000112','ET',100,100,'ETB','Issued',current_date+30 FROM generate_series(1,26);
 PERFORM set_config('request.jwt.claim.sub','e1000000-0000-4000-8000-000000000003',true);
 SELECT (public.ar_aging_totals('ET')->>'totalOutstanding')::numeric INTO after_total;
 ASSERT after_total-before_total=2600,'AR aggregate omitted invoices';
END $$;
ROLLBACK;
SELECT 'PASS: trusted invoice matching, independent approval, atomic payment membership and complete AR totals; rolled back' result;
