# SIIFMART AI Agent Rules

> Operational standards for SIIFMART assistants. Background: `.agent/RULES.md`, `.agent/TROUBLESHOOTING.md`.

---

## 1. Before ANY Code Change
1. **`git status -s`**: Check for and warn about uncommitted changes.
2. **File Size Check**: If target file exceeds **500 lines**, **split it first** (modals, tabs, subcomponents, hooks).
3. **Compilation Verification**: Verify changes compile with `npx tsc --noEmit`.
4. **Theme Verification**: Verify Apple minimalist, Liquid Glass, semantic tokens, pure contrast, zero emojis. Fulfillment: low-end mobile constraints.

---

## 2. Core Operational & Architecture Invariants

### A. Multi-Country Isolation & National Sovereignty
- **Absolute Data Separation**: Kenya (`KE`) and Ethiopia (`ET`) data (dashboards, stock, sales, shifts) never query or merge.
- **Zero Currency Math**: Never cross-calculate or convert ETB and KES together.
- **Single Global Switch (CEO-Only)**: Country switching exists solely in one central top-nav switch (`canSwitchCountry()`). Non-CEO locked to site country (`getUserCountry()`).
- **Invisible Tenancy**: No per-screen country pickers or tenant banners. Automated via `country_code`.
- **SKUs & Pricing**: Sovereign country prefixes (`ET-`, `KE-`). Independent shelf prices, never auto-converted.
- **Clock & Calendar**: Country timezone (`Africa/Addis_Ababa` vs `Africa/Nairobi`). Monospace clocks must have `flex-nowrap whitespace-nowrap shrink-0`.
- **Linguistic Purity**: Pure single-language UI labels (no Amharic/Oromo mixing). Universal English uses international terms (`National ID`, not `Kebele`).
- **Dual Tax Controllability**: `taxOnPurchasing` and `taxOnSelling` independently configurable per country in `SystemConfig`.

### B. Zero-Trust Central Oversight & Anti-Fraud
- **Zero Branch Autonomy**: Stock edits, write-offs, voids, and price changes require HQ approval (`inventory_requests`).
- **Real-Time Supabase Shifts**: Float, drops, and Z-Reports sync to Supabase in real time — **never store in `localStorage`**.
- **4-Eyes Principle**: Voids, large refunds, drawer kicks require dual sign-off (Cashier + Manager/HQ OTP).
- **Blind Counts & Receiving**: Expected quantities hidden during cycle counts and transfer receipts.
- **Audit Logging**: High-risk events logged to `system_logs` with timestamp, employee ID, site ID, device ID, GPS.
- **Site Scoping**: Branch users only access data for their active `siteId`.

### C. Synaptic Neural Mesh Architecture
- **Connected Propagation**: Mutations propagate to connected nodes (POS sale → FEFO depletion → replenishment → gross margin → gamification → CentralOps). No dead-end mutations.
- **Sovereign Blood-Brain Barrier**: Synaptic signals strictly terminate at national borders. Zero cross-border cascade.

### D. Operational & Merchandising Laws
- **Floor Worker Interchangeability & Delivery Lockdown**: Floor workers (`picker`, `packer`, `receiver`, `inventory_specialist`, `forklift_operator`, `stock_clerk`) and `driver` cross-functional on internal floor jobs (`PICK`, `PACK`, `RECEIVE`, `PUTAWAY`, `COUNT`, `TRANSFER`, `REPLENISH`, `WASTE`, `RETURNS`, `LABELS`). Delivery missions (`DRIVER`, `DELIVERY`, `DISPATCH`) strictly locked to verified drivers.
- **Chain of Custody & Dual-Handshake**: Goods transfers require dual-handshake with driver co-sign if discrepancies exist. Unrecorded variances become receiver's liability.
- **Halal & Non-Alcoholic Catalog**: Zero liquor, beer, wine, or spirits anywhere in catalog, mocks, or examples. High-shrink examples use cooking oil, baby formula, coffee, etc.
- **Supervisory Accountability**: Supervisory actions record authenticated `managerId`, role, timestamp, GPS, and structured reason code. Shift variances co-attributed to supervisor.

### E. Database, RLS & Mandatory In-Chat SQL Delivery
- **Server RLS**: Every database table must have Row Level Security enabled.
- **Allowlist Updates**: Service `update()` methods must use explicit column allowlists — never `{ ...object }`.
- **No Direct Insert-Select Chaining**: Be mindful `.insert().select()` triggers both INSERT and SELECT RLS policies.
- **Mandatory In-Chat SQL Delivery (Rule 9)**: Whenever ANY migration, table, column, index, RPC, or RLS policy is modified, **deliver the complete runnable SQL snippet directly in the chat response** for Supabase SQL Editor.

---

