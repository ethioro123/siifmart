-- ============================================================================
-- Migration: 20261014_purge_test_products.sql
-- Description: Purges mock and E2E test products and their referenced mock
--              PO items & stock adjustments to maintain clean master catalogs.
-- ============================================================================

-- 1. Remove mock PO line items referencing test products
DELETE FROM po_items 
WHERE product_id IN (
  SELECT id FROM products 
  WHERE sku ~* '^(TESTSKU|VERIFYSKU|E2E)' OR category = 'Test'
);

-- 2. Remove mock stock adjustments referencing test products
DELETE FROM stock_movements 
WHERE product_id IN (
  SELECT id FROM products 
  WHERE sku ~* '^(TESTSKU|VERIFYSKU|E2E)' OR category = 'Test'
);

-- 3. Delete the test products
DELETE FROM products 
WHERE sku ~* '^(TESTSKU|VERIFYSKU|E2E)' OR category = 'Test';

-- 4. Clean up any test records in product_master if created
DELETE FROM product_master 
WHERE sku ~* '^(TESTSKU|VERIFYSKU|E2E)' OR category = 'Test';
