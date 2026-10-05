# SIIFMART AI Agent Rules

> All AI assistants working on this project MUST follow the rules in `.agent/RULES.md`.

## Before ANY Code Change
1. Run `git status` — warn if there are uncommitted changes
2. Check if the file you're editing exceeds 500 lines — if so, **split it first**
3. Verify changes compile: `npx tsc --noEmit`
4. **Theme & Aesthetic Audit**: In every file edited or reviewed across all non-fulfillment domains (e.g. POS, POS Command, Administration, Financials, Procurement, HR, Settings), verify that our October 2026 Apple Liquid Glass & minimalist aesthetic, semantic tokens, pure contrast architecture (zero gray cards), zero decorative gradients, and zero emojis are fully and properly applied. In Fulfillment, verify low-end mobile performance rules.

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
10. **Mandatory Synaptic Neural Mesh Audit**: For every feature, workflow, mutation, or event created or reviewed, explicitly verify: **"Does this action propagate to all connected downstream and upstream operational nodes like a neural network?"** Any mutation or workflow that acts as a disconnected, dead-end island without updating adjacent domains (e.g. POS sale failing to deplete FEFO inventory, notify replenishment in WMS, accrue gross margin in Financials, award gamification points, and pulse CentralOps telemetry) is a direct failure.
11. **Mandatory Linguistic Purity Audit**: For every UI label, clock subtitle, date format, toast, and receipt template, explicitly verify: **"Is this strictly pure in the active language without any inter-dialect mixing?"** Concatenating or mixing two distinct national languages (e.g., Amharic and Afaan Oromoo into `Jimaata (ዓርብ)`) is a direct violation. The UI must render 100% pure Amharic, 100% pure Oromo, 100% pure Swahili, or 100% pure English based on the active language (`useLanguage()`).
12. **Mandatory Sovereign Clock & Calendar Audit**: Explicitly verify that live clocks, calendar widgets, and shift start/end times strictly reflect the active country's sovereign calendar and timezone (`Africa/Addis_Ababa` vs `Africa/Nairobi`). Live monospace digital clock displays MUST enforce `flex-nowrap whitespace-nowrap shrink-0` to guarantee digits never wrap vertically into a column. Duplicate calendar date widgets side-by-side are strictly prohibited.
13. **Mandatory Dual Tax/VAT Controllability Audit**: Explicitly verify that tax calculations on both purchasing (`taxOnPurchasing`) and selling (`taxOnSelling`) are individually controllable per country in `SystemConfig`. Hardcoding automatic tax calculation on PO creation or POS checkout without checking country-level config toggles is a direct failure.
14. **Mandatory Header Ergonomics & Heavy Action Hierarchy Audit**: Explicitly verify that top operational bars (Central Operations, POS Command, WMS dashboards) remain lean and dedicated to live telemetry, search/filters, active shift indicators, and sovereign time. Heavy action buttons (e.g., "Get App (macOS)", "Executive Quarterly Export", "Mass CSV Import") MUST NOT clutter top navigation bars; they must be positioned in dedicated bottom operational suites or action drawers.
15. **Mandatory Floor Worker Interchangeability & Delivery Lockdown Audit**: Explicitly verify that floor workers (`picker`, `packer`, `receiver`, `inventory_specialist`, `forklift_operator`, `stock_clerk`) and `driver` are fully cross-functional on ALL internal warehouse/store floor jobs (`PICK`, `PACK`, `RECEIVE`, `PUTAWAY`, `COUNT`, `TRANSFER`, `REPLENISH`, `WASTE`, `RETURNS`, `LABELS`). A driver CAN perform all floor jobs. Explicitly verify that floor workers CANNOT perform or be assigned to delivery jobs (`DRIVER`, `DELIVERY`, `DISPATCH`). Delivery missions are strictly locked to verified drivers.
16. **Mandatory Chain of Custody & Acceptance Responsibility Audit**: Explicitly verify that all goods transfers enforce the Chain of Custody & Acceptance Responsibility Policy ("You Inspect Before You Accept. The Moment You Accept, You Own It"). Transfer receipts require the Digital Dual-Handshake with driver co-sign if discrepancies exist, and confirmed variances automatically penalize the responsible party's accuracy score on the national gamification leaderboard.
17. **Mandatory Non-Alcoholic / Halal Catalog Compliance Audit**: Explicitly verify that the catalog, taxonomy, sample data, mock items, audit sheets, and UI examples contain ZERO liquor, beer, wine, spirits, or alcoholic products under any circumstances. SIIFMART does NOT sell alcohol. Under no circumstances may liquor be listed as a product category, sample SKU, or high-shrink risk example. High-shrink or high-value examples must strictly use commodities like cooking oil, infant formula, coffee, tea, honey, electronics, cosmetics, or fresh meat.
18. **Mandatory Manager & Supervisory Accountability Audit**: Explicitly verify that managers across all 16 managerial roles are held strictly accountable under the "Captain Owns the Ship" doctrine. Every supervisory override, approval, or job assignment must capture authenticated `managerId`, role, timestamp, GPS, and a mandatory structured reason code. Shift cash variances and receiving discrepancies are co-signed and co-attributed to on-duty supervisors, and excessive override velocity (> 3%) triggers automated Central HQ audit alerts.
19. **Mandatory Universal English UI & Neutral Sovereignty Audit**: Explicitly verify that under no circumstances may Ethiopian-specific administrative or cultural terms (such as `Kebele`, `Woreda`, etc.) be hardcoded into universal English UI labels, placeholders, tooltips, or form fields. Universal English UI elements must strictly use international, neutral terms (e.g. `National ID / Passport Number`, `Residential Address`, `Street, Building, Apt / House No.`). Ethiopian terms must ONLY appear when the active language is an Ethiopian national language (`am` for Amharic, `or` for Afaan Oromoo) or when data is explicitly partitioned and displayed under the Ethiopian national instance (`ET`).
20. **Mandatory Apple Minimalist & Liquid Glass Design Standard Audit (Total Omnipresence Across Every Single Element)**: Explicitly verify that the October 2026 Apple aesthetic (macOS 27 / iOS 27 baseline) is strictly applied to EVERY SINGLE visual element across the entire platform. The 2026 formula is: **SF typography + generous whitespace + edge-to-edge content + Liquid Glass controls + restrained semantic colour + layered SF-style icons + rounded geometry + subtle depth + responsive motion**. Zero exceptions:
   - **Content-First Architectural Priority**: `CONTENT → STRUCTURE → NAVIGATION → CONTROLS → DECORATION` (never `Cards → Borders → Shadows → Gradients → Content`). The interface must NEVER look like a cluttered "collection of boxes" or card traps. Contrast is established through typography, generous negative space, and edge-to-edge content.
   - **The 70 / 20 / 8 / 2 Golden Ratio Rule**: 70% Neutral canvas/background (`#000000` dark / `#F5F5F7` light); 20% Surfaces & panels (`#000000` / `#1D1D1F` in dark, `#FFFFFF` in light; zero muddy gray `#1C1C1E` / `#2C2C2E` cards); 8% Text & structural contrast (`#F5F5F7` dark, `#1D1D1F` light) with 1px hairlines; 2% Restrained accent color (`#0071E3` / `#2997FF`) for primary CTAs and active indicators.
   - **Liquid Glass Materials & Three-Tiered Hierarchy ("Glass Isn't Everywhere")**: Glass is a dynamic material combining optical clarity, fluidity, blur, and specular highlights. Tier 1: Glass Clear (opacity ~0.25–0.35, `blur(16px)` for floating toolbars/topbars); Tier 2: Glass Standard (opacity ~0.45–0.60, `blur(24px) saturate(180%)` with specular highlight for sidebars/controls); Tier 3: Glass Strong (opacity ~0.65–0.80, `blur(32px) saturate(180%)` for modals/sheets). Strictly avoid making regular cards, tables, or sections into glass.
   - **Tonal Depth & Soft Shadows**: Level 0 (Canvas) → Level 1 (Content Surface) → Level 2 (Elevated / Glass Controls) → Level 3 (Modal / Floating Sheet). Soft elevation shadows: Small (`0 2px 8px`), Medium (`0 8px 30px`), Floating (`0 16px 50px`), Modal (`0 24px 80px`).
   - **Standardized Corner Radii**: Small controls/inputs: 10px–12px; medium cards/controls: 14px–18px; large containers: 20px–24px; floating sheets/modals: 28px+; pills/badges: 999px (`rounded-full`). Formal tokens: `--radius-xs` (6px) through `--radius-2xl` (28px).
   - **Typography Scale & Negative Letter Tracking**: SF Pro / `system-ui` with tighter tracking on large headings: Display 56px @ `-0.035em`, Large Title 40px @ `-0.025em`, H1 32px @ `-0.02em`, H2 26px @ `-0.015em`, H3 21px, Body 15–16px @ `0`, Caption 11–12px @ `+0.01em`. Tabular numbers (`tabular-nums`) for currency, stock counts, quantities, KPIs, and sovereign clocks.
   - **Spacing & Generous Whitespace**: 4px base grid (`--space-1: 4px` to `--space-16: 64px`). Enforce generous negative space (1.5x–2x standard SaaS spacing).
   - **Motion & Natural Spring Dynamics**: `--ease-apple: cubic-bezier(0.2, 0.8, 0.2, 1)`, Fast 120ms, Normal 200ms, Slow 320ms, tactile compression on click (`active:scale-[0.98]`). Communicates physical location without loud distraction; respects `prefers-reduced-motion`.
   - **Component Ergonomics & Hierarchy**: 44px standard height for interactive inputs/buttons (SM: 36px, MD: 44px, LG: 52px). Exactly ONE primary action per screen (solid high-contrast pill: `#FFFFFF` in dark, `#1D1D1F` in light). KPI cards strictly enforce ZERO rainbow gradients (13px label + 32-40px bold tabular numeral + delta). Tables have 48-56px row height with hairline separators. Sidebar active item uses subtle surface + macOS 27 domain-specific tinting.
   - **The 10-Point "Apple Test" Audit**: Before approving any UI component, verify: (1) Content priority? (2) Could I remove a border? (3) Could I remove a card? (4) Could I reduce colour (70/20/8/2)? (5) Could I simplify the icon? (6) Generous 1.5x-2x spacing? (7) Hierarchy works without decoration? (8) Glass serves functional purpose? (9) Dark mode intentionally designed? (10) Works without animation?
   - **Enterprise Retail & WMS Synthesis Doctrine**: Synthesize Apple 2026 aesthetics with heavy-duty enterprise retail & WMS information architecture (dense operational tables, bin locations, SKU tracking, FEFO batch expiry, barcode scanners, and fast filters). Low-end mobile constraints (stripping GPU blurs) remain strictly quarantined to Fulfillment mobile viewports.
