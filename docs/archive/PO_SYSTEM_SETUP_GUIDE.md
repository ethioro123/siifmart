# 🚀 PO System - Complete Setup & Fix Guide

## Current Status

✅ **UI is fully implemented** - Multi-store quantity distribution selector is working  
⚠️ **Database needs migration** - `po_number` column type must be fixed  
✅ **Backend logic is complete** - Quantity distribution calculations are ready  

---

## 🔧 REQUIRED: Database Migration

### Step 1: Open Supabase Dashboard

Go to: **https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/sql**

### Step 2: Run the Migration SQL

Click "New query" and paste this SQL:

```sql
-- ============================================================
-- COMPREHENSIVE PO SYSTEM FIX
-- ============================================================

-- 1. Fix po_number column type (VARCHAR(20) → TEXT)
ALTER TABLE purchase_orders 
DROP COLUMN IF EXISTS po_number CASCADE;

ALTER TABLE purchase_orders 
ADD COLUMN po_number TEXT;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number 
ON purchase_orders(po_number);

UPDATE purchase_orders 
SET po_number = 'PO-' || substring(id::text from 1 for 8)
WHERE po_number IS NULL;

-- 2. Add approval columns (optional but recommended)
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS approved_by VARCHAR(200),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_po_approved_at 
ON purchase_orders(approved_at);

-- 3. Ensure all required columns exist
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS created_by VARCHAR(200),
ADD COLUMN IF NOT EXISTS destination TEXT,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS incoterms VARCHAR(50),
ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;

-- 4. Fix any invalid statuses
UPDATE purchase_orders
SET status = 'Pending'
WHERE status IS NULL OR status NOT IN ('Pending', 'Received', 'Cancelled');
```

### Step 3: Click "Run" ▶️

You should see: **Success. No rows returned**

---

## ✅ Verification

After running the migration, verify it worked:

```bash
npx tsx scripts/test_po_functionality.ts
```

**Expected output:**
```
✅ Found 6 sites
✅ Found 5 suppliers
✅ Created PO: PO-TEST-...
✅ Added 2 line items
✅ Created PO for Adama Distribution Center
✅ Created PO for Harar Logistics Hub
✅ Created shared PO for Adama Distribution Center (10 items)
✅ Created shared PO for Harar Logistics Hub (10 items)
✅ Retrieved X POs
✅ Approved PO: PO-TEST-...
✅ ALL TESTS PASSED!
```

---

## 🎨 UI Features (Already Implemented)

### 1. Multi-Site Selection
- **Enable Multi-Site** button
- Grouped site selection (Warehouses vs Stores)
- **Select All** and **Clear All** buttons
- Visual selection summary with badges

### 2. Quantity Distribution Selector
Appears when:
- Multi-site mode is enabled
- 2+ sites are selected
- At least 1 item is added to the PO

**Two modes:**

#### 📦 Full Quantity per Store (Recommended)
- Each site gets the complete order
- Example: 20 units × 3 sites = 60 total units
- Best for: Regular inventory replenishment

#### 🔀 Split Quantities Across Stores
- Quantities divided equally among sites
- Example: 20 units ÷ 3 sites ≈ 7 units per site
- Best for: Distributing limited stock

### 3. Real-Time Calculations
- Shows exact quantities per site
- Updates dynamically as you change selection
- Clear visual examples with actual numbers

### 4. Visual Feedback
- Color-coded distribution mode
- "Recommended" badge on default option
- Selection summary showing site count
- Site badges showing selected locations

---

## 🧪 Testing the Feature

### Test 1: Single Site PO
1. Go to **http://localhost:3000/#/procurement**
2. Click "Create Purchase Order"
3. Select a single site
4. Add items (e.g., 20 apples)
5. Create PO
6. ✅ **Expected:** 1 PO created with 20 apples

### Test 2: Multi-Site (Full Quantity)
1. Click "Create Purchase Order"
2. Click "Enable Multi-Site"
3. Select 3 stores
4. Add items (e.g., 20 apples)
5. Keep "Full Quantity per Store" selected
6. Create PO
7. ✅ **Expected:** 3 POs created, each with 20 apples (60 total)

### Test 3: Multi-Site (Shared Quantity)
1. Click "Create Purchase Order"
2. Click "Enable Multi-Site"
3. Select 3 stores
4. Add items (e.g., 20 apples)
5. Select "Split Quantities Across Stores"
6. Create PO
7. ✅ **Expected:** 3 POs created, each with ~7 apples (21 total due to rounding)

### Test 4: Approval Workflow
1. Find a Draft PO in the list
2. Click "View" to open details
3. Click "✓ Approve PO" (super_admin or admin only)
4. ✅ **Expected:** Status changes to "Approved", shows approver name

---

## 📊 How It Works Internally

### Per-Store Mode
```typescript
// Each site gets full quantity
for (const siteId of destinationSiteIds) {
    createPO({
        siteId,
        lineItems: newPOItems, // Full quantities
        totalAmount: calculatedTotal
    });
}
```

### Shared Mode
```typescript
// Quantities are divided
const qtyPerSite = Math.ceil(item.quantity / numberOfSites);

for (const siteId of destinationSiteIds) {
    createPO({
        siteId,
        lineItems: adjustedItems, // Divided quantities
        totalAmount: recalculatedTotal
    });
}
```

### Cost Recalculation
- Item totals: `quantity × unitCost`
- Tax: `itemTotal × taxRate`
- Discount: `itemTotal × discountRate`
- Final: `itemTotal + tax + shipping - discount`

---

## 🐛 Troubleshooting

### Issue: "value too long for type character varying(20)"
**Solution:** Run the migration SQL above to fix `po_number` column type

### Issue: POs not appearing in list
**Solution:** Check site filtering - non-super_admin users only see their site's POs

### Issue: Approve button not visible
**Solution:** Only super_admin and admin roles can approve POs

### Issue: Quantities not splitting correctly
**Solution:** Ensure you have items added before selecting distribution mode

---

## 📁 Files Modified

| File | Changes |
|------|---------|
| `pages/Procurement.tsx` | Added quantity distribution UI and logic |
| `services/supabase.service.ts` | Removed non-existent column references |
| `migrations/fix_po_system_complete.sql` | Comprehensive database fix |
| `scripts/test_po_functionality.ts` | Full test suite |

---

## ✨ What's New

1. ✅ **Multi-store PO creation** with quantity distribution
2. ✅ **Smart quantity splitting** with automatic rounding
3. ✅ **Cost recalculation** based on distribution mode
4. ✅ **Visual feedback** showing exact quantities per site
5. ✅ **Grouped site selection** (Warehouses vs Stores)
6. ✅ **Approval tracking** in notes field (or dedicated columns if migrated)
7. ✅ **Site-based filtering** (users see only their site's POs)
8. ✅ **Comprehensive testing** with automated test script

---

## 🎯 Next Steps

1. **Run the migration SQL** (required)
2. **Test the feature** using the test cases above
3. **Create your first multi-site PO** in the UI
4. **Verify approval workflow** works correctly

---

## 🆘 Need Help?

If you encounter any issues:

1. Check the browser console for errors
2. Check the terminal running `npm run dev` for backend errors
3. Verify the migration was run successfully
4. Run the test script to validate database state

---

**Status:** ✅ Ready to use after migration!
