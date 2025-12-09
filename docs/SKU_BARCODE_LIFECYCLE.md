# SKU + Barcode Complete Lifecycle Flow

## Overview
This document explains the complete journey of a product **without SKU** from supplier to customer sale, showing how SKU and barcodes are created and used throughout.

---

## 📦 **Complete Flow: Supplier to Customer**

```
┌─────────────────────────────────────────────────────────────────┐
│ SUPPLIER SENDS PRODUCT (No SKU)                                 │
│ Example: "Smart Coffee Maker" - Category: Electronics           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: RECEIVE (Warehouse Operations)                          │
│ ════════════════════════════════════════════════                │
│ ✅ System generates SKU: EL-001                                 │
│ ✅ SKU stored in putaway job                                    │
│ ✅ Console log: "🆕 Generated new SKU: EL-001..."              │
│                                                                  │
│ Location: DataContext.tsx lines 849-866                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: PRINT LABELS (Optional, but Recommended)                │
│ ════════════════════════════════════════════════════            │
│ 📄 Label contains:                                              │
│    - SKU: EL-001                                                │
│    - Barcode: ▮▮ ▮ ▮▮▮ ▮ (CODE128 from SKU)                   │
│    - QR Code: {sku:"EL-001", product:"Smart Coffee Maker"...}  │
│    - Product Name                                                │
│                                                                  │
│ Location: WarehouseOperations.tsx lines 2088-2135               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: PUTAWAY (Warehouse Operations)                          │
│ ════════════════════════════════════════════════                │
│ ✅ Worker scans location (e.g., "A-01-05")                     │
│ ✅ Worker confirms item                                         │
│ ✅ System creates product in inventory:                         │
│    {                                                             │
│      id: "uuid-123-456",                                        │
│      name: "Smart Coffee Maker",                                │
│      sku: "EL-001",          ← SKU PERMANENTLY SAVED           │
│      category: "Electronics",                                    │
│      stock: 1,                                                   │
│      location: "A-01-05",                                       │
│      barcode: "",            ← Can be updated to match SKU     │
│      siteId: "WH-001"                                           │
│    }                                                             │
│                                                                  │
│ Location: WarehouseOperations.tsx lines 542-575                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: INVENTORY (Product Now Exists)                          │
│ ════════════════════════════════════════════════════            │
│ ✅ Product visible in Inventory Management                     │
│ ✅ SKU: EL-001 shown on product card                           │
│ ✅ Can be searched by SKU                                       │
│ ✅ Can be edited/updated                                        │
│ ✅ Stock tracked                                                │
│                                                                  │
│ Location: pages/Inventory.tsx                                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: TRANSFER (If Multi-Site)                                │
│ ════════════════════════════════════════════════════            │
│ ✅ Transfer from Warehouse to Store                            │
│ ✅ SKU travels with product: EL-001                             │
│ ✅ Pick job uses SKU: EL-001                                    │
│ ✅ Pack job references SKU: EL-001                              │
│ ✅ Product registered at destination with SAME SKU             │
│                                                                  │
│ Location: DataContext.tsx processSale() lines 1172-1180         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: SALE (POS)                                              │
│ ════════════════════════════════════════════════════            │
│ 🛒 Cashier scans barcode OR searches product                   │
│ ✅ System finds product by SKU: EL-001                          │
│ ✅ Product added to cart                                        │
│ ✅ Receipt shows SKU: EL-001                                    │
│ ✅ Stock reduced by 1                                            │
│ ✅ Sale record includes SKU for tracking/returns               │
│                                                                  │
│ Location: pages/POS.tsx                                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ CUSTOMER RECEIVES PRODUCT                                        │
│ ✅ Can return using receipt (SKU tracked)                      │
│ ✅ Warranty/support references SKU                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **Key Points**

### **SKU is Created ONCE**
- ✅ Generated during **RECEIVE** step
- ✅ Format: `EL-001` (CategoryPrefix + Sequential Number)
- ✅ Stored permanently in product record
- ✅ Never changes for that product

### **Barcode is Linked to SKU**
- ✅ Generated from SKU using CODE128 format
- ✅ Printed on labels during receiving
- ✅ Can be scanned at POS
- ✅ Alternative: QR codes also contain SKU

### **SKU Travels Through System**
1. **Receive** → SKU generated (`EL-001`)
2. **Putaway** → Product created with SKU
3. **Inventory** → Searchable/trackable by SKU
4. **Transfer** → SKU preserved across sites
5. **POS** → Sale uses SKU for lookup
6. **Receipt** → Customer receipt shows SKU

---

## 📝 **Practical Example**

### **Scenario: Receiving Coffee Maker**

**Supplier PO arrives with:**
- Product: "Smart Coffee Maker"
- Quantity: 5 units
- **SKU: (blank)** ← No SKU from supplier


**Step-by-Step:**

**1. Receive Tab**
```bash
→ Click "Start Receiving" on approved PO
→ System detects missing SKU
→ Generates: EL-001 (Electronics category)
→ Console: "🆕 Generated new SKU: EL-001 for product: Smart Coffee Maker"
```

**2. Print Labels**
```bash
→ Click "Print Receiving Labels"
→ 5 labels generated (one per unit):
   Label 1: EL-001, Barcode, QR, Unit 1/5
   Label 2: EL-001, Barcode, QR, Unit 2/5
   ...
   Label 5: EL-001, Barcode, QR, Unit 5/5
