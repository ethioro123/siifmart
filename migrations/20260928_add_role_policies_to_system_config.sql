-- ============================================================================
-- Migration: Add Role Security Policies and Permissions to system_config
-- Date: 2026-09-28
-- Description:
--   1. Ensures country_configs JSONB column exists on public.system_config
--   2. Adds role_policies JSONB column for MFA, session timeout & IP/time fencing
--   3. Adds role_permissions JSONB column for action-level Zero-Trust access grants
-- ============================================================================

ALTER TABLE IF EXISTS public.system_config 
    ADD COLUMN IF NOT EXISTS country_configs JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS role_policies JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS role_permissions JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.system_config.country_configs IS 'Per-country operational settings partitions (ET, KE, etc.)';
COMMENT ON COLUMN public.system_config.role_policies IS 'Corporate Zero-Trust role security policies (MFA, session timeout, fencing)';
COMMENT ON COLUMN public.system_config.role_permissions IS 'Role access control permissions and Zero-Trust authority overrides';
