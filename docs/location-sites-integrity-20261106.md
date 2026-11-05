# Location & Sites integrity — 6 November 2026

## Implemented

- Site action hooks propagate failed create, edit and delete operations, preventing the caller from announcing successful saves after rejection.
- The facility card opens a closure-request form. Requests use the existing lifecycle service and independent review; permanent deletion and direct closure remain prohibited. Closed facilities cannot be reopened through the ordinary status selector.
- `save_site_configuration` saves site fields and replenishment links in one transaction under authenticated RLS. It validates source country/type/status, logistics-zone country, immutable country/code on existing sites, and writable columns. Invalid source changes roll back the site edit and preserve source links.
- New facilities use a database sequence for unique site numbers; warehouses receive numeric four-digit barcode prefixes. Existing barcode prefixes remain unchanged. The prefix constraint uses an explicit digit expression and uniqueness index.
- Clearing the logistics-zone selector persists SQL NULL.
- Site reads no longer attempt to create headquarters for every supported country. Existing server-side provisioning for new-country operations remains available.
- Site settings save canonical currency codes.
- Location export reads saved, non-archived stock-location records in bounded pages; it deduplicates human/barcode identities, skips named non-bay areas and exports only known bays. It does not invent an unused physical layout. CSV fields are quoted, and empty or invalid exports report an error.

## Database rollout

`migrations/20261106_location_settings_integrity.sql` was applied to:

- Staging: `utykzifrblpyxlvlknsm`
- Production: `zdgzpxvorwinugjufkvb`

The migration provisions standard A–J zones only for active warehouses/DCs with no zone records. Existing configured zones are preserved. Production had 11 such facilities before this repair; both environments now have zero active warehouses/DCs without zones. This creates configuration records, not evidence that a physical warehouse has been surveyed or stock placed there.

A staging migration-history timestamp collision occurred on the first call. The installed function was inspected and the idempotent migration was reapplied successfully. Production confirmation expired once; the following application succeeded.

## Verification

- 30 targeted tests across six files passed, covering save-error propagation, atomic-save service requests, logistics-zone clearing, closure form success/failure, actual-location CSV generation, logistics-zone service and site-code generation.
- `npx tsc --noEmit` passed.
- `tests/sql/location_settings_integrity.sql` passed on staging and production using authenticated CEO identity. It verified warehouse creation, valid numeric prefix, assigning and clearing a logistics zone, cross-country source rejection, rollback of a failed site edit, and preservation of the original replenishment link. All test facilities and links were rolled back; sequence gaps are expected.
- Security advisors were retrieved for both environments. Existing advisories were not treated as resolved by this change.
- Browser interaction and frontend deployment were not performed in this change. Local source updates are available through the development server; hosted frontend rollout is separate.
