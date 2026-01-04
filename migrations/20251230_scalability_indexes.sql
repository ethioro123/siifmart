-- CRITICAL SCALABILITY INDEXES
-- These indexes are required to support high-volume queries with sorting and filtering.
-- Without them, the LIMIT clause still requires a full table sort/scan.

-- 1. SALES PERFORMANCE
-- Most common query: select * from sales where site_id = ? order by sale_date desc limit 100
CREATE INDEX IF NOT EXISTS idx_sales_site_date ON sales(site_id, sale_date DESC);
-- For global HQ dashboard (no site filter)
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date DESC);

-- 2. WMS JOBS PERFORMANCE
-- Most common query: select * from wms_jobs where site_id = ? order by created_at desc limit 100
CREATE INDEX IF NOT EXISTS idx_wms_jobs_site_created ON wms_jobs(site_id, created_at DESC);
-- For finding recent jobs globally
CREATE INDEX IF NOT EXISTS idx_wms_jobs_created ON wms_jobs(created_at DESC);
-- For filtering by type (e.g., finding next job number efficiency)
CREATE INDEX IF NOT EXISTS idx_wms_jobs_type_created ON wms_jobs(type, created_at DESC);

-- 3. STOCK MOVEMENT PERFORMANCE
-- While we disabled realtime, we still query history.
-- Access pattern: select * from stock_movements where site_id = ? order by date desc
CREATE INDEX IF NOT EXISTS idx_stock_movements_site_date ON stock_movements(site_id, date DESC);

-- 4. PRODUCTS PERFORMANCE
-- Access pattern: select * from products where site_id = ?
CREATE INDEX IF NOT EXISTS idx_products_site ON products(site_id);
