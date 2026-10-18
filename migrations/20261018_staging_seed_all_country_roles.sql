-- ============================================================================
-- SIIFMART STAGING ALL ROLES COMPREHENSIVE SEED MIGRATION
-- Migration: 20261018_staging_seed_all_country_roles.sql
-- Purpose:
--   Provisions 42 standard operational roles for Kenya and 42 for Ethiopia
--   in Supabase Staging Auth, public.users, and public.employees.
-- Standard Password for all accounts: StagingPassword123!
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

BEGIN;

CREATE TEMP TABLE temp_all_staging_accounts (
  id UUID, email TEXT, name TEXT, role TEXT, scope_level TEXT,
  site_id UUID, region_code TEXT, country_code TEXT,
  job_title TEXT, department TEXT, code TEXT
) ON COMMIT DROP;

INSERT INTO temp_all_staging_accounts VALUES
  ('988fb8ef-8053-415b-9032-111111110001', 'ke.regionalmanager@staging.siifmart.com', 'Kamau Ndenga', 'regional_manager', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Regional Operations Manager', 'Management', 'KE-STG-001'),
  ('988fb8ef-8053-415b-9032-111111110002', 'ke.operationsmanager@staging.siifmart.com', 'Omondi Samuel', 'operations_manager', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Central Operations Manager', 'Operations', 'KE-STG-002'),
  ('988fb8ef-8053-415b-9032-111111110003', 'ke.financemanager@staging.siifmart.com', 'Mwangi Kariuki', 'finance_manager', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Finance & Accounts Director', 'Finance', 'KE-STG-003'),
  ('988fb8ef-8053-415b-9032-111111110004', 'ke.hrmanager@staging.siifmart.com', 'Musyoka Kioko', 'hr_manager', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Human Resources Manager', 'HR', 'KE-STG-004'),
  ('988fb8ef-8053-415b-9032-111111110005', 'ke.procurementmanager@staging.siifmart.com', 'Oscar Kennedy', 'procurement_manager', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Procurement & Sourcing Lead', 'Procurement', 'KE-STG-005'),
  ('988fb8ef-8053-415b-9032-111111110006', 'ke.supplychainmanager@staging.siifmart.com', 'Juma Waweru', 'supply_chain_manager', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Supply Chain Director', 'Supply Chain', 'KE-STG-006'),
  ('988fb8ef-8053-415b-9032-111111110007', 'ke.merchandisingmanager@staging.siifmart.com', 'Njeri Muthoni', 'merchandising_manager', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Merchandising Director', 'Merchandising', 'KE-STG-007'),
  ('988fb8ef-8053-415b-9032-111111110008', 'ke.auditor@staging.siifmart.com', 'Wanjiku Njoroge', 'auditor', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Internal Compliance Auditor', 'Audit', 'KE-STG-008'),
  ('988fb8ef-8053-415b-9032-111111110009', 'ke.itsupport@staging.siifmart.com', 'Otieno Onyango', 'it_support', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'IT Systems & Security Specialist', 'IT', 'KE-STG-009'),
  ('988fb8ef-8053-415b-9032-111111110010', 'ke.accountant@staging.siifmart.com', 'Kipkorir Bett', 'accountant', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Senior Financial Accountant', 'Finance', 'KE-STG-010'),
  ('988fb8ef-8053-415b-9032-111111110011', 'ke.buyer@staging.siifmart.com', 'Chebet Rotich', 'buyer', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Commercial Category Buyer', 'Procurement', 'KE-STG-011'),
  ('988fb8ef-8053-415b-9032-111111110012', 'ke.demandplanner@staging.siifmart.com', 'Mutua Kivuva', 'demand_planner', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Demand & Supply Forecast Planner', 'Supply Chain', 'KE-STG-012'),
  ('988fb8ef-8053-415b-9032-111111110013', 'ke.payrollspecialist@staging.siifmart.com', 'Wambui Karanja', 'payroll_specialist', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'HR & Payroll Specialist', 'HR', 'KE-STG-013'),
  ('988fb8ef-8053-415b-9032-111111110014', 'ke.treasuryofficer@staging.siifmart.com', 'Nakhumicha Barasa', 'treasury_officer', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Treasury & Capital Management Officer', 'Finance', 'KE-STG-014'),
  ('988fb8ef-8053-415b-9032-111111110015', 'ke.customsimportspecialist@staging.siifmart.com', 'Maina Gicheru', 'customs_import_specialist', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Cross-Border Customs Specialist', 'Supply Chain', 'KE-STG-015'),
  ('988fb8ef-8053-415b-9032-111111110016', 'ke.vendorrelationsmanager@staging.siifmart.com', 'Koech Cheruiyot', 'vendor_relations_manager', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Vendor & Contract Relations Lead', 'Procurement', 'KE-STG-016'),
  ('988fb8ef-8053-415b-9032-111111110017', 'ke.storeoperationsauditor@staging.siifmart.com', 'Oduor Achieng', 'store_operations_auditor', 'REGIONAL', '6c38f106-4590-4ff3-ae68-b9ab657fff8e', 'KE-NRB', 'KE', 'Store Operations & Field Auditor', 'Audit', 'KE-STG-017'),
  ('988fb8ef-8053-415b-9032-111111110018', 'ke.warehousemanager@staging.siifmart.com', 'Kennedy Odhiambo', 'warehouse_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000003', 'KE-NRB', 'KE', 'Warehouse General Manager', 'Fulfillment', 'KE-STG-018'),
  ('988fb8ef-8053-415b-9032-111111110019', 'ke.dispatchmanager@staging.siifmart.com', 'Gideon Jakaranda', 'dispatch_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000003', 'KE-NRB', 'KE', 'Outbound Logistics Dispatcher', 'Fulfillment', 'KE-STG-019'),
  ('988fb8ef-8053-415b-9032-111111110020', 'ke.inventorymanager@staging.siifmart.com', 'Kiprono Rutto', 'inventory_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000003', 'KE-NRB', 'KE', 'Central Inventory Controller', 'Fulfillment', 'KE-STG-020'),
  ('988fb8ef-8053-415b-9032-111111110021', 'ke.logisticsmanager@staging.siifmart.com', 'Barasa Wafula', 'logistics_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000003', 'KE-NRB', 'KE', 'Fleet & Logistics Manager', 'Logistics', 'KE-STG-021'),
  ('988fb8ef-8053-415b-9032-111111110022', 'ke.fleetmaintenancesupervisor@staging.siifmart.com', 'Ochieng Owino', 'fleet_maintenance_supervisor', 'REGIONAL', 'a1111111-1111-4000-8000-000000000003', 'KE-NRB', 'KE', 'Fleet Maintenance Supervisor', 'Logistics', 'KE-STG-022'),
  ('988fb8ef-8053-415b-9032-111111110023', 'ke.securitymanager@staging.siifmart.com', 'Simiyu Wanyonyi', 'security_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000003', 'KE-NRB', 'KE', 'Warehouse Security Supervisor', 'Security', 'KE-STG-023'),
  ('988fb8ef-8053-415b-9032-111111110024', 'ke.picker@staging.siifmart.com', 'Waithera Macharia', 'picker', 'REGIONAL', 'a1111111-1111-4000-8000-000000000003', 'KE-NRB', 'KE', 'High-Velocity Order Picker', 'Fulfillment', 'KE-STG-024'),
  ('988fb8ef-8053-415b-9032-111111110025', 'ke.packer@staging.siifmart.com', 'Kiptoo Korir', 'packer', 'REGIONAL', 'a1111111-1111-4000-8000-000000000003', 'KE-NRB', 'KE', 'Export & Logistics Packer', 'Fulfillment', 'KE-STG-025'),
  ('988fb8ef-8053-415b-9032-111111110026', 'ke.receiver@staging.siifmart.com', 'Njuguna Ndung''u', 'receiver', 'REGIONAL', 'a1111111-1111-4000-8000-000000000003', 'KE-NRB', 'KE', 'Inbound Dock Receiving Specialist', 'Fulfillment', 'KE-STG-026'),
  ('988fb8ef-8053-415b-9032-111111110027', 'ke.forkliftoperator@staging.siifmart.com', 'Nyaboke Moraa', 'forklift_operator', 'REGIONAL', 'a1111111-1111-4000-8000-000000000003', 'KE-NRB', 'KE', 'Certified Forklift Operator', 'Fulfillment', 'KE-STG-027'),
  ('988fb8ef-8053-415b-9032-111111110028', 'ke.driver@staging.siifmart.com', 'Makori Momanyi', 'driver', 'REGIONAL', 'a1111111-1111-4000-8000-000000000003', 'KE-NRB', 'KE', 'Verified Commercial Freight Driver', 'Logistics', 'KE-STG-028'),
  ('988fb8ef-8053-415b-9032-111111110029', 'ke.inboundqcinspector@staging.siifmart.com', 'Wekesa Masinde', 'inbound_qc_inspector', 'REGIONAL', 'a1111111-1111-4000-8000-000000000003', 'KE-NRB', 'KE', 'Inbound QC & Quarantine Inspector', 'Quality', 'KE-STG-029'),
  ('988fb8ef-8053-415b-9032-111111110030', 'ke.replenishmentplanner@staging.siifmart.com', 'Kurgat Kiplagat', 'replenishment_planner', 'REGIONAL', 'a1111111-1111-4000-8000-000000000003', 'KE-NRB', 'KE', 'Warehouse Stock Replenishment Planner', 'Supply Chain', 'KE-STG-030'),
  ('988fb8ef-8053-415b-9032-111111110031', 'ke.storemanager@staging.siifmart.com', 'Makena Benson', 'store_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000004', 'KE-NRB', 'KE', 'General Store Manager', 'Retail', 'KE-STG-031'),
  ('988fb8ef-8053-415b-9032-111111110032', 'ke.assistantmanager@staging.siifmart.com', 'Amina Wanjiku', 'assistant_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000004', 'KE-NRB', 'KE', 'Assistant Store Manager', 'Retail', 'KE-STG-032'),
  ('988fb8ef-8053-415b-9032-111111110033', 'ke.shiftlead@staging.siifmart.com', 'Dennis Kimani', 'shift_lead', 'REGIONAL', 'a1111111-1111-4000-8000-000000000004', 'KE-NRB', 'KE', 'Retail Floor Shift Lead', 'Retail', 'KE-STG-033'),
  ('988fb8ef-8053-415b-9032-111111110034', 'ke.storesupervisor@staging.siifmart.com', 'Faith Chepngetich', 'store_supervisor', 'REGIONAL', 'a1111111-1111-4000-8000-000000000004', 'KE-NRB', 'KE', 'Department Floor Supervisor', 'Retail', 'KE-STG-034'),
  ('988fb8ef-8053-415b-9032-111111110035', 'ke.cashier@staging.siifmart.com', 'Brian Kibet', 'cashier', 'REGIONAL', 'a1111111-1111-4000-8000-000000000004', 'KE-NRB', 'KE', 'Frontline Cashier & POS Operator', 'Retail', 'KE-STG-035'),
  ('988fb8ef-8053-415b-9032-111111110036', 'ke.salesassociate@staging.siifmart.com', 'Mercy Chepkemoi', 'sales_associate', 'REGIONAL', 'a1111111-1111-4000-8000-000000000004', 'KE-NRB', 'KE', 'Customer Sales Associate', 'Retail', 'KE-STG-036'),
  ('988fb8ef-8053-415b-9032-111111110037', 'ke.stockclerk@staging.siifmart.com', 'Kelvin Mutiso', 'stock_clerk', 'REGIONAL', 'a1111111-1111-4000-8000-000000000004', 'KE-NRB', 'KE', 'Shelf Stocking & Planogram Clerk', 'Retail', 'KE-STG-037'),
  ('988fb8ef-8053-415b-9032-111111110038', 'ke.inventoryspecialist@staging.siifmart.com', 'Grace Nduta', 'inventory_specialist', 'REGIONAL', 'a1111111-1111-4000-8000-000000000004', 'KE-NRB', 'KE', 'Store Inventory & Cycle Count Specialist', 'Retail', 'KE-STG-038'),
  ('988fb8ef-8053-415b-9032-111111110039', 'ke.customerservice@staging.siifmart.com', 'Victor Ouma', 'customer_service', 'REGIONAL', 'a1111111-1111-4000-8000-000000000004', 'KE-NRB', 'KE', 'Customer Helpdesk Representative', 'Retail', 'KE-STG-039'),
  ('988fb8ef-8053-415b-9032-111111110040', 'ke.returnsclerk@staging.siifmart.com', 'Esther Wangari', 'returns_clerk', 'REGIONAL', 'a1111111-1111-4000-8000-000000000004', 'KE-NRB', 'KE', 'POS Returns & Exchange Specialist', 'Retail', 'KE-STG-040'),
  ('988fb8ef-8053-415b-9032-111111110041', 'ke.merchandiser@staging.siifmart.com', 'Joseph Gitau', 'merchandiser', 'REGIONAL', 'a1111111-1111-4000-8000-000000000004', 'KE-NRB', 'KE', 'Visual Merchandising Specialist', 'Merchandising', 'KE-STG-041'),
  ('988fb8ef-8053-415b-9032-111111110042', 'ke.lossprevention@staging.siifmart.com', 'Lillian Aoko', 'loss_prevention', 'REGIONAL', 'a1111111-1111-4000-8000-000000000004', 'KE-NRB', 'KE', 'Store Loss Prevention Specialist', 'Security', 'KE-STG-042'),
  ('988fb8ef-8053-415b-9032-222222220001', 'et.regionalmanager@staging.siifmart.com', 'Henok Tadesse', 'regional_manager', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Regional Operations Manager', 'Management', 'ET-STG-001'),
  ('988fb8ef-8053-415b-9032-222222220002', 'et.operationsmanager@staging.siifmart.com', 'Sara Tesfaye', 'operations_manager', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Central Operations Manager', 'Operations', 'ET-STG-002'),
  ('988fb8ef-8053-415b-9032-222222220003', 'et.financemanager@staging.siifmart.com', 'Dawit Haile', 'finance_manager', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Finance & Accounts Director', 'Finance', 'ET-STG-003'),
  ('988fb8ef-8053-415b-9032-222222220004', 'et.hrmanager@staging.siifmart.com', 'Tigist Alemayehu', 'hr_manager', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Human Resources Manager', 'HR', 'ET-STG-004'),
  ('988fb8ef-8053-415b-9032-222222220005', 'et.procurementmanager@staging.siifmart.com', 'Yohannes Bekele', 'procurement_manager', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Procurement & Sourcing Lead', 'Procurement', 'ET-STG-005'),
  ('988fb8ef-8053-415b-9032-222222220006', 'et.supplychainmanager@staging.siifmart.com', 'Rahel Tesfaye', 'supply_chain_manager', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Supply Chain Director', 'Supply Chain', 'ET-STG-006'),
  ('988fb8ef-8053-415b-9032-222222220007', 'et.merchandisingmanager@staging.siifmart.com', 'Mulugeta Tadesse', 'merchandising_manager', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Merchandising Director', 'Merchandising', 'ET-STG-007'),
  ('988fb8ef-8053-415b-9032-222222220008', 'et.auditor@staging.siifmart.com', 'Elias Kebede', 'auditor', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Internal Compliance Auditor', 'Audit', 'ET-STG-008'),
  ('988fb8ef-8053-415b-9032-222222220009', 'et.itsupport@staging.siifmart.com', 'Selamawit Girma', 'it_support', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'IT Systems & Security Specialist', 'IT', 'ET-STG-009'),
  ('988fb8ef-8053-415b-9032-222222220010', 'et.accountant@staging.siifmart.com', 'Tomas Dinka', 'accountant', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Senior Financial Accountant', 'Finance', 'ET-STG-010'),
  ('988fb8ef-8053-415b-9032-222222220011', 'et.buyer@staging.siifmart.com', 'Solomon Tesfaye', 'buyer', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Commercial Category Buyer', 'Procurement', 'ET-STG-011'),
  ('988fb8ef-8053-415b-9032-222222220012', 'et.demandplanner@staging.siifmart.com', 'Yonas Tadesse', 'demand_planner', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Demand & Supply Forecast Planner', 'Supply Chain', 'ET-STG-012'),
  ('988fb8ef-8053-415b-9032-222222220013', 'et.payrollspecialist@staging.siifmart.com', 'Hanna Mulugeta', 'payroll_specialist', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'HR & Payroll Specialist', 'HR', 'ET-STG-013'),
  ('988fb8ef-8053-415b-9032-222222220014', 'et.treasuryofficer@staging.siifmart.com', 'Ahmed Hassan', 'treasury_officer', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Treasury & Capital Management Officer', 'Finance', 'ET-STG-014'),
  ('988fb8ef-8053-415b-9032-222222220015', 'et.customsimportspecialist@staging.siifmart.com', 'Helen Kebede', 'customs_import_specialist', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Cross-Border Customs Specialist', 'Supply Chain', 'ET-STG-015'),
  ('988fb8ef-8053-415b-9032-222222220016', 'et.vendorrelationsmanager@staging.siifmart.com', 'Tomas Tesfaye', 'vendor_relations_manager', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Vendor & Contract Relations Lead', 'Procurement', 'ET-STG-016'),
  ('988fb8ef-8053-415b-9032-222222220017', 'et.storeoperationsauditor@staging.siifmart.com', 'Lensa Merga', 'store_operations_auditor', 'REGIONAL', 'bb0425bc-3119-449a-a685-b871e552bee9', 'ET-ADD', 'ET', 'Store Operations & Field Auditor', 'Audit', 'ET-STG-017'),
  ('988fb8ef-8053-415b-9032-222222220018', 'et.warehousemanager@staging.siifmart.com', 'Chala Adam', 'warehouse_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000001', 'ET-ADD', 'ET', 'Warehouse General Manager', 'Fulfillment', 'ET-STG-018'),
  ('988fb8ef-8053-415b-9032-222222220019', 'et.dispatchmanager@staging.siifmart.com', 'Tola Bekele', 'dispatch_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000001', 'ET-ADD', 'ET', 'Outbound Logistics Dispatcher', 'Fulfillment', 'ET-STG-019'),
  ('988fb8ef-8053-415b-9032-222222220020', 'et.inventorymanager@staging.siifmart.com', 'Firomsa Hasan', 'inventory_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000001', 'ET-ADD', 'ET', 'Central Inventory Controller', 'Fulfillment', 'ET-STG-020'),
  ('988fb8ef-8053-415b-9032-222222220021', 'et.logisticsmanager@staging.siifmart.com', 'Ibsa Sufiyan', 'logistics_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000001', 'ET-ADD', 'ET', 'Fleet & Logistics Manager', 'Logistics', 'ET-STG-021'),
  ('988fb8ef-8053-415b-9032-222222220022', 'et.fleetmaintenancesupervisor@staging.siifmart.com', 'Cala Kalifa', 'fleet_maintenance_supervisor', 'REGIONAL', 'a1111111-1111-4000-8000-000000000001', 'ET-ADD', 'ET', 'Fleet Maintenance Supervisor', 'Logistics', 'ET-STG-022'),
  ('988fb8ef-8053-415b-9032-222222220023', 'et.securitymanager@staging.siifmart.com', 'Abdi Ahmed', 'security_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000001', 'ET-ADD', 'ET', 'Warehouse Security Supervisor', 'Security', 'ET-STG-023'),
  ('988fb8ef-8053-415b-9032-222222220024', 'et.picker@staging.siifmart.com', 'Kamal Idriss', 'picker', 'REGIONAL', 'a1111111-1111-4000-8000-000000000001', 'ET-ADD', 'ET', 'High-Velocity Order Picker', 'Fulfillment', 'ET-STG-024'),
  ('988fb8ef-8053-415b-9032-222222220025', 'et.packer@staging.siifmart.com', 'Kebede Alemayehu', 'packer', 'REGIONAL', 'a1111111-1111-4000-8000-000000000001', 'ET-ADD', 'ET', 'Export & Logistics Packer', 'Fulfillment', 'ET-STG-025'),
  ('988fb8ef-8053-415b-9032-222222220026', 'et.receiver@staging.siifmart.com', 'Betelhem Bekele', 'receiver', 'REGIONAL', 'a1111111-1111-4000-8000-000000000001', 'ET-ADD', 'ET', 'Inbound Dock Receiving Specialist', 'Fulfillment', 'ET-STG-026'),
  ('988fb8ef-8053-415b-9032-222222220027', 'et.forkliftoperator@staging.siifmart.com', 'Abebe Yilma', 'forklift_operator', 'REGIONAL', 'a1111111-1111-4000-8000-000000000001', 'ET-ADD', 'ET', 'Certified Forklift Operator', 'Fulfillment', 'ET-STG-027'),
  ('988fb8ef-8053-415b-9032-222222220028', 'et.driver@staging.siifmart.com', 'Meron Yilma', 'driver', 'REGIONAL', 'a1111111-1111-4000-8000-000000000001', 'ET-ADD', 'ET', 'Verified Commercial Freight Driver', 'Logistics', 'ET-STG-028'),
  ('988fb8ef-8053-415b-9032-222222220029', 'et.inboundqcinspector@staging.siifmart.com', 'Betelhem Yilma', 'inbound_qc_inspector', 'REGIONAL', 'a1111111-1111-4000-8000-000000000001', 'ET-ADD', 'ET', 'Inbound QC & Quarantine Inspector', 'Quality', 'ET-STG-029'),
  ('988fb8ef-8053-415b-9032-222222220030', 'et.replenishmentplanner@staging.siifmart.com', 'Helen Getachew', 'replenishment_planner', 'REGIONAL', 'a1111111-1111-4000-8000-000000000001', 'ET-ADD', 'ET', 'Warehouse Stock Replenishment Planner', 'Supply Chain', 'ET-STG-030'),
  ('988fb8ef-8053-415b-9032-222222220031', 'et.storemanager@staging.siifmart.com', 'Amina Ali', 'store_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000002', 'ET-ADD', 'ET', 'General Store Manager', 'Retail', 'ET-STG-031'),
  ('988fb8ef-8053-415b-9032-222222220032', 'et.assistantmanager@staging.siifmart.com', 'Selamawit Girma', 'assistant_manager', 'REGIONAL', 'a1111111-1111-4000-8000-000000000002', 'ET-ADD', 'ET', 'Assistant Store Manager', 'Retail', 'ET-STG-032'),
  ('988fb8ef-8053-415b-9032-222222220033', 'et.shiftlead@staging.siifmart.com', 'Abdi Rahman', 'shift_lead', 'REGIONAL', 'a1111111-1111-4000-8000-000000000002', 'ET-ADD', 'ET', 'Retail Floor Shift Lead', 'Retail', 'ET-STG-033'),
  ('988fb8ef-8053-415b-9032-222222220034', 'et.storesupervisor@staging.siifmart.com', 'Hanna Girma', 'store_supervisor', 'REGIONAL', 'a1111111-1111-4000-8000-000000000002', 'ET-ADD', 'ET', 'Department Floor Supervisor', 'Retail', 'ET-STG-034'),
  ('988fb8ef-8053-415b-9032-222222220035', 'et.cashier@staging.siifmart.com', 'Sultan Aliyi', 'cashier', 'REGIONAL', 'a1111111-1111-4000-8000-000000000002', 'ET-ADD', 'ET', 'Frontline Cashier & POS Operator', 'Retail', 'ET-STG-035'),
  ('988fb8ef-8053-415b-9032-222222220036', 'et.salesassociate@staging.siifmart.com', 'Adam Ahmed', 'sales_associate', 'REGIONAL', 'a1111111-1111-4000-8000-000000000002', 'ET-ADD', 'ET', 'Customer Sales Associate', 'Retail', 'ET-STG-036'),
  ('988fb8ef-8053-415b-9032-222222220037', 'et.stockclerk@staging.siifmart.com', 'Sara Mohammed', 'stock_clerk', 'REGIONAL', 'a1111111-1111-4000-8000-000000000002', 'ET-ADD', 'ET', 'Shelf Stocking & Planogram Clerk', 'Retail', 'ET-STG-037'),
  ('988fb8ef-8053-415b-9032-222222220038', 'et.inventoryspecialist@staging.siifmart.com', 'Sara Bekele', 'inventory_specialist', 'REGIONAL', 'a1111111-1111-4000-8000-000000000002', 'ET-ADD', 'ET', 'Store Inventory & Cycle Count Specialist', 'Retail', 'ET-STG-038'),
  ('988fb8ef-8053-415b-9032-222222220039', 'et.customerservice@staging.siifmart.com', 'Betelhem Desta', 'customer_service', 'REGIONAL', 'a1111111-1111-4000-8000-000000000002', 'ET-ADD', 'ET', 'Customer Helpdesk Representative', 'Retail', 'ET-STG-039'),
  ('988fb8ef-8053-415b-9032-222222220040', 'et.returnsclerk@staging.siifmart.com', 'Kidus Berhanu', 'returns_clerk', 'REGIONAL', 'a1111111-1111-4000-8000-000000000002', 'ET-ADD', 'ET', 'POS Returns & Exchange Specialist', 'Retail', 'ET-STG-040'),
  ('988fb8ef-8053-415b-9032-222222220041', 'et.merchandiser@staging.siifmart.com', 'Marta Assefa', 'merchandiser', 'REGIONAL', 'a1111111-1111-4000-8000-000000000002', 'ET-ADD', 'ET', 'Visual Merchandising Specialist', 'Merchandising', 'ET-STG-041'),
  ('988fb8ef-8053-415b-9032-222222220042', 'et.lossprevention@staging.siifmart.com', 'Natnael Worku', 'loss_prevention', 'REGIONAL', 'a1111111-1111-4000-8000-000000000002', 'ET-ADD', 'ET', 'Store Loss Prevention Specialist', 'Security', 'ET-STG-042');


-- 1. Insert into auth.users with password 'StagingPassword123!'
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, recovery_sent_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  t.id, 'authenticated', 'authenticated', t.email,
  extensions.crypt('StagingPassword123!', extensions.gen_salt('bf')),
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
FROM temp_all_staging_accounts t
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  email_confirmed_at = now(),
  updated_at = now();

-- 2. Update region_code on public.users
UPDATE public.users u
SET region_code = t.region_code
FROM temp_all_staging_accounts t
WHERE u.auth_id = t.id;

-- 3. Upsert into public.employees
INSERT INTO public.employees (
  id, site_id, name, role, email, join_date, scope_level,
  job_title, department, region_code, status, code,
  created_at, updated_at
)
SELECT
  t.id, t.site_id, t.name, t.role, t.email, '2026-01-01',
  t.scope_level, t.job_title, t.department, t.region_code,
  'Active', t.code, now(), now()
FROM temp_all_staging_accounts t
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
