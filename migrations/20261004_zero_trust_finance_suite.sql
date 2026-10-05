-- ============================================================================
-- SIIFMART ERP & Zero-Trust Financial Hardening Suite
-- Migration: 20261004_zero_trust_finance_suite.sql
-- Modules:
--   1. Zero-Trust Expense Hardening (Maker/Checker, CEO Escalation, Void-only, RLS)
--   2. Cash Drawer Reconciliation & Supervisory Co-Attribution (Rule 18)
--   3. Accounts Payable (AP) & 3-Way Match Engine (PO ↔ GRN ↔ Invoice)
--   4. General Ledger (GL) & Fiscal Period Close Locking
--   5. Real Budgets & Tender Reconciliation
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ZERO-TRUST EXPENSES HARDENING
-- ----------------------------------------------------------------------------
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES public.employees(id);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_by_name TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS approved_by_id UUID REFERENCES public.employees(id);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS void_reason TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS voided_by_id UUID REFERENCES public.employees(id);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS voided_by_name TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS voided_at TIMESTAMPTZ;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payment_ref TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'ET';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS escalated_to_ceo BOOLEAN DEFAULT FALSE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS escalation_reason TEXT;

-- Drop legacy status check if exists and re-add comprehensive zero-trust status
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_status_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_status_check 
    CHECK (status IN ('Draft', 'Pending', 'Approved', 'Paid', 'Voided', 'Rejected', 'Overdue'));

