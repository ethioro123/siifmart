# 🏭🏪 WAREHOUSE & STORE ACCESS ANALYSIS

## Current Web Access Assessment

---

## 🏭 **WAREHOUSE ROLES**

### **1. Warehouse Manager (warehouse_manager)**

**Current Access:**
```
✅ Dashboard (WMS)
✅ Inventory
✅ Warehouse Operations
✅ Procurement
✅ Employees (view only)
```

**Detailed Permissions:**

| Module | Access Level | Specific Actions |
|--------|-------------|------------------|
| **Dashboard** | ✅ Full | View WMS dashboard |
| **Inventory** | ✅ Full | View, adjust stock, transfer stock |
| **Warehouse** | ✅ Full | Manage warehouse, assign tasks, complete tasks, view all tasks |
| **Procurement** | ✅ Partial | Create POs, receive POs, view suppliers |
| **Employees** | 👁️ View | View employee list (no edit/add/delete) |
| **POS** | ❌ None | Cannot access |
| **Sales** | ❌ None | Cannot access |
| **Customers** | ❌ None | Cannot access |
| **Finance** | ❌ None | Cannot access |
| **Settings** | ❌ None | Cannot access |

**Assessment:** ✅ **APPROPRIATE**
- Has necessary access for warehouse operations
- Can manage inventory and receive shipments
- Cannot access retail/financial data
- **Recommendation:** Keep as is

---

### **2. Dispatcher (dispatcher)**

**Current Access:**
```
✅ Dashboard (WMS)
✅ Inventory
✅ Warehouse Operations
✅ Procurement
✅ Employees (view only)
```

**Detailed Permissions:**

| Module | Access Level | Specific Actions |
|--------|-------------|------------------|
| **Dashboard** | ✅ Full | View WMS dashboard |
| **Inventory** | ✅ Partial | View, adjust stock, transfer stock |
| **Warehouse** | ✅ Full | Assign tasks, complete tasks, view all tasks |
| **Procurement** | ✅ Partial | Receive POs |
| **Employees** | 👁️ View | View employee list |
| **POS** | ❌ None | Cannot access |
| **Sales** | ❌ None | Cannot access |
| **Customers** | ❌ None | Cannot access |
| **Finance** | ❌ None | Cannot access |
| **Settings** | ❌ None | Cannot access |

**Assessment:** ✅ **APPROPRIATE**
- Has logistics coordination access
- Can manage tasks and inventory movements
- Cannot access retail/financial data
- **Recommendation:** Keep as is

---

### **3. Picker (picker)**

**Current Access:**
```
✅ Dashboard (WMS)
✅ Warehouse Operations (limited)
```

**Detailed Permissions:**

| Module | Access Level | Specific Actions |
|--------|-------------|------------------|
| **Dashboard** | ✅ Full | View WMS dashboard |
| **Warehouse** | ✅ Limited | Complete assigned tasks only |
| **Inventory** | ❌ None | Cannot view inventory module |
| **Procurement** | ❌ None | Cannot access |
| **Employees** | ❌ None | Cannot access |
| **POS** | ❌ None | Cannot access |
| **Sales** | ❌ None | Cannot access |
| **Customers** | ❌ None | Cannot access |
| **Finance** | ❌ None | Cannot access |
| **Settings** | ❌ None | Cannot access |

**Assessment:** ⚠️ **TOO RESTRICTIVE**
- Pickers need to see inventory to pick items
- Should have read-only inventory access
- **Recommendation:** Add `ACCESS_INVENTORY` (read-only)

---

### **4. Driver (driver)**

**Current Access:**
```
✅ Dashboard (WMS)
✅ Warehouse Operations (limited)
```

**Detailed Permissions:**

