-- =============================================================================
-- Migration: Security Hardening for Shifts and POS Sales
-- Date: 2026-10-17
-- Description:
-- 1. Scope shifts SELECT: restrict regional managers to sites within their assigned region.
-- 2. Harden sales and sale_items: enforce site-scoped INSERT/UPDATE; provide atomic
--    create_pos_sale_atomic RPC to prevent incomplete sales.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. SHIFTS: Regional Manager Region Scoping
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "shifts_select_policy" ON public.shifts;
CREATE POLICY "shifts_select_policy" ON public.shifts
FOR SELECT TO authenticated
USING (
    -- CEO / Super Admin / National HQ Executives
    ((SELECT COALESCE(public.get_my_role(), ((SELECT auth.jwt()) ->> 'role'))) = ANY (ARRAY['super_admin', 'admin', 'CEO', 'finance_manager', 'auditor', 'operations_manager']))
    -- Regional Managers: strictly scoped to sites in their assigned region
    OR (
        ((SELECT COALESCE(public.get_my_role(), ((SELECT auth.jwt()) ->> 'role'))) = 'regional_manager')
        AND site_id IN (
            SELECT s.id FROM public.sites s
            WHERE s.region_code = (
                SELECT e.region_code FROM public.employees e 
                WHERE e.id = (SELECT auth.uid()) OR e.email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
                LIMIT 1
            )
        )
    )
    -- Branch Users: their active site
    OR site_id::text = (SELECT public.get_my_site_code_or_id())::text
    OR site_id = (
        SELECT e.site_id FROM public.employees e
        WHERE e.id = (SELECT auth.uid()) OR e.email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
        LIMIT 1
    )
    OR site_id IS NULL
);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SALES & SALE ITEMS: Server-Side Site Scoping & Atomic Sale RPC
-- ─────────────────────────────────────────────────────────────────────────────

-- A. Harden sales Policies
DROP POLICY IF EXISTS "sales_insert" ON public.sales;
CREATE POLICY "sales_insert" ON public.sales
FOR INSERT TO authenticated
WITH CHECK (
    public.is_ceo()
    OR public.is_admin()
    OR (
        site_id::text = (SELECT public.get_my_site_code_or_id())::text
        OR site_id IN (
            SELECT s.id FROM public.sites s 
            WHERE s.id::text = (SELECT public.get_my_site_code_or_id())::text 
               OR s.code::text = (SELECT public.get_my_site_code_or_id())::text
        )
    )
);

DROP POLICY IF EXISTS "sales_update" ON public.sales;
CREATE POLICY "sales_update" ON public.sales
FOR UPDATE TO authenticated
USING (
    public.is_ceo()
    OR (
        public.is_admin()
        AND (country_code IS NULL OR country_code = public.get_my_country_code())
    )
    OR (
        public.is_manager()
        AND (
            site_id::text = (SELECT public.get_my_site_code_or_id())::text
            OR site_id IN (
                SELECT s.id FROM public.sites s 
                WHERE s.id::text = (SELECT public.get_my_site_code_or_id())::text 
                   OR s.code::text = (SELECT public.get_my_site_code_or_id())::text
            )
        )
    )
);

-- B. Harden sale_items Policies
DROP POLICY IF EXISTS "sale_items_read" ON public.sale_items;
CREATE POLICY "sale_items_read" ON public.sale_items
FOR SELECT TO authenticated
USING (
    public.is_ceo()
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.sales s
        WHERE s.id = sale_items.sale_id
          AND (
              s.site_id::text = (SELECT public.get_my_site_code_or_id())::text
              OR s.site_id IN (
                  SELECT st.id FROM public.sites st 
                  WHERE st.id::text = (SELECT public.get_my_site_code_or_id())::text 
                     OR st.code::text = (SELECT public.get_my_site_code_or_id())::text
              )
          )
    )
);

DROP POLICY IF EXISTS "sale_items_insert" ON public.sale_items;
CREATE POLICY "sale_items_insert" ON public.sale_items
FOR INSERT TO authenticated
WITH CHECK (
    public.is_ceo()
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.sales s
        WHERE s.id = sale_items.sale_id
          AND (
              s.site_id::text = (SELECT public.get_my_site_code_or_id())::text
              OR s.site_id IN (
                  SELECT st.id FROM public.sites st 
                  WHERE st.id::text = (SELECT public.get_my_site_code_or_id())::text 
                     OR st.code::text = (SELECT public.get_my_site_code_or_id())::text
              )
          )
    )
);

