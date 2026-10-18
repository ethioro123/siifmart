-- ============================================================================
-- Migration: 20261018_seed_employees_for_all_regional_facilities.sql
-- Purpose:
--   Provision the complete operational workforce (120 employees) across all 18
--   newly provisioned regional facilities in Ethiopia (ET-ADD, ET-ADA) and
--   Kenya (KE-NRB, KE-MBA):
--     - Regional Administration Hubs (ET-ADA, KE-MBA): 6 regional roles each
--     - Distribution Centers (ET-ADA-DC-01, KE-MBA-DC-01): 7 DC roles each
--     - Warehouses (ET-ADA-WH-01, KE-MBA-WH-01): 7 Warehouse roles each
--     - Online Stores (ET-ADA-ONL-01, KE-MBA-ONL-01): 5 Online Store roles each
--     - 10 New Retail Stores (ET-ADD-STR-02..03, ET-ADA-STR-01..03,
--       KE-NRB-STR-02..03, KE-MBA-STR-01..03): 7 Store roles each
--   Also links public.regions.regional_manager_id and public.sites.manager.
-- ============================================================================

BEGIN;

-- 1. Ensure check_employee_role constraint includes all 55 canonical roles
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

-- 2. Seed all 120 employees for the 18 newly provisioned facilities (60 ET + 60 KE)
DO $$
DECLARE
  v_pw_hash text := crypt('StagingPassword123!', gen_salt('bf'));
  v_site_id uuid;
  rec record;
