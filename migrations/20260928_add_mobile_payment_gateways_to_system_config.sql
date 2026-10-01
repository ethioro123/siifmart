-- ============================================================================
-- Migration: Add Mobile Payment Gateways Configuration to system_config
-- Date: 2026-09-28
-- Description:
--   1. Adds Kenya Mobile Gateway columns (Lipa Na M-Pesa Till, STK Push Express, Paybill, Airtel Money)
--   2. Adds Ethiopia Mobile Gateway columns (Telebirr, CBE Birr)
--   3. Enables granular activation and credential management from POS Settings
-- ============================================================================

ALTER TABLE IF EXISTS public.system_config 
    -- Kenya Gateways
    ADD COLUMN IF NOT EXISTS mpesa_till_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS mpesa_till_number TEXT DEFAULT '882910',
    ADD COLUMN IF NOT EXISTS mpesa_till_name TEXT DEFAULT 'SIIFMART MAIN STORE',
    ADD COLUMN IF NOT EXISTS mpesa_stk_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS mpesa_stk_shortcode TEXT DEFAULT '174379',
    ADD COLUMN IF NOT EXISTS mpesa_passkey TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS mpesa_consumer_key TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS mpesa_consumer_secret TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS mpesa_environment TEXT DEFAULT 'sandbox',
    ADD COLUMN IF NOT EXISTS mpesa_paybill_enabled BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS mpesa_paybill_number TEXT DEFAULT '400200',
    ADD COLUMN IF NOT EXISTS mpesa_paybill_account TEXT DEFAULT 'SIIFMART',
    ADD COLUMN IF NOT EXISTS airtel_money_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS airtel_till_number TEXT DEFAULT '554433',
    ADD COLUMN IF NOT EXISTS airtel_merchant_name TEXT DEFAULT 'SIIFMART AIRTEL',
    -- Ethiopia Gateways
    ADD COLUMN IF NOT EXISTS telebirr_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS telebirr_merchant_id TEXT DEFAULT 'TB-998811',
    ADD COLUMN IF NOT EXISTS cbe_birr_enabled BOOLEAN DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS cbe_birr_merchant_code TEXT DEFAULT 'CBE-445566';

COMMENT ON COLUMN public.system_config.mpesa_till_enabled IS 'Toggle for Safaricom Lipa Na M-Pesa Buy Goods & Services Till';
COMMENT ON COLUMN public.system_config.mpesa_stk_enabled IS 'Toggle for Safaricom M-Pesa STK Push Express (Daraja API)';
COMMENT ON COLUMN public.system_config.airtel_money_enabled IS 'Toggle for Airtel Money Lipa Till';
COMMENT ON COLUMN public.system_config.telebirr_enabled IS 'Toggle for Ethio Telecom Telebirr mobile wallet';
COMMENT ON COLUMN public.system_config.cbe_birr_enabled IS 'Toggle for Commercial Bank of Ethiopia CBE Birr';
