-- Secure system settings reads and writes through explicit country boundaries.
-- Gateway credentials remain stored for compatibility, but are never returned to clients.

ALTER TABLE public.system_config
    ADD COLUMN IF NOT EXISTS country_configs jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS role_policies jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS role_permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS mpesa_till_enabled boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS mpesa_till_number text,
    ADD COLUMN IF NOT EXISTS mpesa_till_name text,
    ADD COLUMN IF NOT EXISTS mpesa_stk_enabled boolean DEFAULT false,
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
    ADD COLUMN IF NOT EXISTS telebirr_enabled boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS telebirr_merchant_id text,
    ADD COLUMN IF NOT EXISTS cbe_birr_enabled boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS cbe_birr_merchant_code text;

-- Ensure the singleton row exists so settings writes never need client-side INSERT rights.
INSERT INTO public.system_config (id, store_name, country_configs, role_policies, role_permissions, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-000000000001', 'SiifMart', '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, now(), now())
ON CONFLICT (id) DO NOTHING;

-- A safe read RPC is the only client path to the settings record. All gateway secrets,
-- including secrets nested in country_configs, are omitted from its result.
CREATE OR REPLACE FUNCTION public.get_sanitized_system_config()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
DECLARE
    v_row public.system_config%ROWTYPE;
    v_result jsonb;
    v_country text;
    v_role text;
    v_configs jsonb := '{}'::jsonb;
    v_country_key text;
    v_country_value jsonb;
BEGIN
    IF (SELECT auth.uid()) IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    SELECT * INTO v_row
    FROM public.system_config
    WHERE id = '00000000-0000-0000-0000-000000000001';

    IF NOT FOUND THEN
        RETURN '{}'::jsonb;
    END IF;

    v_country := upper(coalesce(public.get_my_country_code(), ''));
    v_role := lower(coalesce(public.get_my_role(), ''));
    v_result := to_jsonb(v_row) - ARRAY[
        'mpesa_passkey', 'mpesa_consumer_key', 'mpesa_consumer_secret',
        'gateway_secret', 'gateway_token', 'payment_api_key'
    ];

    IF v_role IN ('super_admin', 'ceo') THEN
        FOR v_country_key, v_country_value IN
            SELECT key, value FROM jsonb_each(coalesce(v_row.country_configs, '{}'::jsonb))
        LOOP
            v_configs := v_configs || jsonb_build_object(
                v_country_key,
                v_country_value - ARRAY[
                    'mpesaPasskey', 'mpesaConsumerKey', 'mpesaConsumerSecret',
                    'mpesa_passkey', 'mpesa_consumer_key', 'mpesa_consumer_secret',
                    'gatewaySecret', 'gatewayToken', 'paymentApiKey'
                ]
            );
        END LOOP;
    ELSE
        IF v_country <> '' AND coalesce(v_row.country_configs, '{}'::jsonb) ? v_country THEN
            v_country_value := v_row.country_configs->v_country;
            v_configs := jsonb_build_object(v_country, v_country_value - ARRAY[
                'mpesaPasskey', 'mpesaConsumerKey', 'mpesaConsumerSecret',
                'mpesa_passkey', 'mpesa_consumer_key', 'mpesa_consumer_secret',
                'gatewaySecret', 'gatewayToken', 'paymentApiKey'
            ]);
        END IF;
    END IF;

    RETURN jsonb_set(v_result, '{country_configs}', v_configs, true);
END;
$$;

REVOKE ALL ON FUNCTION public.get_sanitized_system_config() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_sanitized_system_config() TO authenticated, service_role;

-- Remove direct table reads. Keep only the singleton ID visible so an authorized UPDATE
-- can target the row without granting access to settings or stored credentials.
DO $$
DECLARE p record;
BEGIN
    FOR p IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'system_config' AND cmd IN ('SELECT', 'ALL')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.system_config', p.policyname);
    END LOOP;
END;
$$;
REVOKE SELECT ON public.system_config FROM authenticated, anon;
GRANT SELECT (id) ON public.system_config TO authenticated;
CREATE POLICY system_config_id_probe ON public.system_config
    FOR SELECT TO authenticated USING (id = '00000000-0000-0000-0000-000000000001');

-- Replace overlapping legacy update policies with one consistent authorized policy.
DROP POLICY IF EXISTS config_update_authorized ON public.system_config;
DROP POLICY IF EXISTS config_update_ceo_only ON public.system_config;
DROP POLICY IF EXISTS config_write ON public.system_config;
DROP POLICY IF EXISTS config_update ON public.system_config;
DROP POLICY IF EXISTS config_update_admin ON public.system_config;
CREATE POLICY config_update_authorized ON public.system_config
    FOR UPDATE TO authenticated
    USING (
        (SELECT public.is_ceo())
        OR lower(coalesce((SELECT public.get_my_role()), '')) IN ('admin', 'finance_manager')
    )
    WITH CHECK (
        (SELECT public.is_ceo())
        OR lower(coalesce((SELECT public.get_my_role()), '')) IN ('admin', 'finance_manager')
    );

-- Reject changes outside the caller's country partition and protect global identity fields.
CREATE OR REPLACE FUNCTION public.check_system_config_country_sovereignty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
DECLARE
    v_role text := lower(coalesce(public.get_my_role(), ''));
    v_country text := upper(coalesce(public.get_my_country_code_strict(), public.get_my_country_code(), ''));
    v_key text;
BEGIN
    IF v_role IN ('super_admin', 'ceo') THEN
        RETURN NEW;
    END IF;

    IF OLD.store_name IS DISTINCT FROM NEW.store_name
       OR OLD.currency IS DISTINCT FROM NEW.currency
       OR OLD.id IS DISTINCT FROM NEW.id THEN
        RAISE EXCEPTION 'Only CEO or super_admin may change global system settings.';
    END IF;

    IF OLD.country_configs IS DISTINCT FROM NEW.country_configs THEN
        FOR v_key IN
            SELECT key FROM jsonb_object_keys(coalesce(OLD.country_configs, '{}'::jsonb) || coalesce(NEW.country_configs, '{}'::jsonb)) AS key
        LOOP
            IF v_key <> v_country
               AND (OLD.country_configs->v_key IS DISTINCT FROM NEW.country_configs->v_key) THEN
                RAISE EXCEPTION 'Cannot modify settings outside authorized country %.', v_country;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_system_config_sovereignty ON public.system_config;
CREATE TRIGGER trg_enforce_system_config_sovereignty
    BEFORE UPDATE ON public.system_config
    FOR EACH ROW EXECUTE FUNCTION public.check_system_config_country_sovereignty();
