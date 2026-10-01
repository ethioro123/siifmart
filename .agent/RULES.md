# SIIFMART AI Development Rules

> These rules guide AI assistants in developing SIIFMART consistently and correctly.

## Architecture Overview

```
/pages/          → Full-page components (routes) — always lazy-loaded
/components/     → Reusable UI components
/contexts/       → React contexts (CentralStore, DataContext, LanguageContext)
/hooks/          → Custom React hooks (mutations, queries)
/services/       → Supabase API layer (*.service.ts)
/types.ts        → All TypeScript interfaces and types
/utils/          → Pure helper functions (NO hooks here)
/schemas/        → Zod validation schemas
/migrations/     → SQL schema migrations
/tests/          → Unit tests (Vitest) and e2e tests (Playwright)
/scratch/        → Temporary debug/test scripts (NOT production code)
/scripts/        → Build/CI scripts (check-file-size.sh, etc.)
```

---

## Core Patterns

### Data Mutations
- **All data modifications MUST use React Query mutation hooks** in `/hooks/`
- Never call service functions directly from components for writes
- Mutations auto-invalidate related queries

```typescript
// ✅ Correct
const mutation = useAdjustStockMutation();
await mutation.mutateAsync({ productId, quantity, direction: 'IN', ... });

// ❌ Wrong - Direct service call
await productsService.update(id, { stock: newStock });
```

### Data Reading
- Use `useData()` from DataContext for cached data (products, customers, etc.)
- Use `useStore()` from CentralStore for user/session state
- Use React Query `useQuery` for fresh server data

### Site Filtering
- Most data is site-scoped via `siteId`
- HQ/CEO views use `siteId === null` or aggregate across sites
- Always check `products.filter(p => p.siteId === currentSiteId)`

### Config-First Architecture & Controllability
- **Whenever creating or auditing ANY logic in the system**, check: **"Does this logic need a setting to control it?"**
- Operational thresholds (e.g. low stock levels, shift revenue targets, QC sample rates), workflow behaviors (e.g. blind receive vs verified receive, guest checkout, negative stock blocking, mandatory expiry), and compliance policies MUST be backed by a configurable setting in the appropriate settings panel.
- Never hardcode business policies or magic numbers into components or services.

### Country-Separated Configuration
- **Every single setting in the entire system must be isolated and partitioned by country.**
- A setting configured for one country (e.g. Ethiopia `ET`) MUST NEVER apply to, affect, or override another country (e.g. Kenya `KE`).
- Settings storage (`system_config`), queries, and mutations must be explicitly scoped to `country_code`.

### Database Migrations & Mandatory In-Chat SQL Delivery
- **Every database change MUST have a migration file** in `/migrations/` named `YYYYMMDD_description.sql`.
- **Mandatory In-Chat SQL Delivery**: Whenever ANY SQL migration, table, column, index, RPC function, or RLS policy is created or modified while coding, the AI MUST bring the complete, runnable, copy-pasteable SQL directly into the chat response every single time so the user can easily copy and execute it in Supabase SQL Editor. Never silently create or modify migration files without delivering the full runnable SQL in the chat.

---

## Role Hierarchy

| Level | Roles | Access |
|-------|-------|--------|
| L1 | `super_admin`, `CEO` | Full system access |
| L2 | `regional_manager`, `operations_manager`, `procurement_manager`, `hr_manager`, `finance_manager` | Department/region-wide |
| L3 | `store_manager`, `warehouse_manager`, `assistant_manager` | Site-scoped |
| L4 | `cashier`, `picker`, `driver`, etc. | Task-specific |

### Approval Pattern
```typescript
const canApprove = ['super_admin', 'CEO'].includes(user?.role || '');
```

---

## Ethiopia Zero-Trust Operating Model & Daily HQ Central Oversight

> **Operating Reality**: SIIFMART operates across retail branches and warehouse hubs in Ethiopia (Addis Ababa, Dire Dawa, Adama, Harar, etc.).
> **Security Baseline**: Branch managers and staff are **NOT trusted** with unilateral financial, inventory, or pricing powers. High shrinkage, cash-heavy transactions, and theft risks demand that **everything is monitored, verified, and daily looked after from HQ**.

