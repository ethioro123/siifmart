# 🏭 WAREHOUSE LOCATION-BASED ACCESS ANALYSIS

## Current Situation

### **Warehouse Staff Distribution:**

**Adama Distribution Center:**
- Lensa Merga (Warehouse Manager)
- Helen Getachew (Picker)
- Mulugeta Tadesse (Driver)

**Harar Logistics Hub:**
- Betelhem Bekele (Dispatcher)
- Abebe Yilma (Picker)

**Dire Dawa Storage Facility:**
- Betelhem Yilma (Picker)
- Meron Yilma (Picker)

**Aratanya Market:** (Store with inventory specialist)
- Hanna Mulugeta (Inventory Specialist)

---

## 🔴 **CRITICAL PROBLEM IDENTIFIED**

### **Current Access Model: UNRESTRICTED**

**Problem:**
- ❌ Pickers at Adama DC can see/access operations at Harar Hub
- ❌ Pickers at Harar Hub can see/access operations at Dire Dawa
- ❌ Drivers at Adama can see tasks from all warehouses
- ❌ No location-based filtering in warehouse operations

**Example Scenario:**
```
Helen Getachew (Picker at Adama DC)
Currently can:
  ✅ See ALL warehouse jobs across ALL 3 warehouses
  ✅ Accept jobs from Harar Hub (300km away!)
  ✅ View inventory at Dire Dawa
  ✅ Complete tasks at any warehouse

Should only:
  ✅ See jobs at Adama DC ONLY
  ✅ View inventory at Adama DC ONLY
  ✅ Complete tasks at Adama DC ONLY
```

---

## 🎯 **RECOMMENDED ACCESS MODEL**

### **Warehouse Worker Access Rules:**

| Role | Current Access | Should Have | Reason |
|------|---------------|-------------|---------|
| **Warehouse Manager** | All warehouses | **Assigned warehouse ONLY** | Each warehouse has its own manager |
| **Dispatcher** | All warehouses | **Assigned warehouse ONLY** | Coordinates logistics at ONE location |
| **Picker** | All warehouses | **Assigned warehouse ONLY** | Picks at ONE physical location |
| **Driver** | All warehouses | **Assigned warehouse ONLY** | Delivers from ONE warehouse |
| **Inventory Specialist** | All warehouses | **Assigned location ONLY** | Manages stock at ONE location |

### **Exception: Multi-Site Roles**

| Role | Access | Reason |
|------|--------|---------|
| **CEO (super_admin)** | All locations | Executive oversight |
| **Procurement Manager** | All warehouses | Centralized purchasing |
| **Auditor** | All locations | Compliance oversight |
| **Finance Manager** | All locations | Financial oversight |

---

## 🔧 **REQUIRED FIXES**

### **1. Site-Based Filtering in Warehouse Operations**

**File:** `pages/WarehouseOperations.tsx`

**Current Code:**
```typescript
// Shows ALL jobs from ALL warehouses
const jobs = wmsJobs.filter(job => job.type === 'PICK');
```

**Should Be:**
```typescript
// Shows ONLY jobs from user's assigned warehouse
const jobs = wmsJobs.filter(job => 
  job.type === 'PICK' && 
  job.siteId === user.siteId  // Filter by user's site!
);
```

---

### **2. Employee Filtering in Task Assignment**

**File:** `pages/WarehouseOperations.tsx`

**Current Code:**
```typescript
// Shows ALL warehouse employees
const employees = allEmployees.filter(e => 
  ['picker', 'dispatcher', 'warehouse_manager'].includes(e.role)
);
```

**Should Be:**
```typescript
// Shows ONLY employees at THIS warehouse
const employees = allEmployees.filter(e => 
  ['picker', 'dispatcher', 'warehouse_manager'].includes(e.role) &&
  e.siteId === currentSiteId  // Filter by site!
);
```

---

### **3. Inventory Filtering**

**File:** `pages/Inventory.tsx`

**Current Code:**
```typescript
// Shows ALL inventory across ALL locations
const products = allProducts;
```

**Should Be:**
```typescript
// For warehouse workers: show ONLY their warehouse
const products = isWarehouseWorker(user.role)
  ? allProducts.filter(p => p.siteId === user.siteId)
  : allProducts;  // Managers/admins see all
```

---

### **4. Network Inventory - Keep As Is**

**File:** `pages/NetworkInventory.tsx`

**Current:** Shows all locations (CORRECT)
**Reason:** This is intentionally a network-wide view for coordination

---

## 🔒 **SECURITY IMPLICATIONS**

### **Current Risks:**

1. **Data Leakage:**
   - Workers can see competitor warehouse operations
   - Inventory levels visible across all sites
   - Task assignments visible to unauthorized staff

2. **Operational Confusion:**
   - Picker might accept job at wrong warehouse
   - Driver might see deliveries not from their warehouse
   - Task assignment to wrong location

