-- ======================================================================================
-- SOVEREIGN MULTI-COUNTRY WORKER ID + UNIQUE LOGIN EMAIL MIGRATION
-- Date: 2026-10-03
-- Purpose:
-- 1. Prefix every worker's code with their assigned workplace country (KE-/ET-/UG-/TZ-/RW-SIIFXXXX).
-- 2. Give every employee their own unique login email derived from that code
--    (e.g. KE-SIIF0043 -> ke-siif0043@siifmart.com). Passwords are untouched.
-- 3. Update Supabase Auth (auth.users + auth.identities) AND employees.email together so they never diverge.
-- ======================================================================================

CREATE INDEX IF NOT EXISTS idx_employees_code ON public.employees(code);
CREATE INDEX IF NOT EXISTS idx_employees_code_lower ON public.employees(lower(code));

COMMENT ON COLUMN public.employees.code IS 'Sovereign country-prefixed worker ID (e.g. KE-SIIF0044, ET-SIIF0020, UG-SIIF0100)';

-- Step 1: Prefix codes by assigned facility country
UPDATE public.employees e
SET code = UPPER(COALESCE(s.country, 'ET')) || '-SIIF' || LPAD(COALESCE(SUBSTRING(e.code FROM '[0-9]+'), '1'), 4, '0')
FROM public.sites s
WHERE (e.site_id::text = s.id::text OR e.site_id::text = s.code::text)
  AND (
    e.code ~* '^(SIIF|EMP)-?[0-9]+$'
    OR (e.code ~* '^[A-Z]{2}-SIIF-?[0-9]+$' AND UPPER(SUBSTRING(e.code, 1, 2)) != UPPER(COALESCE(s.country, 'ET')))
  );

-- Step 2: Unassigned workplace -> fall back to phone dial code
UPDATE public.employees e
SET code = CASE
        WHEN e.phone ~* '^\+?254' THEN 'KE-SIIF'
        WHEN e.phone ~* '^\+?256' THEN 'UG-SIIF'
        WHEN e.phone ~* '^\+?255' THEN 'TZ-SIIF'
        WHEN e.phone ~* '^\+?250' THEN 'RW-SIIF'
        ELSE 'ET-SIIF'
    END || LPAD(COALESCE(SUBSTRING(e.code FROM '[0-9]+'), '1'), 4, '0')
WHERE (e.site_id IS NULL OR e.site_id::text = '')
  AND (
    e.code ~* '^(SIIF|EMP)-?[0-9]+$'
    OR (e.code ~* '^ET-SIIF-?[0-9]+$' AND e.phone ~* '^\+?254')
  );

-- Step 3: Update Supabase Auth login emails to the unique code-based email
UPDATE auth.users u
SET email = LOWER(e.code) || '@siifmart.com',
    updated_at = now()
FROM public.employees e
WHERE u.id = e.id
  AND e.code ~* '^[A-Z]{2}-SIIF[0-9]+$'
  AND LOWER(u.email) IS DISTINCT FROM LOWER(e.code) || '@siifmart.com';

-- Step 4: Keep auth identities in sync (email provider identity)
UPDATE auth.identities i
SET identity_data = jsonb_set(COALESCE(i.identity_data, '{}'::jsonb), '{email}', to_jsonb(u.email)),
    provider_id = CASE WHEN i.provider_id = i.user_id::text THEN i.provider_id ELSE u.email END,
    updated_at = now()
FROM auth.users u
WHERE i.user_id = u.id
  AND i.provider = 'email';

-- Step 5: Mirror the unique email into employees.email
UPDATE public.employees e
SET email = LOWER(u.email)
FROM auth.users u
WHERE u.id = e.id
  AND LOWER(e.email) IS DISTINCT FROM LOWER(u.email);
