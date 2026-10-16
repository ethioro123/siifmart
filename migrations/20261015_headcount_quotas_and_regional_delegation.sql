-- Migration: Headcount Quotas & Autonomous Regional Delegation Guardrails
-- Purpose: Separates HQ system-level governance from Regional daily operations.
-- Frontline staff (Level 4) auto-activate within pre-approved site quotas.
-- Regional POs and markdowns operate autonomously within pre-set limits.

-- 1. Facility Headcount Quotas Table
CREATE TABLE IF NOT EXISTS facility_headcount_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id TEXT NOT NULL,
    role TEXT NOT NULL,
    approved_quota INTEGER NOT NULL DEFAULT 5,
    standard_grade TEXT NOT NULL DEFAULT 'L4-GRADE-1',
    max_monthly_salary NUMERIC(12, 2) DEFAULT 35000.00,
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_site_role_quota UNIQUE (site_id, role)
);

CREATE INDEX IF NOT EXISTS idx_headcount_quotas_site ON facility_headcount_quotas(site_id);
CREATE INDEX IF NOT EXISTS idx_headcount_quotas_country ON facility_headcount_quotas(country_code);

-- 2. Regional Delegation Rules Table
CREATE TABLE IF NOT EXISTS regional_delegation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_code TEXT NOT NULL,
    country_code VARCHAR(2) NOT NULL DEFAULT 'ET',
    max_autonomous_po_amount NUMERIC(14, 2) NOT NULL DEFAULT 150000.00,
    min_margin_threshold_pct NUMERIC(5, 2) NOT NULL DEFAULT 15.00,
    max_petty_cash_voucher NUMERIC(12, 2) NOT NULL DEFAULT 15000.00,
    auto_activate_l4_within_quota BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_region_country_rule UNIQUE (region_code, country_code)
);

CREATE INDEX IF NOT EXISTS idx_delegation_rules_region ON regional_delegation_rules(region_code);

-- 3. Extend Employees Table for Quota Tracking
ALTER TABLE employees ADD COLUMN IF NOT EXISTS quota_approved_by TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS onboarding_tier TEXT DEFAULT 'FRONTLINE_FAST_TRACK';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS quota_status TEXT DEFAULT 'WITHIN_QUOTA';

-- 4. Enable RLS
ALTER TABLE facility_headcount_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE regional_delegation_rules ENABLE ROW LEVEL SECURITY;

-- Read policies: allow all authenticated staff
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated read facility_headcount_quotas' AND tablename = 'facility_headcount_quotas') THEN
        CREATE POLICY "Allow authenticated read facility_headcount_quotas"
            ON facility_headcount_quotas FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated read regional_delegation_rules' AND tablename = 'regional_delegation_rules') THEN
        CREATE POLICY "Allow authenticated read regional_delegation_rules"
            ON regional_delegation_rules FOR SELECT
            TO authenticated
            USING (true);
    END IF;
END $$;

-- Write policies: corporate HQ & executive roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow HQ write facility_headcount_quotas' AND tablename = 'facility_headcount_quotas') THEN
        CREATE POLICY "Allow HQ write facility_headcount_quotas"
            ON facility_headcount_quotas FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM employees e
                    WHERE e.id = auth.uid()
                    AND (e.role IN ('super_admin', 'admin', 'hr_manager', 'operations_manager') OR LOWER(e.role) = 'ceo')
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow HQ write regional_delegation_rules' AND tablename = 'regional_delegation_rules') THEN
        CREATE POLICY "Allow HQ write regional_delegation_rules"
            ON regional_delegation_rules FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM employees e
                    WHERE e.id = auth.uid()
                    AND (e.role IN ('super_admin', 'admin', 'operations_manager') OR LOWER(e.role) = 'ceo')
                )
            );
    END IF;
END $$;

-- 5. Seed Standard Delegation Rules for Key Regions
INSERT INTO regional_delegation_rules (region_code, country_code, max_autonomous_po_amount, min_margin_threshold_pct, max_petty_cash_voucher, auto_activate_l4_within_quota)
VALUES
    ('ET-ADD', 'ET', 250000.00, 15.00, 25000.00, true),
    ('ET-DIR', 'ET', 180000.00, 15.00, 20000.00, true),
    ('ET-ORO', 'ET', 180000.00, 15.00, 20000.00, true),
    ('KE-NRB', 'KE', 200000.00, 15.00, 20000.00, true),
    ('KE-MSA', 'KE', 150000.00, 15.00, 15000.00, true),
    ('KE-RFT', 'KE', 150000.00, 15.00, 15000.00, true)
