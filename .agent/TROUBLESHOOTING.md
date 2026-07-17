# SIIFMART Troubleshooting Guide

> Common issues, their root causes, and where to fix them.

## Data & State Issues

| Symptom | Likely Cause | Files to Check | Fix Pattern |
|---------|-------------|----------------|-------------|
| Data not refreshing after mutation | Missing query invalidation | Hook in `/hooks/` | Add `queryClient.invalidateQueries()` in `onSuccess` |
| Stale data showing | React Query cache | `contexts/DataContext.tsx`, hook | Check `staleTime` and invalidation |
| Data from wrong site | Missing site filter | Component rendering data | Add `.filter(item => item.siteId === currentSiteId)` |
| Offline data out of sync | IndexedDB stale | `services/db/pos.db.ts`, `hooks/usePosSync.ts` | Check sync logic |

## Authentication & Permissions

| Symptom | Likely Cause | Files to Check | Fix Pattern |
|---------|-------------|----------------|-------------|
| Can't access a page | Role not allowed | `utils/permissions.ts`, `App.tsx` route guards | Add role to permission check |
| Permission denied on action | RBAC check failing | `services/permissions.service.ts` | Check role hierarchy (L1-L4) |
| Session expired | Token refresh failing | `hooks/useSessionManager.ts`, `services/auth.service.ts` | Check Supabase token refresh |
| RLS blocking query | Policy mismatch | `/migrations/`, Supabase dashboard | Update RLS policy |

## POS Issues

| Symptom | Likely Cause | Files to Check | Fix Pattern |
|---------|-------------|----------------|-------------|
| POS offline broken | IndexedDB empty | `services/db/pos.db.ts`, `hooks/usePosSync.ts` | Verify IDB sync |
| Cart math wrong | Pricing logic | `utils/pricing.ts`, POS context | Check discount/tax calc |
| Receipt not printing | Android bridge | `window.AndroidNative.print()` | Check bridge connection |

## Fulfillment / WMS Issues

| Symptom | Likely Cause | Files to Check | Fix Pattern |
|---------|-------------|----------------|-------------|
| Job status stuck | Missing invalidation | `components/fulfillment/useJobActions.ts` | Check `onSuccess` |
| Scanner not reading | Parser issue | `components/fulfillment/ScannerInterface.tsx` | Check barcode format |
| Stock mismatch after receive | Quantity error | `hooks/useAdjustStockMutation.ts` | Verify adjustment math |
| Wrong assignee showing | Field mapping | `services/wms-jobs.service.ts` | Check snake_case → camelCase |

## Inventory Issues

| Symptom | Likely Cause | Files to Check | Fix Pattern |
|---------|-------------|----------------|-------------|
| Stock count wrong | Adjustment not applied | `hooks/useAdjustStockMutation.ts` | Check mutation + DB |
| Product not showing | Filter or status | `contexts/DataContext.tsx` | Check site scope + active |
| Duplicate products | Barcode collision | `services/products.service.ts` | Check unique constraint |

## UI / Rendering Issues

| Symptom | Likely Cause | Files to Check | Fix Pattern |
|---------|-------------|----------------|-------------|
| Page not loading | Lazy import error | `App.tsx` | Check `React.lazy()` path |
| Blank screen | Runtime error | Browser console | Check for uncaught errors |
| Styling broken | Tailwind class | `index.css` | Verify CSS variables |

## Mobile Performance (POS / WMS)