21. **Mandatory Low-End Mobile Performance & Warehouse Ergonomics Standard Audit (Strictly Confined to Fulfillment)**: Explicitly verify that low-end mobile performance constraints (stripping GPU blurs, restricting heavy RAM/GPU animations, solid opaque backgrounds) are STRICTLY CONFINED to the Fulfillment domain (pages/Fulfillment.tsx and components/fulfillment/), where frontline warehouse workers operate on budget $50–$100 Android smartphones (2GB–3GB RAM, budget Mali/PowerVR GPUs e.g. Tecno, Infinix, Itel, Samsung Galaxy A0x). In ALL other domains — POS, POS Command, Administration, Central Operations, Financials, Procurement, Inventory, HR, Settings — our full October 2026 Apple aesthetic (Liquid Glass, natural spring dynamics, pure contrast architecture) applies completely without artificial mobile downgrades. Fulfillment interactive mobile elements must enforce minimum 48×48px tap targets with touch-action: manipulation (no 300ms tap delay) and high-contrast monospace tables.
22. **Mandatory Zero-Hardcoded Aesthetic & Semantic Tokenization Standard Audit**: Explicitly verify that hardcoding of ANY aesthetic attribute is strictly avoided. Under no circumstances should arbitrary raw color hex codes, hardcoded font declarations, static card fills, fixed border colors, or ad-hoc shadows be embedded into components. ALL visual styling — fonts, text colors, card surfaces, panels, inputs, borders, status pills, and themes — MUST be driven exclusively by centralized semantic tokens in `styles/theme.css` (`var(--theme-bg-app)`, `var(--theme-bg-panel)`, `var(--theme-bg-card)`, `var(--theme-text-primary)`, `var(--theme-text-secondary)`, `var(--theme-border)`, `var(--theme-primary)`, etc.). This ensures that any future visual redesign, font update, or brand evolution can be instantly executed across the entire platform from a single centralized stylesheet without editing hundreds of individual component files.
23. **Mandatory Zero-Emoji & Professional Vector Iconography Standard Audit (SF Symbols Philosophy)**: Explicitly verify that under no circumstances are raw Unicode emojis (e.g. ⚠️, 🔒, •, ✅, ❌, 🎉, 📦, 🏷️, ⚖️, ⚡️) used anywhere in the user interface — including buttons, headers, tabs, status pills, tables, alerts, toasts, or tooltips. Raw emojis produce cartoonish visuals and inconsistent cross-platform rendering. All iconography must be implemented exclusively using crisp, scalable, professional SVG vector icons (Lucide React) matching SF Symbols geometry, standard stroke weights (1.5px/2px), and consistent sizing tokens (14px inline/badge, 16px button/input, 20px header, 24px+ modal/hero). In navigation sidebars, icons adopt distinctive domain-specific semantic tinting (macOS 27 pattern: blue for dashboard, emerald for orders, amber for products, purple for settings).
24. **Mandatory Universal Theme & Aesthetic Application Audit Across All Domains**: Whenever ANY file, component, workflow, hook, service, or modal is created, edited, reviewed, or audited — regardless of domain (Procurement, Financials, WMS, POS, HR, Central Ops, Settings, etc.) — you MUST actively verify whether our themes and October 2026 Apple minimalist & Liquid Glass aesthetic are properly, fully, and strictly applied there. For example, when checking how procurement purchase orders or receiving workflows operate, the AI must NOT stop at functional logic; it MUST simultaneously audit whether procurement's tables, cards, inputs, status pills, action buttons, and modals consume semantic theme tokens (`var(--theme-*)`), enforce zero gradients, eliminate unapproved blurs (blurs allowed only for judicious Liquid Glass navigation/modals, strictly zero blurs in mobile fulfillment), contain zero raw Unicode emojis, and use professional vector icons. No functional task or review is complete without verifying total theme compliance in that touched domain.
25. **Mandatory 6-Month Autonomous Apple Aesthetic Re-Alignment Cycle Audit**: Explicitly verify that the design system, semantic design tokens (`styles/theme.css`), component motion physics, and typography hierarchy are systematically reviewed, audited, and modernized every 6 months to re-align with Apple's absolute latest design language (synchronized with Apple's bi-annual design updates, e.g. June WWDC and September/October OS releases like iOS/iPadOS 27 and macOS 27). The rules automatically enforce that every 6 months, all components are re-evaluated against the latest Apple macOS/iOS aesthetic standard — ensuring that corner radiuses, spring animations, surface layers, system gray palettes, and typography tracking never degrade or lag behind Apple's newest design standards.

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

