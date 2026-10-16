# SIIFMART AI Agent Rules

> Always-loaded, kept short on purpose. Details live in on-demand docs: UI -> `docs/APPLE_DESIGN_GUIDE.md`; deep background -> `.agent/RULES.md` (read only when a task needs it, never in full).

## 1. Workflow (every task)
1. **Plan small**: restate nothing; locate the target with `grep_search` first, then read slices (< 80 lines, `StartLine`/`EndLine`). Never read a whole 400+ line file.
2. **Check state**: `git status -s` once at session start; warn about uncommitted work before large edits.
3. **Verify, don't guess**: confirm DB columns/types via `information_schema.columns` or `types/` before writing queries/mutations; confirm function signatures via grep before calling. Diagnose from logs/types, no blind iterative patches.
4. **Split before growing**: target file > 500 lines -> extract modals/tabs/hooks first, then change behaviour.
5. **Done = green**: `npx tsc --noEmit` clean, plus targeted `npx vitest run <path>` for touched logic. Full suite only at milestones.
6. **Report in plain English (no code dumps)**: when finished, do NOT output technical code, internal file paths, or line diffs. Provide clear, easily understandable information about what was worked on, what changed for users/managers, and how it behaves. Full audit checklist only on explicit `/audit`.

## 2. Invariants (never violate)

### Multi-country sovereignty
- Kenya (`KE`) and Ethiopia (`ET`) data never query, merge, or cascade across borders (dashboards, stock, sales, shifts, synaptic signals).
- Never convert or sum ETB and KES. SKU prefixes `ET-` / `KE-`; shelf prices independent.
- Country switching only via the single CEO-only top-nav switch (`canSwitchCountry()`); others locked via `getUserCountry()`. No per-screen country pickers or tenant banners; tenancy is automatic via `country_code`.
- **Tax**: `taxOnPurchasing` and `taxOnSelling` default `false`. Editable ONLY in Settings (Finance), never in Procurement or POS. Tax must not appear in POS/Procurement unless enabled in Settings.

### Zero-trust and anti-fraud
- Stock edits, write-offs, voids, price changes need HQ approval (`inventory_requests`).
- Shift float, drops, Z-Reports sync to Supabase in real time; never `localStorage`.
- 4-eyes: voids, large refunds, drawer kicks need Cashier + Manager/HQ OTP.
- Blind counts and blind transfer receiving (hide expected quantities).
- High-risk events -> `system_logs` (timestamp, employee ID, site ID, device ID, GPS). Supervisory actions also record `managerId`, role, GPS, reason code; shift variances co-attributed to the supervisor.
- Branch users only see their active `siteId`.
- Mutations propagate to connected nodes (POS sale -> FEFO depletion -> replenishment -> margin -> gamification -> CentralOps); no dead-end mutations.

### Operations and catalog
- Floor roles (`picker`, `packer`, `receiver`, `inventory_specialist`, `forklift_operator`, `stock_clerk`) and `driver` are interchangeable on internal jobs (`PICK`, `PACK`, `RECEIVE`, `PUTAWAY`, `COUNT`, `TRANSFER`, `REPLENISH`, `WASTE`, `RETURNS`, `LABELS`). `DRIVER`/`DELIVERY`/`DISPATCH` jobs are locked to verified drivers.
- Transfers use dual handshake (driver co-sign on discrepancy); unrecorded variance is the receiver's liability.
- Halal catalog: no liquor, beer, wine, or spirits anywhere (catalog, mocks, examples). Use cooking oil, baby formula, coffee, etc.

### Database and RLS
- **Rule 9 (Persistent Migration File is Paramount & Execution Status)**: creating a permanent, version-controlled file in `migrations/YYYYMMDD_<name>.sql` for ANY SQL created or modified is strictly mandatory and takes precedence over in-chat snippets. Never write or propose SQL without saving it to disk first; ALSO paste the same runnable SQL in chat. **Execution Status**: explicitly inform the user whether the SQL migration has already been applied/run in the database or still requires manual execution in Supabase.

### Egress efficiency (Rule 10)
- Lists/history default to **25 records**; more via pagination or "Load More".
- **No eager history** on login/mount: boot with live/active data only; history/archive/audit queries fire only when the user opens that tab, max 25 rows.
- No naked `.select('*')`; select needed columns; load `line_items`/`po_items`/`sale_items` only when a single record is opened.
- Branch staff queries scoped by `siteId` + `country_code`; global fetch only for `super_admin`, `CEO`, `Admin`, `Auditor`.
- No domain data on app mount (WMS jobs -> Fulfillment, audit logs -> Admin Telemetry). Prune unused global queries.
- Invalidate only the affected query key. TanStack Query with `staleTime` 10-30 min for rosters/suppliers. Never `setInterval` DB polling; use events or websockets.

## 3. UI standards
- **Before any UI work** read the relevant sections of `docs/APPLE_DESIGN_GUIDE.md` (type scale, radius ladder, glass tiers, icons, controls, checklist). Read only the sections you need.
- Tokens only: use `styles/theme.css` vars (`--theme-bg-app`, `--theme-bg-card`, `--theme-text-primary`, `--theme-border`); no raw hex/font/shadow in components.
- Palette: dark = pure `#000000` canvas with `#1D1D1F` surfaces; light = `#F5F5F7` canvas with `#FFFFFF` surfaces; single accent `#0071E3` / `#2997FF`. Secondary text never below 0.70 opacity. No muddy grey cards (`#2C2C2E`).
- Glass only on the floating layer (top bar, sidebar, toolbars, modals/sheets). Never on cards or tables.
- Icons: Lucide only, 14px inline/badge, 16px button/input, 20px header. **Zero emojis** in UI and logs.
- Brand: logo is the `components/Logo.tsx` wordmark only (`SIIF` neutral, `MART` green `#2C5E3B` light / `#00FF9D` dark), no icon container.
- No decorative gradients, glow blobs, or multi-colour progress bars; no boxes-inside-boxes.
- **Fulfillment only** (`pages/Fulfillment.tsx`, `components/fulfillment/`): low-end Android mode (no blur, solid backgrounds, `touch-action: manipulation`, no heavy animation). Everything else gets full Liquid Glass.
- On conflict, this file beats the design guide.
- Don't hardcode aesthetic styling (raw hex colors, font families, static card fills, fixed borders, or shadows).
- Don't use raw Unicode emojis (e.g. ⚠️, 🔒, •, ✅, ❌, 🎉, 📦, 🏷️, ⚖️, ⚡️) anywhere in the UI.
- Don't review, create, or edit code in any domain (e.g. Procurement, Financials, WMS, POS, HR) without simultaneously verifying.
- Don't allow the design system or UI components to drift or lag behind Apple's latest aesthetic standard.
- Don't use muddy gray cards (#1C1C1E / #2C2C2E).
- Don't treat interfaces as a "collection of boxes" or card traps.
- Don't place Liquid Glass materials everywhere.


## 4. Code standards
- **< 500 lines per file.** Pages in `/pages/` (lazy, wrapped in `<ModuleErrorBoundary>`); reusable UI in `/components/`.
- Writes go through custom hooks in `/hooks/`, never services directly from UI. Reads: `useQuery` (server), `useData()` (cache), `useStore()` (auth/session).
- `/utils/` = pure functions, no hooks. Types in `/types/` or `/types.ts`; never `any`.
- Log with `logger` from `/utils/logger.ts`, never `console.log`.
- Match existing patterns: grep for a similar component/hook and mirror it before inventing a new one.