### Mandatory Apple Minimalist & Liquid Glass Design Standard Audit
- **Pure Contrast Architecture**: Dark: Pure OLED black (`#000000`) canvas, deep surfaces (`#000000` / `#1D1D1F`), 1px hairline borders (`rgba(255, 255, 255, 0.08)`). Light: `#F5F5F7` canvas, `#FFFFFF` surfaces.
- **Supreme Text Contrast**: WCAG AA/AAA compliance (`#F5F5F7`/`#1D1D1F` primary, `#A1A1A6`/`#86868B` secondary). Zero dim text (< 0.70 opacity).
- **The 70 / 20 / 8 / 2 Golden Ratio**: 70% Neutral canvas, 20% Surfaces & panels, 8% Text & contrast, 2% Restrained accent (`#0071E3` / `#2997FF`).
- **Liquid Glass Materials (Judicious Use Only)**:
  - Tier 1: Glass Clear (`blur(16px)`): Floating toolbars and seamless topbars.
  - Tier 2: Glass Standard (`blur(24px)`): Sidebars and floating controls.
  - Tier 3: Glass Strong (`blur(32px)`): Modals and floating sheets.
  - Do NOT make regular cards or tables into glass.
- **11-Point "Apple Test" Audit & Enterprise Retail & WMS Synthesis Doctrine**: High-density ERP data made instantly scannable without visual noise.

### Mandatory Low-End Mobile Performance & Warehouse Ergonomics Standard Audit
- Low-end mobile constraints (stripping GPU blurs, solid opaque backgrounds, touch-action: manipulation) are STRICTLY CONFINED to `pages/Fulfillment.tsx` and `components/fulfillment/` for budget Android devices. POS, Admin, and all other domains run full Apple Liquid Glass.

### Mandatory Zero-Hardcoded Aesthetic & Semantic Tokenization Standard Audit
- Consume tokens from `styles/theme.css` (`var(--theme-bg-app)`, `var(--theme-bg-card)`, `var(--theme-text-primary)`, `var(--theme-border)`, etc.).

### Mandatory Zero-Emoji & Professional Vector Iconography Standard Audit (SF Symbols Philosophy)
- Zero raw Unicode emojis in UI. Use Lucide React SVG vector icons with consistent sizing (14px inline/badge, 16px button/input, 20px header).

### Mandatory Universal Theme & Aesthetic Application Audit Across All Domains
- In every file edited across all domains, verify Apple minimalist and Liquid Glass aesthetics.

### Mandatory 6-Month Autonomous Apple Aesthetic Re-Alignment Cycle Audit
- Re-align design tokens and motion physics with Apple's bi-annual OS release cycles.

### Aesthetic Anti-Patterns (Strictly Enforced Don'ts)
- ❌ Don't use decorative gradients, glow blobs, or multi-color progress bars
- ❌ Don't use expensive `backdrop-filter: blur()` or heavy animations in Fulfillment mobile viewports
- ❌ Don't hardcode aesthetic styling (raw hex colors, font families, static card fills, fixed borders, or shadows)
- ❌ Don't use raw Unicode emojis (e.g. ⚠️, 🔒, •, ✅, ❌, 🎉, 📦, 🏷️, ⚖️, ⚡️) anywhere in the UI
- ❌ Don't review, create, or edit code in any domain (e.g. Procurement, Financials, WMS, POS, HR) without simultaneously verifying
- ❌ Don't allow the design system or UI components to drift or lag behind Apple's latest aesthetic standard
- ❌ Don't use muddy gray cards (#1C1C1E / #2C2C2E)
- ❌ Don't treat interfaces as a "collection of boxes" or card traps
- ❌ Don't place Liquid Glass materials everywhere

---

## 4. Coding & Architecture Standards

### File Size Limit (STRICT: < 500 lines)
No file may exceed **500 lines**. If approaching 500 lines, extract modals, tabs, forms, or hooks before making functional changes.

### Code Organization & State
- **Pages** (`/pages/`): Route components, lazy-loaded, wrapped in `<ModuleErrorBoundary>`.
- **Components** (`/components/`): Reusable UI units, modular.
- **Mutations**: Always custom hooks in `/hooks/` — never call services directly from UI components for writes.
- **Queries**: `useQuery` for server data, `useData()` for cache, `useStore()` for auth/session.
- **Utils**: Pure helper functions in `/utils/` (no hooks in `/utils/`).
- **Types**: Typed interfaces in `/types/` or `/types.ts`. Never use `any`.
- **Logging**: Use `logger` from `/utils/logger.ts`, never raw `console.log`.

### Testing & Verification
- Compile check: `npx tsc --noEmit`.
- Targeted test during dev: `npx vitest run tests/path/to/test.ts` (saves tool tokens). Full test suite upon completion.

---

## 5. Token-Efficient High-Accuracy Interaction Protocol

1. **High-Signal Delivery**: Deliver solutions, diffs, and SQL directly without repeating code explanations or conversational filler.
2. **Targeted Tool Inspection**: Read focused line ranges (< 100 lines) with `view_file` rather than entire large files.
3. **Selective Audit Reporting**: Full 15-category checklist is reserved for explicit audit requests (`/audit`) or major multi-file milestones; routine edits state compliance concisely.
4. **Rule 9 In-Chat Delivery**: Always provide complete, copy-pasteable SQL in the response whenever database entities are touched.
