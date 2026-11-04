-- Migration: 20261104_standardize_warehouse_zones_a_to_j.sql
-- Description: Standardize Warehouse Zones A through J across facilities,
--              connect Inventory zones with Fulfillment label printing,
--              and ensure robust RLS read access scoped by country.

DO $$
BEGIN
    -- Ensure unique constraint on (site_id, name) to prevent duplicate zone generation
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_warehouse_zones_site_name'
    ) THEN
        BEGIN
            ALTER TABLE public.warehouse_zones 
            ADD CONSTRAINT uq_warehouse_zones_site_name UNIQUE (site_id, name);
        EXCEPTION WHEN duplicate_table THEN
            NULL;
        WHEN others THEN
            -- In case of existing duplicates, create unique index instead
            CREATE UNIQUE INDEX IF NOT EXISTS idx_warehouse_zones_site_name 
            ON public.warehouse_zones(site_id, name);
        END;
    END IF;
END $$;

-- 1. Function to seed standard Zones A to J for any facility
CREATE OR REPLACE FUNCTION public.seed_standard_facility_zones(p_site_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_site RECORD;
BEGIN
    SELECT id, name, type, country INTO v_site 
    FROM public.sites 
    WHERE id = p_site_id;

    IF v_site.id IS NULL THEN
        RETURN;
    END IF;

    -- Standard Zone A: Receiving / Inbound
    INSERT INTO public.warehouse_zones (
        site_id, name, type, zone_type, picking_priority, capacity, occupied, 
        allow_picking, allow_putaway, temperature
    ) VALUES (
        v_site.id, 'Zone A (Receiving Dock)', 'Dry', 'RECEIVING', 1, 5000, 0,
        false, true, NULL
    ) ON CONFLICT (site_id, name) DO UPDATE SET
        zone_type = EXCLUDED.zone_type,
        picking_priority = EXCLUDED.picking_priority,
        allow_picking = EXCLUDED.allow_picking,
        allow_putaway = EXCLUDED.allow_putaway;

    -- Standard Zone B: Bulk Reserve Storage
    INSERT INTO public.warehouse_zones (
        site_id, name, type, zone_type, picking_priority, capacity, occupied, 
        allow_picking, allow_putaway, temperature
    ) VALUES (
        v_site.id, 'Zone B (Bulk Storage)', 'Dry', 'BULK', 10, 25000, 0,
        true, true, NULL
    ) ON CONFLICT (site_id, name) DO UPDATE SET
        zone_type = EXCLUDED.zone_type,
        picking_priority = EXCLUDED.picking_priority,
        allow_picking = EXCLUDED.allow_picking,
        allow_putaway = EXCLUDED.allow_putaway;

    -- Standard Zone C: High-Velocity Fast Pick
    INSERT INTO public.warehouse_zones (
        site_id, name, type, zone_type, picking_priority, capacity, occupied, 
        allow_picking, allow_putaway, temperature
    ) VALUES (
        v_site.id, 'Zone C (Fast Pick)', 'Dry', 'STANDARD', 3, 10000, 0,
        true, true, NULL
    ) ON CONFLICT (site_id, name) DO UPDATE SET
        zone_type = EXCLUDED.zone_type,
        picking_priority = EXCLUDED.picking_priority,
        allow_picking = EXCLUDED.allow_picking,
        allow_putaway = EXCLUDED.allow_putaway;

    -- Standard Zone D: Dry Grocery & Shelving
    INSERT INTO public.warehouse_zones (
        site_id, name, type, zone_type, picking_priority, capacity, occupied, 
        allow_picking, allow_putaway, temperature
    ) VALUES (
        v_site.id, 'Zone D (Dry Shelves)', 'Dry', 'STANDARD', 5, 15000, 0,
        true, true, NULL
    ) ON CONFLICT (site_id, name) DO UPDATE SET
        zone_type = EXCLUDED.zone_type,
        picking_priority = EXCLUDED.picking_priority,
        allow_picking = EXCLUDED.allow_picking,
        allow_putaway = EXCLUDED.allow_putaway;

    -- Standard Zone E: Chilled Cold Room (4°C)
    INSERT INTO public.warehouse_zones (
        site_id, name, type, zone_type, picking_priority, capacity, occupied, 
        allow_picking, allow_putaway, temperature
    ) VALUES (
        v_site.id, 'Zone E (Chilled 4°C)', 'Cold', 'CHILLED', 6, 8000, 0,
        true, true, '4°C'
    ) ON CONFLICT (site_id, name) DO UPDATE SET
        zone_type = EXCLUDED.zone_type,
        temperature = EXCLUDED.temperature,
        picking_priority = EXCLUDED.picking_priority,
        allow_picking = EXCLUDED.allow_picking,
        allow_putaway = EXCLUDED.allow_putaway;

    -- Standard Zone F: Deep Freezer (-18°C)
    INSERT INTO public.warehouse_zones (
        site_id, name, type, zone_type, picking_priority, capacity, occupied, 
        allow_picking, allow_putaway, temperature
    ) VALUES (
        v_site.id, 'Zone F (Freezer -18°C)', 'Cold', 'FREEZER', 8, 6000, 0,
        true, true, '-18°C'
    ) ON CONFLICT (site_id, name) DO UPDATE SET
        zone_type = EXCLUDED.zone_type,
        temperature = EXCLUDED.temperature,
        picking_priority = EXCLUDED.picking_priority,
        allow_picking = EXCLUDED.allow_picking,
        allow_putaway = EXCLUDED.allow_putaway;

    -- Standard Zone G: Secure Vault / High Value
    INSERT INTO public.warehouse_zones (
        site_id, name, type, zone_type, picking_priority, capacity, occupied, 
        allow_picking, allow_putaway, temperature
    ) VALUES (
        v_site.id, 'Zone G (Secure Vault)', 'Secure', 'HIGH_VALUE', 4, 2000, 0,
        true, true, NULL
    ) ON CONFLICT (site_id, name) DO UPDATE SET
        zone_type = EXCLUDED.zone_type,
        picking_priority = EXCLUDED.picking_priority,
        allow_picking = EXCLUDED.allow_picking,
        allow_putaway = EXCLUDED.allow_putaway;

    -- Standard Zone H: Quarantine & QA Inspection
    INSERT INTO public.warehouse_zones (
        site_id, name, type, zone_type, picking_priority, capacity, occupied, 
        allow_picking, allow_putaway, temperature
    ) VALUES (
        v_site.id, 'Zone H (Quarantine QA)', 'Dry', 'QUARANTINE', 9, 3000, 0,
        false, true, NULL
    ) ON CONFLICT (site_id, name) DO UPDATE SET
        zone_type = EXCLUDED.zone_type,
        picking_priority = EXCLUDED.picking_priority,
        allow_picking = EXCLUDED.allow_picking,
        allow_putaway = EXCLUDED.allow_putaway;

    -- Standard Zone I: Staging & Packing
    INSERT INTO public.warehouse_zones (
        site_id, name, type, zone_type, picking_priority, capacity, occupied, 
        allow_picking, allow_putaway, temperature
    ) VALUES (
        v_site.id, 'Zone I (Packing & Stage)', 'Dry', 'STAGING', 2, 5000, 0,
        true, true, NULL
    ) ON CONFLICT (site_id, name) DO UPDATE SET
        zone_type = EXCLUDED.zone_type,
        picking_priority = EXCLUDED.picking_priority,
        allow_picking = EXCLUDED.allow_picking,
        allow_putaway = EXCLUDED.allow_putaway;

    -- Standard Zone J: Outbound Shipping Dock
    INSERT INTO public.warehouse_zones (
        site_id, name, type, zone_type, picking_priority, capacity, occupied, 
        allow_picking, allow_putaway, temperature
    ) VALUES (
        v_site.id, 'Zone J (Outbound Dock)', 'Dry', 'SHIPPING', 1, 4000, 0,
        true, false, NULL
    ) ON CONFLICT (site_id, name) DO UPDATE SET
        zone_type = EXCLUDED.zone_type,
        picking_priority = EXCLUDED.picking_priority,
        allow_picking = EXCLUDED.allow_picking,
        allow_putaway = EXCLUDED.allow_putaway;
END;
$$;

-- 2. Populate Zones A through J for all existing sites
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.sites LOOP
        PERFORM public.seed_standard_facility_zones(r.id);
    END LOOP;
END $$;

-- 3. Trigger to auto-seed standard zones when a new site is created
CREATE OR REPLACE FUNCTION public.trg_auto_seed_site_zones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    PERFORM public.seed_standard_facility_zones(NEW.id);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_site_auto_seed_zones ON public.sites;
CREATE TRIGGER trg_site_auto_seed_zones
AFTER INSERT ON public.sites
FOR EACH ROW
EXECUTE FUNCTION public.trg_auto_seed_site_zones();

-- 4. Harden RLS: allow authenticated users to view facility zones within their sovereign country
DROP POLICY IF EXISTS zones_read_scoped ON public.warehouse_zones;
CREATE POLICY zones_read_scoped ON public.warehouse_zones
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sites s
    WHERE s.id = warehouse_zones.site_id
      AND upper(coalesce(s.country, '')) = upper(public.get_my_country_code())
  )
);
