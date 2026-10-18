-- ============================================================================
-- SIIFMART PRODUCTION CLEAN SLATE / FACTORY RESET MIGRATION
-- Migration: 20261018_production_clean_slate_reset.sql
-- Purpose:
--   Purges all historical test data (dummy employees, test products, demo sales,
--   fake purchase orders, WMS jobs, shifts, ledger entries, and audit logs)
--   from the primary/production database.
--
-- Preserved Infrastructure:
--   - Topologies: sites, regions, logistics_zones, warehouse_zones, category_zones
--   - Reference Data: currencies, supported_languages, hr_country_policies, chart_of_accounts, system_config
--   - Master Administrative Authority: Shukri Kamal (super_admin / CEO)
-- ============================================================================

BEGIN;

-- 1. Unlink regional managers from regions to prevent foreign key errors
UPDATE public.regions SET regional_manager_id = NULL;

-- 2. Clear Point-of-Sale, Orders, Invoices, and Shifts
TRUNCATE TABLE public.pos_cash_drops CASCADE;
TRUNCATE TABLE public.pos_supervisory_overrides CASCADE;
TRUNCATE TABLE public.sale_items CASCADE;
TRUNCATE TABLE public.sales CASCADE;
TRUNCATE TABLE public.shifts CASCADE;
TRUNCATE TABLE public.tender_reconciliations CASCADE;
TRUNCATE TABLE public.ar_invoices CASCADE;
TRUNCATE TABLE public.invoice_items CASCADE;

-- 3. Clear Logistics, Warehouse (WMS), Inbound QC, and Transfers
TRUNCATE TABLE public.po_items CASCADE;
TRUNCATE TABLE public.purchase_orders CASCADE;
TRUNCATE TABLE public.inbound_qc_inspections CASCADE;
TRUNCATE TABLE public.discrepancy_claims CASCADE;
TRUNCATE TABLE public.discrepancy_resolutions CASCADE;
TRUNCATE TABLE public.stock_movements CASCADE;
TRUNCATE TABLE public.wms_job_items CASCADE;
TRUNCATE TABLE public.job_assignments CASCADE;
TRUNCATE TABLE public.wms_jobs CASCADE;
TRUNCATE TABLE public.deliveries CASCADE;
TRUNCATE TABLE public.trips CASCADE;
TRUNCATE TABLE public.drivers CASCADE;
TRUNCATE TABLE public.transfers CASCADE;
TRUNCATE TABLE public.inventory_requests CASCADE;

-- 4. Clear Catalog, Products, Pricing, and Barcodes
TRUNCATE TABLE public.barcode_approvals CASCADE;
TRUNCATE TABLE public.margin_approval_requests CASCADE;
TRUNCATE TABLE public.pricing_rules CASCADE;
TRUNCATE TABLE public.product_master CASCADE;
TRUNCATE TABLE public.products CASCADE;

-- Reset SKU Sequence Counters to 1000 so Day 1 SKUs start clean
UPDATE public.sku_counters SET last_value = 1000;

-- 5. Clear Finance, Expenses, Petty Cash, and Accounting Entries
TRUNCATE TABLE public.expenses CASCADE;
TRUNCATE TABLE public.petty_cash_vouchers CASCADE;
TRUNCATE TABLE public.petty_cash_replenishments CASCADE;
TRUNCATE TABLE public.petty_cash_accounts CASCADE;
TRUNCATE TABLE public.payment_runs CASCADE;
TRUNCATE TABLE public.vendor_invoices CASCADE;
TRUNCATE TABLE public.vendor_contracts CASCADE;
TRUNCATE TABLE public.vendor_scorecards CASCADE;
TRUNCATE TABLE public.journal_lines CASCADE;
TRUNCATE TABLE public.journal_entries CASCADE;
TRUNCATE TABLE public.department_budgets CASCADE;

