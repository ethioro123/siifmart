-- ============================================================================
-- SIIFMART STAGING QUICK LOGIN ACCOUNTS MIGRATION
-- Migration: 20261018_staging_seed_quick_login_accounts.sql
-- Purpose:
--   Seeds designated staging role accounts across Kenya and Ethiopia so users
--   can quick-login and test every operational role (CEO, Regional Manager,
--   Procurement, Warehouse Manager, Picker, Store Manager, Cashier).
-- Standard Password: StagingPassword123!
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

BEGIN;

-- Helper temporary table for seeding
CREATE TEMP TABLE temp_staging_accounts (
  id UUID,
  email TEXT,
  name TEXT,
  role TEXT,
  scope_level TEXT,
  site_id UUID,
  region_code TEXT,
  country_code TEXT,
  job_title TEXT,
  department TEXT,
  code TEXT
) ON COMMIT DROP;

INSERT INTO temp_staging_accounts VALUES
  -- Kenya Operations
  ('988fb8ef-8053-415b-9032-2aca981058e1', 'ke.manager@staging.siifmart.com', 'Kamau Ndenga', 'regional_manager', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Regional Operations Manager', 'Management', 'KE-EMP-001'),
  ('988fb8ef-8053-415b-9032-2aca981058e2', 'ke.procurement@staging.siifmart.com', 'Oscar Kennedy', 'procurement_manager', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Regional Procurement Lead', 'Procurement', 'KE-EMP-002'),
  ('988fb8ef-8053-415b-9032-2aca981058e3', 'ke.warehouse@staging.siifmart.com', 'Kennedy Odhiambo', 'warehouse_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000003', 'KE-NRB', 'KE', 'Warehouse Operations Manager', 'Fulfillment', 'KE-EMP-003'),
  ('988fb8ef-8053-415b-9032-2aca981058e4', 'ke.picker@staging.siifmart.com', 'Gideon Jakaranda', 'picker', 'REGIONAL', 'a1111111-1111-4000-8000-000000000003', 'KE-NRB', 'KE', 'Lead Fulfillment Picker', 'Fulfillment', 'KE-EMP-004'),
  ('988fb8ef-8053-415b-9032-2aca981058e5', 'ke.storemanager@staging.siifmart.com', 'Makena Benson', 'store_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000004', 'KE-NRB', 'KE', 'Retail Store Manager', 'Retail', 'KE-EMP-005'),
  ('988fb8ef-8053-415b-9032-2aca981058e6', 'ke.cashier@staging.siifmart.com', 'Amina Wanjiku', 'cashier', 'REGIONAL', 'a1111111-1111-4000-8000-000000000004', 'KE-NRB', 'KE', 'Senior Cashier & POS Operator', 'Retail', 'KE-EMP-006'),

  -- Ethiopia Operations
  ('988fb8ef-8053-415b-9032-2aca981058f1', 'et.manager@staging.siifmart.com', 'Henok Tadesse', 'regional_manager', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Regional Operations Manager', 'Management', 'ET-EMP-001'),
  ('988fb8ef-8053-415b-9032-2aca981058f2', 'et.procurement@staging.siifmart.com', 'Yohannes Bekele', 'procurement_manager', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Regional Procurement Lead', 'Procurement', 'ET-EMP-002'),
  ('988fb8ef-8053-415b-9032-2aca981058f3', 'et.warehouse@staging.siifmart.com', 'Chala Adam', 'warehouse_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000001', 'ET-ADD', 'ET', 'Warehouse Operations Manager', 'Fulfillment', 'ET-EMP-003'),
  ('988fb8ef-8053-415b-9032-2aca981058f4', 'et.picker@staging.siifmart.com', 'Tola Bekele', 'receiver', 'REGIONAL', 'a1111111-1111-4000-8000-000000000001', 'ET-ADD', 'ET', 'Inbound Receiver & Dock Specialist', 'Fulfillment', 'ET-EMP-004'),
  ('988fb8ef-8053-415b-9032-2aca981058f5', 'et.storemanager@staging.siifmart.com', 'Amina Ali', 'store_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000002', 'ET-ADD', 'ET', 'Retail Store Manager', 'Retail', 'ET-EMP-005'),
  ('988fb8ef-8053-415b-9032-2aca981058f6', 'et.cashier@staging.siifmart.com', 'Selamawit Girma', 'cashier', 'REGIONAL', 'a1111111-1111-4000-8000-000000000002', 'ET-ADD', 'ET', 'Senior Cashier & POS Operator', 'Retail', 'ET-EMP-006');

-- 1. Insert into auth.users with password 'StagingPassword123!'
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  t.id,
  'authenticated',
  'authenticated',
  t.email,
  extensions.crypt('StagingPassword123!', extensions.gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  json_build_object(
    'role', t.role,
    'full_name', t.name,
    'email_verified', true,
    'site_id', t.site_id,
    'country_code', t.country_code
  )::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
FROM temp_staging_accounts t
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  email_confirmed_at = now(),
  updated_at = now();

-- 2. Update region_code on public.users
UPDATE public.users u
SET region_code = t.region_code
FROM temp_staging_accounts t
WHERE u.auth_id = t.id;

-- 3. Upsert into public.employees
INSERT INTO public.employees (
  id,
  site_id,
  name,
  role,
  email,
  join_date,
  scope_level,
  job_title,
  department,
  region_code,
  status,
  code,
  created_at,
  updated_at
)
SELECT
  t.id,
  t.site_id,
  t.name,
  t.role,
  t.email,
  '2026-01-01',
  t.scope_level,
  t.job_title,
  t.department,
  t.region_code,
  'Active',
  t.code,
  now(),
  now()
FROM temp_staging_accounts t
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  job_title = EXCLUDED.job_title,
  scope_level = EXCLUDED.scope_level,
  department = EXCLUDED.department,
  site_id = EXCLUDED.site_id,
  region_code = EXCLUDED.region_code,
  status = EXCLUDED.status,
  updated_at = now();

COMMIT;
