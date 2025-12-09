# Site ID Standardization Proposal

## 🎯 Current State

### Site Structure
```typescript
interface Site {
  id: string;        // Currently: "HQ-001", "SITE-001", "SITE-002", etc.
  code: string;      // Currently: "HQ-001", "001", "002", etc.
  name: string;
  type: SiteType;
  // ... other fields
}
```

### Current Site IDs
| Site Name | Current `id` | Current `code` | Type |
|-----------|-------------|----------------|------|
| Headquarters | `HQ-001` | `HQ-001` | HQ |
| Main Distribution Hub | `SITE-001` | `001` | Warehouse |
| Bole Retail Branch | `SITE-002` | `002` | Store |
| Ambo Retail Store | `SITE-003` | `003` | Store |
| Adama Retail Outlet | `SITE-004` | `004` | Store |
| Jimma Retail Hub | `SITE-005` | `005` | Store |
| Harar Retail Center | `SITE-006` | `006` | Store |
| Dire Dawa Retail Store | `SITE-007` | `007` | Store |

---

## ❌ Problems with Current System

### 1. **Inconsistent Naming**
- HQ uses: `HQ-001`
- Stores/Warehouses use: `SITE-XXX`
- Not uniform across the system

### 2. **Redundant Fields**
- Both `id` and `code` exist
- `code` is cleaner but not used as primary identifier

### 3. **Verbose References**
- `siteId: "SITE-001"` is longer than necessary
- Harder to read in logs and debugging

---

## ✅ Proposed Solution

### Option 1: Use Clean Numeric Codes (RECOMMENDED)

**Standardize all site IDs to simple numeric codes:**

| Site Name | New `id` | Type | Prefix |
|-----------|----------|------|--------|
| Headquarters | `HQ` | HQ | HQ |
| Main Distribution Hub | `WH-001` | Warehouse | WH |
| Bole Retail Branch | `ST-001` | Store | ST |
| Ambo Retail Store | `ST-002` | Store | ST |
| Adama Retail Outlet | `ST-003` | Store | ST |
| Jimma Retail Hub | `ST-004` | Store | ST |
| Harar Retail Center | `ST-005` | Store | ST |
| Dire Dawa Retail Store | `ST-006` | Store | ST |

**Benefits:**
- ✅ Clear type identification (HQ, WH, ST)
- ✅ Sequential numbering within each type
- ✅ Short and clean
- ✅ Easy to remember and communicate

**Example Usage:**
```typescript
product.siteId = "ST-001";  // Bole Retail Branch
employee.siteId = "WH-001"; // Main Distribution Hub
sale.siteId = "HQ";         // Headquarters
```

---

### Option 2: Pure Numeric Codes

**Use only numbers for non-HQ sites:**

| Site Name | New `id` | Type |
|-----------|----------|------|
| Headquarters | `HQ` | HQ |
| Main Distribution Hub | `001` | Warehouse |
| Bole Retail Branch | `002` | Store |
| Ambo Retail Store | `003` | Store |
| Adama Retail Outlet | `004` | Store |
| Jimma Retail Hub | `005` | Store |
| Harar Retail Center | `006` | Store |
| Dire Dawa Retail Store | `007` | Store |

**Benefits:**
- ✅ Extremely short
- ✅ Simple to type
- ✅ Minimal storage

**Drawbacks:**
- ❌ Can't distinguish warehouse from store by ID alone
- ❌ Requires looking up site details to know type

---

### Option 3: Descriptive Short Codes

**Use location-based abbreviations:**

| Site Name | New `id` | Type |
|-----------|----------|------|
| Headquarters | `HQ` | HQ |
| Main Distribution Hub | `WH-MAIN` | Warehouse |
| Bole Retail Branch | `ST-BOLE` | Store |
| Ambo Retail Store | `ST-AMBO` | Store |
| Adama Retail Outlet | `ST-ADAM` | Store |
| Jimma Retail Hub | `ST-JIMM` | Store |
| Harar Retail Center | `ST-HARA` | Store |
| Dire Dawa Retail Store | `ST-DIRE` | Store |

**Benefits:**
- ✅ Self-documenting
- ✅ Easy to identify location
- ✅ Type prefix included

**Drawbacks:**
- ❌ Longer than numeric codes
- ❌ Requires standardized abbreviations

---

## 🔧 Implementation Plan

### Phase 1: Update Site Definitions

**File**: `constants.ts`

