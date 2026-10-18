-- Staging Seed: Baseline Reference Topology & Synthetic Executive Admin
-- Provisions sovereign reference data for Ethiopia (ET) and Kenya (KE),
-- connects the automated Auth trigger, and creates the baseline CEO account.

SET search_path = public, extensions, auth;

-- 1. Automate user profile creation when Supabase Auth users sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- 2. Supported Languages
INSERT INTO public.supported_languages (code, name) VALUES
  ('en', 'English'),
  ('am', 'Amharic'),
  ('om', 'Oromo'),
  ('so', 'Somali'),
  ('sw', 'Swahili')
ON CONFLICT (code) DO NOTHING;

-- 3. Sovereign Currencies (Strict border isolation between ETB and KES)
INSERT INTO public.currencies (code, name, symbol, decimals) VALUES
  ('KES', 'Kenya Shilling', 'KSh', 2),
  ('ETB', 'Ethiopian Birr', 'Br', 2),
  ('USD', 'US Dollar', '$', 2)
ON CONFLICT (code) DO NOTHING;

-- 4. Sovereign Administrative Regions
INSERT INTO public.regions (code, country, city, default_currency, default_language, name, monthly_procurement_budget, autonomous_po_limit, status) VALUES
  ('ET-ADD', 'ET', 'Addis Ababa', 'ETB', 'am', 'Addis Ababa Central Region', 5000000, 200000, 'active'),
  ('ET-DIR', 'ET', 'Dire Dawa', 'ETB', 'am', 'Dire Dawa Eastern Region', 3000000, 150000, 'active'),
  ('ET-ADA', 'ET', 'Adama', 'ETB', 'om', 'Adama Oromia Region', 3000000, 150000, 'active'),
  ('KE-NRB', 'KE', 'Nairobi', 'KES', 'en', 'Nairobi Central Region', 5000000, 200000, 'active'),
  ('KE-MBA', 'KE', 'Mombasa', 'KES', 'sw', 'Mombasa Coastal Region', 3000000, 150000, 'active')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  country = EXCLUDED.country,
  city = EXCLUDED.city,
  default_currency = EXCLUDED.default_currency,
  default_language = EXCLUDED.default_language,
  status = EXCLUDED.status;

-- 5. Physical Sites (Headquarters, Distribution Centers, and Retail Stores)
INSERT INTO public.sites (id, name, code, type, country, currency, region_code, site_number, status, is_fulfillment_node, barcode_prefix) VALUES
  ('bb0425bc-3119-449a-a685-b871e552bee9', 'Addis Ababa Regional Administration', 'ET-ADD', 'Administration', 'ET', 'ETB', 'ET-ADD', 19, 'Active', false, '1019'),
  ('a1111111-1111-4000-8000-000000000001', 'Addis Ababa Central Distribution Center', 'ADD-DC01', 'Distribution Center', 'ET', 'ETB', 'ET-ADD', 1, 'Active', true, '1001'),
  ('a1111111-1111-4000-8000-000000000002', 'SIIFMART Bole Supermarket', 'ADD-RET01', 'Store', 'ET', 'ETB', 'ET-ADD', 2, 'Active', false, '1002'),
  ('6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'Nairobi Region Administration', 'KE-NRB', 'Administration', 'KE', 'KES', 'KE-NRB', 13, 'Active', false, '2013'),
  ('a1111111-1111-4000-8000-000000000003', 'Nairobi Central Distribution Center', 'NBO-DC01', 'Distribution Center', 'KE', 'KES', 'KE-NRB', 3, 'Active', true, '2001'),
  ('a1111111-1111-4000-8000-000000000004', 'SIIFMART Westlands Supermarket', 'NBO-RET01', 'Store', 'KE', 'KES', 'KE-NRB', 4, 'Active', false, '2002')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  type = EXCLUDED.type,
  country = EXCLUDED.country,
  currency = EXCLUDED.currency,
  region_code = EXCLUDED.region_code,
  site_number = EXCLUDED.site_number,
  status = EXCLUDED.status,
  is_fulfillment_node = EXCLUDED.is_fulfillment_node,
  barcode_prefix = EXCLUDED.barcode_prefix;

-- Link Regional Administration hubs to regions
UPDATE public.regions SET admin_hub_site_id = 'bb0425bc-3119-449a-a685-b871e552bee9' WHERE code = 'ET-ADD';
UPDATE public.regions SET admin_hub_site_id = '6c38f106-4590-4ff3-ae68-b9ab657fff8e' WHERE code = 'KE-NRB';

-- 6. SKU Counters for Country-Sovereign Product Cataloging
INSERT INTO public.sku_counters (country_code, category_prefix, last_value) VALUES
  ('ET', 'GROC', 1000),
  ('ET', 'BEV', 1000),
  ('KE', 'GROC', 1000),
  ('KE', 'BEV', 1000)
ON CONFLICT DO NOTHING;

-- 7. Synthetic Staging Executive (CEO) Account Binding
-- Binds the created Supabase Auth user to public.users, public.employees, and public.wallets
INSERT INTO public.users (id, auth_id, email, full_name, default_language, region_code, created_at, updated_at)
VALUES (
  '988fb8ef-8053-415b-9032-2aca981058d7',
  '988fb8ef-8053-415b-9032-2aca981058d7',
  'admin@staging.siifmart.com',
  'Staging Executive Admin',
  'en',
  'ET-ADD',
  now(),
  now()
)
ON CONFLICT (auth_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  region_code = EXCLUDED.region_code,
  updated_at = now();

INSERT INTO public.wallets (user_id, currency_code, balance_cents, created_at, updated_at)
VALUES (
  '988fb8ef-8053-415b-9032-2aca981058d7',
  'ETB',
  0,
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

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
VALUES (
  '988fb8ef-8053-415b-9032-2aca981058d7',
  'bb0425bc-3119-449a-a685-b871e552bee9',
  'Staging Executive Admin',
  'CEO',
  'admin@staging.siifmart.com',
  '2026-01-01',
  'HQ',
  'Chief Executive Officer',
  'Executive',
  'ET-ADD',
  'Active',
  'EMP-STG-001',
  now(),
  now()
)
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

RESET search_path;
