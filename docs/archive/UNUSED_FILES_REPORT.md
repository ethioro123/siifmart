# Unused Files Report

## 🔍 Analysis Summary

This report identifies potentially unused, duplicate, or obsolete files in the codebase.

---

## ⚠️ Duplicate Files (Should Remove One)

### Scripts
1. **`scripts/reset-distribute-products.ts`** vs **`scripts/reset-and-distribute-products.ts`**
   - `reset-distribute-products.ts` has hardcoded credentials (old version)
   - `reset-and-distribute-products.ts` uses environment variables (newer version)
   - **Recommendation:** Delete `scripts/reset-distribute-products.ts`

2. **`scripts/seed-warehouse-products.ts`** vs **`scripts/seed-warehouse-products.js`**
   - Both do the same thing (TypeScript vs JavaScript)
   - **Recommendation:** Keep `.ts` version, delete `.js` version

---

## 🧪 Test/Diagnostic Files (Potentially Unused)

These files appear to be one-off test files that may not be needed:

1. **`browser-diagnostic.js`** - Browser diagnostic script
2. **`test-connection.ts`** - Connection test script
3. **`test-login.html`** - HTML test file for login
4. **`test-job-assignment.js`** - Job assignment test
5. **`scripts/test-auth.ts`** - Auth test script
6. **`scripts/test-data-loading.js`** - Data loading test
7. **`scripts/test-login.ts`** - Login test script
8. **`scripts/test_fulfillment_flow.ts`** - Fulfillment flow test
9. **`scripts/test_wms_operations.ts`** - WMS operations test

**Recommendation:** Review if these are still needed. If tests are automated elsewhere, these can be removed.

---

## 📜 Old/Obsolete Scripts (Review Needed)

1. **`scripts/reset_for_testing.ts`** - May be superseded by newer reset scripts
2. **`scripts/reset.sh`** - Shell script, may be obsolete
3. **`scripts/check-unused-files.ts`** - The script we just created (can keep for future use)

---

## 📄 Documentation Files (Many - Consider Consolidating)

There are **80+ markdown documentation files** in the root directory. Consider:
- Moving them to a `docs/` folder
- Consolidating related documentation
- Archiving old/obsolete guides

**Examples:**
- Multiple fulfillment guides (FULFILLMENT_*.md)
- Multiple PO guides (PO_*.md)
- Multiple status/completion summaries
- Multiple implementation plans

---

## ✅ Files That Are Used (Keep These)

### Components (All Used)
- All components in `components/` are imported and used

### Pages (All Used)
- All pages in `pages/` are imported in `App.tsx` or used dynamically

### Scripts (Keep - Run Manually)
Most scripts in `scripts/` are utility scripts meant to be run manually, not imported:
- `create-site-workers.ts` - Used to create workers
- `reorganize-employees-by-sites.ts` - Used to reorganize employees
- `reset-and-distribute-products.ts` - Used to reset products
- `seedSites.ts` - Used to seed sites
- etc.

---

## 🎯 Recommended Actions

### High Priority (Safe to Delete)
1. ✅ Delete `scripts/reset-distribute-products.ts` (duplicate with hardcoded credentials)
2. ✅ Delete `scripts/seed-warehouse-products.js` (duplicate of .ts version)

### Medium Priority (Review First)
1. 🔍 Review test files (`test-*.ts`, `test-*.js`, `test-*.html`)
2. 🔍 Review `scripts/reset_for_testing.ts` and `scripts/reset.sh`

### Low Priority (Organization)
1. 📁 Move documentation files to `docs/` folder
2. 📁 Consolidate related documentation files

---

## 📊 Statistics

- **Total Code Files:** 109
- **Total Documentation Files:** 108
- **Duplicate Scripts Found:** 2
- **Test Files Found:** 9
- **All Components:** ✅ Used
- **All Pages:** ✅ Used

---

## ⚠️ Note

Scripts are typically not "imported" - they're run manually via `npx tsx`. The "unused" status for scripts is expected and doesn't mean they should be deleted. Only delete scripts that are:
1. Duplicates
2. Obsolete/outdated
3. One-off test files no longer needed

