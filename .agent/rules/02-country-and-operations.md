# SIIFMART Country and Operations Rules

> Country names, legal/tax values, thresholds, and workflow examples in this guide are not executable defaults. Verify them against approved country configuration and current authoritative requirements before implementing them.

## Role Hierarchy

| Level | Roles | Access |
|-------|-------|--------|
| L1 | `group_ceo`, `CEO` | Full system access |
| L2 | `regional_manager`, `operations_manager`, `procurement_manager`, `hr_manager`, `finance_manager` | Department/region-wide |
| L3 | `store_manager`, `warehouse_manager`, `assistant_store_manager` | Site-scoped |
| L4 | `cashier`, `picker`, `driver`, etc. | Task-specific |

### Approval Pattern
```typescript
const canApprove = ['group_ceo', 'CEO'].includes(user?.role || '');
```

---

## Branch Oversight and Daily Reconciliation

> **Operating principle**: Branch authority is limited by role and approved workflow. Sensitive actions need appropriate approval and traceability; monitoring should be proportionate to the risk.

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

### 4. Immutable Audit Trail & Context
- Sensitive events (void, drawer kick, refund, price change, shift close) must write a restricted, append-only audit record with timestamp, authenticated actor, branch/site, action, target, and required reason where applicable.
- Collect device or location details only for approved, risk-justified workflows; browser-provided GPS is untrusted and should not be treated as proof of identity.
- **Strict Site Scoping**: Branch users can NEVER view cross-site inventory counts, supplier costs, central profit margins, or other branches' financial data.

---

## Multi-Country Tenant Isolation & National Sovereignty Model

> **Operating Reality**: SIIFMART operates across multiple sovereign East African nations (Ethiopia HQ `ET`, Kenya Hub `KE`, and extensible to Uganda `UG`, Rwanda `RW`, Tanzania `TZ`).
> **Core Principle**: **One Platform, Distinct National Realities**. Absolute data isolation across countries. Zero cross-border data bleeding.

### 1. Enterprise Architecture: Absolute Multi-Country Data Separation
- **Zero Cross-Country Data Leakage**: Dashboards, sales KPIs, gross profit, stock counts, orders, shifts, and employee rosters in Kenya must **NEVER** mix, display, or aggregate Ethiopian data (and vice-versa).
- **Zero Arithmetic Cross-Addition**: Under no circumstances may 1,000 ETB and 1,000 KSh be added together into a single sum.
- **Non-CEO Staff Lockdown**: Cashiers, store managers, pickers, and drivers are hard-pinned to their assigned site's country via `getUserCountry()`. Any attempt to tamper with client storage, URL parameters, or network payloads to view another country is blocked.
- **Executive Dual-Oversight (CEO / Super Admin Only)**: Only the `CEO` or `group_ceo` can switch country instances (`canSwitchCountry()`). When switching, the entire application context (sites, active facility, products, sales, orders, employees) cleanly re-hydrates to that country.
- **Physical Facility & Intra-Country Movement**: All facilities (Stores, Warehouses, Distribution Centers) are bound to one country. Standard stock movements are intra-country only; cross-border movements require international import/export customs clearance.
- **Legacy Baseline & New Country Guarantee**: All historical data defaults to Ethiopia (`ET`). Any new country added starts 100% fresh as an isolated tenant with zero code refactoring.

### 2. Merchandising Separation Rules
- **National Assortment & Catalog Scope**: While a global barcode or SKU reference may exist in the master library, products are only sellable and visible if active for that country's sites. POS and inventory lookups never leak other countries' products.
- **National Price Sovereignty**: Retail prices are explicitly entered and maintained in local currency (**`KSh`** in Kenya, **`ETB`** in Ethiopia). Never auto-convert retail shelf prices across borders using live exchange rates.
- **Zero Autonomous Price Changes**: Branch managers and cashiers have zero authority to alter prices or create custom discounts. All markdowns require HQ approval.
- **Campaign & Voucher Isolation**: Promotional campaigns (e.g. Mashujaa Day vs Enkutatash) and discount vouchers are country-bound. Kenyan vouchers return "Invalid code" at Ethiopian registers.
- **Perishable Markdowns & Forecasting**: Perishable markdown schedules and AI demand forecasting models train and execute exclusively on local country sales history.

### 3. Settings & System Configuration Separation Rules
- **Independent Country Values**: Any operational or legal setting that can differ by country (tax, tender, fiscal format, approval limits, workflow policy) must have an explicit country key and independent values. A value for one country must never silently inherit from or override another.
- **Shared Technical Defaults**: A genuinely non-operational technical default may be shared if it contains no national policy or data. Make the scope explicit and do not let a shared default override a country-specific value.
- **Per-Country Database Scoping**: Scope configuration reads/writes and cache keys to the active `country_code`; validate scope at trusted boundaries.
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
- **Configuration decision**: For a new policy or threshold, decide whether an authorized operator needs to change it or whether countries/sites legitimately differ. Keep stable technical behavior in code.
- **Safe settings**: A configurable policy needs an owner, country/site scope where applicable, validated bounds, a safe default, audit history, and server-side enforcement.
- **Do not create settings just to avoid constants**: Every setting adds support, testing, migration, and security costs. Add it only when it solves a real operational need.

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

### 16. Shared UI quality standard
- Follow the project design tokens and the focused UI guide. Prefer clear hierarchy, predictable navigation, readable content, and restrained decoration.
- Apply the same design system across modules, adapting density and interaction to the user's task, device, and accessibility needs. Do not perform an unrelated full-screen redesign as part of a narrow code fix.
- Use Lucide icons consistently and avoid emoji as interface decoration. Status must also be conveyed with text or shape, not color alone.
- Do not assume a particular Apple release defines official web tokens. Treat the project guide as an internal design direction and verify accessibility and browser support directly.

### 17. Mobile and warehouse ergonomics
- Keep all modules responsive and usable by keyboard, touch, and assistive technology. Fulfillment scanning flows need additional support for one-handed use, gloves, poor connectivity, and constrained hardware.
- Make the target, item, quantity, and next action easy to see. Keep scan feedback immediate, support correction and recovery, and avoid hiding critical actions behind hover-only UI.
- Use solid surfaces and restrained motion in scrolling/scanning views on low-end devices. Test with representative hardware where possible.
- Preserve blind-counting and receiving controls; visual simplification must never reveal expected quantities or weaken handover checks.

### 18. Theme and accessibility
- Consume existing semantic tokens from `styles/theme.css`; add or change tokens centrally rather than scattering raw colors, shadows, radii, and type values.
- Maintain readable contrast, visible focus, zoom/reflow, reduced-motion support, and appropriately sized controls. Validate actual rendered states in light and dark modes.
- Use glass only where it improves a floating control layer and keep a solid fallback. Avoid blur on dense or frequently updated content.
- Review the design system when product needs or platform support materially change; do not require speculative redesign on a calendar.

## Procurement assignment boundaries

- Procurement authority follows the employee’s assigned region, area, or operating site. Regional support roles do not grant countrywide access.
- Regional office staff may handle only their assigned region; operating-site staff may handle only their own site. Missing or mismatched assignments deny access.
- Countrywide procurement requires an explicit national HQ assignment and authorized role. The active country or region lens cannot expand an employee’s assignment.
- Apply the same boundary to order lists, receiving destinations, supplier operations, and trusted database policies.
