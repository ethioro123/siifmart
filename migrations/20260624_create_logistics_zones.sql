-- Migration: Create logistics_zones table and link it to sites

-- 1. Create public.logistics_zones table
CREATE TABLE IF NOT EXISTS public.logistics_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.logistics_zones IS 'Independently managed geographic logistics zones for grouping sites.';
COMMENT ON COLUMN public.logistics_zones.name IS 'Unique name of the logistics zone (e.g. Addis Ababa Zone, Dire Dawa Zone, Harar Zone).';

-- 2. Alter public.sites to add logistics_zone_id column
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS logistics_zone_id UUID REFERENCES public.logistics_zones(id) ON DELETE SET NULL;
COMMENT ON COLUMN public.sites.logistics_zone_id IS 'Link to the Logistics Zone for replenishment restrictions.';

-- 3. Alter public.system_config to add enforce_regional_zoning column
ALTER TABLE public.system_config ADD COLUMN IF NOT EXISTS enforce_regional_zoning BOOLEAN DEFAULT false;
COMMENT ON COLUMN public.system_config.enforce_regional_zoning IS 'If true, restricts replenishment transfer requests to sites in the same logistics zone (unless overridden by CEO).';

-- 4. Enable Row Level Security (RLS) on logistics_zones
ALTER TABLE public.logistics_zones ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for logistics_zones
-- Authenticated users (employees) can read zones
CREATE POLICY select_logistics_zones ON public.logistics_zones
    FOR SELECT TO authenticated USING (true);

-- Managers / Admins can write/update/delete zones
CREATE POLICY all_logistics_zones ON public.logistics_zones
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = auth.uid()
            AND e.role IN ('super_admin', 'admin', 'wms_manager', 'inventory_manager')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = auth.uid()
            AND e.role IN ('super_admin', 'admin', 'wms_manager', 'inventory_manager')
        )
    );

-- 6. Insert default zones
INSERT INTO public.logistics_zones (name, description) VALUES
    ('Addis Ababa Zone', 'Central operations and Bole Supermarket'),
    ('Dire Dawa Zone', 'Dire Dawa storage and surrounding regions'),
    ('Harar Zone', 'Harar hub and East region retail stores'),
    ('Adama Zone', 'Adama DC and central region logistics'),
    ('Ambo Zone', 'Ambo storage and west region')
ON CONFLICT (name) DO NOTHING;

-- 7. Link existing sites to default zones
UPDATE public.sites SET logistics_zone_id = (SELECT id FROM public.logistics_zones WHERE name = 'Addis Ababa Zone') WHERE name IN ('Central Operations', 'Bole Supermarket');
UPDATE public.sites SET logistics_zone_id = (SELECT id FROM public.logistics_zones WHERE name = 'Dire Dawa Zone') WHERE name = 'Dire Dawa Storage Facility';
UPDATE public.sites SET logistics_zone_id = (SELECT id FROM public.logistics_zones WHERE name = 'Harar Zone') WHERE name IN ('Harar Logistics Hub', 'Aratanya Market', 'Awaday Grocery', 'BEDENO');
UPDATE public.sites SET logistics_zone_id = (SELECT id FROM public.logistics_zones WHERE name = 'Adama Zone') WHERE name = 'Adama Distribution Center';
UPDATE public.sites SET logistics_zone_id = (SELECT id FROM public.logistics_zones WHERE name = 'Ambo Zone') WHERE name = 'AMBO';
