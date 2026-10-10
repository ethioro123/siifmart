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

### Synaptic Neural Mesh Pattern (Zero Dead-End Mutations)
- **Every mutation MUST stimulate downstream operational synapses**: An update to one entity cannot stop at a single row write. It must propagate state changes, cache invalidations, and audit signals across the interconnected event mesh (POS → Inventory → WMS → Financials → Gamification → CentralOps).
- **Zero Dead-End Silos**: If a business action occurs, all adjacent modules affected by that operational reality must immediately reflect the update without requiring page reloads or manual synchronization.

### AI Database & Network Egress Efficiency Standard (Rule 10 — The "Zero-Eager-History & 25-Item Shelf" Doctrine)
- **The "25-Item Shelf" Rule (Just-In-Time Fetching)**: Any list, history, or transaction query (sales history, purchase orders, historical WMS jobs, movements, expenses, audit logs) MUST default to an initial working limit of **25 records** maximum. Never load hundreds of records upfront. Users browse additional records strictly via pagination or on-demand "Load More" controls.
- **Zero Eager History on Login/Mount (THE CARDINAL RULE)**: Never pre-fetch historical, completed, or archived records on login or module initialization. The system MUST boot showing only the current live/active working set. History queries MUST be deferred until the user explicitly clicks the "History", "Archive", or "Audit Log" tab/button. On demand, return a maximum of **25 records**. This applies universally to: WMS completed jobs, past sales receipts, archived purchase orders, audit logs, system logs, and any other "completed" or "historical" entity. Violation is a critical egress leak.
- **Column Precision (No Naked `.select('*')`)**: Production queries must select only required columns (e.g. `id, name, sku, price, stock`). Never download dense nested JSON line items (`line_items`, `po_items`, `sale_items`) for overview or summary screens; only load line items when the user explicitly views that specific record.
- **Multi-Country & Site Scoping Invariant**: Branch staff (cashiers, fulfillment pickers, store clerks) strictly query data scoped to their active `siteId` and `country_code`. Global cross-site fetching is strictly restricted to global administrative roles (`super_admin`, `CEO`, `Admin`, `Auditor`).
- **Domain-Delegated & On-Demand Isolation**: Never query domain-specific data globally on app mount (e.g., WMS jobs belong in Fulfillment, telemetry audit logs belong in Admin Telemetry). Prune unused queries from global hooks.
- **Selective Mutation Invalidation**: When modifying a single record, never invalidate or refetch the entire database. Update or invalidate only the specific query key affected.
- **Cache Reuse & Zero-Polling**: Use TanStack React Query with appropriate `staleTime`s (10–30 mins for master rosters/suppliers). **Never create ad-hoc `setInterval` polling loops to the database**; use event-driven triggers (`online`, error events) or reactive WebSockets.

### Token-Efficient High-Accuracy Interaction Protocol (Rule 11 — The AI Excellence Doctrine)
To minimize token consumption while maximizing engineering precision, speed, and accuracy:
- **Laser-Targeted Inspections**: Read focused slices (< 80 lines) with `view_file` using `StartLine` and `EndLine`. Never read entire 400+ line files when inspecting a function.
- **Schema-First Verification (Zero Guessing Invariant)**: NEVER guess table column names or types (e.g. assuming `started_at` exists). Verify against `information_schema.columns` or `types/` before constructing projections or mutations. One query saves thousands of tokens in 400 Bad Request debug loops.
- **High-Signal Conciseness**: Deliver solutions, diffs, and SQL directly. Avoid conversational filler, apologies, restating user prompts, or repeating unchanged code.
- **Selective Audit Reporting**: Full 15-category checklist is reserved for explicit audit requests (`/audit`) or major multi-file milestones; routine edits confirm compliance concisely in bullet points.
- **Rule 9 In-Chat SQL Delivery**: Whenever database entities are added/modified, deliver complete, runnable, copy-pasteable SQL in the response and save to `migrations/YYYYMMDD_<name>.sql`.
- **Zero Guessing / Single-Shot Accuracy**: Diagnose root causes from logs/types before proposing code changes. Do not try blind iterative patches.
- **Strict File Modularity (< 500 Lines)**: Split components and hooks before they exceed 500 lines to ensure fast editing, minimal context window bloat, and zero truncation.

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
### 7. Linguistic Purity & Anti-Dialect Mixing Architecture
- **Zero Inter-Dialect Mixing**: In multi-lingual national environments (e.g. Ethiopia with Amharic and Afaan Oromoo, or Kenya with Swahili and English), strings must NEVER be concatenated into mixed bilingual monstrosities (e.g., NEVER write `Jimaata (ዓርብ), Fuulbana (መስከረም)`).
- **Strict Language Isolation**: UI presentation must strictly follow the user's active locale/language (`useLanguage()`):
  - When language is Amharic (`am`): 100% pure Amharic script (e.g. `ዓርብ፣ መስከረም 22፣ 2019 ዓ.ም` and `ጠዋት/ቀን/ማታ/ሌሊት`). Zero Oromo or mixed terms.
  - When language is Afaan Oromoo (`or`): 100% pure Afaan Oromoo (e.g. `Jimaata, Fulbaana 22, 2019` and `Ganama/Guyyaa/Galgala/Halkan`). Zero Amharic script or mixed terms. Note: Oromo language code in SIIFMART is strictly `'or'`.
  - When language is Swahili (`sw`): 100% pure Swahili (e.g. `Ijumaa, 2 Oktoba 2026`).
  - When language is English (`en`): 100% pure English (e.g. `Friday, Meskerem 22, 2019`).

