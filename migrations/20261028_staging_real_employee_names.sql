-- ============================================================================
-- SIIFMART STAGING REAL EMPLOYEE NAMES MIGRATION
-- Migration: 20261028_staging_real_employee_names.sql
-- Purpose:
--   Replaces all generic/numbered staging names (e.g. "[TEST] ...",
--   "ET-ADA Finance Support 1", "Staging Executive Admin") with authentic,
--   dignified, realistic Ethiopian, Kenyan, and Executive human names across
--   public.employees, public.users, and auth.users.
-- ============================================================================

BEGIN;

-- 1. Update CEO Staging Account
UPDATE public.employees
SET name = 'Dr. Shukri Idriss',
    updated_at = now()
WHERE email = 'admin@staging.siifmart.com' AND role = 'group_ceo';

-- 2. Update Specific 52 Support Accounts with Authentic Real Names
CREATE TEMP TABLE temp_support_real_names (
  email text PRIMARY KEY,
  real_name text NOT NULL
) ON COMMIT DROP;

INSERT INTO temp_support_real_names (email, real_name) VALUES
  -- Ethiopia Adama (ET-ADA) Support Roles
  ('et-ada.support.finance.1@staging.siifmart.com', 'Almaz Tadesse'),
  ('et-ada.support.finance.2@staging.siifmart.com', 'Dawit Kebede'),
  ('et-ada.support.humanresources.1@staging.siifmart.com', 'Genet Assefa'),
  ('et-ada.support.humanresources.2@staging.siifmart.com', 'Tadesse Tolossa'),
  ('et-ada.support.management.1@staging.siifmart.com', 'Selamawit Desta'),
  ('et-ada.support.management.2@staging.siifmart.com', 'Kenenisa Bekele'),
  ('et-ada.support.procurement.1@staging.siifmart.com', 'Yonas Haile'),
  ('et-ada.support.procurement.2@staging.siifmart.com', 'Birtukan Mideksa'),
  ('et-ada.support.security.1@staging.siifmart.com', 'Derartu Tulu'),
  ('et-ada.support.security.2@staging.siifmart.com', 'Haile Gebrselassie'),
  ('et-ada.support.transport.1@staging.siifmart.com', 'Liya Kebede'),
  ('et-ada.support.transport.2@staging.siifmart.com', 'Mulugeta Seraw'),

  -- Ethiopia Addis Ababa (ET-ADD) Support Roles
  ('et-add.support.finance.1@staging.siifmart.com', 'Senait Fisseha'),
  ('et-add.support.finance.2@staging.siifmart.com', 'Berhanu Nega'),
  ('et-add.support.humanresources.1@staging.siifmart.com', 'Tirunesh Dibaba'),
  ('et-add.support.humanresources.2@staging.siifmart.com', 'Sileshi Sihine'),
  ('et-add.support.management.1@staging.siifmart.com', 'Meseret Mengistu'),
  ('et-add.support.management.2@staging.siifmart.com', 'Girma Wolde'),
  ('et-add.support.merchandising.1@staging.siifmart.com', 'Taye Atske'),
  ('et-add.support.merchandising.2@staging.siifmart.com', 'Kalkidan Gezahegne'),
  ('et-add.support.procurement.1@staging.siifmart.com', 'Solomon Barega'),
  ('et-add.support.procurement.2@staging.siifmart.com', 'Tigist Assefa'),
  ('et-add.support.security.1@staging.siifmart.com', 'Abebech Gobena'),
  ('et-add.support.security.2@staging.siifmart.com', 'Worknesh Kidane'),
  ('et-add.support.transport.1@staging.siifmart.com', 'Gudaf Tsegay'),
  ('et-add.support.transport.2@staging.siifmart.com', 'Lamecha Girma'),

  -- Kenya Mombasa (KE-MBA) Support Roles
  ('ke-mba.support.finance.1@staging.siifmart.com', 'Faith Kipyegon'),
  ('ke-mba.support.finance.2@staging.siifmart.com', 'Eliud Kipchoge'),
  ('ke-mba.support.humanresources.1@staging.siifmart.com', 'Wanjiku Karanja'),
  ('ke-mba.support.humanresources.2@staging.siifmart.com', 'Juma Omondi'),
  ('ke-mba.support.management.1@staging.siifmart.com', 'Nyambura Mwangi'),
  ('ke-mba.support.management.2@staging.siifmart.com', 'Kiprono Bett'),
  ('ke-mba.support.procurement.1@staging.siifmart.com', 'Achieng Otieno'),
  ('ke-mba.support.procurement.2@staging.siifmart.com', 'Mutua Musyoka'),
  ('ke-mba.support.security.1@staging.siifmart.com', 'Wafula Simiyu'),
  ('ke-mba.support.security.2@staging.siifmart.com', 'Njeri Kamau'),
  ('ke-mba.support.transport.1@staging.siifmart.com', 'Oduor Odhiambo'),
  ('ke-mba.support.transport.2@staging.siifmart.com', 'Wambui Kimani'),

  -- Kenya Nairobi (KE-NRB) Support Roles
  ('ke-nrb.support.finance.1@staging.siifmart.com', 'Barasa Wanyama'),
  ('ke-nrb.support.finance.2@staging.siifmart.com', 'Chebet Korir'),
  ('ke-nrb.support.humanresources.1@staging.siifmart.com', 'Muthoni Njoroge'),
  ('ke-nrb.support.humanresources.2@staging.siifmart.com', 'Maina Kinyua'),
  ('ke-nrb.support.management.1@staging.siifmart.com', 'Atieno Owino'),
  ('ke-nrb.support.management.2@staging.siifmart.com', 'Kariuki Githinji'),
  ('ke-nrb.support.merchandising.1@staging.siifmart.com', 'Waweru Ndegwa'),
  ('ke-nrb.support.merchandising.2@staging.siifmart.com', 'Adhiambo Onyango'),
  ('ke-nrb.support.procurement.1@staging.siifmart.com', 'Nekesa Wekesa'),
  ('ke-nrb.support.procurement.2@staging.siifmart.com', 'Kipchumba Ruto'),
  ('ke-nrb.support.security.1@staging.siifmart.com', 'Moraa Nyaboke'),
  ('ke-nrb.support.security.2@staging.siifmart.com', 'Cheruiyot Koech'),
  ('ke-nrb.support.transport.1@staging.siifmart.com', 'Kipkemboi Tanui'),
  ('ke-nrb.support.transport.2@staging.siifmart.com', 'Nduta Macharia');

