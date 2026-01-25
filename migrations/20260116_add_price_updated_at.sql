
-- Migration: Add price_updated_at to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS price_updated_at TIMESTAMPTZ;
