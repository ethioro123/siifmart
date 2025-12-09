# SKU Management & Label Printing Workflow

## Overview
SKU generation now follows a controlled workflow to ensure consistency across all operations.

---

## 🔄 Complete Workflow

### **Phase 1: PO Creation**
```
1. Create Purchase Order
2. Add products (may or may not have SKUs)
   ├─ Existing products → Use saved SKU
   ├─ Supplier provides SKU → Use supplier SKU
   └─ No SKU → SKU = null (pending)
```

### **Phase 2: Pre-Receiving Label Print (Optional)**
```
1. Select PO in RECEIVE tab
2. Click "Print Receiving Labels"
3. Labels generated with:
   ├─ Product HAS saved SKU → Print with real SKU
   ├─ PO has supplier SKU → Print with supplier SKU
   └─ No SKU → Print with "TEMP-[ID]"
   
⚠️ TEMP labels are placeholders only!
```

**Example TEMP Label:**
```
┌──────────────┐
│ ▮▮ ▮ ▮▮ ▮    │ ← Barcode of "TEMP-a1b2c3d4"
│ TEMP-a1b2c3  │
└──────────────┘
```

### **Phase 3: Receiving Operation (SKU CREATED HERE)**
```
1. Complete receiving for PO
2. System generates SKU for products without one
   - Uses: generateSKU(productCategory)
   - Example: FD-001, BV-002, EL-003
3. ✅ SKU SAVED to product record in database
4. Receiving interface shows:
   ├─ "✓ SKU: FD-001" (green, confirmed)
   └─ Or "⏳ SKU pending" (yellow, not yet received)
```

### **Phase 4: Post-Receiving Label Print**
```
1. After completing receive
2. Click "Re-print received labels"
3. Labels now show REAL SKUs from database
   - FD-001, BV-002, etc.
4. ✅ These are the permanent SKUs
```

**Example Real Label:**
```
┌──────────────┐
│ ▮▮ ▮ ▮▮ ▮    │ ← Barcode of "FD-001"
│   FD-001     │
└──────────────┘
```

### **Phase 5: Putaway (Backup Print Option)**
```
1. If labels lost/damaged during receiving
2. Go to PUTAWAY tab
3. Find item in putaway queue
4. Click "Re-print Labels" 
5. Uses SAVED SKU from database
   - Ensures consistency
```

---

## 📍 Where to Check Saved SKU

### **1. Receiving Interface**
```tsx
Product Name
✓ SKU: FD-001          ← Green = SKU saved
Expected: 24
```

OR

```tsx
Product Name
⏳ SKU pending          ← Yellow = Not yet received
Expected: 24
```

### **2. Inventory Master List**
- Navigate to: **Inventory → Master List**
- Search for product
- SKU column shows saved SKU

### **3. Product Details**
- Click on any product
- SKU field shows the saved value

---

## 🎯 SKU Sources (Priority Order)

The system checks for SKUs in this order:

```
1. Product.sku (saved in database)
   ↓ If empty/MISC
2. PO LineItem.sku (supplier-provided)
   ↓ If empty/MISC
3. generateSKU(category) during RECEIVE
   ↓
4. TEMP-[ID] for pre-receive labels only
```

---

## ✅ Consistency Rules

| Operation | SKU Source | Saved to DB? |
|-----------|-----------|--------------|
| Pre-receive label print | TEMP or existing | ❌ No |
| Receive operation | Generated | ✅ Yes |
| Post-receive label print | From database | ❌ No (already saved) |
| Putaway label print | From database | ❌ No (already saved) |
| POS scanning | From database | ❌ No (read only) |

---

## 🔍 Verifying SKU is Saved

### **Method 1: Visual Check in Receiving**
```
Before Receive:
├─ Pasta 24-Pack
└─ ⏳ SKU pending (will generate on receive)

After Receive:
├─ Pasta 24-Pack
└─ ✓ SKU: FD-001    ← THIS is the saved SKU
```

### **Method 2: Database Check**
```sql
SELECT id, name, sku, category 
FROM products 
WHERE sku IS NOT NULL AND sku != 'MISC';
```

### **Method 3: Label Verification**
```
1. Print label BEFORE receive → Shows TEMP-xxxxx
2. Complete receive operation
3. Print label AFTER receive → Shows FD-001
4. ✅ FD-001 is the permanent SKU
```

---

## 🖨️ Label Printing Scenarios

### **Scenario 1: Print Before Receiving**
```
Purpose: Prep labels for incoming shipment
Result: TEMP labels (not final)
Use Case: Attach to bins before truck arrives
```

### **Scenario 2: Print After Receiving**
```
Purpose: Permanent product labels
Result: Real SKUs (FD-001, etc.)
Use Case: Final product labeling
```

### **Scenario 3: Re-print from Putaway**
```
Purpose: Replace lost/damaged labels
Result: Real SKUs from database
Use Case: Backup/recovery printing
```

---

## 🚨 Important Notes

### **TEMP Labels are Temporary!**
- ⚠️ TEMP-xxxxx is NOT a real SKU
- ⚠️ Don't use TEMP labels for inventory
- ⚠️ Always re-print after receiving

### **SKU Generation is One-Time**
- ✅ SKU generated ONCE during first receive
- ✅ Same SKU used forever after
- ✅ Never changes unless manually edited

### **Supplier SKUs Take Priority**
- If PO has supplier SKU → Use it
- Avoids generating duplicate SKUs
- Maintains supplier consistency

---

## 🔧 Troubleshooting

### **"Why do my labels show TEMP?"**
→ You printed before completing receive operation.  
→ Solution: Complete receive, then re-print.

### **"SKUs don't match between prints?"**
→ First print was BEFORE receive (TEMP).  
→ Second print was AFTER receive (real SKU).  
→ Solution: Always use post-receive labels.

### **"Where is SKU FD-001 used?"**
→ Check: Inventory → search product → SKU column  
→ Check: Receiving interface (green checkmark)  
→ Check: Putaway queue → item details

### **"Can I change a saved SKU?"**
→ Yes, via Inventory → Edit Product  
→ ⚠️ Warning: Affects ALL inventory of that product

---

## 📊 Best Practices

### **Recommended Flow:**
```
1. Create PO
2. ⏩ Skip pre-receive labels (unnecessary)
3. Receive shipment
4. ✅ SKU auto-generated and saved
5. Print labels AFTER receive
6. Use these permanent labels
```

### **Alternative Flow (If Pre-Labeling Needed):**
```
1. Create PO
2. Print TEMP labels for bin prep
3. Receive shipment
4. ✅ SKU auto-generated and saved
5. Print REAL labels to replace TEMP
6. Discard TEMP labels
```

---

## 🎉 Summary

**The Golden Rule:**
> SKUs are ONLY generated and saved during the RECEIVE operation. Everything else either uses existing SKUs or shows TEMP placeholders.

**How to Know the Real SKU:**
> Look for the green checkmark "✓ SKU: FD-001" in the receiving interface after completing the receive operation.

**When to Print Final Labels:**
> AFTER completing the receive operation, when products have real SKUs in the database.
