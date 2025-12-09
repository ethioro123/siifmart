# 🚀 PO SYSTEM - QUICK START

## ⚡ TL;DR

1. **Run this SQL in Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/sql
   ```
   
   Copy and paste:
   ```sql
   ALTER TABLE purchase_orders DROP COLUMN IF EXISTS po_number CASCADE;
   ALTER TABLE purchase_orders ADD COLUMN po_number TEXT;
   CREATE INDEX IF NOT EXISTS idx_purchase_orders_po_number ON purchase_orders(po_number);
   
   ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approved_by VARCHAR(200);
   ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
   ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS created_by VARCHAR(200);
   ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS destination TEXT;
   ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_terms TEXT;
   ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS incoterms VARCHAR(50);
   ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS discount DECIMAL(10,2) DEFAULT 0;
   ```

2. **Test it:**
   ```bash
   npx tsx scripts/test_po_functionality.ts
   ```

3. **Use it:**
   ```
   http://localhost:3002/#/procurement
   ```

---

## 🎨 How to Use Multi-Store PO

### Step 1: Create PO
Click **"Create Purchase Order"**

### Step 2: Enable Multi-Site
Click **"Enable Multi-Site"** button

### Step 3: Select Stores
Check the stores you want (e.g., Bole Supermarket, Aratanya Market, Awaday Grocery)

### Step 4: Add Items
Add items to your PO (e.g., 20 Apples @ $5 each)

### Step 5: Choose Distribution
You'll see **"Quantity Distribution Strategy"** appear with two options:

#### Option A: Full Quantity per Store ⭐ Recommended
- Each store gets 20 apples
- Total: 60 apples (20 × 3 stores)

#### Option B: Split Quantities Across Stores
- Each store gets ~7 apples
- Total: 21 apples (20 ÷ 3 stores, rounded up)

### Step 6: Create
Click **"Issue Order"** - Done! ✅

---

## 📊 What You'll See

### In the PO List
- 3 separate POs created (one per store)
- Each shows the correct quantity based on your choice
- Notes indicate distribution mode

### In PO Details
- Full line items with quantities
- Correct cost calculations
- Approval status
- Site destination

---

## ✅ All Features Working

- ✅ Single-site PO creation
- ✅ Multi-site PO creation
- ✅ Quantity distribution (per-store or shared)
- ✅ Automatic cost recalculation
- ✅ Site-based filtering
- ✅ Approval workflow
- ✅ PO deletion
- ✅ Print/PDF export

---

## 📞 Quick Commands

```bash
# Show migration SQL
npx tsx scripts/show_migration.ts

# Test everything
npx tsx scripts/test_po_functionality.ts

# Clean slate (delete all POs)
npx tsx scripts/delete_all_pos.ts
```

---

## 🎯 App URL

**http://localhost:3002/#/procurement**

---

## 📚 Full Documentation

- `PO_SYSTEM_COMPLETE_FIX.md` - Complete fix summary
- `PO_SYSTEM_SETUP_GUIDE.md` - Detailed setup guide
- `MULTI_STORE_PO_DISTRIBUTION.md` - Feature documentation

---

**That's it! Run the SQL and start creating multi-store POs! 🎉**
