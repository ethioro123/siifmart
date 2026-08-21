-- Migration: Purge all legacy hyphenated SKUs and 0-stock 'On Order' ghost product placeholders
-- Run this in Supabase SQL Editor to permanently clean up product records

-- 1. Remove 0-stock ghost product placeholders where an active stock product exists for the same SKU & site
DELETE FROM public.products p1
WHERE p1.location = 'On Order'
  AND p1.stock = 0
  AND EXISTS (
      SELECT 1 FROM public.products p2
      WHERE p2.site_id = p1.site_id
        AND REPLACE(UPPER(p2.sku), '-', '') = REPLACE(UPPER(p1.sku), '-', '')
        AND p2.id <> p1.id
        AND p2.stock > 0
  );

-- 2. Delete any product records with hyphenated SKUs like 'PA-0001' if stock is 0
DELETE FROM public.products
WHERE sku ~* '-'
  AND stock = 0;

-- 3. Unhyphenate any remaining active products with hyphens in SKU
UPDATE public.products
SET sku = REPLACE(sku, '-', '')
WHERE sku LIKE '%-%';
