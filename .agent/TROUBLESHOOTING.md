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
