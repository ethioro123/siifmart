-- ============================================
-- ADD MISSING COLUMNS TO po_items TABLE
-- Run this in Supabase SQL Editor (one time)
-- ============================================

-- 1. Pack Quantity (integer)
ALTER TABLE po_items ADD COLUMN IF NOT EXISTS pack_quantity INTEGER DEFAULT 1;

-- 2. Description (text) - stores human-readable attribute summary
ALTER TABLE po_items ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Custom Attributes (JSONB) - stores the full 6-layer enterprise attribute model
ALTER TABLE po_items ADD COLUMN IF NOT EXISTS custom_attributes JSONB;

-- 4. Min/Max Stock (integers)
ALTER TABLE po_items ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0;
ALTER TABLE po_items ADD COLUMN IF NOT EXISTS max_stock INTEGER DEFAULT 0;

-- ============================================
-- ADD MISSING COLUMNS TO products TABLE
-- (Most should already exist, IF NOT EXISTS handles duplicates)
-- ============================================

-- PO enterprise attribute columns on products
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pack_quantity INTEGER DEFAULT 1;
ALTER TABLE products ADD COLUMN IF NOT EXISTS custom_attributes JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS max_stock INTEGER DEFAULT 0;

-- Done! These columns will now persist all PO item details across sessions.
