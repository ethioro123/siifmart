-- Migration: Inbound Receiving Policy, Over-Receive Tolerance & Price Tag Strategy
-- Date: 2026-10-03
-- Purpose:
--   1. Adds country-controllable inbound columns to system_config
--   2. over_receive_tolerance_pct: Configurable over-receive tolerance (0% default for zero-trust)
--   3. po_price_apply_at: 'putaway' (default, updates price only when shelved) or 'receive' (immediate)
--   4. print_price_tag_at: 'store' (default, shelf tags in POS Command) or 'putaway' or 'receive'

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'system_config' AND column_name = 'over_receive_tolerance_pct'
    ) THEN
        ALTER TABLE system_config ADD COLUMN over_receive_tolerance_pct NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'system_config' AND column_name = 'po_price_apply_at'
    ) THEN
        ALTER TABLE system_config ADD COLUMN po_price_apply_at TEXT DEFAULT 'putaway';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'system_config' AND column_name = 'print_price_tag_at'
    ) THEN
        ALTER TABLE system_config ADD COLUMN print_price_tag_at TEXT DEFAULT 'store';
    END IF;
END $$;