| Module | Access Level | Specific Actions |
|--------|-------------|------------------|
| **Dashboard** | ✅ Full | View WMS dashboard |
| **Warehouse** | ✅ Limited | Complete assigned delivery tasks |
| **Inventory** | ❌ None | Cannot access |
| **Procurement** | ❌ None | Cannot access |
| **Employees** | ❌ None | Cannot access |
| **POS** | ❌ None | Cannot access |
| **Sales** | ❌ None | Cannot access |
| **Customers** | ❌ None | Cannot access |
| **Finance** | ❌ None | Cannot access |
| **Settings** | ❌ None | Cannot access |

**Assessment:** ✅ **APPROPRIATE**
- Has minimal access needed for deliveries
- Cannot access sensitive data
- **Recommendation:** Keep as is

---

## 🏪 **RETAIL/STORE ROLES**

### **5. Store Manager (manager)**

**Current Access:**
```
✅ Dashboard (POS)
✅ POS
✅ Inventory
✅ Sales
✅ Customers
✅ Employees (view only)
✅ Procurement
✅ Pricing (view only)
✅ Warehouse
```

**Detailed Permissions:**

| Module | Access Level | Specific Actions |
|--------|-------------|------------------|
| **Dashboard** | ✅ Full | View POS dashboard |
| **POS** | ✅ Full | Process sales, void sales, refunds, discounts |
| **Inventory** | ✅ Partial | View, edit products (no delete) |
| **Sales** | ✅ Full | View reports, access sales data |
| **Customers** | ✅ Full | Add, edit customers (no delete) |
| **Employees** | 👁️ View | View employee list |
| **Procurement** | ✅ Partial | Create POs, manage suppliers |
| **Pricing** | ✅ Partial | View prices, create promotions |
| **Warehouse** | ✅ Full | Access warehouse operations |
| **Finance** | ❌ None | Cannot access |
| **Settings** | ❌ Partial | Operational settings only |

**Assessment:** ⚠️ **TOO MUCH ACCESS**
- Store managers have access to warehouse operations (why?)
- Can create POs (should be warehouse/procurement only)
- Can access all sales data (should be limited to their store)
- **Recommendation:** 
  - ❌ Remove `ACCESS_WAREHOUSE`
  - ❌ Remove `CREATE_PO` (or limit to store supplies only)
  - 🔒 Limit sales/inventory to their assigned store only

---

### **6. Store Supervisor (store_supervisor)**

**Current Access:**
```
✅ Dashboard (POS)
✅ POS
✅ Customers
```

**Detailed Permissions:**

| Module | Access Level | Specific Actions |
|--------|-------------|------------------|
| **Dashboard** | ✅ Full | View POS dashboard |
| **POS** | ✅ Full | Process sales, void sales, refunds, discounts |
| **Customers** | ✅ Full | View, add customers (no delete) |
| **Sales** | ✅ Partial | View transactions |
| **Pricing** | ✅ Limited | Create promotions |
| **Inventory** | ❌ None | Cannot access inventory module |
| **Procurement** | ❌ None | Cannot access |
| **Employees** | ❌ None | Cannot access |
| **Warehouse** | ❌ None | Cannot access |
| **Finance** | ❌ None | Cannot access |
| **Settings** | ❌ None | Cannot access |

**Assessment:** ⚠️ **MISSING INVENTORY ACCESS**
- Supervisors should see inventory to manage stock
- Need to know what's available to sell
- **Recommendation:** Add `ACCESS_INVENTORY` (read-only)

---

### **7. Inventory Specialist (inventory_specialist)**

**Current Access:**
```
✅ Dashboard (WMS)
✅ Inventory
✅ Warehouse
```

**Detailed Permissions:**

| Module | Access Level | Specific Actions |
|--------|-------------|------------------|
| **Dashboard** | ✅ Full | View WMS dashboard |
| **Inventory** | ✅ Full | View, adjust stock, transfer stock |
| **Warehouse** | ✅ Full | Manage warehouse, assign tasks |
| **Procurement** | ✅ Partial | Receive POs |
| **POS** | ❌ None | Cannot access |
| **Sales** | ❌ None | Cannot access |
| **Customers** | ❌ None | Cannot access |
| **Employees** | ❌ None | Cannot access |
| **Finance** | ❌ None | Cannot access |
| **Settings** | ❌ None | Cannot access |

