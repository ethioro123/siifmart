
-- Migration: Add old_price to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price NUMERIC;