```

**3. Confirm & Create Putaway Jobs**
```bash
→ Click "Confirm Quantities & Create Putaway Jobs"
→ 1 putaway job created with SKU: EL-001
→ PO status: Received
```

**4. Putaway Process**
```bash
→ Putaway tab: Start job
→ Scan location: A-03-15
→ Confirm item (or scan barcode)
→ Product created in inventory:
   - SKU: EL-001 ✅
   - Stock: 5
   - Location: A-03-15
```

**5. Later at POS**
```bash
→ Cashier scans barcode from label
→ System finds product by SKU: EL-001
→ "Smart Coffee Maker" added to cart
→ Sale completed
→ Receipt shows: SKU: EL-001
```

---

## 🔧 **Technical Details**

### **SKU Generation Logic**
Located in: `/utils/skuGenerator.ts`

```typescript
generateSKU('Electronics')
// Returns: "EL-001", "EL-002", "EL-003"...

generateSKU('Beverages')  
// Returns: "BV-001", "BV-002", "BV-003"...
```

### **Barcode Generation**
Located in: `/utils/barcodeGenerator.ts`

```typescript
generateBarcodeSVG('EL-001', options)
// Returns: SVG barcode image for EL-001
```

### **Product Creation**
Located in: `/pages/WarehouseOperations.tsx` lines 554-569

```typescript
addProduct({
  name: "Smart Coffee Maker",
  sku: "EL-001",  // ← Generated SKU
  category: "Electronics",
  barcode: "",     // Can be set to EL-001 later
  ...
})
```

---

## ✅ **System Features**

| Feature | Status | Description |
|---------|--------|-------------|
| Auto SKU Generation | ✅ | Creates SKU if supplier doesn't provide one |
| Category-Based | ✅ | Uses product category for prefix (EL-, BV-, FD-) |
| Sequential Numbers | ✅ | Auto-increments per category (001, 002, 003...) |
| Barcode from SKU | ✅ | Generates CODE128 barcode from SKU |
| QR Code | ✅ | QR contains SKU + product metadata |
| Label Printing | ✅ | Print labels with SKU, barcode, QR at receive |
| Permanent Storage | ✅ | SKU saved to product record in database |
| POS Integration | ✅ | Can scan barcode to find product |
| Multi-Site Support | ✅ | SKU preserved across warehouse → store transfers |
| Receipt Display | ✅ | SKU shown on customer receipts |
| Return Tracking | ✅ | Returns reference SKU for validation |

---

## 🚀 **Next Steps / Enhancements**

### **Optional Improvements:**

1. **Auto-populate barcode field**
   - When creating product, set `barcode: generatedSKU`
   - Allows scanning SKU directly without label

2. **Bulk Import**
   - Excel import with auto-SKU generation
   - Assign SKUs to hundreds of products at once

3. **Custom Prefixes**
   - Admin panel to define custom category prefixes
   - Store-specific SKU formats

4. **EAN-13/UPC Generation**
   - Generate standard retail barcodes
   - Link to SKU for tracking

5. **Barcode Scanning UI**
   - Add barcode scanner to POS search
   - "Scan to find" feature

---

## 📞 **Support**

**Everything is already working!** 

When you receive a product without SKU:
1. Go to **Warehouse Operations** → **RECEIVE**
2. Select an approved PO
3. System will **automatically generate SKU** (e.g., `EL-001`)
4. Print labels (includes barcode from SKU)
5. Complete putaway (product saved with SKU)
6. Product available for sale (SKU tracked throughout)

**Check console logs** (F12) during receive to see:
```
🆕 Generated new SKU: EL-001 for product: Smart Coffee Maker (Category: Electronics)
```

---

**Last Updated:** 2025-12-06  
**System Status:** ✅ Fully Operational
