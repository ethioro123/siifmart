-- ============================================================================
-- Site ID Standardization Migration
-- ============================================================================
-- This script migrates from old site IDs to new standardized format:
-- HQ-001 -> HQ
-- SITE-001 -> WH-001 (Warehouse)
-- SITE-002 -> ST-001 (Store)
-- SITE-003 -> ST-002 (Store)
-- etc.
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Update Sites Table
-- ============================================================================

UPDATE sites SET id = 'HQ' WHERE id = 'HQ-001';
UPDATE sites SET id = 'WH-001' WHERE id = 'SITE-001';
UPDATE sites SET id = 'ST-001' WHERE id = 'SITE-002';
UPDATE sites SET id = 'ST-002' WHERE id = 'SITE-003';
UPDATE sites SET id = 'ST-003' WHERE id = 'SITE-004';
UPDATE sites SET id = 'ST-004' WHERE id = 'SITE-005';
UPDATE sites SET id = 'ST-005' WHERE id = 'SITE-006';
UPDATE sites SET id = 'ST-006' WHERE id = 'SITE-007';

-- Update code field to match id
UPDATE sites SET code = 'HQ' WHERE id = 'HQ';
UPDATE sites SET code = 'WH-001' WHERE id = 'WH-001';
UPDATE sites SET code = 'ST-001' WHERE id = 'ST-001';
UPDATE sites SET code = 'ST-002' WHERE id = 'ST-002';
UPDATE sites SET code = 'ST-003' WHERE id = 'ST-003';
UPDATE sites SET code = 'ST-004' WHERE id = 'ST-004';
UPDATE sites SET code = 'ST-005' WHERE id = 'ST-005';
UPDATE sites SET code = 'ST-006' WHERE id = 'ST-006';

-- ============================================================================
-- STEP 2: Update Products Table
-- ============================================================================

UPDATE products SET site_id = 'HQ' WHERE site_id = 'HQ-001';
UPDATE products SET site_id = 'WH-001' WHERE site_id = 'SITE-001';
UPDATE products SET site_id = 'ST-001' WHERE site_id = 'SITE-002';
UPDATE products SET site_id = 'ST-002' WHERE site_id = 'SITE-003';
UPDATE products SET site_id = 'ST-003' WHERE site_id = 'SITE-004';
UPDATE products SET site_id = 'ST-004' WHERE site_id = 'SITE-005';
UPDATE products SET site_id = 'ST-005' WHERE site_id = 'SITE-006';
UPDATE products SET site_id = 'ST-006' WHERE site_id = 'SITE-007';

-- ============================================================================
-- STEP 3: Update Employees Table
-- ============================================================================

UPDATE employees SET site_id = 'HQ' WHERE site_id = 'HQ-001';
UPDATE employees SET site_id = 'WH-001' WHERE site_id = 'SITE-001';
UPDATE employees SET site_id = 'ST-001' WHERE site_id = 'SITE-002';
UPDATE employees SET site_id = 'ST-002' WHERE site_id = 'SITE-003';
UPDATE employees SET site_id = 'ST-003' WHERE site_id = 'SITE-004';
UPDATE employees SET site_id = 'ST-004' WHERE site_id = 'SITE-005';
UPDATE employees SET site_id = 'ST-005' WHERE site_id = 'SITE-006';
UPDATE employees SET site_id = 'ST-006' WHERE site_id = 'SITE-007';

-- ============================================================================
-- STEP 4: Update Sales Table
-- ============================================================================

UPDATE sales SET site_id = 'HQ' WHERE site_id = 'HQ-001';
UPDATE sales SET site_id = 'WH-001' WHERE site_id = 'SITE-001';
UPDATE sales SET site_id = 'ST-001' WHERE site_id = 'SITE-002';
UPDATE sales SET site_id = 'ST-002' WHERE site_id = 'SITE-003';
UPDATE sales SET site_id = 'ST-003' WHERE site_id = 'SITE-004';
UPDATE sales SET site_id = 'ST-004' WHERE site_id = 'SITE-005';
UPDATE sales SET site_id = 'ST-005' WHERE site_id = 'SITE-006';
UPDATE sales SET site_id = 'ST-006' WHERE site_id = 'SITE-007';

-- ============================================================================
-- STEP 5: Update Purchase Orders Table
-- ============================================================================

UPDATE purchase_orders SET site_id = 'HQ' WHERE site_id = 'HQ-001';
UPDATE purchase_orders SET site_id = 'WH-001' WHERE site_id = 'SITE-001';
UPDATE purchase_orders SET site_id = 'ST-001' WHERE site_id = 'SITE-002';
UPDATE purchase_orders SET site_id = 'ST-002' WHERE site_id = 'SITE-003';
UPDATE purchase_orders SET site_id = 'ST-003' WHERE site_id = 'SITE-004';
UPDATE purchase_orders SET site_id = 'ST-004' WHERE site_id = 'SITE-005';
UPDATE purchase_orders SET site_id = 'ST-005' WHERE site_id = 'SITE-006';
UPDATE purchase_orders SET site_id = 'ST-006' WHERE site_id = 'SITE-007';

