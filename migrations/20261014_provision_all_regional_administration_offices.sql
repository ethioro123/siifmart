-- Migration: Provision All Regional Administration Offices With Region IDs & Link Admin Hubs
-- Establishes that Regional Administration offices are identified by the official Region ID: [COUNTRY]-[REGION]
-- (e.g. ET-ADD, KE-NRB, ET-ADA, ET-DIR, KE-MBA, ET-HAW, ET-BDR, UG-KLA, RW-KGL, TZ-DAR).
-- Guarantees Regional Managers and regional office staff carry their exact Region ID.

-- 1. Insert or update Regional Administration sites with their official Region IDs
INSERT INTO public.sites (id, name, code, type, country, currency, region_code, site_number, status, is_fulfillment_node)
VALUES 
  ('bb0425bc-3119-449a-a685-b871e552bee9', 'Addis Ababa Regional Administration', 'ET-ADD', 'Administration', 'ET', 'ETB', 'ET-ADD', 19, 'Active', false),
  ('6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'Nairobi Region Administration', 'KE-NRB', 'Administration', 'KE', 'KES', 'KE-NRB', 13, 'Active', false),
  ('a1111111-1111-4000-8000-000000000020', 'Adama Regional Administration', 'ET-ADA', 'Administration', 'ET', 'ETB', 'ET-ADA', 20, 'Active', false),
  ('a1111111-1111-4000-8000-000000000021', 'Dire Dawa Regional Administration', 'ET-DIR', 'Administration', 'ET', 'ETB', 'ET-DIR', 21, 'Active', false),
  ('a1111111-1111-4000-8000-000000000022', 'Mombasa Regional Administration', 'KE-MBA', 'Administration', 'KE', 'KES', 'KE-MBA', 22, 'Active', false),
  ('a1111111-1111-4000-8000-000000000023', 'Hawassa Regional Administration', 'ET-HAW', 'Administration', 'ET', 'ETB', 'ET-HAW', 23, 'Active', false),
  ('a1111111-1111-4000-8000-000000000024', 'Bahir Dar Regional Administration', 'ET-BDR', 'Administration', 'ET', 'ETB', 'ET-BDR', 24, 'Active', false),
  ('397b33b1-a7b9-4a38-a0c4-e5ace6474183', 'Uganda Central Operations', 'UG-KLA', 'Administration', 'UG', 'UGX', 'UG-KLA', 14, 'Active', false),
  ('818fc6ef-c640-4ad9-82e9-b878a898aaf7', 'Rwanda Central Operations', 'RW-KGL', 'Administration', 'RW', 'RWF', 'RW-KGL', 15, 'Active', false),
  ('c4c2c116-79ac-4b35-bdcb-fe3edcc5e372', 'Tanzania Central Operations', 'TZ-DAR', 'Administration', 'TZ', 'TZS', 'TZ-DAR', 16, 'Active', false)
ON CONFLICT (id) DO UPDATE 
SET code = EXCLUDED.code,
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    country = EXCLUDED.country,
    currency = EXCLUDED.currency,
    region_code = EXCLUDED.region_code,
    site_number = EXCLUDED.site_number;

-- 2. Link all admin_hub_site_id foreign keys in public.regions to their respective Regional Administration sites
UPDATE public.regions SET admin_hub_site_id = 'bb0425bc-3119-449a-a685-b871e552bee9' WHERE code = 'ET-ADD';
UPDATE public.regions SET admin_hub_site_id = '6c38f106-4590-4ff3-ae68-b9ab657fff8e' WHERE code = 'KE-NRB';
UPDATE public.regions SET admin_hub_site_id = 'a1111111-1111-4000-8000-000000000020' WHERE code = 'ET-ADA';
UPDATE public.regions SET admin_hub_site_id = 'a1111111-1111-4000-8000-000000000021' WHERE code = 'ET-DIR';
UPDATE public.regions SET admin_hub_site_id = 'a1111111-1111-4000-8000-000000000022' WHERE code = 'KE-MBA';
UPDATE public.regions SET admin_hub_site_id = 'a1111111-1111-4000-8000-000000000023' WHERE code = 'ET-HAW';
UPDATE public.regions SET admin_hub_site_id = 'a1111111-1111-4000-8000-000000000024' WHERE code = 'ET-BDR';
UPDATE public.regions SET admin_hub_site_id = '397b33b1-a7b9-4a38-a0c4-e5ace6474183' WHERE code = 'UG-KLA';
UPDATE public.regions SET admin_hub_site_id = '818fc6ef-c640-4ad9-82e9-b878a898aaf7' WHERE code = 'RW-KGL';
UPDATE public.regions SET admin_hub_site_id = 'c4c2c116-79ac-4b35-bdcb-fe3edcc5e372' WHERE code = 'TZ-DAR';
