-- Migration: 20261104_allow_pick_putaway_all_zones.sql
-- Description: Default all warehouse zones (A through J) across facilities to allow both picking and putaway,
--              while preserving the ability for authorized inventory and warehouse staff to reconfigure them.

-- 1. Helper function for authorized warehouse zone configuration
CREATE OR REPLACE FUNCTION public.can_manage_warehouse_zones()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN (
    SELECT public.is_admin() 
        OR public.is_manager() 
        OR (public.get_my_role() IN (
            'inventory_manager',
            'inventory_controller',
            'inventory_specialist',
            'warehouse_manager',
            'store_manager',
            'assistant_store_manager',
            'shift_supervisor',
            'dispatch_supervisor'
        ))
  );
END;
$$;

-- 2. Update zones_update_scoped policy to support warehouse management roles
DROP POLICY IF EXISTS zones_update_scoped ON public.warehouse_zones;
CREATE POLICY zones_update_scoped ON public.warehouse_zones
FOR UPDATE
USING (
    public.can_manage_warehouse_zones() AND is_site_in_my_authorized_scope((site_id)::text, NULL::text)
)
WITH CHECK (
    public.can_manage_warehouse_zones() AND is_site_in_my_authorized_scope((site_id)::text, NULL::text)
);

-- 3. Update all existing facility warehouse zones to allow picking and putaway by default
UPDATE public.warehouse_zones
SET 
    allow_picking = true,
    allow_putaway = true
WHERE 
    allow_picking IS NOT TRUE 
    OR allow_putaway IS NOT TRUE;

-- 4. Update the standard facility zones seeding function so future zones default to both picking and putaway
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

    -- Standard Zone A: Receiving / Inbound Dock (Default: picking and putaway enabled, configurable)
    INSERT INTO public.warehouse_zones (
        site_id, name, type, zone_type, picking_priority, capacity, occupied, 
        allow_picking, allow_putaway, temperature
    ) VALUES (
        v_site.id, 'Zone A (Receiving Dock)', 'Dry', 'RECEIVING', 1, 5000, 0,
        true, true, NULL
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

    -- Standard Zone H: Quarantine & QA Inspection (Default: picking and putaway enabled, configurable)
    INSERT INTO public.warehouse_zones (
        site_id, name, type, zone_type, picking_priority, capacity, occupied, 
        allow_picking, allow_putaway, temperature
    ) VALUES (
        v_site.id, 'Zone H (Quarantine QA)', 'Dry', 'QUARANTINE', 9, 3000, 0,
        true, true, NULL
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

    -- Standard Zone J: Shipping & Outbound Dock (Default: picking and putaway enabled, configurable)
    INSERT INTO public.warehouse_zones (
        site_id, name, type, zone_type, picking_priority, capacity, occupied, 
        allow_picking, allow_putaway, temperature
    ) VALUES (
        v_site.id, 'Zone J (Outbound Dock)', 'Dry', 'SHIPPING', 1, 4000, 0,
        true, true, NULL
    ) ON CONFLICT (site_id, name) DO UPDATE SET
        zone_type = EXCLUDED.zone_type,
        picking_priority = EXCLUDED.picking_priority,
        allow_picking = EXCLUDED.allow_picking,
        allow_putaway = EXCLUDED.allow_putaway;
END;
$$;