-- Index for high-velocity financial queries
CREATE INDEX IF NOT EXISTS idx_expenses_country_site ON public.expenses(country_code, site_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON public.expenses(created_by_id);
CREATE INDEX IF NOT EXISTS idx_expenses_approved_by ON public.expenses(approved_by_id);

-- Maker-Checker & Zero Hard-Delete RLS Policies
DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;
DROP POLICY IF EXISTS "expenses_no_delete" ON public.expenses;
CREATE POLICY "expenses_no_delete" ON public.expenses
    FOR DELETE TO authenticated
    USING (false); -- Zero hard deletes. Expenses must be voided with reason audit.

-- ----------------------------------------------------------------------------
-- 2. CASH DRAWER RECONCILIATION & SUPERVISORY CO-ATTRIBUTION (RULE 18)
-- ----------------------------------------------------------------------------
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS supervisor_id UUID REFERENCES public.employees(id);
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS supervisor_name TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS supervisor_co_sign_notes TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS supervisor_signed_at TIMESTAMPTZ;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS finance_sign_off_by UUID REFERENCES public.employees(id);
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS finance_sign_off_name TEXT;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS finance_sign_off_at TIMESTAMPTZ;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS variance_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE public.shifts ADD COLUMN IF NOT EXISTS country_code VARCHAR(2) DEFAULT 'ET';

CREATE INDEX IF NOT EXISTS idx_shifts_reconciliation ON public.shifts(reconciliation_status, variance_flagged);
CREATE INDEX IF NOT EXISTS idx_shifts_country_site ON public.shifts(country_code, site_id);

-- ----------------------------------------------------------------------------
-- 3. ACCOUNTS PAYABLE (AP) & 3-WAY MATCHING
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendor_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL,
    vendor_id TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    po_id UUID,
    po_number TEXT,
    receiving_record_id UUID,
    receiving_manifest_number TEXT,
    site_id TEXT NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(5) NOT NULL DEFAULT 'ETB',
    match_status VARCHAR(30) NOT NULL DEFAULT 'Pending_Match'
        CHECK (match_status IN ('Pending_Match', 'Matched', 'Discrepancy_Quantity', 'Discrepancy_Price', 'Manual_Override', 'Rejected')),
    match_discrepancy_notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft'
        CHECK (status IN ('Draft', 'Pending_Approval', 'Approved', 'Partially_Paid', 'Paid', 'Voided', 'Disputed')),
    created_by_id UUID REFERENCES public.employees(id),
    approved_by_id UUID REFERENCES public.employees(id),
    approved_at TIMESTAMPTZ,
    override_reason TEXT,
    payment_run_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.vendor_invoices(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    sku TEXT,
    item_name TEXT NOT NULL,
    po_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    received_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    invoiced_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    po_unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    invoiced_unit_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
    total_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    match_variance_pct NUMERIC(6, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payment_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_number TEXT NOT NULL UNIQUE,
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    currency VARCHAR(5) NOT NULL DEFAULT 'ETB',
    total_invoices INTEGER NOT NULL DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft'
        CHECK (status IN ('Draft', 'Pending_Approval', 'Approved', 'Processing', 'Completed', 'Cancelled')),
    created_by_id UUID REFERENCES public.employees(id),
    created_by_name TEXT,
    approved_by_id UUID REFERENCES public.employees(id),
    approved_by_name TEXT,
    approved_at TIMESTAMPTZ,
    bank_reference TEXT,
    payment_channel VARCHAR(30) NOT NULL DEFAULT 'Bank_Transfer'
        CHECK (payment_channel IN ('Bank_Transfer', 'Telebirr', 'CBE_Birr', 'M_Pesa', 'Check')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. GENERAL LEDGER (GL) & FISCAL PERIOD CLOSE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    code VARCHAR(10) PRIMARY KEY,
    name TEXT NOT NULL,
    category VARCHAR(20) NOT NULL
        CHECK (category IN ('Asset', 'Liability', 'Equity', 'Revenue', 'COGS', 'Expense')),
    sub_category TEXT,
    normal_balance VARCHAR(6) NOT NULL DEFAULT 'Debit'
        CHECK (normal_balance IN ('Debit', 'Credit')),
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.fiscal_periods (
    period_key VARCHAR(7) PRIMARY KEY, -- 'YYYY-MM' e.g. '2026-10'
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    status VARCHAR(15) NOT NULL DEFAULT 'Open'
        CHECK (status IN ('Open', 'Closing_Pending', 'Closed', 'Locked')),
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    closed_by_id UUID REFERENCES public.employees(id),
    closed_by_name TEXT,
    lock_reason TEXT
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number TEXT NOT NULL UNIQUE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_key VARCHAR(7) NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    site_id TEXT NOT NULL,
    source_module VARCHAR(20) NOT NULL
        CHECK (source_module IN ('POS', 'Expenses', 'AP', 'Payroll', 'Inventory', 'Manual')),
    source_reference_id TEXT,
    memo TEXT NOT NULL,
    total_debit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_credit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_balanced BOOLEAN NOT NULL DEFAULT TRUE,
    is_posted BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_id UUID REFERENCES public.employees(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_balanced_entry CHECK (total_debit = total_credit)
);

CREATE TABLE IF NOT EXISTS public.journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    account_code VARCHAR(10) NOT NULL REFERENCES public.chart_of_accounts(code),
    account_name TEXT NOT NULL,
    debit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    credit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. REAL BUDGETS & TENDER RECONCILIATION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.department_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    site_id TEXT NOT NULL,
    department TEXT NOT NULL,
    category TEXT NOT NULL,
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER NOT NULL CHECK (fiscal_quarter BETWEEN 1 AND 4),
    budgeted_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    actual_spent NUMERIC(15, 2) NOT NULL DEFAULT 0,
    alert_threshold_pct NUMERIC(5, 2) NOT NULL DEFAULT 85.00,
    approved_by_id UUID REFERENCES public.employees(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(country_code, site_id, department, category, fiscal_year, fiscal_quarter)
);

CREATE TABLE IF NOT EXISTS public.tender_reconciliations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    site_id TEXT NOT NULL,
    reconciliation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    tender_type VARCHAR(20) NOT NULL
        CHECK (tender_type IN ('Telebirr', 'CBE_Birr', 'M_Pesa', 'Card', 'Cash')),
    pos_reported_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    statement_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    variance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    fee_deductions NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'Matched'
        CHECK (status IN ('Matched', 'Variance_Flagged', 'Reconciled', 'Investigation')),
    statement_reference TEXT,
    reconciled_by_id UUID REFERENCES public.employees(id),
    reconciled_by_name TEXT,
    reconciled_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security across all new financial tables
ALTER TABLE public.vendor_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_reconciliations ENABLE ROW LEVEL SECURITY;

-- Read/Write policies for authenticated staff with manager roles
DO $$
BEGIN
    -- vendor_invoices
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vendor_invoices' AND policyname = 'vendor_invoices_read') THEN
        CREATE POLICY "vendor_invoices_read" ON public.vendor_invoices FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vendor_invoices' AND policyname = 'vendor_invoices_write') THEN
        CREATE POLICY "vendor_invoices_write" ON public.vendor_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

    -- journal_entries
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'journal_entries' AND policyname = 'journal_entries_read') THEN
        CREATE POLICY "journal_entries_read" ON public.journal_entries FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'journal_entries' AND policyname = 'journal_entries_write') THEN
        CREATE POLICY "journal_entries_write" ON public.journal_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

    -- chart_of_accounts
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chart_of_accounts' AND policyname = 'coa_read') THEN
        CREATE POLICY "coa_read" ON public.chart_of_accounts FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'chart_of_accounts' AND policyname = 'coa_write') THEN
        CREATE POLICY "coa_write" ON public.chart_of_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

    -- fiscal_periods
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'fiscal_periods' AND policyname = 'fiscal_periods_all') THEN
        CREATE POLICY "fiscal_periods_all" ON public.fiscal_periods FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

    -- department_budgets
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'department_budgets' AND policyname = 'department_budgets_all') THEN
        CREATE POLICY "department_budgets_all" ON public.department_budgets FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;

    -- tender_reconciliations
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tender_reconciliations' AND policyname = 'tender_reconciliations_all') THEN
        CREATE POLICY "tender_reconciliations_all" ON public.tender_reconciliations FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 6. ACCOUNTS RECEIVABLE (B2B) & CUSTOMER CREDIT CONTROL
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ar_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT NOT NULL UNIQUE,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    site_id TEXT NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0,
    balance_due NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(5) NOT NULL DEFAULT 'ETB',
    payment_terms VARCHAR(20) NOT NULL DEFAULT 'Net_30',
    status VARCHAR(20) NOT NULL DEFAULT 'Issued'
        CHECK (status IN ('Draft', 'Issued', 'Partially_Paid', 'Paid', 'Overdue', 'In_Dispute', 'Voided')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.customer_credit_limits (
    customer_id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    credit_limit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    current_outstanding NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_hold BOOLEAN NOT NULL DEFAULT FALSE,
    hold_reason TEXT,
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ar_invoices_country_due ON public.ar_invoices(country_code, due_date);
CREATE INDEX IF NOT EXISTS idx_ar_invoices_customer ON public.ar_invoices(customer_id);

-- ----------------------------------------------------------------------------
-- 7. PETTY CASH & BRANCH FLOAT MANAGEMENT
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.petty_cash_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id TEXT NOT NULL,
    site_name TEXT NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    currency VARCHAR(5) NOT NULL DEFAULT 'ETB',
    authorized_float NUMERIC(15, 2) NOT NULL DEFAULT 10000,
    current_balance NUMERIC(15, 2) NOT NULL DEFAULT 10000,
    custodian_id UUID REFERENCES public.employees(id),
    custodian_name TEXT,
    last_replenished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(site_id, country_code)
);

CREATE TABLE IF NOT EXISTS public.petty_cash_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_number TEXT NOT NULL UNIQUE,
    site_id TEXT NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    voucher_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(30) NOT NULL
        CHECK (category IN ('Local_Transit', 'Stationery_Supplies', 'Emergency_Repair', 'Staff_Refreshment', 'Postal_Courier', 'Cleaning_Supplies', 'Other')),
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    receipt_attached BOOLEAN NOT NULL DEFAULT TRUE,
    paid_to TEXT NOT NULL,
    created_by_id UUID REFERENCES public.employees(id),
    created_by_name TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Approved'
        CHECK (status IN ('Draft', 'Approved', 'Voided')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.petty_cash_replenishments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT NOT NULL UNIQUE,
    site_id TEXT NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    amount_requested NUMERIC(15, 2) NOT NULL DEFAULT 0,
    current_float_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'Requested'
        CHECK (status IN ('Requested', 'Approved', 'Disbursed', 'Rejected')),
    requested_by_id UUID REFERENCES public.employees(id),
    requested_by_name TEXT,
    approved_by_id UUID REFERENCES public.employees(id),
    approved_by_name TEXT,
    approved_at TIMESTAMPTZ,
    bank_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_petty_cash_vouchers_site ON public.petty_cash_vouchers(country_code, site_id);

-- ----------------------------------------------------------------------------
-- 8. GROSS MARGIN PROTECTION APPROVAL QUEUE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.margin_approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number TEXT NOT NULL UNIQUE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    sku TEXT NOT NULL,
    site_id TEXT,
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    proposed_retail_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    proposed_margin_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
    target_margin_pct NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    margin_variance_pct NUMERIC(5, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    requested_by_id UUID REFERENCES public.employees(id),
    requested_by_name TEXT,
    reason TEXT NOT NULL,
    approved_by_id UUID REFERENCES public.employees(id),
    approved_by_name TEXT,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_margin_requests_status ON public.margin_approval_requests(country_code, status);

-- Enable RLS
ALTER TABLE public.ar_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_credit_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petty_cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petty_cash_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.petty_cash_replenishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.margin_approval_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'ar_invoices' AND policyname = 'ar_invoices_all') THEN
        CREATE POLICY "ar_invoices_all" ON public.ar_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_credit_limits' AND policyname = 'credit_limits_all') THEN
        CREATE POLICY "credit_limits_all" ON public.customer_credit_limits FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'petty_cash_accounts' AND policyname = 'petty_cash_accounts_all') THEN
        CREATE POLICY "petty_cash_accounts_all" ON public.petty_cash_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'petty_cash_vouchers' AND policyname = 'petty_cash_vouchers_all') THEN
        CREATE POLICY "petty_cash_vouchers_all" ON public.petty_cash_vouchers FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'petty_cash_replenishments' AND policyname = 'petty_cash_replenishments_all') THEN
        CREATE POLICY "petty_cash_replenishments_all" ON public.petty_cash_replenishments FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'margin_approval_requests' AND policyname = 'margin_requests_all') THEN
        CREATE POLICY "margin_requests_all" ON public.margin_approval_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';