### 1. Zero Autonomous Branch Authority
- **No Unilateral Stock Adjustments**: Branch managers CANNOT write off stock, adjust inventory levels, or declare shrinkage directly. All adjustments MUST be submitted as `inventory_requests` for **HQ approval**.
- **No Local Price Overrides**: Prices and promotions are centrally controlled by HQ Merchandising. Cashiers and branch managers cannot alter product prices or create local discount codes.
- **Dual-Control (4-Eyes Principle)**: Any refund above threshold, voided transaction, or manual drawer kick requires dual authorization (Cashier + Manager or Branch + HQ OTP).

### 2. Mandatory Daily HQ Oversight Cadence
- **Morning Opening Float**: Cashiers must record their opening cash float at register opening; HQ dashboard monitors all opening floats across all branches.
- **Real-Time Shift & Cash Synchronization**: Shift transactions, cash drops, and payments (Cash, Telebirr, CBE Birr) must sync directly to Supabase — **NEVER store shifts in localStorage**.
- **End-of-Day (EOD) Z-Report & Cash Reconciliation**: Every branch must submit physical cash counts vs system totals at close of day. Cash discrepancies trigger an alert to HQ Finance & Audit. Next-day opening requires cleared reconciliation.
- **Daily Blind Cycle Counts**: HQ centrally schedules daily blind counts. Branch staff count items without seeing the system's expected quantity, preventing rubber-stamping.

### 3. Supply Chain Chain-of-Custody
- **Blind Receiving**: When receiving purchase orders or inter-branch transfers, staff must blind-count. Expected quantities are not shown upfront.
- **Transfer Discrepancy Lock**: If shipped units != received units, the transfer status locks to `Discrepancy` and immediately alerts HQ Operations.

### 4. Immutable Audit Trail & Geofencing
- Every sensitive event (void, drawer kick, refund, price check, shift close) must write an immutable log to `system_logs` in Supabase with timestamp, user ID, branch ID, device ID, and GPS coordinates.
- **Strict Site Scoping**: Branch users can NEVER view cross-site inventory counts, supplier costs, central profit margins, or other branches' financial data.

---

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

---

## Cybersecurity & Anti-Hacking Rules (Zero-Compromise Defense)

> **Threat Model**: SIIFMART operates over public internet, cellular (Ethio Telecom), and store Wi-Fi networks in Ethiopia. Threat actors include rogue employees, malicious insiders using DevTools/cURL, stolen POS tablets, and external attackers probing public Supabase endpoints.

### 1. Server-Enforced Row-Level Security (Never Trust the Client)
- **RLS on EVERY Table**: Every Supabase table MUST have `ENABLE ROW LEVEL SECURITY`. Never rely on client-side React routes (`<ProtectedRoute>`) as security boundaries — an attacker can bypass the UI and make HTTP requests directly to Supabase PostgREST endpoints using the public `anon` key.
- **Tenant & Site Isolation**: All queries must enforce site boundaries at the DB policy level so staff cannot query other branches:
  ```sql
  -- Branch staff can only read/write rows belonging to their assigned site
  CREATE POLICY site_isolation_policy ON sales
    FOR SELECT TO authenticated
    USING (site_id = (SELECT site_id FROM employees WHERE id = auth.uid()) OR (auth.jwt() ->> 'role') IN ('super_admin', 'CEO'));
  ```
- **Append-Only Immutable Logs**: Audit and transaction logs (`system_logs`, `points_transactions`, `stock_movements`) must NEVER have `UPDATE` or `DELETE` RLS policies granted to non-admin roles.

### 2. Zero Hardcoded Secrets & Key Separation
- **No Private Keys in Client Bundles**: The frontend app bundle MUST ONLY contain the Supabase `anon` public key.
- **Service-Role Key Protection**: The `service_role` key bypasses all RLS. It must **NEVER** be placed in client `.env`, `CentralStore`, or any file bundled by Vite. Privileged actions requiring service-role authority must run exclusively inside secure Supabase Edge Functions.
- **No Plain-Text Credentials**: Hardcoded test passwords (e.g. `siif123`, `Oromo123`), quick-login credentials, or API secret tokens must never exist in frontend code or git commits.

