# SKU Generation System Documentation

## Overview
The SIIFMART system now uses a modern, efficient SKU generation utility that creates unique product codes automatically while allowing manual SKU entry for items from suppliers.

## SKU Format
**Format:** `[CATEGORY_PREFIX]-[SEQUENTIAL_NUMBER]`

**Examples:**
- `EL-001` - Electronics item #1
- `BV-042` - Beverages item #42  
- `FD-156` - Food item #156

## Category Prefixes

| Category | Prefix | Example |
|----------|--------|---------|
| Electronics | EL | EL-001 |
| Beverages | BV | BV-001 |
| Food | FD | FD-001 |
| Fresh | FR | FR-001 |
| Accessories | AC | AC-001 |
| Clothing | CL | CL-001 |
| Health | HL | HL-001 |
| Beauty | BT | BT-001 |
| Home | HM | HM-001 |
| Sports | SP | SP-001 |
| Toys | TY | TY-001 |
| Books | BK | BK-001 |
| Stationery | ST | ST-001 |
| Furniture | FN | FN-001 |
| Garden | GD | GD-001 |
| Automotive | AU | AU-001 |
| Pet | PT | PT-001 |
| Baby | BB | BB-001 |
| Tools | TL | TL-001 |
| General | GN | GN-001 |
| Other | OT | OT-001 |

## How It Works

### 1. **Receiving Flow (Purchase Orders)**

When receiving items from a PO, the system:

1. **Checks for existing SKU** on the product
   - If found → Registers it to prevent duplicates
   
2. **Checks PO item for supplier SKU**
   - If provided → Uses and registers supplier's SKU
   
3. **Generates new SKU** if none exists
   - Uses product category to determine prefix
   - Auto-increments sequence number
   - Example: "Electronics" → `EL-001`, `EL-002`, etc.

**Console Output:**
```
✅ Registered existing SKU: EL-099 for product: Cyber Chipset v2
✅ Using PO item SKU: BV-SUPP-001 for product: Energy Drink
🆕 Generated new SKU: FD-042 for product: Quantum Cereal (Category: Food)
```

### 2. **Putaway Flow**

When putting away items, if a product doesn't exist:

1. **Checks job item for SKU**
   - If provided and valid → Uses it
   
2. **Generates new SKU** for the product category
3. **Creates product** with the generated SKU in inventory

**Console Output:**
```
🆕 Product ID is null. Auto-creating product: Smart Sensor
✅ Created product with SKU: EL-015, ID: abc-123-def
```

### 3. **Fulfillment Flow (Sales)**

When creating fulfillment jobs (PICK/PACK):
- Uses existing product SKU
- SKUs are already assigned during product creation
- No new products or SKUs are created during fulfillment

## Technical Implementation

### Files Modified

1. **`/utils/skuGenerator.ts`** (NEW)
   - Core SKU generation logic
   - Sequential counter management (localStorage)
   - Validation and registration functions

2. **`/contexts/DataContext.tsx`**
   - `receivePO()` function enhanced with SKU generation
   - Registers existing SKUs to prevent conflicts
   - Generates SKUs for products without them

3. **`/pages/WarehouseOperations.tsx`**
   - `handleItemScan()` updated for Putaway
   - Uses modern SKU generation instead of timestamps
   - Better logging for tracking

### Key Functions

```typescript
// Generate a new SKU
generateSKU(category: string, existingSku?: string): string

// Validate SKU format
isValidSKU(sku: string): boolean

// Register existing SKU (prevents duplicates)
registerExistingSKU(sku: string): void

// Extract category from SKU
extractCategoryFromSKU(sku: string): string | null
```

## Benefits

### ✅ **Consistency**
- All SKUs follow the same `XX-XXX` format
- Easy to read and identify product categories

### ✅ **Flexibility**  
- Accepts supplier SKUs when provided
- Auto-generates when needed
- No manual entry required

### ✅ **Scalability**
- Supports 999+ products per category
- Easy to extend with new categories
- Counters managed automatically

### ✅ **Efficiency**
- Sequential numbering (no gaps)
- Prevents duplicate SKUs
- Fast lookup by category prefix

### ✅ **Modern**
- Uses localStorage for persistence
- Functional programming approach
- TypeScript typed
- Well-documented code

## Examples

### Scenario 1: Receiving Catalog Product
**Input:** Product "Laptop" from catalog (already has SKU: `EL-050`)  
**Output:** Uses existing `EL-050`, registers it to prevent reuse

### Scenario 2: Receiving New Supplier Item
**Input:** New product "Premium Coffee" from supplier (supplier SKU: `BV-COFFEE-01`)  
**Output:** Uses supplier SKU `BV-COFFEE-01`, registers it

### Scenario 3: Receiving Custom Item (No SKU)
**Input:** Custom product "Office Chair" (category: Furniture, no SKU)  
**Output:** Generates `FN-001` (or next available Furniture SKU)

### Scenario 4: Putaway Unknown Item
**Input:** Putaway item with no product ID  
**Output:** Creates product with generated SKU (e.g., `GN-042`)

## Maintenance

### Viewing Current Counters
```typescript
import { getSKUCounters } from './utils/skuGenerator';
console.log(getSKUCounters()); 
// { EL: 50, BV: 120, FD: 89, ... }
```

### Resetting Counters (Use with caution!)
```typescript
import { resetSKUCounters } from './utils/skuGenerator';
resetSKUCounters(); // Clears all counters
```

## Future Enhancements

1. **Category Detection**
   - Auto-detect category from product name using AI/ML
   - Suggest correct category prefix

2. **Barcode Integration**
   - Generate matching barcodes (EAN-13/UPC)
   - Link SKU to barcode system

3. **Database Sync**
   - Move counter storage from localStorage to Supabase
   - Multi-user counter synchronization

4. **Custom Prefixes**
   - Allow admins to define custom category prefixes
   - Store mappings in database

5. **Batch Operations**
   - Bulk SKU generation for imports
   - Excel/CSV with auto-SKU assignment

## Support

For questions or issues with SKU generation:
1. Check console logs for detailed generation info
2. Verify category mappings in `utils/skuGenerator.ts`
3. Ensure localStorage is enabled
4. Review this documentation

---
**Last Updated:** 2025-12-06  
**Version:** 1.0
