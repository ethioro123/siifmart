# Feature Registry
# This file records selected implementation history; it is not a source of current policy.
# Update it for new features or significant fixes, and verify the current code before relying on older notes.

## Active Features

### Recoverable Employee Onboarding Drafts (2026-10-19)
- Shared HR, POS, and WMS onboarding now saves candidate progress automatically, flushes pending progress when the wizard closes or the page leaves, and provides a country-scoped saved-drafts drawer for resuming or deleting work. Drafts remain on the current device; candidate passwords are stripped when saving and cleared from legacy drafts on read, so they must be entered again after resuming.
- **Files**: `hooks/useEmployeeWizard.ts`, `hooks/useEmployeeDrafts.ts`, `utils/employeeDrafts.ts`, `components/employees/modals/AddEmployeeWizard.tsx`, `components/employees/OnboardTalentModal.tsx`, `components/employees/wizard/EmployeeDraftsDrawer.tsx`
- **Database**: None

### Staging Operational Role Coverage (2026-10-19)
- Filled 168 missing employee slots in staging across four warehouses, four distribution centers, twelve retail stores and four online/dark stores. Each WMS site has active coverage for 17 operational roles; each POS site has coverage for 12. Existing employees satisfy coverage and remain unchanged. Added employees are labelled `[TEST]`, use country-scoped employee codes and linked Auth/profile records, and have unique random password hashes, empty wallets in the site's currency, no invented salary/identity facts and pending credential handover. A staging migration-history guard prevents these fictitious records from being seeded into main.
- **Files**: `migrations/20261019_staging_complete_site_role_coverage.sql`, `migrations/20261019_staging_fixture_quota_cleanup.sql`, `tests/security/staging-site-role-coverage.sql`
- **Database**: Applied to SIIFMART Staging only, as explicitly selected by the user.

### Supervised Fulfillment Points and Mobile Startup (2026-10-19)
- Supervisor points awards save totals and their audit in one invoker RPC, with employee/site checks, completed-job attribution, duplicate-job protection, and stale-total rejection. Audit policies now match existing manager scope. The verified missing audit for PACK VYUU9L was recovered without changing its 95-point balance. Warehouse mobile startup uses role permissions while the site is loading, including redirects from stale POS URLs.
- **Files**: `services/gamification.service.ts`, `contexts/GamificationContext.tsx`, `utils/roleDashboard.ts`, `components/ProtectedRoute.tsx`, `migrations/20261019_fix_supervised_points_awards.sql`, `migrations/20261019_reconcile_pack_points_audit.sql`, `tests/security/`, `tests/services/gamification.service.test.ts`, `tests/components/ProtectedRoute.test.tsx`, `tests/utils/roleDashboard.test.ts`
- **Database**: Points migrations applied to staging and main; the main project also received the existing WMS recursion/log actor migration already present in staging.

### Floor-Friendly PACK Scanner (2026-10-19)
- The bottom action in PACK job details starts the full-screen scanner after the job is moved to In-Progress, matching the PICK modal-to-scanner handoff. The job modal closes while scanning and returns to its item step when the scanner closes or all lines are verified, ready for carton and label steps. Item scanning is only available in the full-screen scanner; the item list has no duplicate camera button or barcode input, and scan progress is resumed from the bottom action. Other steps use the shared bottom action for navigation and completion. Product identity and required quantities are large and glanceable, the scanner fits without vertical scrolling, scans must match a line in the job, and only the exact required quantity can be confirmed.
- **Files**: `components/fulfillment/pack/PackJobModal.tsx`, `components/fulfillment/pack/PackScanner.tsx`, `components/fulfillment/pack/PackScannerStatusView.tsx`, `components/fulfillment/pack/components/PackJobFooter.tsx`, `components/fulfillment/pack/components/PackJobItemCard.tsx`, `components/fulfillment/pack/steps/Step1PackDetails.tsx`, `components/fulfillment/pack/steps/Step1PackItems.tsx`, `components/fulfillment/pack/steps/Step2BoxPrep.tsx`, `components/fulfillment/pack/steps/Step3WeighSeal.tsx`, `components/fulfillment/pack/steps/Step4PrintFinish.tsx`, `components/fulfillment/pack/components/PackModalsContainer.tsx`, `utils/packScanValidation.ts`, `tests/utils/packScanValidation.test.ts`, `playwright.config.ts`, `tests/e2e/pack-scanner.spec.ts`, `tests/e2e/pack-flow-harness.html`, `tests/e2e/pack-flow-harness.tsx`
- **Database**: None