### 3. Financial & Pricing Anti-Tampering
- **No Client Price Authority**: Never trust unit prices, cart totals, or discount amounts sent by the browser. When a sale is processed:
  - Unit prices must match server catalog prices.
  - Cart totals, tax breakdowns, and discounts must be verified before persisting to `sales`.
  - A cashier modifying HTML inputs or intercepting network requests to pay 1 Birr for a 1,000 Birr item must be rejected immediately and logged as a security alert.

### 4. Input Sanitization & Injection Defense
- **Zod Schema Validation**: Validate all mutation payloads with Zod schemas (`/schemas/`) before submitting to the database.
- **No SQL Injection**: Always use Supabase parameterized query builders (`.eq()`, `.in()`). Never construct raw SQL strings with user input.
- **Mass-Assignment Defense**: Every service `update()` method must explicitly whitelist writable DB columns. Never pass `{ ...updates }` directly to Supabase.
- **Cross-Site Scripting (XSS)**: Never use `dangerouslySetInnerHTML` with raw user inputs (notes, customer names, receipt previews). Sanitize any dynamically rendered HTML.

### 5. Session Hardening & Staff PIN Security
- **Hashed Fast-Switch PINs**: 4-digit/6-digit cashier fast-switch PINs must be cryptographically hashed (e.g. bcrypt/argon2). Never store PINs in plaintext in `employees` table.
- **Brute-Force Lockout**: Enforce exponential backoff and lock the register after 3 failed PIN attempts.
- **Short-Lived Sessions**: Sensitive managerial actions expire after inactivity; require re-authentication.

### 6. Geofencing & Anti-Theft Device Tracking
- **Location Spoofing Deterrence**: Clock-ins, register float openings, and high-value approvals must log GPS coordinates, device user-agent, and client IP to detect unauthorized off-premise access.

---



## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase `.tsx` | `ProductForm.tsx` |
| Services | kebab-case `.service.ts` | `purchase-orders.service.ts` |
| Hooks | `use` prefix, camelCase, in `/hooks/` only | `useAdjustStockMutation.ts` |
| Utils | camelCase, in `/utils/` only | `formatting.ts`, `pricing.ts` |
| Types | PascalCase interfaces/types | `Product`, `SalesOrder` |
| Migrations | `YYYYMMDD_description.sql` | `20260407_security_hardening.sql` |

---

## Import Order

Imports in every file should follow this order, separated by blank lines:

```typescript
// 1. React & third-party libraries
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Contexts & hooks
import { useStore } from '../contexts/CentralStore';
import { useAdjustStockMutation } from '../hooks/useAdjustStockMutation';

// 3. Services
import { productsService } from '../services/products.service';

// 4. Components
import { ConfirmationModal } from './ConfirmationModal';

// 5. Utils & helpers
import { formatCurrency } from '../utils/formatting';

// 6. Types
import type { Product } from '../types';

// 7. Constants & assets
import { ROLES } from '../constants';
```

---

## Styling Rules

### Tailwind CSS v4
- Theme defined in `index.css` using `@theme { }` block
- Use utility classes, avoid inline styles
- Dynamic values use CSS variables via `ref` callbacks

```tsx
// ✅ Correct - CSS variable for dynamic width
<div 
  ref={el => el?.style.setProperty('--progress', `${percentage}%`)}
  className="w-dynamic"
/>

// ❌ Wrong - Inline style
<div style={{ width: `${percentage}%` }} />
```

### Design Tokens (Sand / Emerald / Amber)
- Primary Green: `#2C5E3B` (dark), `#A9CBA2` (light accent)
- Sand/Warm: `#EAE5D9` (light bg), `#1E3F27` (dark text), `#E2DCCE` (light border)
- Accent Amber: `amber-600` (light mode), `amber-500` (dark mode)
- Dark Mode BG: `#18201B`, borders: `emerald-950/20`
- Glassmorphism: `backdrop-blur-xl` with semi-transparent backgrounds
- Light cards: `bg-white/85`, Dark cards: `bg-[#18201B]/65`