3. **Compliance:**
   - No proper segregation by location
   - Workers accessing data outside their scope

---

## 📋 **IMPLEMENTATION PLAN**

### **Phase 1: Add Site Filtering to Warehouse Operations** 🔴 CRITICAL

**Files to Modify:**
1. `pages/WarehouseOperations.tsx`
   - Filter jobs by `user.siteId`
   - Filter employees by current site
   - Filter inventory by current site

**Priority:** 🔴 **CRITICAL** - Security and operational issue

---

### **Phase 2: Add Site Filtering to Inventory** 🟡 HIGH

**Files to Modify:**
1. `pages/Inventory.tsx`
   - Add site-based filtering for warehouse workers
   - Keep full access for managers/admins

**Priority:** 🟡 **HIGH** - Security issue

---

### **Phase 3: Update Permissions Logic** 🟡 HIGH

**Files to Modify:**
1. `utils/permissions.ts`
   - Add `canAccessSite(user, siteId)` function
   - Add site-based permission checks

**Priority:** 🟡 **HIGH** - Foundation for site-based security

---

### **Phase 4: Add Site Selector for Multi-Site Roles** 🟢 MEDIUM

**Files to Modify:**
1. `components/TopBar.tsx`
   - Already has site selector
   - Ensure it filters data correctly

**Priority:** 🟢 **MEDIUM** - UX improvement

---

## 🧪 **TESTING SCENARIOS**

### **Test 1: Picker at Adama DC**
```
Login: helen.getachew@siifmart.com (Picker at Adama DC)
Navigate to: Warehouse Operations
Expected: See ONLY jobs at Adama DC
Expected: See ONLY employees at Adama DC
Expected: Cannot see Harar Hub jobs
```

### **Test 2: Dispatcher at Harar Hub**
```
Login: betelhem.bekele@siifmart.com (Dispatcher at Harar Hub)
Navigate to: Warehouse Operations
Expected: See ONLY jobs at Harar Hub
Expected: Can assign tasks to Harar Hub employees ONLY
Expected: Cannot see Adama DC operations
```

### **Test 3: Warehouse Manager at Adama**
```
Login: lensa.merga@siifmart.com (Warehouse Manager at Adama)
Navigate to: Warehouse Operations
Expected: See ONLY Adama DC operations
Expected: Manage ONLY Adama DC staff
Expected: Cannot interfere with Harar Hub
```

### **Test 4: CEO (Multi-Site Access)**
```
Login: shukri.kamal@siifmart.com (CEO)
Navigate to: Warehouse Operations
Expected: Can switch between warehouses
Expected: Can see ALL warehouse operations
Expected: Can manage ALL sites
```

---

## 📊 **IMPACT ANALYSIS**

### **Roles Affected:**

| Role | Impact | Change |
|------|--------|--------|
| Warehouse Manager | 🔴 High | Will only see their warehouse |
| Dispatcher | 🔴 High | Will only see their warehouse |
| Picker | 🔴 High | Will only see their warehouse |
| Driver | 🔴 High | Will only see their warehouse |
| Inventory Specialist | 🔴 High | Will only see their location |
| CEO | ✅ None | Still sees everything |
| Procurement Manager | ✅ None | Still sees all warehouses |
| Auditor | ✅ None | Still sees all locations |

---

## ✅ **RECOMMENDED SOLUTION**

### **Implement Location-Based Access Control (LBAC)**

**Concept:**
```typescript
function canAccessData(user, dataItem) {
  // CEO and multi-site roles see everything
  if (isMultiSiteRole(user.role)) return true;
  
  // Warehouse workers only see their site
  if (isWarehouseWorker(user.role)) {
    return dataItem.siteId === user.siteId;
  }
  
  // Store workers only see their site
  if (isStoreWorker(user.role)) {
    return dataItem.siteId === user.siteId;
  }
  
  return false;
}
```

**Multi-Site Roles:**
- `super_admin` (CEO)
- `procurement_manager`
- `auditor`
- `finance_manager`
- `hr`
- `it_support`
- `cs_manager`

**Single-Site Roles:**
- `warehouse_manager`
- `dispatcher`
- `picker`
- `driver`
- `inventory_specialist`
- `manager` (store)
- `store_supervisor`
- `pos`

---

## 🎯 **NEXT STEPS**

1. ✅ **Approve this analysis**
2. 🔧 **Implement site filtering in WarehouseOperations.tsx**
3. 🔧 **Implement site filtering in Inventory.tsx**
4. 🔧 **Add LBAC utility functions**
5. 🧪 **Test with each warehouse worker role**
6. 📝 **Update documentation**

---

**Status:** ⚠️ **AWAITING APPROVAL TO IMPLEMENT FIXES**

**Estimated Implementation Time:** 30-45 minutes

**Risk Level:** 🔴 **HIGH** - Current system has security and operational issues
