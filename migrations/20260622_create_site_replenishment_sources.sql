-- Migration: Create site_replenishment_sources join table
CREATE TABLE IF NOT EXISTS public.site_replenishment_sources (
    site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
    source_site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE,
    PRIMARY KEY (site_id, source_site_id)
);

-- Backfill from existing sites.replenishment_source_id
INSERT INTO public.site_replenishment_sources (site_id, source_site_id)
SELECT id, replenishment_source_id
FROM public.sites
WHERE replenishment_source_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Enable Row-Level Security
ALTER TABLE public.site_replenishment_sources ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS replenishment_sources_read ON public.site_replenishment_sources;
DROP POLICY IF EXISTS replenishment_sources_write ON public.site_replenishment_sources;
DROP POLICY IF EXISTS replenishment_sources_update ON public.site_replenishment_sources;
DROP POLICY IF EXISTS replenishment_sources_delete ON public.site_replenishment_sources;

-- Define clean policies matching security standards
CREATE POLICY "replenishment_sources_read" ON public.site_replenishment_sources
    FOR SELECT TO authenticated
    USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "replenishment_sources_write" ON public.site_replenishment_sources
    FOR INSERT TO authenticated
    WITH CHECK ((select public.is_admin()));

CREATE POLICY "replenishment_sources_update" ON public.site_replenishment_sources
    FOR UPDATE TO authenticated
    USING ((select public.is_admin()));

CREATE POLICY "replenishment_sources_delete" ON public.site_replenishment_sources
    FOR DELETE TO authenticated
    USING ((select public.is_admin()));

-- Grant/Revoke access
REVOKE ALL ON public.site_replenishment_sources FROM anon;
GRANT ALL ON public.site_replenishment_sources TO authenticated;
