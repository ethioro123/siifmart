# Site ID Quick Reference Guide

## 🏢 All Site IDs

| Site ID | Site Name | Type | Location | Manager |
|---------|-----------|------|----------|---------|
| **HQ** | Headquarters | HQ | Addis Ababa, Bole | Shukri Kamal |
| **WH-001** | Main Distribution Hub | Warehouse | Addis Ababa, Zone 4 | Lensa Merga |
| **ST-001** | Bole Retail Branch | Store | Bole Road, Addis Ababa | Abdi Rahman |
| **ST-002** | Ambo Retail Store | Store | Ambo, West Shewa | Sara Mohammed |
| **ST-003** | Adama Retail Outlet | Store | Adama, East Shewa | Hanna Girma |
| **ST-004** | Jimma Retail Hub | Store | Jimma, Oromia | Ahmed Hassan |
| **ST-005** | Harar Retail Center | Store | Harar, Harari | Solomon Tesfaye |
| **ST-006** | Dire Dawa Retail Store | Store | Dire Dawa | Fatima Yusuf |

---

## 🎯 Site ID Format

### Headquarters
- **Format**: `HQ`
- **Example**: `HQ`
- **Usage**: Corporate headquarters, administrative functions

### Warehouses
- **Format**: `WH-XXX`
- **Example**: `WH-001`, `WH-002`
- **Usage**: Distribution centers, main warehouses
- **Numbering**: Sequential (001, 002, 003, ...)

### Stores
- **Format**: `ST-XXX`
- **Example**: `ST-001`, `ST-002`
- **Usage**: Retail stores, dark stores
- **Numbering**: Sequential (001, 002, 003, ...)

---

## 💻 Code Usage

### TypeScript/JavaScript
```typescript
// Assigning site to a product
product.siteId = "ST-001";  // Bole Retail Branch

// Assigning site to an employee
employee.siteId = "WH-001"; // Main Distribution Hub

// Filtering by site
const boleProducts = products.filter(p => p.siteId === "ST-001");
const warehouseJobs = jobs.filter(j => j.siteId === "WH-001");
```

### Database Queries
```sql
-- Get all products at Bole store
SELECT * FROM products WHERE site_id = 'ST-001';

-- Get all employees at warehouse
SELECT * FROM employees WHERE site_id = 'WH-001';

-- Get sales at HQ
SELECT * FROM sales WHERE site_id = 'HQ';
```

---

## 🔍 Quick Lookup

### By Type
**HQ Sites:**
- `HQ` - Headquarters

**Warehouse Sites:**
- `WH-001` - Main Distribution Hub

**Store Sites:**
- `ST-001` - Bole Retail Branch
- `ST-002` - Ambo Retail Store
- `ST-003` - Adama Retail Outlet
- `ST-004` - Jimma Retail Hub
- `ST-005` - Harar Retail Center
- `ST-006` - Dire Dawa Retail Store

### By Location
**Addis Ababa:**
- `HQ` - Headquarters (Bole)
- `WH-001` - Main Distribution Hub (Zone 4)
- `ST-001` - Bole Retail Branch (Bole Road)

**Other Cities:**
- `ST-002` - Ambo
- `ST-003` - Adama
- `ST-004` - Jimma
- `ST-005` - Harar
- `ST-006` - Dire Dawa

---

## 📊 Site Statistics

| Type | Count | IDs |
|------|-------|-----|
| Headquarters | 1 | HQ |
| Warehouses | 1 | WH-001 |
| Stores | 6 | ST-001 to ST-006 |
| **Total** | **8** | |

---

## 🆕 Adding New Sites

### New Warehouse
```typescript
{
  id: 'WH-002',
  code: 'WH-002',
  name: 'Secondary Distribution Center',
  type: 'Warehouse',
  // ... other fields
}
```

### New Store
```typescript
{
  id: 'ST-007',
  code: 'ST-007',
  name: 'New City Retail Store',
  type: 'Store',
  // ... other fields
}
```

---

## 🔄 Migration Reference

### Old → New Mapping
```
HQ-001    → HQ
SITE-001  → WH-001
SITE-002  → ST-001
SITE-003  → ST-002
SITE-004  → ST-003
SITE-005  → ST-004
SITE-006  → ST-005
SITE-007  → ST-006
```

---

## 📝 Common Patterns

### Check if site is HQ
```typescript
if (siteId === 'HQ') {
  // HQ-specific logic
}
```

### Check if site is warehouse
```typescript
if (siteId.startsWith('WH-')) {
  // Warehouse-specific logic
}
```

### Check if site is store
```typescript
if (siteId.startsWith('ST-')) {
  // Store-specific logic
}
```

### Get site type from ID
```typescript
function getSiteType(siteId: string): 'HQ' | 'Warehouse' | 'Store' {
  if (siteId === 'HQ') return 'HQ';
  if (siteId.startsWith('WH-')) return 'Warehouse';
  if (siteId.startsWith('ST-')) return 'Store';
  throw new Error('Unknown site ID format');
}
```

---

## 🎨 Display Formatting

### Short Format
```typescript
// Display: "ST-001"
<span>{product.siteId}</span>
```

### Long Format
```typescript
// Display: "ST-001 (Bole Retail Branch)"
const site = sites.find(s => s.id === product.siteId);
<span>{product.siteId} ({site.name})</span>
```

### With Icon
```typescript
// Display with appropriate icon
const icon = siteId === 'HQ' ? '🏢' : 
              siteId.startsWith('WH-') ? '🏭' : 
              '🏪';
<span>{icon} {siteId}</span>
```

---

## ✅ Validation

### Valid Site ID Format
```typescript
function isValidSiteId(siteId: string): boolean {
  return siteId === 'HQ' || 
         /^WH-\d{3}$/.test(siteId) || 
         /^ST-\d{3}$/.test(siteId);
}

// Examples:
isValidSiteId('HQ');      // true
isValidSiteId('WH-001');  // true
isValidSiteId('ST-001');  // true
isValidSiteId('SITE-001'); // false (old format)
isValidSiteId('ST-1');    // false (not padded)
```

---

## 🔗 Related Documentation

- [Site ID Standardization Proposal](./SITE_ID_STANDARDIZATION_PROPOSAL.md)
- [Implementation Complete](./SITE_ID_STANDARDIZATION_COMPLETE.md)
- [Database Migration Script](../migrations/site_id_standardization.sql)

---

**Last Updated**: 2025-12-03  
**Version**: 1.0  
**Status**: ✅ Active
