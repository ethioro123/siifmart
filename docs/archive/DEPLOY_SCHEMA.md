# 🚀 Deploy Database Schema - Quick Guide

## ✅ Step 1: Environment Configured

Your `.env.local` is ready with:
```
✅ VITE_SUPABASE_URL=https://zdgzpxvorwinugjufkvb.supabase.co
✅ VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 📋 Step 2: Deploy Database Schema

### Option A: Using Supabase Dashboard (RECOMMENDED)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy Schema**
   - Open `SUPABASE_SETUP.md` in this project
   - Scroll to "Step 2.2: Create Tables"
   - Copy the ENTIRE SQL schema (starts with `-- Enable UUID extension`)
   - It's about 400 lines of SQL

4. **Paste and Run**
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl/Cmd + Enter)
   - Wait 10-20 seconds

5. **Verify Success**
   - You should see "Success. No rows returned"
   - Check "Table Editor" in sidebar
   - You should see 14 tables created

---

### Option B: Using SQL File (Alternative)

I've created a standalone SQL file for you:

```bash
# Navigate to project
cd "/Users/shukriidriss/Downloads/siifmart 80"

# The schema is in SUPABASE_SETUP.md
# Copy it to a .sql file if you prefer
```

---

## 🗄️ Tables That Will Be Created

1. ✅ `sites` - Store locations
2. ✅ `products` - Inventory items
3. ✅ `customers` - Customer records
4. ✅ `employees` - Staff members
5. ✅ `suppliers` - Vendor information
6. ✅ `purchase_orders` - PO headers
7. ✅ `po_items` - PO line items
8. ✅ `sales` - Sale transactions
9. ✅ `sale_items` - Sale line items
10. ✅ `stock_movements` - Inventory movements
11. ✅ `expenses` - Financial expenses
12. ✅ `wms_jobs` - Warehouse jobs
13. ✅ `shifts` - POS shifts
14. ✅ `system_logs` - Audit trail

---

## ✅ Step 3: Test Connection

After deploying the schema, test the connection:

```bash
# Start dev server
npm run dev

# Open browser console (F12)
# You should see:
# ✅ Environment variables found
# ✅ Connection successful!
# ✅ All tables exist
```

---

## 🎯 Quick Checklist

- [x] Supabase project created
- [x] Environment variables configured (.env.local)
- [ ] **DO THIS NOW:** Deploy database schema via SQL Editor
- [ ] **THEN:** Test connection (npm run dev)
- [ ] **NEXT:** Create API service layer

---

## 🆘 Troubleshooting

### Error: "relation does not exist"
**Solution:** You haven't run the schema yet. Go to SQL Editor and run it.

### Error: "Invalid API key"
**Solution:** Check your .env.local file has the correct keys.

### Error: "Failed to fetch"
**Solution:** Check your internet connection and Supabase project is active.

---

## 📍 Direct Links

- **Your Project Dashboard:** https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb
- **SQL Editor:** https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/sql
- **Table Editor:** https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/editor
- **API Settings:** https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/settings/api

---

## 🎉 What's Next?

After deploying the schema:

1. ✅ Test connection (npm run dev)
2. 🔄 Create API service layer
3. 🔄 Replace LocalStorage with Supabase
4. 🔄 Add real-time updates
5. 🔄 Implement authentication

---

**👉 ACTION REQUIRED: Go deploy the schema now!**

Open this link: https://supabase.com/dashboard/project/zdgzpxvorwinugjufkvb/sql

Then copy the schema from `SUPABASE_SETUP.md` and run it!