-- ============================================================================
-- STEP 6: Update WMS Jobs Table
-- ============================================================================

UPDATE wms_jobs SET site_id = 'HQ' WHERE site_id = 'HQ-001';
UPDATE wms_jobs SET site_id = 'WH-001' WHERE site_id = 'SITE-001';
UPDATE wms_jobs SET site_id = 'ST-001' WHERE site_id = 'SITE-002';
UPDATE wms_jobs SET site_id = 'ST-002' WHERE site_id = 'SITE-003';
UPDATE wms_jobs SET site_id = 'ST-003' WHERE site_id = 'SITE-004';
UPDATE wms_jobs SET site_id = 'ST-004' WHERE site_id = 'SITE-005';
UPDATE wms_jobs SET site_id = 'ST-005' WHERE site_id = 'SITE-006';
UPDATE wms_jobs SET site_id = 'ST-006' WHERE site_id = 'SITE-007';

-- Update source_site_id
UPDATE wms_jobs SET source_site_id = 'HQ' WHERE source_site_id = 'HQ-001';
UPDATE wms_jobs SET source_site_id = 'WH-001' WHERE source_site_id = 'SITE-001';
UPDATE wms_jobs SET source_site_id = 'ST-001' WHERE source_site_id = 'SITE-002';
UPDATE wms_jobs SET source_site_id = 'ST-002' WHERE source_site_id = 'SITE-003';
UPDATE wms_jobs SET source_site_id = 'ST-003' WHERE source_site_id = 'SITE-004';
UPDATE wms_jobs SET source_site_id = 'ST-004' WHERE source_site_id = 'SITE-005';
UPDATE wms_jobs SET source_site_id = 'ST-005' WHERE source_site_id = 'SITE-006';
UPDATE wms_jobs SET source_site_id = 'ST-006' WHERE source_site_id = 'SITE-007';

-- Update dest_site_id
UPDATE wms_jobs SET dest_site_id = 'HQ' WHERE dest_site_id = 'HQ-001';
UPDATE wms_jobs SET dest_site_id = 'WH-001' WHERE dest_site_id = 'SITE-001';
UPDATE wms_jobs SET dest_site_id = 'ST-001' WHERE dest_site_id = 'SITE-002';
UPDATE wms_jobs SET dest_site_id = 'ST-002' WHERE dest_site_id = 'SITE-003';
UPDATE wms_jobs SET dest_site_id = 'ST-003' WHERE dest_site_id = 'SITE-004';
UPDATE wms_jobs SET dest_site_id = 'ST-004' WHERE dest_site_id = 'SITE-005';
UPDATE wms_jobs SET dest_site_id = 'ST-005' WHERE dest_site_id = 'SITE-006';
UPDATE wms_jobs SET dest_site_id = 'ST-006' WHERE dest_site_id = 'SITE-007';

-- ============================================================================
-- STEP 7: Update Transfers Table
-- ============================================================================

-- Update source_site_id
UPDATE transfers SET source_site_id = 'HQ' WHERE source_site_id = 'HQ-001';
UPDATE transfers SET source_site_id = 'WH-001' WHERE source_site_id = 'SITE-001';
UPDATE transfers SET source_site_id = 'ST-001' WHERE source_site_id = 'SITE-002';
UPDATE transfers SET source_site_id = 'ST-002' WHERE source_site_id = 'SITE-003';
UPDATE transfers SET source_site_id = 'ST-003' WHERE source_site_id = 'SITE-004';
UPDATE transfers SET source_site_id = 'ST-004' WHERE source_site_id = 'SITE-005';
UPDATE transfers SET source_site_id = 'ST-005' WHERE source_site_id = 'SITE-006';
UPDATE transfers SET source_site_id = 'ST-006' WHERE source_site_id = 'SITE-007';

-- Update dest_site_id
UPDATE transfers SET dest_site_id = 'HQ' WHERE dest_site_id = 'HQ-001';
UPDATE transfers SET dest_site_id = 'WH-001' WHERE dest_site_id = 'SITE-001';
UPDATE transfers SET dest_site_id = 'ST-001' WHERE dest_site_id = 'SITE-002';
UPDATE transfers SET dest_site_id = 'ST-002' WHERE dest_site_id = 'SITE-003';
UPDATE transfers SET dest_site_id = 'ST-003' WHERE dest_site_id = 'SITE-004';
UPDATE transfers SET dest_site_id = 'ST-004' WHERE dest_site_id = 'SITE-005';
UPDATE transfers SET dest_site_id = 'ST-005' WHERE dest_site_id = 'SITE-006';
UPDATE transfers SET dest_site_id = 'ST-006' WHERE dest_site_id = 'SITE-007';

-- ============================================================================
-- STEP 8: Update Stock Movements Table
-- ============================================================================

