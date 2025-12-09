# 🔍 TROUBLESHOOTING: Receive to Putaway Flow

## 🧪 **How to Test the Flow:**

### **Step 1: Check if you have a PO to receive**
1. Go to **Procurement** page
2. Click **"Orders"** tab
3. Look for POs with status **"Approved"** or **"Pending"**
4. If none exist, create a new PO first

### **Step 2: Go to Warehouse Operations**
1. Click **"Warehouse"** in the sidebar
2. You should see the **RECEIVE** tab active
3. Look for pending POs to receive

### **Step 3: Start Receiving**
1. Click on a PO card
2. You should see:
   - PO details
   - List of items with quantities
   - Input fields for each item
3. Click **"Confirm Quantities & Create Putaway Jobs"** button

### **Step 4: Check for Success**
Look for:
- ✅ Success notification: "PO PO-XXXX received! X putaway jobs created."
- ✅ "Reception Complete" screen appears
- ✅ Green checkmark icon

### **Step 5: Verify Putaway Jobs**
1. Click **"Finish"** button
2. Click **"PUTAWAY"** tab
3. You should see pending putaway jobs

---

## ❌ **Common Issues:**

### **Issue 1: No POs to Receive**
**Symptom:** RECEIVE tab is empty

**Solution:**
1. Go to Procurement → Create Order
2. Add items to PO
3. Click "Issue Order"
4. If you're not super_admin, ask super_admin to approve it
5. Go back to Warehouse → RECEIVE tab

### **Issue 2: Button Doesn't Work**
**Symptom:** Clicking "Confirm Quantities" does nothing

**Check:**
1. Open browser console (F12)
2. Look for errors
3. Check if `receivePO` function is defined
4. Verify `receivingPO` state has data

### **Issue 3: No Jobs Created**
**Symptom:** Success message shows but no jobs in PUTAWAY tab

**Check:**
1. Verify PO has `lineItems` array
2. Check browser console for errors
3. Refresh the page
4. Check if `setJobs` is working

### **Issue 4: Jobs Not Visible**
**Symptom:** Jobs created but not showing in PUTAWAY tab

**Check:**
1. Make sure you're on PUTAWAY tab (not RECEIVE)
2. Jobs should have `type: 'PUTAWAY'`
3. Jobs should have `status: 'Pending'` or 'In-Progress'
4. Check filter: `jobs.filter(j => j.type === 'PUTAWAY' && j.status !== 'Completed')`

---

## 🔧 **Debug Steps:**

### **1. Check Browser Console**
Open console (F12) and look for:
- ❌ Red errors
- ⚠️ Yellow warnings
- 📝 Console.log messages

### **2. Check Network Tab**
1. Open Network tab (F12)
2. Click "Confirm Quantities"
3. Look for API calls
4. Check if they succeed or fail

### **3. Check State**
Add this temporarily to WarehouseOperations.tsx:
```tsx
console.log('Jobs:', jobs);
console.log('Receiving PO:', receivingPO);
```

### **4. Check DataContext**
Add this to receivePO function:
```tsx
console.log('Creating jobs for PO:', poId);
console.log('PO found:', po);
console.log('Line items:', po?.lineItems);
```

---

## ✅ **Expected Behavior:**

### **When you click "Confirm Quantities":**

1. **receivePO() called** with PO ID
2. **PO found** in orders array
3. **For each line item:**
   - Product looked up
   - WMSJob created
   - Job added to jobs array
4. **PO status updated** to "Received"
5. **Inventory updated**
6. **Success notification** shown
7. **Step changes** to 2 (completion screen)

### **In PUTAWAY tab:**

1. **Jobs filtered** by type='PUTAWAY' and status!='Completed'
2. **Jobs displayed** as cards
3. **Each job shows:**
   - Job ID
   - Location
   - Line items
   - Quantities

---

## 🎯 **Quick Test:**

### **Create a Simple Test PO:**

1. **Procurement** → **Create Order**
2. **Add one item:**
   - Category: Beverages
   - Sub-category: Soft Drinks
   - Size: 500ml
   - Qty: 10
   - Price: 25
3. **Click "Issue Order"**
4. **If super_admin:** PO is auto-approved
5. **If not:** Ask super_admin to approve

### **Receive the PO:**

1. **Warehouse** → **RECEIVE** tab
2. **Click on the PO**
3. **Click "Confirm Quantities & Create Putaway Jobs"**
4. **Expected:** "PO PO-XXXX received! 1 putaway jobs created."

### **Check PUTAWAY:**

1. **Click "Finish"**
2. **Click "PUTAWAY" tab**
3. **Expected:** See 1 pending job
4. **Job should show:**
   - JOB #PUT-...
   - Soft Drinks x10
   - From: Receiving Dock

---

## 📞 **If Still Not Working:**

### **Tell me:**

1. **What happens** when you click "Confirm Quantities"?
   - Nothing?
   - Error message?
   - Success but no jobs?

2. **Check console** - Any errors?

3. **Check PUTAWAY tab** - Any jobs there?

4. **PO status** - Did it change to "Received"?

5. **Inventory** - Did quantities update?

---

## 🔍 **Specific Things to Check:**

### **In Browser Console:**
```javascript
// Check if jobs exist
console.log(jobs);

// Check if receivePO exists
console.log(typeof receivePO);

// Check current PO
console.log(receivingPO);
```

### **In React DevTools:**
1. Install React DevTools extension
2. Open Components tab
3. Find WarehouseOperations component
4. Check state:
   - jobs array
   - receivingPO object
   - receiveStep number

---

**Let me know what you see and I'll help fix it!** 🔧
