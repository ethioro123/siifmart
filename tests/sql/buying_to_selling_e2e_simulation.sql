-- Full End-to-End Buying-to-Selling Simulation (Rollback-Only on Live Schema)
-- Covers: PO Creation -> Warehouse Assignment & Blind Receiving -> 3-Way Match AP Invoice & Payment Run
-- -> Inter-Branch Blind Transfer Intake -> Cashier Shift Open -> POS Atomic Sale & Loyalty -> Safe Drop & Blind Close
-- -> Finance Reconciliation -> Cross-Border (KE vs ET) Isolation Verification.
BEGIN;
SET LOCAL statement_timeout = '15s';

-- 0. Seed baseline warehouse product & loyalty customer under service_role for the simulation batch
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);

DO $$
DECLARE
  v_wh_site uuid := 'c1111111-1111-4000-8000-000000000110'; -- Adama Industrial Warehouse (ET)
  v_store_site uuid := 'c1111111-1111-4000-8000-000000000113'; -- Bishoftu Lakefront Supermarket (ET)
  v_template public.products%ROWTYPE;
  v_wh_product uuid := gen_random_uuid();
  v_po_id uuid := gen_random_uuid();
  v_po_item_id uuid;
  v_receive_job uuid := gen_random_uuid();
  v_transfer_job uuid := gen_random_uuid();
  v_customer_id uuid := gen_random_uuid();
  v_shift_id uuid := gen_random_uuid();
  v_drop_id uuid := gen_random_uuid();
  v_sale_id uuid := gen_random_uuid();
  v_batch text := 'BATCH-SIM-' || left(gen_random_uuid()::text, 8);
  v_sku text := 'ET-SIM-OIL-' || left(gen_random_uuid()::text, 6);
BEGIN
  SELECT * INTO STRICT v_template FROM public.products WHERE id = 'dd450985-8a61-40c6-a1f6-7fe6723f0858';

  INSERT INTO public.products
  SELECT (jsonb_populate_record(
    NULL::public.products,
    to_jsonb(v_template) || jsonb_build_object(
      'id', v_wh_product,
      'site_id', v_wh_site,
      'country_code', 'ET',
      'name', 'SIIFMART Halal Sunflower Oil 5L',
      'sku', v_sku,
      'price', 350,
      'cost_price', 250,
      'stock', 0,
      'status', 'active',
      'approval_status', 'approved',
      'batch_number', v_batch,
      'expiry_date', current_date + 180,
      'custom_attributes', jsonb_set(
        v_template.custom_attributes,
        '{packaging}',
        (v_template.custom_attributes->'packaging') || '{"packQty":"1","caseSize":"","packageType":"Bottle","packagingLevel":"unit"}'::jsonb
      )
    )
  )).*;

  INSERT INTO public.customers(id, name, phone, loyalty_points, total_spent)
  VALUES (v_customer_id, 'Sim Customer Bishoftu', 'SIM-' || left(v_customer_id::text, 10), 50, 0);

  UPDATE public.system_config
  SET country_configs = jsonb_set(
    coalesce(country_configs, '{}'::jsonb),
    '{ET}',
    coalesce(country_configs->'ET', '{}'::jsonb) || '{"enableLoyalty":true,"loyaltyPointsRate":100,"taxOnSelling":false,"taxOnPurchasing":false}'::jsonb
  );

  PERFORM set_config('sim.wh_site', v_wh_site::text, true);
  PERFORM set_config('sim.store_site', v_store_site::text, true);
  PERFORM set_config('sim.wh_product', v_wh_product::text, true);
  PERFORM set_config('sim.po_id', v_po_id::text, true);
  PERFORM set_config('sim.receive_job', v_receive_job::text, true);
  PERFORM set_config('sim.transfer_job', v_transfer_job::text, true);
  PERFORM set_config('sim.customer_id', v_customer_id::text, true);
  PERFORM set_config('sim.shift_id', v_shift_id::text, true);
  PERFORM set_config('sim.drop_id', v_drop_id::text, true);
  PERFORM set_config('sim.sale_id', v_sale_id::text, true);
  PERFORM set_config('sim.batch', v_batch, true);
  PERFORM set_config('sim.sku', v_sku, true);
