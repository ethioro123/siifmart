-- Migration: Normalize employee official emails to uppercase code format without hash suffixes
-- Description: Standardizes employee login emails to KE-SIIF0046@siifmart.com format and cleans orphan accounts.

-- 1. Remove duplicate/orphan auth accounts with random hash suffixes
DELETE FROM auth.users WHERE id IN (
  'a71e7712-7964-4cdb-b639-2d7d5474cddc',
  '606edeaf-469c-4fe7-9e23-4ba6136cdbf5',
  '7a04a341-3977-4cf4-987e-2a9de516c45c'
);

-- 2. Normalize employee email format in employees table
UPDATE employees
SET email = UPPER(code) || '@siifmart.com'
WHERE code IS NOT NULL AND email ILIKE '%@siifmart.com';

-- 3. Normalize employee email in auth.users
UPDATE auth.users
SET email = UPPER(email),
    raw_user_meta_data = jsonb_set(
      coalesce(raw_user_meta_data, '{}'::jsonb),
      '{email}',
      to_jsonb(UPPER(coalesce(raw_user_meta_data->>'email', email)))
    )
WHERE email ILIKE '%-siif%@siifmart.com' OR email ILIKE '%siif-%@siifmart.com';