---

## Error Handling

- Services should **throw errors**, not silently return `null` or `undefined`
- Mutation hooks handle errors via `onError` callback with toast notifications
- **Never** swallow errors with empty `catch` blocks
- Use `logger.error()` / `logger.warn()` from `/utils/logger.ts` — never raw `console.log`

```typescript
import { logger } from '../utils/logger';

// ✅ Correct — structured logging with module context
try {
  const result = await productsService.update(id, data);
  return result;
} catch (error) {
  logger.error('Products', 'update', error, { productId: id });
  throw error; // Re-throw so the mutation's onError fires
}

// ❌ Wrong - Silent swallow
try {
  await productsService.update(id, data);
} catch (e) {
  // empty
}
```

---

## Component Patterns

- **Modals** should be separate components, never inline JSX blobs
- **Tab content** should be separate components (e.g., `PickTab.tsx`, `PackTab.tsx`)
- **Forms** over 100 lines should be extracted into their own component
- **Shared UI elements** (buttons, badges, cards) go in `/components/shared/`
- **Pages** must be lazy-loaded in `App.tsx` using `React.lazy()` — never eagerly imported

```tsx
// ✅ Correct - Lazy loaded page
const Inventory = lazy(() => import('./pages/Inventory'));

// ❌ Wrong - Eager import of a page
import Inventory from './pages/Inventory';
```

---

## Database Rules

- **Never** modify the database schema without a migration file in `/migrations/`
- Migration filenames must follow: `YYYYMMDD_description.sql`
- Always update RLS policies when adding new tables
- Always add new columns as **nullable** or with **defaults** — never break existing rows
- After changing DB-related code, verify queries against Supabase types

### DB Schema Registry

Migration files can drift from the live database (e.g., someone changed a column in the Supabase Dashboard). To prevent column-mismatch bugs:

- Maintain a **schema registry** at `/schemas/db-schema.md` documenting every table's actual live columns, types, and constraints.
- When fixing a Supabase error, **always probe the live schema first** — never assume migration files are accurate.
- After any direct DB change in Supabase Dashboard, update BOTH the registry AND create a migration file.
- Never trust code comments about column names — verify against the registry or query the live DB.

### RLS-Aware Query Patterns

Row Level Security policies apply separately to INSERT, SELECT, UPDATE, and DELETE. Chaining operations triggers multiple policies:

```typescript
// ❌ DANGEROUS — triggers BOTH INSERT and SELECT RLS policies
// If the user can insert but not select, this returns 403
const { data, error } = await supabase
    .from('system_logs')
    .insert(dbLog)
    .select('*');

// ✅ Correct — insert-only, no SELECT policy triggered
const { error } = await supabase
    .from('system_logs')
    .insert(dbLog);

// ✅ Correct — if you need returned data, use minimal columns
const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select('id, created_at');
```

- **Never chain `.select('*')` after `.insert()`** unless you've verified the user has SELECT permissions.
- Append-only tables (like `system_logs`) typically have INSERT-only policies.
- When you don't need the returned row, omit `.select()` entirely.


---

## Service Field Mapping (CRITICAL)

Supabase uses **snake_case** columns. TypeScript uses **camelCase** fields. Every service's `update()` method MUST use an **explicit allowlist** of DB columns — **never** spread the full TypeScript object.

```typescript
// ✅ Correct — allowlist approach (only known DB columns sent)
const dbUpdates: Record<string, unknown> = {};
const directFields: (keyof Site)[] = ['name', 'type', 'address', 'status'];
for (const field of directFields) {
    if (updates[field] !== undefined) dbUpdates[field] = updates[field];
}
const fieldMap: [keyof Site, string][] = [
    ['terminalCount', 'terminal_count'],
    ['bonusEnabled', 'bonus_enabled'],
];
for (const [tsKey, dbKey] of fieldMap) {
    if (updates[tsKey] !== undefined) dbUpdates[dbKey] = updates[tsKey];
}

// ❌ DANGEROUS — unknown fields cause Supabase 400 Bad Request
const dbUpdates = { ...updates };
delete dbUpdates.id; // Denylist approach misses new fields!
```