END $$;

-- STAGE 1: BUYING POINT — Create PO Document via RPC as Executive/Procurement
SELECT set_config('request.jwt.claim.sub', '988fb8ef-8053-415b-9032-2aca981058d7', true);
SELECT set_config('request.jwt.claims', '{"sub":"988fb8ef-8053-415b-9032-2aca981058d7","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_po uuid := current_setting('sim.po_id')::uuid;
  v_prod uuid := current_setting('sim.wh_product')::uuid;
  v_sku text := current_setting('sim.sku');
  v_item_id uuid;
BEGIN
  PERFORM public.save_purchase_order_document(
    v_po,
    jsonb_build_object(
      'site_id', current_setting('sim.wh_site'),
      'country_code', 'ET',
      'currency', 'ETB',
      'supplier_id', 'd199c210-acf8-4744-9939-63f93a9b03c2',
      'supplier_name', 'Oromia Grain & Oilseeds Farmers Union',
      'status', 'Pending',
      'total_amount', 5000,
      'items_count', 1
    ),
    jsonb_build_array(
      jsonb_build_object(
        'product_id', v_prod,
        'product_name', 'SIIFMART Halal Sunflower Oil 5L',
        'sku', v_sku,
        'quantity', 20,
        'unit_cost', 250,
        'total_cost', 5000,
        'pack_quantity', 1,
        'case_size', 1,
        'retail_price', 350,
        'custom_attributes', jsonb_build_object(
          'storage', jsonb_build_object('requirementsConfirmed', true, 'isPerishable', false, 'type', 'Ambient')
        )
      )
    ),
    true
  );

  UPDATE public.purchase_orders
  SET status = 'Approved',
      approved_by = 'Dr. Shukri Idriss',
      approver_employee_id = '988fb8ef-8053-415b-9032-2aca981058d7',
      approver_role = 'group_ceo',
      approved_at = now()
  WHERE id = v_po;

  SELECT id INTO STRICT v_item_id FROM public.po_items WHERE po_id = v_po LIMIT 1;
  PERFORM set_config('sim.po_item_id', v_item_id::text, true);
END $$;

-- Seed inbound RECEIVE job for the approved PO
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);

INSERT INTO public.wms_jobs(id, site_id, country_code, type, status, priority, items_count, order_ref, line_items)
VALUES (
  current_setting('sim.receive_job')::uuid,
  current_setting('sim.wh_site')::uuid,
  'ET',
  'RECEIVE',
  'Pending',
  'Normal',
  1,
  current_setting('sim.po_id'),
  '[]'::jsonb
);

-- STAGE 2: WAREHOUSE INBOUND — Manager Assigns Job -> Receiver Performs Blind Count & Finalizes
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000083', true);
SELECT set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000083","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_assign jsonb;
BEGIN
  v_assign := public.assign_warehouse_job_atomic(
    current_setting('sim.receive_job')::uuid,
    'e1000000-0000-4000-8000-000000000088',
    20
  );
  ASSERT v_assign#>>'{assignment,employee_id}' = 'e1000000-0000-4000-8000-000000000088', 'Receiver assignment failed';
END $$;

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000088', true);
SELECT set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000088","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_po uuid := current_setting('sim.po_id')::uuid;
  v_item uuid := current_setting('sim.po_item_id')::uuid;
  v_prod uuid := current_setting('sim.wh_product')::uuid;
  v_sku text := current_setting('sim.sku');
  v_res jsonb;
BEGIN
  PERFORM public.save_receiving_split(
    gen_random_uuid(),
    v_po,
    v_item,
    jsonb_build_array(
      jsonb_build_object(
        'lineItems', jsonb_build_array(
          jsonb_build_object('productId', v_prod, 'sku', v_sku, 'expectedQty', 20, 'condition', 'Good')
        )
      )
    ),
    0
  );
  v_res := public.finalize_receiving_session(v_po);
  ASSERT v_res->>'status' = 'Received', 'PO should transition to Received after full blind count';
  ASSERT (SELECT count(*) FROM public.po_items WHERE id = v_item) = 0, 'Blind receiving must hide po_items quantities from receiver';
END $$;

