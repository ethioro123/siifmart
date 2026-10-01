-- Migration: 20260929_add_currency_to_purchase_orders.sql
-- Description: Add currency column to purchase_orders table for multi-country tenant isolation (ETB for Ethiopia, KSh for Kenya, USh for Uganda, etc.)

ALTER TABLE public.purchase_orders 
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'ETB';

-- Backfill existing orders based on destination site currency if available
UPDATE public.purchase_orders po
SET currency = COALESCE(s.currency, 'ETB')
FROM public.sites s
WHERE po.site_id = s.id AND (po.currency IS NULL OR po.currency = '');

-- Ensure fallback default for any remaining records
UPDATE public.purchase_orders
SET currency = 'ETB'
WHERE currency IS NULL OR currency = '';
