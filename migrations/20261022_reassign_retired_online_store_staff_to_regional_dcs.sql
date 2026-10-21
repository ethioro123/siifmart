-- Migration: Reassign staff from retired online store sites to active regional Distribution Centers
-- Ensures returns clerks, stock clerks, shift leads, and fulfillment specialists can access WMS operations

-- 1. Ethiopia - Adama (ET-ADA-ONL-01 -> ET-ADA-DC-01)
UPDATE public.employees
SET site_id = 'c1111111-1111-4000-8000-000000000109'
WHERE site_id = 'c1111111-1111-4000-8000-000000000111';

-- 2. Ethiopia - Addis Ababa (ET-ADD-ONL-01 -> ET-ADD-DC-01)
UPDATE public.employees
SET site_id = 'a1111111-1111-4000-8000-000000000001'
WHERE site_id = 'a1111111-1111-4000-8000-000000000006';

-- 3. Kenya - Nairobi (KE-NRB-ONL-01 -> KE-NRB-DC-01)
UPDATE public.employees
SET site_id = 'a1111111-1111-4000-8000-000000000003'
WHERE site_id = 'a1111111-1111-4000-8000-000000000008';

-- 4. Kenya - Mombasa (KE-MBA-ONL-01 -> KE-MBA-DC-01)
UPDATE public.employees
SET site_id = 'c1111111-1111-4000-8000-000000000123'
WHERE site_id = 'c1111111-1111-4000-8000-000000000125';