### PACK Shipping Label Output (2026-10-19)
- Standard pack printing produces a fixed-height 4 × 6 shipping label for one carton, independent of carton size. The label includes packed item names, SKUs, and picked quantities while keeping destination, handling, job reference, and tracking codes visible on the same page. Reprints retain supported media sizes; the unsupported tiny size maps to the compact layout. Removed the item-row action because it generated a misleading shipping label for one SKU. Text is escaped and missing origin addresses are left blank rather than fabricated.
- **Files**: `components/fulfillment/pack/hooks/usePackLabelPrint.ts`, `components/fulfillment/pack/steps/Step4PrintFinish.tsx`, `components/fulfillment/pack/components/PackJobItemCard.tsx`, `components/fulfillment/pack/PackJobModal.tsx`, `components/fulfillment/pack/steps/Step1PackItems.tsx`, `components/fulfillment/pack/components/PackModalsContainer.tsx`, `components/fulfillment/pack/PackDetailsModal.tsx`, `utils/labels/PackLabelGenerator.ts`, `utils/labels/packShippingLabelTemplate.ts`, `tests/utils/packLabelGenerator.test.ts`, `tests/e2e/pack-label-output.spec.ts`
- **Database**: None

### Secure PICK-to-PACK Handoff (2026-10-19)
- Completing a PICK creates its PACK through an idempotent database function that verifies the authenticated employee, active WMS role, completed-by identity, and country/site scope. The resulting PACK is assigned to that employee so the operation can load under WMS row-level security. Failed handoffs state that PICK persisted and are caught by the scanner handler.
- **Files**: `migrations/20261019_create_pack_after_completed_pick.sql`, `services/wms-jobs.service.ts`, `components/fulfillment/useJobCompletion.ts`, `components/fulfillment/PickTab.tsx`, `tests/services/wmsJobsZeroTrust.test.ts`
- **Database**: Applied to Staging (`utykzifrblpyxlvlknsm`)
- **Root Cause**: The client attempted a direct insert into `wms_jobs` after persisting the completed PICK; RLS rejected the follow-up job and the scanner handler left an unhandled rejection.

### SKU-Identity Product Labels and Country-Scoped Worker IDs (2026-10-19)
- Product label barcodes and human-readable codes now use the product SKU consistently across label preview, batch printing, shelf tags, and inbound putaway labels. Catalog barcodes remain available as scan aliases, not as the printed product identity.
- Employee code allocation uses an atomic country-specific database sequence so RLS-filtered site lists and concurrent hires cannot issue IDs from a stale local maximum.
- **Files**: `components/LabelPrintModal.tsx`, `components/fulfillment/ReceiveTab.tsx`, `components/fulfillment/assign/AssignLabelHub.tsx`, `services/employees.service.ts`, `hooks/useEmployeeWizard.ts`, `utils/labels/ProductLabelGenerator.ts`, `utils/labels/InboundPutawayLabelGenerator.ts`, `utils/labels/ShelfTagGenerator.ts`, `migrations/20261019_employee_id_sequence_allocator.sql`
- **Database**: Added private `public.employee_id_sequences` and authorized `reserve_next_employee_code(text)` RPC. Applied to production; staging remains unchanged.

### WMS Worker Sovereign Landing Page (2026-10-19)
- All WMS workers and operators now land directly on their primary working tab upon opening Fulfillment (Pickers -> Pick, Packers -> Pack, Drivers -> Driver, Forklift Operators -> Putaway, Receivers & QC -> Receive, Stock Clerks & Inventory Specialists -> Count, Replenishment Planners -> Replenish, Returns Clerks -> Returns, Dispatchers -> Assign, Warehouse Managers -> Docks) instead of defaulting to Receive.
- Synced the active operational tab with URL search parameters (`/wms-ops?tab=...`), preserving active state across reloads.
- Mobile segmented controls dynamically elevate the worker's main working tab into the primary 1-tap quick buttons, eliminating unnecessary menu navigation on mobile scanners.
- **Files**: `utils/fulfillmentTabPermissions.ts`, `pages/Fulfillment.tsx`, `components/fulfillment/FulfillmentContent.tsx`, `components/fulfillment/TabSelectors.tsx`, `tests/utils/fulfillmentTabPermissions.test.ts`
- **Database**: None

