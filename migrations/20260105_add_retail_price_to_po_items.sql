-- Migration: Add retail_price column to po_items table
-- Run this in your Supabase SQL Editor

-- Add retail_price column if it doesn't exist
ALTER TABLE po_items ADD COLUMN IF NOT EXISTS retail_price DECIMAL(12,2) DEFAULT 0;

-- Also ensure image, brand, size, unit, category columns exist for full item data
ALTER TABLE po_items ADD COLUMN IF NOT EXISTS image TEXT;
ALTER TABLE po_items ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE po_items ADD COLUMN IF NOT EXISTS size TEXT;
ALTER TABLE po_items ADD COLUMN IF NOT EXISTS unit TEXT;
ALTER TABLE po_items ADD COLUMN IF NOT EXISTS category TEXT;