### 8. Sovereign National Calendar & Live Clock Sovereignty Model
- **National Sovereignty of Time**: Enterprisewide operations must be anchored to the sovereign country's national time standard and calendar system.
- **Ethiopian Instance (`ET`)**: Uses the Ethiopic Solar Calendar (Ge'ez months, Ethiopic year, 13 months) + East Africa Time (`Africa/Addis_Ababa`, UTC+3) + traditional 12-hour cycle with day/night offset starting at dawn (06:00). Confusing Latin era markers (`ERA1`, `AM`) must be stripped.
- **Kenyan Instance (`KE`)**: Uses Kenyan National Calendar (Swahili / English) + East Africa Time (`Africa/Nairobi`, UTC+3).
- **Live Monospace Clock Digit Protection**: All live digital clock elements (`00:00:00`) MUST be protected against vertical character wrapping with `flex-nowrap whitespace-nowrap shrink-0`. Live time digits must NEVER be allowed to break or wrap vertically into a column under constrained container widths.
- **Anti-Duplication UI Law**: A page or header MUST NEVER render duplicate instances of sovereign calendar dates (e.g. mounting a standalone date pill right next to a clock that already displays the date). A unified, single Sovereign Clock & Calendar card must be used.

### 9. Dual Tax / VAT Controllability & African Goods Taxation Law
- **National Tax Gating & African Market Realities**: In emerging East African markets, national goods taxation is complex. Enterprises purchase both from formal VAT-registered corporate vendors and informal smallholders/farmers (exempt from VAT or non-registered). Similarly, at POS retail checkout, basic agricultural commodities, essential foodstuffs, or informal sales are zero-rated or exempt, while formal B2B sales require fiscal receipts.
- **Settings-Only Controllability & Zero POS/Procurement Adjustability**: Taxation is strictly controllable and adjustable **ONLY** from country Finance Settings by authorized administrators. Tax must **NEVER** be adjustable or editable in Procurement (PO creation) or POS (retail checkout). Unless explicitly turned on in country Finance Settings, tax MUST NOT be present or calculated in POS or Procurement.
- **Zero Hardcoded Taxing**: PO creation, vendor receiving, and POS checkout MUST check these country toggles before applying or calculating VAT/tax.

### 10. Header Ergonomics & Heavy Action Hierarchy
- **Lean Operational Control Rooms**: Central Operations, POS Command, and WMS dashboard headers represent live operational control rooms.
- **Dedicated Telemetry Bar**: Top operational bars must remain lean and dedicated to live telemetry, search/filters, active shift indicators, and sovereign time.
- **Bottom Suite Placement**: Heavy action buttons (e.g., "Get App (macOS)", "Executive Quarterly Export", "Mass CSV Import") MUST NOT clutter top navigation bars; they must be positioned in dedicated bottom operational suites, footers, or action drawers.

### 11. Floor Worker Interchangeability & Delivery Lockdown Law
- **Floor Worker Interchangeability**: Internal warehouse/store floor jobs (`PICK`, `PACK`, `RECEIVE`, `PUTAWAY`, `COUNT`, `TRANSFER`, `REPLENISH`, `WASTE`, `RETURNS`, `LABELS`) are 100% cross-functional across all floor staff (`picker`, `packer`, `receiver`, `inventory_specialist`, `forklift_operator`, `stock_clerk`). Any floor worker can perform any floor job regardless of their primary role title.
- **Driver Floor Capabilities**: Verified drivers (`driver`) can ALSO perform all internal floor jobs in addition to their transit duties.
- **Strict Delivery Lockdown**: Floor workers (`picker`, `packer`, `receiver`, etc.) CANNOT perform, accept, or be assigned to external delivery missions (`DRIVER`, `DELIVERY`, `DISPATCH`). Only verified drivers (and authorized dispatch leadership) may be assigned or accept delivery jobs.
- **Automated Guardrails**: Auto-assignment algorithms, manual assignment selectors, and mission boards must strictly enforce this boundary with clear rejection alerts.

### 12. Chain of Custody & Acceptance Responsibility Law ("You Inspect Before You Accept. The Moment You Accept, You Own It")
- **Custody Transfer Principle**: When transferring goods between nodes (DC to branch, branch to branch, supplier to DC), custody is strictly transferred only upon explicit physical inspection and dual digital sign-off.
- **The Golden Custody Rule**: *"You inspect before you accept. The moment you accept, you own it."* Once a receiving worker accepts a transfer or load without noting discrepancies on the manifest, any subsequent shortage, damage, or discrepancy discovered later becomes the direct liability and accountability of the accepting party.
- **Digital Dual-Handshake**:
  - For clean shipments (zero discrepancy): The receiver signs certifying receipt of all items in good condition.
  - For shipments with variances (shortage, damage, surplus): Both the delivering driver and the receiving custodian MUST co-sign the discrepancy log. The driver co-signs acknowledging the items were damaged or missing upon handover.
- **Gamification Accuracy & Discrepancy Penalties**: Any discrepancy (shortage, damage) verified during receiving triggers an automated accuracy penalty event (`CHAIN_OF_CUSTODY_DISCREPANCY`). The system calculates the discrepancy severity percentage and applies a proportional penalty to the responsible party's warehouse accuracy score and national leaderboard points.
- **Immutable Audit Trail**: All custody handshakes, whether clean or contested, log immutable records (`CHAIN_OF_CUSTODY_HANDSHAKE` / `CHAIN_OF_CUSTODY_DISCREPANCY`) to `system_logs` including transfer ID, driver ID, receiver ID, site ID, items verified, conditions, and timestamps.

### 13. Non-Alcoholic / Halal Catalog Compliance Law
- **Strict Prohibition of Alcohol & Liquor**: SIIFMART operates strictly as an alcohol-free, halal-compliant enterprise. We do NOT sell liquor, beer, wine, spirits, or alcoholic beverages under any circumstances.
- **Zero Liquor in Category Taxonomy**: The product catalog and category taxonomy must NEVER contain liquor, beer, wine, or spirits categories. Any legacy data must be automatically sanitized and remapped to non-alcoholic categories (e.g. `Beverages`).
- **Zero Liquor in Examples, Mock Data & SOPs**: Developers, agents, and administrators must NEVER use liquor, beer, wine, or spirits as examples in documentation, SOPs, cycle count risk tiers, test cases, or mock databases. High-value / high-shrink examples must strictly use commodities like cooking oil, infant milk formula, premium coffee/tea, honey, electronics, cosmetics, or fresh meat.

### 14. Manager & Supervisory Accountability Law ("The Captain Owns the Ship")
- **Supervisory Co-Liability Doctrine**: Frontline workers do not operate in a vacuum. Under the "Captain Owns the Ship" doctrine, managers and shift supervisors bear joint accountability for all variances, overrides, and shrinkage occurring on their shift or under their supervisory stamp.
- **Immutable Supervisory Footprint**: Every supervisory action (price override, line void, drawer kick, refund approval, job reassignment, PO approval) must capture:
  - `managerId` / `managerEmployeeId`
  - `managerName` & `managerRole`
  - Mandatory structured `reasonCode` (free-text or blank overrides are computationally prohibited)
  - `terminalId`, `deviceFingerprint`, `gpsCoordinates`, and server timestamp
- **Shift Variance Co-Sign Mandate**: When a cashier closes a drawer with an unverified cash variance (> 20 ETB / 50 KSh), the on-duty shift supervisor MUST co-sign the discrepancy log. Unexplained shift variances directly penalize the supervisor's leadership integrity score.
- **Override Velocity Gating**: Excessive supervisory override frequency (> 3% of store shift transactions) automatically triggers a Central HQ Loss Prevention audit flag to detect potential cashier-supervisor collusion or sweethearting.
- **Anti-Collusion Separation of Duties (4-Eyes Check)**: Managers cannot approve POs, expenses, or stock adjustments that they personally originated or counted. All store-level stock adjustments remain strictly gated to Central HQ Audit review via `inventory_requests`.

### 15. Universal English UI & Neutral Sovereignty Law
- **Zero Local Dialect Bleed in English**: Under no circumstances may Ethiopian-specific administrative or cultural terms (such as `Kebele`, `Woreda`, etc.) be hardcoded into universal English UI labels, placeholders, tooltips, or form fields.
- **Universal International Terminology**: Universal English UI elements must strictly use international, neutral terms (e.g. `National ID / Passport Number`, `Residential Address`, `Street, Building, Apt / House No.`).
- **Strict Translation Gating**: Ethiopian administrative and cultural terms must ONLY appear when the active language is an Ethiopian national language (`am` for Amharic, `or` for Afaan Oromoo via `useLanguage()`) or when data is explicitly partitioned and displayed under the Ethiopian national instance (`ET`).

### 16. Mandatory Apple Minimalist & Liquid Glass Design Standard (Total Omnipresence Across Every Single Element)
- **The October 2026 Apple Formula (macOS 27 / iOS 27 baseline)**: Every interface in the system must strictly embody Apple's latest cross-platform design standard: **SF typography + generous whitespace + edge-to-edge content + Liquid Glass controls + restrained semantic colour + layered SF-style icons + rounded geometry + subtle depth + responsive motion**. Interfaces must feel calm, purposeful, uncluttered, and museum-grade.
- **Content-First Architectural Hierarchy**: The interface follows a strict structural priority: `CONTENT → STRUCTURE → NAVIGATION → CONTROLS → DECORATION` (never `Cards → Borders → Shadows → Gradients → Content`). The interface must NEVER look like a cluttered "collection of boxes" or card traps. Contrast is established through typography, generous negative space, and edge-to-edge content, not by boxing every paragraph, metric, or row into a card container.
- **The 70 / 20 / 8 / 2 Golden Ratio Colour Philosophy**:
  - **70% Neutral Foundation**: Background canvas (OLED `#000000` in dark mode, Apple `#F5F5F7` in light mode).
  - **20% Surfaces & Structure**: Content surfaces, panels, and structural tones (pure OLED `#000000` or deep onyx `#1D1D1F` in dark; pure white `#FFFFFF` in light). Strictly zero muddy gray cards (`#1C1C1E` / `#2C2C2E`).
  - **8% Text & Structural Contrast**: High-contrast typography (`#F5F5F7` primary in dark, `#1D1D1F` in light) and 1px crisp hairlines (`rgba(255,255,255,0.08)` in dark, `rgba(0,0,0,0.08)` in light).
  - **2% Restrained Accent Colour**: Accent color (`#0071E3` in light / `#2997FF` in dark) is used sparingly for primary actions, selected navigation items, active indicators, and status badges. Never flood the interface with accent colors.
- **Restrained Semantic Colour Mapping**:
  - Primary / Interactive: Accent Blue (`#0071E3` / `#2997FF`)
  - Success: Green (`#34C759`)
  - Warning: Orange/Amber (`#FF9500`)
  - Destructive: Red (`#FF3B30`)
  - Attention / Caution: Yellow (`#FFCC00`)
  - Special Category: Purple (`#AF52DE`)
  - Secondary / Utility: System Gray (`#86868B` / `#8E8E93`)
- **Liquid Glass Materials & Three-Tiered Hierarchy ("Glass Isn't Everywhere")**:
  - Liquid Glass is a dynamic material combining optical glass properties, fluidity, translucency, blur, refraction, specular lighting, and dynamic tinting.
  - **Tier 1: Glass Clear** (Opacity ~0.25–0.35, `blur(16px)`): Used for floating toolbars, subtle topbars, and minimal floating navigation.
  - **Tier 2: Glass Standard** (Opacity ~0.45–0.60, `blur(24px) saturate(180%)`, hairline border `rgba(255,255,255,0.12)`, specular highlight pseudo-element `linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0))`): Used for sidebars, floating control clusters, and search pills.
  - **Tier 3: Glass Strong** (Opacity ~0.65–0.80, `blur(32px) saturate(180%)`, soft elevation shadow): Used for modal sheets, popovers, and critical action overlays.
  - **Judicious Glass Rule**: Glass belongs strictly to functional floating layers (navigation, toolbars, search pills, floating controls, sidebars, modal sheets). Do NOT make every card, table, or section into glass.
- **Tonal Depth Hierarchy**: Level 0 (Canvas) → Level 1 (Content Surface) → Level 2 (Elevated / Glass Controls) → Level 3 (Modal / Floating Sheet).
- **Subtle Elevation Shadows**: Low opacity, large blur, low spread ("subtle floating elevation", never harsh drop-shadows): Small (`0 2px 8px`), Medium (`0 8px 30px`), Floating (`0 16px 50px`), Modal (`0 24px 80px`).
- **Standardized Corner Radii System**: `--radius-xs: 6px` (indicators/tags); `--radius-sm: 10px` (inputs/small chips); `--radius-md: 14px` (buttons/small cards); `--radius-lg: 18px` (content cards); `--radius-xl: 22px` (glass panels/containers); `--radius-2xl: 28px` (modals/floating sheets); `--radius-pill: 999px` (pills, badges, search pills).
- **Typography Scale & Negative Letter-Tracking Physics**:
  - Font Stack: `system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif`.
  - Hierarchy & Tracking: Display (56px, line-height 1.05, weight 700, tracking `-0.035em`), Large Title (40px, line-height 1.1, weight 700, tracking `-0.025em`), H1 (32px, line-height 1.15, weight 700, tracking `-0.02em`), H2 (26px, line-height 1.2, weight 650, tracking `-0.015em`), H3 (21px, line-height 1.25, weight 600), Body Large (17px, line-height 1.45, weight 400), Body (15–16px, line-height 1.45, weight 400, tracking `0`), Small (13px, line-height 1.35, weight 400), Caption/Micro (11–12px, line-height 1.3, weight 500/600, tracking `+0.01em`).
  - Monospace & Tabular Numerals: Monospace SF Mono and `font-variant-numeric: tabular-nums` (`tabular-nums`) for currency, prices, stock counts, quantities, KPIs, timestamps, and sovereign clocks.
- **Spacing Scale & Generous Whitespace Standard**: 4px base grid (`--space-1: 4px` to `--space-16: 64px`). Enforce generous negative space (1.5x–2x typical SaaS density). Give content room to breathe; avoid crowding elements.
- **Natural Apple Spring Motion Physics**: `--ease-apple: cubic-bezier(0.2, 0.8, 0.2, 1)`, Fast (120ms), Normal (200ms), Slow (320ms), tactile compression on click (`active:scale-[0.98]`). Motion communicates physical location without loud distraction; strictly respects `prefers-reduced-motion`.
- **Component Ergonomics & Hierarchy**:
  - **44px Control Baseline**: Inputs and primary buttons enforce 44px standard height (SM: 36px, MD: 44px, LG: 52px). Inputs use 16px font to prevent mobile zoom and focus ring `outline: 2px solid var(--theme-accent); outline-offset: 1px;`.
  - **Button Hierarchy**: Exactly ONE primary action per screen (solid high-contrast pill: `#FFFFFF` in dark, `#1D1D1F` in light), neutral secondary surfaces, and tertiary ghost text ("Cancel").
  - **KPI Cards**: Strictly ZERO rainbow gradient backgrounds behind KPI cards. Standard structure: 13px uppercase label, 32–40px bold tabular numeral, 13–14px semantic delta badge, 12–13px supporting context.
  - **Spacious Tables**: Clean and spacious with 48–56px row height, generous padding, hairline separators, tabular numbers for currency and stock counts, zero rainbow badges.
  - **macOS 27 Navigation Sidebar**: 240px width, 12px padding, 40–44px item height, 10–12px radius. Selected item uses subtle surface + accent text/icon (never a solid blue block). Icons adopt distinctive domain-specific semantic tinting (blue for dashboard, emerald for orders, amber for products, purple for settings).
- **Mandatory Text Visibility & Supreme Legibility Doctrine (Readability Is Paramount)**:
  - While applying Apple SF typography, minimalist styling, refined palettes, and Liquid Glass materials, **text visibility and readability are strictly non-negotiable and paramount**. Visual aesthetics, minimalist restraint, dark mode surfaces, or glass translucency must NEVER compromise legibility or reading ergonomics.
  - **High-Contrast Typography Standard**: Primary text must enforce maximum contrast (`#F5F5F7` / `#FFFFFF` on dark surfaces; `#1D1D1F` on light surfaces). Secondary and supporting text (`#A1A1A6` / `#86868B`) must strictly preserve WCAG AA minimum 4.5:1 contrast ratio against their immediate background surface (WCAG AAA 7:1 preferred for dense tabular data and captions).
  - **Zero Washed-Out or Dim Gray Text**: Strictly prohibit low-contrast, washed-out, or dim gray text (e.g. text opacities `< 0.70` or muted grays like `#4B5563` on dark surfaces) that strains eyes or washes out under store fluorescent lights or dim warehouse floors.
  - **High-Legibility Glass Scrims & Backings**: Whenever text is rendered over Liquid Glass or translucent controls, the glass material MUST provide sufficient optical opacity, contrast tinting, or a readable scrim so underlying content, refractions, and specular highlights never cause visual vibration, bleed-through, or illegibility.
  - **Tabular & Operational Contrast Guarantee**: Tabular numbers, monetary figures, barcodes, SKU labels, inventory bin tags, and system clock digits must maintain maximum visual punch and razor-sharp contrast for instant glanceability.
- **The 11-Point "Apple Test" Audit Checklist**: Before approving ANY UI component, screen, or workflow, verify:
  1. Is the content the visual priority?
  2. Could I remove a border?
  3. Could I remove a card? (Eliminate "collection of boxes")
  4. Could I reduce the colour? (Enforce 70/20/8/2 ratio)
  5. Could I simplify the icon?
  6. Does the spacing feel generous? (1.5x–2x standard SaaS spacing)
  7. Does the hierarchy work without decoration?
  8. Is the glass actually serving a functional purpose? (Judicious glass rule)
  9. Does dark mode feel intentionally designed? (Independent tonal hierarchy, not simple inversion)
  10. Does it still work without animation?
  11. Is text visibility and contrast crystal-clear across all lighting conditions with zero washed-out or low-contrast typography?
- **Enterprise Retail & WMS Synthesis Doctrine**: We do not create an ornamental consumer marketing page; we synthesize Apple 2026 visual language with serious enterprise retail & WMS information architecture (dense operational tables, bin locations, SKU tracking, FEFO batch expiry, operational badges, hardware barcode scanners, and fast filters). Low-end mobile constraints (stripping GPU blurs) remain strictly quarantined to frontline warehouse workers in Fulfillment.
- **The 13 Aesthetic Anti-Patterns (Strictly Prohibited)**:
  1. ❌ Excessive gradients (purple → pink → orange, glow blobs)
  2. ❌ Excessive glass (glass card inside glass card inside glass card)
  3. ❌ Heavy / thick borders (> 1px)
  4. ❌ Harsh dark drop-shadows
  5. ❌ Tiny unreadable text (< 11px)
  6. ❌ Rainbow palettes (20 different colours on one screen)
  7. ❌ Every element being rounded arbitrarily
  8. ❌ Excessive pills everywhere
  9. ❌ Every item trapped inside a card container ("collection of boxes")
  10. ❌ Generic dashboard gradients behind KPI cards
  11. ❌ Muddy gray cards (`#1C1C1E` / `#2C2C2E`)
  12. ❌ Neumorphism or 2020 glassmorphism
  13. ❌ Low-contrast, washed-out, or dim gray text that sacrifices visibility and legibility for aesthetic minimalism or dark mode styling

### 17. Mandatory Low-End Mobile Performance & Warehouse Ergonomics Standard (Strictly Confined to Fulfillment)
- **Strict Domain Scoping (Fulfillment Only)**: Low-end mobile performance constraints, RAM optimizations, animation restrictions, and GPU blur stripping are STRICTLY CONFINED to the Fulfillment domain (`pages/Fulfillment.tsx` and `components/fulfillment/`). Frontline warehouse workers (pickers, packers, receivers) operate on low-cost entry-level Android devices ($50–$100, 2GB–3GB RAM, budget Mali/PowerVR GPUs e.g. Tecno Pop/Spark, Infinix Smart/Hot, Itel, Samsung Galaxy A03/A04). In ALL other domains — POS, POS Command, Administration, Central Operations, Financials, Procurement, Inventory, HR, and Settings — our full October 2026 Apple Liquid Glass & aesthetic applies without restriction.
- **Zero GPU Blur Penalties in Fulfillment Mobile Viewports**: `backdrop-filter: blur()` and heavy RAM-intensive animations are strictly stripped in Fulfillment mobile viewports (`@media (max-width: 768px)`) and replaced with fast, solid opaque surfaces (`#161617` or `#FFFFFF`) to maintain silky smooth 60 FPS scrolling and instantaneous scanning response.
- **Warehouse Floor Ergonomics**:
  - Minimum 48×48px tap targets for all buttons, inputs, and list rows.
  - `touch-action: manipulation` across all interactive elements to eliminate the 300ms mobile tap delay.
  - High-contrast monospace typography for critical barcodes, bin locations, and quantities to ensure legibility under harsh direct warehouse lighting.

### 18. Mandatory Zero-Hardcoded Aesthetic & Semantic Tokenization Standard
- **Zero Raw Aesthetic Hardcoding**: Whenever possible, developers and AI assistants must strictly avoid hardcoding any visual or aesthetic values directly into UI components.
  - No hardcoded raw color hex codes (e.g. `#000000`, `#1D1D1F`, `#FAF7F2`, `#252525`).
  - No hardcoded font family strings or ad-hoc typography scales.
  - No hardcoded card surface backgrounds, static panel colors, or fixed border strokes.
  - No scattered box shadows or ad-hoc border radii.
- **Centralized Semantic Token Dictum**: ALL visual aesthetics MUST be driven exclusively by the semantic design token architecture in `styles/theme.css`:
  - Canvas & Wallpaper: `var(--theme-bg-app)`
  - Window Chrome & Panels: `var(--theme-bg-panel)`
  - Content Cards & Tables: `var(--theme-bg-card)`, `var(--theme-bg-card-hover)`
  - Subtles & Wells: `var(--theme-bg-subtle)`
  - High-Contrast CTAs: `var(--theme-primary)`, `var(--theme-primary-hover)`, `var(--theme-primary-text)`
  - Typography: `var(--theme-text-primary)` (primary title/body), `var(--theme-text-secondary)` (subtitles/labels), `var(--theme-text-muted)` (captions/metadata)
  - Hairlines: `var(--theme-border)`, `var(--theme-border-subtle)`, `var(--theme-border-focus)`
  - System Accents: `var(--theme-accent)`, `var(--theme-accent-hover)`, `var(--theme-accent-muted)`
- **Effortless Enterprise Rebranding**: Strict adherence to this rule guarantees that any future brand evolution, aesthetic redesign (e.g. switching between design themes or adjusting contrast for sunlight readability), or font update is completed instantly from `styles/theme.css` without touching hundreds of individual TSX files.

### 19. Mandatory Zero-Emoji & Professional Vector Iconography Standard (SF Symbols Philosophy)
- **Zero Raw Unicode Emojis**: Under no circumstances may raw Unicode emojis (e.g. `⚠️`, `🔒`, `•`, `✅`, `❌`, `🎉`, `📦`, `🏷️`, `⚖️`, `⚡️`) be used in UI text strings, labels, badges, buttons, alerts, toasts, modals, or tables.
- **Cross-Platform Visual Integrity**: Unicode emojis render inconsistently across operating systems (iOS vs Android vs Linux vs Windows) and impart an amateurish, toy-like appearance to enterprise retail software.
- **Standardized Vector Iconography**: All iconography MUST be implemented using crisp, standardized Lucide React SVG vector icons matching SF Symbols optical weight and geometry:
  - Sizing Tokens: `w-3.5 h-3.5` (14px) for inline text and compact status pills; `w-4 h-4` (16px) for standard interactive buttons and inputs; `w-5 h-5` (20px) for page headers and primary nav tabs; `w-6 h-6` (24px+) for modals and hero sections.
  - Stroke Weight Harmonization: `strokeWidth={1.5}` or `strokeWidth={2}` consistently across all icons.
  - Semantic Color Restraint & Sidebar Tinting: Utility icons inherit text color or use restrained semantic tinting (`text-emerald-500`, `text-amber-500`, `text-rose-500`, `text-[var(--theme-text-secondary)]`). In navigation sidebars, icons adopt distinctive domain-specific semantic tinting (macOS 27 pattern: blue for dashboard, emerald for orders, amber for products, purple for settings). Always include `shrink-0` to avoid SVG distortion in flex containers.

### 20. Mandatory Universal Theme & Aesthetic Application Across All Domains
- **No Domain Silos for Aesthetics**: Whenever ANY file, component, workflow, hook, service, or modal is created, edited, reviewed, or audited — regardless of domain (Procurement, Financials, WMS, POS, HR, Central Ops, Settings, etc.) — you MUST actively verify whether our themes and October 2026 Apple minimalist & Liquid Glass aesthetic are properly, fully, and strictly applied there.
- **Simultaneous Functional & Visual Audit**: For example, when checking how procurement purchase orders, receiving splits, or vendor relations operate, the AI must NOT stop at functional logic; it MUST simultaneously audit whether procurement's tables, cards, inputs, status pills, action buttons, and modals consume semantic theme tokens (`var(--theme-*)`), enforce zero gradients, eliminate unapproved blurs (blurs allowed only for judicious Liquid Glass navigation/modals, strictly zero blurs in mobile fulfillment), contain zero raw Unicode emojis, and use professional vector icons. No functional task or review is complete without verifying total theme compliance in that touched domain.

### 21. Mandatory 6-Month Autonomous Apple Aesthetic Re-Alignment Cycle
- **Synchronized Bi-Annual Modernization**: The design system, semantic design tokens (`styles/theme.css`), component motion physics, and typography hierarchy MUST be reviewed, audited, and modernized every 6 months to re-align with Apple's absolute latest design language (synchronized with Apple's bi-annual design updates, e.g. June WWDC and September/October OS releases like iOS/iPadOS 27 and macOS 27).
- **Self-Updating Aesthetic Standard**: The rules automatically enforce that every 6 months, all components are re-evaluated against the latest Apple macOS/iOS aesthetic standard — ensuring that corner radiuses, spring animations, surface layers, system gray palettes, and typography tracking never degrade or lag behind Apple's newest design standards.
- **Zero Aesthetic Drift**: Any visual patterns that fall behind Apple's current design standard must be refactored into the updated tokens.