DROP POLICY IF EXISTS "sale_items_update" ON public.sale_items;
CREATE POLICY "sale_items_update" ON public.sale_items
FOR UPDATE TO authenticated
USING (
    public.is_ceo()
    OR public.is_admin()
    OR (
        public.is_manager()
        AND EXISTS (
            SELECT 1 FROM public.sales s
            WHERE s.id = sale_items.sale_id
              AND (
                  s.site_id::text = (SELECT public.get_my_site_code_or_id())::text
                  OR s.site_id IN (
                      SELECT st.id FROM public.sites st 
                      WHERE st.id::text = (SELECT public.get_my_site_code_or_id())::text 
                         OR st.code::text = (SELECT public.get_my_site_code_or_id())::text
                  )
              )
        )
    )
);

-- C. Atomic Sale Creation RPC (Ensures sales and sale_items commit together)
CREATE OR REPLACE FUNCTION public.create_pos_sale_atomic(
    p_sale JSONB,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_sale_id UUID;
    v_item RECORD;
    v_inserted_sale RECORD;
    v_site_id UUID;
    v_country_code TEXT;
BEGIN
    v_site_id := (p_sale->>'site_id')::UUID;
    v_country_code := COALESCE(p_sale->>'country_code', 'ET');

    IF auth.role() = 'authenticated' AND NOT public.is_ceo() AND NOT public.is_admin() THEN
        IF v_site_id::text != (SELECT public.get_my_site_code_or_id())::text AND
           v_site_id NOT IN (
               SELECT s.id FROM public.sites s 
               WHERE s.id::text = (SELECT public.get_my_site_code_or_id())::text 
                  OR s.code::text = (SELECT public.get_my_site_code_or_id())::text
           ) THEN
            RAISE EXCEPTION 'Site Authorization Violation: Caller is not authorized to register sales for site "%".', v_site_id;
        END IF;
    END IF;

    INSERT INTO public.sales (
        site_id,
        country_code,
        total,
        subtotal,
        tax,
        payment_method,
        status,
        amount_tendered,
        change,
        cashier_name,
        receipt_number,
        customer_id
    ) VALUES (
        v_site_id,
        v_country_code,
        COALESCE((p_sale->>'total')::NUMERIC, (p_sale->>'total_amount')::NUMERIC, 0),
        COALESCE((p_sale->>'subtotal')::NUMERIC, (p_sale->>'total')::NUMERIC, 0),
        COALESCE((p_sale->>'tax')::NUMERIC, 0),
        COALESCE(p_sale->>'payment_method', p_sale->>'method', 'Cash'),
        COALESCE(p_sale->>'status', 'Completed'),
        (p_sale->>'amount_tendered')::NUMERIC,
        (p_sale->>'change')::NUMERIC,
        p_sale->>'cashier_name',
        p_sale->>'receipt_number',
        CASE WHEN p_sale->>'customer_id' IS NOT NULL AND p_sale->>'customer_id' != '' THEN (p_sale->>'customer_id')::UUID ELSE NULL END
    )
    RETURNING id INTO v_sale_id;

    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        product_id UUID,
        product_name TEXT,
        quantity NUMERIC,
        price NUMERIC,
        cost_price NUMERIC
    )
    LOOP
        INSERT INTO public.sale_items (
            sale_id,
            product_id,
            product_name,
            quantity,
            price,
            cost_price
        ) VALUES (
            v_sale_id,
            v_item.product_id,
            v_item.product_name,
            v_item.quantity,
            v_item.price,
            v_item.cost_price
        );
    END LOOP;

    SELECT * INTO v_inserted_sale FROM public.sales WHERE id = v_sale_id;

    RETURN to_jsonb(v_inserted_sale);
END;
$$;

REVOKE ALL ON FUNCTION public.create_pos_sale_atomic(JSONB, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_pos_sale_atomic(JSONB, JSONB) TO authenticated, service_role;
