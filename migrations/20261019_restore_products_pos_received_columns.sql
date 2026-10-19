-- Restore POS receiving audit columns on products.
--
-- The app (transfer receiving, POS receiving, stock list, realtime mapper) reads and writes
-- products.pos_received_at / products.pos_received_by, but the live schema no longer has them
-- (the original migrations/add_pos_received_fields.sql was never carried into the current
-- schema). Updates that include them failed with PGRST204 "column not found", halting transfer
-- receipts. Additive and idempotent.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pos_received_at timestamptz;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pos_received_by text;

CREATE INDEX IF NOT EXISTS idx_products_pos_received_at
    ON public.products (pos_received_at)
    WHERE pos_received_at IS NOT NULL;