---

## Synaptic Neural Mesh Architecture: Deep Interconnection & Reactive Propagation Model

> **Operating Philosophy**: A distributed retail enterprise and supply chain is a single living organism, not a disjointed archipelago of software silos.
> **Core Principle**: **"Everything is Connected to Everything"**. Just like a biological neural network where an action potential in one neuron stimulates and depolarizes connected synapses to fire and adapt, EVERY business event, transaction, mutation, and operational threshold in SIIFMART must propagate ripple effects across all interconnected operational domains to extract the maximum intelligence and performance out of the system.

### 1. The 5 Foundational Laws of the Synaptic Neural Mesh
1. **Zero Isolated Operational Silos (The Synaptic Law)**:
   - No module (POS, Inventory, WMS, Procurement, Financials, Employees, Central Operations) may execute a mutation in isolation as a dead-end database write.
   - Every mutation MUST stimulate its downstream connected neural synapses (updating inventory, triggering replenishment, posting to financial ledgers, awarding gamification scores, and pulsing executive telemetry).
2. **The Synaptic Signal Cascade Map**:
   - **Synapse Alpha: Point of Sale (POS) → Downstream Cascade**:
     - *Neuron Event: Sale / Checkout Completed* →
       - → **Inventory**: Immediate depletion of discrete sellable units + automated FEFO (First-Expired, First-Out) lot/batch deduction. If stock breaches the safety threshold, immediately fires a replenishment reorder trigger.
       - → **Fulfillment & WMS**: Automatically enqueues internal branch transfer or warehouse replenishment pick job.
       - → **Financials & Accounting**: Real-time gross profit margin accrual, tax ledger posting, digital tender breakdown (Telebirr/CBE Birr/M-Pesa), and immediate update to the cashier's expected shift drawer balance.
       - → **Workforce & Gamification**: Credits cashier accuracy and volume points; boosts branch team score on the national leaderboard.
       - → **Central Operations**: Pulses real-time revenue velocity charts, updates active daily KPIs, and decrements stock health counters.
   - **Synapse Beta: Procurement & DC Receiving → Downstream Cascade**:
     - *Neuron Event: Purchase Order Delivered & Blind QC Verified at DC* →
       - → **Inventory**: Batch ingestion with manufacturing/expiry dates; recalculates Moving Average Landed Cost (Base Cost).
       - → **Pricing & Merchandising**: Evaluates margin protection (Landed Cost + Target Margin % vs Base Retail Shelf Price); initializes perishable markdown countdown ladders.
       - → **Cross-Docking & Logistics**: Immediately releases pending branch transfer backorders (cross-docking freight directly from receiving to outbound staging).
       - → **Financials**: Creates Accounts Payable accrual, verifies 3-way match (PO vs Receiving Slip vs Vendor Invoice).
       - → **Central Operations**: Clears inbound shipment alerts, updates Network Asset Value at Cost and Retail.
   - **Synapse Gamma: Stock Discrepancies & Audits → Downstream Cascade**:
     - *Neuron Event: Cycle Count Variance or Shrinkage Logged* →
       - → **Zero-Trust Oversight**: Freezes autonomous write-offs; routes adjustment to `inventory_requests` for HQ approval.
       - → **Financials**: Provisions pending shrinkage write-off reserve.
       - → **Audit & Security**: Captures GPS coordinates, device ID, and employee ID to `system_logs`; recalculates picker/store accuracy rating.
       - → **Central Operations**: Triggers Critical Alert digest in the Executive Command Deck.
   - **Synapse Delta: Shift Closing & Cash Drops → Downstream Cascade**:
     - *Neuron Event: Cashier Shift End / EOD Z-Report* →
       - → **Financial Reconciliation**: Real-time variance comparison between counted physical tender and calculated system balance.
       - → **HQ Audit Desk**: Pushes directly to the Daily HQ Cash Reconciliation table for Finance sign-off.
       - → **Gamification & HR**: Evaluates shift targets and grants shift completion rewards.
