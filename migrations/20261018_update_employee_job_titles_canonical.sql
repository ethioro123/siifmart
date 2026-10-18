-- ============================================================================
-- SIIFMART CANONICAL ROLES HIERARCHY & JOB TITLES ALIGNMENT
-- Migration: 20261018_update_employee_job_titles_canonical.sql
-- Purpose:
--   Synchronizes public.employees.job_title with the canonical role definitions
--   specified in utils/roles.ts (SYSTEM_ROLES) and components/org-chart/hooks/orgRoles.ts.
--   Enforces Level 1 through Level 4 hierarchy definitions.
-- ============================================================================

BEGIN;

-- Level 1: Executive C-Suite
UPDATE public.employees SET job_title = 'Chief Executive Officer' WHERE role IN ('CEO', 'ceo', 'super_admin');
UPDATE public.employees SET job_title = 'System Administrator' WHERE role = 'admin';

-- Level 2: Corporate & Regional Directorates
UPDATE public.employees SET job_title = 'Regional Operations Manager' WHERE role = 'regional_manager';
UPDATE public.employees SET job_title = 'Head of Operations' WHERE role = 'operations_manager';
UPDATE public.employees SET job_title = 'Head of Finance' WHERE role = 'finance_manager';
UPDATE public.employees SET job_title = 'Head of Human Resources' WHERE role = 'hr_manager';
UPDATE public.employees SET job_title = 'Head of Procurement' WHERE role = 'procurement_manager';
UPDATE public.employees SET job_title = 'Head of Supply Chain' WHERE role = 'supply_chain_manager';
UPDATE public.employees SET job_title = 'Head of Merchandising' WHERE role = 'merchandising_manager';
UPDATE public.employees SET job_title = 'Regional Procurement Lead' WHERE role = 'regional_procurement_lead';
UPDATE public.employees SET job_title = 'Regional Finance Officer' WHERE role = 'regional_finance_officer';
UPDATE public.employees SET job_title = 'Regional Human Resources Officer' WHERE role = 'regional_hr_officer';
UPDATE public.employees SET job_title = 'Regional Logistics Lead' WHERE role = 'regional_logistics_lead';
UPDATE public.employees SET job_title = 'Regional Security Supervisor' WHERE role = 'regional_security_supervisor';

-- Level 3: Facility Operations Managers & Floor Supervisors
UPDATE public.employees SET job_title = 'Store Manager' WHERE role = 'store_manager';
UPDATE public.employees SET job_title = 'Warehouse Manager' WHERE role = 'warehouse_manager';
UPDATE public.employees SET job_title = 'Logistics Manager' WHERE role = 'logistics_manager';
UPDATE public.employees SET job_title = 'Inventory Manager' WHERE role = 'inventory_manager';
UPDATE public.employees SET job_title = 'Security Manager' WHERE role = 'security_manager';
UPDATE public.employees SET job_title = 'Dispatch Manager' WHERE role = 'dispatch_manager';
UPDATE public.employees SET job_title = 'Assistant Store Manager' WHERE role = 'assistant_manager';
UPDATE public.employees SET job_title = 'Shift Supervisor' WHERE role = 'shift_lead';
UPDATE public.employees SET job_title = 'Store Supervisor' WHERE role = 'store_supervisor';
UPDATE public.employees SET job_title = 'Customer Service Manager' WHERE role = 'cs_manager';
UPDATE public.employees SET job_title = 'Vendor Relations Manager' WHERE role = 'vendor_relations_manager';
UPDATE public.employees SET job_title = 'Fleet Maintenance Supervisor' WHERE role = 'fleet_maintenance_supervisor';

-- Level 4: Operational Specialists & Frontline Workforce
UPDATE public.employees SET job_title = 'Cashier' WHERE role = 'cashier';
UPDATE public.employees SET job_title = 'Retail Sales Associate' WHERE role = 'sales_associate';
UPDATE public.employees SET job_title = 'Inventory Clerk' WHERE role = 'stock_clerk';
UPDATE public.employees SET job_title = 'Warehouse Order Picker' WHERE role = 'picker';
UPDATE public.employees SET job_title = 'Warehouse Packer' WHERE role = 'packer';
UPDATE public.employees SET job_title = 'Warehouse Receiving Specialist' WHERE role = 'receiver';
UPDATE public.employees SET job_title = 'Delivery Driver' WHERE role = 'driver';
UPDATE public.employees SET job_title = 'Forklift Operator' WHERE role = 'forklift_operator';
UPDATE public.employees SET job_title = 'Inventory Control Specialist' WHERE role = 'inventory_specialist';
UPDATE public.employees SET job_title = 'Customer Service Representative' WHERE role = 'customer_service';
UPDATE public.employees SET job_title = 'Internal Auditor' WHERE role = 'auditor';
UPDATE public.employees SET job_title = 'IT Support Specialist' WHERE role = 'it_support';
UPDATE public.employees SET job_title = 'Procurement Buyer' WHERE role = 'buyer';
UPDATE public.employees SET job_title = 'Demand Planner' WHERE role = 'demand_planner';
UPDATE public.employees SET job_title = 'Replenishment Planner' WHERE role = 'replenishment_planner';
UPDATE public.employees SET job_title = 'Customs and Import Specialist' WHERE role = 'customs_import_specialist';
UPDATE public.employees SET job_title = 'Quality Control Inspector' WHERE role = 'inbound_qc_inspector';
UPDATE public.employees SET job_title = 'Store Operations Auditor' WHERE role = 'store_operations_auditor';
UPDATE public.employees SET job_title = 'Payroll Specialist' WHERE role = 'payroll_specialist';
UPDATE public.employees SET job_title = 'Talent Acquisition Specialist' WHERE role = 'talent_recruiter';
UPDATE public.employees SET job_title = 'Training Coordinator' WHERE role = 'training_coordinator';
UPDATE public.employees SET job_title = 'Treasury Officer' WHERE role = 'treasury_officer';
UPDATE public.employees SET job_title = 'Tax Compliance Officer' WHERE role = 'tax_compliance_officer';
UPDATE public.employees SET job_title = 'Credit Control Officer' WHERE role = 'credit_control_officer';
UPDATE public.employees SET job_title = 'Returns Specialist' WHERE role = 'returns_clerk';
UPDATE public.employees SET job_title = 'Merchandiser' WHERE role = 'merchandiser';
UPDATE public.employees SET job_title = 'Loss Prevention Officer' WHERE role = 'loss_prevention';
UPDATE public.employees SET job_title = 'Accountant' WHERE role = 'accountant';
UPDATE public.employees SET job_title = 'Business Data Analyst' WHERE role = 'data_analyst';

COMMIT;
