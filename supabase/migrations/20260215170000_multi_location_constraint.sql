-- Idempotent Migration for Multi-Location Inventory
-- This script safely removes old constraints and establishes the new multi-location logic.

-- 1. Drop the old restrictive constraint (if it exists)
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_sku_site_unique;

-- 2. Drop the incorrect name constraint from my first attempt (if it exists)
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS unique_product_sku_per_site;

-- 3. Drop the new constraint if it partially exists (to ensure clean recreation)
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS unique_product_sku_site_location;

-- 4. Create the new composite unique constraint
-- This allows the same SKU to exist multiple times at a site, as long as the location is different.
ALTER TABLE public.products
ADD CONSTRAINT unique_product_sku_site_location 
UNIQUE (sku, site_id, location);