| Symptom | Likely Cause | Files to Check | Fix Pattern |
|---------|-------------|----------------|-------------|
| Page freezes after aesthetic update | `backdrop-blur` on scrollable/re-rendered elements | Component CSS classes | Replace `backdrop-blur-xl` with solid `bg-` color on lists, cards, modals |
| Janky scrolling on mobile | `transition-all` or animating layout properties | Component CSS classes | Use `transition: transform 150ms, opacity 150ms` — never `transition-all` |
| Buttons hard to tap | Touch targets too small | Component sizing classes | Ensure all interactive elements are ≥44×44px |
| Slow initial load on mobile | Modals/charts eagerly imported | POS/Fulfillment page imports | Lazy-load modals with `React.lazy()`, defer chart libs |
| UI unresponsive during search | Missing debounce on input | Search input `onChange` handler | Add `setTimeout` or `useDeferredValue` with ≥300ms delay |

## Supabase API Errors

| Symptom | Likely Cause | Files to Check | Fix Pattern |
|---------|-------------|----------------|-------------|
| PATCH/POST returns **400 Bad Request** | Sending unknown column names (camelCase fields not mapped to snake_case) | Relevant `.service.ts` `update()` method | Switch from `{ ...object }` spread to explicit allowlist. See RULES.md "Service Field Mapping" |
| POST returns **400** with "null value violates not-null constraint" | Missing a NOT NULL column in the insert payload | `.service.ts` `create()` method, `/schemas/db-schema.md` | Check the schema registry for NOT NULL columns and add them to the insert |
| "column X does not exist" in logs | New TS field added but service mapper not updated | `.service.ts` mapper function, `update()` allowlist | Add the field to both the `mapRow()` (read) and `update()` allowlist (write) |
| INSERT returns **403 Forbidden** | Chaining `.select('*')` after `.insert()` triggers SELECT RLS policy | `.service.ts` insert method | Remove `.select('*')` or use `.select('id, created_at')` with minimal columns |
| RLS blocking query | Policy mismatch | `/migrations/`, Supabase dashboard | Update RLS policy |
| Insert returns 409 Conflict | Unique constraint violation | Migration that created the constraint | Check unique columns (code, site_number, barcode) |

### First Response to Any Supabase 400/403/500 Error

> **ALWAYS probe the live schema before editing service code.** Migration files may not match the live DB.

**Step 1 — Identify the actual columns:**
```typescript
// In a scratch script, authenticate and probe:
const cols = ['id', 'user_id', 'user_name', 'action', 'details', ...];
for (const col of cols) {
    const r = await supabase.from('table_name').select(col).limit(1);
    console.log(`${col}: ${r.error ? '❌' : '✅'}`);
}
```

**Step 2 — Map ALL mismatches in one pass:**
Compare what the service sends vs what the live DB expects. Fix ALL column mismatches together — don't fix them one-by-one (each round costs a deploy/test cycle).

**Step 3 — Update the schema registry:**
After confirming the fix, update `/schemas/db-schema.md` with the actual columns so the next developer doesn't repeat the same probe.

**Reusable template:** `/scratch/templates/probe_table_schema.ts`

## Field Mapping Issues

| Symptom | Likely Cause | Files to Check | Fix Pattern |
|---------|-------------|----------------|-------------|
| Field saves on create but not update | Missing from `update()` allowlist | `.service.ts` update method | Add `[tsField, db_field]` to the fieldMap array |
| Field exists in DB but shows undefined in UI | Missing from `mapRow()` function | `.service.ts` mapper | Add `camelCase: row.snake_case` mapping |
| Field updates silently dropped | Old denylist pattern misses it | `.service.ts` update method | Convert to allowlist pattern (see RULES.md) |

## Quick Diagnostic Commands

```bash
# Type check the project
npx tsc --noEmit

# Find files over 500 lines
find . -name '*.tsx' -o -name '*.ts' | grep -v node_modules | grep -v dist | xargs wc -l | sort -rn | head -20

# Find console.log statements
grep -rn 'console.log' --include='*.ts' --include='*.tsx' . | grep -v node_modules | grep -v dist

# Find `any` type usage
grep -rn ': any' --include='*.ts' --include='*.tsx' . | grep -v node_modules | grep -v dist | head -20

# Check git status
git status

# Run file size lint
npm run lint:size
```