-- STAGE 3: ACCOUNTS PAYABLE — 3-Way Match Vendor Invoice (Maker) & Payment Run (Approver)
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000072', true);
SELECT set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000072","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_po uuid := current_setting('sim.po_id')::uuid;
  v_prod uuid := current_setting('sim.wh_product')::uuid;
  v_sku text := current_setting('sim.sku');
  v_inv_res jsonb;
  v_inv_id uuid;
BEGIN
  v_inv_res := public.create_vendor_invoice_atomic(
    jsonb_build_object(
      'invoice_number', 'INV-SIM-' || left(v_po::text, 8),
      'vendor_id', 'd199c210-acf8-4744-9939-63f93a9b03c2',
      'vendor_name', 'Oromia Grain & Oilseeds Farmers Union',
      'po_id', v_po,
      'site_id', current_setting('sim.wh_site'),
      'country_code', 'ET',
      'currency', 'ETB',
      'due_date', current_date + 30
    ),
    jsonb_build_array(
      jsonb_build_object(
        'sku', v_sku,
        'product_id', v_prod,
        'item_name', 'SIIFMART Halal Sunflower Oil 5L',
        'invoiced_quantity', 20,
        'invoiced_unit_price', 250,
        'tax_rate', 0
      )
    )
  );
  v_inv_id := (v_inv_res#>>'{invoice,id}')::uuid;
  ASSERT v_inv_res#>>'{invoice,match_status}' = 'Matched', '3-Way Match must succeed for 20 received @ 250 ETB';
  PERFORM set_config('sim.invoice_id', v_inv_id::text, true);
END $$;

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000003', true);
SELECT set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_inv_id uuid := current_setting('sim.invoice_id')::uuid;
  v_run jsonb;
BEGIN
  UPDATE public.vendor_invoices SET status = 'Approved' WHERE id = v_inv_id;
  v_run := public.create_payment_run_atomic(ARRAY[v_inv_id], 'ET', 'ETB', 'Bank_Transfer');
  ASSERT (v_run->>'total_amount')::numeric = 5000, 'Payment run total must equal 5000 ETB';
END $$;

-- STAGE 4: INTER-BRANCH REPLENISHMENT — Warehouse to Bishoftu Supermarket Blind Transfer Intake
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', '', true);
SELECT set_config('request.jwt.claims', '{"role":"service_role"}', true);

DO $$
DECLARE
  v_wh_prod uuid := current_setting('sim.wh_product')::uuid;
  v_wh_site uuid := current_setting('sim.wh_site')::uuid;
  v_store_site uuid := current_setting('sim.store_site')::uuid;
  v_tjob uuid := current_setting('sim.transfer_job')::uuid;
  v_sku text := current_setting('sim.sku');
  v_batch text := current_setting('sim.batch');
  v_lines jsonb;
BEGIN
  -- Set warehouse stock after putaway to 20 and dispatch 12 units to Bishoftu Store
  UPDATE public.products SET stock = 8 WHERE id = v_wh_prod;
  v_lines := jsonb_build_array(
    jsonb_build_object(
      'productId', v_wh_prod,
      'sku', v_sku,
      'name', 'SIIFMART Halal Sunflower Oil 5L',
      'expectedQty', 12,
      'deliveredQty', 12,
      'batchNumber', v_batch,
      'condition', 'Good'
    )
  );
  INSERT INTO public.wms_jobs(
    id, site_id, source_site_id, dest_site_id, country_code,
    type, status, priority, transfer_status, order_ref, job_number, line_items, items_count
  ) VALUES (
    v_tjob, v_wh_site, v_wh_site, v_store_site, 'ET',
    'TRANSFER', 'Pending', 'Normal', 'Delivered', gen_random_uuid()::text,
    'TRF-SIM-' || left(v_tjob::text, 6), private.strip_transfer_quantities(v_lines), 1
  );
  INSERT INTO private.transfer_receipt_manifests(job_id, items, site_id, country_code)
  VALUES (v_tjob, v_lines, v_store_site, 'ET');
END $$;

-- Store Manager at Bishoftu Lakefront Supermarket performs blind count & accepts transfer
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000102', true);
SELECT set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000102","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_tjob uuid := current_setting('sim.transfer_job')::uuid;
  v_wh_prod uuid := current_setting('sim.wh_product')::uuid;
  v_store_site uuid := current_setting('sim.store_site')::uuid;
  v_sku text := current_setting('sim.sku');
  v_accept jsonb;
  v_store_prod uuid;
  v_store_stock numeric;
BEGIN
  PERFORM public.record_transfer_receipt_count(
    v_tjob,
    jsonb_build_array(
      jsonb_build_object('index', 0, 'productId', v_wh_prod, 'receivedQty', 12, 'condition', 'Good')
    )
  );
  v_accept := public.accept_verified_transfer(v_tjob);
  ASSERT v_accept->>'saved' = 'true', 'Store transfer intake must succeed';

  SELECT id, stock INTO STRICT v_store_prod, v_store_stock
  FROM public.products
  WHERE site_id = v_store_site AND sku = v_sku;

  ASSERT v_store_stock = 12, 'Store shelf stock must be 12 after transfer intake';
  PERFORM set_config('sim.store_product', v_store_prod::text, true);
END $$;

-- STAGE 5: SELLING POINT — Cashier Opens Shift, Sells 3 Units on POS, Drops Cash, Blind Closes Shift
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000105', true);
SELECT set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000105","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_store_site uuid := current_setting('sim.store_site')::uuid;
  v_shift_id uuid := current_setting('sim.shift_id')::uuid;
  v_sale_id uuid := current_setting('sim.sale_id')::uuid;
  v_drop_id uuid := current_setting('sim.drop_id')::uuid;
  v_cust_id uuid := current_setting('sim.customer_id')::uuid;
  v_store_prod uuid := current_setting('sim.store_product')::uuid;
  v_shift_res jsonb;
  v_sale_res jsonb;
BEGIN
  -- 5a. Open Counter Shift with 500 ETB opening float
  v_shift_res := public.open_counter_shift(v_store_site, 'Counter 4', 500, v_shift_id);
  ASSERT v_shift_res->>'cashier_id' = 'e1000000-0000-4000-8000-000000000105', 'Shift cashier mismatch';
  ASSERT (public.counter_shift_summary(v_shift_id)->>'blind')::boolean = true, 'Shift summary must be blind during open shift';

  -- 5b. Execute Atomic POS Sale: 3 units @ 350 ETB = 1050 ETB Cash, redeeming 5 loyalty points
  v_sale_res := public.create_pos_sale_atomic(
    jsonb_build_object(
      'id', v_sale_id,
      'site_id', v_store_site,
      'shift_id', v_shift_id,
      'customer_id', v_cust_id,
      'payment_method', 'Cash',
      'amount_tendered', 1050,
      'type', 'In-Store',
      'points_redeemed', 5
    ),
    jsonb_build_array(
      jsonb_build_object('product_id', v_store_prod, 'quantity', 3)
    )
  );
  ASSERT v_sale_res->>'status' = 'Completed', 'POS sale must complete';
  ASSERT (v_sale_res->>'total')::numeric = 1050, 'POS sale total must equal 1050 ETB';
  ASSERT (SELECT stock FROM public.products WHERE id = v_store_prod) = 9, 'Store stock must decrement from 12 to 9';

  -- 5c. Request Safe Cash Drop of 550 ETB
  PERFORM public.request_counter_drop(v_shift_id, 550, 'BAG-SIM-001', 'Mid-shift safe drop', v_drop_id);
END $$;

-- Shift Supervisor approves the safe drop
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000104', true);
SELECT set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000104","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

SELECT public.approve_counter_drop(current_setting('sim.drop_id')::uuid);

-- Store Manager transfers safe drop bag to bank manifest
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000102', true);
SELECT set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000102","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

SELECT public.transfer_counter_safe_bags(ARRAY[current_setting('sim.drop_id')::uuid], 'BANK-MANIFEST-SIM-01');

-- Cashier submits Blind Counter Count: 500 (float) + 1050 (sale) - 550 (drop) = 1000 ETB (5 x 200 ETB notes)
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000105', true);
SELECT set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000105","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

DO $$
DECLARE
  v_count_res jsonb;
BEGIN
  v_count_res := public.submit_counter_count(
    current_setting('sim.shift_id')::uuid,
    '{"200": 5}'::jsonb,
    'End of shift blind count'
  );
  ASSERT (v_count_res->>'expected_cash')::numeric = 1000, 'Expected cash must be 1000 ETB (500 + 1050 - 550)';
  ASSERT (v_count_res->>'actual_cash')::numeric = 1000, 'Actual counted cash must be 1000 ETB';
  ASSERT (v_count_res->>'variance')::numeric = 0, 'Shift cash variance must be 0';
END $$;

-- Shift Supervisor & Country Finance Director perform dual-stage shift review & reconciliation
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000104', true);
SELECT set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000104","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

SELECT public.review_counter_shift(current_setting('sim.shift_id')::uuid, 'supervisor', 'Approved', 'Supervisor verified zero variance');

RESET ROLE;
SELECT set_config('request.jwt.claim.sub', 'e1000000-0000-4000-8000-000000000003', true);
SELECT set_config('request.jwt.claims', '{"sub":"e1000000-0000-4000-8000-000000000003","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

SELECT public.review_counter_shift(current_setting('sim.shift_id')::uuid, 'finance', 'Reconciled', 'Finance reconciled Z-report and safe drop');

-- STAGE 6: MULTI-COUNTRY SOVEREIGNTY — Verify Kenya (KE) User Sees Zero ET Records
RESET ROLE;
SELECT set_config('request.jwt.claim.sub', 'e2000000-0000-4000-8000-000000000028', true);
SELECT set_config('request.jwt.claims', '{"sub":"e2000000-0000-4000-8000-000000000028","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;

DO $$
BEGIN
  ASSERT (SELECT count(*) FROM public.purchase_orders WHERE id = current_setting('sim.po_id')::uuid) = 0, 'KE leaked ET PO';
  ASSERT (SELECT count(*) FROM public.vendor_invoices WHERE id = current_setting('sim.invoice_id')::uuid) = 0, 'KE leaked ET Invoice';
  ASSERT (SELECT count(*) FROM public.wms_jobs WHERE id IN (current_setting('sim.receive_job')::uuid, current_setting('sim.transfer_job')::uuid)) = 0, 'KE leaked ET WMS Jobs';
  ASSERT (SELECT count(*) FROM public.products WHERE id IN (current_setting('sim.wh_product')::uuid, current_setting('sim.store_product')::uuid)) = 0, 'KE leaked ET Products';
  ASSERT (SELECT count(*) FROM public.sales WHERE id = current_setting('sim.sale_id')::uuid) = 0, 'KE leaked ET Sale';
  ASSERT (SELECT count(*) FROM public.shifts WHERE id = current_setting('sim.shift_id')::uuid) = 0, 'KE leaked ET Shift';
END $$;

RESET ROLE;
SELECT jsonb_build_object(
  'status', 'PASS',
  'sku', current_setting('sim.sku'),
  'po_ordered_qty', 20,
  'warehouse_received_qty', (SELECT received_qty FROM public.po_items WHERE id = current_setting('sim.po_item_id')::uuid),
  'vendor_invoice_match', (SELECT match_status FROM public.vendor_invoices WHERE id = current_setting('sim.invoice_id')::uuid),
  'vendor_invoice_status', (SELECT status FROM public.vendor_invoices WHERE id = current_setting('sim.invoice_id')::uuid),
  'store_transferred_qty', 12,
  'pos_sold_qty', 3,
  'store_remaining_stock', (SELECT stock FROM public.products WHERE id = current_setting('sim.store_product')::uuid),
  'customer_total_spent', (SELECT total_spent FROM public.customers WHERE id = current_setting('sim.customer_id')::uuid),
  'customer_loyalty_points', (SELECT loyalty_points FROM public.customers WHERE id = current_setting('sim.customer_id')::uuid),
  'shift_expected_cash', (SELECT expected_cash FROM public.shifts WHERE id = current_setting('sim.shift_id')::uuid),
  'shift_actual_cash', (SELECT actual_cash FROM public.shifts WHERE id = current_setting('sim.shift_id')::uuid),
  'shift_reconciliation_status', (SELECT reconciliation_status FROM public.shifts WHERE id = current_setting('sim.shift_id')::uuid),
  'kenya_border_leak_count', 0
) AS simulation_summary;

ROLLBACK;
