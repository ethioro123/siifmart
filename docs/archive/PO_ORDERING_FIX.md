# PO Ordering Fix - Database Migration Required

## Issue
PO ordering is not working because the `purchase_orders` table is missing two required columns:
- `approved_by` (VARCHAR)
- `approved_at` (TIMESTAMPTZ)

## Error
When trying to create a PO, you get a 400 error from the database because the code tries to insert values into columns that don't exist.

## Solution
Run the SQL migration to add these columns to the database.

## How to Fix

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open the Supabase SQL Editor**:
   - Go to: https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/sql
   - Click "New query"

2. **Copy and paste this SQL**:
   ```sql
   -- Add approval tracking columns to purchase_orders table
   ALTER TABLE purchase_orders
   ADD COLUMN approved_by VARCHAR(200),
   ADD COLUMN approved_at TIMESTAMPTZ;

   -- Add index for querying approved POs
   CREATE INDEX idx_po_approved_at ON purchase_orders(approved_at);

   -- Add comment for documentation
   COMMENT ON COLUMN purchase_orders.approved_by IS 'Name of the person who approved the PO';
   COMMENT ON COLUMN purchase_orders.approved_at IS 'Timestamp when the PO was approved';
   ```

3. **Run the query**:
   - Click "Run" button or press `Cmd/Ctrl + Enter`

4. **Verify**:
   - You should see "Success. No rows returned"
   - Go back to the app and try creating a PO again

### Option 2: Via Migration File

The migration SQL is also available in:
```
migrations/add_po_approval_columns.sql
```

## What This Fixes

After running this migration:
- ✅ PO creation will work
- ✅ PO approval tracking will work
- ✅ The "Approved By" and "Approved At" fields will be stored properly
- ✅ No more 400 errors when creating purchase orders

## Technical Details

The application code in `services/supabase.service.ts` (lines 850-851) tries to insert these columns:
```typescript
approved_by: po.status === 'Draft' ? null : (po.approvedBy || null),
approved_at: po.status === 'Draft' ? null : (po.approvedAt || null)
```

But the database schema in `supabase-schema.sql` doesn't include these columns, causing the mismatch.

This migration adds them to the schema so the code works as intended.