### Floor-Friendly Picking Scan Flow (2026-10-19)
- Scanner content now fits the handheld viewport without an internal vertical scroll; duplicate picked history and redundant quantity confirmation are removed. Product scans require an exact current-line SKU or barcode, and location scans require a valid app label code for the assigned bay. The app's location QR payload and official location URL remain accepted.
- **Files**: `components/fulfillment/pick/PickScanner.tsx`, `components/fulfillment/pick/steps/Step2PickCollect.tsx`, `components/fulfillment/pick/components/PickScannerHeader.tsx`, `components/fulfillment/pick/components/PickScannerInstructionPanel.tsx`, `components/fulfillment/pick/components/PickScannerForm.tsx`, `components/fulfillment/pick/components/PickScannerSubmitButton.tsx`, `components/fulfillment/pick/components/PickScannerSummary.tsx`, `utils/locationEncoder.ts`, `utils/pickScanValidation.ts`, `tests/utils/pickScanValidation.test.ts`
- **Database**: None

### Guided Pick Scanning (2026-10-19)
- The primary pick action now opens the scanner directly. The scanner keeps the current step and item progress visible, anchors scan controls for mobile use, and carries validated barcode scans through to the matching pick line. The alternate entry point is labeled as a guided scanner.
- **Files**: `components/fulfillment/pick/PickJobModal.tsx`, `components/fulfillment/pick/PickScanner.tsx`, `components/fulfillment/pick/steps/Step2PickCollect.tsx`, `components/fulfillment/pick/components/PickScannerHeader.tsx`, `components/fulfillment/pick/components/PickScannerForm.tsx`, `components/fulfillment/pick/components/PickScannerSubmitButton.tsx`
- **Root Cause**: The primary action stopped at a pick list, the scanner showed an incorrect step label, mobile controls scrolled out of view, and validated barcodes were passed to the parent in a format its lookup did not consistently accept.

### Fulfillment Role-Specific Tab Permissions (2026-10-19)
- Floor workers can access the shared Receive, Putaway, Pick, and Pack operations; only drivers receive the Driver tab. Inventory Specialists can prepare transfer drafts, while warehouse managers and explicitly authorized higher leadership roles approve them. Other specialist tabs remain limited to their authorized roles. WMS roles missing the Fulfillment sidebar or explicit route permission were added, and all route roles have a non-empty role-appropriate tab set. Fleet maintenance also gets read-only inventory access needed for its WMS duties. Fulfillment content checks the selected tab and returns to an allowed tab if the role changes.
- **Files**: `utils/fulfillmentTabPermissions.ts`, `components/fulfillment/FulfillmentContent.tsx`, `components/Sidebar.tsx`, `utils/permissions.ts`, `services/permissions.matrix.ts`
- **Root Cause**: Floor worker roles were spread across tabs without distinction by responsibility; some WMS titles lacked navigation or explicit route access; tab bodies rendered from selected state without an access check.

### Server-Verified POS Sales (2026-10-19)
- POS sales now use one trusted database transaction that recalculates line prices, tax, discounts, and cash change from database records. Authenticated browser inserts into `sales` and `sale_items` are denied, and financial sale fields cannot be edited after creation.
- **Files**: `services/sales.service.ts`, `contexts/hooks/useSaleActions.ts`, `hooks/usePosSync.ts`, `components/pos/hooks/usePOSCheckoutActions.ts`, `migrations/20261019_secure_pos_sale_authority.sql`
- **Database**: Applied to staging (`utykzifrblpyxlvlknsm`) and production (`zdgzpxvorwinugjufkvb`)
- **Root Cause**: The browser wrote sale totals and item prices directly, so a modified client could tamper with persisted transaction values.

### Fulfillment Auth-Ready Data Loading (2026-10-18)
- Fulfillment table reads and realtime subscriptions wait for a signed-in employee profile. Logout clears cached fulfillment items so the client does not issue anonymous requests or retain the prior user's view.
- **Files**: `components/fulfillment/FulfillmentDataProvider.tsx`
- **Root Cause**: The provider mounted globally and began loading after site selection, before Supabase Auth session restoration had populated the user profile.

### Notification Cards - Clearer Issue Guidance and Responsive Presentation (2026-10-18)
- Error notifications now recognize common account, permission, barcode, duplicate SKU, inventory, pricing, validation, missing-record, connection, and data-service signals. Guidance avoids claiming that unsaved work will sync or assuming a specific approval path.
- Notifications expose optional technical details on demand, use clearer status hierarchy, fit mobile safe areas, and honor reduced-motion preferences. Auto-dismiss pauses while the page is hidden.
- **Files**: `components/notifications/NotificationCard.tsx`, `components/notifications/NotificationContainer.tsx`
- **Root Cause**: Generic string heuristics offered unverified recovery promises, while optional diagnostic details were not visible and mobile placement/motion ignored device preferences.

