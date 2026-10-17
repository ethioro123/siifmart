-- ============================================================================
-- Migration: Add Tax on Selling and Tax on Purchasing Toggles to system_config
-- Date: 2026-10-17
-- Description:
--   1. Adds `tax_on_selling` (BOOLEAN DEFAULT FALSE) to control VAT/Tax on retail sales / POS
--   2. Adds `tax_on_purchasing` (BOOLEAN DEFAULT FALSE) to control VAT/Tax on purchase orders / buying
--   3. Guarantees that sales tax and procurement tax default to OFF (false) until explicitly enabled
-- ============================================================================

ALTER TABLE IF EXISTS public.system_config 
    ADD COLUMN IF NOT EXISTS tax_on_selling BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS tax_on_purchasing BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.system_config.tax_on_selling IS 'Controls whether VAT/Tax is calculated and applied to retail sales and POS checkout';
COMMENT ON COLUMN public.system_config.tax_on_purchasing IS 'Controls whether VAT/Tax is calculated and applied to supplier purchase orders and buying';

UPDATE public.system_config
SET 
    tax_on_selling = COALESCE(tax_on_selling, FALSE),
    tax_on_purchasing = COALESCE(tax_on_purchasing, FALSE)
WHERE id = '00000000-0000-0000-0000-000000000001';
