# Same receiving-day putaway — 5 November 2026

User policy: the same product received on the same local calendar date should prefer the existing bin even when batch numbers differ, unless the bin is full or storage/availability restrictions prevent placement.

## Implementation

- Receiving dates are derived from the immutable receipt transaction linked to the PUTAWAY job, using the configured country timezone. Batch-name dates, product creation dates and placement dates are not treated as receiving evidence. Missing or ambiguous receipt evidence produces no receiving-day consolidation permission.
- Eligible existing product bins outrank empty category suggestions. Workers can skip a full bin for the current job; configured zone-capacity, lock, category and storage restrictions remain.
- The old SKU/site/bin unique key was replaced with physical-bin lot identity uniqueness including batch, expiry and receiving day. Non-storage placeholders retain their previous SKU/site/location uniqueness. No stock was relocated or merged by migration.
- Placement creates or reuses the exact lot/day record. Different lots in the same bin retain separate quantities, batch numbers, expiries, product IDs and movement audits. Occupants with incompatible SKU/day or unavailable/expired stock prevent placement.
- Existing receiving dates were populated only where stock-movement, putaway-job and receipt linkage prove a single receiving date. Other dates remain unknown. Client and supervisor changes to receiving-day metadata are denied.
- The public day lookup uses an invoker wrapper around private authenticated facility/assignment authorization. Raw receipt-date helpers are not executable by client roles.
- Inventory remains one summary per product/facility. Location breakdowns continue to expose individual lot records. Picking's existing trusted receipt verification uses exact product ID, batch, expiry and bin, so co-location does not collapse those identities.
- New routing explanations and the revised incompatible-lot message are synchronized in en/am/or.

## Applied migrations

All four migrations were saved before execution and applied to staging `utykzifrblpyxlvlknsm` and production `zdgzpxvorwinugjufkvb`:

1. `migrations/20261105_same_day_putaway_lots.sql`
2. `migrations/20261105_place_same_day_putaway_lots.sql`
3. `migrations/20261105_shared_bin_lot_placement_guards.sql`
4. `migrations/20261105_private_receiving_day_authorization.sql`

Production still lacks the pre-existing `private.fulfillment_receipts` foundation. The day lookup safely returns unknown there; different-batch same-day consolidation requires that receipt foundation and actual evidence. No dates are invented to compensate for production migration drift. Production verification was metadata/read-only, not a business-stock mutation.

The reported Bullo Dishes lots have proven receiving dates 3 November and 4 November 2026 respectively. Their batch-name dates are not reliable receiving dates. Existing physical bins remain unchanged.

## Verification

- Staging rollback-only `tests/database/same-day-putaway-lots.sql` passed: two different batches and expiries share one bin as separate records, midnight uses local dates, next-day batches are rejected, stock audits remain per batch, floor/supervisor date tampering denied, foreign-country lookup denied, and anonymous lookup denied.
- Existing atomic-placement, destination-lot conflict, storage/capacity and PO-completion rollback checks passed. The PO-completion test needed its audit-corruption setup updated to current readable movement references; it now asserts an actual movement was altered before testing rejection. All fixtures rolled back.
- Full Vitest suite passed: 428 files, 2,742 tests. TypeScript, file-size and whitespace checks passed. Browser interaction was not manually exercised.
- Security advisors ran for both projects. The new public definer lookup was replaced by the private authorized/invoker-wrapper structure; the final staging advisor had no finding referencing the new day lookup/guard.

## FEFO follow-up finding

`utils/inventory.ts` contains `selectBatchesFEFO`, but repository search found only test callers. This change does not claim to enforce FEFO allocation across active outbound workflows. That requires trusted allocation of the earliest eligible unexpired lot, exact lot verification and deduction, handling of minimum remaining shelf life, and independent audited overrides. Receipt-day storage consolidation and expiry-based outbound selection are separate decisions. Different expiries remain separately traceable at a shared bin.