```typescript
export const MOCK_SITES: Site[] = [
  // Headquarters
  { 
    id: 'HQ', 
    code: 'HQ', 
    name: 'Headquarters', 
    type: 'HQ', 
    address: 'Addis Ababa, Bole', 
    status: 'Active', 
    manager: 'Shukri Kamal' 
  },
  
  // Warehouses
  { 
    id: 'WH-001', 
    code: 'WH-001', 
    name: 'Main Distribution Hub', 
    type: 'Warehouse', 
    address: 'Addis Ababa, Zone 4', 
    status: 'Active', 
    capacity: 85, 
    manager: 'Lensa Merga' 
  },
  
  // Stores
  { 
    id: 'ST-001', 
    code: 'ST-001', 
    name: 'Bole Retail Branch', 
    type: 'Store', 
    address: 'Bole Road, Addis Ababa', 
    status: 'Active', 
    terminalCount: 4, 
    manager: 'Abdi Rahman' 
  },
  // ... etc
];
```

### Phase 2: Update All References

**Files to Update:**
1. `constants.ts` - MOCK_USERS, MOCK_EMPLOYEES, MOCK_PRODUCTS, etc.
2. Database migration script (if using Supabase)
3. Any hardcoded site ID references

### Phase 3: Database Migration

**SQL Script:**
```sql
-- Update site IDs
UPDATE sites SET id = 'HQ' WHERE id = 'HQ-001';
UPDATE sites SET id = 'WH-001' WHERE id = 'SITE-001';
UPDATE sites SET id = 'ST-001' WHERE id = 'SITE-002';
UPDATE sites SET id = 'ST-002' WHERE id = 'SITE-003';
UPDATE sites SET id = 'ST-003' WHERE id = 'SITE-004';
UPDATE sites SET id = 'ST-004' WHERE id = 'SITE-005';
UPDATE sites SET id = 'ST-005' WHERE id = 'SITE-006';
UPDATE sites SET id = 'ST-006' WHERE id = 'SITE-007';

-- Update all foreign key references
UPDATE products SET site_id = 'HQ' WHERE site_id = 'HQ-001';
UPDATE products SET site_id = 'WH-001' WHERE site_id = 'SITE-001';
UPDATE products SET site_id = 'ST-001' WHERE site_id = 'SITE-002';
-- ... etc for all tables with site_id
```

### Phase 4: Update Code References

**Search and Replace:**
```bash
# Find all occurrences
grep -r "SITE-001" .
grep -r "SITE-002" .
# ... etc

# Replace with new IDs
sed -i 's/SITE-001/WH-001/g' **/*.{ts,tsx}
sed -i 's/SITE-002/ST-001/g' **/*.{ts,tsx}
# ... etc
```

---

## 📊 Impact Analysis

### Files Affected:
- `constants.ts` - Site definitions and mock data
- `types.ts` - No changes needed (interface stays same)
- Database tables - All tables with `site_id` column
- All components using `siteId` - No code changes needed (just data)

### Breaking Changes:
- ⚠️ Existing database data needs migration
- ⚠️ Any hardcoded site IDs in code
- ⚠️ API endpoints that use site IDs in URLs

### Non-Breaking:
- ✅ TypeScript interfaces remain unchanged
- ✅ Component logic remains unchanged
- ✅ Only data values change, not structure

---

## 🎯 Recommendation

**Use Option 1: Type-Prefixed Codes**

**Rationale:**
1. **Clear Type Identification**: `WH-001` vs `ST-001` immediately shows warehouse vs store
2. **Scalable**: Can add more warehouses (WH-002) or stores (ST-007, ST-008, etc.)
3. **Professional**: Industry-standard format
4. **Balanced**: Not too long, not too short
5. **Self-Documenting**: No need to look up what "003" means

**Migration Path:**
1. Create migration script
2. Test on development database
3. Update all mock data in `constants.ts`
4. Run migration on production
5. Verify all functionality

---

## 📝 Next Steps

1. **Approve** the standardization approach
2. **Create** migration script
3. **Test** on development environment
4. **Update** documentation
5. **Deploy** to production

---

## 🔗 Related Files

- `types.ts` - Site interface definition
- `constants.ts` - Mock site data
- `services/supabase.service.ts` - Database queries
- All components using `activeSite` or `siteId`

---

## ✅ Benefits Summary

After standardization:
- ✅ **Cleaner code**: `ST-001` instead of `SITE-002`
- ✅ **Better readability**: Immediately know site type
- ✅ **Easier debugging**: Clear site identification in logs
- ✅ **Professional**: Industry-standard naming
- ✅ **Scalable**: Easy to add new sites
- ✅ **Consistent**: Uniform format across all sites

**Status**: ⏳ **AWAITING APPROVAL**