### 9. Dual Tax / VAT Controllability & Exempt Purchasing Framework
- **National Tax Gating**: In emerging East African markets, enterprises purchase both from formal VAT-registered corporate vendors and informal smallholders/farmers (exempt from VAT or non-registered). Similarly, specific retail goods, basic foodstuffs, or promotional channels may be tax-exempt.
- **Mandatory Independent Toggles**: Tax calculation on purchases (`taxOnPurchasing`) and sales (`taxOnSelling`) MUST be individually configurable per country in `SystemConfig`.
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
- **Apple Minimalist Design Standard**: Clean Apple macOS / web architecture simplicity across Dark and Light modes. Pure OLED black (`#000000`) in dark mode, Apple off-white (`#F5F5F7`) in light mode. Studio window panels and cards follow Apple's pure contrast architecture with strictly zero gray cards (`#000000` / `#1D1D1F` in dark, `#FFFFFF` in light with crisp 1px hairline borders), signature Apple typography (`#F5F5F7`/`#86868B` in dark, `#1D1D1F`/`#86868B` in light with `-0.015em` tracking), pill buttons (`border-radius: 980px`), and seamless top navigation bars that match the wallpaper canvas with zero dividing lines (`border-0 border-transparent shadow-none`). Strictly zero gradients and zero decorative glow blobs.
- **Low-End Mobile 60 FPS Performance (Strictly Confined to Fulfillment)**: Low-end mobile constraints (stripping GPU blurs, restricting RAM/GPU animations, solid opaque surfaces) apply exclusively to Fulfillment (`pages/Fulfillment.tsx` and `components/fulfillment/`) on budget $50–$100 Android devices (2GB–3GB RAM). POS, Administration, and all other domains run our full October 2026 Apple Liquid Glass aesthetic without artificial mobile throttling.
- **Zero-Hardcoded Aesthetic & Semantic Tokenization**: Never hardcode visual aesthetics (colors, raw hex codes, font declarations, card fills, fixed borders, or shadows) inside component code. All visual styling MUST consume semantic design tokens (`var(--theme-bg-card)`, `var(--theme-text-primary)`, `var(--theme-border)`, etc.) so the design system remains universally adaptable from `styles/theme.css`.
- **Zero-Emoji & Professional Vector Iconography Standard**: Never use raw Unicode emojis (⚠️, 🔒, •, ✅, ❌, 🎉, 📦, 🏷️, ⚖️, ⚡️) anywhere in the enterprise UI. All iconography must use standardized SVG vector icons (Lucide React) with uniform sizing (14px inline/badge, 16px button/input, 20px header), balanced stroke weights (1.5px/2px), and semantic tinting.
- **Universal Theme & Aesthetic Verification**: In every code edit or review across all domains (Procurement, Financials, POS, WMS, HR, Central Ops), simultaneously audit and enforce theme compliance (semantic design tokens, pure contrast architecture, zero gradients, zero unapproved blurs, zero emojis, professional vector icons). Never separate functional review from visual aesthetic enforcement.
- **6-Month Autonomous Apple Aesthetic Re-Alignment**: Every 6 months (aligned with Apple's bi-annual WWDC and OS cycles), automatically review and modernize the design system tokens, motion physics, and typography hierarchy to match the absolute latest Apple design language.
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
- ❌ Don't use legacy palettes (cyber-*, sand/emerald/amber) — enforce our authentic October 2026 Apple aesthetic across POS, Administration, and all non-fulfillment domains
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

## References
- Full rules: `.agent/RULES.md`
- Troubleshooting: `.agent/TROUBLESHOOTING.md`
- Feature registry: `.agent/FEATURE_REGISTRY.md`
