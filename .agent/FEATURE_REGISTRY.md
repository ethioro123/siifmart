# Feature Registry
# This file records selected implementation history; it is not a source of current policy.
# Update it for new features or significant fixes, and verify the current code before relying on older notes.

## Active Features

### Mobile User Menu Refresh (2026-10-18)
- Expands the mobile account panel to a safe-area-aware, scrollable card with a clearer identity header, visible close control, larger touch targets, and more readable performance and job summaries. Desktop placement remains a compact anchored menu.
- **Files**: `components/topbar/UserMenu.tsx`
- **Database**: None

### Accurate Session Warning Messages (2026-10-18)
- MFA requirements now show a verification warning instead of a false zero-minute expiry message. Genuine token expiry warnings use a positive, rounded-up minute count and are suppressed after token expiry.
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
