-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 20261018_harden_settings_gateways_audit_and_rls.sql
-- Description:
--   1. Adds persistent payment gateway credential columns to system_config.
--   2. Updates system_config UPDATE policy to authorize admin and finance_manager.
--   3. Adds get_sanitized_system_config() RPC to restrict country settings visibility by country boundary.
--   4. Hardens system_logs to bind claimed actor to authenticated identity and prevent forging.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. ADD GATEWAY CREDENTIAL COLUMNS TO system_config
ALTER TABLE public.system_config
    ADD COLUMN IF NOT EXISTS mpesa_till_enabled boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS mpesa_till_number text,
    ADD COLUMN IF NOT EXISTS mpesa_till_name text,
    ADD COLUMN IF NOT EXISTS mpesa_stk_enabled boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS mpesa_stk_shortcode text,
    ADD COLUMN IF NOT EXISTS mpesa_passkey text,
    ADD COLUMN IF NOT EXISTS mpesa_consumer_key text,
    ADD COLUMN IF NOT EXISTS mpesa_consumer_secret text,
    ADD COLUMN IF NOT EXISTS mpesa_environment text DEFAULT 'sandbox',
    ADD COLUMN IF NOT EXISTS mpesa_paybill_enabled boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS mpesa_paybill_number text,
    ADD COLUMN IF NOT EXISTS mpesa_paybill_account text,
    ADD COLUMN IF NOT EXISTS airtel_money_enabled boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS airtel_till_number text,
    ADD COLUMN IF NOT EXISTS airtel_merchant_name text,
    ADD COLUMN IF NOT EXISTS telebirr_enabled boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS telebirr_merchant_id text,
    ADD COLUMN IF NOT EXISTS cbe_birr_enabled boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS cbe_birr_merchant_code text;

-- Seed singleton system_config record if missing
INSERT INTO public.system_config (
    id,
    store_name,
    legal_business_name,
    currency,
    country_configs,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'SIIFMART',
    'SIIFMART Retail Ltd',
    'ETB',
    '{"ET": {"currency": "ETB", "taxRate": 15, "fiscalYearStart": "2026-01"}, "KE": {"currency": "KES", "taxRate": 16, "fiscalYearStart": "2026-07"}}'::jsonb,
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- 2. UPDATE system_config RLS POLICY TO AUTHORIZE ADMIN & FINANCE_MANAGER
DROP POLICY IF EXISTS "config_update_ceo_only" ON public.system_config;
DROP POLICY IF EXISTS "config_update_authorized" ON public.system_config;

CREATE POLICY "config_update_authorized" ON public.system_config
    FOR UPDATE TO authenticated
    USING (
        (SELECT public.is_ceo())
        OR lower(coalesce((SELECT public.get_my_role()), '')) IN ('admin', 'finance_manager')
    )
    WITH CHECK (
        (SELECT public.is_ceo())
        OR lower(coalesce((SELECT public.get_my_role()), '')) IN ('admin', 'finance_manager')
    );

-- 3. SECURE SANITIZED SYSTEM CONFIG RPC (COUNTRY SOVEREIGNTY READ ENFORCEMENT)
CREATE OR REPLACE FUNCTION public.get_sanitized_system_config()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_row public.system_config%ROWTYPE;
    v_result jsonb;
    v_role text;
    v_country text;
    v_filtered_country_configs jsonb;
BEGIN
    SELECT * INTO v_row FROM public.system_config WHERE id = '00000000-0000-0000-0000-000000000001' LIMIT 1;
    IF NOT FOUND THEN
        RETURN '{}'::jsonb;
    END IF;

    v_result := to_jsonb(v_row);
    v_role := lower(coalesce(public.get_my_role(), ''));
    v_country := upper(coalesce(public.get_my_country_code(), 'ET'));

    -- CEO and super_admin see all country configurations
    IF v_role IN ('super_admin', 'ceo') THEN
        RETURN v_result;
    END IF;

    -- Country/Branch staff only receive their authorized country partition
    IF v_row.country_configs IS NOT NULL AND v_row.country_configs ? v_country THEN
        v_filtered_country_configs := jsonb_build_object(v_country, v_row.country_configs->v_country);
    ELSE
        v_filtered_country_configs := '{}'::jsonb;
    END IF;

    -- Mask cross-country configs
    v_result := jsonb_set(v_result, '{country_configs}', v_filtered_country_configs);
    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_sanitized_system_config() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_sanitized_system_config() TO authenticated, service_role;

-- 4. HARDEN system_logs TO BIND CLAIMED ACTOR & PREVENT FORGERY
CREATE OR REPLACE FUNCTION public.bind_system_log_actor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid text;
    v_email text;
    v_emp_id text;
    v_emp_name text;
BEGIN
    v_uid := (SELECT auth.uid())::text;
    v_email := (SELECT auth.jwt()->>'email');

    -- Find matching employee record if available
    SELECT id::text, full_name INTO v_emp_id, v_emp_name
    FROM public.employees
    WHERE (v_uid IS NOT NULL AND id::text = v_uid)
       OR (v_email IS NOT NULL AND lower(email) = lower(v_email))
    LIMIT 1;

    -- Bind performed_by to actual authenticated identity
    IF v_uid IS NOT NULL THEN
        NEW.performed_by := COALESCE(NEW.performed_by, v_emp_id, v_uid);
    END IF;

    IF v_emp_name IS NOT NULL AND (NEW.user_name IS NULL OR NEW.user_name = '') THEN
        NEW.user_name := v_emp_name;
    END IF;

    IF NEW.created_at IS NULL THEN
        NEW.created_at := now();
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bind_system_log_actor ON public.system_logs;
CREATE TRIGGER trg_bind_system_log_actor
    BEFORE INSERT ON public.system_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.bind_system_log_actor();

DROP POLICY IF EXISTS "logs_insert" ON public.system_logs;
CREATE POLICY "logs_insert" ON public.system_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) IS NOT NULL
        AND (
            performed_by IS NULL
            OR performed_by = (SELECT auth.uid())::text
            OR performed_by IN (
                SELECT id::text FROM public.employees 
                WHERE (auth.uid() IS NOT NULL AND id::text = (SELECT auth.uid())::text)
                   OR (auth.jwt()->>'email' IS NOT NULL AND lower(email) = lower(auth.jwt()->>'email'))
            )
            OR (SELECT public.is_ceo())
        )
    );
