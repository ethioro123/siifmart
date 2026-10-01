-- ============================================================================
-- Migration: Add Tax on Selling and Tax on Purchasing Toggles to system_config
-- Date: 2026-10-02
-- Description:
--   1. Adds `tax_on_selling` (BOOLEAN DEFAULT TRUE) to control VAT/Tax on retail sales / POS
--   2. Adds `tax_on_purchasing` (BOOLEAN DEFAULT TRUE) to control VAT/Tax on purchase orders / buying
--   3. Enables operational flexibility to turn VAT/Tax off when buying, selling, or both
-- ============================================================================

ALTER TABLE IF EXISTS public.system_config 
    ADD COLUMN IF NOT EXISTS tax_on_selling BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS tax_on_purchasing BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.system_config.tax_on_selling IS 'Controls whether VAT/Tax is calculated and applied to retail sales and POS checkout';
COMMENT ON COLUMN public.system_config.tax_on_purchasing IS 'Controls whether VAT/Tax is calculated and applied to supplier purchase orders and buying';

-- Ensure default configuration record defaults to true
UPDATE public.system_config
SET 
    tax_on_selling = COALESCE(tax_on_selling, TRUE),
    tax_on_purchasing = COALESCE(tax_on_purchasing, TRUE)
WHERE id = '00000000-0000-0000-0000-000000000001';
