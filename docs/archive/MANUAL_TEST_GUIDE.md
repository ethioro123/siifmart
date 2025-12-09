# 🧪 MANUAL FULFILLMENT TEST GUIDE

## ⚠️ Browser Automation Unavailable
The automated browser testing tool is currently experiencing service issues. Please follow this manual test guide.

---

## 📋 COMPLETE TEST PROCEDURE

### STEP 1: Create PO with Custom Item

**You should already have the Create Order modal open.**

1. **Click "✏️ Custom Entry"**
2. **Fill in:**
   - Product Name: `Test Product`
   - Quantity: `10`
   - Unit Price: `100`
3. **Click "Add Item"**
4. **Verify:** Item appears in the PO items list

### STEP 2: Select Destination (CRITICAL!)

5. **Find "Ship To" dropdown** (should have red asterisk *)
6. **Click dropdown** and select ANY site
7. **Verify:** Site name appears in dropdown

### STEP 3: Create PO

8. **Click "Create Purchase Order"** button
9. **Expected:**
   - Success notification appears
   - Modal closes
   - PO appears in list with:
     - PO Number: `PO-1764...` (timestamp)
     - Status: **"Draft"** (yellow badge)
     - Items: 1
     - Total: 1000

**✅ CHECKPOINT 1:** PO created successfully?
- [ ] Yes → Continue to Step 4
- [ ] No → **STOP** and share error message

---

### STEP 4: Approve PO

10. **Click on the PO** you just created
11. **Click once on screen** to remove blur
12. **Look for "✓ Approve PO" button** (blue, top right area)
13. **Click "✓ Approve PO"**
14. **Expected:**
   - Status changes to **"Approved"** (cyan badge)
   - Button disappears

**✅ CHECKPOINT 2:** PO approved successfully?
- [ ] Yes → Continue to Step 5
- [ ] No → **STOP** and check:
  - Is button visible?
  - Are you logged in as Super Admin?
  - Any console errors?

---

### STEP 5: Receive PO

15. **Click hamburger menu (☰)**
16. **Click "WMS Operations"**
17. **Click once on screen** to remove blur
18. **Click "RECEIVE" tab**
19. **Find your approved PO** in the list
20. **Click "Receive" button**
21. **Expected:**
   - Success notification: "PO ... received! 1 putaway jobs created."
   - No errors in console

**✅ CHECKPOINT 3:** PO received successfully?
- [ ] Yes → Continue to Step 6
- [ ] No → **STOP** and check console for errors

---

### STEP 6: View Putaway Job

22. **Click "PUTAWAY" tab**
23. **Expected:** You should see a job card with:
   - Job ID: `#123456` (6 digits)
   - Type: PUTAWAY
   - Status: Pending
   - Product: Test Product
   - Qty: 10
   - "Click to Start Putaway" text

**✅ CHECKPOINT 4:** Putaway job visible?
- [ ] Yes → Continue to Step 7
- [ ] No → **STOP** and check:
  - Is PUTAWAY tab empty?
  - Any console errors?
  - Check database (see below)

---

### STEP 7: Start Putaway

24. **Click ANYWHERE on the job card** (entire card is clickable)
25. **Expected:** Scanner interface opens with:
   - Black overlay covering screen
   - Job ID at top
   - Product name: "Test Product"
   - Quantity: 10
   - Scan input field
   - EXIT button (top right, red)

**✅ CHECKPOINT 5:** Scanner opened successfully?
- [ ] Yes → **SUCCESS! All fixes working!** 🎉
- [ ] No → **STOP** and check:
  - Did anything happen when you clicked?
  - Any console errors?
  - Is card clickable (hover effect)?

---

## 🐛 TROUBLESHOOTING

### If PO Creation Fails:
**Check console for:**
- `invalid input syntax for type uuid` → Share full error
- `duplicate key` → Refresh page and try again
- `destination required` → Make sure you selected a site

### If Approve Button Missing:
**Check:**
1. Is status "Draft"? (should be yellow)
2. Are you Super Admin? (check top right)
3. Refresh page and try again

### If Receive Fails:
**Check console for:**
- `400 Bad Request` → Share full error
- `Failed to create WMS job` → Check database

### If Putaway Job Missing:
**Run this database check:**
```sql
SELECT id, type, status, order_ref, line_items 
FROM wms_jobs 
WHERE type = 'PUTAWAY' 
ORDER BY created_at DESC 
LIMIT 5;
```

### If Scanner Doesn't Open:
**Check:**
1. Is job assigned to someone else? (should be dimmed)
2. Console errors?
3. Try clicking different parts of the card

---

## 📊 DATABASE VERIFICATION

If you want to verify the fixes worked at the database level, I can run these queries for you:

```sql
-- Check if PO was created
SELECT id, po_number, status, approved_by 
FROM purchase_orders 
ORDER BY created_at DESC 
LIMIT 1;

-- Check if putaway job was created
SELECT id, type, status, order_ref, line_items 
FROM wms_jobs 
WHERE type = 'PUTAWAY' 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## ✅ SUCCESS CRITERIA

**All 5 checkpoints passed?**
- ✅ PO created with Draft status
- ✅ Approve button visible and works
- ✅ Receive creates putaway job
- ✅ Putaway job visible with clean ID
- ✅ Scanner opens when clicking job

**If YES:** The fulfillment workflow is fully functional! 🎉

**If NO:** Tell me which checkpoint failed and I'll help debug.

---

**Please go through these steps and let me know the results!**