UPDATE stock_movements SET site_id = 'HQ' WHERE site_id = 'HQ-001';
UPDATE stock_movements SET site_id = 'WH-001' WHERE site_id = 'SITE-001';
UPDATE stock_movements SET site_id = 'ST-001' WHERE site_id = 'SITE-002';
UPDATE stock_movements SET site_id = 'ST-002' WHERE site_id = 'SITE-003';
UPDATE stock_movements SET site_id = 'ST-003' WHERE site_id = 'SITE-004';
UPDATE stock_movements SET site_id = 'ST-004' WHERE site_id = 'SITE-005';
UPDATE stock_movements SET site_id = 'ST-005' WHERE site_id = 'SITE-006';
UPDATE stock_movements SET site_id = 'ST-006' WHERE site_id = 'SITE-007';

-- ============================================================================
-- STEP 9: Update Expenses Table
-- ============================================================================

UPDATE expenses SET site_id = 'HQ' WHERE site_id = 'HQ-001';
UPDATE expenses SET site_id = 'WH-001' WHERE site_id = 'SITE-001';
UPDATE expenses SET site_id = 'ST-001' WHERE site_id = 'SITE-002';
UPDATE expenses SET site_id = 'ST-002' WHERE site_id = 'SITE-003';
UPDATE expenses SET site_id = 'ST-003' WHERE site_id = 'SITE-004';
UPDATE expenses SET site_id = 'ST-004' WHERE site_id = 'SITE-005';
UPDATE expenses SET site_id = 'ST-005' WHERE site_id = 'SITE-006';
UPDATE expenses SET site_id = 'ST-006' WHERE site_id = 'SITE-007';

-- ============================================================================
-- STEP 10: Update Job Assignments Table (if exists)
-- ============================================================================

UPDATE job_assignments SET site_id = 'HQ' WHERE site_id = 'HQ-001';
UPDATE job_assignments SET site_id = 'WH-001' WHERE site_id = 'SITE-001';
UPDATE job_assignments SET site_id = 'ST-001' WHERE site_id = 'SITE-002';
UPDATE job_assignments SET site_id = 'ST-002' WHERE site_id = 'SITE-003';
UPDATE job_assignments SET site_id = 'ST-003' WHERE site_id = 'SITE-004';
UPDATE job_assignments SET site_id = 'ST-004' WHERE site_id = 'SITE-005';
UPDATE job_assignments SET site_id = 'ST-005' WHERE site_id = 'SITE-006';
UPDATE job_assignments SET site_id = 'ST-006' WHERE site_id = 'SITE-007';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count records by new site IDs
SELECT 'Sites' as table_name, id, name FROM sites ORDER BY id;
SELECT 'Products' as table_name, site_id, COUNT(*) as count FROM products GROUP BY site_id ORDER BY site_id;
SELECT 'Employees' as table_name, site_id, COUNT(*) as count FROM employees GROUP BY site_id ORDER BY site_id;
SELECT 'Sales' as table_name, site_id, COUNT(*) as count FROM sales GROUP BY site_id ORDER BY site_id;
SELECT 'Purchase Orders' as table_name, site_id, COUNT(*) as count FROM purchase_orders GROUP BY site_id ORDER BY site_id;
SELECT 'WMS Jobs' as table_name, site_id, COUNT(*) as count FROM wms_jobs GROUP BY site_id ORDER BY site_id;

-- Check for any remaining old site IDs (should return 0 rows)
SELECT 'Old IDs in products' as check_name, COUNT(*) as count FROM products WHERE site_id LIKE 'SITE-%' OR site_id = 'HQ-001';
SELECT 'Old IDs in employees' as check_name, COUNT(*) as count FROM employees WHERE site_id LIKE 'SITE-%' OR site_id = 'HQ-001';
SELECT 'Old IDs in sales' as check_name, COUNT(*) as count FROM sales WHERE site_id LIKE 'SITE-%' OR site_id = 'HQ-001';

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (Run this if you need to revert)
-- ============================================================================
/*
BEGIN;

-- Revert Sites
UPDATE sites SET id = 'HQ-001' WHERE id = 'HQ';
UPDATE sites SET id = 'SITE-001' WHERE id = 'WH-001';
UPDATE sites SET id = 'SITE-002' WHERE id = 'ST-001';
UPDATE sites SET id = 'SITE-003' WHERE id = 'ST-002';
UPDATE sites SET id = 'SITE-004' WHERE id = 'ST-003';
UPDATE sites SET id = 'SITE-005' WHERE id = 'ST-004';
UPDATE sites SET id = 'SITE-006' WHERE id = 'ST-005';
UPDATE sites SET id = 'SITE-007' WHERE id = 'ST-006';

-- Revert Products
UPDATE products SET site_id = 'HQ-001' WHERE site_id = 'HQ';
UPDATE products SET site_id = 'SITE-001' WHERE site_id = 'WH-001';
UPDATE products SET site_id = 'SITE-002' WHERE site_id = 'ST-001';
UPDATE products SET site_id = 'SITE-003' WHERE site_id = 'ST-002';
UPDATE products SET site_id = 'SITE-004' WHERE site_id = 'ST-003';
UPDATE products SET site_id = 'SITE-005' WHERE site_id = 'ST-004';
UPDATE products SET site_id = 'SITE-006' WHERE site_id = 'ST-005';
UPDATE products SET site_id = 'SITE-007' WHERE site_id = 'ST-006';

-- (Continue for all other tables...)

COMMIT;
*/
