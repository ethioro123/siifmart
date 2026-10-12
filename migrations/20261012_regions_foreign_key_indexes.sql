-- Migration: 20261012_regions_foreign_key_indexes.sql
-- Description: Add covering indexes for regions foreign keys (admin_hub_site_id, regional_manager_id)

CREATE INDEX IF NOT EXISTS idx_regions_admin_hub_site_id ON public.regions(admin_hub_site_id);
CREATE INDEX IF NOT EXISTS idx_regions_regional_manager_id ON public.regions(regional_manager_id);
