-- Give employees a professional job title separate from their access-control role.
-- Existing titles are preserved; blank titles are populated from the canonical role catalog.

BEGIN;

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS job_title text;

UPDATE public.employees
SET job_title = CASE LOWER(role)
  WHEN 'super_admin' THEN 'Chief Executive Officer'
  WHEN 'ceo' THEN 'Chief Executive Officer'
  WHEN 'admin' THEN 'System Administrator'
  WHEN 'operations_manager' THEN 'Head of Operations'
  WHEN 'finance_manager' THEN 'Head of Finance'
  WHEN 'hr_manager' THEN 'Head of Human Resources'
  WHEN 'procurement_manager' THEN 'Head of Procurement'
  WHEN 'supply_chain_manager' THEN 'Head of Supply Chain'
  WHEN 'merchandising_manager' THEN 'Head of Merchandising'
  WHEN 'regional_manager' THEN 'Regional Operations Manager'
  WHEN 'regional_procurement_lead' THEN 'Regional Procurement Lead'
  WHEN 'regional_finance_officer' THEN 'Regional Finance Officer'
  WHEN 'regional_hr_officer' THEN 'Regional Human Resources Officer'
  WHEN 'regional_logistics_lead' THEN 'Regional Logistics Lead'
  WHEN 'regional_security_supervisor' THEN 'Regional Security Supervisor'
  WHEN 'store_manager' THEN 'Store Manager'
  WHEN 'warehouse_manager' THEN 'Warehouse Manager'
  WHEN 'logistics_manager' THEN 'Logistics Manager'
  WHEN 'inventory_manager' THEN 'Inventory Manager'
  WHEN 'security_manager' THEN 'Security Manager'
  WHEN 'dispatch_manager' THEN 'Dispatch Manager'
  WHEN 'assistant_manager' THEN 'Assistant Store Manager'
  WHEN 'vendor_relations_manager' THEN 'Vendor Relations Manager'
  WHEN 'fleet_maintenance_supervisor' THEN 'Fleet Maintenance Supervisor'
  WHEN 'shift_lead' THEN 'Shift Supervisor'
  WHEN 'cashier' THEN 'Cashier'
  WHEN 'sales_associate' THEN 'Retail Sales Associate'
  WHEN 'stock_clerk' THEN 'Inventory Clerk'
  WHEN 'picker' THEN 'Warehouse Order Picker'
  WHEN 'packer' THEN 'Warehouse Packer'
  WHEN 'receiver' THEN 'Warehouse Receiving Specialist'
  WHEN 'driver' THEN 'Delivery Driver'
  WHEN 'forklift_operator' THEN 'Forklift Operator'
  WHEN 'inventory_specialist' THEN 'Inventory Control Specialist'
  WHEN 'customer_service' THEN 'Customer Service Representative'
  WHEN 'auditor' THEN 'Internal Auditor'
  WHEN 'it_support' THEN 'IT Support Specialist'
  WHEN 'buyer' THEN 'Procurement Buyer'
  WHEN 'demand_planner' THEN 'Demand Planner'
  WHEN 'replenishment_planner' THEN 'Replenishment Planner'
  WHEN 'customs_import_specialist' THEN 'Customs and Import Specialist'
  WHEN 'inbound_qc_inspector' THEN 'Quality Control Inspector'
  WHEN 'store_operations_auditor' THEN 'Store Operations Auditor'
  WHEN 'hr' THEN 'Human Resources Officer'
  WHEN 'pos' THEN 'Point of Sale Cashier'
  WHEN 'cs_manager' THEN 'Customer Service Manager'
  WHEN 'store_supervisor' THEN 'Store Supervisor'
  WHEN 'dispatcher' THEN 'Dispatcher'
  WHEN 'returns_clerk' THEN 'Returns Specialist'
  WHEN 'merchandiser' THEN 'Merchandiser'
  WHEN 'loss_prevention' THEN 'Loss Prevention Officer'
  WHEN 'accountant' THEN 'Accountant'
  WHEN 'data_analyst' THEN 'Business Data Analyst'
  WHEN 'training_coordinator' THEN 'Training Coordinator'
  WHEN 'payroll_specialist' THEN 'Payroll Specialist'
  WHEN 'talent_recruiter' THEN 'Talent Acquisition Specialist'
  WHEN 'treasury_officer' THEN 'Treasury Officer'
  WHEN 'tax_compliance_officer' THEN 'Tax Compliance Officer'
  WHEN 'credit_control_officer' THEN 'Credit Control Officer'
  ELSE INITCAP(REPLACE(LOWER(role), '_', ' '))
END
WHERE job_title IS NULL OR BTRIM(job_title) = '';

ALTER TABLE public.employees
  ALTER COLUMN job_title SET NOT NULL;

COMMIT;