### Mobile User Menu Refresh (2026-10-18)
- Expands the mobile account panel to a safe-area-aware, scrollable card with a clearer identity header, visible close control, larger touch targets, and more readable performance and job summaries. Desktop placement remains a compact anchored menu.
- **Files**: `components/topbar/UserMenu.tsx`
- **Database**: None

### Accurate Session Warning Messages (2026-10-18)
- MFA requirements now show a verification warning instead of a false expiry message. Short-lived access tokens no longer trigger a misleading countdown because Supabase refreshes them automatically; only the app's inactivity sign-out warns users to save work.
- **Files**: `hooks/useSessionManager.ts`, `contexts/CentralStore.tsx`
- **Database**: None

### Mobile Web Deployment Recovery (2026-10-18)
- Prevents a stale service-worker or mobile browser asset cache from causing repeat reloads after a deployment. A chunk failure now clears only SIIFMART Workbox caches and retries once; HTML navigations no longer use an unversioned runtime cache.
- **Files**: `index.tsx`, `vite.config.ts`
- **Database**: None

### Mobile-Friendly Staff Profile (2026-10-18)
- Profile sections use a swipeable mobile tab strip, touch-sized controls, and a persistent mobile photo action. The self-profile page and overview use responsive spacing and semantic theme tokens.
- **Files**: `pages/Profile.tsx`, `components/StaffProfileView.tsx`, `components/staff-profile/StaffProfileHeader.tsx`, `components/staff-profile/StaffProfileNavigation.tsx`, `components/staff-profile/tabs/OverviewTab.tsx`, `hooks/useStaffProfile.ts`
- **Database**: None

### Fulfillment Mobile Active-Job Focus (2026-10-18)
- Receive, putaway, pick, and pack queues use denser mobile spacing and place in-progress work first. Receive keeps the active purchase order expanded while collapsing other order details; secondary mobile sort/count controls are reduced or hidden.
- **Files**: `components/fulfillment/FulfillmentContent.tsx`, `components/fulfillment/TabSelectors.tsx`, `components/fulfillment/ReceiveTab.tsx`, `components/fulfillment/receive/ReceiveList.tsx`, `components/fulfillment/PutawayTab.tsx`, `components/fulfillment/putaway/PutawayList.tsx`, `components/fulfillment/PickTab.tsx`, `components/fulfillment/pick/PickList.tsx`, `components/fulfillment/PickHeader.tsx`, `components/fulfillment/PackTab.tsx`, `components/fulfillment/pack/PackList.tsx`, `components/fulfillment/pack/PackHeader.tsx`, `components/fulfillment/putaway/PutawayHeader.tsx`
- **Database**: None

### HR Payroll Attestation & Termination Submission Hardening (2026-10-18)
- Regional payroll attestation now derives signer identity and role from the authenticated employee record and enforces country/site-region scope in Postgres; termination requests no longer persist sensitive backups in browser storage and failed submissions surface as errors.
- **Files**: `services/payroll-runs.service.ts`, `services/terminations.service.ts`, `types/payroll-run.ts`, `pages/Employees.tsx`, `migrations/20261018_secure_regional_payroll_attestation.sql`
- **Root Cause**: Client-supplied signer fields and local fallback behavior could create false or unverifiable HR records.
- **Database**: `public.payroll_runs` regional attestation columns and `attest_payroll_regional_hr` RPC (migration not yet applied).

### Three-Level Facility Hierarchy & 55-Role Canonical Workforce Filtering
- **Status**: ✅ IMPLEMENTED (2026-10-18)
- Establishes 3 facility levels (`HQ`, `Regional Administration`, `Operation Sites` -> `Store`, `Warehouse`, `Distribution Center`, `Online Store`) and all 55 canonical `SYSTEM_ROLES` per country (`ET` and `KE`) across Staging Database, Quick Login panels, and Employee Directory filtering.
- **Files Modified**:
  - `migrations/20261018_staging_three_tier_facilities_and_roles.sql`
  - `components/login/stagingAccounts.json`
  - `components/login/CountryQuickLoginPanel.tsx`
  - `utils/roleSegregation.ts`
  - `services/employees.service.ts`
  - `hooks/useEmployeeData.ts`
  - `components/employees/DirectoryHeader.tsx`
  - `components/employees/WorkforceScopeBadge.tsx`
  - `tests/utils/stagingAccounts.test.ts`