3. **Cybernetic Backpropagation & Adaptive Feedback Loops**:
   - Downstream operational outcomes must feed back into upstream decision-making:
     - Customer returns or perishable spoilage in Retail Stores feed back into Vendor Quality Scorecards in Procurement and Putaway climate/zone assignments in WMS.
     - Cashier scan velocity and void anomalies feed back into dynamic fraud scoring and dual-control approval requirements.
     - Out-of-stock velocities and cycle count variances feed back into AI demand forecasting models and dynamic safety stock buffer adjustments.
4. **The Sovereign Myelin Sheath (National Blood-Brain Barrier)**:
   - While the neural network is ultra-dense, reactive, and interconnected *within* each sovereign country (`ET` or `KE`), it is strictly insulated at national borders.
   - Synapses and signals MUST NEVER bleed across countries. Under no circumstances does a Kenyan POS sale adjust Ethiopian inventory or trigger an Ethiopian reorder signal. The neural mesh is 100% intra-country; international transfers require formal customs clearance.
5. **Circuit Breakers & Anti-Storm Cascade Protection**:
   - To prevent feedback storms and infinite event recursion (Neuron A triggering B triggering A), all synaptic handlers must be idempotent, debounced, and protected by correlation cycle-detection guards.

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

### Design Tokens (Apple Liquid Glass & Pure Contrast Architecture)
- Centralized semantic tokens defined in `styles/theme.css`:
  - Canvas & Wallpaper: `var(--theme-bg-app)`
  - Window Chrome & Panels: `var(--theme-bg-panel)`
  - Content Cards & Tables: `var(--theme-bg-card)`, `var(--theme-bg-card-hover)`
  - High-Contrast CTAs: `var(--theme-primary)`, `var(--theme-primary-hover)`, `var(--theme-primary-text)`
  - Typography: `var(--theme-text-primary)`, `var(--theme-text-secondary)`, `var(--theme-text-muted)`
  - Hairlines: `var(--theme-border)`, `var(--theme-border-subtle)`, `var(--theme-border-focus)`
  - Corner Radii: `--radius-xs` (6px), `--radius-sm` (10px), `--radius-md` (14px), `--radius-lg` (18px), `--radius-xl` (22px), `--radius-2xl` (28px), `--radius-pill` (999px)
  - Spacing Scale: `--space-1` (4px) through `--space-16` (64px) on a 4px base grid
  - Control Sizing: `--control-height-sm` (36px), `--control-height-md` (44px), `--control-height-lg` (52px)
  - Motion & Easing: `--ease-apple` (`cubic-bezier(0.2, 0.8, 0.2, 1)`), `--duration-fast` (120ms), `--duration-normal` (200ms), `--duration-slow` (320ms)
  - Soft Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-modal`
  - Liquid Glass 3 Tiers: Clear (`.glass-clear`), Standard (`.glass-standard`), Strong (`.glass-strong`)
- Dark Mode Canvas: Level 0 Canvas — OLED `#000000` dark / Apple `#F5F5F7` light
- Pure Contrast Surfaces: Dark mode uses pure OLED black surfaces (`#000000`) or deep onyx (`#1D1D1F`) with crisp 1px hairline borders (`rgba(255,255,255,0.08)`); Light mode uses pure white cards (`#FFFFFF`) with subtle hairline borders (`rgba(0,0,0,0.08)`). Strictly zero muddy gray cards (`#1C1C1E` / `#2C2C2E`).
- SIIFMART Corporate Brand Logo Invariant: The official corporate logo is the typographic wordmark itself (`components/Logo.tsx`) without icon containers: `SIIF` in Apple high-contrast neutral (`#1D1D1F` light / `#F5F5F7` dark) and `MART` in signature green (`#2C5E3B` light / `#00FF9D` dark). All other application UI (canvas, surfaces, panels, controls, cards, navigation) strictly adheres to Apple minimalist tokens (`#000000`, `#F5F5F7`, `#FFFFFF`, Apple blue `#0071E3`).
- Judicious Liquid Glass: Used selectively for navigation bars, toolbars, search pills, sidebars, segmented controls, and modal sheets (not everywhere).
- Scope of Hardware Overrides: Low-end mobile performance constraints (stripping GPU blurs, restricting RAM/animations, solid opaque surfaces) are STRICTLY CONFINED to the Fulfillment domain (`pages/Fulfillment.tsx` and `components/fulfillment/`). In POS, POS Command, Administration, and all other domains, our full Apple Liquid Glass aesthetic applies completely.
- Supreme Text Visibility & Contrast: Text readability is paramount. All typography tokens enforce high contrast (minimum WCAG AA 4.5:1, AAA 7:1 for data tables). Never use washed-out or dim text on dark or light backgrounds, and ensure text over Liquid Glass materials maintains a high-contrast backing.

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
- ❌ Don't use legacy palettes (cyber-*, sand/emerald/amber) — enforce our authentic October 2026 Apple aesthetic across POS, Administration, and all non-fulfillment domains
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
- ❌ Don't build isolated operational silos or dead-end mutations — every state change must stimulate its connected neural synapses (inventory, fulfillment, financials, gamification, telemetry) through the event mesh
- ❌ Don't assign or allow floor workers (pickers, packers, receivers, inventory specialists) to perform delivery missions — deliveries are strictly locked to verified drivers
- ❌ Don't allow transfer receiving or cargo handovers to bypass the Digital Dual-Handshake, or transfer acceptance without recording discrepancies (unrecorded variances become the accepting custodian's sole liability)
- ❌ Don't include liquor, alcohol, beer, wine, or spirits as a category, product, mock item, or example anywhere in the system — SIIFMART does NOT sell alcohol
- ❌ Don't permit anonymous supervisory overrides or untracked managerial approvals — every managerial action must capture authenticated ID, role, and mandatory reason code
- ❌ Don't use decorative gradients, glow blobs, or multi-color progress bars — enforce Apple minimalist monochrome and solid single-tint accents
- ❌ Don't use expensive `backdrop-filter: blur()` or heavy animations in Fulfillment mobile viewports — Fulfillment is the only domain where performance overrides apply for low-end hardware
- ❌ Don't render borders, dividers, or box shadows on top navigation bars that disrupt the seamless single-canvas aesthetic
- ❌ Don't hardcode aesthetic styling (raw hex colors, font families, static card fills, fixed borders, or shadows) directly in components — always consume centralized semantic theme tokens from `styles/theme.css`
- ❌ Don't use raw Unicode emojis (e.g. ⚠️, 🔒, •, ✅, ❌, 🎉, 📦, 🏷️, ⚖️, ⚡️) anywhere in the UI — use crisp, standardized Lucide React vector icons with semantic styling
- ❌ Don't review, create, or edit code in any domain (e.g. Procurement, Financials, WMS, POS, HR) without simultaneously verifying that our October 2026 Apple minimalist & Liquid Glass themes, semantic design tokens, pure contrast architecture, zero gradients, zero unapproved blurs, and zero emojis are fully and properly applied
- ❌ Don't allow the design system or UI components to drift or lag behind Apple's latest aesthetic standard — re-align and modernize every 6 months without exception
- ❌ Don't use muddy gray cards (#1C1C1E / #2C2C2E) — enforce Apple's authentic pure contrast architecture (#000000 / #1D1D1F in dark mode, #FFFFFF in light mode)
- ❌ Don't treat interfaces as a "collection of boxes" or card traps — establish contrast through typography, negative space, and edge-to-edge content
- ❌ Don't place Liquid Glass materials everywhere — use glass judiciously for navigation bars, toolbars, search pills, sidebars, segmented controls, and modal sheets
- ❌ Don't compromise text visibility, contrast, or legibility for aesthetic minimalism, dark mode styling, or Liquid Glass effects — never use low-contrast, washed-out, or unreadable dim gray typography


