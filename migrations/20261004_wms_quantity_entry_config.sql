-- ==============================================================================
-- Migration: Add Zero-Trust WMS Explicit Quantity Entry Settings to system_config
-- Created: 2026-10-04
-- Author: SIIFMART Zero-Trust Architecture
-- Description:
--   Adds config-gated toggles for requiring explicit physical quantity entry
--   during WMS Pick and Putaway scanning workflows.
--   Enforces Zero-Trust Rule 4 & Rule 6 (prevents rubber-stamping & auto-crediting).
-- ==============================================================================

ALTER TABLE IF EXISTS public.system_config
    ADD COLUMN IF NOT EXISTS require_putaway_quantity_entry BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS require_pick_quantity_entry BOOLEAN DEFAULT true;

COMMENT ON COLUMN public.system_config.require_putaway_quantity_entry IS 
    'Zero-Trust WMS: If true, requires operator to explicitly count and input units placed in bay rather than auto-crediting expected quantity.';

COMMENT ON COLUMN public.system_config.require_pick_quantity_entry IS 
    'Zero-Trust WMS: If true, requires picker to explicitly count and input units picked rather than auto-crediting expected quantity on single scan.';
