# Feature Registry
# This file records selected implementation history; it is not a source of current policy.
# Update it for new features or significant fixes, and verify the current code before relying on older notes.

## Active Features

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
