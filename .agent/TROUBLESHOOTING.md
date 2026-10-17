# SIIFMART Troubleshooting Guide

> Start with the observed error and verify the actual query, types, schema, and authorization path before changing code. Historical patterns are clues, not proof.

## Data & State Issues

| Symptom | Likely Cause | Files to Check | Fix Pattern |
|---------|-------------|----------------|-------------|
| Data not refreshing after mutation | Missing query invalidation | Hook in `/hooks/` | Add `queryClient.invalidateQueries()` in `onSuccess` |
| Stale data showing | React Query cache | `contexts/DataContext.tsx`, hook | Check `staleTime` and invalidation |
| Data from wrong site/country | Missing or incorrect trusted scope | Query/service and RLS policy | Verify authorized site and country scope at the database/server boundary; client filtering alone is insufficient |
| Offline data out of sync | IndexedDB stale | `services/db/pos.db.ts`, `hooks/usePosSync.ts` | Check sync logic |

## Authentication & Permissions

| Symptom | Likely Cause | Files to Check | Fix Pattern |
|---------|-------------|----------------|-------------|
| Can't access a page | Role not allowed | `utils/permissions.ts`, `App.tsx` route guards | Add role to permission check |
| Permission denied on action | RBAC check failing | `services/permissions.service.ts` | Check role hierarchy (L1-L4) |
| Session expired | Token refresh failing | `hooks/useSessionManager.ts`, `services/auth.service.ts` | Check Supabase token refresh |
| RLS blocking query | Policy, grant, role, or JWT scope mismatch | Migration, Supabase schema/policies, service | Identify the failing operation and role; update only the needed policy after review |

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
| Page freezes after UI change | Large render work, image decoding, blur, or memory growth | Profiled route/component | Measure on representative hardware; remove the confirmed bottleneck while preserving legibility |
| Janky scrolling on mobile | Excessive DOM work, layout/paint, or long tasks | Browser profiler and component | Reduce measured work; avoid frequent layout animation and unnecessary render churn |
| Buttons hard to tap | Small target or obstructed action | Rendered control and layout | Increase target size and confirm keyboard/focus behavior |
| Slow initial load on mobile | Large route bundle or blocking requests | Bundle report and network trace | Defer optional code and bound initial data based on measured impact |
| UI unresponsive during search | Expensive filtering/network work per keystroke | Search handler and profiler | Debounce remote/expensive work; keep small local filtering immediate |

## Supabase API Errors

| Symptom | Likely Cause | Files to Check | Fix Pattern |
|---------|-------------|----------------|-------------|
| PATCH/POST returns **400 Bad Request** | Sending unknown column names (camelCase fields not mapped to snake_case) | Relevant `.service.ts` `update()` method | Switch from `{ ...object }` spread to explicit allowlist. See RULES.md "Service Field Mapping" |
| POST returns **400** with "null value violates not-null constraint" | Missing a NOT NULL column in the insert payload | `.service.ts` `create()` method, `/schemas/db-schema.md` | Check the schema registry for NOT NULL columns and add them to the insert |
| "column X does not exist" in logs | New TS field added but service mapper not updated | `.service.ts` mapper function, `update()` allowlist | Add the field to both the `mapRow()` (read) and `update()` allowlist (write) |
| INSERT with returned representation is denied | Chained `.select()` also requires SELECT access and may trigger SELECT RLS/column grants | `.service.ts` insert method and RLS/grants | Omit the returned representation if unused; otherwise verify the actor may select the returned columns and rows |
| RLS blocking query | Policy mismatch | `/migrations/`, Supabase dashboard | Update RLS policy |
| Insert returns 409 Conflict | Unique constraint violation | Migration that created the constraint | Check unique columns (code, site_number, barcode) |

### First Response to Any Supabase 400/403/500 Error

> **Verify the live schema and operation before editing service code.** Migration files may not match the live DB. Keep introspection read-only and use the approved Supabase connection or schema registry.

**Step 1 — Identify the actual operation and columns:**
Compare the exact request projection, filters, joins, role, and returned error with generated types or a read-only schema inspection. Do not probe guessed columns by issuing arbitrary production reads.

**Step 2 — Isolate the root cause:**
Compare the service's allowlisted payload and projection with the confirmed schema and RLS policies. Change only proven mismatches; avoid bundling unrelated fixes.

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
npx tsc --noEmit
npm run lint:size
git status --short
```
