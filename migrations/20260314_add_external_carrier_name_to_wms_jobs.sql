-- Migration to add external_carrier_name and delivery_method to wms_jobs table
-- Required for external driver integration in Docks Outbound

ALTER TABLE wms_jobs
ADD COLUMN IF NOT EXISTS external_carrier_name TEXT,
ADD COLUMN IF NOT EXISTS delivery_method TEXT;

-- Add comments for documentation
COMMENT ON COLUMN wms_jobs.external_carrier_name IS 'Name of the external carrier company or driver when delivery_method is External';
COMMENT ON COLUMN wms_jobs.delivery_method IS 'Method of delivery/dispatch: Internal (Employee) or External (Carrier)';