UPDATE public.employees e
SET name = s.real_name,
    updated_at = now()
FROM temp_support_real_names s
WHERE e.email = s.email;

-- 3. Update the 168 Role-Coverage Accounts with Culturally Authentic Real Names
WITH coverage_accounts AS (
  SELECT e.id, s.country,
         row_number() OVER (PARTITION BY s.country ORDER BY e.id) AS rn
  FROM public.employees e
  JOIN public.sites s ON s.id = e.site_id
  WHERE e.email LIKE '%@role-coverage.staging.siifmart.invalid'
),
generated_names AS (
  SELECT id,
    CASE WHEN country = 'ET' THEN
      (ARRAY[
        'Alemayehu', 'Abebe', 'Almaz', 'Dawit', 'Genet', 'Tadesse', 'Selamawit', 'Kenenisa',
        'Yonas', 'Birtukan', 'Derartu', 'Haile', 'Liya', 'Mulugeta', 'Senait', 'Berhanu',
        'Tirunesh', 'Sileshi', 'Meseret', 'Girma', 'Taye', 'Kalkidan', 'Solomon', 'Tigist',
        'Abebech', 'Worknesh', 'Gudaf', 'Lamecha', 'Ermias', 'Mekdes', 'Robel', 'Eden',
        'Tewodros', 'Mahlet', 'Samson', 'Hunduma', 'Girmawit', 'Meron', 'Elias', 'Hanna',
        'Biniyam', 'Tolera', 'Tariku', 'Mulu', 'Fikre', 'Zewditu', 'Tamrat', 'Aschalew',
        'Nebiyu', 'Kassahun', 'Yeshi', 'Muluken', 'Dagnachew', 'Sintayehu', 'Wondwossen',
        'Baye', 'Belachew', 'Teshome', 'Getachew', 'Worku'
      ])[1 + ((rn - 1) % 60)]
      || ' ' ||
      (ARRAY[
        'Bikila', 'Ayana', 'Kebede', 'Assefa', 'Tolossa', 'Desta', 'Bekele', 'Haile',
        'Mideksa', 'Tulu', 'Gebrselassie', 'Seraw', 'Fisseha', 'Nega', 'Dibaba', 'Sihine',
        'Mengistu', 'Wolde', 'Atske', 'Gezahegne', 'Barega', 'Gobena', 'Kidane', 'Tsegay',
        'Girma', 'Negash', 'Worku', 'Tadesse', 'Defar', 'Gebrzihair', 'Daba', 'Feyisa',
        'Abate', 'Demissie', 'Alemu', 'Tefera', 'Tesfaye', 'Mekonnen', 'Lemma', 'Hailu',
        'Belay', 'Bogale', 'Gashaw', 'Zeleke', 'Berhe', 'Gebre', 'Kassa', 'Wondimu',
        'Yilma', 'Shiferaw', 'Abebe', 'Tilahun', 'Kidanemariam', 'Yohannes', 'Mebratu',
        'Admasu', 'Wondie', 'Teshale', 'Tafesse', 'Habtamu'
      ])[1 + ((rn * 3) % 60)]
    ELSE
      (ARRAY[
        'Kamau', 'Faith', 'Eliud', 'Wanjiku', 'Juma', 'Nyambura', 'Kiprono', 'Achieng',
        'Mutua', 'Wafula', 'Njeri', 'Oduor', 'Wambui', 'Barasa', 'Chebet', 'Muthoni',
        'Maina', 'Atieno', 'Kariuki', 'Waweru', 'Adhiambo', 'Nekesa', 'Kipchumba', 'Moraa',
        'Cheruiyot', 'Kipkemboi', 'Nduta', 'Gideon', 'Makena', 'Amina', 'Kennedy', 'Oscar',
        'Chepkirui', 'Kazungu', 'Benson', 'David', 'Rashid', 'Otieno', 'Mercy', 'Dennis',
        'Brian', 'Grace', 'Evans', 'Lilian', 'Kelvin', 'Beatrice', 'Victor', 'Joy',
        'Collins', 'Brenda', 'Geoffrey', 'Sharon', 'Emmanuel', 'Priscilla', 'Peter',
        'Eunice', 'Moses', 'Mary', 'Joseph', 'Esther'
      ])[1 + ((rn - 1) % 60)]
      || ' ' ||
      (ARRAY[
        'Ndenga', 'Kipyegon', 'Kipchoge', 'Karanja', 'Omondi', 'Mwangi', 'Bett', 'Otieno',
        'Musyoka', 'Simiyu', 'Kamau', 'Odhiambo', 'Kimani', 'Wanyama', 'Korir', 'Njoroge',
        'Kinyua', 'Owino', 'Githinji', 'Ndegwa', 'Onyango', 'Wekesa', 'Ruto', 'Nyaboke',
        'Koech', 'Tanui', 'Macharia', 'Jakaranda', 'Benson', 'Wanjiku', 'Odhiambo', 'Kennedy',
        'Langat', 'Kambi', 'Kipruto', 'Rudisha', 'Bedzimba', 'Mutiso', 'Kiplagat', 'Rotich',
        'Koech', 'Kurgat', 'Chelimo', 'Kiptoo', 'Kosgei', 'Kemei', 'Cherono', 'Keter',
        'Kiprotich', 'Lagat', 'Ouma', 'Wanjala', 'Kipkorir', 'Cherotich', 'Kiplimo',
        'Kipchirchir', 'Mutua', 'Wambua', 'Cherop', 'Koech'
      ])[1 + ((rn * 3) % 60)]
    END AS real_name
  FROM coverage_accounts
)
UPDATE public.employees e
SET name = g.real_name,
    updated_at = now()
FROM generated_names g
WHERE e.id = g.id;

-- 4. Synchronize public.users.full_name
UPDATE public.users u
SET full_name = e.name,
    updated_at = now()
FROM public.employees e
WHERE (u.id = e.id OR lower(u.email) = lower(e.email))
  AND u.full_name IS DISTINCT FROM e.name;

-- 5. Synchronize auth.users raw_user_meta_data
UPDATE auth.users au
SET raw_user_meta_data = jsonb_set(
      COALESCE(au.raw_user_meta_data, '{}'::jsonb),
      '{full_name}',
      to_jsonb(e.name)
    ),
    updated_at = now()
FROM public.employees e
WHERE (au.id = e.id OR lower(au.email) = lower(e.email))
  AND (au.raw_user_meta_data->>'full_name') IS DISTINCT FROM e.name;

-- 6. Audit Trail
INSERT INTO public.system_logs (action, module, details)
VALUES (
  'UPDATE_STAGING_EMPLOYEE_REAL_NAMES',
  'Employees',
  'Reorganized staging accounts with authentic real names for executive, support, and site coverage roles.'
);

COMMIT;
