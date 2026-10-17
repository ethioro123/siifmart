-- Staging schema snapshot, part 06 of 16.
SET search_path = public, extensions, auth;
SET check_function_bodies = off;
CREATE INDEX idx_pos_overrides_type ON public.pos_supervisory_overrides USING btree (override_type);
CREATE INDEX idx_pricing_rules_country_active ON public.pricing_rules USING btree (country_code, is_active);
CREATE INDEX idx_product_master_country_status ON public.product_master USING btree (country_code, status);
CREATE INDEX idx_product_master_merged_into ON public.product_master USING btree (merged_into_id);
CREATE INDEX idx_product_master_origin_region ON public.product_master USING btree (origin_region_code);
CREATE UNIQUE INDEX product_master_country_barcode_unique ON public.product_master USING btree (country_code, barcode) WHERE ((barcode IS NOT NULL) AND (barcode <> ''::text) AND (status <> 'MERGED'::text));
CREATE INDEX idx_products_approval_status ON public.products USING btree (approval_status);
CREATE INDEX idx_products_barcode ON public.products USING btree (barcode);
CREATE INDEX idx_products_barcodes_gin ON public.products USING gin (barcodes);
CREATE INDEX idx_products_category ON public.products USING btree (category);
CREATE INDEX idx_products_master_id ON public.products USING btree (master_id);
CREATE INDEX idx_products_name_trgm ON public.products USING gin (name gin_trgm_ops);
CREATE INDEX idx_products_product_id ON public.products USING btree (product_id);
CREATE INDEX idx_products_site_category ON public.products USING btree (site_id, category);
CREATE INDEX idx_products_site_id ON public.products USING btree (site_id);
CREATE INDEX idx_products_site_status ON public.products USING btree (site_id, status);
CREATE INDEX idx_products_sku ON public.products USING btree (sku);
CREATE INDEX idx_products_sku_site ON public.products USING btree (sku, site_id);
CREATE INDEX idx_products_sku_trgm ON public.products USING gin (sku gin_trgm_ops);
CREATE INDEX idx_products_status ON public.products USING btree (status);
CREATE INDEX idx_products_zone_id ON public.products USING btree (zone_id);
CREATE INDEX idx_po_approved_at ON public.purchase_orders USING btree (approved_at);
CREATE INDEX idx_po_site_id ON public.purchase_orders USING btree (site_id);
CREATE INDEX idx_po_status ON public.purchase_orders USING btree (status);
CREATE INDEX idx_po_supplier_id ON public.purchase_orders USING btree (supplier_id);
CREATE INDEX idx_purchase_orders_country_code ON public.purchase_orders USING btree (country_code);
CREATE INDEX idx_purchase_orders_country_status_created ON public.purchase_orders USING btree (country_code, status, created_at DESC);
CREATE INDEX idx_purchase_orders_created_by ON public.purchase_orders USING btree (created_by);
CREATE INDEX idx_purchase_orders_po_number ON public.purchase_orders USING btree (po_number);
CREATE INDEX idx_purchase_orders_region_code ON public.purchase_orders USING btree (region_code);
CREATE INDEX idx_purchase_orders_region_status ON public.purchase_orders USING btree (region_code, status);
CREATE INDEX idx_purchase_orders_requested_by ON public.purchase_orders USING btree (requested_by);
CREATE INDEX idx_purchase_orders_requires_hq ON public.purchase_orders USING btree (requires_hq_approval) WHERE (requires_hq_approval = true);
CREATE INDEX idx_purchase_orders_site_country ON public.purchase_orders USING btree (country_code, site_id);
CREATE INDEX idx_ratings_from_user_id ON public.ratings USING btree (from_user_id);
CREATE INDEX idx_ratings_to_user_id ON public.ratings USING btree (to_user_id);
CREATE INDEX idx_ratings_trip_id ON public.ratings USING btree (trip_id);
CREATE INDEX idx_delegation_rules_region ON public.regional_delegation_rules USING btree (region_code);
CREATE INDEX idx_regions_admin_hub_site_id ON public.regions USING btree (admin_hub_site_id);
CREATE INDEX idx_regions_country ON public.regions USING btree (country);
CREATE INDEX idx_regions_default_currency ON public.regions USING btree (default_currency);
CREATE INDEX idx_regions_default_language ON public.regions USING btree (default_language);
CREATE INDEX idx_regions_regional_manager_id ON public.regions USING btree (regional_manager_id);
CREATE INDEX idx_salary_requests_country ON public.salary_requests USING btree (country_code);
CREATE INDEX idx_salary_requests_employee ON public.salary_requests USING btree (employee_id);
CREATE INDEX idx_salary_requests_site ON public.salary_requests USING btree (site_id);
CREATE INDEX idx_salary_requests_status ON public.salary_requests USING btree (status);
CREATE INDEX idx_sale_items_product_id ON public.sale_items USING btree (product_id);
CREATE INDEX idx_sale_items_sale_id ON public.sale_items USING btree (sale_id);
CREATE INDEX idx_sales_country_code ON public.sales USING btree (country_code);
CREATE INDEX idx_sales_country_date ON public.sales USING btree (country_code, sale_date DESC);
CREATE INDEX idx_sales_country_site ON public.sales USING btree (country_code, site_id);
CREATE INDEX idx_sales_country_status_date ON public.sales USING btree (country_code, status, sale_date DESC);
CREATE INDEX idx_sales_customer_id ON public.sales USING btree (customer_id);
CREATE INDEX idx_sales_date ON public.sales USING btree (sale_date);
CREATE INDEX idx_sales_site_id ON public.sales USING btree (site_id);
CREATE INDEX idx_sales_status ON public.sales USING btree (status);
CREATE INDEX idx_shifts_cashier_code_status ON public.shifts USING btree (cashier_code, status);
CREATE INDEX idx_shifts_cashier_id ON public.shifts USING btree (cashier_id);
CREATE INDEX idx_shifts_cashier_status ON public.shifts USING btree (cashier_id, status);
CREATE INDEX idx_shifts_country ON public.shifts USING btree (country_code);
CREATE INDEX idx_shifts_country_site ON public.shifts USING btree (country_code, site_id);
CREATE INDEX idx_shifts_finance_sign_off_by ON public.shifts USING btree (finance_sign_off_by);
CREATE INDEX idx_shifts_reconciliation ON public.shifts USING btree (reconciliation_status, variance_flagged);
CREATE INDEX idx_shifts_reconciliation_status ON public.shifts USING btree (reconciliation_status);
CREATE INDEX idx_shifts_site_counter_status ON public.shifts USING btree (site_id, counter_number, status);
CREATE INDEX idx_shifts_site_id ON public.shifts USING btree (site_id);
CREATE INDEX idx_shifts_site_status ON public.shifts USING btree (site_id, status);
CREATE INDEX idx_shifts_start_time ON public.shifts USING btree (start_time DESC);
CREATE INDEX idx_shifts_status ON public.shifts USING btree (status);
CREATE INDEX idx_shifts_supervisor_id ON public.shifts USING btree (supervisor_id);
CREATE INDEX idx_site_replenishment_sources_source_site_id ON public.site_replenishment_sources USING btree (source_site_id);
CREATE INDEX idx_sites_country ON public.sites USING btree (country);
CREATE INDEX idx_sites_country_code ON public.sites USING btree (country, code);
CREATE INDEX idx_sites_country_type ON public.sites USING btree (country, type);
CREATE INDEX idx_sites_logistics_zone_id ON public.sites USING btree (logistics_zone_id);
CREATE INDEX idx_sites_region_code ON public.sites USING btree (region_code);
CREATE INDEX idx_sites_replenishment_source ON public.sites USING btree (replenishment_source_id) WHERE (replenishment_source_id IS NOT NULL);
CREATE INDEX idx_sites_tax_jurisdiction ON public.sites USING btree (tax_jurisdiction_id);
CREATE INDEX idx_staff_schedules_country_date ON public.staff_schedules USING btree (country_code, date);
CREATE INDEX idx_staff_schedules_employee ON public.staff_schedules USING btree (employee_id);
CREATE INDEX idx_staff_schedules_region_date ON public.staff_schedules USING btree (region_code, date);
CREATE INDEX idx_staff_schedules_site_date ON public.staff_schedules USING btree (site_id, date);
CREATE INDEX idx_movements_date ON public.stock_movements USING btree (movement_date);
CREATE INDEX idx_movements_product_id ON public.stock_movements USING btree (product_id);
CREATE INDEX idx_movements_site_id ON public.stock_movements USING btree (site_id);
CREATE INDEX idx_stock_movements_product_created ON public.stock_movements USING btree (product_id, created_at DESC);
CREATE INDEX idx_stock_movements_site_created ON public.stock_movements USING btree (site_id, created_at DESC);
CREATE INDEX idx_store_audits_auditor ON public.store_operations_audits USING btree (auditor_id);
CREATE INDEX idx_store_audits_country ON public.store_operations_audits USING btree (country_code);
CREATE INDEX idx_store_audits_created ON public.store_operations_audits USING btree (created_at DESC);
CREATE INDEX idx_store_audits_site ON public.store_operations_audits USING btree (site_id);
CREATE INDEX idx_store_audits_status ON public.store_operations_audits USING btree (status);
CREATE INDEX idx_store_points_site ON public.store_points USING btree (site_id);
CREATE INDEX idx_suppliers_country_code ON public.suppliers USING btree (country_code);
CREATE INDEX idx_suppliers_name_lower ON public.suppliers USING btree (lower((name)::text));
CREATE INDEX idx_suppliers_status ON public.suppliers USING btree (status);
CREATE INDEX idx_suppliers_tax_id ON public.suppliers USING btree (tax_id);
CREATE INDEX idx_logs_created_at ON public.system_logs USING btree (created_at);
CREATE INDEX idx_logs_module ON public.system_logs USING btree (module);
CREATE INDEX idx_system_logs_created_at_desc ON public.system_logs USING btree (created_at DESC);
CREATE INDEX idx_tender_reconciliations_reconciled_by_id ON public.tender_reconciliations USING btree (reconciled_by_id);
CREATE INDEX idx_training_country ON public.training_records USING btree (country_code);
CREATE INDEX idx_training_emp ON public.training_records USING btree (employee_id);
CREATE INDEX idx_transactions_currency_code ON public.transactions USING btree (currency_code);
CREATE INDEX idx_transactions_wallet_created_at ON public.transactions USING btree (wallet_id, created_at DESC);
CREATE INDEX idx_transfers_country ON public.transfers USING btree (country_code);
CREATE INDEX idx_transfers_dest ON public.transfers USING btree (dest_site_id);
CREATE INDEX idx_transfers_dest_region ON public.transfers USING btree (dest_region_code);
CREATE INDEX idx_transfers_discrepancy ON public.transfers USING btree (has_discrepancy) WHERE (has_discrepancy = true);
CREATE INDEX idx_transfers_inter_region ON public.transfers USING btree (is_inter_region);
CREATE INDEX idx_transfers_source ON public.transfers USING btree (source_site_id);
CREATE INDEX idx_transfers_source_dest_region ON public.transfers USING btree (source_region_code, dest_region_code);
CREATE INDEX idx_transfers_source_region ON public.transfers USING btree (source_region_code);
CREATE INDEX idx_transfers_status ON public.transfers USING btree (status);
CREATE INDEX idx_trips_driver_id ON public.trips USING btree (driver_id);
CREATE INDEX idx_trips_region_requested_at ON public.trips USING btree (region_code, requested_at DESC);
CREATE INDEX idx_trips_rider_id ON public.trips USING btree (rider_id);
CREATE INDEX idx_users_default_language ON public.users USING btree (default_language);
CREATE INDEX idx_users_region_code ON public.users USING btree (region_code);
CREATE INDEX idx_vendor_contracts_country ON public.vendor_contracts USING btree (country_code);
CREATE INDEX idx_vendor_contracts_supplier ON public.vendor_contracts USING btree (supplier_id);
CREATE INDEX idx_vendor_invoices_approved_by_id ON public.vendor_invoices USING btree (approved_by_id);
CREATE INDEX idx_vendor_invoices_created_by_id ON public.vendor_invoices USING btree (created_by_id);
CREATE INDEX idx_vendor_scorecards_country ON public.vendor_scorecards USING btree (country_code);
CREATE INDEX idx_vendor_scorecards_supplier ON public.vendor_scorecards USING btree (supplier_id);
CREATE INDEX idx_wallet_entries_wallet_time ON public.wallet_ledger_entries USING btree (wallet_id, occurred_at DESC);
CREATE INDEX idx_wallets_currency_code ON public.wallets USING btree (currency_code);
CREATE INDEX idx_warehouse_zones_locked_by ON public.warehouse_zones USING btree (locked_by);
CREATE INDEX idx_warehouse_zones_site_id ON public.warehouse_zones USING btree (site_id);
CREATE INDEX idx_wms_job_items_job_id ON public.wms_job_items USING btree (job_id);
CREATE INDEX idx_wms_jobs_assigned_to ON public.wms_jobs USING btree (assigned_to);
CREATE INDEX idx_wms_jobs_country_code ON public.wms_jobs USING btree (country_code);
CREATE INDEX idx_wms_jobs_country_site ON public.wms_jobs USING btree (country_code, site_id);
CREATE INDEX idx_wms_jobs_country_status ON public.wms_jobs USING btree (country_code, status);
CREATE INDEX idx_wms_jobs_dest_site ON public.wms_jobs USING btree (dest_site_id);
CREATE INDEX idx_wms_jobs_discrepancy ON public.wms_jobs USING btree (has_discrepancy) WHERE (has_discrepancy = true);
CREATE INDEX idx_wms_jobs_site_id ON public.wms_jobs USING btree (site_id);
CREATE INDEX idx_wms_jobs_source_site ON public.wms_jobs USING btree (source_site_id);
CREATE INDEX idx_wms_jobs_status ON public.wms_jobs USING btree (status);
CREATE INDEX idx_wms_jobs_tracking_number ON public.wms_jobs USING btree (tracking_number) WHERE (tracking_number IS NOT NULL);
CREATE INDEX idx_worker_points_employee ON public.worker_points USING btree (employee_id);
CREATE INDEX idx_worker_points_site ON public.worker_points USING btree (site_id);
CREATE INDEX idx_worker_points_total ON public.worker_points USING btree (total_points DESC);
ALTER SEQUENCE public."wallet_ledger_entries_id_seq" OWNED BY public."wallet_ledger_entries"."id";
CREATE OR REPLACE FUNCTION public.apply_transaction_settlement(p_transaction_id uuid, p_status text, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id uuid, status text, wallet_id uuid, type text, amount_cents bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
    txn record;
    current_metadata jsonb;
begin
    select id, wallet_id, type, amount_cents, metadata
    into txn
    from public.transactions
    where id = p_transaction_id
    for update;

    if not found then
        raise exception 'transaction % not found', p_transaction_id;
    end if;

    current_metadata := coalesce(txn.metadata, '{}'::jsonb) || jsonb_build_object(
        'webhook_log',
        jsonb_build_object(
            extract(epoch from now())::text,
            jsonb_build_object(
                'status', p_status,
                'metadata', coalesce(p_metadata, '{}'::jsonb)
            )
        )
    );

    update public.transactions
    set status = p_status,
        metadata = current_metadata,
        updated_at = now()
    where id = p_transaction_id;

    if p_status = 'completed' and txn.type = 'topup' and txn.wallet_id is not null then
        update public.wallets
        set balance_cents = balance_cents + txn.amount_cents,
            updated_at = now()
        where id = txn.wallet_id;

        insert into public.wallet_ledger_entries (
            wallet_id,
            amount_cents,
            direction,
            transaction_type,
            reference_id,
            reference_type,
            description,
            status,
            metadata
        ) values (
            txn.wallet_id,
            txn.amount_cents,
            'credit',
            'topup',
            txn.id,
            'transactions',
            'Wallet top-up confirmed',
            'posted',
            jsonb_build_object('source', 'payments_webhook')
        );
    end if;

    return query
    select id, status, wallet_id, type, amount_cents
    from public.transactions
    where id = p_transaction_id;
end;
$function$;
CREATE OR REPLACE FUNCTION public.approve_expense(p_expense_id uuid, p_approver_id text, p_approver_name text, p_approver_role text, p_notes text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_expense RECORD;
    v_region_code TEXT;
    v_autonomous_limit NUMERIC := 25000.00;
    v_is_ceo BOOLEAN := false;
    v_is_regional BOOLEAN := false;
BEGIN
    SELECT * INTO v_expense FROM public.expenses WHERE id = p_expense_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Expense % not found', p_expense_id;
    END IF;

    IF v_expense.status != 'Pending' THEN
        RAISE EXCEPTION 'Expense cannot be approved from current status "%"', v_expense.status;
    END IF;

    IF p_approver_role NOT IN ('super_admin', 'CEO', 'ceo') AND (
        (v_expense.created_by_id IS NOT NULL AND v_expense.created_by_id = p_approver_id)
        OR (v_expense.created_by_name IS NOT NULL AND LOWER(TRIM(v_expense.created_by_name)) = LOWER(TRIM(p_approver_name)))
    ) THEN
        RAISE EXCEPTION 'Maker-Checker Violation: Expense creator cannot approve their own expense (4-Eyes Principle).';
    END IF;

    v_is_ceo := p_approver_role IN ('super_admin', 'CEO', 'ceo');
    IF v_expense.escalated_to_ceo IS TRUE AND NOT v_is_ceo THEN
        RAISE EXCEPTION 'Executive Authorization Required: This expense exceeds the sovereign threshold and requires CEO approval.';
    END IF;

    v_region_code := v_expense.region_code;
    IF v_region_code IS NULL AND v_expense.site_id IS NOT NULL THEN
        SELECT s.region_code INTO v_region_code FROM public.sites s WHERE s.id = v_expense.site_id;
    END IF;

    IF v_region_code IS NOT NULL THEN
        SELECT COALESCE(r.autonomous_expense_limit, 25000.00) INTO v_autonomous_limit
        FROM public.regions r
        WHERE r.code = v_region_code;
    END IF;

    v_is_regional := p_approver_role IN ('regional_manager', 'regional_finance_officer');
    IF v_is_regional AND NOT v_is_ceo AND p_approver_role NOT IN ('finance_manager', 'cfo') THEN
        IF COALESCE(v_expense.amount, 0) > v_autonomous_limit THEN
            RAISE EXCEPTION 'Autonomous Cap Exceeded: Expense amount (% %) exceeds region % autonomous limit of % %. Requires National HQ sign-off.',
                v_expense.country_code, v_expense.amount, COALESCE(v_region_code, 'territory'), v_expense.country_code, v_autonomous_limit;
        END IF;
    END IF;

    UPDATE public.expenses
    SET status = 'Approved',
        approved_by = p_approver_name,
        approved_by_name = p_approver_name,
        approved_by_id = p_approver_id,
        approved_at = NOW(),
        hq_approved_by = CASE WHEN v_is_ceo THEN p_approver_name ELSE v_expense.hq_approved_by END,
        hq_approved_at = CASE WHEN v_is_ceo THEN NOW() ELSE v_expense.hq_approved_at END,
        requires_hq_approval = false,
        updated_at = NOW()
    WHERE id = p_expense_id;

    INSERT INTO public.system_logs (
        user_name,
        action,
        module,
        details,
        site_id,
        country_code,
        entity_type,
        entity_id,
        performed_by
    ) VALUES (
        p_approver_name,
        'EXPENSE_APPROVED',
        'Financials',
        json_build_object(
            'expense_id', p_expense_id,
            'amount', v_expense.amount,
            'category', v_expense.category,
            'description', v_expense.description,
            'approver_role', p_approver_role,
            'is_ceo_escalation', v_expense.escalated_to_ceo,
            'region_code', v_region_code,
            'notes', p_notes
        )::text,
        v_expense.site_id,
        v_expense.country_code,
        'expenses',
        p_expense_id::text,
        p_approver_id
    );

    RETURN json_build_object(
        'success', true,
        'expense_id', p_expense_id,
        'status', 'Approved',
        'approved_by', p_approver_name,
        'approved_at', NOW()
    );
END;
$function$;
SET check_function_bodies = on;
RESET search_path;
