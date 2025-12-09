# 🔐 PERMISSION HIERARCHY - UPDATED

## Overview
The permission system has been restructured to ensure **only the CEO (super_admin) has full access to everything**. All other roles, including System Admin and HQ staff, now have restricted, domain-specific permissions.

---

## 🎯 Permission Hierarchy

### **1. CEO (super_admin)** 👑
**Access Level:** UNRESTRICTED - Full access to everything

```typescript
Permissions: ['*']  // Wildcard = Everything
```

**Can do:**
- ✅ Everything in the system
- ✅ Delete any data
- ✅ Manage all sites
- ✅ Manage all roles
- ✅ Override any restriction
- ✅ Access all modules
- ✅ View all financial data
- ✅ Approve/reject anything

---

### **2. System Admin (admin)** 🔧
**Access Level:** TECHNICAL/SYSTEM - Limited to IT operations

```typescript
Permissions: ['dashboard', 'settings', 'employees']
```

**Can do:**
- ✅ View admin dashboard
- ✅ Manage system settings (with IT Support)
- ✅ Reset passwords
- ✅ Create login accounts
- ✅ View audit logs
- ✅ View employee list (read-only)

**Cannot do:**
- ❌ Access POS
- ❌ Manage inventory
- ❌ View/manage sales
- ❌ Manage customers
- ❌ Add/edit/delete employees (HR's job)
- ❌ Manage procurement
- ❌ Access finance data
- ❌ Edit prices
- ❌ Manage warehouse operations
- ❌ Manage sites

**Role:** Technical support and system maintenance, NOT business operations

---

### **3. HQ Department Heads** 🏢

#### **HR Manager (hr)**
**Access Level:** EMPLOYEE & PAYROLL

```typescript
Permissions: ['dashboard', 'employees', 'finance']
```

**Can do:**
- ✅ View HR dashboard
- ✅ Add new employees
- ✅ Edit employee details
- ✅ Approve new hires
- ✅ View salaries
- ✅ Process payroll
- ✅ Access finance (payroll-related)

**Cannot do:**
- ❌ Delete employees (CEO only)
- ❌ Manage sites
- ❌ Access POS/Sales
- ❌ Manage inventory
- ❌ Manage procurement

---

#### **Finance Manager (finance_manager)**
**Access Level:** FINANCIAL OVERSIGHT

```typescript
Permissions: ['dashboard', 'finance', 'sales', 'procurement', 'employees']
```

**Can do:**
- ✅ View revenue reports
- ✅ View expenses
- ✅ Add expenses
- ✅ View payroll
- ✅ Process payroll
- ✅ Export financial data
- ✅ Approve POs (financial approval)
- ✅ Approve price changes
- ✅ View cost prices
- ✅ View sales reports

**Cannot do:**
- ❌ Delete sales (CEO only)
- ❌ Edit sales (CEO only)
- ❌ Add/edit employees
- ❌ Manage warehouse
- ❌ Access POS directly

---

#### **Procurement Manager (procurement_manager)**
**Access Level:** SUPPLY CHAIN & PURCHASING

```typescript
Permissions: ['dashboard', 'procurement', 'inventory', 'warehouse', 'finance']
```

**Can do:**
- ✅ Create purchase orders
- ✅ Approve POs
- ✅ Delete POs
- ✅ Manage suppliers
- ✅ Add products
- ✅ Edit products
- ✅ View cost prices
- ✅ View inventory
- ✅ View expenses
- ✅ Access pricing

**Cannot do:**
- ❌ Delete products (CEO only)
- ❌ Adjust stock (Warehouse's job)
- ❌ Access POS
- ❌ Manage employees

---

#### **Customer Service Manager (cs_manager)**
**Access Level:** CUSTOMER RELATIONS

```typescript
Permissions: ['dashboard', 'customers', 'sales']
```

**Can do:**
- ✅ View POS dashboard
- ✅ Access customers
- ✅ Add customers
- ✅ Edit customers
- ✅ View customer history
- ✅ Process refunds
- ✅ View sales reports

**Cannot do:**
- ❌ Delete customers (CEO only)
- ❌ Access inventory
- ❌ Manage employees
- ❌ Access finance
- ❌ Manage procurement

---

#### **Auditor (auditor)**
**Access Level:** READ-ONLY FINANCIAL OVERSIGHT

```typescript
Permissions: ['dashboard', 'sales', 'inventory', 'finance']
```

**Can do:**
- ✅ View all transactions
- ✅ View sales reports
- ✅ Export sales data
- ✅ View revenue
- ✅ View expenses
- ✅ Export financial data
- ✅ View audit logs
- ✅ View cost prices
- ✅ View customer history
- ✅ View inventory

**Cannot do:**
- ❌ Edit anything (read-only role)
- ❌ Delete anything
- ❌ Process transactions
- ❌ Manage employees
- ❌ Approve POs

---

#### **IT Support (it_support)**
**Access Level:** TECHNICAL SUPPORT

```typescript
Permissions: ['dashboard', 'settings', 'employees']
```

**Can do:**
- ✅ View admin dashboard
- ✅ Edit system settings (with CEO)
- ✅ Reset passwords
- ✅ Create login accounts
- ✅ Edit employee technical details
- ✅ View audit logs
- ✅ Access employee list

**Cannot do:**
- ❌ Add/delete employees
- ❌ View salaries
- ❌ Access business operations
- ❌ Manage sites

---

### **4. Warehouse Roles** 🏭

#### **Warehouse Manager (warehouse_manager)**
```typescript
Permissions: ['dashboard', 'inventory', 'warehouse', 'procurement']
```

**Can do:**
- ✅ Manage warehouse operations
- ✅ Adjust stock
- ✅ Transfer stock
- ✅ Assign tasks
- ✅ Create POs
- ✅ Receive POs
- ✅ View inventory

**Cannot do:**
- ❌ Delete products
- ❌ Access POS
- ❌ Manage employees
- ❌ Access finance

---

#### **Dispatcher (dispatcher)**
```typescript
Permissions: ['dashboard', 'inventory', 'warehouse', 'procurement']
```

Similar to Warehouse Manager but focused on logistics coordination.

---

### **5. Retail Roles** 🏪

#### **Store Manager (manager)**
```typescript
Permissions: ['dashboard', 'pos', 'inventory', 'sales', 'customers', 
              'employees', 'procurement', 'pricing', 'warehouse']
```

**Can do:**
- ✅ Manage store operations
- ✅ Access POS
- ✅ Process sales
- ✅ Manage customers
- ✅ View inventory
- ✅ Create POs
- ✅ View employee list
- ✅ Create promotions

**Cannot do:**
- ❌ Delete sales/products/customers
- ❌ Add/delete employees
- ❌ Access finance data
- ❌ Approve POs
- ❌ Edit prices (Finance's job)

---

## 📊 Permission Comparison

| Action | CEO | Admin | HR | Finance | Procurement | Auditor | IT |
|--------|-----|-------|----|---------|-----------|---------|----|
| Delete Data | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Sites | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Add Employees | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Salaries | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Access POS | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage Inventory | ✅ | ❌ | ❌ | ❌ | ✅ | 👁️ | ❌ |
| View Finance | ✅ | ❌ | 💰 | ✅ | 💰 | ✅ | ❌ |
| System Settings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Reset Passwords | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

**Legend:**
- ✅ = Full Access
- ❌ = No Access
- 👁️ = Read-Only
- 💰 = Payroll/Limited Finance

---

## 🔒 Key Changes Made

### **Before:**
- ❌ Admin had almost full access (same as CEO)
- ❌ HQ staff could access modules outside their domain
- ❌ No clear separation of duties

### **After:**
- ✅ **CEO only** has unrestricted access
- ✅ **Admin** is now a technical/IT role (not business operations)
- ✅ **HQ staff** have domain-specific permissions only
- ✅ Clear separation of duties (SOD compliance)

---

## 🧪 Testing the New Permissions

1. **Login as CEO (Shukri Kamal)**
   - Should see ALL modules in sidebar
   - Should be able to do EVERYTHING

2. **Login as Admin (Sara Tesfaye)**
   - Should see: Dashboard, Settings, Employees
   - Should NOT see: POS, Sales, Inventory, Procurement, Finance

3. **Login as HR (Tigist Alemayehu)**
   - Should see: Dashboard, Employees, Finance (payroll)
   - Should NOT see: POS, Sales, Inventory, Procurement, Warehouse

4. **Login as Finance Manager (Rahel Tesfaye)**
   - Should see: Dashboard, Finance, Sales (reports), Procurement (approval)
   - Should NOT see: POS, Warehouse, Employees (except payroll)

5. **Login as Procurement Manager (Yohannes Bekele)**
   - Should see: Dashboard, Procurement, Inventory, Warehouse
   - Should NOT see: POS, Sales, Finance, Employees

---

## ✅ Status

**Permission restructuring:** ✅ **COMPLETE**

- CEO has full access
- Admin is now technical-only
- HQ staff have appropriate domain restrictions
- Clear hierarchy established
