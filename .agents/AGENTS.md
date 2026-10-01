# SIIFMART AI Agent Rules

> All AI assistants working on this project MUST follow the rules in `.agent/RULES.md`.

## Before ANY Code Change
1. Run `git status` — warn if there are uncommitted changes
2. Check if the file you're editing exceeds 500 lines — if so, **split it first**
3. Verify changes compile: `npx tsc --noEmit`

## Rule Compliance Checks (EXHAUSTIVE — No Exceptions)
> **MANDATORY BEHAVIOR**: When asked to check, review, audit, or validate any code, feature, logic, component, hook, service, migration, or implementation against project rules — you MUST check against **EVERY single rule** in this document and in `.agent/RULES.md`.

1. **No Selective Rule Application**: Do NOT pick only the rules that appear contextually relevant to the feature being reviewed. ALL rules apply to ALL code at ALL times.
2. **Full Checklist Required**: For each distinct rule section (Zero-Trust, Multi-Country, Anti-Hacking, Critical Patterns, Don'ts, File Size, Architecture, State Management, Testing), explicitly verify whether the code under review passes or fails.
3. **Report Every Violation**: Surface all violations — including minor, partial, or indirect ones. Do not silently ignore a rule just because it is tangentially related.
4. **Blocked Until All Rules Pass**: Do not declare a feature "compliant" or "complete" until it has been verified against every rule without any outstanding failures.
5. **Audit Trail for Reviews**: When producing a compliance report, list each rule category as a header and mark it ✅ PASS or ❌ FAIL with a specific reason.
6. **Mandatory Logic Config-Gating Audit**: For every piece of business logic, workflow behavior, validation rule, or operational threshold created or reviewed, explicitly verify: **"Does this logic need a setting to control it?"** Any hardcoded behavior that could vary by country, branch, or operational policy without a configurable setting in the appropriate settings panel is a direct failure.
7. **Strict Country Setting Separation Audit**: Explicitly verify that every setting created, modified, or consumed is 100% separated and isolated per country (`country_code`). A setting configured for one country (e.g., ET) MUST NEVER bleed, apply to, or alter behavior in another country (e.g., KE).
8. **Single Global Country Switch (CEO-Only) & Invisible Tenancy Audit**: Explicitly verify that country switching is NEVER created or duplicated inside individual settings screens, tabs, or cards. Choosing between countries is done exclusively by the CEO through **ONE single global toggle/selection** in the central top navigation. All other users must see the application purely as a seamless, native national platform without any tenant switcher widgets, partition pickers, or country selector banners. The system MUST maintain 100% separation automatically in the background.
9. **Mandatory In-Chat SQL Delivery Audit**: Explicitly verify that whenever ANY SQL migration, table, column, index, RPC function, or RLS policy is created or modified while coding, the complete, runnable, copy-pasteable SQL snippet is delivered directly into the chat response every single time so the user can easily copy and execute it in Supabase SQL Editor. Never silently create or modify migration files without bringing the complete SQL into the chat.

## Zero-Trust & Ethiopia HQ Central Oversight Model
> **Operating Environment**: Distributed retail branches and warehouse hubs across Ethiopia (Addis Ababa, Dire Dawa, Adama, Harar, etc.).
> **Core Principle**: Branch managers and staff are **NOT trusted**. All high-risk actions, cash flows, inventory changes, and daily reconciliations are **strictly monitored, audited, and approved from HQ**.

1. **Zero Autonomous Branch Authority**:
   - Branch managers and cashiers CANNOT unilaterally adjust stock, write off shrinkage, approve large refunds, void sales, alter product prices, or create discount rules.
   - All stock adjustments MUST go through `inventory_requests` for **HQ approval**.
2. **Mandatory Daily HQ Cash & Shift Reconciliation**:
   - Shift opening floats, mid-day cash drops, and end-of-day (EOD) Z-Reports MUST sync to Supabase in real time — **never store shifts in localStorage**.
   - HQ Finance/Audit must daily review and sign off on branch drawer reconciliation (Cash + Telebirr + CBE Birr).
3. **4-Eyes Principle (Dual-Control)**:
   - High-risk operations (refunds, voids, cash drawer kicks without sale, discrepancy resolutions) require dual sign-off (Cashier + Manager or Branch + HQ OTP).
4. **Blind Audits & Receiving**:
   - Stock counts and inbound transfer receiving MUST be **blind** (system expected quantity hidden from branch staff to eliminate rubber-stamping and fraud).
5. **Tamper-Proof Audit Trail**:
   - Every sensitive event (drawer open, void, price lookup, count variance) must log to `system_logs` in Supabase with timestamp, employee ID, site ID, device ID, and GPS coordinates.
6. **Strict Site Scoping**:
   - Branch staff must NEVER see cross-site inventory counts, supplier costs, central margins, or other branches' performance.

## Multi-Country Tenant Isolation & National Sovereignty Model
> **Operating Reality**: SIIFMART operates across multiple sovereign East African nations (Ethiopia HQ `ET`, Kenya Hub `KE`, and extensible to Uganda `UG`, Rwanda `RW`, Tanzania `TZ`).
> **Core Principle**: **One Platform, Distinct National Realities**. Absolute data isolation across countries. Zero cross-border data bleeding.

### 1. Enterprise Architecture: Absolute Multi-Country Data Separation
- **Zero Cross-Country Data Leakage**: Dashboards, sales KPIs, gross profit, stock counts, orders, shifts, and employee rosters in Kenya must **NEVER** mix, display, or aggregate Ethiopian data (and vice-versa).
- **Zero Arithmetic Cross-Addition**: Under no circumstances may 1,000 ETB and 1,000 KSh be added together into a single sum.
- **Non-CEO Staff Lockdown**: Cashiers, store managers, pickers, and drivers are hard-pinned to their assigned site's country via `getUserCountry()`. Any attempt to tamper with client storage, URL parameters, or network payloads to view another country is blocked.
- **Executive Dual-Oversight (CEO / Super Admin Only)**: Only the `CEO` or `super_admin` can switch country instances (`canSwitchCountry()`). When switching, the entire application context (sites, active facility, products, sales, orders, employees) cleanly re-hydrates to that country.
- **Physical Facility & Intra-Country Movement**: All facilities (Stores, Warehouses, Distribution Centers) are bound to one country. Standard stock movements are intra-country only; cross-border movements require international import/export customs clearance.
- **Legacy Baseline & New Country Guarantee**: All historical data defaults to Ethiopia (`ET`). Any new country added starts 100% fresh as an isolated tenant with zero code refactoring.

### 2. Merchandising Separation Rules
- **National Assortment & Catalog Scope**: While a global barcode or SKU reference may exist in the master library, products are only sellable and visible if active for that country's sites. POS and inventory lookups never leak other countries' products.
- **National Price Sovereignty**: Retail prices are explicitly entered and maintained in local currency (**`KSh`** in Kenya, **`ETB`** in Ethiopia). Never auto-convert retail shelf prices across borders using live exchange rates.
- **Zero Autonomous Price Changes**: Branch managers and cashiers have zero authority to alter prices or create custom discounts. All markdowns require HQ approval.
- **Campaign & Voucher Isolation**: Promotional campaigns (e.g. Mashujaa Day vs Enkutatash) and discount vouchers are country-bound. Kenyan vouchers return "Invalid code" at Ethiopian registers.
- **Perishable Markdowns & Forecasting**: Perishable markdown schedules and AI demand forecasting models train and execute exclusively on local country sales history.

### 3. Settings & System Configuration Separation Rules
- **100% Country-Level Setting Isolation**: EVERY SINGLE setting in the system (POS terminal logic, WMS inbound/health/outbound policies, inventory thresholds, tax rates, tender gateways, receipt formats, shift targets, approval limits) MUST be strictly separated and isolated per country.
- **Zero Cross-Country Setting Bleed**: Any setting set for one country MUST NEVER apply to, affect, or override another country. There is no concept of a "shared global operational setting" across national borders.
- **Per-Country Database Scoping**: All configuration records in `system_config` or dedicated setting stores must be partitioned/keyed by `country_code` (e.g., `ET`, `KE`, `UG`). Queries and mutations must always be explicitly scoped to the active country.
- **National Fiscal & Tax Compliance**: Distinct tax authorities (`KRA` 16% VAT vs `ERCA` 15% VAT vs `URA` 18% VAT), national tax ID formats (KRA PIN vs TIN), and local timezones (`Africa/Nairobi` vs `Africa/Addis_Ababa`).
- **Tender & Gateway Segregation**: M-Pesa / Airtel Money strictly for Kenya; Telebirr / CBE Birr strictly for Ethiopia; MTN MoMo for Uganda. POS checkout options strictly hide foreign tenders.
- **Receipt & Invoicing Templates**: Receipts format exclusively with the local currency symbol (**`KSh`**, **`ETB`**, **`USh`**), local tax ID, local support phone (`+254` vs `+251`), and fiscal QR compliance footers.
- **Facility Country Immutability**: Facility `country` is required on creation and permanently locks the site's operating market and accounting ledger.
- **Administrative Access Boundaries**: Branch staff are limited to local peripheral settings (printers, scanners) and strictly locked out of corporate localization, tax rates, and gateway credentials.

### 4. Architecture: Multi-Country SKU & Merchandising Strategy
- **Different Country, Different SKU Pattern**:
  - Country-prefixed namespace: `ET-[CAT][SEQ]` for Ethiopia, `KE-[CAT][SEQ]` for Kenya, `UG-[CAT][SEQ]` for Uganda (e.g. `KE-FR001`, `ET-BV004`).
  - Guarantees zero database collision and provides instant physical identification on shipping labels and box tags.
  - Cross-Border Scanner Rejection: Scanning an Ethiopian item (`ET-BV002`) at a Kenyan POS or WMS Putaway dock instantly halts with *"Foreign SKU Detected: Item belongs to Ethiopia market."*
- **Similar Strategy (Universal Engine)**:
  - Universal category taxonomy (`FR`, `DY`, `MT`, `BV`, `SN`, `CL`, etc.).
  - Universal sequential generation logic (`Max + 1` calculated independently per national catalog).
  - Universal FEFO (First-Expired, First-Out) rotation and batch expiry tracking.
  - Universal margin protection formulas (Landed Cost + Target Margin % = Base Retail).
  - Universal markdown ladders (T-3 days: 10% off; T-1 day: 25% off; Expiry: 50% off).

### 5. Config-First Architecture: Mandatory Logic Controllability
- **Config-Gating Requirement**: Whenever creating or auditing ANY business logic, operational workflow, threshold, or policy in the system (WMS receiving/putaway/picking, POS checkout/returns/shifts, inventory valuation, stock adjustments, pricing rules), you MUST evaluate: **"Does this logic need a setting to control it?"**
- **No Hardcoded Policies**: Hardcoding behavioral rules (e.g. blind count vs verified count, guest checkout allowed, negative stock blocking, mandatory expiry, shift target revenue, QC sample rates) without a controlling setting in the appropriate country configuration panel is strictly prohibited.
- **Country-Scoped Setting Provisioning**: When introducing a new setting to control logic, the setting must be provisioned across all country configuration schemas with appropriate country-specific defaults.

### 6. Single Global Country Switch & Invisible Multi-Tenancy Architecture
- **Zero Per-Screen Country Selectors**: We do NOT create country selection chips, dropdowns, or partition switcher banners inside individual settings pages or tabs (POS settings, WMS settings, Inventory settings, General settings).
- **Single Global Switch (CEO / Super Admin Only)**: Choosing between countries is performed exclusively by the CEO/Super Admin via **ONE central toggle/selection** in the global application header. When selected (e.g. Kenya `KE`), the entire system cleanly re-hydrates globally — all settings, facilities, dashboards, and inventories immediately reflect that country's tenant.
- **Invisible Tenancy for Branch Staff & Clean Native Experience**: Non-CEO users (cashiers, store managers, pickers, drivers, branch accountants) must NEVER see country pickers, partition banners, or multi-tenant switches anywhere. To each user, the application is presented 100% as a native, single-nation system (e.g., fully Kenyan website for Kenyan branches). A user should not see or be aware of whether they are using a Kenyan or Ethiopian tenant.
- **Automatic 100% Background Separation**: All settings panels, hooks, and services MUST enforce 100% data and setting separation automatically in the background. Settings pages automatically read from and write to the active country's partition (`countryConfigs[targetCountry]`) without requiring the user to manually target a country or choose between tenants in the form UI.

## Anti-Hacking & Cybersecurity Defense Rules
1. **Never Trust the Client (Server-Enforced RLS)**:
   - Security cannot rely on React state, UI buttons, or route guards alone. Every table in Supabase MUST have Row Level Security (RLS) enabled.
   - Any user querying Supabase with the `anon` key must be strictly constrained by RLS checking `auth.uid()`, `site_id`, and `role`.
2. **Zero Hardcoded Secrets & Service-Role Isolation**:
   - NEVER commit passwords, test credentials, master PINs, or private API keys (Telebirr, CBE Birr) to client code or git.
   - The frontend bundle must ONLY hold the public `anon` key. Privileged operations and the `service_role` key must ONLY exist in secure Supabase Edge Functions.
3. **Financial & Price Tamper-Proofing**:
   - Prevent DevTools / network price tampering: Product unit prices, sub-totals, and discounts must be verified against server catalog records — never blindly trust client-submitted prices on sale completion.
4. **Input Sanitization, Mass-Assignment & XSS Defense**:
   - Validate all mutation inputs using strict Zod schemas before database writes.
   - Prevent mass-assignment: Service `update()` methods MUST use explicit column allowlists — never `{ ...object }`.
   - Prevent XSS: Never render raw user strings in `dangerouslySetInnerHTML`. Sanitize all receipt HTML templates.
5. **Session Hardening & Brute-Force Defense**:
   - Enforce rate-limiting and lockouts on failed login attempts and cashier PIN entries.
   - Staff PINs must be cryptographically hashed; never store PINs or passwords in plaintext.

## Critical Patterns
- **Zero-Trust Persistence**: Never store shifts, permissions, discounts, or financial data in `localStorage` — always persist to Supabase with RLS.
- **Mutations**: Always use hooks in `/hooks/` — never call services directly from components.
- **Approval Workflows**: Stock adjustments, credit refunds, and price changes must create pending request records for HQ approval.
- **Data Reading**: `useData()` for cached data, `useStore()` for session state, `useQuery` for fresh server data.
- **Site Scoping**: Always filter by `siteId` — never show cross-site or HQ-only data to branch users.
- **Error Handling**: Services throw errors, hooks catch with `onError` + toast — never swallow errors.
- **Logging**: Use `logger` from `/utils/logger.ts` and write security-relevant actions to `system_logs`.
- **Error Boundaries**: New page routes MUST be wrapped in `<ModuleErrorBoundary moduleName="X">`.
- **Field Mapping**: Service `update()` methods MUST use explicit allowlists — never `{ ...object }` to Supabase.
- **DB Schema Registry**: Always verify columns against `/schemas/db-schema.md` — never trust migration files blindly.
- **RLS-Aware Queries**: Never chain `.select('*')` after `.insert()` — it triggers SELECT RLS and can cause 403.
- **Probe-First Debugging**: On any Supabase 400/403, probe live schema FIRST before editing code (see TROUBLESHOOTING.md).
- **Design Tokens**: Use sand/emerald/amber palette (`#2C5E3B`, `#EAE5D9`, `amber-600`) — not old `cyber-*` tokens.
- **Mobile-First (POS/WMS)**: No `backdrop-blur` on scrollable elements, no `transition-all`, only animate `transform`/`opacity`, min 44px touch targets.
- **Config-Gating**: Every business rule, workflow toggle, or operational threshold must be evaluated for setting controllability — never hardcode operational policies.
- **Country Setting Isolation**: All settings queries, hooks, and mutations must be scoped to the active country (`country_code`). Never read, write, or merge cross-country settings.
- **Invisible Tenancy & Background Isolation**: Settings pages must never render per-screen country selectors. All setting reads and writes must automatically target the active country tenant in the background. Country switching is restricted exclusively to ONE central global switch accessible only to the CEO.
- **Mandatory In-Chat SQL Delivery**: Whenever creating or editing ANY database migration, table, column, index, RPC function, or RLS policy, you MUST bring the complete, runnable, copy-pasteable SQL snippet directly into the chat response every single time so the user can easily copy and execute it in Supabase SQL Editor. Never silently create or modify migration files without delivering the full runnable SQL in the chat.


## File Size Limit (ENFORCED)
No file may exceed **500 lines**. Before editing a large file, split it using these patterns:
- Modals → separate component files
- Tab content → separate component files
- Forms > 100 lines → extracted components
- Shared logic → hooks or utils

## Architecture
```
/pages/          → Full-page route components (lazy-loaded)
/components/     → Reusable UI components
/contexts/       → React contexts (CentralStore, DataContext, LanguageContext)
/hooks/          → Custom React hooks (mutations, queries)
/services/       → Supabase API layer (*.service.ts)
/types.ts        → TypeScript interfaces & types
/utils/          → Pure helper functions (NO hooks)
/schemas/        → Zod validation schemas
/migrations/     → SQL schema migrations
/tests/          → Unit tests (Vitest) and e2e tests (Playwright)
/scratch/        → Temporary debug/test scripts (NOT production code)
```

## State Management
| State Type | Tool |
|-----------|------|
| Server data (read) | React Query `useQuery` |
| Server data (write) | `useMutation` hook in `/hooks/` |
| Cached data | `useData()` from DataContext |
| Auth / session | `useStore()` from CentralStore |
| Shared UI (3+ consumers) | React Context |
| Local UI (1-2 components) | `useState` / `useReducer` |
| Form state | React Hook Form + Zod |

## Testing Requirements
- New services → unit tests in `/tests/services/`
- New utils → unit tests in `/tests/utils/`
- Bug fixes → regression test proving the fix
- Run before commit: `npx vitest run` and `npm run lint:size`

## Don'ts
- ❌ Don't trust branch managers or staff with autonomous stock/price/discount overrides (enforce HQ approval)
- ❌ Don't store shifts, cash reconciliations, permissions, or discounts in `localStorage`
- ❌ Don't show expected quantities during cycle counts or transfer receiving (enforce blind counting)
- ❌ Don't allow soft-deletes or silent deletion of transaction, shift, or audit logs
- ❌ Don't hardcode passwords, test accounts, master PINs, or API keys in client code
- ❌ Don't trust client-supplied unit prices or totals without server catalog verification
- ❌ Don't rely on frontend route guards for security — enforce RLS on every DB table
- ❌ Don't use `dangerouslySetInnerHTML` with unsanitized user content
- ❌ Don't expose the Supabase `service_role` key to frontend bundles
- ❌ Don't let any file exceed 500 lines
- ❌ Don't call services directly for mutations (use hooks)
- ❌ Don't skip role checks or allow cross-site data exposure
- ❌ Don't hardcode site IDs or credentials
- ❌ Don't use `any` type
- ❌ Don't use raw console.log — use `logger` from `/utils/logger.ts`
- ❌ Don't put hooks in /utils/
- ❌ Don't add DB columns without a migration file
- ❌ Don't silently swallow errors
- ❌ Don't add new page routes without `ModuleErrorBoundary`
- ❌ Don't skip writing tests for new services/utils
- ❌ Don't spread full objects into Supabase — use explicit column allowlists
- ❌ Don't add a TS field without updating the service mapper + allowlist
- ❌ Don't use old `cyber-*` design tokens — use sand/emerald/amber palette
- ❌ Don't chain `.select('*')` after `.insert()` — use insert-only or explicit columns
- ❌ Don't trust migration files as ground truth — verify against `/schemas/db-schema.md`
- ❌ Don't fix Supabase column errors one-by-one — probe ALL columns first, fix in one pass
- ❌ Don't mix data or KPIs across countries (e.g. never display Ethiopian metrics on a Kenyan dashboard)
- ❌ Don't auto-convert retail shelf prices between countries using live exchange rates
- ❌ Don't allow non-CEO staff to view or switch to another country (enforce branch lockdown)
- ❌ Don't generate new SKUs without the active country prefix (`ET-`, `KE-`, `UG-`, etc.)
- ❌ Don't allow cross-border tender processing (e.g. M-Pesa in Ethiopia or Telebirr in Kenya)
- ❌ Don't perform selective rule checks — when asked to validate any code or logic, check against EVERY rule in this document, not just the ones that seem contextually relevant
- ❌ Don't hardcode operational business logic, thresholds, or workflow behaviors without a configurable setting to control them
- ❌ Don't allow any setting to apply across multiple countries — every single setting must be 100% separated per country
- ❌ Don't mutate or fetch system settings without passing the active country scope (`country_code`)
- ❌ Don't add country selectors, dropdowns, or partition switcher banners inside individual settings pages or tabs (country switching belongs ONLY in the central CEO global switch)
- ❌ Don't expose tenancy selection or multi-tenant mechanics to non-CEO branch users (the application must render seamlessly as a native national platform)
- ❌ Don't require users to manually target a country when configuring settings — the system must automatically bind and isolate settings per active country in the background
- ❌ Don't create or modify SQL migrations without bringing the complete, runnable SQL to the chat for the user to run in Supabase

## References
- Full rules: `.agent/RULES.md`
- Troubleshooting: `.agent/TROUBLESHOOTING.md`
- Feature registry: `.agent/FEATURE_REGISTRY.md`
