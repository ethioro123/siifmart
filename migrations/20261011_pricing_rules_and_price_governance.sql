-- ======================================================================================
-- MERCHANDISING: PERSISTED PRICING RULES + PRICE-CHANGE MARGIN-FLOOR ENFORCEMENT
-- Date: 2026-10-11
-- Rules: SOP-MER-037 (zero-trust pricing, 4-eyes, Finance co-approval below 15% margin),
--        Multi-country sovereignty (country_code scoped), RLS on every table.
-- ======================================================================================

-- 1. PRICING RULES TABLE (country scoped)
CREATE TABLE IF NOT EXISTS public.pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code VARCHAR(10) NOT NULL DEFAULT 'ET',
    name TEXT NOT NULL,
    target_category TEXT NOT NULL,
    condition TEXT NOT NULL CHECK (condition IN ('Stock > X', 'Expiry < X Days', 'Sales < X')),
    threshold NUMERIC NOT NULL CHECK (threshold >= 0),
    action TEXT NOT NULL CHECK (action IN ('Decrease Price %', 'Increase Price %', 'Set to Cost + Margin')),
    value NUMERIC NOT NULL CHECK (value >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_country_active ON public.pricing_rules(country_code, is_active);

CREATE OR REPLACE FUNCTION public.touch_pricing_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_pricing_rules_updated_at ON public.pricing_rules;
CREATE TRIGGER trg_pricing_rules_updated_at
    BEFORE UPDATE ON public.pricing_rules
    FOR EACH ROW EXECUTE FUNCTION public.touch_pricing_rules_updated_at();

-- 2. RLS
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pricing_rules_select" ON public.pricing_rules;
DROP POLICY IF EXISTS "pricing_rules_insert" ON public.pricing_rules;
DROP POLICY IF EXISTS "pricing_rules_update" ON public.pricing_rules;
DROP POLICY IF EXISTS "pricing_rules_delete" ON public.pricing_rules;

-- Read: CEO sees all; HQ admins and Merchandising Manager see their own country only
CREATE POLICY "pricing_rules_select" ON public.pricing_rules
    FOR SELECT TO authenticated
    USING (
        (SELECT public.is_ceo())
        OR (
            country_code = (SELECT public.get_my_country_code())
            AND ((SELECT public.is_admin()) OR (SELECT public.get_my_role()) = 'merchandising_manager')
        )
    );

-- Write: only Merchandising Manager (own country) or CEO
CREATE POLICY "pricing_rules_insert" ON public.pricing_rules
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT public.is_ceo())
        OR (
            country_code = (SELECT public.get_my_country_code())
            AND (SELECT public.get_my_role()) = 'merchandising_manager'
        )
    );

CREATE POLICY "pricing_rules_update" ON public.pricing_rules
    FOR UPDATE TO authenticated
    USING (
        (SELECT public.is_ceo())
        OR (
            country_code = (SELECT public.get_my_country_code())
            AND (SELECT public.get_my_role()) = 'merchandising_manager'
        )
    )
    WITH CHECK (
        (SELECT public.is_ceo())
        OR (
            country_code = (SELECT public.get_my_country_code())
            AND (SELECT public.get_my_role()) = 'merchandising_manager'
        )
    );

CREATE POLICY "pricing_rules_delete" ON public.pricing_rules
    FOR DELETE TO authenticated
    USING (
        (SELECT public.is_ceo())
        OR (
            country_code = (SELECT public.get_my_country_code())
            AND (SELECT public.get_my_role()) = 'merchandising_manager'
        )
    );

-- 3. DB-LEVEL MARGIN FLOOR: price-change requests below 15% margin need Finance Manager / CEO
CREATE OR REPLACE FUNCTION public.enforce_price_change_margin_floor()
RETURNS TRIGGER AS $$
DECLARE
    v_price NUMERIC;
    v_sale NUMERIC;
    v_on_sale BOOLEAN;
    v_cost NUMERIC;
    v_effective NUMERIC;
BEGIN
    IF NEW.status = 'approved'
       AND OLD.status IS DISTINCT FROM 'approved'
       AND NEW.change_type = 'edit'
       AND COALESCE(NEW.adjustment_reason, '') LIKE 'PRICE_CHANGE%'
       AND NEW.proposed_changes IS NOT NULL THEN

        v_price   := NULLIF(NEW.proposed_changes->>'price', '')::NUMERIC;
        v_sale    := NULLIF(NEW.proposed_changes->>'salePrice', '')::NUMERIC;
        v_on_sale := COALESCE((NEW.proposed_changes->>'isOnSale')::BOOLEAN, FALSE);
        v_cost    := NULLIF(NEW.proposed_changes->>'costPrice', '')::NUMERIC;
        v_effective := CASE WHEN v_on_sale AND COALESCE(v_sale, 0) > 0 THEN v_sale ELSE v_price END;

        IF COALESCE(v_effective, 0) > 0 AND COALESCE(v_cost, 0) > 0
           AND ((v_effective - v_cost) / v_effective) * 100 < 15
           AND (SELECT public.get_my_role()) NOT IN ('country_finance_director', 'group_ceo') THEN
            RAISE EXCEPTION 'Zero-Trust Violation: price changes below the 15%% margin floor require Finance Manager or CEO approval.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_inventory_requests_margin_floor ON public.inventory_requests;
CREATE TRIGGER trg_inventory_requests_margin_floor
    BEFORE UPDATE ON public.inventory_requests
    FOR EACH ROW EXECUTE FUNCTION public.enforce_price_change_margin_floor();