**Assessment:** ✅ **APPROPRIATE**
- Has full inventory management access
- Can manage warehouse stock
- Cannot access retail/financial data
- **Recommendation:** Keep as is

---

### **8. Cashier/POS (pos)**

**Current Access:**
```
✅ Dashboard (POS)
✅ POS
✅ Customers
```

**Detailed Permissions:**

| Module | Access Level | Specific Actions |
|--------|-------------|------------------|
| **Dashboard** | ✅ Full | View POS dashboard |
| **POS** | ✅ Full | Process sales |
| **Customers** | ✅ Full | View, add customers |
| **Inventory** | ❌ None | Cannot access |
| **Sales** | ❌ None | Cannot view reports |
| **Procurement** | ❌ None | Cannot access |
| **Employees** | ❌ None | Cannot access |
| **Warehouse** | ❌ None | Cannot access |
| **Finance** | ❌ None | Cannot access |
| **Settings** | ❌ None | Cannot access |

**Assessment:** ⚠️ **MISSING INVENTORY ACCESS**
- Cashiers need to see if items are in stock
- Should have read-only inventory view
- **Recommendation:** Add `ACCESS_INVENTORY` (read-only, no edit)

---

## 📊 **SUMMARY OF ISSUES**

### **🔴 Critical Issues:**

1. **Store Managers have TOO MUCH access:**
   - ❌ Can access warehouse operations (not their domain)
   - ❌ Can create POs (should be procurement/warehouse)
   - ❌ Can see ALL sales data (should be store-specific)

2. **Pickers CANNOT see inventory:**
   - ❌ Need inventory access to pick items
   - Missing critical functionality

3. **Cashiers CANNOT see inventory:**
   - ❌ Need to check stock availability
   - Poor customer experience

4. **Store Supervisors CANNOT see inventory:**
   - ❌ Need inventory visibility for floor management

---

## ✅ **RECOMMENDED CHANGES**

### **1. Store Manager (manager) - REDUCE ACCESS**
```diff
- ACCESS_WAREHOUSE: Remove
- CREATE_PO: Remove (or limit to store supplies only)
+ Add site-based filtering for sales/inventory
```

### **2. Picker (picker) - ADD ACCESS**
```diff
+ ACCESS_INVENTORY: Add (read-only)
```

### **3. Store Supervisor (store_supervisor) - ADD ACCESS**
```diff
+ ACCESS_INVENTORY: Add (read-only)
```

### **4. Cashier/POS (pos) - ADD ACCESS**
```diff
+ ACCESS_INVENTORY: Add (read-only, no cost prices)
```

---

## 🎯 **PROPOSED NEW STRUCTURE**

### **Warehouse Workers:**
- ✅ Warehouse Manager: Full warehouse + inventory + procurement
- ✅ Dispatcher: Full warehouse + inventory coordination
- ✅ Picker: Warehouse tasks + **READ-ONLY inventory**
- ✅ Driver: Delivery tasks only
- ✅ Inventory Specialist: Full inventory + warehouse

### **Store Workers:**
- ⚠️ Store Manager: POS + Sales + Customers + **READ-ONLY inventory** (NO warehouse, NO PO creation)
- ✅ Store Supervisor: POS + Customers + **READ-ONLY inventory**
- ✅ Cashier: POS + Customers + **READ-ONLY inventory**

---

## 🔒 **SECURITY CONCERNS**

1. **Data Leakage Risk:**
   - Store managers can see warehouse operations
   - No site-based filtering on sales/inventory

2. **Operational Risk:**
   - Pickers working blind without inventory visibility
   - Cashiers cannot check stock

3. **Compliance Risk:**
   - Too much cross-domain access
   - Poor separation of duties

---

**Status:** ⚠️ **NEEDS ATTENTION**

**Priority:** 🔴 **HIGH** - Affects daily operations and security
