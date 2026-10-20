-- ============================================================================
-- SIIFMART NATIONAL HQ DIRECTORATE SEED MIGRATION
-- Migration: 20261020_seed_national_hq_directorate.sql
-- Purpose:
--   Provisions the complete National Corporate HQ Directorate for Ethiopia (ET)
--   and Kenya (KE) in Supabase Auth, public.users, and public.employees.
--
-- Roles Seeded:
--   - Country Managing Director (ET & KE)
--   - Head of Operations (ET & KE)
--   - Head of Finance (ET & KE)
--   - Head of Procurement (ET & KE)
--   - Head of Human Resources (ET & KE)
--   - Head of Supply Chain (ET & KE)
--   - Head of Merchandising (ET & KE)
--   - Head of IT (ET & KE)
--   - Head of Audit (ET & KE)
--
-- Standard Initial Password: Siifmart@2026!
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

BEGIN;

CREATE TEMP TABLE temp_hq_directorate (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  job_title TEXT,
  department TEXT,
  scope_level TEXT,
  site_id UUID,
  country_code TEXT,
  code TEXT,
  salary NUMERIC
) ON COMMIT DROP;

INSERT INTO temp_hq_directorate VALUES
  -- ═══════════════════════════════════════════════════════════════════════════
  -- ETHIOPIA NATIONAL HQ (Central Operations - ET-HQ)
  -- ═══════════════════════════════════════════════════════════════════════════
  ('a1111111-2222-4000-8000-000000000001', 'ET-SIIF0002@siifmart.com', 'Tewodros Kassahun', 'country_managing_director', 'Country Managing Director', 'Executive', 'HQ', 'bb0425bc-3119-449a-a685-b871e552bee0', 'ET', 'ET-SIIF0002', 150000),
  ('a1111111-2222-4000-8000-000000000002', 'ET-SIIF0003@siifmart.com', 'Sara Tesfaye', 'head_of_operations', 'Head of Operations', 'Operations', 'HQ', 'bb0425bc-3119-449a-a685-b871e552bee0', 'ET', 'ET-SIIF0003', 120000),
  ('a1111111-2222-4000-8000-000000000003', 'ET-SIIF0004@siifmart.com', 'Rahel Tesfaye', 'head_of_finance', 'Head of Finance', 'Finance', 'HQ', 'bb0425bc-3119-449a-a685-b871e552bee0', 'ET', 'ET-SIIF0004', 110000),
  ('a1111111-2222-4000-8000-000000000004', 'ET-SIIF0005@siifmart.com', 'Yohannes Bekele', 'head_of_procurement', 'Head of Procurement', 'Procurement', 'HQ', 'bb0425bc-3119-449a-a685-b871e552bee0', 'ET', 'ET-SIIF0005', 100000),
  ('a1111111-2222-4000-8000-000000000005', 'ET-SIIF0006@siifmart.com', 'Tigist Alemayehu', 'head_of_hr', 'Head of Human Resources', 'Human Resources', 'HQ', 'bb0425bc-3119-449a-a685-b871e552bee0', 'ET', 'ET-SIIF0006', 95000),
  ('a1111111-2222-4000-8000-000000000006', 'ET-SIIF0007@siifmart.com', 'Dawit Haile', 'head_of_supply_chain', 'Head of Supply Chain', 'Logistics', 'HQ', 'bb0425bc-3119-449a-a685-b871e552bee0', 'ET', 'ET-SIIF0007', 100000),
  ('a1111111-2222-4000-8000-000000000007', 'ET-SIIF0008@siifmart.com', 'Bethlehem Tadesse', 'head_of_merchandising', 'Head of Merchandising', 'Merchandising', 'HQ', 'bb0425bc-3119-449a-a685-b871e552bee0', 'ET', 'ET-SIIF0008', 90000),
  ('a1111111-2222-4000-8000-000000000008', 'ET-SIIF0009@siifmart.com', 'Ermias Girma', 'head_of_it', 'Head of IT', 'Technology', 'HQ', 'bb0425bc-3119-449a-a685-b871e552bee0', 'ET', 'ET-SIIF0009', 95000),
  ('a1111111-2222-4000-8000-000000000009', 'ET-SIIF0010@siifmart.com', 'Almaz Wolde', 'head_of_audit', 'Head of Audit', 'Audit', 'HQ', 'bb0425bc-3119-449a-a685-b871e552bee0', 'ET', 'ET-SIIF0010', 105000),

  -- ═══════════════════════════════════════════════════════════════════════════
  -- KENYA NATIONAL HQ (Kenya Central Operations - KE-HQ)
  -- ═══════════════════════════════════════════════════════════════════════════
  ('b1111111-2222-4000-8000-000000000001', 'KE-SIIF0002@siifmart.com', 'David Ochieng', 'country_managing_director', 'Country Managing Director', 'Executive', 'HQ', '6c38f106-4590-4ff3-ae68-b9ab657fff99', 'KE', 'KE-SIIF0002', 350000),
  ('b1111111-2222-4000-8000-000000000002', 'KE-SIIF0003@siifmart.com', 'Grace Wanjiku', 'head_of_operations', 'Head of Operations', 'Operations', 'HQ', '6c38f106-4590-4ff3-ae68-b9ab657fff99', 'KE', 'KE-SIIF0003', 280000),
  ('b1111111-2222-4000-8000-000000000003', 'KE-SIIF0004@siifmart.com', 'James Mwangi', 'head_of_finance', 'Head of Finance', 'Finance', 'HQ', '6c38f106-4590-4ff3-ae68-b9ab657fff99', 'KE', 'KE-SIIF0004', 260000),
  ('b1111111-2222-4000-8000-000000000004', 'KE-SIIF0005@siifmart.com', 'Faith Chebet', 'head_of_procurement', 'Head of Procurement', 'Procurement', 'HQ', '6c38f106-4590-4ff3-ae68-b9ab657fff99', 'KE', 'KE-SIIF0005', 240000),
  ('b1111111-2222-4000-8000-000000000005', 'KE-SIIF0006@siifmart.com', 'Brian Kiprop', 'head_of_hr', 'Head of Human Resources', 'Human Resources', 'HQ', '6c38f106-4590-4ff3-ae68-b9ab657fff99', 'KE', 'KE-SIIF0006', 230000),
  ('b1111111-2222-4000-8000-000000000006', 'KE-SIIF0007@siifmart.com', 'Mercy Achieng', 'head_of_supply_chain', 'Head of Supply Chain', 'Logistics', 'HQ', '6c38f106-4590-4ff3-ae68-b9ab657fff99', 'KE', 'KE-SIIF0007', 240000),
  ('b1111111-2222-4000-8000-000000000007', 'KE-SIIF0008@siifmart.com', 'Dennis Mutua', 'head_of_merchandising', 'Head of Merchandising', 'Merchandising', 'HQ', '6c38f106-4590-4ff3-ae68-b9ab657fff99', 'KE', 'KE-SIIF0008', 220000),
  ('b1111111-2222-4000-8000-000000000008', 'KE-SIIF0009@siifmart.com', 'Kevin Otieno', 'head_of_it', 'Head of IT', 'Technology', 'HQ', '6c38f106-4590-4ff3-ae68-b9ab657fff99', 'KE', 'KE-SIIF0009', 230000),
  ('b1111111-2222-4000-8000-000000000009', 'KE-SIIF0010@siifmart.com', 'Esther Wambui', 'head_of_audit', 'Head of Audit', 'Audit', 'HQ', '6c38f106-4590-4ff3-ae68-b9ab657fff99', 'KE', 'KE-SIIF0010', 250000);