BEGIN
  FOR rec IN
    SELECT * FROM (VALUES
      -- ======================================================================
      -- ETHIOPIA — ET-ADD NEW RETAIL STORES (ET-ADD-STR-02 & ET-ADD-STR-03)
      -- ======================================================================
      -- ET-ADD-STR-02 (Piassa Heritage Supermarket)
      ('e1000000-0000-4000-8000-000000000056'::uuid, 'ET-ADD-STR-02', 'Tewodros Assefa',    'store_manager',     'Store Manager',             'et.add.str02.storemanager@staging.siifmart.com',     '+251911000056', 'Retail Operations', 'ET-STG-056', 'ET-ADD', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000057'::uuid, 'ET-ADD-STR-02', 'Mekdes Tadesse',     'assistant_manager', 'Assistant Store Manager',   'et.add.str02.assistantmanager@staging.siifmart.com', '+251911000057', 'Retail Operations', 'ET-STG-057', 'ET-ADD', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000058'::uuid, 'ET-ADD-STR-02', 'Girma Bekele',       'store_supervisor',  'Store Supervisor',          'et.add.str02.storesupervisor@staging.siifmart.com',  '+251911000058', 'Retail Operations', 'ET-STG-058', 'ET-ADD', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000059'::uuid, 'ET-ADD-STR-02', 'Eden Haile',         'cashier',           'Cashier',                   'et.add.str02.cashier@staging.siifmart.com',          '+251911000059', 'Retail Operations', 'ET-STG-059', 'ET-ADD', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000060'::uuid, 'ET-ADD-STR-02', 'Robel Kebede',       'sales_associate',   'Retail Sales Associate',    'et.add.str02.salesassociate@staging.siifmart.com',   '+251911000060', 'Retail Operations', 'ET-STG-060', 'ET-ADD', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000061'::uuid, 'ET-ADD-STR-02', 'Mahlet Worku',       'merchandiser',      'Merchandiser',              'et.add.str02.merchandiser@staging.siifmart.com',     '+251911000061', 'Retail Operations', 'ET-STG-061', 'ET-ADD', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000062'::uuid, 'ET-ADD-STR-02', 'Samson Negash',      'loss_prevention',   'Loss Prevention Officer',   'et.add.str02.lossprevention@staging.siifmart.com',   '+251911000062', 'Security',          'ET-STG-062', 'ET-ADD', 'REGIONAL', 18500),
      -- ET-ADD-STR-03 (CMC Summit Supermarket)
      ('e1000000-0000-4000-8000-000000000063'::uuid, 'ET-ADD-STR-03', 'Ermias Desta',       'store_manager',     'Store Manager',             'et.add.str03.storemanager@staging.siifmart.com',     '+251911000063', 'Retail Operations', 'ET-STG-063', 'ET-ADD', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000064'::uuid, 'ET-ADD-STR-03', 'Helen Alemayehu',    'assistant_manager', 'Assistant Store Manager',   'et.add.str03.assistantmanager@staging.siifmart.com', '+251911000064', 'Retail Operations', 'ET-STG-064', 'ET-ADD', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000065'::uuid, 'ET-ADD-STR-03', 'Kassahun Girma',     'store_supervisor',  'Store Supervisor',          'et.add.str03.storesupervisor@staging.siifmart.com',  '+251911000065', 'Retail Operations', 'ET-STG-065', 'ET-ADD', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000066'::uuid, 'ET-ADD-STR-03', 'Betelhem Hailu',     'cashier',           'Cashier',                   'et.add.str03.cashier@staging.siifmart.com',          '+251911000066', 'Retail Operations', 'ET-STG-066', 'ET-ADD', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000067'::uuid, 'ET-ADD-STR-03', 'Nahom Solomon',      'sales_associate',   'Retail Sales Associate',    'et.add.str03.salesassociate@staging.siifmart.com',   '+251911000067', 'Retail Operations', 'ET-STG-067', 'ET-ADD', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000068'::uuid, 'ET-ADD-STR-03', 'Senait Mekonnen',    'merchandiser',      'Merchandiser',              'et.add.str03.merchandiser@staging.siifmart.com',     '+251911000068', 'Retail Operations', 'ET-STG-068', 'ET-ADD', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000069'::uuid, 'ET-ADD-STR-03', 'Fitsum Getachew',    'loss_prevention',   'Loss Prevention Officer',   'et.add.str03.lossprevention@staging.siifmart.com',   '+251911000069', 'Security',          'ET-STG-069', 'ET-ADD', 'REGIONAL', 18500),

      -- ======================================================================
      -- ETHIOPIA — ET-ADA (Adama Oromia Region) ALL 7 FACILITIES
      -- ======================================================================
      -- ET-ADA (Adama Regional Administration)
      ('e1000000-0000-4000-8000-000000000070'::uuid, 'ET-ADA',        'Gemechu Wirtu',      'regional_manager',             'Regional Operations Manager',      'et.ada.regionalmanager@staging.siifmart.com',            '+251911000070', 'Management',            'ET-STG-070', 'ET-ADA', 'REGIONAL', 75000),
      ('e1000000-0000-4000-8000-000000000071'::uuid, 'ET-ADA',        'Bontu Megersa',      'regional_procurement_lead',    'Regional Procurement Lead',        'et.ada.regionalprocurementlead@staging.siifmart.com',    '+251911000071', 'Procurement',           'ET-STG-071', 'ET-ADA', 'REGIONAL', 75000),
      ('e1000000-0000-4000-8000-000000000072'::uuid, 'ET-ADA',        'Tolera Feyisa',      'regional_finance_officer',     'Regional Finance Officer',         'et.ada.regionalfinanceofficer@staging.siifmart.com',     '+251911000072', 'Finance',               'ET-STG-072', 'ET-ADA', 'REGIONAL', 75000),
      ('e1000000-0000-4000-8000-000000000073'::uuid, 'ET-ADA',        'Chaltu Benti',       'regional_hr_officer',          'Regional Human Resources Officer', 'et.ada.regionalhrofficer@staging.siifmart.com',          '+251911000073', 'Human Resources',       'ET-STG-073', 'ET-ADA', 'REGIONAL', 75000),
      ('e1000000-0000-4000-8000-000000000074'::uuid, 'ET-ADA',        'Hunduma Daba',       'regional_logistics_lead',      'Regional Logistics Lead',          'et.ada.regionallogisticslead@staging.siifmart.com',      '+251911000074', 'Transport',             'ET-STG-074', 'ET-ADA', 'REGIONAL', 75000),
      ('e1000000-0000-4000-8000-000000000075'::uuid, 'ET-ADA',        'Wakjira Tolesa',     'regional_security_supervisor', 'Regional Security Supervisor',     'et.ada.regionalsecuritysupervisor@staging.siifmart.com', '+251911000075', 'Security',              'ET-STG-075', 'ET-ADA', 'REGIONAL', 75000),
      -- ET-ADA-DC-01 (Adama Central Distribution Center)
      ('e1000000-0000-4000-8000-000000000076'::uuid, 'ET-ADA-DC-01',  'Bikila Negeri',      'logistics_manager',            'Logistics Manager',                'et.ada.dc01.logisticsmanager@staging.siifmart.com',      '+251911000076', 'Transport',             'ET-STG-076', 'ET-ADA', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000077'::uuid, 'ET-ADA-DC-01',  'Aberash Gudeta',     'dispatch_manager',             'Dispatch Manager',                 'et.ada.dc01.dispatchmanager@staging.siifmart.com',       '+251911000077', 'Logistics & Warehouse', 'ET-STG-077', 'ET-ADA', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000078'::uuid, 'ET-ADA-DC-01',  'Diriba Regassa',     'fleet_maintenance_supervisor', 'Fleet Maintenance Supervisor',     'et.ada.dc01.fleetmaintenance@staging.siifmart.com',      '+251911000078', 'Transport',             'ET-STG-078', 'ET-ADA', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000079'::uuid, 'ET-ADA-DC-01',  'Lemi Berhanu',       'dispatcher',                   'Dispatcher',                       'et.ada.dc01.dispatcher@staging.siifmart.com',            '+251911000079', 'Logistics & Warehouse', 'ET-STG-079', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000080'::uuid, 'ET-ADA-DC-01',  'Kumsa Gelan',        'replenishment_planner',        'Replenishment Planner',            'et.ada.dc01.replenishmentplanner@staging.siifmart.com',  '+251911000080', 'Logistics & Warehouse', 'ET-STG-080', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000081'::uuid, 'ET-ADA-DC-01',  'Dinknesh Taye',      'inbound_qc_inspector',         'Quality Control Inspector',        'et.ada.dc01.inboundqc@staging.siifmart.com',             '+251911000081', 'Logistics & Warehouse', 'ET-STG-081', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000082'::uuid, 'ET-ADA-DC-01',  'Milkesa Mengesha',   'driver',                       'Delivery Driver',                  'et.ada.dc01.driver@staging.siifmart.com',                '+251911000082', 'Transport',             'ET-STG-082', 'ET-ADA', 'REGIONAL', 18500),
      -- ET-ADA-WH-01 (Adama Industrial Warehouse)
      ('e1000000-0000-4000-8000-000000000083'::uuid, 'ET-ADA-WH-01',  'Feyisa Lelisa',      'warehouse_manager',            'Warehouse Manager',                'et.ada.wh01.warehousemanager@staging.siifmart.com',      '+251911000083', 'Logistics & Warehouse', 'ET-STG-083', 'ET-ADA', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000084'::uuid, 'ET-ADA-WH-01',  'Mestawet Tufa',      'inventory_manager',            'Inventory Manager',                'et.ada.wh01.inventorymanager@staging.siifmart.com',      '+251911000084', 'Logistics & Warehouse', 'ET-STG-084', 'ET-ADA', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000085'::uuid, 'ET-ADA-WH-01',  'Tadesse Gemeda',     'security_manager',             'Security Manager',                 'et.ada.wh01.securitymanager@staging.siifmart.com',       '+251911000085', 'Security',              'ET-STG-085', 'ET-ADA', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000086'::uuid, 'ET-ADA-WH-01',  'Ayantu Idosa',       'picker',                       'Warehouse Order Picker',           'et.ada.wh01.picker@staging.siifmart.com',                '+251911000086', 'Logistics & Warehouse', 'ET-STG-086', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000087'::uuid, 'ET-ADA-WH-01',  'Gadisa Birhanu',     'packer',                       'Warehouse Packer',                 'et.ada.wh01.packer@staging.siifmart.com',                '+251911000087', 'Logistics & Warehouse', 'ET-STG-087', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000088'::uuid, 'ET-ADA-WH-01',  'Workitu Bulti',      'receiver',                     'Warehouse Receiving Specialist',   'et.ada.wh01.receiver@staging.siifmart.com',              '+251911000088', 'Logistics & Warehouse', 'ET-STG-088', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000089'::uuid, 'ET-ADA-WH-01',  'Shifera Kebede',     'forklift_operator',            'Forklift Operator',                'et.ada.wh01.forkliftoperator@staging.siifmart.com',      '+251911000089', 'Logistics & Warehouse', 'ET-STG-089', 'ET-ADA', 'REGIONAL', 18500),
      -- ET-ADA-ONL-01 (Adama Online Store)
      ('e1000000-0000-4000-8000-000000000090'::uuid, 'ET-ADA-ONL-01', 'Bamlak Tesfaye',     'shift_lead',                   'Shift Supervisor',                 'et.ada.onl01.shiftlead@staging.siifmart.com',            '+251911000090', 'Retail Operations',     'ET-STG-090', 'ET-ADA', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000091'::uuid, 'ET-ADA-ONL-01', 'Hirut Bedada',       'stock_clerk',                  'Inventory Clerk',                  'et.ada.onl01.stockclerk@staging.siifmart.com',           '+251911000091', 'Retail Operations',     'ET-STG-091', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000092'::uuid, 'ET-ADA-ONL-01', 'Oliya Fekadu',       'inventory_specialist',         'Inventory Control Specialist',     'et.ada.onl01.inventoryspecialist@staging.siifmart.com',  '+251911000092', 'Retail Operations',     'ET-STG-092', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000093'::uuid, 'ET-ADA-ONL-01', 'Sifan Duguma',       'customer_service',             'Customer Service Representative',  'et.ada.onl01.customerservice@staging.siifmart.com',      '+251911000093', 'Retail Operations',     'ET-STG-093', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000094'::uuid, 'ET-ADA-ONL-01', 'Gutema Wakgari',     'returns_clerk',                'Returns Specialist',               'et.ada.onl01.returnsclerk@staging.siifmart.com',         '+251911000094', 'Retail Operations',     'ET-STG-094', 'ET-ADA', 'REGIONAL', 18500),
      -- ET-ADA-STR-01 (Adama Central Supermarket)
      ('e1000000-0000-4000-8000-000000000095'::uuid, 'ET-ADA-STR-01', 'Teshome Negeri',     'store_manager',                'Store Manager',                    'et.ada.str01.storemanager@staging.siifmart.com',         '+251911000095', 'Retail Operations',     'ET-STG-095', 'ET-ADA', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000096'::uuid, 'ET-ADA-STR-01', 'Birtukan Melka',     'assistant_manager',            'Assistant Store Manager',          'et.ada.str01.assistantmanager@staging.siifmart.com',     '+251911000096', 'Retail Operations',     'ET-STG-096', 'ET-ADA', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000097'::uuid, 'ET-ADA-STR-01', 'Kuma Demissie',      'store_supervisor',             'Store Supervisor',                 'et.ada.str01.storesupervisor@staging.siifmart.com',      '+251911000097', 'Retail Operations',     'ET-STG-097', 'ET-ADA', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000098'::uuid, 'ET-ADA-STR-01', 'Lelise Abebe',       'cashier',                      'Cashier',                          'et.ada.str01.cashier@staging.siifmart.com',              '+251911000098', 'Retail Operations',     'ET-STG-098', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000099'::uuid, 'ET-ADA-STR-01', 'Jote Tilahun',       'sales_associate',              'Retail Sales Associate',           'et.ada.str01.salesassociate@staging.siifmart.com',       '+251911000099', 'Retail Operations',     'ET-STG-099', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000100'::uuid, 'ET-ADA-STR-01', 'Meti Wirtu',         'merchandiser',                 'Merchandiser',                     'et.ada.str01.merchandiser@staging.siifmart.com',         '+251911000100', 'Retail Operations',     'ET-STG-100', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000101'::uuid, 'ET-ADA-STR-01', 'Galgalo Boru',       'loss_prevention',              'Loss Prevention Officer',          'et.ada.str01.lossprevention@staging.siifmart.com',       '+251911000101', 'Security',              'ET-STG-101', 'ET-ADA', 'REGIONAL', 18500),
      -- ET-ADA-STR-02 (Bishoftu Lakefront Supermarket)
      ('e1000000-0000-4000-8000-000000000102'::uuid, 'ET-ADA-STR-02', 'Motuma Sora',        'store_manager',                'Store Manager',                    'et.ada.str02.storemanager@staging.siifmart.com',         '+251911000102', 'Retail Operations',     'ET-STG-102', 'ET-ADA', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000103'::uuid, 'ET-ADA-STR-02', 'Damitu Aga',         'assistant_manager',            'Assistant Store Manager',          'et.ada.str02.assistantmanager@staging.siifmart.com',     '+251911000103', 'Retail Operations',     'ET-STG-103', 'ET-ADA', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000104'::uuid, 'ET-ADA-STR-02', 'Fikadu Urgessa',     'store_supervisor',             'Store Supervisor',                 'et.ada.str02.storesupervisor@staging.siifmart.com',      '+251911000104', 'Retail Operations',     'ET-STG-104', 'ET-ADA', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000105'::uuid, 'ET-ADA-STR-02', 'ifnan Gobena',       'cashier',                      'Cashier',                          'et.ada.str02.cashier@staging.siifmart.com',              '+251911000105', 'Retail Operations',     'ET-STG-105', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000106'::uuid, 'ET-ADA-STR-02', 'Boja Wayessa',       'sales_associate',              'Retail Sales Associate',           'et.ada.str02.salesassociate@staging.siifmart.com',       '+251911000106', 'Retail Operations',     'ET-STG-106', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000107'::uuid, 'ET-ADA-STR-02', 'Tsehay Lema',        'merchandiser',                 'Merchandiser',                     'et.ada.str02.merchandiser@staging.siifmart.com',         '+251911000107', 'Retail Operations',     'ET-STG-107', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000108'::uuid, 'ET-ADA-STR-02', 'Bulcha Kenei',       'loss_prevention',              'Loss Prevention Officer',          'et.ada.str02.lossprevention@staging.siifmart.com',       '+251911000108', 'Security',              'ET-STG-108', 'ET-ADA', 'REGIONAL', 18500),
      -- ET-ADA-STR-03 (Mojo Gateway Supermarket)
      ('e1000000-0000-4000-8000-000000000109'::uuid, 'ET-ADA-STR-03', 'Gurmessa Yadeta',    'store_manager',                'Store Manager',                    'et.ada.str03.storemanager@staging.siifmart.com',         '+251911000109', 'Retail Operations',     'ET-STG-109', 'ET-ADA', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000110'::uuid, 'ET-ADA-STR-03', 'Hawani Chalchisa',   'assistant_manager',            'Assistant Store Manager',          'et.ada.str03.assistantmanager@staging.siifmart.com',     '+251911000110', 'Retail Operations',     'ET-STG-110', 'ET-ADA', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000111'::uuid, 'ET-ADA-STR-03', 'Roba Dinsa',         'store_supervisor',             'Store Supervisor',                 'et.ada.str03.storesupervisor@staging.siifmart.com',      '+251911000111', 'Retail Operations',     'ET-STG-111', 'ET-ADA', 'REGIONAL', 42000),
      ('e1000000-0000-4000-8000-000000000112'::uuid, 'ET-ADA-STR-03', 'Sena Hundessa',      'cashier',                      'Cashier',                          'et.ada.str03.cashier@staging.siifmart.com',              '+251911000112', 'Retail Operations',     'ET-STG-112', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000113'::uuid, 'ET-ADA-STR-03', 'Lencho Bayisa',      'sales_associate',              'Retail Sales Associate',           'et.ada.str03.salesassociate@staging.siifmart.com',       '+251911000113', 'Retail Operations',     'ET-STG-113', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000114'::uuid, 'ET-ADA-STR-03', 'Dureti Gemechu',     'merchandiser',                 'Merchandiser',                     'et.ada.str03.merchandiser@staging.siifmart.com',         '+251911000114', 'Retail Operations',     'ET-STG-114', 'ET-ADA', 'REGIONAL', 18500),
      ('e1000000-0000-4000-8000-000000000115'::uuid, 'ET-ADA-STR-03', 'NegaFufa',           'loss_prevention',              'Loss Prevention Officer',          'et.ada.str03.lossprevention@staging.siifmart.com',       '+251911000115', 'Security',              'ET-STG-115', 'ET-ADA', 'REGIONAL', 18500),

      -- ======================================================================
      -- KENYA — KE-NRB NEW RETAIL STORES (KE-NRB-STR-02 & KE-NRB-STR-03)
      -- ======================================================================
      -- KE-NRB-STR-02 (Kilimani Junction Supermarket)
      ('e2000000-0000-4000-8000-000000000056'::uuid, 'KE-NRB-STR-02', 'Mutuku Musyimi',     'store_manager',     'Store Manager',             'ke.nrb.str02.storemanager@staging.siifmart.com',     '+254711000056', 'Retail Operations', 'KE-STG-056', 'KE-NRB', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000057'::uuid, 'KE-NRB-STR-02', 'Wanjiru Karanja',    'assistant_manager', 'Assistant Store Manager',   'ke.nrb.str02.assistantmanager@staging.siifmart.com', '+254711000057', 'Retail Operations', 'KE-STG-057', 'KE-NRB', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000058'::uuid, 'KE-NRB-STR-02', 'Kiptoo Ruto',        'store_supervisor',  'Store Supervisor',          'ke.nrb.str02.storesupervisor@staging.siifmart.com',  '+254711000058', 'Retail Operations', 'KE-STG-058', 'KE-NRB', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000059'::uuid, 'KE-NRB-STR-02', 'Njambi Githae',      'cashier',           'Cashier',                   'ke.nrb.str02.cashier@staging.siifmart.com',          '+254711000059', 'Retail Operations', 'KE-STG-059', 'KE-NRB', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000060'::uuid, 'KE-NRB-STR-02', 'Onyango Were',       'sales_associate',   'Retail Sales Associate',    'ke.nrb.str02.salesassociate@staging.siifmart.com',   '+254711000060', 'Retail Operations', 'KE-STG-060', 'KE-NRB', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000061'::uuid, 'KE-NRB-STR-02', 'Makena Gitonga',     'merchandiser',      'Merchandiser',              'ke.nrb.str02.merchandiser@staging.siifmart.com',     '+254711000061', 'Retail Operations', 'KE-STG-061', 'KE-NRB', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000062'::uuid, 'KE-NRB-STR-02', 'Lemayan Sankale',    'loss_prevention',   'Loss Prevention Officer',   'ke.nrb.str02.lossprevention@staging.siifmart.com',   '+254711000062', 'Security',          'KE-STG-062', 'KE-NRB', 'REGIONAL', 48000),
      -- KE-NRB-STR-03 (Karen Crossroads Supermarket)
      ('e2000000-0000-4000-8000-000000000063'::uuid, 'KE-NRB-STR-03', 'Gichuki Mwangi',     'store_manager',     'Store Manager',             'ke.nrb.str03.storemanager@staging.siifmart.com',     '+254711000063', 'Retail Operations', 'KE-STG-063', 'KE-NRB', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000064'::uuid, 'KE-NRB-STR-03', 'Chebet Koech',       'assistant_manager', 'Assistant Store Manager',   'ke.nrb.str03.assistantmanager@staging.siifmart.com', '+254711000064', 'Retail Operations', 'KE-STG-064', 'KE-NRB', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000065'::uuid, 'KE-NRB-STR-03', 'Wekesa Lusaka',      'store_supervisor',  'Store Supervisor',          'ke.nrb.str03.storesupervisor@staging.siifmart.com',  '+254711000065', 'Retail Operations', 'KE-STG-065', 'KE-NRB', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000066'::uuid, 'KE-NRB-STR-03', 'Mumbi Macharia',     'cashier',           'Cashier',                   'ke.nrb.str03.cashier@staging.siifmart.com',          '+254711000066', 'Retail Operations', 'KE-STG-066', 'KE-NRB', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000067'::uuid, 'KE-NRB-STR-03', 'Ngeno Kipkorir',     'sales_associate',   'Retail Sales Associate',    'ke.nrb.str03.salesassociate@staging.siifmart.com',   '+254711000067', 'Retail Operations', 'KE-STG-067', 'KE-NRB', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000068'::uuid, 'KE-NRB-STR-03', 'Syokau Mutiso',      'merchandiser',      'Merchandiser',              'ke.nrb.str03.merchandiser@staging.siifmart.com',     '+254711000068', 'Retail Operations', 'KE-STG-068', 'KE-NRB', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000069'::uuid, 'KE-NRB-STR-03', 'Ole Ntimama',        'loss_prevention',   'Loss Prevention Officer',   'ke.nrb.str03.lossprevention@staging.siifmart.com',   '+254711000069', 'Security',          'KE-STG-069', 'KE-NRB', 'REGIONAL', 48000),

      -- ======================================================================
      -- KENYA — KE-MBA (Mombasa Coastal Region) ALL 7 FACILITIES
      -- ======================================================================
      -- KE-MBA (Mombasa Region Administration)
      ('e2000000-0000-4000-8000-000000000070'::uuid, 'KE-MBA',        'Salim Mvurya',       'regional_manager',             'Regional Operations Manager',      'ke.mba.regionalmanager@staging.siifmart.com',            '+254711000070', 'Management',            'KE-STG-070', 'KE-MBA', 'REGIONAL', 195000),
      ('e2000000-0000-4000-8000-000000000071'::uuid, 'KE-MBA',        'Halima Balala',      'regional_procurement_lead',    'Regional Procurement Lead',        'ke.mba.regionalprocurementlead@staging.siifmart.com',    '+254711000071', 'Procurement',           'KE-STG-071', 'KE-MBA', 'REGIONAL', 195000),
      ('e2000000-0000-4000-8000-000000000072'::uuid, 'KE-MBA',        'Rashid Bedzimba',    'regional_finance_officer',     'Regional Finance Officer',         'ke.mba.regionalfinanceofficer@staging.siifmart.com',     '+254711000072', 'Finance',               'KE-STG-072', 'KE-MBA', 'REGIONAL', 195000),
      ('e2000000-0000-4000-8000-000000000073'::uuid, 'KE-MBA',        'Mishi Mboko',        'regional_hr_officer',          'Regional Human Resources Officer', 'ke.mba.regionalhrofficer@staging.siifmart.com',          '+254711000073', 'Human Resources',       'KE-STG-073', 'KE-MBA', 'REGIONAL', 195000),
      ('e2000000-0000-4000-8000-000000000074'::uuid, 'KE-MBA',        'Kazungu Kambi',      'regional_logistics_lead',      'Regional Logistics Lead',          'ke.mba.regionallogisticslead@staging.siifmart.com',      '+254711000074', 'Transport',             'KE-STG-074', 'KE-MBA', 'REGIONAL', 195000),
      ('e2000000-0000-4000-8000-000000000075'::uuid, 'KE-MBA',        'Badi Twalib',        'regional_security_supervisor', 'Regional Security Supervisor',     'ke.mba.regionalsecuritysupervisor@staging.siifmart.com', '+254711000075', 'Security',              'KE-STG-075', 'KE-MBA', 'REGIONAL', 195000),
      -- KE-MBA-DC-01 (Mombasa Coastal Distribution Center)
      ('e2000000-0000-4000-8000-000000000076'::uuid, 'KE-MBA-DC-01',  'Bakari Joho',        'logistics_manager',            'Logistics Manager',                'ke.mba.dc01.logisticsmanager@staging.siifmart.com',      '+254711000076', 'Transport',             'KE-STG-076', 'KE-MBA', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000077'::uuid, 'KE-MBA-DC-01',  'Zainab Chidzuga',    'dispatch_manager',             'Dispatch Manager',                 'ke.mba.dc01.dispatchmanager@staging.siifmart.com',       '+254711000077', 'Logistics & Warehouse', 'KE-STG-077', 'KE-MBA', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000078'::uuid, 'KE-MBA-DC-01',  'Charo Menza',        'fleet_maintenance_supervisor', 'Fleet Maintenance Supervisor',     'ke.mba.dc01.fleetmaintenance@staging.siifmart.com',      '+254711000078', 'Transport',             'KE-STG-078', 'KE-MBA', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000079'::uuid, 'KE-MBA-DC-01',  'Omar Mwinyi',        'dispatcher',                   'Dispatcher',                       'ke.mba.dc01.dispatcher@staging.siifmart.com',            '+254711000079', 'Logistics & Warehouse', 'KE-STG-079', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000080'::uuid, 'KE-MBA-DC-01',  'Fatuma Masito',      'replenishment_planner',        'Replenishment Planner',            'ke.mba.dc01.replenishmentplanner@staging.siifmart.com',  '+254711000080', 'Logistics & Warehouse', 'KE-STG-080', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000081'::uuid, 'KE-MBA-DC-01',  'Karisa Nzai',        'inbound_qc_inspector',         'Quality Control Inspector',        'ke.mba.dc01.inboundqc@staging.siifmart.com',             '+254711000081', 'Logistics & Warehouse', 'KE-STG-081', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000082'::uuid, 'KE-MBA-DC-01',  'Juma Boy',           'driver',                       'Delivery Driver',                  'ke.mba.dc01.driver@staging.siifmart.com',                '+254711000082', 'Transport',             'KE-STG-082', 'KE-MBA', 'REGIONAL', 48000),
      -- KE-MBA-WH-01 (Changamwe Port Warehouse)
      ('e2000000-0000-4000-8000-000000000083'::uuid, 'KE-MBA-WH-01',  'Kitsao Ngombo',      'warehouse_manager',            'Warehouse Manager',                'ke.mba.wh01.warehousemanager@staging.siifmart.com',      '+254711000083', 'Logistics & Warehouse', 'KE-STG-083', 'KE-MBA', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000084'::uuid, 'KE-MBA-WH-01',  'Aisha Jumwa',        'inventory_manager',            'Inventory Manager',                'ke.mba.wh01.inventorymanager@staging.siifmart.com',      '+254711000084', 'Logistics & Warehouse', 'KE-STG-084', 'KE-MBA', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000085'::uuid, 'KE-MBA-WH-01',  'Suleiman Dori',      'security_manager',             'Security Manager',                 'ke.mba.wh01.securitymanager@staging.siifmart.com',       '+254711000085', 'Security',              'KE-STG-085', 'KE-MBA', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000086'::uuid, 'KE-MBA-WH-01',  'Mariam Sheikh',      'picker',                       'Warehouse Order Picker',           'ke.mba.wh01.picker@staging.siifmart.com',                '+254711000086', 'Logistics & Warehouse', 'KE-STG-086', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000087'::uuid, 'KE-MBA-WH-01',  'Katana Fondo',       'packer',                       'Warehouse Packer',                 'ke.mba.wh01.packer@staging.siifmart.com',                '+254711000087', 'Logistics & Warehouse', 'KE-STG-087', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000088'::uuid, 'KE-MBA-WH-01',  'Rehema Hassan',      'receiver',                     'Warehouse Receiving Specialist',   'ke.mba.wh01.receiver@staging.siifmart.com',              '+254711000088', 'Logistics & Warehouse', 'KE-STG-088', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000089'::uuid, 'KE-MBA-WH-01',  'Chengo Kahindi',     'forklift_operator',            'Forklift Operator',                'ke.mba.wh01.forkliftoperator@staging.siifmart.com',      '+254711000089', 'Logistics & Warehouse', 'KE-STG-089', 'KE-MBA', 'REGIONAL', 48000),
      -- KE-MBA-ONL-01 (Mombasa Online Store)
      ('e2000000-0000-4000-8000-000000000090'::uuid, 'KE-MBA-ONL-01', 'Ali Sharif',         'shift_lead',                   'Shift Supervisor',                 'ke.mba.onl01.shiftlead@staging.siifmart.com',            '+254711000090', 'Retail Operations',     'KE-STG-090', 'KE-MBA', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000091'::uuid, 'KE-MBA-ONL-01', 'Khadija Nassir',     'stock_clerk',                  'Inventory Clerk',                  'ke.mba.onl01.stockclerk@staging.siifmart.com',           '+254711000091', 'Retail Operations',     'KE-STG-091', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000092'::uuid, 'KE-MBA-ONL-01', 'Safari Baya',        'inventory_specialist',         'Inventory Control Specialist',     'ke.mba.onl01.inventoryspecialist@staging.siifmart.com',  '+254711000092', 'Retail Operations',     'KE-STG-092', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000093'::uuid, 'KE-MBA-ONL-01', 'Saida Abdallah',     'customer_service',             'Customer Service Representative',  'ke.mba.onl01.customerservice@staging.siifmart.com',      '+254711000093', 'Retail Operations',     'KE-STG-093', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000094'::uuid, 'KE-MBA-ONL-01', 'Mwakwere Chirau',    'returns_clerk',                'Returns Specialist',               'ke.mba.onl01.returnsclerk@staging.siifmart.com',         '+254711000094', 'Retail Operations',     'KE-STG-094', 'KE-MBA', 'REGIONAL', 48000),
      -- KE-MBA-STR-01 (Nyali Cinemax Supermarket)
      ('e2000000-0000-4000-8000-000000000095'::uuid, 'KE-MBA-STR-01', 'Hamisi Mwagogo',     'store_manager',                'Store Manager',                    'ke.mba.str01.storemanager@staging.siifmart.com',         '+254711000095', 'Retail Operations',     'KE-STG-095', 'KE-MBA', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000096'::uuid, 'KE-MBA-STR-01', 'Nuru Mazrui',        'assistant_manager',            'Assistant Store Manager',          'ke.mba.str01.assistantmanager@staging.siifmart.com',     '+254711000096', 'Retail Operations',     'KE-STG-096', 'KE-MBA', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000097'::uuid, 'KE-MBA-STR-01', 'Dzombo Mbwana',      'store_supervisor',             'Store Supervisor',                 'ke.mba.str01.storesupervisor@staging.siifmart.com',      '+254711000097', 'Retail Operations',     'KE-STG-097', 'KE-MBA', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000098'::uuid, 'KE-MBA-STR-01', 'Mwanahamisi Said',   'cashier',                      'Cashier',                          'ke.mba.str01.cashier@staging.siifmart.com',              '+254711000098', 'Retail Operations',     'KE-STG-098', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000099'::uuid, 'KE-MBA-STR-01', 'Tsuma Ndegwa',       'sales_associate',              'Retail Sales Associate',           'ke.mba.str01.salesassociate@staging.siifmart.com',       '+254711000099', 'Retail Operations',     'KE-STG-099', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000100'::uuid, 'KE-MBA-STR-01', 'Zuhura Bakari',      'merchandiser',                 'Merchandiser',                     'ke.mba.str01.merchandiser@staging.siifmart.com',         '+254711000100', 'Retail Operations',     'KE-STG-100', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000101'::uuid, 'KE-MBA-STR-01', 'Kenga Kombe',        'loss_prevention',              'Loss Prevention Officer',          'ke.mba.str01.lossprevention@staging.siifmart.com',       '+254711000101', 'Security',              'KE-STG-101', 'KE-MBA', 'REGIONAL', 48000),
      -- KE-MBA-STR-02 (Bamburi Beach Supermarket)
      ('e2000000-0000-4000-8000-000000000102'::uuid, 'KE-MBA-STR-02', 'Abdalla Mwaruwa',    'store_manager',                'Store Manager',                    'ke.mba.str02.storemanager@staging.siifmart.com',         '+254711000102', 'Retail Operations',     'KE-STG-102', 'KE-MBA', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000103'::uuid, 'KE-MBA-STR-02', 'Lulu Khatib',        'assistant_manager',            'Assistant Store Manager',          'ke.mba.str02.assistantmanager@staging.siifmart.com',     '+254711000103', 'Retail Operations',     'KE-STG-103', 'KE-MBA', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000104'::uuid, 'KE-MBA-STR-02', 'MungaChome',         'store_supervisor',             'Store Supervisor',                 'ke.mba.str02.storesupervisor@staging.siifmart.com',      '+254711000104', 'Retail Operations',     'KE-STG-104', 'KE-MBA', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000105'::uuid, 'KE-MBA-STR-02', 'Kadzo Karisa',       'cashier',                      'Cashier',                          'ke.mba.str02.cashier@staging.siifmart.com',              '+254711000105', 'Retail Operations',     'KE-STG-105', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000106'::uuid, 'KE-MBA-STR-02', 'Faraj Saleh',        'sales_associate',              'Retail Sales Associate',           'ke.mba.str02.salesassociate@staging.siifmart.com',       '+254711000106', 'Retail Operations',     'KE-STG-106', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000107'::uuid, 'KE-MBA-STR-02', 'Rukia Mohamed',      'merchandiser',                 'Merchandiser',                     'ke.mba.str02.merchandiser@staging.siifmart.com',         '+254711000107', 'Retail Operations',     'KE-STG-107', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000108'::uuid, 'KE-MBA-STR-02', 'Kalama Ziro',        'loss_prevention',              'Loss Prevention Officer',          'ke.mba.str02.lossprevention@staging.siifmart.com',       '+254711000108', 'Security',              'KE-STG-108', 'KE-MBA', 'REGIONAL', 48000),
      -- KE-MBA-STR-03 (Diani Coast Supermarket)
      ('e2000000-0000-4000-8000-000000000109'::uuid, 'KE-MBA-STR-03', 'Hassan Mwamzandi',   'store_manager',                'Store Manager',                    'ke.mba.str03.storemanager@staging.siifmart.com',         '+254711000109', 'Retail Operations',     'KE-STG-109', 'KE-MBA', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000110'::uuid, 'KE-MBA-STR-03', 'Pili Chimerah',      'assistant_manager',            'Assistant Store Manager',          'ke.mba.str03.assistantmanager@staging.siifmart.com',     '+254711000110', 'Retail Operations',     'KE-STG-110', 'KE-MBA', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000111'::uuid, 'KE-MBA-STR-03', 'Kassim Tandaza',     'store_supervisor',             'Store Supervisor',                 'ke.mba.str03.storesupervisor@staging.siifmart.com',      '+254711000111', 'Retail Operations',     'KE-STG-111', 'KE-MBA', 'REGIONAL', 110000),
      ('e2000000-0000-4000-8000-000000000112'::uuid, 'KE-MBA-STR-03', 'Sidi Masha',         'cashier',                      'Cashier',                          'ke.mba.str03.cashier@staging.siifmart.com',              '+254711000112', 'Retail Operations',     'KE-STG-112', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000113'::uuid, 'KE-MBA-STR-03', 'Nyamawi Ruwa',       'sales_associate',              'Retail Sales Associate',           'ke.mba.str03.salesassociate@staging.siifmart.com',       '+254711000113', 'Retail Operations',     'KE-STG-113', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000114'::uuid, 'KE-MBA-STR-03', 'Amina Mwachai',      'merchandiser',                 'Merchandiser',                     'ke.mba.str03.merchandiser@staging.siifmart.com',         '+254711000114', 'Retail Operations',     'KE-STG-114', 'KE-MBA', 'REGIONAL', 48000),
      ('e2000000-0000-4000-8000-000000000115'::uuid, 'KE-MBA-STR-03', 'Randu Nzai',         'loss_prevention',              'Loss Prevention Officer',          'ke.mba.str03.lossprevention@staging.siifmart.com',       '+254711000115', 'Security',              'KE-STG-115', 'KE-MBA', 'REGIONAL', 48000)
    ) AS t(id, site_code, name, role, job_title, email, phone, department, code, region_code, scope_level, salary)
  LOOP
    SELECT id INTO v_site_id FROM public.sites WHERE code = rec.site_code LIMIT 1;

    IF v_site_id IS NOT NULL THEN
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
      ) ON CONFLICT (auth_id) DO UPDATE SET
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        full_name = EXCLUDED.full_name,
        region_code = EXCLUDED.region_code,
        verified_phone = true,
        verified_id = true,
        verified_face = true,
        updated_at = now();

      INSERT INTO public.employees (
        id, site_id, name, role, job_title, email, phone, status,
        join_date, department, performance_score, attendance_rate,
        salary, code, region_code, scope_level, created_at, updated_at
      ) VALUES (
        rec.id, v_site_id, rec.name, rec.role, rec.job_title, rec.email, rec.phone, 'Active',
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
    END IF;
  END LOOP;
END $$;

-- 3. Link Regional Managers on public.regions for all 4 regions
UPDATE public.regions r
SET regional_manager_id = e.id,
    last_change_reason = 'Assigned Regional Operations Manager (' || e.name || ') to region ' || r.code
FROM public.employees e
WHERE e.region_code = r.code
  AND e.role = 'regional_manager'
  AND r.code IN ('ET-ADD', 'ET-ADA', 'KE-NRB', 'KE-MBA');

-- 4. Populate public.sites.manager with the assigned Facility Manager name for all regional facilities
UPDATE public.sites s
SET manager = e.name,
    updated_at = now()
FROM public.employees e
WHERE e.site_id = s.id
  AND (
    (s.type = 'Administration'      AND e.role = 'regional_manager') OR
    (s.type = 'Distribution Center' AND e.role = 'logistics_manager') OR
    (s.type = 'Warehouse'           AND e.role = 'warehouse_manager') OR
    (s.type = 'Dark Store'          AND e.role = 'shift_lead') OR
    (s.type = 'Store'               AND e.role = 'store_manager')
  );

COMMIT;
