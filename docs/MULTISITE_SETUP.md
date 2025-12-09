# Multi-Site Inventory Setup

## Issue
The database currently has a UNIQUE constraint on the `sku` column in the `products` table. This prevents the same product (same SKU) from existing at multiple warehouses.

## Current Situation
- ✅ 6 sites in the system (warehouses and stores)
- ❌ All 31 products are only at "Adama Distribution Center"
- ❌ Other warehouses have no products
- ❌ Can't create products for other warehouses due to SKU constraint

## Solution
Remove the global UNIQUE constraint on SKU and replace it with a composite constraint on (sku, site_id).

## Manual Steps

### Step 1: Run SQL Migration in Supabase

1. Go to **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Create a new query
4. Paste and run this SQL:

```sql
-- Remove UNIQUE constraint on SKU
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_sku_key;

-- Add composite UNIQUE constraint on (sku, site_id)
ALTER TABLE products
ADD CONSTRAINT products_sku_site_unique UNIQUE (sku, site_id);
```

5. Click **Run**

### Step 2: Create Products for Each Warehouse

After the SQL migration succeeds, run:

```bash
npx tsx scripts/setup_multisite_products.ts
```

This will:
- Find all products at the first warehouse
- Create copies for each other warehouse
- Set stock to 0 (will be updated when receiving POs)

## Expected Result

### Before:
```
RICE-001 → Adama Distribution Center (1000 units)
```

### After:
```
RICE-001 → Adama Distribution Center (1000 units)
RICE-001 → Harar Logistics Hub (0 units)
RICE-001 → Dire Dawa Storage (0 units)
```

## How It Works

### Database Design:
- **Old:** `UNIQUE(sku)` - One SKU globally
- **New:** `UNIQUE(sku, site_id)` - One SKU per site

### Application Behavior:
1. **Site Selection:** User selects "Harar Logistics Hub"
2. **Data Loading:** `productsService.getAll(siteId)` loads only Harar's products
3. **Receiving:** When receiving PO at Harar, stock updates for Harar only
4. **Transfers:** Can move stock from Adama to Harar

## Verification

After setup, run:
```bash
npx tsx scripts/check_product_distribution.ts
```

You should see:
```
RICE-001 (Premium Rice 25kg): 3 site(s)
  - Adama Distribution Center      Stock: 1000
  - Harar Logistics Hub            Stock: 0
  - Dire Dawa Storage Facility     Stock: 0
```

## Benefits

✅ **Independent Inventory** - Each warehouse has its own stock levels
✅ **Transfers** - Move stock between warehouses
✅ **Site-Specific Receiving** - Receiving at Harar only updates Harar's stock
✅ **Realistic Multi-Warehouse** - Matches real-world warehouse operations

## Troubleshooting

### If SQL fails with "constraint does not exist"
The old constraint might have a different name. Find it with:
```sql
SELECT conname 
FROM pg_constraint 
WHERE conrelid = 'products'::regclass 
AND contype = 'u';
```

Then drop it:
```sql
ALTER TABLE products DROP CONSTRAINT <constraint_name>;
```

### If products still fail to create
Check for other constraints:
```sql
\d products
```

Look for any UNIQUE constraints on the sku column.
