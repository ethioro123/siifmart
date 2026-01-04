-- SCHEMA HARDENING & MULTI-SITE SECURITY MIGRATION
-- This script hardens the database schema by enforcing Foreign Keys, Check Constraints, and Row Level Security (RLS) policies.

-- 1. SITES & ZONES (Location Hardening)
-- Create Warehouse Zones table if it doesn't exist
CREATE TABLE IF NOT EXISTS "warehouse_zones" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" TEXT NOT NULL,
  "capacity" INTEGER DEFAULT 0,
  "occupied" INTEGER DEFAULT 0,
  "type" TEXT CHECK (type IN ('Dry', 'Cold', 'Secure')),
  "temperature" TEXT,
  "site_id" UUID REFERENCES "sites"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMPTZ DEFAULT NOW()
);

-- Register system_logs table if missing (for audit trigger)
CREATE TABLE IF NOT EXISTS "system_logs" (
  "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "user_id" UUID, -- Can be null if system action
  "action" TEXT NOT NULL,
  "details" TEXT,
  "module" TEXT NOT NULL,
  "ip" TEXT,
  "timestamp" TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure Warehouse Zones are linked to specific Sites (Warehouses) - Redundant if table just created, but safe for existing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='warehouse_zones' AND column_name='site_id') THEN
    ALTER TABLE "warehouse_zones" ADD COLUMN "site_id" UUID REFERENCES "sites"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- Enforce valid Site Types
ALTER TABLE "sites" ADD CONSTRAINT "check_site_type" CHECK (type IN ('Administration', 'Warehouse', 'Store', 'Distribution Center', 'Dark Store'));

-- 2. PRODUCTS & INVENTORY (Product Location Hardening)
-- Ensure Products belong to a valid Site
ALTER TABLE "products" ADD CONSTRAINT "fk_product_site" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE CASCADE;
-- Ensure Price and Stock are non-negative
ALTER TABLE "products" ADD CONSTRAINT "check_price_positive" CHECK (price >= 0);
ALTER TABLE "products" ADD CONSTRAINT "check_stock_positive" CHECK (stock >= 0);
-- Link Product to a Warehouse Zone (Optional, for precise location)
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "zone_id" UUID REFERENCES "warehouse_zones"("id") ON DELETE SET NULL;

-- 3. EMPLOYEES (Employer Location Hardening)
-- Ensure Employees are assigned to a valid Site
ALTER TABLE "employees" ADD CONSTRAINT "fk_employee_site" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL;
-- Enforce Role Types
ALTER TABLE "employees" ADD CONSTRAINT "check_employee_role" CHECK (role IN ('super_admin', 'admin', 'manager', 'warehouse_manager', 'dispatcher', 'pos', 'picker', 'hr', 'auditor', 'driver', 'finance_manager', 'procurement_manager', 'store_supervisor', 'inventory_specialist', 'cs_manager', 'it_support'));

-- 4. SALES & TRANSACTIONS (Data Integrity)
-- Ensure Sales are linked to a Site
ALTER TABLE "sales" ADD CONSTRAINT "fk_sale_site" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE RESTRICT;

-- 5. ROW LEVEL SECURITY (RLS) - Multi-Site Access Control

-- Enable RLS on all key tables
ALTER TABLE "sites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "system_logs" ENABLE ROW LEVEL SECURITY;

-- FUNCTION: Get Auth Role (Security Definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM employees WHERE email = auth.email());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICY: Allow Public Read on Employees (Required for Login username lookup)
DROP POLICY IF EXISTS "Public_Read_Employees" ON "employees";
CREATE POLICY "Public_Read_Employees" ON "employees"
FOR SELECT
USING (true);

-- POLICY: Admins can full access Employees
DROP POLICY IF EXISTS "Admin_Modify_Employees" ON "employees";
CREATE POLICY "Admin_Modify_Employees" ON "employees"
FOR ALL
USING (
  get_auth_role() IN ('super_admin', 'admin', 'hr')
);

-- POLICY: Admins can view System Logs
DROP POLICY IF EXISTS "Admin_View_Logs" ON "system_logs";
CREATE POLICY "Admin_View_Logs" ON "system_logs"
FOR SELECT
USING (
  get_auth_role() IN ('super_admin', 'admin', 'hr', 'it_support')
);

-- POLICY: Allow System to Insert Logs
DROP POLICY IF EXISTS "Public_Insert_Logs" ON "system_logs";
CREATE POLICY "Public_Insert_Logs" ON "system_logs"
FOR INSERT
WITH CHECK (true);


-- POLICY: CEOs & HQ Roles can see ALL Sites
DROP POLICY IF EXISTS "HQ_Access_All_Sites" ON "sites";
CREATE POLICY "HQ_Access_All_Sites" ON "sites"
FOR ALL
USING (
  get_auth_role() IN ('super_admin', 'admin', 'hr', 'finance_manager', 'auditor')
);

-- POLICY: Site Managers can only see THEIR Site
DROP POLICY IF EXISTS "Manager_Access_Own_Site" ON "sites";
CREATE POLICY "Manager_Access_Own_Site" ON "sites"
FOR SELECT
USING (
  id IN (
    SELECT site_id FROM employees WHERE email = auth.email() AND role IN ('manager', 'warehouse_manager', 'store_supervisor')
  )
);

-- POLICY: Employees can see Products in THEIR Site (and HQ can see all)
DROP POLICY IF EXISTS "Product_Access_Policy" ON "products";
CREATE POLICY "Product_Access_Policy" ON "products"
FOR ALL
USING (
  -- User is HQ/Admin
  get_auth_role() IN ('super_admin', 'admin', 'procurement_manager')
  OR 
  -- User belongs to the Product's Site
  site_id IN (SELECT site_id FROM employees WHERE email = auth.email())
);

-- POLICY: Employees can only see Sales in THEIR Site
DROP POLICY IF EXISTS "Sales_Access_Policy" ON "sales";
CREATE POLICY "Sales_Access_Policy" ON "sales"
FOR SELECT
USING (
  -- User is HQ/Admin
  get_auth_role() IN ('super_admin', 'admin', 'finance_manager', 'auditor')
  OR 
  -- User belongs to the Sale's Site
  site_id IN (SELECT site_id FROM employees WHERE email = auth.email())
);

-- 6. AUDIT LOGGING (Hardening)
-- Create a trigger to auto-log sensitive changes (Example: Employee Salary Change)
CREATE OR REPLACE FUNCTION log_sensitive_change() RETURNS TRIGGER AS $$
BEGIN
  IF OLD.salary <> NEW.salary THEN
    INSERT INTO system_logs (user_id, action, details, module, timestamp)
    VALUES (auth.uid(), 'SALARY_UPDATE', 'Salary changed for employee ' || NEW.id, 'HR', NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_salary
AFTER UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION log_sensitive_change();