-- 6. Clear HR Test Records, Roster Schedules, and Reviews
TRUNCATE TABLE public.staff_schedules CASCADE;
TRUNCATE TABLE public.employee_tasks CASCADE;
TRUNCATE TABLE public.employee_change_requests CASCADE;
TRUNCATE TABLE public.disciplinary_records CASCADE;
TRUNCATE TABLE public.performance_reviews CASCADE;
TRUNCATE TABLE public.training_records CASCADE;
TRUNCATE TABLE public.employee_documents CASCADE;
TRUNCATE TABLE public.job_candidates CASCADE;
TRUNCATE TABLE public.job_requisitions CASCADE;
TRUNCATE TABLE public.headcount_quota_requests CASCADE;
TRUNCATE TABLE public.payroll_runs CASCADE;
TRUNCATE TABLE public.salary_requests CASCADE;

-- 7. Clear Gamification, Points, and Audits
TRUNCATE TABLE public.points_transactions CASCADE;
TRUNCATE TABLE public.worker_points CASCADE;
TRUNCATE TABLE public.store_points CASCADE;
TRUNCATE TABLE public.store_operations_audits CASCADE;
TRUNCATE TABLE public.ratings CASCADE;
TRUNCATE TABLE public.brainstorm_nodes CASCADE;
TRUNCATE TABLE public.system_logs CASCADE;

-- 8. Clear Customers, Credit Limits, and Suppliers
TRUNCATE TABLE public.customer_credit_limits CASCADE;
TRUNCATE TABLE public.customers CASCADE;
TRUNCATE TABLE public.suppliers CASCADE;
TRUNCATE TABLE public.farmer_programs CASCADE;
TRUNCATE TABLE public.agent_deposits CASCADE;
TRUNCATE TABLE public.agents CASCADE;
TRUNCATE TABLE public.transactions CASCADE;
TRUNCATE TABLE public.wallet_ledger_entries CASCADE;

-- 9. Clean out Non-Admin Test Employees (Preserving Shukri Kamal / super_admin)
DELETE FROM public.employees 
WHERE id NOT IN ('0e045a53-fe4b-49f2-90a7-aa11984fbab4');

-- 10. Clean out Wallets & Public Users (Preserving Master Admin Accounts)
DELETE FROM public.wallets 
WHERE user_id NOT IN ('0e045a53-fe4b-49f2-90a7-aa11984fbab4', 'f303780d-e898-4c45-a5da-ea6187a964d8');

DELETE FROM public.users 
WHERE id NOT IN ('0e045a53-fe4b-49f2-90a7-aa11984fbab4', 'f303780d-e898-4c45-a5da-ea6187a964d8')
  AND auth_id NOT IN ('0e045a53-fe4b-49f2-90a7-aa11984fbab4', 'f303780d-e898-4c45-a5da-ea6187a964d8');

-- Ensure root super_admin (Shukri Kamal) is bound in public.users and public.wallets
INSERT INTO public.users (id, auth_id, email, full_name, default_language, region_code, created_at, updated_at)
VALUES (
  '0e045a53-fe4b-49f2-90a7-aa11984fbab4',
  '0e045a53-fe4b-49f2-90a7-aa11984fbab4',
  'ET-SIIF0001@siifmart.com',
  'Shukri Kamal',
  'en',
  'ET-ADD',
  now(),
  now()
)
ON CONFLICT (auth_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  region_code = EXCLUDED.region_code,
  updated_at = now();

INSERT INTO public.wallets (user_id, currency_code, balance_cents, created_at, updated_at)
VALUES (
  '0e045a53-fe4b-49f2-90a7-aa11984fbab4',
  'ETB',
  0,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

-- 11. Purge Test Authentication Accounts in auth.users (Preserving Master Admins)
DELETE FROM auth.users 
WHERE id NOT IN ('0e045a53-fe4b-49f2-90a7-aa11984fbab4', 'f303780d-e898-4c45-a5da-ea6187a964d8');

COMMIT;
