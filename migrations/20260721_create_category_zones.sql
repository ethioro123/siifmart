-- Migration: Create category_zones table
-- Purpose: Support Smart Putaway by mapping product categories to default zones/aisles

CREATE TABLE IF NOT EXISTS public.category_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    default_zone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(site_id, category)
);

COMMENT ON TABLE public.category_zones IS 'Maps product categories to default zones/aisles for Smart Putaway routing.';
COMMENT ON COLUMN public.category_zones.default_zone IS 'The suggested default zone/aisle location (e.g. Zone C)';

-- Enable RLS
ALTER TABLE public.category_zones ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all authenticated users" ON public.category_zones FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.category_zones FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.category_zones FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.category_zones FOR DELETE USING (auth.role() = 'authenticated');
