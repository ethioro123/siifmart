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
| New staging employees missing from Quick Login | An old fixed roster or the wrong project environment | `hooks/useStagingQuickLogin.ts`, local staging bridge, `docs/STAGING_QUICK_LOGIN.md` | Run local staging and refresh the live roster. Check private server setup if loading fails; never add passwords to the UI or a tracked account list |

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
| **42P17: infinite recursion in `wms_jobs` RLS** | The WMS job policy reads assignments while the assignment policy reads WMS jobs | `/migrations/`, live RLS policies | Break the policy cycle with a private, actor-scoped assignment helper; keep country/site predicates on the job row |
| **PICK completes but PACK is missing (403 on `wms_jobs`)** | Browser insert of the chained PACK row is rejected by WMS row-level security | `create_pack_job_after_completed_pick` migration, `services/wms-jobs.service.ts`, `components/fulfillment/useJobCompletion.ts` | Use the authenticated, idempotent PICK-to-PACK RPC; verify that the completing employee and site/country scope match |
| **Points audit 403 after supervisor completes PACK** | Audit insertion was CEO-only while manager totals were writable; separate writes left a partial award | `services/gamification.service.ts`, `contexts/GamificationContext.tsx`, supervised points migration | Use `record_worker_points_award` to save totals and audit together under manager/site RLS. Verify job completion/employee attribution; inspect existing totals before replaying an old completion |
| **Mobile warehouse user redirected to POS before site loads** | Mobile route fallback assumed an unresolved site was a store | `utils/roleDashboard.ts`, `components/ProtectedRoute.tsx` | Choose a permitted operational route from both role and available site information; retain POS denial for warehouse staff |
| Driver arrival appears received, or a receiver sees duplicate handoff updates | Arrival and destination acceptance were mixed, or the client repeated database-owned linked-record updates | `hooks/useShipmentWorkflow.ts`, `components/fulfillment/transfer/TransferReceiving.tsx`, shipment handoff migrations | Log driver arrival first; accept at the authorized destination site after inspection. The database updates the linked transfer in the same transaction. |
| Destination worker can inspect expected transfer quantities in the API payload | Quantities remained in public WMS/transport JSON even though the screen masked them | `migrations/20261019_private_transfer_receipt_manifest.sql`, transfer receipt RPCs | Keep the arrival manifest in `private.transfer_receipt_manifests`; public arrived rows should contain product identity only, while the count RPC compares against the restricted snapshot. |
| Blind count restarts or expected quantity appears in count review | Count session was stored only in React state or client code calculated the variance | `components/fulfillment/CountTab.tsx`, `services/wms-counts.service.ts`, `migrations/20261019_secure_persisted_wms_counts.sql` | Resume the site-scoped server session. The database withholds expected quantities and requires a different authenticated employee for a configured recount. Submit variances as pending HQ requests. |
| Store transfer receipt requires another employee or a driver co-signature | The receipt workflow treated independent accountability as a multi-person recount | `components/fulfillment/transfer/TransferReceiving.tsx`, `components/fulfillment/transfer/CustodyHandshakeModal.tsx`, `migrations/20261019_single_receiver_transfer_accountability.sql` | Let one authorized receiver submit a blind count and accept custody; persist their identity and record any variance without blocking acceptance on another person. |
| POS transfer receipt logs product insert 403 or `Independent destination receipt verification is required` | `addProduct()` can return `undefined` after RLS denial, and the POS path did not record the receiver's count before marking the WMS job complete | `components/pos-command/hooks/utils/receivingIntake.ts`, `components/pos-command/hooks/usePOSReceiving.ts`, transfer receipt RPC | Require a persisted destination product before counting stock intake as successful. Record the count through `record_transfer_receipt_count` before completion; if the product is unavailable, stop receipt and ask an inventory administrator to add it. |
| Pack quantity copies the target, or a required seal can be skipped | Scanner prefilled the count or the client-only seal toggle controlled completion | `components/fulfillment/pack/PackScanner.tsx`, `components/fulfillment/pack/PackJobModal.tsx`, `migrations/20261019_guard_pack_completion_attestation.sql` | Enter the observed carton count; Postgres validates every line and required seal before a PACK job can complete. |

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
| **403 on `system_logs` insert** | Audit actor is a display name instead of the signed-in user or employee ID | Audit trigger and `system_logs` insert policy | Bind `performed_by` from the verified auth identity in a BEFORE INSERT trigger; keep site scope enforced |
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
