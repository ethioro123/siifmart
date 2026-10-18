-- ============================================================================
-- Migration: 20261018_staging_three_tier_facilities_and_roles.sql
-- Purpose: Establish the 3-level facility hierarchy (HQ, Regional Administration,
--          and Operation Sites: Store, Warehouse, Distribution Center, Online Store)
--          and seed all 55 canonical roles per country (Ethiopia & Kenya) + Global CEO.
-- ============================================================================

BEGIN;

-- 1. Expand check_employee_role constraint to include all canonical regional roles
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS check_employee_role;
ALTER TABLE public.employees ADD CONSTRAINT check_employee_role CHECK (
  (role)::text = ANY (ARRAY[
    'super_admin', 'CEO', 'ceo', 'admin', 'hr', 'pos',
    'operations_manager', 'finance_manager', 'hr_manager',
    'procurement_manager', 'supply_chain_manager', 'merchandising_manager',
    'regional_manager', 'regional_procurement_lead', 'regional_finance_officer',
    'regional_hr_officer', 'regional_logistics_lead', 'regional_security_supervisor',
    'store_manager', 'warehouse_manager', 'logistics_manager', 'inventory_manager',
    'security_manager', 'dispatch_manager', 'assistant_manager', 'vendor_relations_manager',
    'fleet_maintenance_supervisor', 'shift_lead', 'cs_manager', 'store_supervisor',
    'cashier', 'sales_associate', 'stock_clerk', 'picker', 'packer', 'receiver',
    'driver', 'forklift_operator', 'inventory_specialist', 'customer_service',
    'auditor', 'it_support', 'buyer', 'demand_planner', 'replenishment_planner',
    'customs_import_specialist', 'inbound_qc_inspector', 'store_operations_auditor',
    'dispatcher', 'returns_clerk', 'merchandiser', 'loss_prevention',
    'accountant', 'data_analyst', 'training_coordinator', 'payroll_specialist',
    'talent_recruiter', 'treasury_officer', 'tax_compliance_officer', 'credit_control_officer'
  ]::text[])
);

-- 2. Upsert the 3 Facility Levels per Country (HQ, Regional Admin, Store, Warehouse, DC, Online Store)
INSERT INTO public.sites (id, code, name, type, address, status, country, currency, region_code, site_number)
VALUES
  -- ETHIOPIA (ET)
  ('bb0425bc-3119-449a-a685-b871e552bee0', 'ET-HQ',         'Central Operations',                  'Administration',      'Churchill Ave, Addis Ababa', 'Active', 'ET', 'ETB', NULL,     10),
  ('bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD',        'Addis Ababa Regional Administration', 'Administration',      'Bole Road, Addis Ababa',     'Active', 'ET', 'ETB', 'ET-ADD', 19),
  ('a1111111-1111-4000-8000-000000000001', 'ET-ADD-DC-01',  'Addis Ababa Distribution Center',     'Distribution Center', 'Akaki Kality, Addis Ababa',  'Active', 'ET', 'ETB', 'ET-ADD', 1),
  ('a1111111-1111-4000-8000-000000000002', 'ET-ADD-STR-01', 'Bole Supermarket',                    'Store',               'Bole Medhanealem, Addis',    'Active', 'ET', 'ETB', 'ET-ADD', 2),
  ('a1111111-1111-4000-8000-000000000005', 'ET-ADD-WH-01',  'Kality Storage Warehouse',            'Warehouse',           'Kality Industrial, Addis',   'Active', 'ET', 'ETB', 'ET-ADD', 5),
  ('a1111111-1111-4000-8000-000000000006', 'ET-ADD-ONL-01', 'Addis Ababa Online Store',            'Dark Store',          'Kazanchis Hub, Addis Ababa', 'Active', 'ET', 'ETB', 'ET-ADD', 6),
  -- KENYA (KE)
  ('6c38f106-4590-4ff3-ae68-b9ab657fff99', 'KE-HQ',         'Kenya Central Operations',            'Administration',      'Upper Hill, Nairobi',        'Active', 'KE', 'KES', NULL,     18),
  ('6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB',        'Nairobi Region Administration',       'Administration',      'Westlands Rd, Nairobi',      'Active', 'KE', 'KES', 'KE-NRB', 13),
  ('a1111111-1111-4000-8000-000000000003', 'KE-NRB-DC-01',  'Nairobi Distribution Center',         'Distribution Center', 'Embakasi North, Nairobi',    'Active', 'KE', 'KES', 'KE-NRB', 3),
  ('a1111111-1111-4000-8000-000000000004', 'KE-NRB-STR-01', 'Westlands Supermarket',               'Store',               'Waiyaki Way, Nairobi',       'Active', 'KE', 'KES', 'KE-NRB', 4),
  ('a1111111-1111-4000-8000-000000000007', 'KE-NRB-WH-01',  'Eastleigh Storage Warehouse',         'Warehouse',           'First Ave Eastleigh, NBO',   'Active', 'KE', 'KES', 'KE-NRB', 7),
  ('a1111111-1111-4000-8000-000000000008', 'KE-NRB-ONL-01', 'Nairobi Online Store',                'Dark Store',          'Kilimani Digital Hub, NBO',  'Active', 'KE', 'KES', 'KE-NRB', 8)
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  address = EXCLUDED.address,
  status = EXCLUDED.status,
  country = EXCLUDED.country,
  currency = EXCLUDED.currency,
  region_code = EXCLUDED.region_code,
  site_number = EXCLUDED.site_number;

-- 3. Clean old non-CEO staging employees & auth accounts before seeding canonical 110 country accounts
DELETE FROM public.employees WHERE email LIKE '%@staging.siifmart.com' AND email <> 'admin@staging.siifmart.com';
DELETE FROM public.users WHERE email LIKE '%@staging.siifmart.com' AND email <> 'admin@staging.siifmart.com';
DELETE FROM auth.users WHERE email LIKE '%@staging.siifmart.com' AND email <> 'admin@staging.siifmart.com';

