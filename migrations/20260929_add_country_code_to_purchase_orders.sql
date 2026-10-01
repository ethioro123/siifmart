-- ============================================================================
-- Migration: 20260929_add_country_code_to_purchase_orders.sql
-- Description: Add country_code and currency to purchase_orders for 100% Multi-Country Tenant Isolation
-- ============================================================================

-- 1. Add country_code and currency columns
ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS country_code VARCHAR(10) NOT NULL DEFAULT 'ET';

ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'ETB';

-- 2. Backfill existing purchase orders based on destination site country & currency
UPDATE public.purchase_orders po
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
WHERE po.site_id = s.id;

-- Ensure fallback default for any remaining records with unassigned sites
UPDATE public.purchase_orders
SET country_code = 'ET', currency = 'ETB'
WHERE country_code IS NULL OR country_code = '';

-- 3. Create high-performance indexes for country-partitioned queries
CREATE INDEX IF NOT EXISTS idx_purchase_orders_country_code 
ON public.purchase_orders(country_code);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_site_country 
ON public.purchase_orders(country_code, site_id);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_country_status_created 
ON public.purchase_orders(country_code, status, created_at DESC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- Drop obsolete policies
DROP POLICY IF EXISTS "po_read" ON public.purchase_orders;
DROP POLICY IF EXISTS "purchase_orders_select" ON public.purchase_orders;
DROP POLICY IF EXISTS "po_isolation_select" ON public.purchase_orders;

-- Multi-Country Tenant Scoped SELECT:
-- Authenticated branch staff can only read POs from their assigned country's facilities;
-- Corporate executives (CEO, super_admin, admin) can read POs within their active tenant.
CREATE POLICY "po_isolation_select" ON public.purchase_orders
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