-- 1. Upsert into auth.users
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  invited_at, confirmation_sent_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  t.id, 'authenticated', 'authenticated', t.email,
  extensions.crypt('Siifmart@2026!', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  json_build_object(
    'role', t.role,
    'full_name', t.name,
    'email_verified', true,
    'site_id', t.site_id,
    'country_code', t.country_code
  )::jsonb,
  now(), now(), '', '', '', ''
FROM temp_hq_directorate t
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  email_confirmed_at = now(),
  updated_at = now();

-- 2. Upsert into auth.identities
INSERT INTO auth.identities (
  id, provider_id, user_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
)
SELECT
  extensions.gen_random_uuid(),
  t.id::text,
  t.id,
  json_build_object('sub', t.id::text, 'email', t.email, 'name', t.name, 'role', t.role, 'siteId', t.site_id)::jsonb,
  'email',
  now(), now(), now()
FROM temp_hq_directorate t
ON CONFLICT (provider, provider_id) DO NOTHING;

-- 3. Upsert into public.users
INSERT INTO public.users (
  id, auth_id, email, full_name, default_language, verified_phone, verified_id, created_at, updated_at
)
SELECT
  t.id, t.id, t.email, t.name, 'en', true, true, now(), now()
FROM temp_hq_directorate t
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = now();

-- 4. Upsert into public.employees
INSERT INTO public.employees (
  id, site_id, name, role, email, join_date, scope_level,
  job_title, department, status, code, salary,
  created_at, updated_at
)
SELECT
  t.id, t.site_id, t.name, t.role, t.email, '2026-01-01',
  t.scope_level, t.job_title, t.department, 'Active', t.code, t.salary,
  now(), now()
FROM temp_hq_directorate t
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  job_title = EXCLUDED.job_title,
  scope_level = EXCLUDED.scope_level,
  department = EXCLUDED.department,
  site_id = EXCLUDED.site_id,
  status = EXCLUDED.status,
  code = EXCLUDED.code,
  salary = EXCLUDED.salary,
  updated_at = now();

COMMIT;
