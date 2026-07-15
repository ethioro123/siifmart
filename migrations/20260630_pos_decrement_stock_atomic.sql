-- Migration: Atomic stock decrement for POS offline sync
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/sql/new

CREATE OR REPLACE FUNCTION public.pos_decrement_stock(
    p_product_id UUID,
    p_quantity    NUMERIC,
    p_site_id     TEXT DEFAULT NULL,
    p_product_name TEXT DEFAULT '',
    p_reason      TEXT DEFAULT 'POS Sale (Offline Sync)',
    p_performed_by TEXT DEFAULT 'System',
    p_sale_date   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (new_stock NUMERIC, product_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_stock NUMERIC;
    v_name      TEXT;
    v_site_uuid UUID;
BEGIN
    -- Safely parse site_id UUID
    IF p_site_id IS NOT NULL AND p_site_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_site_uuid := p_site_id::UUID;
    ELSE
        v_site_uuid := NULL;
    END IF;

    -- Atomic read-modify-write in a single statement
    UPDATE public.products
    SET stock = GREATEST(0, stock - p_quantity)
    WHERE id = p_product_id
    RETURNING stock, name INTO v_new_stock, v_name;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product % not found', p_product_id;
    END IF;

    -- Record stock movement for audit trail
    INSERT INTO public.stock_movements (
        site_id,
        product_id,
        product_name,
        type,
        quantity,
        movement_date,
        performed_by,
        reason
    ) VALUES (
        v_site_uuid,
        p_product_id,
        COALESCE(v_name, p_product_name),
        'OUT',
        p_quantity,
        p_sale_date,
        p_performed_by,
        p_reason
    );

    RETURN QUERY SELECT v_new_stock, v_name;
END;
$$;

-- Grant execute to authenticated users (cashiers, managers, etc.)
GRANT EXECUTE ON FUNCTION public.pos_decrement_stock TO authenticated;