- **Database**: `public.sites`, `public.employees`, `public.users`, `auth.users`, `auth.identities`

### Fulfillment Module - Completed By Display
- **Status**: ✅ FIXED (2026-02-05)
- Shows who completed each job and when in all history tabs
- **Files Modified**:
  - `services/supabase.service.ts` - Added field mappings in `wmsJobsService.update`
  - `contexts/DataContext.tsx` - Fixed to use camelCase field names
  - `pages/Fulfillment.tsx` - UI displays completedBy and completedAt
  - `types.ts` - WMSJob interface includes completedBy/completedAt
- **Database**: `wms_jobs.completed_by`, `wms_jobs.completed_at`
- **Root Cause Fixed**: DataContext was passing snake_case fields (`completed_by`) to update function, but service only maps camelCase (`completedBy`)

### WMS Jobs Service
- **Field Mappings** (2026-02-05)
  - Maps snake_case DB fields to camelCase frontend fields
  - Includes: completedBy, completedAt, assignedTo, orderRef, etc.
  - File: `services/supabase.service.ts` (wmsJobsService)

### WMS RLS and Audit Actor Hardening (2026-10-19)
- Removed the recursive policy dependency between WMS jobs and job assignments using a private helper scoped to the authenticated actor; site and country checks remain on WMS job rows.
- Bound client-created system log actors to the verified auth user/employee ID before the insert policy runs.
- **Root Cause Fixed**: The WMS SELECT/UPDATE policies queried `job_assignments`, whose policies queried `wms_jobs`; the audit service supplied a display name where the RLS policy required an actor ID.
- **Database**: `wms_jobs`, `job_assignments`, `system_logs`; migration applied to SIIFMART Staging.
- **Regression Verification**: Authenticated WMS and assignment reads, update policy planning, and a rollback-only system log insert completed without recursion or RLS rejection.

### Fulfilment Transfer Units (2026-10-18)
- Standardized transfer, bulk distribution, Smart Replenish, picking, and receiving quantity labels and precision against product unit and package attributes.
- Kept measured quantities alongside stock-unit quantities through the WMS job line-item JSON and mapper; measured receipts convert back to inventory stock units before applying stock.
- **Root Cause Fixed**: Transfer allocation screens hardcoded generic integer units, inconsistent package-size conversion mixed stock counts with physical measures, and pick completion used package quantity as the measured-pick denominator.
- **Files Modified**: `components/fulfillment/transfer/`, `components/fulfillment/useJobCompletion.ts`, `services/wms-jobs.mapper.ts`, `types/product.ts`, `types/wms.ts`
- **Database**: No schema change; transfer unit details remain in `wms_jobs.line_items` JSON.
- **Regression Coverage**: `tests/utils/transferQuantity.test.ts`

### Sites Service - Allowlist Update Pattern
- **Status**: ✅ FIXED (2026-07-09)
- Rewrote `sitesService.update()` from dangerous `{ ...object }` spread + denylist to explicit allowlist
- **Root Cause Fixed**: camelCase-only fields (`bayCount`, `siteNumber`, `barcodePrefix`) were being sent to Supabase as unrecognized column names → 400 Bad Request
- **Also Fixed**: `zoneCount`, `aisleCount`, `binCount` were silently dropped (deleted but never mapped to snake_case)
- **Files Modified**: `services/sites.service.ts`
- **Pattern**: All service update methods should follow this allowlist pattern (see RULES.md "Service Field Mapping")

### Gamification System - Premium Aesthetic Redesign
- **Status**: Historical (2026-07-09); verify current implementation
- Earlier redesign note. Its palette is superseded by the current semantic-token and accessibility standards in `docs/APPLE_DESIGN_GUIDE.md`.
- **Files Modified**: `WarehouseTab.tsx`, `POSTab.tsx`, `POSRoleDistributionList.tsx`, `POSPointRulesList.tsx`

---

## How to Use This Registry

### For AI Assistants:
1. **Before modifying a feature**: Check this registry for history, then verify current code and policy
2. **After implementing a feature**: Add an entry with date, description, and affected files
3. **Before reverting/restoring code**: Check if the file contains registered features
4. **After fixing a significant bug**: Document the root cause and fix pattern

### Entry Format:
```markdown
- **Feature Name** (YYYY-MM-DD)
  - Description of what it does
  - Files: list of affected files
  - Database: any DB columns/tables involved
  - Root Cause: (for bug fixes) what caused the issue
```