### When Adding a New Column
1. Create migration in `/migrations/` → run in Supabase
2. Add field to interface in `/types/`
3. Add to the `mapSiteRow()` or equivalent mapper (snake → camel)
4. Add to the `update()` allowlist (camel → snake)
5. If needed in `create()`, add to the insert object

---

## Performance

- All page components in `/pages/` MUST be lazy-loaded via `React.lazy()` in `App.tsx`
- Never eagerly import page-level components
- Use `React.memo` for expensive pure components that receive stable props
- Avoid unnecessary re-renders by memoizing callbacks/values passed as props
- Lists over 50 items MUST use virtualization (`react-window` or similar)
- Expensive computations MUST use `useMemo` with correct dependency arrays
- Event handlers passed as props MUST use `useCallback` to prevent child re-renders
- Images MUST use lazy loading (`loading="lazy"`) unless above the fold
- Avoid creating new objects/arrays in render — extract to `useMemo` or constants

```typescript
// ✅ Correct — memoized for stable reference
const filteredProducts = useMemo(
  () => products.filter(p => p.category === selectedCategory),
  [products, selectedCategory]
);

// ❌ Wrong — creates new array every render
const filteredProducts = products.filter(p => p.category === selectedCategory);
```

---

## Mobile-First: POS & WMS Modules (CRITICAL)

POS and Fulfillment/WMS are deployed on **mobile phones and tablets** in stores and warehouses. All code touching these modules MUST be optimized for low-powered mobile browsers.

### Animation & CSS Rules
- **Only animate `transform` and `opacity`** — GPU-accelerated, won't cause jank
- **Never animate** `width`, `height`, `margin`, `padding`, `box-shadow`, `border-radius`
- **No `backdrop-blur`** on scrollable lists or re-rendered elements — use solid `bg-` colors
- **No `transition-all`** — specify exact properties: `transition: transform 200ms, opacity 150ms`
- **Max duration**: `200ms` interactive feedback, `300ms` page transitions
- **No JS animation libraries** (Framer Motion, GSAP) in POS/WMS bundles

### Touch & Interaction
- **Touch targets**: Min **44×44px** for all buttons, toggles, interactive elements
- **No hover-only actions**: `:hover` content MUST also be accessible via tap/long-press
- **Debounce search** by ≥300ms — mobile keyboards fire rapid events
- **Avoid dropdowns** in scanning flows — use large tappable cards/buttons

### Performance Budget
- **Virtualize** lists >30 items (`react-window` or `react-virtuoso`)
- **Lazy-load all modals** — never eagerly import modal components in POS/WMS
- **No heavy chart libraries** — defer visualization to Settings/HQ pages
- **Defer non-critical work** with `requestAnimationFrame` or `setTimeout(fn, 0)`
- **Test aesthetic changes on Slow 3G** (Chrome DevTools → Network) before merging

## Key Files Reference

| Purpose | File |
|---------|------|
| All types | `/types.ts` |
| All services | `/services/supabase.service.ts` |
| User state | `/contexts/CentralStore.tsx` |
| App data | `/contexts/DataContext.tsx` |
| Stock mutations | `/hooks/useAdjustStockMutation.ts` |
| Relocations | `/hooks/useRelocateProductMutation.ts` |

---

## Common Tasks

### Adding a New Mutation
1. Create `/hooks/useXxxMutation.ts`
2. Define params interface
3. Call service in `mutationFn`
4. Invalidate queries in `onSuccess`
5. Import and use in component

### Adding a New Page
1. Create `/pages/NewPage.tsx`
2. Add **lazy** route in `/App.tsx`
3. Add sidebar link in `/components/Sidebar.tsx`
4. Add module to `ProtectedRoute` permissions

### Adding a Database Column
1. Create migration in `/migrations/` and run SQL in Supabase
2. Update interface in `/types/` (or `/types.ts`)
3. Update `mapRow()` in the relevant `.service.ts` (snake_case → camelCase read)
4. Update `update()` allowlist in the same service (camelCase → snake_case write)
5. If needed in `create()`, add to the insert object

