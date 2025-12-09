# 🚀 SIIFMART Supabase Setup Guide

**Setup Time:** 2-3 hours  
**Difficulty:** Intermediate  
**Cost:** Free tier (upgrade to $25/mo when ready)

---

## 📋 **Prerequisites**

- [x] Node.js installed
- [x] SIIFMART frontend complete
- [x] Supabase account (create at [supabase.com](https://supabase.com))
- [x] Basic SQL knowledge

---

## 🎯 **Step 1: Create Supabase Project** (10 min)

### 1.1 Sign Up
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Verify your email

### 1.2 Create Project
1. Click "New Project"
2. Fill in details:
   - **Name:** `siifmart-production`
   - **Database Password:** Generate strong password (save it!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free (upgrade later)
3. Click "Create new project"
4. Wait 2-3 minutes for provisioning

### 1.3 Get Credentials
1. Go to Project Settings → API
2. Copy and save:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon/public key:** `eyJhbGc...` (for client)
   - **service_role key:** `eyJhbGc...` (for admin, keep secret!)

---

## 🗄️ **Step 2: Database Schema** (30 min)

### 2.1 Open SQL Editor
1. In Supabase dashboard, click "SQL Editor"
2. Click "New query"
3. Copy and paste the schema below

### 2.2 Create Tables

```sql
-- ============================================================================
-- SIIFMART DATABASE SCHEMA
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SITES TABLE
-- ============================================================================
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Warehouse', 'Store', 'Distribution Center', 'Dark Store')),
  address TEXT,
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Maintenance', 'Closed')),
  manager VARCHAR(200),
  capacity INTEGER,
  terminal_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  cost_price DECIMAL(10,2) CHECK (cost_price >= 0),
  sale_price DECIMAL(10,2),
  is_on_sale BOOLEAN DEFAULT FALSE,
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'low_stock', 'out_of_stock')),
  location VARCHAR(100),
  expiry_date DATE,
  batch_number VARCHAR(50),
  shelf_position VARCHAR(50),
  competitor_price DECIMAL(10,2),
  sales_velocity VARCHAR(20) CHECK (sales_velocity IN ('High', 'Medium', 'Low')),
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_products_site_id ON products(site_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status ON products(status);

-- ============================================================================
-- CUSTOMERS TABLE
-- ============================================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(200),
  loyalty_points INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_visit DATE,
  tier VARCHAR(20) DEFAULT 'Bronze' CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_tier ON customers(tier);

-- ============================================================================
-- EMPLOYEES TABLE
-- ============================================================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name VARCHAR(200) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'wms', 'pos', 'picker', 'hr', 'auditor', 'driver')),
  email VARCHAR(200) UNIQUE NOT NULL,
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave', 'Terminated', 'Pending Approval')),
  join_date DATE NOT NULL,
  department VARCHAR(100),
  avatar TEXT,
  performance_score INTEGER CHECK (performance_score BETWEEN 0 AND 100),
  specialization VARCHAR(200),
  salary DECIMAL(10,2),
  badges JSONB,
  attendance_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employees_site_id ON employees(site_id);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_email ON employees(email);

-- ============================================================================
-- SUPPLIERS TABLE
-- ============================================================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Business', 'Farmer', 'Individual', 'One-Time')),
  contact VARCHAR(200) NOT NULL,
  email VARCHAR(200),
  phone VARCHAR(20),
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  rating DECIMAL(3,2) CHECK (rating BETWEEN 0 AND 5),
  lead_time INTEGER,
  tax_id VARCHAR(50),
  national_id VARCHAR(50),
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suppliers_status ON suppliers(status);

-- ============================================================================
-- PURCHASE ORDERS TABLE
-- ============================================================================
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name VARCHAR(200) NOT NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Received', 'Cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  items_count INTEGER NOT NULL,
  expected_delivery DATE,
  shipping_cost DECIMAL(10,2),
  tax_amount DECIMAL(10,2),
  notes TEXT,
  payment_terms VARCHAR(50),
  incoterms VARCHAR(10),
  destination VARCHAR(200),
  discount DECIMAL(10,2),
  temp_req VARCHAR(20),
  shelf_life VARCHAR(50),
  dock_slot VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_po_site_id ON purchase_orders(site_id);
CREATE INDEX idx_po_supplier_id ON purchase_orders(supplier_id);
CREATE INDEX idx_po_status ON purchase_orders(status);

-- ============================================================================
-- PURCHASE ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE po_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_po_items_po_id ON po_items(po_id);

-- ============================================================================
-- SALES TABLE
-- ============================================================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id),
  sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('Cash', 'Card', 'Mobile Money')),
  status VARCHAR(30) DEFAULT 'Completed' CHECK (status IN ('Completed', 'Pending', 'Refunded', 'Partially Refunded')),
  amount_tendered DECIMAL(10,2),
  change DECIMAL(10,2),
  cashier_name VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_site_id ON sales(site_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_status ON sales(status);

-- ============================================================================
-- SALE ITEMS TABLE
-- ============================================================================
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(200) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product_id ON sale_items(product_id);

-- ============================================================================
-- STOCK MOVEMENTS TABLE
-- ============================================================================
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('IN', 'OUT', 'TRANSFER', 'ADJUSTMENT')),
  quantity INTEGER NOT NULL,
  movement_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  performed_by VARCHAR(200) NOT NULL,
  reason TEXT,
  batch_number VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_movements_site_id ON stock_movements(site_id);
CREATE INDEX idx_movements_product_id ON stock_movements(product_id);
CREATE INDEX idx_movements_date ON stock_movements(movement_date);

-- ============================================================================
-- EXPENSES TABLE
-- ============================================================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('Rent', 'Utilities', 'Marketing', 'Maintenance', 'Software', 'Other')),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Paid', 'Pending', 'Overdue')),
  approved_by VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_site_id ON expenses(site_id);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- ============================================================================
-- WMS JOBS TABLE
-- ============================================================================
CREATE TABLE wms_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('PICK', 'PACK', 'PUTAWAY')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('Critical', 'High', 'Normal')),
  status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In-Progress', 'Completed')),
  items_count INTEGER NOT NULL,
  assigned_to VARCHAR(200),
  location VARCHAR(200),
  order_ref VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wms_jobs_site_id ON wms_jobs(site_id);
CREATE INDEX idx_wms_jobs_status ON wms_jobs(status);

-- ============================================================================
-- SHIFTS TABLE
-- ============================================================================
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  cashier_id UUID REFERENCES employees(id),
  cashier_name VARCHAR(200) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  opening_float DECIMAL(10,2) NOT NULL,
  cash_sales DECIMAL(10,2) NOT NULL,
  expected_cash DECIMAL(10,2) NOT NULL,
  actual_cash DECIMAL(10,2) NOT NULL,
  variance DECIMAL(10,2) NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'Closed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shifts_site_id ON shifts(site_id);
CREATE INDEX idx_shifts_cashier_id ON shifts(cashier_id);

-- ============================================================================
-- SYSTEM LOGS TABLE
-- ============================================================================
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_name VARCHAR(200) NOT NULL,
  action VARCHAR(200) NOT NULL,
  details TEXT,
  module VARCHAR(50) NOT NULL CHECK (module IN ('Settings', 'HR', 'Sites', 'Security', 'Finance')),
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_created_at ON system_logs(created_at);
CREATE INDEX idx_logs_module ON system_logs(module);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON sites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wms_jobs_updated_at BEFORE UPDATE ON wms_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wms_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- For now, allow all authenticated users (we'll refine this later)
CREATE POLICY "Allow all for authenticated users" ON sites FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON employees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON suppliers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON purchase_orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON po_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON sales FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON sale_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON stock_movements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON expenses FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON wms_jobs FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON shifts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON system_logs FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- DONE!
-- ============================================================================
```

### 2.3 Run Schema
1. Click "Run" (or Ctrl/Cmd + Enter)
2. Wait for completion
3. Check for errors (should see "Success")

---

## 🔐 **Step 3: Authentication Setup** (15 min)

### 3.1 Enable Email Auth
1. Go to Authentication → Providers
2. Enable "Email" provider
3. Configure email templates (optional)

### 3.2 Create Admin User
1. Go to Authentication → Users
2. Click "Add user"
3. Enter:
   - **Email:** your-email@example.com
   - **Password:** Strong password
   - **Auto Confirm:** Yes
4. Click "Create user"

---

## 📦 **Step 4: Install Supabase Client** (5 min)

```bash
cd "/Users/shukriidriss/Downloads/siifmart 80"
npm install @supabase/supabase-js
```

---

## 🔧 **Step 5: Configure Environment** (5 min)

### 5.1 Create `.env.local`
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Optional: For admin operations
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 5.2 Update `.gitignore`
```
.env.local
.env
```

---

## 🎯 **Next Steps**

1. ✅ Review `SUPABASE_VS_FIREBASE.md` for cost comparison
2. ✅ Database schema created
3. ✅ Authentication configured
4. ✅ Supabase client installed
5. 🔄 **NEXT:** Create API service layer (see `SUPABASE_INTEGRATION.md`)

---

*Setup guide by AI Assistant - November 23, 2025*
