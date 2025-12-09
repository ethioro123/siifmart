# 🔍 PO Modal & Putaway Assessment

## ✅ PO Modal - Expected Behavior

### Modal Opening
- **Trigger:** Click "Create Order" button in Procurement page
- **Expected:** Modal appears with dark overlay background
- **Title:** "Create Purchase Order" or similar

### Required Fields
1. **Ship To (Destination Site)** ⚠️ MANDATORY
   - Dropdown with list of sites
   - Default: "Select Destination..."
   - Red asterisk (*) indicates required
   - **Validation:** Cannot create PO without selecting a site

2. **Supplier**
   - Dropdown with suppliers list
   - Can select "Unspecified Vendor"
   - **Handled:** UNSPECIFIED → null in database

3. **Products/Items**
   - Add items section
   - Since products = 0, you'll need to either:
     - Add custom items (if supported)
     - Or first add products via Inventory

### Create Button
- **Enabled:** Only when destination site is selected
- **Action:** Creates PO with status = "Draft"
- **Backend:** Saves with UUID + timestamp-based po_number

### Expected Result
- PO appears in list with:
  - PO Number: `PO-1764012345678` (timestamp)
  - Status: "Draft" (yellow badge)
  - Items count
  - Total amount

---

## ✅ Putaway Workflow - Expected Behavior

### Step 1: Approve PO
**Location:** Procurement page
**Action:** Click PO → Click "Approve" button
**Expected:**
- Status changes from "Draft" to "Approved"
- Button only visible for Super Admin
- **Database:** Saved as "Pending" (mapped)

### Step 2: Receive PO
**Location:** WMS Operations → RECEIVE tab
**Action:** Click "Receive" button on approved PO
**Expected:**
- Success notification
- PO status changes to "Received"
- Putaway jobs created automatically
- **Database:** Creates wms_jobs with type="PUTAWAY"

### Step 3: View Putaway Jobs
**Location:** WMS Operations → PUTAWAY tab
**Expected Display:**
```
┌─────────────────────────────────────┐
│ JOB #892314                         │
│ PUTAWAY • Pending                   │
│ ────────────────────────────────    │
│ 🔹 Product Name                     │
│ Qty: 10                             │
│ ────────────────────────────────    │
│ From: Receiving Dock → [Bin]       │
│ Click to Start Putaway              │
└─────────────────────────────────────┘
```

**Key Features:**
- ✅ Clean Job ID (6 digits: #892314)
- ✅ Entire card is clickable
- ✅ Visual indicator: "Click to Start"
- ✅ If assigned to you: "Click to Continue" (green)
- ✅ If assigned to others: Dimmed, unclickable

### Step 4: Start Putaway
**Action:** Click anywhere on the job card
**Expected:**
```
┌─────────────────────────────────────┐
│ PUTAWAY #892314          [EXIT]     │
│ SKU-12345                           │
├─────────────────────────────────────┤
│                                     │
│     📦 Product Name                 │
│     Qty: 10                         │
│                                     │
│     ──────────────────              │
│                                     │
│     📍 SCAN BIN LOCATION            │
│     [____________]                  │
│                                     │
│     Or Skip →                       │
│                                     │
└─────────────────────────────────────┘
```

**Scanner Interface:**
- ✅ Black overlay (fixed position, z-50)
- ✅ Job ID at top
- ✅ Product details
- ✅ Scan input field
- ✅ EXIT button (top right, red)
- ✅ Navigation prompts

---

## 🔧 Technical Implementation

### PO Creation Flow
```
User Input
    ↓
Procurement.tsx (Generate UUID + poNumber)
    ↓
DataContext.createPO()
    ↓
supabase.service.ts
    ├─ Map: supplierId "UNSPECIFIED" → null
    ├─ Map: status "Draft" → "Pending"
    ├─ Map: productId "CUSTOM-xxx" → null
    └─ Insert to database
    ↓
Return PO with UUID
    ↓
Update local state
    ↓
Display in UI with poNumber
```

### Putaway Job Creation Flow
```
Receive PO
    ↓
DataContext.receivePO()
    ↓
For each line item:
    ├─ Create WMSJob
    ├─ id: UUID (auto-generated)
    ├─ type: "PUTAWAY"
    ├─ status: "Pending"
    ├─ lineItems: [product details]
    └─ orderRef: PO UUID
    ↓
Save to database
    ↓
Display in PUTAWAY tab
```

### Putaway Interaction Flow
```
Click Job Card
    ↓
WarehouseOperations.handleStartJob()
    ├─ Auto-assign to current user
    ├─ Update status to "In-Progress"
    ├─ Check lineItems exist
    └─ Sort items by bin location
    ↓
setSelectedJob(job)
setIsScannerMode(true)
    ↓
Render ScannerInterface
    ↓
Black overlay appears
```

---

## ⚠️ Potential Issues & Solutions

### Issue 1: Products List Empty
**Symptom:** Cannot add items to PO
**Solution:** 
1. Close PO modal
2. Go to Inventory
3. Add product first
4. Return to Procurement

### Issue 2: "Destination Site Required" Error
**Symptom:** Cannot create PO
**Solution:** Select a site from "Ship To" dropdown

### Issue 3: Putaway Job Not Appearing
**Symptom:** PUTAWAY tab is empty after receiving
**Check:**
- Did PO have line items?
- Check browser console for errors
- Verify WMS jobs in database

### Issue 4: Scanner Not Opening
**Symptom:** Click card, nothing happens
**Check:**
- Is job assigned to someone else?
- Check console for "updateJobStatus is not a function"
- Verify lineItems exist in job

### Issue 5: Screen Goes Dark but No Scanner
**Symptom:** Black screen, no content
**Solution:** Already fixed with null check
**Verify:** supplierId has `?.` operator

---

## 🧪 Test Checklist

### PO Modal Tests
- [ ] Modal opens when clicking "Create Order"
- [ ] "Ship To" dropdown shows sites
- [ ] "Ship To" is marked as required (red *)
- [ ] Cannot create without selecting destination
- [ ] Can add items (or shows "no products" if empty)
- [ ] Create button works
- [ ] PO appears with "Draft" status
- [ ] PO number is timestamp-based (PO-1764...)

### Approval Tests
- [ ] "Approve" button visible (Super Admin only)
- [ ] Click Approve changes status
- [ ] No errors in console
- [ ] Status persists after refresh

### Receive Tests
- [ ] Approved PO appears in RECEIVE tab
- [ ] "Receive" button works
- [ ] Success notification appears
- [ ] No 400/406 errors in console

### Putaway Tests
- [ ] Job appears in PUTAWAY tab
- [ ] Job ID is clean (6 digits)
- [ ] Entire card is clickable
- [ ] Hover effect works
- [ ] Click opens scanner
- [ ] Scanner shows black overlay
- [ ] Scanner shows job details
- [ ] EXIT button works

---

## 📊 Success Criteria

✅ **PO Modal:** All fields work, validation enforced, creates PO successfully
✅ **Approval:** Status changes, no errors, persists to database
✅ **Receive:** Creates putaway jobs, no database errors
✅ **Putaway:** Jobs visible, clickable, scanner opens correctly

---

## 🎯 Current Status

**Code:** ✅ All fixes implemented
**Database:** ✅ Cleaned (0 products, 0 POs, 0 jobs)
**Server:** ✅ Running on http://localhost:3000

**Ready for testing!** 🚀
