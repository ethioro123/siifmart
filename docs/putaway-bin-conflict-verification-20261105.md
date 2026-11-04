# Putaway bin conflict correction — 5 November 2026

## Observed causes

The products unique key is SKU + site + location. The placement RPC originally looked up the destination using additional batch/expiry predicates. A different lot at that unique key was skipped, and moving/inserting the incoming stock raised unique_product_sku_site_location. This exact unique violation was reproduced with rollback-only staging fixtures before the fix.

A staging product trigger also assigned inferred category zones and rewrote physical/receiving locations. Fixture inspection showed requested Zone Z/On Order locations becoming Zone D. This could also redirect an inserted placement into an occupied unique key. Production did not have that trigger registration at inspection.

## Corrections

- Lookup and lock the destination by its actual unique key before evaluating lot compatibility.
- Reuse an empty row and refresh its batch/expiry; consolidate occupied rows only for matching batch and expiry.
- Reject incompatible occupied lots with a stable machine-readable reason and translated worker guidance in en/am/or.
- Preserve scanned/receiving locations. The existing trigger can map zone metadata within the same facility but cannot choose a different physical location. Trigger registrations were left unchanged.
- Verify the returned destination site/location before confirming placement.
- Retain authorization, country/site scope, job/quantity validation, advisory/row locks, duplicate-line checks, unique key, stock movement audit and existing storage guards.

## Deployment

Both files were saved before execution and applied to staging utykzifrblpyxlvlknsm and production zdgzpxvorwinugjufkvb:

- migrations/20261105_preserve_scanned_product_locations.sql
- migrations/20261105_putaway_destination_lot_conflict.sql

No existing inventory rows were relocated or merged by these migrations. No keys/constraints were removed. Function fingerprints match across environments; both migration names are recorded in each history. Production verification was metadata-only.

## Verification

- The baseline duplicate was reproduced, then the corrected rollback-only regression passed: empty-row reuse, matching-lot accumulation, differing batch/expiry rejection, unchanged rejected jobs/stock, audit counts, retry protection, placeholder reuse and separate-bin insertion.
- Scanned-location/receiving-placeholder preservation regressions passed.
- Existing atomic-placement and capacity/lock/storage/audit SQL suites passed again in staging.
- All fixture transactions rolled back; zero ETLOTTEST/ETSCAN test product rows remained.
- 41 targeted Vitest checks passed. TypeScript, file-size and whitespace checks passed.
- Unrelated concurrent mobile scanner work was preserved.
