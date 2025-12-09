# 🔧 EMPLOYEE UPDATE INSTRUCTIONS

## ⚠️ IMPORTANT: Database Schema Update Required

Your database currently has a constraint that only allows the old `wms` role. We need to update it to allow the new roles: `warehouse_manager` and `dispatcher`.

---

## 📋 Step-by-Step Instructions

### Step 1: Update Database Schema (REQUIRED FIRST!)

1. **Open your Supabase Dashboard**
   - Go to https://supabase.com
   - Select your project
   - Go to **SQL Editor**

2. **Run this SQL** (copy from `update-role-constraint.sql`):

```sql
-- Drop old constraint
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_role_check;

-- Add new constraint with warehouse_manager and dispatcher
ALTER TABLE employees ADD CONSTRAINT employees_role_check 
CHECK (role IN (
    'super_admin', 'admin', 'manager',
    'warehouse_manager',  -- NEW
    'dispatcher',         -- NEW
    'pos', 'picker', 'hr', 'auditor', 'driver',
    'finance_manager', 'procurement_manager',
    'store_supervisor', 'inventory_specialist',
    'cs_manager', 'it_support'
));
```

3. **Click "Run"** to execute

---

### Step 2: Update Existing Employees

After updating the schema, run this command in your terminal:

```bash
node scripts/update-warehouse-roles.js
```

This will:
- Find all employees with `wms` role
- Update the first one to `warehouse_manager`
- Update the rest to `dispatcher`

---

### Step 3: Verify the Changes

Run this SQL in Supabase to verify:

```sql
SELECT role, COUNT(*) as count, STRING_AGG(name, ', ') as employees
FROM employees
WHERE role IN ('warehouse_manager', 'dispatcher', 'picker', 'driver')
GROUP BY role
ORDER BY role;
```

You should see:
- **warehouse_manager**: 1 employee (Lensa Merga)
- **dispatcher**: 1 employee (Betelhem Bekele)
- **picker**: 4 employees
- **driver**: (if any)

---

## 🎯 Current Status

### Found Employees with 'wms' Role:
1. **Lensa Merga** (lensa.merga@siifmart.com) → Will become **Warehouse Manager**
2. **Betelhem Bekele** (betelhem.bekele@siifmart.com) → Will become **Warehouse Dispatcher**

### Current Warehouse Team:
- **Pickers**: Betelhem Yilma, Meron Yilma, Helen Getachew, Abebe Yilma

---

## ✅ After Migration, Your Warehouse Team Will Be:

```
Warehouse Manager (warehouse_manager)
├── Lensa Merga
│
Warehouse Dispatcher (dispatcher)
├── Betelhem Bekele
│
Pick/Packers (picker)
├── Betelhem Yilma
├── Meron Yilma
├── Helen Getachew
└── Abebe Yilma
```

---

## 🚨 Why This Failed

The migration script tried to update employees but got this error:

```
new row for relation "employees" violates check constraint "employees_role_check"
```

This means the database doesn't recognize `warehouse_manager` and `dispatcher` as valid roles yet. You MUST run the SQL in Step 1 first!

---

## 📝 Files Created

1. **`update-role-constraint.sql`** - SQL to update database schema
2. **`scripts/update-warehouse-roles.js`** - Script to update employees
3. **`migrate-warehouse-roles.sql`** - Alternative SQL migration

---

## 🔄 Quick Commands

### Update Schema (Supabase SQL Editor):
```sql
-- Copy and paste from update-role-constraint.sql
```

### Update Employees (Terminal):
```bash
cd "/Users/shukriidriss/Downloads/siifmart 80"
node scripts/update-warehouse-roles.js
```

### Verify (Supabase SQL Editor):
```sql
SELECT role, name, email FROM employees 
WHERE role IN ('warehouse_manager', 'dispatcher') 
ORDER BY role;
```

---

## ✨ After Completing These Steps

1. ✅ Database will accept new roles
2. ✅ Employees will be updated
3. ✅ App will show new quick access features
4. ✅ Everyone can use `Ctrl+Space` for quick access

---

## 🆘 Need Help?

If you get stuck:
1. Make sure you ran the SQL in Step 1 FIRST
2. Check that you're in the correct Supabase project
3. Verify the SQL ran without errors
4. Then run the Node script in Step 2

---

**Next**: After running these steps, open http://localhost:3002 and login as any employee to see the new quick access features! 🚀
