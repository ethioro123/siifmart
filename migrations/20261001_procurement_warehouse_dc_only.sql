-- ==============================================================================
-- Migration: Enforce Procurement Routing Exclusively to Warehouse or DC
-- Description:
--   1. Implements database-level zero-trust trigger preventing purchase orders 
--      from being assigned to retail Stores or Administration offices.
--   2. Verifies and standardizes country-scoped human-readable site codes 
--      for Kenya (KE-01, KE-02, KE-03...) and all regional branches.
-- ==============================================================================

-- 1. Zero-Trust Trigger: Purchase Orders must route strictly to Warehouse or Distribution Center
CREATE OR REPLACE FUNCTION check_po_destination_is_warehouse_or_dc()
RETURNS TRIGGER AS $$
DECLARE
    v_site_type text;
    v_site_name text;
BEGIN
    IF NEW.site_id IS NOT NULL THEN
        SELECT type, name INTO v_site_type, v_site_name 
        FROM sites 
        WHERE id = NEW.site_id;

        IF v_site_type IS NOT NULL AND v_site_type NOT IN ('Warehouse', 'Distribution Center') THEN
            RAISE EXCEPTION 'Procurement policy violation: Purchase orders can only be routed to a Warehouse or Distribution Center. Selected site "%" (%) is not an authorized storage node.', 
                COALESCE(v_site_name, NEW.site_id::text), v_site_type;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_po_destination_warehouse_only ON purchase_orders;
CREATE TRIGGER trg_po_destination_warehouse_only
BEFORE INSERT OR UPDATE OF site_id ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION check_po_destination_is_warehouse_or_dc();

-- 2. Safe Backfill: Standardize Kenyan and Regional Site Codes to KE-01, KE-02, etc.
-- Leaves internal UUID primary keys (id) 100% intact to protect all foreign keys.
DO $$
DECLARE
    rec RECORD;
    v_country text;
    v_seq integer;
BEGIN
    FOR v_country IN SELECT DISTINCT UPPER(COALESCE(country, 'ET')) FROM sites LOOP
        v_seq := 1;
        FOR rec IN 
            SELECT id, code 
            FROM sites 
            WHERE UPPER(COALESCE(country, 'ET')) = v_country 
            ORDER BY 
                CASE 
                    WHEN type IN ('Administration', 'Administrative', 'HQ', 'Headquarters', 'Central Operations') THEN 0 
                    WHEN type IN ('Warehouse', 'Distribution Center') THEN 1
                    ELSE 2 
                END,
                created_at ASC 
        LOOP
            -- Standardize if code is null, legacy format, or lacks the country prefix
            IF rec.code IS NULL OR NOT (rec.code ~* ('^' || v_country || '-\d+$')) THEN
                UPDATE sites 
                SET code = v_country || '-' || LPAD(v_seq::text, 2, '0')
                WHERE id = rec.id;
            END IF;
            v_seq := v_seq + 1;
        END LOOP;
    END LOOP;
END $$;