-- Ensure Global CEO exists and has canonical title & HQ scope
UPDATE public.employees
   SET role = 'super_admin',
       job_title = 'Chief Executive Officer',
       site_id = 'bb0425bc-3119-449a-a685-b871e552bee0',
       region_code = NULL,
       scope_level = 'HQ',
       code = 'EMP-STG-001',
       status = 'Active'
 WHERE email = 'admin@staging.siifmart.com';

-- 4. Seed all 110 country role accounts (55 Ethiopia + 55 Kenya) across auth.users, public.users, and public.employees
DO $$
DECLARE
  v_pw_hash text := crypt('StagingPassword123!', gen_salt('bf'));
  rec record;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
    ('e1000000-0000-4000-8000-000000000001'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Abebe Bikila', 'admin', 'System Administrator', 'et.admin@staging.siifmart.com', '+251911000001', 'Management', 'ET-STG-001', NULL, 'HQ', 95000),
    ('e2000000-0000-4000-8000-000000000001'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Kipchoge Keino', 'admin', 'System Administrator', 'ke.admin@staging.siifmart.com', '+254711000001', 'Management', 'KE-STG-001', NULL, 'HQ', 260000),
    ('e1000000-0000-4000-8000-000000000002'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Sara Tesfaye', 'operations_manager', 'Head of Operations', 'et.operationsmanager@staging.siifmart.com', '+251911000002', 'Management', 'ET-STG-002', NULL, 'HQ', 75000),
    ('e2000000-0000-4000-8000-000000000002'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Omondi Samuel', 'operations_manager', 'Head of Operations', 'ke.operationsmanager@staging.siifmart.com', '+254711000002', 'Management', 'KE-STG-002', NULL, 'HQ', 195000),
    ('e1000000-0000-4000-8000-000000000003'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Dawit Haile', 'finance_manager', 'Head of Finance', 'et.financemanager@staging.siifmart.com', '+251911000003', 'Finance', 'ET-STG-003', NULL, 'HQ', 75000),
    ('e2000000-0000-4000-8000-000000000003'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Mwangi Kariuki', 'finance_manager', 'Head of Finance', 'ke.financemanager@staging.siifmart.com', '+254711000003', 'Finance', 'KE-STG-003', NULL, 'HQ', 195000),
    ('e1000000-0000-4000-8000-000000000004'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Tigist Alemayehu', 'hr_manager', 'Head of Human Resources', 'et.hrmanager@staging.siifmart.com', '+251911000004', 'Human Resources', 'ET-STG-004', NULL, 'HQ', 75000),
    ('e2000000-0000-4000-8000-000000000004'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Musyoka Kioko', 'hr_manager', 'Head of Human Resources', 'ke.hrmanager@staging.siifmart.com', '+254711000004', 'Human Resources', 'KE-STG-004', NULL, 'HQ', 195000),
    ('e1000000-0000-4000-8000-000000000005'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Yohannes Bekele', 'procurement_manager', 'Head of Procurement', 'et.procurementmanager@staging.siifmart.com', '+251911000005', 'Procurement', 'ET-STG-005', NULL, 'HQ', 75000),
    ('e2000000-0000-4000-8000-000000000005'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Oscar Kennedy', 'procurement_manager', 'Head of Procurement', 'ke.procurementmanager@staging.siifmart.com', '+254711000005', 'Procurement', 'KE-STG-005', NULL, 'HQ', 195000),
    ('e1000000-0000-4000-8000-000000000006'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Rahel Tesfaye', 'supply_chain_manager', 'Head of Supply Chain', 'et.supplychainmanager@staging.siifmart.com', '+251911000006', 'Management', 'ET-STG-006', NULL, 'HQ', 75000),
    ('e2000000-0000-4000-8000-000000000006'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Juma Waweru', 'supply_chain_manager', 'Head of Supply Chain', 'ke.supplychainmanager@staging.siifmart.com', '+254711000006', 'Management', 'KE-STG-006', NULL, 'HQ', 195000),
    ('e1000000-0000-4000-8000-000000000007'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Mulugeta Tadesse', 'merchandising_manager', 'Head of Merchandising', 'et.merchandisingmanager@staging.siifmart.com', '+251911000007', 'Management', 'ET-STG-007', NULL, 'HQ', 75000),
    ('e2000000-0000-4000-8000-000000000007'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Njeri Muthoni', 'merchandising_manager', 'Head of Merchandising', 'ke.merchandisingmanager@staging.siifmart.com', '+254711000007', 'Management', 'KE-STG-007', NULL, 'HQ', 195000),
    ('e1000000-0000-4000-8000-000000000008'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Meron Assefa', 'cs_manager', 'Customer Service Manager', 'et.csmanager@staging.siifmart.com', '+251911000008', 'Management', 'ET-STG-008', NULL, 'HQ', 42000),
    ('e2000000-0000-4000-8000-000000000008'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Amina Hassan', 'cs_manager', 'Customer Service Manager', 'ke.csmanager@staging.siifmart.com', '+254711000008', 'Management', 'KE-STG-008', NULL, 'HQ', 110000),
    ('e1000000-0000-4000-8000-000000000009'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Bereket Solomon', 'vendor_relations_manager', 'Vendor Relations Manager', 'et.vendorrelationsmanager@staging.siifmart.com', '+251911000009', 'Procurement', 'ET-STG-009', NULL, 'HQ', 42000),
    ('e2000000-0000-4000-8000-000000000009'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Benson Kipruto', 'vendor_relations_manager', 'Vendor Relations Manager', 'ke.vendorrelationsmanager@staging.siifmart.com', '+254711000009', 'Procurement', 'KE-STG-009', NULL, 'HQ', 110000),
    ('e1000000-0000-4000-8000-000000000010'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Elias Kebede', 'auditor', 'Internal Auditor', 'et.auditor@staging.siifmart.com', '+251911000010', 'Management', 'ET-STG-010', NULL, 'HQ', 18500),
    ('e2000000-0000-4000-8000-000000000010'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Wanjiku Njoroge', 'auditor', 'Internal Auditor', 'ke.auditor@staging.siifmart.com', '+254711000010', 'Management', 'KE-STG-010', NULL, 'HQ', 48000),
    ('e1000000-0000-4000-8000-000000000011'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Hanna Girma', 'store_operations_auditor', 'Store Operations Auditor', 'et.storeoperationsauditor@staging.siifmart.com', '+251911000011', 'Management', 'ET-STG-011', NULL, 'HQ', 18500),
    ('e2000000-0000-4000-8000-000000000011'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Grace Wambui', 'store_operations_auditor', 'Store Operations Auditor', 'ke.storeoperationsauditor@staging.siifmart.com', '+254711000011', 'Management', 'KE-STG-011', NULL, 'HQ', 48000),
    ('e1000000-0000-4000-8000-000000000012'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Tewodros Kassahun', 'accountant', 'Accountant', 'et.accountant@staging.siifmart.com', '+251911000012', 'Finance', 'ET-STG-012', NULL, 'HQ', 18500),
    ('e2000000-0000-4000-8000-000000000012'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Peter Ndegwa', 'accountant', 'Accountant', 'ke.accountant@staging.siifmart.com', '+254711000012', 'Finance', 'KE-STG-012', NULL, 'HQ', 48000),
    ('e1000000-0000-4000-8000-000000000013'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Selamawit Mekonnen', 'treasury_officer', 'Treasury Officer', 'et.treasuryofficer@staging.siifmart.com', '+251911000013', 'Finance', 'ET-STG-013', NULL, 'HQ', 18500),
    ('e2000000-0000-4000-8000-000000000013'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Mercy Cherono', 'treasury_officer', 'Treasury Officer', 'ke.treasuryofficer@staging.siifmart.com', '+254711000013', 'Finance', 'KE-STG-013', NULL, 'HQ', 48000),
    ('e1000000-0000-4000-8000-000000000014'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Biniyam Tadesse', 'tax_compliance_officer', 'Tax Compliance Officer', 'et.taxcomplianceofficer@staging.siifmart.com', '+251911000014', 'Finance', 'ET-STG-014', NULL, 'HQ', 18500),
    ('e2000000-0000-4000-8000-000000000014'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'David Rudisha', 'tax_compliance_officer', 'Tax Compliance Officer', 'ke.taxcomplianceofficer@staging.siifmart.com', '+254711000014', 'Finance', 'KE-STG-014', NULL, 'HQ', 48000),
    ('e1000000-0000-4000-8000-000000000015'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Fikirte Worku', 'credit_control_officer', 'Credit Control Officer', 'et.creditcontrolofficer@staging.siifmart.com', '+251911000015', 'Finance', 'ET-STG-015', NULL, 'HQ', 18500),
    ('e2000000-0000-4000-8000-000000000015'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Hellen Obiri', 'credit_control_officer', 'Credit Control Officer', 'ke.creditcontrolofficer@staging.siifmart.com', '+254711000015', 'Finance', 'KE-STG-015', NULL, 'HQ', 48000),
    ('e1000000-0000-4000-8000-000000000016'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Natnael Desta', 'payroll_specialist', 'Payroll Specialist', 'et.payrollspecialist@staging.siifmart.com', '+251911000016', 'Human Resources', 'ET-STG-016', NULL, 'HQ', 18500),
    ('e2000000-0000-4000-8000-000000000016'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Faith Kipyegon', 'payroll_specialist', 'Payroll Specialist', 'ke.payrollspecialist@staging.siifmart.com', '+254711000016', 'Human Resources', 'KE-STG-016', NULL, 'HQ', 48000),
    ('e1000000-0000-4000-8000-000000000017'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Hiwot Hailu', 'talent_recruiter', 'Talent Acquisition Specialist', 'et.talentrecruiter@staging.siifmart.com', '+251911000017', 'Human Resources', 'ET-STG-017', NULL, 'HQ', 18500),
    ('e2000000-0000-4000-8000-000000000017'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Kelvin Kiptum', 'talent_recruiter', 'Talent Acquisition Specialist', 'ke.talentrecruiter@staging.siifmart.com', '+254711000017', 'Human Resources', 'KE-STG-017', NULL, 'HQ', 48000),
    ('e1000000-0000-4000-8000-000000000018'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Yared Getachew', 'training_coordinator', 'Training Coordinator', 'et.trainingcoordinator@staging.siifmart.com', '+251911000018', 'Human Resources', 'ET-STG-018', NULL, 'HQ', 18500),
    ('e2000000-0000-4000-8000-000000000018'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Eliud Kipchoge', 'training_coordinator', 'Training Coordinator', 'ke.trainingcoordinator@staging.siifmart.com', '+254711000018', 'Human Resources', 'KE-STG-018', NULL, 'HQ', 48000),
    ('e1000000-0000-4000-8000-000000000019'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Kidist Tilahun', 'data_analyst', 'Business Data Analyst', 'et.dataanalyst@staging.siifmart.com', '+251911000019', 'Management', 'ET-STG-019', NULL, 'HQ', 18500),
    ('e2000000-0000-4000-8000-000000000019'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Beatrice Chebet', 'data_analyst', 'Business Data Analyst', 'ke.dataanalyst@staging.siifmart.com', '+254711000019', 'Management', 'KE-STG-019', NULL, 'HQ', 48000),
    ('e1000000-0000-4000-8000-000000000020'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Samuel Negash', 'it_support', 'IT Support Specialist', 'et.itsupport@staging.siifmart.com', '+251911000020', 'Management', 'ET-STG-020', NULL, 'HQ', 18500),
    ('e2000000-0000-4000-8000-000000000020'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Ferdinand Omanyala', 'it_support', 'IT Support Specialist', 'ke.itsupport@staging.siifmart.com', '+254711000020', 'Management', 'KE-STG-020', NULL, 'HQ', 48000),
    ('e1000000-0000-4000-8000-000000000021'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Lensa Gemechu', 'buyer', 'Procurement Buyer', 'et.buyer@staging.siifmart.com', '+251911000021', 'Procurement', 'ET-STG-021', NULL, 'HQ', 18500),
    ('e2000000-0000-4000-8000-000000000021'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Mary Moraa', 'buyer', 'Procurement Buyer', 'ke.buyer@staging.siifmart.com', '+254711000021', 'Procurement', 'KE-STG-021', NULL, 'HQ', 48000),
    ('e1000000-0000-4000-8000-000000000022'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Dagmawi Ayele', 'demand_planner', 'Demand Planner', 'et.demandplanner@staging.siifmart.com', '+251911000022', 'Logistics & Warehouse', 'ET-STG-022', NULL, 'HQ', 18500),
    ('e2000000-0000-4000-8000-000000000022'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Conseslus Kipruto', 'demand_planner', 'Demand Planner', 'ke.demandplanner@staging.siifmart.com', '+254711000022', 'Logistics & Warehouse', 'KE-STG-022', NULL, 'HQ', 48000),
    ('e1000000-0000-4000-8000-000000000023'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee0'::uuid, 'Bethlehem Zewdu', 'customs_import_specialist', 'Customs and Import Specialist', 'et.customsimportspecialist@staging.siifmart.com', '+251911000023', 'Procurement', 'ET-STG-023', NULL, 'HQ', 18500),
    ('e2000000-0000-4000-8000-000000000023'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff99'::uuid, 'Brigid Kosgei', 'customs_import_specialist', 'Customs and Import Specialist', 'ke.customsimportspecialist@staging.siifmart.com', '+254711000023', 'Procurement', 'KE-STG-023', NULL, 'HQ', 48000),
    ('e1000000-0000-4000-8000-000000000024'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee9'::uuid, 'Henok Tadesse', 'regional_manager', 'Regional Operations Manager', 'et.regionalmanager@staging.siifmart.com', '+251911000024', 'Management', 'ET-STG-024', 'ET-ADD', 'REGIONAL', 75000),
    ('e2000000-0000-4000-8000-000000000024'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff8e'::uuid, 'Kamau Ndenga', 'regional_manager', 'Regional Operations Manager', 'ke.regionalmanager@staging.siifmart.com', '+254711000024', 'Management', 'KE-STG-024', 'KE-NRB', 'REGIONAL', 195000),
    ('e1000000-0000-4000-8000-000000000025'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee9'::uuid, 'Solomon Kebede', 'regional_procurement_lead', 'Regional Procurement Lead', 'et.regionalprocurementlead@staging.siifmart.com', '+251911000025', 'Procurement', 'ET-STG-025', 'ET-ADD', 'REGIONAL', 75000),
    ('e2000000-0000-4000-8000-000000000025'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff8e'::uuid, 'Mutua Wambua', 'regional_procurement_lead', 'Regional Procurement Lead', 'ke.regionalprocurementlead@staging.siifmart.com', '+254711000025', 'Procurement', 'KE-STG-025', 'KE-NRB', 'REGIONAL', 195000),
    ('e1000000-0000-4000-8000-000000000026'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee9'::uuid, 'Almaz Ayana', 'regional_finance_officer', 'Regional Finance Officer', 'et.regionalfinanceofficer@staging.siifmart.com', '+251911000026', 'Finance', 'ET-STG-026', 'ET-ADD', 'REGIONAL', 75000),
    ('e2000000-0000-4000-8000-000000000026'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff8e'::uuid, 'Otieno Onyango', 'regional_finance_officer', 'Regional Finance Officer', 'ke.regionalfinanceofficer@staging.siifmart.com', '+254711000026', 'Finance', 'KE-STG-026', 'KE-NRB', 'REGIONAL', 195000),
    ('e1000000-0000-4000-8000-000000000027'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee9'::uuid, 'Tariku Jufar', 'regional_hr_officer', 'Regional Human Resources Officer', 'et.regionalhrofficer@staging.siifmart.com', '+251911000027', 'Human Resources', 'ET-STG-027', 'ET-ADD', 'REGIONAL', 75000),
    ('e2000000-0000-4000-8000-000000000027'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff8e'::uuid, 'Kibet Chepkonga', 'regional_hr_officer', 'Regional Human Resources Officer', 'ke.regionalhrofficer@staging.siifmart.com', '+254711000027', 'Human Resources', 'KE-STG-027', 'KE-NRB', 'REGIONAL', 195000),
    ('e1000000-0000-4000-8000-000000000028'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee9'::uuid, 'Meseret Defar', 'regional_logistics_lead', 'Regional Logistics Lead', 'et.regionallogisticslead@staging.siifmart.com', '+251911000028', 'Transport', 'ET-STG-028', 'ET-ADD', 'REGIONAL', 75000),
    ('e2000000-0000-4000-8000-000000000028'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff8e'::uuid, 'Chepkirui Langat', 'regional_logistics_lead', 'Regional Logistics Lead', 'ke.regionallogisticslead@staging.siifmart.com', '+254711000028', 'Transport', 'KE-STG-028', 'KE-NRB', 'REGIONAL', 195000),
    ('e1000000-0000-4000-8000-000000000029'::uuid, 'bb0425bc-3119-449a-a685-b871e552bee9'::uuid, 'Girmawit Gebrzihair', 'regional_security_supervisor', 'Regional Security Supervisor', 'et.regionalsecuritysupervisor@staging.siifmart.com', '+251911000029', 'Security', 'ET-STG-029', 'ET-ADD', 'REGIONAL', 75000),
    ('e2000000-0000-4000-8000-000000000029'::uuid, '6c38f106-4590-4ff3-ae68-b9ab657fff8e'::uuid, 'Njuguna Githinji', 'regional_security_supervisor', 'Regional Security Supervisor', 'ke.regionalsecuritysupervisor@staging.siifmart.com', '+254711000029', 'Security', 'KE-STG-029', 'KE-NRB', 'REGIONAL', 195000),
    ('e1000000-0000-4000-8000-000000000030'::uuid, 'a1111111-1111-4000-8000-000000000002'::uuid, 'Kenenisa Bekele', 'store_manager', 'Store Manager', 'et.storemanager@staging.siifmart.com', '+251911000030', 'Retail Operations', 'ET-STG-030', 'ET-ADD', 'REGIONAL', 42000),
    ('e2000000-0000-4000-8000-000000000030'::uuid, 'a1111111-1111-4000-8000-000000000004'::uuid, 'Ochieng Odongo', 'store_manager', 'Store Manager', 'ke.storemanager@staging.siifmart.com', '+254711000030', 'Retail Operations', 'KE-STG-030', 'KE-NRB', 'REGIONAL', 110000),
    ('e1000000-0000-4000-8000-000000000031'::uuid, 'a1111111-1111-4000-8000-000000000002'::uuid, 'Tirunesh Dibaba', 'assistant_manager', 'Assistant Store Manager', 'et.assistantmanager@staging.siifmart.com', '+251911000031', 'Retail Operations', 'ET-STG-031', 'ET-ADD', 'REGIONAL', 42000),
    ('e2000000-0000-4000-8000-000000000031'::uuid, 'a1111111-1111-4000-8000-000000000004'::uuid, 'Wambugu Maina', 'assistant_manager', 'Assistant Store Manager', 'ke.assistantmanager@staging.siifmart.com', '+254711000031', 'Retail Operations', 'KE-STG-031', 'KE-NRB', 'REGIONAL', 110000),
    ('e1000000-0000-4000-8000-000000000032'::uuid, 'a1111111-1111-4000-8000-000000000002'::uuid, 'Haile Gebrselassie', 'store_supervisor', 'Store Supervisor', 'et.storesupervisor@staging.siifmart.com', '+251911000032', 'Retail Operations', 'ET-STG-032', 'ET-ADD', 'REGIONAL', 42000),
    ('e2000000-0000-4000-8000-000000000032'::uuid, 'a1111111-1111-4000-8000-000000000004'::uuid, 'Barasa Wafula', 'store_supervisor', 'Store Supervisor', 'ke.storesupervisor@staging.siifmart.com', '+254711000032', 'Retail Operations', 'KE-STG-032', 'KE-NRB', 'REGIONAL', 110000),
    ('e1000000-0000-4000-8000-000000000033'::uuid, 'a1111111-1111-4000-8000-000000000002'::uuid, 'Derartu Tulu', 'cashier', 'Cashier', 'et.cashier@staging.siifmart.com', '+251911000033', 'Retail Operations', 'ET-STG-033', 'ET-ADD', 'REGIONAL', 18500),
    ('e2000000-0000-4000-8000-000000000033'::uuid, 'a1111111-1111-4000-8000-000000000004'::uuid, 'Simiyu Wekesa', 'cashier', 'Cashier', 'ke.cashier@staging.siifmart.com', '+254711000033', 'Retail Operations', 'KE-STG-033', 'KE-NRB', 'REGIONAL', 48000),
    ('e1000000-0000-4000-8000-000000000034'::uuid, 'a1111111-1111-4000-8000-000000000002'::uuid, 'Gelete Burka', 'sales_associate', 'Retail Sales Associate', 'et.salesassociate@staging.siifmart.com', '+251911000034', 'Retail Operations', 'ET-STG-034', 'ET-ADD', 'REGIONAL', 18500),
    ('e2000000-0000-4000-8000-000000000034'::uuid, 'a1111111-1111-4000-8000-000000000004'::uuid, 'Muthama Kalonzo', 'sales_associate', 'Retail Sales Associate', 'ke.salesassociate@staging.siifmart.com', '+254711000034', 'Retail Operations', 'KE-STG-034', 'KE-NRB', 'REGIONAL', 48000),
    ('e1000000-0000-4000-8000-000000000035'::uuid, 'a1111111-1111-4000-8000-000000000002'::uuid, 'Feyisa Lilesa', 'merchandiser', 'Merchandiser', 'et.merchandiser@staging.siifmart.com', '+251911000035', 'Retail Operations', 'ET-STG-035', 'ET-ADD', 'REGIONAL', 18500),
    ('e2000000-0000-4000-8000-000000000035'::uuid, 'a1111111-1111-4000-8000-000000000004'::uuid, 'Kimani Ichungwah', 'merchandiser', 'Merchandiser', 'ke.merchandiser@staging.siifmart.com', '+254711000035', 'Retail Operations', 'KE-STG-035', 'KE-NRB', 'REGIONAL', 48000),
    ('e1000000-0000-4000-8000-000000000036'::uuid, 'a1111111-1111-4000-8000-000000000002'::uuid, 'Genzebe Dibaba', 'loss_prevention', 'Loss Prevention Officer', 'et.lossprevention@staging.siifmart.com', '+251911000036', 'Security', 'ET-STG-036', 'ET-ADD', 'REGIONAL', 18500),
    ('e2000000-0000-4000-8000-000000000036'::uuid, 'a1111111-1111-4000-8000-000000000004'::uuid, 'Nyongesa Shikuku', 'loss_prevention', 'Loss Prevention Officer', 'ke.lossprevention@staging.siifmart.com', '+254711000036', 'Security', 'KE-STG-036', 'KE-NRB', 'REGIONAL', 48000),
    ('e1000000-0000-4000-8000-000000000037'::uuid, 'a1111111-1111-4000-8000-000000000005'::uuid, 'Selemon Barega', 'warehouse_manager', 'Warehouse Manager', 'et.warehousemanager@staging.siifmart.com', '+251911000037', 'Logistics & Warehouse', 'ET-STG-037', 'ET-ADD', 'REGIONAL', 42000),
    ('e2000000-0000-4000-8000-000000000037'::uuid, 'a1111111-1111-4000-8000-000000000007'::uuid, 'Adhiambo Oloo', 'warehouse_manager', 'Warehouse Manager', 'ke.warehousemanager@staging.siifmart.com', '+254711000037', 'Logistics & Warehouse', 'KE-STG-037', 'KE-NRB', 'REGIONAL', 110000),
    ('e1000000-0000-4000-8000-000000000038'::uuid, 'a1111111-1111-4000-8000-000000000005'::uuid, 'Letesenbet Gidey', 'inventory_manager', 'Inventory Manager', 'et.inventorymanager@staging.siifmart.com', '+251911000038', 'Logistics & Warehouse', 'ET-STG-038', 'ET-ADD', 'REGIONAL', 42000),
    ('e2000000-0000-4000-8000-000000000038'::uuid, 'a1111111-1111-4000-8000-000000000007'::uuid, 'Akinyi Owino', 'inventory_manager', 'Inventory Manager', 'ke.inventorymanager@staging.siifmart.com', '+254711000038', 'Logistics & Warehouse', 'KE-STG-038', 'KE-NRB', 'REGIONAL', 110000),
    ('e1000000-0000-4000-8000-000000000039'::uuid, 'a1111111-1111-4000-8000-000000000005'::uuid, 'Lamecha Girma', 'security_manager', 'Security Manager', 'et.securitymanager@staging.siifmart.com', '+251911000039', 'Security', 'ET-STG-039', 'ET-ADD', 'REGIONAL', 42000),
    ('e2000000-0000-4000-8000-000000000039'::uuid, 'a1111111-1111-4000-8000-000000000007'::uuid, 'Atieno Okoth', 'security_manager', 'Security Manager', 'ke.securitymanager@staging.siifmart.com', '+254711000039', 'Security', 'KE-STG-039', 'KE-NRB', 'REGIONAL', 110000),
    ('e1000000-0000-4000-8000-000000000040'::uuid, 'a1111111-1111-4000-8000-000000000005'::uuid, 'Gudaf Tsegay', 'picker', 'Warehouse Order Picker', 'et.picker@staging.siifmart.com', '+251911000040', 'Logistics & Warehouse', 'ET-STG-040', 'ET-ADD', 'REGIONAL', 18500),
    ('e2000000-0000-4000-8000-000000000040'::uuid, 'a1111111-1111-4000-8000-000000000007'::uuid, 'Awuor Ouma', 'picker', 'Warehouse Order Picker', 'ke.picker@staging.siifmart.com', '+254711000040', 'Logistics & Warehouse', 'KE-STG-040', 'KE-NRB', 'REGIONAL', 48000),
    ('e1000000-0000-4000-8000-000000000041'::uuid, 'a1111111-1111-4000-8000-000000000005'::uuid, 'Tamirat Tola', 'packer', 'Warehouse Packer', 'et.packer@staging.siifmart.com', '+251911000041', 'Logistics & Warehouse', 'ET-STG-041', 'ET-ADD', 'REGIONAL', 18500),
    ('e2000000-0000-4000-8000-000000000041'::uuid, 'a1111111-1111-4000-8000-000000000007'::uuid, 'Moraa Nyaboke', 'packer', 'Warehouse Packer', 'ke.packer@staging.siifmart.com', '+254711000041', 'Logistics & Warehouse', 'KE-STG-041', 'KE-NRB', 'REGIONAL', 48000),
    ('e1000000-0000-4000-8000-000000000042'::uuid, 'a1111111-1111-4000-8000-000000000005'::uuid, 'Gotytom Gebreslase', 'receiver', 'Warehouse Receiving Specialist', 'et.receiver@staging.siifmart.com', '+251911000042', 'Logistics & Warehouse', 'ET-STG-042', 'ET-ADD', 'REGIONAL', 18500),
    ('e2000000-0000-4000-8000-000000000042'::uuid, 'a1111111-1111-4000-8000-000000000007'::uuid, 'Kemunto Bosire', 'receiver', 'Warehouse Receiving Specialist', 'ke.receiver@staging.siifmart.com', '+254711000042', 'Logistics & Warehouse', 'KE-STG-042', 'KE-NRB', 'REGIONAL', 48000),
    ('e1000000-0000-4000-8000-000000000043'::uuid, 'a1111111-1111-4000-8000-000000000005'::uuid, 'Amane Beriso', 'forklift_operator', 'Forklift Operator', 'et.forkliftoperator@staging.siifmart.com', '+251911000043', 'Logistics & Warehouse', 'ET-STG-043', 'ET-ADD', 'REGIONAL', 18500),
    ('e2000000-0000-4000-8000-000000000043'::uuid, 'a1111111-1111-4000-8000-000000000007'::uuid, 'Kerubo Nyambane', 'forklift_operator', 'Forklift Operator', 'ke.forkliftoperator@staging.siifmart.com', '+254711000043', 'Logistics & Warehouse', 'KE-STG-043', 'KE-NRB', 'REGIONAL', 48000),
    ('e1000000-0000-4000-8000-000000000044'::uuid, 'a1111111-1111-4000-8000-000000000001'::uuid, 'Sisay Lemma', 'logistics_manager', 'Logistics Manager', 'et.logisticsmanager@staging.siifmart.com', '+251911000044', 'Transport', 'ET-STG-044', 'ET-ADD', 'REGIONAL', 42000),
    ('e2000000-0000-4000-8000-000000000044'::uuid, 'a1111111-1111-4000-8000-000000000003'::uuid, 'Kwamboka Ombati', 'logistics_manager', 'Logistics Manager', 'ke.logisticsmanager@staging.siifmart.com', '+254711000044', 'Transport', 'KE-STG-044', 'KE-NRB', 'REGIONAL', 110000),
    ('e1000000-0000-4000-8000-000000000045'::uuid, 'a1111111-1111-4000-8000-000000000001'::uuid, 'Worknesh Degefa', 'dispatch_manager', 'Dispatch Manager', 'et.dispatchmanager@staging.siifmart.com', '+251911000045', 'Logistics & Warehouse', 'ET-STG-045', 'ET-ADD', 'REGIONAL', 42000),
    ('e2000000-0000-4000-8000-000000000045'::uuid, 'a1111111-1111-4000-8000-000000000003'::uuid, 'Nyanchama Mochama', 'dispatch_manager', 'Dispatch Manager', 'ke.dispatchmanager@staging.siifmart.com', '+254711000045', 'Logistics & Warehouse', 'KE-STG-045', 'KE-NRB', 'REGIONAL', 110000),
    ('e1000000-0000-4000-8000-000000000046'::uuid, 'a1111111-1111-4000-8000-000000000001'::uuid, 'Mosinet Geremew', 'fleet_maintenance_supervisor', 'Fleet Maintenance Supervisor', 'et.fleetmaintenancesupervisor@staging.siifmart.com', '+251911000046', 'Transport', 'ET-STG-046', 'ET-ADD', 'REGIONAL', 42000),
    ('e2000000-0000-4000-8000-000000000046'::uuid, 'a1111111-1111-4000-8000-000000000003'::uuid, 'Chepngetich Ruth', 'fleet_maintenance_supervisor', 'Fleet Maintenance Supervisor', 'ke.fleetmaintenancesupervisor@staging.siifmart.com', '+254711000046', 'Transport', 'KE-STG-046', 'KE-NRB', 'REGIONAL', 110000),
    ('e1000000-0000-4000-8000-000000000047'::uuid, 'a1111111-1111-4000-8000-000000000001'::uuid, 'Yomif Kejelcha', 'dispatcher', 'Dispatcher', 'et.dispatcher@staging.siifmart.com', '+251911000047', 'Logistics & Warehouse', 'ET-STG-047', 'ET-ADD', 'REGIONAL', 18500),
    ('e2000000-0000-4000-8000-000000000047'::uuid, 'a1111111-1111-4000-8000-000000000003'::uuid, 'Jepchirchir Peres', 'dispatcher', 'Dispatcher', 'ke.dispatcher@staging.siifmart.com', '+254711000047', 'Logistics & Warehouse', 'KE-STG-047', 'KE-NRB', 'REGIONAL', 48000),
    ('e1000000-0000-4000-8000-000000000048'::uuid, 'a1111111-1111-4000-8000-000000000001'::uuid, 'Hagos Gebrhiwet', 'replenishment_planner', 'Replenishment Planner', 'et.replenishmentplanner@staging.siifmart.com', '+251911000048', 'Logistics & Warehouse', 'ET-STG-048', 'ET-ADD', 'REGIONAL', 18500),
    ('e2000000-0000-4000-8000-000000000048'::uuid, 'a1111111-1111-4000-8000-000000000003'::uuid, 'Lokedi Sharon', 'replenishment_planner', 'Replenishment Planner', 'ke.replenishmentplanner@staging.siifmart.com', '+254711000048', 'Logistics & Warehouse', 'KE-STG-048', 'KE-NRB', 'REGIONAL', 48000),
    ('e1000000-0000-4000-8000-000000000049'::uuid, 'a1111111-1111-4000-8000-000000000001'::uuid, 'Muktar Edris', 'inbound_qc_inspector', 'Quality Control Inspector', 'et.inboundqcinspector@staging.siifmart.com', '+251911000049', 'Logistics & Warehouse', 'ET-STG-049', 'ET-ADD', 'REGIONAL', 18500),
    ('e2000000-0000-4000-8000-000000000049'::uuid, 'a1111111-1111-4000-8000-000000000003'::uuid, 'Kiprop Asbel', 'inbound_qc_inspector', 'Quality Control Inspector', 'ke.inboundqcinspector@staging.siifmart.com', '+254711000049', 'Logistics & Warehouse', 'KE-STG-049', 'KE-NRB', 'REGIONAL', 48000),
    ('e1000000-0000-4000-8000-000000000050'::uuid, 'a1111111-1111-4000-8000-000000000001'::uuid, 'Dejen Gebremeskel', 'driver', 'Delivery Driver', 'et.driver@staging.siifmart.com', '+251911000050', 'Transport', 'ET-STG-050', 'ET-ADD', 'REGIONAL', 18500),
    ('e2000000-0000-4000-8000-000000000050'::uuid, 'a1111111-1111-4000-8000-000000000003'::uuid, 'Manangoi Elijah', 'driver', 'Delivery Driver', 'ke.driver@staging.siifmart.com', '+254711000050', 'Transport', 'KE-STG-050', 'KE-NRB', 'REGIONAL', 48000),
    ('e1000000-0000-4000-8000-000000000051'::uuid, 'a1111111-1111-4000-8000-000000000006'::uuid, 'Ibrahim Jeilan', 'shift_lead', 'Shift Supervisor', 'et.shiftlead@staging.siifmart.com', '+251911000051', 'Retail Operations', 'ET-STG-051', 'ET-ADD', 'REGIONAL', 42000),
    ('e2000000-0000-4000-8000-000000000051'::uuid, 'a1111111-1111-4000-8000-000000000008'::uuid, 'Cheruiyot Timothy', 'shift_lead', 'Shift Supervisor', 'ke.shiftlead@staging.siifmart.com', '+254711000051', 'Retail Operations', 'KE-STG-051', 'KE-NRB', 'REGIONAL', 110000),
    ('e1000000-0000-4000-8000-000000000052'::uuid, 'a1111111-1111-4000-8000-000000000006'::uuid, 'Mohammed Aman', 'stock_clerk', 'Inventory Clerk', 'et.stockclerk@staging.siifmart.com', '+251911000052', 'Retail Operations', 'ET-STG-052', 'ET-ADD', 'REGIONAL', 18500),
    ('e2000000-0000-4000-8000-000000000052'::uuid, 'a1111111-1111-4000-8000-000000000008'::uuid, 'Krop Jacob', 'stock_clerk', 'Inventory Clerk', 'ke.stockclerk@staging.siifmart.com', '+254711000052', 'Retail Operations', 'KE-STG-052', 'KE-NRB', 'REGIONAL', 48000),
    ('e1000000-0000-4000-8000-000000000053'::uuid, 'a1111111-1111-4000-8000-000000000006'::uuid, 'Kalkidan Gezahegn', 'inventory_specialist', 'Inventory Control Specialist', 'et.inventoryspecialist@staging.siifmart.com', '+251911000053', 'Retail Operations', 'ET-STG-053', 'ET-ADD', 'REGIONAL', 18500),
    ('e2000000-0000-4000-8000-000000000053'::uuid, 'a1111111-1111-4000-8000-000000000008'::uuid, 'Ebenyo Daniel', 'inventory_specialist', 'Inventory Control Specialist', 'ke.inventoryspecialist@staging.siifmart.com', '+254711000053', 'Retail Operations', 'KE-STG-053', 'KE-NRB', 'REGIONAL', 48000),
    ('e1000000-0000-4000-8000-000000000054'::uuid, 'a1111111-1111-4000-8000-000000000006'::uuid, 'Freweyni Hailu', 'customer_service', 'Customer Service Representative', 'et.customerservice@staging.siifmart.com', '+251911000054', 'Retail Operations', 'ET-STG-054', 'ET-ADD', 'REGIONAL', 18500),
    ('e2000000-0000-4000-8000-000000000054'::uuid, 'a1111111-1111-4000-8000-000000000008'::uuid, 'Kibiwott Kandie', 'customer_service', 'Customer Service Representative', 'ke.customerservice@staging.siifmart.com', '+254711000054', 'Retail Operations', 'KE-STG-054', 'KE-NRB', 'REGIONAL', 48000),
    ('e1000000-0000-4000-8000-000000000055'::uuid, 'a1111111-1111-4000-8000-000000000006'::uuid, 'Diribe Welteji', 'returns_clerk', 'Returns Specialist', 'et.returnsclerk@staging.siifmart.com', '+251911000055', 'Retail Operations', 'ET-STG-055', 'ET-ADD', 'REGIONAL', 18500),
    ('e2000000-0000-4000-8000-000000000055'::uuid, 'a1111111-1111-4000-8000-000000000008'::uuid, 'Kamworor Geoffrey', 'returns_clerk', 'Returns Specialist', 'ke.returnsclerk@staging.siifmart.com', '+254711000055', 'Retail Operations', 'KE-STG-055', 'KE-NRB', 'REGIONAL', 48000)
    ) AS t(id, site_id, name, role, job_title, email, phone, department, code, region_code, scope_level, salary)
  LOOP
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', rec.id, 'authenticated', 'authenticated',
      rec.email, v_pw_hash, now(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'role', rec.role),
      jsonb_build_object('full_name', rec.name, 'role', rec.role, 'job_title', rec.job_title),
      now(), now(), '', '', '', ''
    ) ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      encrypted_password = EXCLUDED.encrypted_password,
      raw_app_meta_data = EXCLUDED.raw_app_meta_data,
      raw_user_meta_data = EXCLUDED.raw_user_meta_data,
      updated_at = now();

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      rec.id, rec.id, rec.id::text,
      jsonb_build_object('sub', rec.id::text, 'email', rec.email, 'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now()
    ) ON CONFLICT (provider_id, provider) DO UPDATE SET
      identity_data = EXCLUDED.identity_data,
      updated_at = now();

    INSERT INTO public.users (
      id, auth_id, email, phone, full_name, default_language, region_code,
      verified_phone, verified_id, verified_face, created_at, updated_at
    ) VALUES (
      rec.id, rec.id, rec.email, rec.phone, rec.name, 'en', rec.region_code,
      true, true, true, now(), now()
    ) ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      full_name = EXCLUDED.full_name,
      region_code = EXCLUDED.region_code,
      updated_at = now();

    INSERT INTO public.employees (
      id, site_id, name, role, job_title, email, phone, status,
      join_date, department, performance_score, attendance_rate,
      salary, code, region_code, scope_level, created_at, updated_at
    ) VALUES (
      rec.id, rec.site_id, rec.name, rec.role, rec.job_title, rec.email, rec.phone, 'Active',
      CURRENT_DATE, rec.department, 95, 98,
      rec.salary, rec.code, rec.region_code, rec.scope_level, now(), now()
    ) ON CONFLICT (id) DO UPDATE SET
      site_id = EXCLUDED.site_id,
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      job_title = EXCLUDED.job_title,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      status = 'Active',
      department = EXCLUDED.department,
      salary = EXCLUDED.salary,
      code = EXCLUDED.code,
      region_code = EXCLUDED.region_code,
      scope_level = EXCLUDED.scope_level,
      updated_at = now();
  END LOOP;
END $$;

COMMIT;
