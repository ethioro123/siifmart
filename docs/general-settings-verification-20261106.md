# General & Slogan verification — 6 November 2026

This records the first Settings tab's implemented fixes and observed checks.

## Result

- Branding saves only the slogan. Legal saves only the visible legal/contact fields. Localization saves only currency, timezone, date format and language; it preserves tax rates, tax IDs, support contacts and tender/compliance configuration.
- An authenticated, active Group CEO saves through a trusted country/section RPC. The server locks the current configuration, merges the selected partition, writes its audit in the same transaction and records an idempotent request receipt. Repeated requests do not reapply older values or duplicate the audit.
- A server trigger protects the corporate/legal/localization fields against direct non-CEO updates as well as API calls. The caller cannot supply audit identity. Other settings permissions remain governed by the existing policies.
- The client applies only the confirmed section to its cache, preserving other countries and sections when responses arrive out of order. Ordinary settings updates merge a confirmed partial patch instead of reconstructing the whole configuration from defaults.
- Background refreshes preserve dirty slogan, legal and localization drafts. Failed saves retain edits. Blank optional slogans remain blank. A country change opens that country's form rather than carrying another country's draft into it.
- Absolute dates in the shared formatter use the saved date order and source-country timezone. Relative date labels retain their existing behavior. The preview uses the selected timezone too.
- A loaded market language default reaches users without a personal override. Explicitly chosen personal language preferences are retained. Saves produce one success notification; failed/unconfirmed writes do not show success.

## Saved migrations and application

Both files were applied to **staging `utykzifrblpyxlvlknsm`** and **production `zdgzpxvorwinugjufkvb`**:

- [20261106_atomic_general_settings.sql](../migrations/20261106_atomic_general_settings.sql)
- [20261106_general_settings_partition_validation.sql](../migrations/20261106_general_settings_partition_validation.sql)

The second migration validates existing partition shapes and safely handles empty/null country configurations.

## Verification

- Focused General settings, draft, service, schema, localization and date-format tests: **8 files, 30 tests passed**.
- `npx tsc --noEmit`: passed.
- `npm run lint:size`: passed; checked files are within 500 lines.
- `git diff --check`: passed.
- [Rollback-only database checks](../tests/sql/general_settings_integrity.sql) passed on staging and production. They cover successful scoped saves, audit presence, retry deduplication, mismatched retries, hidden-field rejection, preservation of unrelated settings, blank slogans, localization preserving legal/tax data, and closed evidence grants. The staging manager fixture also verifies rejection of API and direct corporate/legal updates. Inserted data and changes were rolled back.
- Client regressions cover retaining multiple drafts during refresh/save, exact visible-field payloads, unsuccessful saves retaining edits, confirmation-only cache updates, retry identity, late responses preserving other countries/sections, loaded language defaults and explicit personal overrides.
- The last full-suite run observed **2,772 passing tests and 5 failures** in `PricingGroupedCatalog.test.tsx` and `regions.service.test.ts`, during concurrent pricing/region changes. These failures were outside the General settings checks; this report does not claim a clean full-suite result.
- Supabase security/performance advisors were reviewed in both environments. The new private receipt table has revoked client access and default-deny RLS; its [no-policy informational notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) is intentional. Its new actor index may be reported unused until normal workload uses it. Unrelated project advisories were not resolved by this tab's work.
- No interactive browser/device walkthrough was performed in this pass.
