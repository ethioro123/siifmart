-- HARDENING SCHEMA TO PREVENT CLUTTER & DUPLICATES
-- (Idempotent Version - Safe to run multiple times)

-- 1. Enable PG_TRGM for better search (optional but recommended)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Products Table Hardening
-- Ensure SKU is unique within a site.
ALTER TABLE products DROP CONSTRAINT IF EXISTS unique_product_sku_per_site;
ALTER TABLE products ADD CONSTRAINT unique_product_sku_per_site UNIQUE (sku, site_id);

-- Add Index for Name Search
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);

-- 3. WMS Jobs Hardening
-- Ensure Job Number is unique within a site.
ALTER TABLE wms_jobs DROP CONSTRAINT IF EXISTS unique_job_number_per_site;
ALTER TABLE wms_jobs ADD CONSTRAINT unique_job_number_per_site UNIQUE (job_number, site_id);

-- 4. Purchase Orders Hardening
-- Ensure PO Number is unique within a site.
ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS unique_po_number_per_site;
ALTER TABLE purchase_orders ADD CONSTRAINT unique_po_number_per_site UNIQUE (po_number, site_id);

-- 5. Foreign Key Checks (Ensure data integrity)
-- Ensure all products belong to a valid site
ALTER TABLE products DROP CONSTRAINT IF EXISTS fk_products_site;
ALTER TABLE products
  ADD CONSTRAINT fk_products_site
  FOREIGN KEY (site_id)
  REFERENCES sites(id)
  ON DELETE CASCADE;

-- Ensure all jobs belong to a valid site
ALTER TABLE wms_jobs DROP CONSTRAINT IF EXISTS fk_wms_jobs_site;
ALTER TABLE wms_jobs
  ADD CONSTRAINT fk_wms_jobs_site
  FOREIGN KEY (site_id)
  REFERENCES sites(id)
  ON DELETE CASCADE;
