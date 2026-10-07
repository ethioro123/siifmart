-- ==============================================================================
-- Migration: Purge all 0-stock 'On Order' ghost product placeholders and duplicates
-- Date: October 8, 2026
-- Instruction: Run this script directly in the Supabase SQL Editor.
-- ==============================================================================

-- 1. Remove 0-stock ghost product placeholders where an active stock product exists for the same SKU & site
DELETE FROM public.products p1
WHERE (p1.location = 'On Order' OR p1.location IS NULL OR TRIM(p1.location) = '')
  AND (p1.stock = 0 OR p1.stock IS NULL)
  AND EXISTS (
      SELECT 1 FROM public.products p2
      WHERE p2.site_id = p1.site_id
        AND REPLACE(UPPER(p2.sku), '-', '') = REPLACE(UPPER(p1.sku), '-', '')
        AND p2.id <> p1.id
        AND ((p2.stock > 0) OR (p2.location IS NOT NULL AND p2.location <> 'On Order' AND TRIM(p2.location) <> ''))
  );

-- 2. Specifically purge duplicate 'KEGR001' (Juma Ugali Flour 1kg) 0-stock 'On Order' ghost record if still present
DELETE FROM public.products
WHERE REPLACE(UPPER(sku), '-', '') = 'KEGR001'
  AND (location = 'On Order' OR location IS NULL OR TRIM(location) = '')
  AND (stock = 0 OR stock IS NULL)
  AND EXISTS (
      SELECT 1 FROM public.products p2
      WHERE REPLACE(UPPER(p2.sku), '-', '') = 'KEGR001'
        AND p2.id <> products.id
  );
