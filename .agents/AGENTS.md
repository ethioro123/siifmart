# SIIFMART AI Agent Rules

> Always-loaded summary. `.agent/RULES.md` is the canonical index; read its focused guides as relevant. For UI work, consult `docs/APPLE_DESIGN_GUIDE.md`.

## 1. Workflow (every task)
1. **Inspect**: check `git status --short` before code changes; preserve unrelated work. Read the target and relevant patterns in focused sections when practical.
2. **Verify**: confirm database columns/types from the schema registry, generated types, or live schema before changing queries. Diagnose from evidence.
3. **Split before changing**: split a target over 500 lines before changing behavior, preserving imports and functionality.
4. **Verify code changes**: run `npx tsc --noEmit` and relevant regression checks; report anything that could not be run.
5. **Auto-commit changes**: once checks pass, automatically stage the files changed for the task (never staging secrets/env files or unrelated pre-existing work unless requested) and commit locally with a clear Conventional Commits message. Do not `git push` unless explicitly asked.
6. **Report clearly**: explain the user-visible result, verification, and commit hash in plain English without code dumps. Give a full audit checklist only when requested or needed.

## 2. Invariants (never violate)

### Multi-country sovereignty
- Kenya (`KE`) and Ethiopia (`ET`) data never query, merge, or cascade across borders (dashboards, stock, sales, shifts, synaptic signals).
- Never convert or sum ETB and KES. SKU prefixes use the active country (`ET-`, `KE-`, etc.); shelf prices remain independent.
- Country switching only via the single CEO-only top-nav switch (`canSwitchCountry()`); others locked via `getUserCountry()`. No per-screen country pickers or tenant banners; tenancy is automatic via `country_code`.
- **Tax**: `taxOnPurchasing` and `taxOnSelling` default `false`. Editable only in Finance settings, never in Procurement or POS. Tax must not appear there unless enabled for the active country.

### Zero-trust and anti-fraud
- Stock edits, write-offs, voids, price changes need HQ approval (`inventory_requests`).
- Shift float, drops, Z-Reports sync to Supabase in real time; never `localStorage`.
- 4-eyes: voids, large refunds, drawer kicks need Cashier + Manager/HQ OTP.
- Blind counts and blind transfer receiving (hide expected quantities).
- High-risk events are auditable with actor, action, target, time, and required reason. Collect device/location context only when justified; treat client-provided signals as untrusted and minimize retention.
- Branch users only see their active `siteId`.
- Propagate mutations only to systems that depend on the event. Use explicit event contracts, idempotency, retries, and country-scoped correlation; avoid speculative fan-out.

### Operations and catalog
- Floor roles (`picker`, `packer`, `receiver`, `inventory_specialist`, `forklift_operator`, `stock_clerk`) and `driver` are interchangeable on internal jobs (`PICK`, `PACK`, `RECEIVE`, `PUTAWAY`, `COUNT`, `TRANSFER`, `REPLENISH`, `WASTE`, `RETURNS`, `LABELS`). `DRIVER`/`DELIVERY`/`DISPATCH` jobs are locked to verified drivers.
- Transfers use dual handshake (driver co-sign on discrepancy); unrecorded variance is the receiver's liability.
- Halal catalog: no liquor, beer, wine, or spirits anywhere (catalog, mocks, examples). Use cooking oil, baby formula, coffee, etc.

### Database and RLS
- **Rule 9 (Persistent Migration File is Paramount & Execution Status)**: creating a permanent, version-controlled file in `migrations/YYYYMMDD_<name>.sql` for ANY SQL created or modified is strictly mandatory and takes precedence over in-chat snippets. Never write or propose SQL without saving it to disk first; ALSO paste the same runnable SQL in chat. **Execution Status**: explicitly inform the user whether the SQL migration has already been applied/run in the database or still requires manual execution in Supabase.

### Egress efficiency (Rule 10)
- Lists/history use bounded pagination; 25 records is a reasonable initial default, adjusted for row size, device, and measured cost.
- Defer history/archive/audit queries until needed; show the active working set on entry.
- No naked `.select('*')`; select needed columns; load `line_items`/`po_items`/`sale_items` only when a single record is opened.
- Scope branch queries by `siteId` + `country_code`; privileged aggregation requires explicit server-side authorization.
- No domain data on app mount (WMS jobs -> Fulfillment, audit logs -> Admin Telemetry). Prune unused global queries.
- Invalidate only affected query keys. Choose cache lifetimes based on data volatility; avoid blind polling and prefer supported realtime events or explicit refresh.

## 3. UI standards
- Consult relevant sections of `docs/APPLE_DESIGN_GUIDE.md` and reuse established UI patterns.
- Use semantic theme tokens; verify contrast, focus, keyboard/touch access, zoom, and reduced motion as relevant.
- Use Lucide consistently; don't rely on color alone or use emoji as interface decoration.
- Use glass only when it helps floating controls and provide a solid fallback. Keep dense/repainting content simple.
- All modules must be responsive; Fulfillment scanning has the strictest low-end device constraints.
- Security, business, and accessibility requirements take precedence over visual styling.


## 4. Code standards
- **500-line maximum.** Split large files before changing behavior. Pages in `/pages/` are lazy and wrapped in `<ModuleErrorBoundary>`; reusable UI is in `/components/`.
- Writes go through custom hooks in `/hooks/`, never services directly from UI. Reads: `useQuery` (server), `useData()` (cache), `useStore()` (auth/session).
- `/utils/` = pure functions, no hooks. Types in `/types/` or `/types.ts`; never `any`.
- Log with `logger` from `/utils/logger.ts`, never `console.log`.
- Match existing patterns before adding abstractions. Profile before memoizing or virtualizing; choose thresholds from real data and device behavior.
