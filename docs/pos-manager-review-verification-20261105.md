# POS Manager Review — 5 November 2026

Implemented a lazy POS Command review workspace for sales/payment exceptions, shift handovers, cash drops, return requests, incoming transfers and recorded override/drawer events. Lists and note history use 25-row pages, scoped by authenticated employee, site and country. History is opt-in. Pending sales identify payment exceptions; this does not perform bank settlement reconciliation or detect every missing payment reference.

## Receiving and decisions

Receiving review covers incoming site transfers. Evidence includes recorded receipt/discrepancy status and links to the existing receiving workflow. Expected quantities, manifests and receiver counts are omitted to preserve blind receiving. This workspace does not review purchase-order line receipts.

Notes are observations and cannot approve refunds, accept stock, resolve discrepancies or reconcile cash. Existing native controls retain their server authorization. Detail responses report whether the inspected native controls exist; unavailable actions have explicit translated feedback. Sales navigation also respects the existing sales permission.

Independent notes reject self-review, stale source fingerprints and overwrites; identical retries return the saved note. Notes are stored in a private table with no client table privileges and logged as observational events. Cash decisions reject missing or mismatched confirmations, block immediate duplicate submissions and preserve server success if cache refresh fails.

## Database rollout

All three migrations were applied to staging `utykzifrblpyxlvlknsm` and production `zdgzpxvorwinugjufkvb`:

- `migrations/20261105_pos_manager_review.sql`: private notes, scoped queue/detail and authenticated observation RPCs.
- `migrations/20261105_pos_review_control_availability.sql`: native-control availability in evidence responses.
- `migrations/20261105_pos_review_scoped_locks.sql`: source locks constrained by site/country and transfer-origin country.

Live inspection confirmed the review schema and receiving verification function in both projects. Production lacks `counter_review_queue`, `review_counter_shift`, `approve_counter_drop` and `decide_fulfillment_return`. Those pre-existing workflow foundations were not deployed by these migrations. Their absence remains a production deployment gap; this review cannot replace them. Broader fulfillment deployment drift is recorded in `docs/manager-review-audit-20261105.md`.

## Verification

- Focused service/component tests: 17 passed, including lazy loading, receiving navigation, unavailable controls, translation coverage, result identity and incomplete cash confirmations.
- Staging rollback SQL `tests/sql/pos_manager_review.sql` passed: bounded queues, independent/idempotent notes, stale evidence, overwrite denial, cashier/cross-country denial, preserved sale/transfer status and blind transfer evidence. All fixtures rolled back.
- TypeScript and file-size checks passed; the complete Vitest suite passed: 420 files, 2,713 tests. Whitespace checks passed. Browser interaction was not manually verified.
