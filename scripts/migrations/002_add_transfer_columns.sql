-- ADD MISSING COLUMNS FOR WMS TRANSFERS
-- These columns are required for the new Transfer/Bulk Distribution workflow

ALTER TABLE wms_jobs ADD COLUMN IF NOT EXISTS source_site_id UUID REFERENCES sites(id);
ALTER TABLE wms_jobs ADD COLUMN IF NOT EXISTS dest_site_id UUID REFERENCES sites(id);
ALTER TABLE wms_jobs ADD COLUMN IF NOT EXISTS transfer_status TEXT;
ALTER TABLE wms_jobs ADD COLUMN IF NOT EXISTS requested_by TEXT;
ALTER TABLE wms_jobs ADD COLUMN IF NOT EXISTS approved_by TEXT;
ALTER TABLE wms_jobs ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE wms_jobs ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;

-- Allow source_site_id and dest_site_id to be nullable (since not all jobs are transfers)
-- but for consistency we might want to index them
CREATE INDEX IF NOT EXISTS idx_wms_jobs_source_site ON wms_jobs(source_site_id);
CREATE INDEX IF NOT EXISTS idx_wms_jobs_dest_site ON wms_jobs(dest_site_id);