ON CONFLICT (region_code, country_code) DO UPDATE SET
    max_autonomous_po_amount = EXCLUDED.max_autonomous_po_amount,
    min_margin_threshold_pct = EXCLUDED.min_margin_threshold_pct,
    updated_at = now();

-- 6. Seed Standard Headcount Quotas for Operational Sites
-- Retail Store Quotas
INSERT INTO facility_headcount_quotas (site_id, role, approved_quota, standard_grade, max_monthly_salary, country_code)
SELECT s.id, 'cashier', 10, 'L4-GRADE-1', 25000.00, COALESCE(s.country, 'ET')
FROM sites s
WHERE s.type IN ('Store', 'Dark Store', 'Retail', 'POS')
ON CONFLICT (site_id, role) DO NOTHING;

INSERT INTO facility_headcount_quotas (site_id, role, approved_quota, standard_grade, max_monthly_salary, country_code)
SELECT s.id, 'sales_associate', 6, 'L4-GRADE-1', 22000.00, COALESCE(s.country, 'ET')
FROM sites s
WHERE s.type IN ('Store', 'Dark Store', 'Retail', 'POS')
ON CONFLICT (site_id, role) DO NOTHING;

INSERT INTO facility_headcount_quotas (site_id, role, approved_quota, standard_grade, max_monthly_salary, country_code)
SELECT s.id, 'stock_clerk', 4, 'L4-GRADE-1', 20000.00, COALESCE(s.country, 'ET')
FROM sites s
WHERE s.type IN ('Store', 'Dark Store', 'Retail', 'POS')
ON CONFLICT (site_id, role) DO NOTHING;

INSERT INTO facility_headcount_quotas (site_id, role, approved_quota, standard_grade, max_monthly_salary, country_code)
SELECT s.id, 'customer_service', 2, 'L4-GRADE-2', 26000.00, COALESCE(s.country, 'ET')
FROM sites s
WHERE s.type IN ('Store', 'Dark Store', 'Retail', 'POS')
ON CONFLICT (site_id, role) DO NOTHING;

-- Warehouse / Fulfillment Center Quotas
INSERT INTO facility_headcount_quotas (site_id, role, approved_quota, standard_grade, max_monthly_salary, country_code)
SELECT s.id, 'picker', 15, 'L4-GRADE-1', 24000.00, COALESCE(s.country, 'ET')
FROM sites s
WHERE s.type IN ('Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center')
ON CONFLICT (site_id, role) DO NOTHING;

INSERT INTO facility_headcount_quotas (site_id, role, approved_quota, standard_grade, max_monthly_salary, country_code)
SELECT s.id, 'packer', 8, 'L4-GRADE-1', 22000.00, COALESCE(s.country, 'ET')
FROM sites s
WHERE s.type IN ('Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center')
ON CONFLICT (site_id, role) DO NOTHING;

INSERT INTO facility_headcount_quotas (site_id, role, approved_quota, standard_grade, max_monthly_salary, country_code)
SELECT s.id, 'receiver', 5, 'L4-GRADE-2', 26000.00, COALESCE(s.country, 'ET')
FROM sites s
WHERE s.type IN ('Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center')
ON CONFLICT (site_id, role) DO NOTHING;

INSERT INTO facility_headcount_quotas (site_id, role, approved_quota, standard_grade, max_monthly_salary, country_code)
SELECT s.id, 'forklift_operator', 4, 'L4-GRADE-2', 30000.00, COALESCE(s.country, 'ET')
FROM sites s
WHERE s.type IN ('Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center')
ON CONFLICT (site_id, role) DO NOTHING;

INSERT INTO facility_headcount_quotas (site_id, role, approved_quota, standard_grade, max_monthly_salary, country_code)
SELECT s.id, 'driver', 6, 'L4-GRADE-2', 28000.00, COALESCE(s.country, 'ET')
FROM sites s
WHERE s.type IN ('Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center')
ON CONFLICT (site_id, role) DO NOTHING;

INSERT INTO facility_headcount_quotas (site_id, role, approved_quota, standard_grade, max_monthly_salary, country_code)
SELECT s.id, 'inventory_specialist', 3, 'L4-GRADE-3', 35000.00, COALESCE(s.country, 'ET')
FROM sites s
WHERE s.type IN ('Warehouse', 'Distribution Center', 'WMS', 'Fulfillment Center')
ON CONFLICT (site_id, role) DO NOTHING;
