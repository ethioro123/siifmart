-- ==============================================================================
-- Migration: Add Zero-Trust Cycle Count Hardening & Pack Security Policies
-- Date: 2026-10-04
-- Author: SIIFMART Zero-Trust Architecture
-- Description:
--   Adds config-gated columns to system_config for:
--   1. Cycle Count Blindness & Recount Caps (max_cycle_count_recounts, require_second_counter_on_variance)
--   2. Pack Security & Tamper Protection (require_pack_security_seal, require_pack_carton_weight, pack_weight_tolerance_pct)
--   Enforces Zero-Trust Rule 3, Rule 4, Rule 6 & Rule 18.
-- ==============================================================================

ALTER TABLE IF EXISTS public.system_config
    ADD COLUMN IF NOT EXISTS max_cycle_count_recounts INT DEFAULT 1,
    ADD COLUMN IF NOT EXISTS require_second_counter_on_variance BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS require_pack_security_seal BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS require_pack_carton_weight BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS pack_weight_tolerance_pct NUMERIC DEFAULT 5;

COMMENT ON COLUMN public.system_config.max_cycle_count_recounts IS 
    'Zero-Trust Count: Maximum number of blind recounts allowed on a single item before locking variance for HQ review.';

COMMENT ON COLUMN public.system_config.require_second_counter_on_variance IS 
    'Zero-Trust Count: If true, recounts on variance items require a second counter / supervisor co-sign (4-Eyes principle).';

COMMENT ON COLUMN public.system_config.require_pack_security_seal IS 
    'Zero-Trust Pack: If true, requires serial number capture for tamper-evident security seal before box closure.';

COMMENT ON COLUMN public.system_config.require_pack_carton_weight IS 
    'Zero-Trust Pack: If true, requires scale weight check against calculated SKU mass before shipping label print.';

COMMENT ON COLUMN public.system_config.pack_weight_tolerance_pct IS 
    'Zero-Trust Pack: Permitted percentage variance between scale weight and expected SKU total weight (default: 5%).';

NOTIFY pgrst, 'reload schema';
