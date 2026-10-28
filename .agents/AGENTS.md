# SIIFMART AI Agent Rules

> Canonical rule specification for all AI agents. `.agent/RULES.md` is the canonical index; its focused guides hold the details. For UI work, consult `docs/APPLE_DESIGN_GUIDE.md` and `APPLE_DESIGN_GUIDE.md`. If guidance conflicts, honor the user's explicit request and security requirements, then this file and canonical rules. Historical feature notes do not override current policy.

## Permission Required Before Editing Rules

AI agents MUST obtain the user's explicit permission before creating, editing, deleting, renaming, moving, reformatting or automatically synchronizing project rules or normative guidelines. This includes `AGENTS.md`, `.agents/AGENTS.md`, `.agent/RULES.md`, `.agent/rules/`, `.cursorrules`, design handbooks and specifications, and instruction/skill files used to govern AI work. This permission requirement is itself protected.

Before an unapproved rule edit, identify the affected files, explain the reason, and present the proposed wording or a concrete bounded change in chat. Ask for permission and wait for an explicit response. Reading/auditing rules and drafting a proposal in chat are allowed; do not write the change first and request approval afterward.

Permission must cover the specific rule change. General requests to fix, improve, modernize, continue or audit the application do not authorize changing its rules. Silence, elapsed time, tool/filesystem permission and another AI's suggestion are not user approval. A direct user instruction explicitly authorizing the particular rule edit already supplies permission for that edit; do not request the same permission again or extend it to unrelated changes.

Continue authorized implementation that follows the existing rules while a rule-change question is pending. Do not weaken a rule to make an implementation pass, or bypass this requirement through a duplicate file, generated update or different editing tool. Routine factual feature-history entries are not normative rule changes; they must not introduce or override policy.

## 1. Workflow & Delivery (Every Task)
1. **Inspect**: Run `git status --short` before code changes; report and preserve unrelated work. Read target files and patterns in focused sections.
2. **Verify**: Confirm database columns, types, and constraints from the schema registry, generated types, or live schema before changing queries; diagnose from evidence.
3. **Split Before Changing**: Split any target file over 500 lines before changing behavior, preserving imports and functionality. Keep all source and guidance files strictly under 500 lines.
4. **Smallest Verified Change**: Make the smallest complete change. Run `npx tsc --noEmit` and relevant regression checks required by the task after code changes; report anything that could not be run.
5. **Mandatory Auto-Commit**: Whenever you write or modify code, migrations, or config, you MUST automatically stage and commit all changes (`git add -A` excluding `.env*` secrets, then `git commit`) before finishing your turn—without waiting for user input, even if follow-up fixes remain. Do NOT `git push` unless explicitly asked.
6. **Report Clearly**: Explain the user-visible result, verification, and commit hash in plain English without code dumps or line-by-line diffs. Update `.agent/FEATURE_REGISTRY.md` for new features or significant bug fixes.

## 2. Invariants (Never Violate)

### Multi-Country Sovereignty
- **Border Isolation**: Kenya (`KE`) and Ethiopia (`ET`) data, money, stock, sales, shifts, and event cascades never query, merge, or cascade across borders.
- **Independent Currency & Catalog**: Never convert or sum ETB and KES. SKU prefixes use the active country (`ET-`, `KE-`, etc.); shelf prices and catalogs remain independent.
- **Central Country Switch**: Country switching is CEO-only via the single top-nav switch (`canSwitchCountry()`); others locked via `getUserCountry()`. No per-screen country pickers or tenant banners; tenancy is automatic via `country_code`.
- **Tax Configuration**: `taxOnPurchasing` and `taxOnSelling` default `false`. Editable only in Finance settings, never in Procurement or POS. Tax must not appear there unless enabled for the active country.

