# Site ID Analysis & Resolution Plan

**Analysis Date:** 2025-12-04  
**Issue:** WH-001 Site Visibility & Site ID Mismatch

---

## 🔍 Root Cause Identified

### **CRITICAL ISSUE: Site ID Type Mismatch**

The application has a **fundamental inconsistency** between how site IDs are defined in code vs. how they're stored in the database:

#### **In Database (Supabase):**
- Sites use **UUID primary keys** (e.g., `b6264903-a17c-4734-8c82-3d5f306c5598`)
- All relations (products, employees, POs) use these **UUIDs** for `site_id`
- The `code` column exists but may be NULL

#### **In Code (constants.ts):**
- Demo data uses **string codes** like `'WH-001'`, `'ST-003'` as site IDs
- All demo products, employees, and POs reference these **string codes**
- No UUID values present

---

## 📊 Database Analysis Results

### Sites in Database:

| Site Name | UUID (id) | Type | Code |
|-----------|-----------|------|------|
| SIIFMART HQ | `7a01d674-6725-4c07-96a9-85474640d694` | Headquarters | HQ |
| Main Distribution Hub | `b6264903-a17c-4734-8c82-3d5f306c5598` | Warehouse | WH-001 |
| Adama Distribution Center | `97452359-705d-44dd-b2de-1002d6c19a81` | Warehouse | ST-003 |
| Harar Distribution Center | `9f5c2250-9366-4122-83b3-f42147395043` | Warehouse | WH-02 |

### Employee Assignments:

| Employee | Assigned Site ID (UUID) | Actual Site Name |
|----------|------------------------|------------------|
| Lensa Merga | `97452359-705d-44dd-b2de-1002d6c19a81` | **Adama Distribution Center** |
| (Expected) | `b6264903-a17c-4734-8c82-3d5f306c5598` | Main Distribution Hub (WH-001) |

**❌ MISMATCH:** Lensa Merga is assigned to **Adama** (ST-003), NOT **Main Distribution Hub** (WH-001)!

### Products in Database:
- All products use **UUID site_id** values
- Products correctly link to sites via UUIDs
- No products use string codes like 'WH-001'

### Purchase Orders in Database:
- All POs use **UUID site_id** values
- POs correctly link to sites via UUIDs
- No POs use string codes

---

## 🐛 Why WH-001 is Invisible

### Issue #1: Site ID Type Confusion
The application loads sites from the database (with UUIDs), but demo data and some code logic expects string codes like 'WH-001'. When the app tries to match:
- `activeSiteId = 'WH-001'` (string from constants)
- `sites[].id = 'b6264903-...'` (UUID from database)

**Result:** No match found → WH-001 appears "invisible"

### Issue #2: Incorrect Employee Assignment
Lensa Merga's `siteId` in the database is set to Adama's UUID, not Main Distribution Hub's UUID. This is why:
- She sees "Adama Distribution Center" in the UI
- She cannot access WH-001 inventory
- PUTAWAY jobs for WH-001 are not visible to her

### Issue #3: Code Generation Logic
The `sitesService.getAll()` function tries to generate a `code` field from the site name if `code` is NULL:
```typescript
code: s.code || (
    s.name.includes('HQ') ? 'HQ' :
    s.name.includes('Adama') ? 'WH-01' :  // ❌ Should be ST-03
    s.name.includes('Harar') ? 'WH-02' :
    // ...
)
```

This logic is **inconsistent** with the actual codes in the database and constants.ts.

---

## ✅ Resolution Plan

### Step 1: Fix Employee Site Assignments
**Update Lensa Merga's site_id to Main Distribution Hub:**

```sql
UPDATE employees 
SET site_id = 'b6264903-a17c-4734-8c82-3d5f306c5598'
WHERE email = 'lensa.merga@siifmart.com';
```

### Step 2: Ensure All Sites Have Correct Codes
**Update sites table to have consistent codes:**

```sql
UPDATE sites SET code = 'HQ' WHERE id = '7a01d674-6725-4c07-96a9-85474640d694';
UPDATE sites SET code = 'WH-001' WHERE id = 'b6264903-a17c-4734-8c82-3d5f306c5598';
UPDATE sites SET code = 'ST-003' WHERE id = '97452359-705d-44dd-b2de-1002d6c19a81';
UPDATE sites SET code = 'WH-02' WHERE id = '9f5c2250-9366-4122-83b3-f42147395043';
```

### Step 3: Fix Code Generation Logic
**Update `supabase.service.ts` to use database codes:**

```typescript
// Remove the fallback code generation logic
// Trust the database code column instead
return data.map((s: any) => ({
    ...s,
    terminalCount: s.terminal_count,
    code: s.code // Use database value directly
}));
```

### Step 4: Verify Site Context Loading
**Ensure `DataContext.tsx` uses UUIDs consistently:**

- `activeSiteId` should always be a UUID
- Site switcher should use UUIDs for selection
- All site filtering should use UUIDs

### Step 5: Update Demo Data (Optional)
**If demo mode is still used, update constants.ts to use UUIDs:**

```typescript
// Replace string codes with actual UUIDs from database
{ id: 'b6264903-a17c-4734-8c82-3d5f306c5598', code: 'WH-001', name: 'Main Distribution Hub', ... }
```

---

## 🎯 Expected Outcomes

After implementing these fixes:

1. ✅ **Lensa Merga** will see "Main Distribution Hub" as her active site
2. ✅ **WH-001** will appear in site switcher dropdowns
3. ✅ **Products** at WH-001 will be visible in Inventory Master List
4. ✅ **PUTAWAY jobs** for WH-001 will be accessible to Lensa
5. ✅ **Purchase Orders** will correctly route to their assigned sites
6. ✅ **Site filtering** will work consistently across all modules

---

## 📝 Testing Checklist

After fixes are applied:

- [ ] Login as Lensa Merga
- [ ] Verify top bar shows "Main Distribution Hub"
- [ ] Navigate to Inventory > Master List
- [ ] Search for product FD-102-W
- [ ] Verify product shows with location A-01-01
- [ ] Check stock level (should have increased from PUTAWAY)
- [ ] Navigate to Warehouse Operations > PUTAWAY
- [ ] Verify pending jobs are visible
- [ ] Login as Super Admin
- [ ] Verify all sites appear in site switcher
- [ ] Switch to WH-001
- [ ] Verify inventory loads correctly
- [ ] Create a new PO for WH-001
- [ ] Verify PO appears in WH-001 context

---

## 🔧 Implementation Priority

**HIGH PRIORITY:**
1. Fix Lensa Merga's site assignment (SQL update)
2. Ensure all sites have correct codes in database
3. Remove fallback code generation logic

**MEDIUM PRIORITY:**
4. Verify site context loading uses UUIDs
5. Test all site-related functionality

**LOW PRIORITY:**
6. Update demo data in constants.ts (if still used)

---

## 💡 Long-Term Recommendation

**Standardize on UUIDs:**
- Use UUIDs as the **primary identifier** for all site references
- Use `code` field **only for display purposes** (e.g., "WH-001" badge)
- Never use `code` for data relationships or filtering
- Ensure all foreign keys use UUID `id` values

This will prevent future confusion and ensure data integrity across the application.
