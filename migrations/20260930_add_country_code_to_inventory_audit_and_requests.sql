-- ============================================================================
-- Migration: 20260930_add_country_code_to_inventory_audit_and_requests.sql
-- Description: Add country_code to barcode_approvals and inventory_requests
--              for strict Multi-Country Tenant Isolation and Zero-Trust HQ Oversight
-- ============================================================================

-- 1. BARCODE APPROVALS: Add country_code column
ALTER TABLE public.barcode_approvals 
ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) NOT NULL DEFAULT 'ET';

-- Backfill barcode_approvals country_code from originating site (with explicit text casting for uuid/text compatibility)
UPDATE public.barcode_approvals ba
SET country_code = UPPER(COALESCE(s.country, 'ET'))
FROM public.sites s
WHERE ba.site_id::text = s.id::text OR ba.site_id::text = s.code;

UPDATE public.barcode_approvals
SET country_code = 'ET'
WHERE country_code IS NULL OR country_code = '';

-- Indexes for country-partitioned queries
CREATE INDEX IF NOT EXISTS idx_barcode_approvals_country_code 
ON public.barcode_approvals(country_code);

CREATE INDEX IF NOT EXISTS idx_barcode_approvals_country_site 
ON public.barcode_approvals(country_code, site_id);

CREATE INDEX IF NOT EXISTS idx_barcode_approvals_country_created 
ON public.barcode_approvals(country_code, created_at DESC);


-- 2. INVENTORY REQUESTS: Add country_code column
ALTER TABLE public.inventory_requests 
ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) NOT NULL DEFAULT 'ET';

-- Backfill inventory_requests country_code from originating site (with explicit text casting for uuid/text compatibility)
UPDATE public.inventory_requests ir
SET country_code = UPPER(COALESCE(s.country, 'ET'))
FROM public.sites s
WHERE ir.site_id::text = s.id::text OR ir.site_id::text = s.code;

UPDATE public.inventory_requests
SET country_code = 'ET'
WHERE country_code IS NULL OR country_code = '';

-- Indexes for country-partitioned requests
CREATE INDEX IF NOT EXISTS idx_inventory_requests_country_code 
ON public.inventory_requests(country_code);

CREATE INDEX IF NOT EXISTS idx_inventory_requests_country_status 
ON public.inventory_requests(country_code, status);

CREATE INDEX IF NOT EXISTS idx_inventory_requests_country_site 
ON public.inventory_requests(country_code, site_id);


-- 3. ROW LEVEL SECURITY (RLS) POLICIES

-- Barcode Approvals RLS
ALTER TABLE public.barcode_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "barcode_approvals_country_isolation_select" ON public.barcode_approvals;
CREATE POLICY "barcode_approvals_country_isolation_select" ON public.barcode_approvals
    FOR SELECT TO authenticated
    USING (
        COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO', 'admin')
        OR
        site_id::text IN (
            SELECT id::text FROM public.sites 
            WHERE country = (auth.jwt() ->> 'country_code') 
               OR (auth.jwt() ->> 'country_code') IS NULL
        )
    );

-- Inventory Requests RLS
ALTER TABLE public.inventory_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_requests_country_isolation_select" ON public.inventory_requests;
CREATE POLICY "inventory_requests_country_isolation_select" ON public.inventory_requests
    FOR SELECT TO authenticated
    USING (
        COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO', 'admin')
        OR
        site_id::text IN (
            SELECT id::text FROM public.sites 
            WHERE country = (auth.jwt() ->> 'country_code') 
               OR (auth.jwt() ->> 'country_code') IS NULL
        )
    );
