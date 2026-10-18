-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: 20261018_harden_system_config_country_isolation_rls.sql
-- Description: Enforce multi-country isolation and Zero-Trust boundaries for system_config.
--
-- 1. Drops overly broad is_admin() full-row update policy on system_config.
-- 2. Restricts direct system_config UPDATE to CEO (super_admin) only.
-- 3. Adds trigger check_system_config_country_sovereignty() to prevent cross-country tampering.
-- 4. Creates secure RPC update_country_system_config() for authorized regional managers
--    to update ONLY their own national partition within country_configs.
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ensure columns exist in system_config
ALTER TABLE public.system_config 
    ADD COLUMN IF NOT EXISTS country_configs jsonb DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS role_policies jsonb DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS role_permissions jsonb DEFAULT '{}'::jsonb;

-- Drop legacy broad update policies
DROP POLICY IF EXISTS "config_write" ON public.system_config;
DROP POLICY IF EXISTS "config_update" ON public.system_config;
DROP POLICY IF EXISTS "config_update_admin" ON public.system_config;
DROP POLICY IF EXISTS "config_update_ceo_only" ON public.system_config;

-- Restrict full-row system_config UPDATE strictly to CEO / super_admin
CREATE POLICY "config_update_ceo_only" ON public.system_config
    FOR UPDATE TO authenticated
    USING ((select public.is_ceo()))
    WITH CHECK ((select public.is_ceo()));

-- Restrict INSERT on system_config to CEO only
CREATE POLICY "config_insert_ceo_only" ON public.system_config
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_ceo()));

-- Trigger function: Enforce country boundary on any system_config updates
CREATE OR REPLACE FUNCTION public.check_system_config_country_sovereignty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role text;
    v_country text;
    v_target_country text;
BEGIN
    v_role := public.get_my_role();

    -- CEO / Super Admin is exempt from single-country lock
    IF v_role = 'super_admin' THEN
        RETURN NEW;
    END IF;

    -- Non-CEO users cannot modify core global settings directly
    IF OLD.store_name IS DISTINCT FROM NEW.store_name OR
       OLD.currency IS DISTINCT FROM NEW.currency OR
       OLD.id IS DISTINCT FROM NEW.id THEN
        RAISE EXCEPTION 'Database boundary violation: Only CEO can modify global store settings.';
    END IF;

    -- If country_configs changed, ensure non-CEO only modifies their own authorized country
    v_country := COALESCE(public.get_my_country_code_strict(), public.get_my_country_code());

    IF OLD.country_configs IS DISTINCT FROM NEW.country_configs THEN
        FOR v_target_country IN SELECT jsonb_object_keys(NEW.country_configs) LOOP
            IF v_target_country <> v_country AND 
               (OLD.country_configs->v_target_country IS DISTINCT FROM NEW.country_configs->v_target_country) THEN
                RAISE EXCEPTION 'Database boundary violation: Cannot modify configuration for country % (authorized for: %)',
                    v_target_country, v_country;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_system_config_sovereignty ON public.system_config;
CREATE TRIGGER trg_enforce_system_config_sovereignty
    BEFORE UPDATE ON public.system_config
    FOR EACH ROW
    EXECUTE FUNCTION public.check_system_config_country_sovereignty();

-- Secure RPC for Regional Admins: Updates strictly their own national partition
CREATE OR REPLACE FUNCTION public.update_country_system_config(
    p_country text,
    p_country_config jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role text;
    v_user_country text;
    v_current_configs jsonb;
    v_merged_country jsonb;
    v_updated_configs jsonb;
BEGIN
    v_role := public.get_my_role();
    v_user_country := COALESCE(public.get_my_country_code_strict(), public.get_my_country_code());

    -- Authorization check: CEO or authorized admin for this country
    IF NOT (v_role = 'super_admin' OR (public.is_admin() AND v_user_country = p_country)) THEN
        RAISE EXCEPTION 'Access denied: You are not authorized to update configuration for country %', p_country;
    END IF;

    -- Fetch current country_configs
    SELECT COALESCE(country_configs, '{}'::jsonb)
    INTO v_current_configs
    FROM public.system_config
    WHERE id = '00000000-0000-0000-0000-000000000001';

    -- Merge the new configuration into the specified country partition
    v_merged_country := COALESCE(v_current_configs->p_country, '{}'::jsonb) || p_country_config;
    v_updated_configs := jsonb_set(
        COALESCE(v_current_configs, '{}'::jsonb),
        ARRAY[p_country],
        v_merged_country
    );

    UPDATE public.system_config
    SET country_configs = v_updated_configs,
        updated_at = now(),
        updated_by = COALESCE(auth.uid()::text, 'System')
    WHERE id = '00000000-0000-0000-0000-000000000001';

    RETURN v_merged_country;
END;
$$;

REVOKE ALL ON FUNCTION public.update_country_system_config(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_country_system_config(text, jsonb) TO authenticated, service_role;
