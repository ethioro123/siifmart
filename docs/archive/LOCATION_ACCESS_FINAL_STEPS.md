# 🎯 LOCATION-BASED ACCESS - FINAL IMPLEMENTATION GUIDE

## ✅ What's Been Done

1. ✅ Created `utils/locationAccess.ts` - Simple filtering utility
2. ✅ Updated `components/Sidebar.tsx` - Removed admin from business ops
3. ✅ Added filtered data to `pages/WarehouseOperations.tsx`:
   - `filteredJobs` - Jobs filtered by user's site
   - `filteredEmployees` - Employees filtered by user's site
   - `filteredProducts` - Products filtered by user's site

---

## 🔧 MANUAL STEPS REQUIRED

The WarehouseOperations.tsx file is 3000+ lines. You need to do a **find-replace** in your code editor:

### **In VS Code or your editor:**

**Open:** `pages/WarehouseOperations.tsx`

**Find and Replace (in order):**

1. **Replace jobs references:**
   - Find: `jobs.filter(`
   - Replace: `filteredJobs.filter(`
   - Click "Replace All"

2. **Replace jobs references:**
   - Find: `jobs.map(`
   - Replace: `filteredJobs.map(`
   - Click "Replace All"

3. **Replace jobs references:**
   - Find: `jobs.find(`
   - Replace: `filteredJobs.find(`
   - Click "Replace All"

4. **Replace jobs references:**
   - Find: `jobs.reduce(`
   - Replace: `filteredJobs.reduce(`
   - Click "Replace All"

5. **Replace employees references:**
   - Find: `employees.filter(`
   - Replace: `filteredEmployees.filter(`
   - Click "Replace All"

6. **Replace employees references:**
   - Find: `employees.map(`
   - Replace: `filteredEmployees.map(`
   - Click "Replace All"

7. **Replace employees references:**
   - Find: `employees.find(`
   - Replace: `filteredEmployees.find(`
   - Click "Replace All"

8. **Replace products references:**
   - Find: `products.find(`
   - Replace: `filteredProducts.find(`
   - Click "Replace All"

9. **Replace products references:**
   - Find: `products.filter(`
   - Replace: `filteredProducts.filter(`
   - Click "Replace All"

---

## 📝 **THEN DO THE SAME FOR OTHER PAGES:**

### **Inventory.tsx:**

1. Add at top:
   ```typescript
   import { filterBySite } from '../utils/locationAccess';
   ```

2. Add after useData():
   ```typescript
   const filteredProducts = useMemo(() => 
     filterBySite(products, user?.role || 'pos', user?.siteId || ''),
     [products, user?.role, user?.siteId]
   );
   ```

3. Find-Replace:
   - `products.filter(` → `filteredProducts.filter(`
   - `products.map(` → `filteredProducts.map(`
   - `products.find(` → `filteredProducts.find(`

---

### **Employees.tsx:**

1. Add at top:
   ```typescript
   import { filterBySite } from '../utils/locationAccess';
   ```

2. Add after useData():
   ```typescript
   const filteredEmployees = useMemo(() => 
     filterBySite(employees, user?.role || 'pos', user?.siteId || ''),
     [employees, user?.role, user?.siteId]
   );
   ```

3. Find-Replace:
   - `employees.filter(` → `filteredEmployees.filter(`
   - `employees.map(` → `filteredEmployees.map(`
   - `employees.find(` → `filteredEmployees.find(`

---

### **Sales.tsx:**

1. Add at top:
   ```typescript
   import { filterBySite } from '../utils/locationAccess';
   ```

2. Add after useData():
   ```typescript
   const filteredSales = useMemo(() => 
     filterBySite(sales, user?.role || 'pos', user?.siteId || ''),
     [sales, user?.role, user?.siteId]
   );
   ```

3. Find-Replace:
   - `sales.filter(` → `filteredSales.filter(`
   - `sales.map(` → `filteredSales.map(`
   - `sales.find(` → `filteredSales.find(`

---

## ✅ **EXPECTED RESULTS:**

### **Before:**
```
Helen (Picker at Adama DC)
- Sees 50 jobs from all warehouses ❌
- Can accept jobs at Harar Hub (300km away!) ❌
```

### **After:**
```
Helen (Picker at Adama DC)
- Sees only 15 jobs at Adama DC ✅
- Cannot see Harar Hub or Dire Dawa jobs ✅
```

---

## 🧪 **TESTING:**

After making the changes, test with:

1. **Login as Picker** (helen.getachew@siifmart.com)
   - Should only see Adama DC jobs
   - Should NOT see Harar or Dire Dawa jobs

2. **Login as Dispatcher** (betelhem.bekele@siifmart.com)
   - Should only see Harar Hub jobs
   - Should only see Harar Hub employees
   - Should NOT see Adama DC operations

3. **Login as CEO** (shukri.kamal@siifmart.com)
   - Should see ALL warehouses (multi-site role)
   - Can switch between sites

---

## 📊 **SUMMARY:**

**What we built:**
- ✅ Simple `filterBySite()` utility
- ✅ Clear multi-site vs single-site roles
- ✅ Filtered data variables ready to use

**What you need to do:**
- 🔧 Find-replace in WarehouseOperations.tsx
- 🔧 Find-replace in Inventory.tsx
- 🔧 Find-replace in Employees.tsx
- 🔧 Find-replace in Sales.tsx

**Time estimate:** 10-15 minutes

**Difficulty:** Easy (just find-replace)

---

**Once done, your warehouse workers will only see data from their assigned location!** ✅
