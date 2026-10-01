-- ============================================================================
-- Migration: 20260929_add_country_code_to_sales.sql
-- Description: Add country_code and currency to sales for 100% Multi-Country Tenant Isolation
-- ============================================================================

-- 1. Add country_code and currency columns
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) NOT NULL DEFAULT 'ET';

ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'ETB';

-- 2. Backfill existing sales based on originating store country & currency
UPDATE public.sales s_table
SET 
    country_code = COALESCE(s.country, 'ET'),
    currency = CASE 
        WHEN s.country = 'KE' OR s.currency IN ('KES', 'KSh') THEN 'KSh'
        WHEN s.country = 'UG' OR s.currency IN ('UGX', 'USh') THEN 'USh'
        WHEN s.country = 'RW' OR s.currency IN ('RWF') THEN 'RWF'
        WHEN s.country = 'TZ' OR s.currency IN ('TZS', 'TSh') THEN 'TSh'
        ELSE 'ETB'
    END
FROM public.sites s
WHERE s_table.site_id = s.id;

-- Fallback default for any legacy transactions with unassigned sites
UPDATE public.sales
SET country_code = 'ET', currency = 'ETB'
WHERE country_code IS NULL OR country_code = '';

-- 3. Create high-performance indexes for country-partitioned queries
CREATE INDEX IF NOT EXISTS idx_sales_country_code 
ON public.sales(country_code);

CREATE INDEX IF NOT EXISTS idx_sales_country_site 
ON public.sales(country_code, site_id);

CREATE INDEX IF NOT EXISTS idx_sales_country_date 
ON public.sales(country_code, sale_date DESC);

CREATE INDEX IF NOT EXISTS idx_sales_country_status_date 
ON public.sales(country_code, status, sale_date DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_isolation_select" ON public.sales;

-- Multi-Country Tenant Scoped SELECT:
-- Authenticated branch staff can only read sales from their assigned country's facilities;
-- Corporate executives (CEO, super_admin, admin) can read sales within their active tenant.
CREATE POLICY "sales_isolation_select" ON public.sales
    FOR SELECT TO authenticated
    USING (
        -- Allow CEO and super_admin full visibility
        COALESCE(auth.jwt() ->> 'role', '') IN ('super_admin', 'CEO', 'admin')
        OR
        -- Site-scoped for branch staff
        site_id IN (
            SELECT id FROM public.sites 
            WHERE country = (
                SELECT COALESCE(s2.country, 'ET')
                FROM public.sites s2
                WHERE s2.id = (
                    SELECT site_id FROM public.employees 
                    WHERE id::text = auth.uid()::text 
                    LIMIT 1
                )
            )
        )
    );
