# PO Receiving & PUTAWAY Test Plan

## Test Steps

### 1. Login as Lensa Merga
- Email: `lensa.merga@siifmart.com`
- Password: `Test123!`
- Verify top bar shows: **Main Distribution Hub**

### 2. Navigate to Procurement
- Click "Procurement" in sidebar
- Go to "Purchase Orders" tab
- Find an **Approved** PO for Main Distribution Hub

### 3. Receive the PO
- Click "Receive" button on an approved PO
- **Check browser console** for logs:
  - Should see: `📦 Receiving PO: { poId, siteId, lineItems }`
  - Should see: `🏗️ Creating PUTAWAY jobs for site: [UUID]`
  - Should see: `💾 Creating WMS job in database...`
  - Should see: `✅ Job created: [job-id]`
  - Should see: `✅ Created X PUTAWAY jobs`

### 4. Verify PUTAWAY Jobs Created
- Navigate to Warehouse Operations (Fulfillment)
- Click "PUTAWAY" tab
- **Expected:** See new PUTAWAY jobs with status "Pending"
- **Check:** Job shows correct product and quantity

### 5. Test PUTAWAY Flow
- Click "Start Putaway" on a pending job
- **Expected:** Scanner opens to location selection (no stuck overlay)
- Select location: A-01-05
- Click "Select Location"
- Enter SKU from the job
- Press Enter
- Click "CONFIRM PUTAWAY"
- **Expected:** Job completes, success message shows

### 6. Verify Inventory Update
- Navigate to Inventory > Master List
- Search for the product you just put away
- **Expected:**
  - Product shows location: A-01-05
  - Stock increased by PUTAWAY quantity
  - Site: Main Distribution Hub

## Console Logs to Watch For

### Success Indicators:
```
📦 Receiving PO: { poId: "...", siteId: "b6264903-...", lineItems: 3 }
🏗️ Creating PUTAWAY jobs for site: b6264903-a17c-4734-8c82-3d5f306c5598
✅ Product FD-102-W exists at site, using ID: ...
💾 Creating WMS job in database... { siteId: "b6264903-...", type: "PUTAWAY", ... }
✅ Job created: abc123-...
✅ Created 3 PUTAWAY jobs
```

### Error Indicators:
```
❌ PO has no siteId!
❌ Failed to auto-create site product
❌ Failed to create WMS job
PO not found: ...
```

## Troubleshooting

### If No Jobs Created:
1. Check console for "✅ Valid jobs already exist" - jobs may already exist
2. Check PO has lineItems
3. Verify PO has siteId (UUID)
4. Check database `wms_jobs` table directly

### If Jobs Don't Appear in UI:
1. Check site filtering - jobs must match user's siteId
2. Verify jobs table loaded correctly
3. Check `filteredJobs` in React DevTools

### If PUTAWAY Fails:
1. Check product exists at the site
2. Verify location format (A-01-01)
3. Check `relocateProduct` function logs
4. Verify database permissions

## Expected Database State After Test

### wms_jobs table:
- New row(s) with:
  - `site_id` = Main Distribution Hub UUID
  - `type` = 'PUTAWAY'
  - `status` = 'Pending' (or 'Completed' after PUTAWAY)
  - `order_ref` = PO ID
  - `line_items` = JSON array with product details

### products table:
- Product row updated with:
  - `location` = 'A-01-05' (or selected location)
  - `stock` = increased by PUTAWAY quantity

### purchase_orders table:
- PO row updated with:
  - `status` = 'Received'