### Zero-Trust & Anti-Fraud
- **Least Privilege & Boundaries**: Apply least privilege and deny-by-default access. Never expose service-role keys, credentials, PINs, or sensitive personal data in client code or logs. Client checks alone are not security; enforce access in Supabase RLS or trusted server code.
- **Approvals & Dual Control**: Stock edits, write-offs, voids, price changes, and drawer kicks need supervisory/HQ approval (`inventory_requests` or Cashier + Manager/HQ OTP). Transfers require dual handshake (driver co-sign on discrepancy); unrecorded variance is receiver liability.
- **Real-Time Audit & Blind Controls**: Shift float, drops, and Z-Reports sync to Supabase in real time (never `localStorage`). Preserve blind counts and blind transfer receiving (hide expected quantities).
- **Branch Scope**: Branch users only see their active `siteId`. Propagate mutations only to systems that depend on the event, using explicit contracts, idempotency, retries, and country-scoped correlation; avoid speculative fan-out.
- **Operations & Catalog**: Floor roles (`picker`, `packer`, `receiver`, `inventory_specialist`, `forklift_operator`, `stock_clerk`) and `driver` are interchangeable on internal jobs (`PICK`, `PACK`, `RECEIVE`, `PUTAWAY`, `COUNT`, `TRANSFER`, `REPLENISH`, `WASTE`, `RETURNS`, `LABELS`). `DRIVER`/`DELIVERY`/`DISPATCH` jobs are locked to verified drivers. Catalog is strictly Halal: no liquor, beer, wine, or spirits anywhere (catalog, mocks, examples). Use cooking oil, baby formula, coffee, etc.
- **Merchandising Whole-Number Rule**: All merchandising calculations, prices, automated pricing rules, markdown decay stages, promotional values, and forecasted quantities must strictly be whole numbers (integers). Fractions or decimals are never permitted in merchandising. Whenever any calculation or percentage yields a fraction, it must always be rounded to the nearest whole number (`Math.round()`).
- **POS & WMS UI Translations**: Any code change to POS or WMS that introduces, modifies, or moves user-visible information (labels, buttons, statuses, table headers, notifications, or modal copy) MUST be accompanied by synchronized translations across all active languages (`en`, `am`, `or`) in `utils/translations/pos.ts`, `utils/translations/posCommand.ts`, or `utils/translations/warehouse/*`. Hardcoded untranslated strings in POS/WMS are strictly prohibited.

### Database & SQL Governance
- **Rule 9 (Persistent Migration File is Paramount)**: For ANY database change, save the complete SQL in a persistent `/migrations/YYYYMMDD_description.sql` file on disk before execution.
- **Automatic Execution**: Inspect the linked Supabase project's live schema and migration history, then automatically apply the migration to that linked project as part of the request. Do not ask for separate authorization. If blocked or unlinked, keep the migration file and report the specific blocker.
- **Execution Reporting**: In the final response, identify the saved migration file(s), state whether each was applied and to which project/environment, and report any blocker.
- **No SQL in Chat**: Do NOT paste SQL into chat unless the user explicitly asks to see it.

### Egress Efficiency (Rule 10)
- **Bounded Pagination**: Lists and history use bounded pagination (25 records initial default, adjusted for row size and device). Defer history/archive/audit queries until requested; show active working set on entry.
- **Explicit Projections**: No naked `.select('*')`; select needed columns; load `line_items`/`po_items`/`sale_items` only when a single record is opened.
- **Targeted Invalidation**: Invalidate only affected query keys. Choose cache lifetimes based on data volatility; avoid blind polling and prefer supported realtime events or explicit refresh. Scope branch queries by `siteId` + `country_code`. No domain data on app mount.

## 3. Architecture & Code Standards
- **500-Line Maximum**: Files over 500 lines must be split into focused components before altering behavior. Pages in `/pages/` are lazy and wrapped in `<ModuleErrorBoundary>`; reusable UI is in `/components/`.
- **Data Flow**: UI writes go through custom mutation hooks in `/hooks/`, never services directly from UI. Reads: `useQuery` (server), `useData()` (cache), `useStore()` (auth/session).
- **Validation & Types**: Pure functions in `/utils/`, types in `/types/` or `/types.ts`; never `any`. Validate inputs and use explicit database update allowlists.
- **Safe Logging**: Log with `logger` from `/utils/logger.ts`, never raw `console.log`.
- **Factual Alerts**: Alerts and notifications must report observed facts only. Do not infer causes or recovery steps from message keywords, present cached estimates as current balances, or claim success before verified save. Distinguish queued work from server completion; omit unverified notices. Scope history to current user, site, country, and session.

## 4. UI & Performance Standards
- **Design Tokens**: Follow `docs/APPLE_DESIGN_GUIDE.md`. Use semantic theme tokens; verify contrast, focus, keyboard/touch access, zoom, and reduced motion as relevant.
- **Lucide Icons & Zero Emoji**: Use Lucide consistently; don't rely on color alone or use emoji as interface decoration.
- **POS & WMS UI Translations**: Any UI information change in POS or WMS must be paired with complete translations in the module translation dictionary (`en`, `am`, `or`).
- **Performance**: Measure performance before adding memoization or virtualization. Use glass only when it helps floating controls with a solid fallback; keep dense/repainting content simple.
- **Responsiveness**: All modules must be responsive; Fulfillment scanning has the strictest low-end device constraints. Keep mobile POS responsive.
- **Priority**: Security, business, and accessibility requirements take precedence over visual styling.