### Adding a New Service
1. **Check if a service already exists** for that domain — extend it instead of creating a duplicate
2. Use kebab-case: `feature-name.service.ts`
3. Place in `/services/`

### Versioning & GitHub Pushing
- **Always update the version number under the login page** when pushing changes to GitHub. Increment the version string in [LoginPage.tsx](file:///Users/shukriidriss/Downloads/siifmart%2080/components/LoginPage.tsx).

---

## Testing & Verification

### Automated Tests (Vitest)
- **New services** MUST have unit tests in `/tests/services/`
- **New utils** MUST have unit tests in `/tests/utils/`
- **Bug fixes** MUST include a regression test proving the fix works
- Run tests before committing: `npx vitest run`
- Run file size check: `npm run lint:size`

### Manual Verification
- After **any** code change, run `npx tsc --noEmit` to verify types
- After changing DB-related code, verify queries against Supabase types
- After splitting files, verify all imports resolve correctly
- After modifying routes or navigation, verify pages load without errors

### Test File Conventions
- Test files mirror source structure: `utils/pricing.ts` → `tests/utils/pricing.test.ts`
- Use `describe` blocks per function, `it` blocks per behavior
- Create helper factories (e.g., `makeProduct()`) instead of duplicating test data

---

## Debugging Rules

### Structured Logging
- Use `logger` from `/utils/logger.ts` — **never** raw `console.log` / `console.error`
- Always include module name and action context:

```typescript
import { logger } from '../utils/logger';

// ✅ Correct — searchable, structured
logger.error('POS', 'processPayment', error, { orderId, amount });
logger.warn('Fulfillment', 'No workers available for zone');
logger.info('Inventory', 'Stock adjusted', { productId, delta: -5 });

// ❌ Wrong — unsearchable, no context
console.log('error happened');
console.error(error);
```

### Error Boundaries
- Each major module route MUST be wrapped in `<ModuleErrorBoundary moduleName="X">`
- Module error boundaries are already wired in `App.tsx` for: POS, Fulfillment, Inventory, Financials, Settings
- When adding new page routes, wrap them with `ModuleErrorBoundary`
- The global `GlobalErrorBoundary` in `index.tsx` is the last-resort catch-all

### Troubleshooting
- Refer to `.agent/TROUBLESHOOTING.md` for common issues and where to fix them
- When resolving a new class of bug, add an entry to the troubleshooting guide

---

## State Management Decision Tree

Use the right tool for each type of state:

| State Type | Tool | Example |
|-----------|------|--------|
| Server data (read) | React Query `useQuery` | Products, sales, employees |
| Server data (write) | React Query `useMutation` in `/hooks/` | Stock adjustment, PO creation |
| Cached server data | `useData()` from DataContext | Products list, customers list |
| Auth / session | `useStore()` from CentralStore | Current user, selected site |
| Shared UI state (3+ consumers) | React Context | Theme, language, notifications |
| Local UI state (1-2 components) | `useState` / `useReducer` | Modal open, form values, tab index |
| Form state | React Hook Form + Zod | Product form, employee wizard |
| URL state | React Router `useSearchParams` | Filters, pagination, tab selection |

```typescript
// ❌ Wrong — putting local UI state in context
const [isModalOpen, setIsModalOpen] = useStore(); // Don't pollute global state

// ✅ Correct — local state stays local
const [isModalOpen, setIsModalOpen] = useState(false);
```

---

## File Organization Rules

### When to Split
| Trigger | Action |
|---------|--------|
| Context file > 300 lines | Split into context (provider) + hooks (actions) |
| Component has 3+ tabs | Each tab → separate file |
| Modal > 200 lines | Separate file in `/modals/` subdirectory |
| Types used by only 1 file | Co-locate in that file, don't add to `types.ts` |
| Form > 100 lines | Extract to its own component |
| Utility used by 3+ files | Move to `/utils/` |
| Hook used by 1 component | Co-locate, don't create a separate file |

### Directory Patterns
```
# Large component with sub-components
components/fulfillment/
  FulfillmentContent.tsx        ← Main orchestrator
  PickTab.tsx                   ← Tab component
  PackTab.tsx                   ← Tab component
  pick/                         ← Complex tab sub-components
    PickScanner.tsx
    PickJobModal.tsx
    PickHistory.tsx

# Context with extracted hooks
contexts/
  DataContext.tsx                ← Provider + raw state
  hooks/
    useProductActions.ts         ← Product mutations
    useSaleActions.ts            ← Sale mutations
```

---

## ⚠️ 500-Line File Limit (STRICT)

**No file may exceed 500 lines of code. This is a hard rule with zero exceptions.**

When editing or creating any file, the AI MUST:

1. **Check the line count** of the file before and after changes.
2. **If a file is already over 500 lines**, refactor it down as part of the current task — don't make it worse.
3. **If your changes would push a file over 500 lines**, split code into new files proactively — never leave a file above 500 lines.

### How to Split

| What to extract | Where to put it |
|-----------------|-----------------|
| Sub-components (sections, modals, tabs, cards) | Same directory as the parent, e.g. `ComponentName/SubPart.tsx` |
| Shared logic / helpers | `/utils/featureName.utils.ts` |
| Custom hooks | `/hooks/useFeatureName.ts` |
| Type definitions | `/types/featureName.types.ts` or keep in `/types.ts` if small |
| Constants, config maps | `/constants/featureName.constants.ts` |
| Context logic | Split provider vs. hook: `FeatureContext.tsx` + `useFeature.ts` |

### Splitting Rules

- **Barrel exports**: When splitting a component into a folder, create an `index.ts` that re-exports the main component so imports don't break.
- **Shared state**: Use React Context or prop-drilling — never duplicate state across split files.
- **No trade-offs**: Splitting must not reduce functionality, break imports, or introduce regressions. Run the dev server / build to verify after splitting.
- **Naming**: Split files should have clear, descriptive names reflecting their content (e.g., `OrderSummaryCard.tsx`, `useOrderFilters.ts`).

---

## Don'ts
- ❌ Don't trust branch managers or staff with autonomous stock, price, or discount overrides (enforce HQ approval)
- ❌ Don't store shifts, cash reconciliations, permissions, or discounts in `localStorage`
- ❌ Don't expose expected stock quantities during cycle counts or transfer receiving (enforce blind counting)
- ❌ Don't allow soft-deletes or silent deletion of transaction, shift, or audit logs
- ❌ Don't skip role checks or allow cross-site data exposure to branch staff
- ❌ Don't hardcode passwords, test accounts, master PINs, or API keys in client code
- ❌ Don't trust client-supplied unit prices, totals, or discounts without server catalog verification
- ❌ Don't rely on frontend route guards for security — enforce RLS on every DB table
- ❌ Don't use `dangerouslySetInnerHTML` with unsanitized user content
- ❌ Don't expose the Supabase `service_role` key to frontend bundles or client environment variables
- ❌ Don't use inline styles (use Tailwind or CSS variables)
- ❌ Don't call services directly for mutations
- ❌ Don't skip role checks for sensitive actions
- ❌ Don't hardcode site IDs or credentials
- ❌ Don't create duplicate mutation logic in components
- ❌ Don't push to GitHub without incrementing/verifying the version number in [LoginPage.tsx](file:///Users/shukriidriss/Downloads/siifmart%2080/components/LoginPage.tsx)
- ❌ Don't let any file exceed 500 lines — split into new files instead
- ❌ Don't leave `console.log` statements — remove or replace with `logger` from `/utils/logger.ts`
- ❌ Don't use `any` type — always define proper TypeScript types
- ❌ Don't create a new service if one already exists for that domain — extend it
- ❌ Don't put hooks in `/utils/` — they belong in `/hooks/`
- ❌ Don't eagerly import pages — use `React.lazy()` in App.tsx
- ❌ Don't add DB columns without a migration file
- ❌ Don't silently swallow errors with empty catch blocks
- ❌ Don't spread full objects into Supabase `update()` — use explicit allowlists
- ❌ Don't add a TypeScript field without updating the service mapper (read) and allowlist (write)
- ❌ Don't use the old `cyber-*` design tokens — use the sand/emerald/amber palette
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


