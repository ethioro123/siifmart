-- Retention Policy: Keep only the 2000 most recent records per site
-- This ensures the DB doesn't grow indefinitely while meeting the 2000 record requirement.

-- 1. Function to trim WMS Jobs
CREATE OR REPLACE FUNCTION trim_wms_jobs()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM wms_jobs
    WHERE id IN (
        SELECT id
        FROM wms_jobs
        WHERE site_id = NEW.site_id
        ORDER BY created_at DESC
        OFFSET 2000
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger for WMS Jobs
DROP TRIGGER IF EXISTS tr_trim_wms_jobs ON wms_jobs;
CREATE TRIGGER tr_trim_wms_jobs
AFTER INSERT ON wms_jobs
FOR EACH ROW
EXECUTE FUNCTION trim_wms_jobs();

-- 3. Function to trim Stock Movements
CREATE OR REPLACE FUNCTION trim_stock_movements()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM stock_movements
    WHERE id IN (
        SELECT id
        FROM stock_movements
        WHERE site_id = NEW.site_id
        ORDER BY movement_date DESC
        OFFSET 2000
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger for Stock Movements
DROP TRIGGER IF EXISTS tr_trim_stock_movements ON stock_movements;
CREATE TRIGGER tr_trim_stock_movements
AFTER INSERT ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION trim_stock_movements();
